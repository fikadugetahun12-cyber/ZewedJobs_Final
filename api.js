// api.js - API Client and HTTP Request Handler
class ApiClient {
    constructor() {
        this.baseURL = process.env.API_URL || 'https://api.zewedjobs.com';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.token = null;
        this.init();
    }

    init() {
        // Load token from storage
        this.token = this.getToken();
        this.setupInterceptors();
    }

    // Token management
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    getToken() {
        return localStorage.getItem('auth_token');
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
        delete this.defaultHeaders['Authorization'];
    }

    // Request methods
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            // Handle HTTP errors
            if (!response.ok) {
                return await this.handleError(response);
            }

            // Handle different response types
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else if (contentType && contentType.includes('text/')) {
                return await response.text();
            } else {
                return await response.blob();
            }
        } catch (error) {
            return this.handleNetworkError(error);
        }
    }

    // REST methods
    async get(endpoint, params = {}, options = {}) {
        const queryString = Object.keys(params).length 
            ? `?${new URLSearchParams(params).toString()}`
            : '';
        
        return this.request(`${endpoint}${queryString}`, {
            ...options,
            method: 'GET'
        });
    }

    async post(endpoint, data = {}, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data = {}, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }

    // File upload
    async upload(endpoint, file, options = {}) {
        const formData = new FormData();
        formData.append('file', file);

        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: formData,
            headers: {
                ...options.headers,
                'Content-Type': undefined // Let browser set boundary
            }
        });
    }

    // Multiple file upload
    async uploadMultiple(endpoint, files, fieldName = 'files', options = {}) {
        const formData = new FormData();
        
        if (Array.isArray(files)) {
            files.forEach((file, index) => {
                formData.append(`${fieldName}[${index}]`, file);
            });
        } else {
            formData.append(fieldName, files);
        }

        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: formData,
            headers: {
                ...options.headers,
                'Content-Type': undefined
            }
        });
    }

    // Error handling
    async handleError(response) {
        let errorData;
        
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                message: `HTTP ${response.status}: ${response.statusText}`,
                status: response.status
            };
        }

        const error = new Error(errorData.message || 'API request failed');
        error.status = response.status;
        error.data = errorData;
        
        // Handle specific status codes
        switch (response.status) {
            case 401:
                this.handleUnauthorized();
                break;
            case 403:
                this.handleForbidden();
                break;
            case 404:
                this.handleNotFound();
                break;
            case 429:
                this.handleRateLimit();
                break;
            case 500:
                this.handleServerError();
                break;
        }

        throw error;
    }

    handleNetworkError(error) {
        console.error('Network error:', error);
        
        // Check if offline
        if (!navigator.onLine) {
            throw new Error('You are offline. Please check your internet connection.');
        }
        
        // Check if server is down
        throw new Error('Unable to connect to server. Please try again later.');
    }

    // Status code handlers
    handleUnauthorized() {
        console.warn('Unauthorized access - clearing token');
        this.clearToken();
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }

    handleForbidden() {
        console.warn('Access forbidden');
        // Show access denied message
        this.showNotification('Access denied. You do not have permission to perform this action.', 'error');
    }

    handleNotFound() {
        console.warn('Resource not found');
        // Could redirect to 404 page
        if (!window.location.pathname.includes('/404')) {
            window.location.href = '/404';
        }
    }

    handleRateLimit() {
        console.warn('Rate limit exceeded');
        this.showNotification('Too many requests. Please wait a moment before trying again.', 'warning');
    }

    handleServerError() {
        console.error('Server error');
        this.showNotification('Server error. Please try again later.', 'error');
    }

    // Interceptors
    setupInterceptors() {
        // Request interceptor
        this.requestInterceptor = (config) => {
            // Add timestamp for caching
            if (config.method === 'GET') {
                const timestamp = Date.now();
                const url = new URL(config.url, window.location.origin);
                url.searchParams.set('_t', timestamp);
                config.url = url.toString();
            }
            
            return config;
        };

        // Response interceptor
        this.responseInterceptor = (response) => {
            // Check for new token in response
            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                this.setToken(newToken);
            }
            
            return response;
        };
    }

    // Caching
    async getWithCache(endpoint, params = {}, options = {}) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        const cached = this.getFromCache(cacheKey);
        
        // Return cached data if available and not expired
        if (cached && !this.isCacheExpired(cached)) {
            return cached.data;
        }
        
        // Fetch fresh data
        const data = await this.get(endpoint, params, options);
        
        // Cache the response
        this.saveToCache(cacheKey, data, options.cacheTTL || 300); // 5 minutes default
        
        return data;
    }

    generateCacheKey(endpoint, params) {
        const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});
        
        return `${endpoint}:${JSON.stringify(sortedParams)}`;
    }

    getFromCache(key) {
        const cached = localStorage.getItem(`cache_${key}`);
        return cached ? JSON.parse(cached) : null;
    }

    saveToCache(key, data, ttlSeconds) {
        const cacheItem = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (ttlSeconds * 1000)
        };
        
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    }

    isCacheExpired(cacheItem) {
        return Date.now() > cacheItem.expiresAt;
    }

    clearCache(pattern = '') {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cache_') && key.includes(pattern)) {
                localStorage.removeItem(key);
            }
        });
    }

    // WebSocket connection
    createWebSocket(endpoint) {
        const wsUrl = this.baseURL.replace('http', 'ws') + endpoint;
        const ws = new WebSocket(wsUrl);
        
        // Add auth token if available
        ws.onopen = () => {
            if (this.token) {
                ws.send(JSON.stringify({ type: 'auth', token: this.token }));
            }
        };
        
        return ws;
    }

    // SSE (Server-Sent Events)
    createEventSource(endpoint) {
        const es = new EventSource(`${this.baseURL}${endpoint}`);
        
        es.onerror = (error) => {
            console.error('EventSource error:', error);
            es.close();
        };
        
        return es;
    }

    // Retry logic
    async retry(fn, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === retries - 1) throw error;
                await this.sleep(delay * Math.pow(2, i)); // Exponential backoff
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Batch requests
    async batch(requests) {
        const results = await Promise.allSettled(requests.map(req => 
            this.request(req.endpoint, req.options)
        ));
        
        return results.map((result, index) => ({
            request: requests[index],
            status: result.status,
            data: result.status === 'fulfilled' ? result.value : result.reason
        }));
    }

    // GraphQL client
    async graphql(query, variables = {}, options = {}) {
        return this.request('/graphql', {
            method: 'POST',
            body: JSON.stringify({ query, variables }),
            ...options
        });
    }

    // Webhook simulation
    async simulateWebhook(url, data, options = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': this.generateWebhookSignature(data),
                ...options.headers
            },
            ...options
        });
    }

    generateWebhookSignature(data) {
        // Generate HMAC signature for webhook
        const secret = process.env.WEBHOOK_SECRET || 'your-secret-key';
        const message = JSON.stringify(data);
        
        // This is a simplified example - use proper HMAC in production
        return btoa(`${secret}:${message}`).slice(0, 64);
    }

    // Analytics
    trackEvent(eventName, properties = {}) {
        return this.post('/analytics/events', {
            event: eventName,
            properties: {
                ...properties,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Rate limiting helper
    isRateLimited(endpoint) {
        const key = `rate_limit_${endpoint}`;
        const limit = localStorage.getItem(key);
        
        if (limit) {
            const { count, resetTime } = JSON.parse(limit);
            if (Date.now() < resetTime && count >= 10) { // 10 requests per window
                return true;
            }
        }
        
        return false;
    }

    updateRateLimit(endpoint) {
        const key = `rate_limit_${endpoint}`;
        const windowMs = 60000; // 1 minute
        const now = Date.now();
        
        let limit = localStorage.getItem(key);
        if (!limit) {
            limit = { count: 1, resetTime: now + windowMs };
        } else {
            limit = JSON.parse(limit);
            if (now > limit.resetTime) {
                limit = { count: 1, resetTime: now + windowMs };
            } else {
                limit.count += 1;
            }
        }
        
        localStorage.setItem(key, JSON.stringify(limit));
    }

    // Utility methods
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `api-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Form data conversion
    toFormData(obj) {
        const formData = new FormData();
        
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            
            if (Array.isArray(value)) {
                value.forEach(item => {
                    formData.append(`${key}[]`, item);
                });
            } else if (value instanceof File || value instanceof Blob) {
                formData.append(key, value);
            } else if (typeof value === 'object' && value !== null) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        });
        
        return formData;
    }

    // API health check
    async healthCheck() {
        try {
            const response = await this.get('/health', {}, { timeout: 5000 });
            return {
                status: 'healthy',
                response
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    // Get API usage stats
    getApiStats() {
        const stats = JSON.parse(localStorage.getItem('api_stats') || '{}');
        return {
            totalRequests: stats.totalRequests || 0,
            successfulRequests: stats.successfulRequests || 0,
            failedRequests: stats.failedRequests || 0,
            lastRequest: stats.lastRequest || null
        };
    }

    // Reset API stats
    resetApiStats() {
        localStorage.removeItem('api_stats');
    }
}

// Export singleton instance
const api = new ApiClient();
export default api;

// Export individual functions for direct use
export const {
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
    upload,
    uploadMultiple,
    graphql,
    trackEvent,
    healthCheck,
    getApiStats,
    clearCache
} = api;
