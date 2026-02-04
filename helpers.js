// helpers.js - General Purpose Helper Functions
class Helpers {
    // DOM manipulation helpers
    static $(selector, context = document) {
        return context.querySelector(selector);
    }

    static $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'html') {
                element.innerHTML = attributes[key];
            } else if (key === 'text') {
                element.textContent = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        // Append children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    static showElement(element, display = 'block') {
        if (element) {
            element.style.display = display;
        }
    }

    static hideElement(element) {
        if (element) {
            element.style.display = 'none';
        }
    }

    static toggleElement(element, display = 'block') {
        if (element) {
            element.style.display = element.style.display === 'none' ? display : 'none';
        }
    }

    // Event handling helpers
    static on(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }

    static once(element, event, handler) {
        const onceHandler = (e) => {
            handler(e);
            element.removeEventListener(event, onceHandler);
        };
        element.addEventListener(event, onceHandler);
    }

    static delegate(container, selector, event, handler) {
        container.addEventListener(event, (e) => {
            if (e.target.matches(selector)) {
                handler(e);
            }
        });
    }

    // String manipulation
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    static truncate(str, length, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }

    static slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    }

    static sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Number helpers
    static formatNumber(num, decimals = 2) {
        if (typeof num !== 'number') {
            num = parseFloat(num) || 0;
        }
        
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    static formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    static abbreviateNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num.toString();
    }

    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Date helpers
    static formatDate(date, format = 'medium') {
        const d = new Date(date);
        const formats = {
            short: d.toLocaleDateString(),
            medium: d.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            long: d.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            full: d.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })
        };
        
        return formats[format] || d.toLocaleDateString();
    }

    static formatTime(date, includeSeconds = false) {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: includeSeconds ? '2-digit' : undefined
        });
    }

    static timeAgo(date) {
        const now = new Date();
        const then = new Date(date);
        const seconds = Math.floor((now - then) / 1000);
        
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 }
        ];
        
        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
            }
        }
        
        return 'just now';
    }

    static isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        return (
            checkDate.getDate() === today.getDate() &&
            checkDate.getMonth() === today.getMonth() &&
            checkDate.getFullYear() === today.getFullYear()
        );
    }

    // Array helpers
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    static unique(array) {
        return [...new Set(array)];
    }

    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    }

    static sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const aValue = typeof key === 'function' ? key(a) : a[key];
            const bValue = typeof key === 'function' ? key(b) : b[key];
            
            if (aValue < bValue) return order === 'asc' ? -1 : 1;
            if (aValue > bValue) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Object helpers
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static merge(...objects) {
        return objects.reduce((result, obj) => {
            if (!obj) return result;
            
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    result[key] = this.merge(result[key] || {}, obj[key]);
                } else {
                    result[key] = obj[key];
                }
            });
            
            return result;
        }, {});
    }

    static omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }

    static pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    }

    // Validation helpers
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static isValidPhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    static isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    // Storage helpers
    static storage = {
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        },
        
        remove: (key) => {
            localStorage.removeItem(key);
        },
        
        clear: () => {
            localStorage.clear();
        }
    };

    // Cookie helpers
    static cookies = {
        get: (name) => {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
                if (cookieName === name) {
                    return decodeURIComponent(cookieValue);
                }
            }
            return null;
        },
        
        set: (name, value, days = 365) => {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
        },
        
        remove: (name) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
    };

    // URL helpers
    static getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setQueryParam(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.pushState({}, '', url);
    }

    static removeQueryParam(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.pushState({}, '', url);
    }

    static getHashParams() {
        const hash = window.location.hash.substring(1);
        const params = {};
        
        hash.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    }

    // Device detection
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isTablet() {
        return /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
    }

    static isDesktop() {
        return !this.isMobile() && !this.isTablet();
    }

    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Browser detection
    static isChrome() {
        return /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
    }

    static isFirefox() {
        return /Firefox/.test(navigator.userAgent);
    }

    static isSafari() {
        return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    }

    static isEdge() {
        return /Edg/.test(navigator.userAgent);
    }

    // Performance helpers
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // File helpers
    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    static downloadFile(content, fileName, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
    }

    // Color helpers
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return "#" + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    static darkenColor(color, percent) {
        return this.lightenColor(color, -percent);
    }

    // Animation helpers
    static animate(element, keyframes, options = {}) {
        return element.animate(keyframes, {
            duration: 300,
            easing: 'ease-in-out',
            fill: 'both',
            ...options
        });
    }

    static fadeIn(element, duration = 300) {
        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    static fadeOut(element, duration = 300) {
        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    }

    static slideDown(element, duration = 300) {
        const height = element.scrollHeight;
        return this.animate(element, [
            { height: '0px', opacity: 0 },
            { height: `${height}px`, opacity: 1 }
        ], { duration });
    }

    static slideUp(element, duration = 300) {
        const height = element.scrollHeight;
        return this.animate(element, [
            { height: `${height}px`, opacity: 1 },
            { height: '0px', opacity: 0 }
        ], { duration });
    }

    // Modal helpers
    static showModal(content, options = {}) {
        const modal = this.createElement('div', {
            className: 'modal-overlay'
        });
        
        const modalContent = this.createElement('div', {
            className: 'modal-content',
            html: content
        });
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add close button
        if (options.closeButton !== false) {
            const closeBtn = this.createElement('button', {
                className: 'modal-close',
                html: '&times;'
            });
            closeBtn.addEventListener('click', () => this.hideModal(modal));
            modalContent.appendChild(closeBtn);
        }
        
        // Close on overlay click
        if (options.closeOnOverlayClick !== false) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        }
        
        // Escape key to close
        if (options.closeOnEsc !== false) {
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    this.hideModal(modal);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        }
        
        return modal;
    }

    static hideModal(modal) {
        if (modal) {
            modal.classList.add('fade-out');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    // Toast notification
    static toast(message, type = 'info', duration = 3000) {
        const toast = this.createElement('div', {
            className: `toast toast-${type}`,
            text: message
        });
        
        document.body.appendChild(toast);
        
        // Show animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
        
        return toast;
    }

    // Loading indicator
    static showLoading(text = 'Loading...', container = document.body) {
        const loader = this.createElement('div', {
            className: 'loading-overlay'
        }, [
            this.createElement('div', {
                className: 'loading-spinner'
            }),
            this.createElement('div', {
                className: 'loading-text',
                text: text
            })
        ]);
        
        if (typeof container === 'string') {
            container = this.$(container);
        }
        
        if (container) {
            container.appendChild(loader);
        } else {
            document.body.appendChild(loader);
        }
        
        return loader;
    }

    static hideLoading(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }

    // Form helpers
    static serializeForm(form) {
        const data = {};
        const formData = new FormData(form);
        
        formData.forEach((value, key) => {
            if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });
        
        return data;
    }

    static validateForm(form, rules) {
        const errors = {};
        const formData = this.serializeForm(form);
        
        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];
            
            if (fieldRules.required && this.isEmpty(value)) {
                errors[field] = fieldRules.message || `${field} is required`;
                return;
            }
            
            if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
                errors[field] = fieldRules.message || `${field} is invalid`;
                return;
            }
            
            if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = fieldRules.message || `${field} must be at least ${fieldRules.minLength} characters`;
                return;
            }
            
            if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
                errors[field] = fieldRules.message || `${field} must be no more than ${fieldRules.maxLength} characters`;
                return;
            }
            
            if (value && fieldRules.email && !this.isValidEmail(value)) {
                errors[field] = fieldRules.message || 'Invalid email address';
                return;
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    // Clipboard helper
    static copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    successful ? resolve() : reject(new Error('Copy failed'));
                } catch (error) {
                    document.body.removeChild(textArea);
                    reject(error);
                }
            }
        });
    }

    // UUID generation
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Hash generation
    static hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Security helpers
    static escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Math helpers
    static percentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    static average(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    static median(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        
        return sorted[middle];
    }

    static mode(arr) {
        const frequency = {};
        let maxFreq = 0;
        let mode = null;
        
        arr.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
            if (frequency[value] > maxFreq) {
                maxFreq = frequency[value];
                mode = value;
            }
        });
        
        return mode;
    }

    // Network helpers
    static isOnline() {
        return navigator.onLine;
    }

    static getNetworkType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType;
        }
        return 'unknown';
    }

    static getNetworkSpeed() {
        if ('connection' in navigator) {
            return navigator.connection.downlink;
        }
        return null;
    }

    // Debug helpers
    static log(...args) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[DEBUG]', ...args);
        }
    }

    static warn(...args) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[WARNING]', ...args);
        }
    }

    static error(...args) {
        console.error('[ERROR]', ...args);
    }

    static time(label) {
        if (process.env.NODE_ENV !== 'production') {
            console.time(label);
        }
    }

    static timeEnd(label) {
        if (process.env.NODE_ENV !== 'production') {
            console.timeEnd(label);
        }
    }

    // Utility functions
    static noop() {}

    static identity(x) {
        return x;
    }

    static pipe(...functions) {
        return (input) => {
            return functions.reduce((acc, fn) => fn(acc), input);
        };
    }

    static compose(...functions) {
        return (input) => {
            return functions.reduceRight((acc, fn) => fn(acc), input);
        };
    }

    static memoize(fn) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }

    static curry(fn) {
        return function curried(...args) {
            if (args.length >= fn.length) {
                return fn.apply(this, args);
            } else {
                return function(...args2) {
                    return curried.apply(this, args.concat(args2));
                };
            }
        };
    }
}

// Export all helper functions
export default Helpers;

// Export individual functions for convenience
export const {
    $,
    $$,
    createElement,
    showElement,
    hideElement,
    toggleElement,
    on,
    once,
    delegate,
    capitalize,
    capitalizeWords,
    truncate,
    slugify,
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    timeAgo,
    chunk,
    unique,
    shuffle,
    groupBy,
    sortBy,
    deepClone,
    merge,
    omit,
    pick,
    isValidEmail,
    isValidURL,
    isValidPhone,
    isNumeric,
    isEmpty,
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    debounce,
    throttle,
    sleep,
    readFile,
    downloadFile,
    formatFileSize,
    hexToRgb,
    rgbToHex,
    lightenColor,
    darkenColor,
    fadeIn,
    fadeOut,
    slideDown,
    slideUp,
    showModal,
    hideModal,
    toast,
    showLoading,
    hideLoading,
    serializeForm,
    validateForm,
    copyToClipboard,
    generateUUID,
    hash,
    escapeHTML,
    sanitizeInput,
    percentage,
    average,
    median,
    mode,
    isOnline,
    getNetworkType,
    getNetworkSpeed,
    log,
    warn,
    error,
    time,
    timeEnd,
    noop,
    identity,
    pipe,
    compose,
    memoize,
    curry
} = Helpers;

// Export storage and cookies as objects
export const storage = Helpers.storage;
export const cookies = Helpers.cookies;

// Convenience aliases
export const show = Helpers.showElement;
export const hide = Helpers.hideElement;
export const toggle = Helpers.toggleElement;
