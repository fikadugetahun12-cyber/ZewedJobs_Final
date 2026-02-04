// auth.js - Authentication and Authorization Manager
class AuthManager {
    constructor() {
        this.user = null;
        this.permissions = [];
        this.roles = [];
        this.sessions = [];
        this.init();
    }

    async init() {
        await this.loadSession();
        this.setupEventListeners();
        this.setupTokenRefresh();
        this.setupSessionMonitor();
    }

    // Session management
    async loadSession() {
        const sessionData = localStorage.getItem('user_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                
                // Check if session is expired
                if (this.isSessionExpired(session)) {
                    await this.refreshSession();
                    return;
                }
                
                this.user = session.user;
                this.permissions = session.permissions || [];
                this.roles = session.roles || [];
                this.sessions = session.sessions || [];
                
                // Emit login event
                this.emit('session_loaded', this.user);
            } catch (error) {
                console.error('Failed to load session:', error);
                await this.logout();
            }
        }
    }

    async saveSession(sessionData) {
        const session = {
            ...sessionData,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };
        
        localStorage.setItem('user_session', JSON.stringify(session));
        this.user = session.user;
        this.permissions = session.permissions || [];
        this.roles = session.roles || [];
    }

    clearSession() {
        localStorage.removeItem('user_session');
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('temp_session');
        
        this.user = null;
        this.permissions = [];
        this.roles = [];
        this.sessions = [];
    }

    isSessionExpired(session) {
        if (!session || !session.expiresAt) return true;
        return new Date(session.expiresAt) < new Date();
    }

    // Authentication methods
    async login(credentials, options = {}) {
        const { email, password, rememberMe = false } = credentials;
        
        try {
            // Validate input
            this.validateCredentials(credentials);
            
            // API call to authenticate
            const response = await api.post('/auth/login', {
                email,
                password,
                rememberMe
            });
            
            // Save session
            await this.saveSession({
                user: response.user,
                token: response.token,
                permissions: response.permissions,
                roles: response.roles,
                sessions: response.sessions
            });
            
            // Set auth token
            api.setToken(response.token);
            
            // Track login
            this.trackLogin(response.user);
            
            // Emit event
            this.emit('login', response.user);
            
            return response;
        } catch (error) {
            this.handleLoginError(error);
            throw error;
        }
    }

    async register(userData) {
        try {
            // Validate registration data
            this.validateRegistration(userData);
            
            // API call to register
            const response = await api.post('/auth/register', userData);
            
            // Auto-login after registration if enabled
            if (response.autoLogin) {
                await this.saveSession({
                    user: response.user,
                    token: response.token,
                    permissions: response.permissions,
                    roles: response.roles
                });
                
                api.setToken(response.token);
                this.emit('register', response.user);
            }
            
            return response;
        } catch (error) {
            this.handleRegistrationError(error);
            throw error;
        }
    }

    async logout(allDevices = false) {
        try {
            // Call logout API
            await api.post('/auth/logout', { allDevices });
            
            // Clear local session
            this.clearSession();
            api.clearToken();
            
            // Emit event
            this.emit('logout');
            
            // Redirect to login
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local session even if API fails
            this.clearSession();
            api.clearToken();
            window.location.href = '/login';
        }
    }

    async refreshSession() {
        try {
            const response = await api.post('/auth/refresh');
            
            await this.saveSession({
                user: response.user,
                token: response.token,
                permissions: response.permissions,
                roles: response.roles
            });
            
            api.setToken(response.token);
            this.emit('session_refreshed', response.user);
            
            return response;
        } catch (error) {
            console.error('Session refresh failed:', error);
            await this.logout();
            throw error;
        }
    }

    // Password management
    async forgotPassword(email) {
        try {
            // Validate email
            if (!email || !this.validateEmail(email)) {
                throw new Error('Please enter a valid email address');
            }
            
            const response = await api.post('/auth/forgot-password', { email });
            
            // Show success message
            this.showMessage('Password reset instructions sent to your email', 'success');
            
            return response;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            // Validate password
            const validation = this.validatePassword(newPassword);
            if (!validation.isValid) {
                throw new Error(validation.errors[0]);
            }
            
            const response = await api.post('/auth/reset-password', {
                token,
                password: newPassword
            });
            
            this.showMessage('Password reset successfully', 'success');
            
            return response;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            // Validate passwords
            const validation = this.validatePassword(newPassword);
            if (!validation.isValid) {
                throw new Error(validation.errors[0]);
            }
            
            const response = await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            
            this.showMessage('Password changed successfully', 'success');
            
            return response;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

    // Two-factor authentication
    async setup2FA() {
        try {
            const response = await api.post('/auth/2fa/setup');
            
            // Show QR code for setup
            this.show2FASetup(response.qrCode, response.secret);
            
            return response;
        } catch (error) {
            this.showMessage('Failed to setup 2FA', 'error');
            throw error;
        }
    }

    async enable2FA(token) {
        try {
            const response = await api.post('/auth/2fa/enable', { token });
            
            this.showMessage('Two-factor authentication enabled', 'success');
            
            // Update session
            if (this.user) {
                this.user.twoFactorEnabled = true;
                this.saveSession({
                    user: this.user,
                    permissions: this.permissions,
                    roles: this.roles
                });
            }
            
            return response;
        } catch (error) {
            this.showMessage('Invalid verification code', 'error');
            throw error;
        }
    }

    async disable2FA(token) {
        try {
            const response = await api.post('/auth/2fa/disable', { token });
            
            this.showMessage('Two-factor authentication disabled', 'success');
            
            // Update session
            if (this.user) {
                this.user.twoFactorEnabled = false;
                this.saveSession({
                    user: this.user,
                    permissions: this.permissions,
                    roles: this.roles
                });
            }
            
            return response;
        } catch (error) {
            this.showMessage('Invalid verification code', 'error');
            throw error;
        }
    }

    async verify2FA(token) {
        try {
            const response = await api.post('/auth/2fa/verify', { token });
            
            // Complete login process
            await this.saveSession(response);
            api.setToken(response.token);
            
            return response;
        } catch (error) {
            this.showMessage('Invalid verification code', 'error');
            throw error;
        }
    }

    // Social login
    async socialLogin(provider, token) {
        try {
            const response = await api.post(`/auth/social/${provider}`, { token });
            
            await this.saveSession({
                user: response.user,
                token: response.token,
                permissions: response.permissions,
                roles: response.roles
            });
            
            api.setToken(response.token);
            this.emit('social_login', response.user);
            
            return response;
        } catch (error) {
            this.handleSocialLoginError(error, provider);
            throw error;
        }
    }

    // Authorization methods
    hasPermission(permission) {
        if (!this.user) return false;
        
        // Check direct permissions
        if (this.permissions.includes(permission) || this.permissions.includes('*')) {
            return true;
        }
        
        // Check role-based permissions
        const rolePermissions = this.roles.flatMap(role => 
            this.getRolePermissions(role)
        );
        
        return rolePermissions.includes(permission) || rolePermissions.includes('*');
    }

    hasRole(role) {
        return this.roles.includes(role);
    }

    getRolePermissions(role) {
        const roleMap = {
            'admin': ['*'],
            'employer': ['post_jobs', 'view_applications', 'manage_company'],
            'job_seeker': ['apply_jobs', 'view_jobs', 'manage_profile'],
            'moderator': ['moderate_content', 'view_reports'],
            'premium': ['premium_features', 'priority_support']
        };
        
        return roleMap[role] || [];
    }

    canAccess(resource, action) {
        const permission = `${action}_${resource}`;
        return this.hasPermission(permission);
    }

    // Session management
    async getActiveSessions() {
        try {
            const response = await api.get('/auth/sessions');
            this.sessions = response.sessions;
            return response.sessions;
        } catch (error) {
            console.error('Failed to get sessions:', error);
            return [];
        }
    }

    async terminateSession(sessionId) {
        try {
            await api.delete(`/auth/sessions/${sessionId}`);
            
            // Remove from local list
            this.sessions = this.sessions.filter(s => s.id !== sessionId);
            
            // If current session terminated, logout
            if (sessionId === this.getCurrentSessionId()) {
                await this.logout();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to terminate session:', error);
            return false;
        }
    }

    getCurrentSessionId() {
        const sessionData = localStorage.getItem('user_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            return session.sessionId;
        }
        return null;
    }

    // User profile
    async updateProfile(userData) {
        try {
            const response = await api.put('/auth/profile', userData);
            
            // Update local user data
            if (this.user) {
                this.user = { ...this.user, ...response.user };
                this.saveSession({
                    user: this.user,
                    permissions: this.permissions,
                    roles: this.roles
                });
            }
            
            this.showMessage('Profile updated successfully', 'success');
            this.emit('profile_updated', response.user);
            
            return response;
        } catch (error) {
            this.showMessage('Failed to update profile', 'error');
            throw error;
        }
    }

    async uploadAvatar(file) {
        try {
            const response = await api.upload('/auth/avatar', file);
            
            // Update local user data
            if (this.user) {
                this.user.avatar = response.avatarUrl;
                this.saveSession({
                    user: this.user,
                    permissions: this.permissions,
                    roles: this.roles
                });
            }
            
            this.showMessage('Avatar updated successfully', 'success');
            
            return response;
        } catch (error) {
            this.showMessage('Failed to upload avatar', 'error');
            throw error;
        }
    }

    // Email verification
    async verifyEmail(token) {
        try {
            const response = await api.post('/auth/verify-email', { token });
            
            // Update local user data
            if (this.user) {
                this.user.emailVerified = true;
                this.saveSession({
                    user: this.user,
                    permissions: this.permissions,
                    roles: this.roles
                });
            }
            
            this.showMessage('Email verified successfully', 'success');
            
            return response;
        } catch (error) {
            this.showMessage('Invalid verification token', 'error');
            throw error;
        }
    }

    async resendVerificationEmail() {
        try {
            await api.post('/auth/resend-verification');
            this.showMessage('Verification email sent', 'success');
            return true;
        } catch (error) {
            this.showMessage('Failed to send verification email', 'error');
            throw error;
        }
    }

    // Validation methods
    validateCredentials(credentials) {
        const { email, password } = credentials;
        
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        if (!this.validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
    }

    validateRegistration(userData) {
        const { email, password, confirmPassword, firstName, lastName } = userData;
        
        // Required fields
        if (!email || !password || !confirmPassword || !firstName || !lastName) {
            throw new Error('All fields are required');
        }
        
        // Email validation
        if (!this.validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // Password validation
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.errors[0]);
        }
        
        // Password confirmation
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Event handling
    setupEventListeners() {
        // Listen for storage events (cross-tab sync)
        window.addEventListener('storage', (event) => {
            if (event.key === 'user_session') {
                if (event.newValue) {
                    this.loadSession();
                } else {
                    this.clearSession();
                }
            }
        });
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.attemptSessionSync();
        });
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkSession();
            }
        });
    }

    setupTokenRefresh() {
        // Auto-refresh token before expiration
        setInterval(async () => {
            if (this.user) {
                await this.checkAndRefreshToken();
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    setupSessionMonitor() {
        // Monitor session activity
        let lastActivity = Date.now();
        
        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            });
        });
        
        // Check for inactivity
        setInterval(() => {
            if (this.user && Date.now() - lastActivity > 30 * 60 * 1000) { // 30 minutes
                this.showInactivityWarning();
            }
        }, 60 * 1000); // Check every minute
    }

    async checkAndRefreshToken() {
        const sessionData = localStorage.getItem('user_session');
        if (!sessionData) return;
        
        const session = JSON.parse(sessionData);
        const expiresIn = new Date(session.expiresAt) - new Date();
        
        // Refresh if expires in less than 5 minutes
        if (expiresIn < 5 * 60 * 1000) {
            await this.refreshSession();
        }
    }

    showInactivityWarning() {
        const warning = document.createElement('div');
        warning.className = 'inactivity-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-clock"></i>
                <p>Your session will expire due to inactivity in 5 minutes.</p>
                <button class="btn-stay-logged-in">Stay Logged In</button>
                <button class="btn-logout-now">Logout Now</button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        warning.querySelector('.btn-stay-logged-in').addEventListener('click', () => {
            warning.remove();
            this.resetActivity();
        });
        
        warning.querySelector('.btn-logout-now').addEventListener('click', () => {
            warning.remove();
            this.logout();
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 10000);
    }

    resetActivity() {
        // Reset activity timer
        localStorage.setItem('last_activity', Date.now().toString());
    }

    async checkSession() {
        try {
            const response = await api.get('/auth/session-check');
            
            // Update session if needed
            if (response.requiresRefresh) {
                await this.refreshSession();
            }
            
            return response;
        } catch (error) {
            console.error('Session check failed:', error);
            return { valid: false };
        }
    }

    async attemptSessionSync() {
        if (this.user) {
            try {
                await this.checkSession();
            } catch (error) {
                console.error('Session sync failed:', error);
            }
        }
    }

    // Error handling
    handleLoginError(error) {
        let message = 'Login failed';
        
        if (error.status === 401) {
            message = 'Invalid email or password';
        } else if (error.status === 423) {
            message = 'Account locked. Please try again later';
        } else if (error.status === 429) {
            message = 'Too many login attempts. Please wait a moment';
        } else if (error.data && error.data.message) {
            message = error.data.message;
        }
        
        this.showMessage(message, 'error');
    }

    handleRegistrationError(error) {
        let message = 'Registration failed';
        
        if (error.status === 409) {
            message = 'Email already registered';
        } else if (error.data && error.data.message) {
            message = error.data.message;
        }
        
        this.showMessage(message, 'error');
    }

    handleSocialLoginError(error, provider) {
        let message = `Failed to login with ${provider}`;
        
        if (error.status === 401) {
            message = 'Social login failed';
        } else if (error.data && error.data.message) {
            message = error.data.message;
        }
        
        this.showMessage(message, 'error');
    }

    // UI helpers
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
                <button class="message-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
        
        messageDiv.querySelector('.message-close').addEventListener('click', () => {
            messageDiv.remove();
        });
    }

    getMessageIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    show2FASetup(qrCode, secret) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Setup Two-Factor Authentication</h3>
                <p>Scan this QR code with your authenticator app:</p>
                <div class="qr-code-container">
                    <img src="${qrCode}" alt="QR Code">
                </div>
                <p>Or enter this code manually:</p>
                <div class="secret-code">${secret}</div>
                <div class="verification-input">
                    <input type="text" id="2fa-code" placeholder="Enter 6-digit code" maxlength="6">
                    <button id="verify-2fa" class="btn-primary">Verify & Enable</button>
                </div>
                <button class="btn-close-modal">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#verify-2fa').addEventListener('click', async () => {
            const code = modal.querySelector('#2fa-code').value;
            if (code.length === 6) {
                await this.enable2FA(code);
                modal.remove();
            }
        });
        
        modal.querySelector('.btn-close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    // Event emitter
    emit(event, data) {
        const eventObj = new CustomEvent(`auth:${event}`, { detail: data });
        window.dispatchEvent(eventObj);
    }

    // Getters
    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return !!this.user;
    }

    isEmailVerified() {
        return this.user ? this.user.emailVerified : false;
    }

    is2FAEnabled() {
        return this.user ? this.user.twoFactorEnabled : false;
    }

    // Analytics
    trackLogin(user) {
        const loginData = {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        
        // Save login history
        const logins = JSON.parse(localStorage.getItem('login_history') || '[]');
        logins.push(loginData);
        localStorage.setItem('login_history', JSON.stringify(logins.slice(-50))); // Keep last 50
        
        // Send to analytics
        api.trackEvent('user_login', loginData);
    }

    getLoginHistory() {
        return JSON.parse(localStorage.getItem('login_history') || '[]');
    }

    // Security helpers
    generateSecurePassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        
        // Ensure at least one of each type
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        password += '0123456789'[Math.floor(Math.random() * 10)];
        password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
        
        // Fill the rest
        for (let i = 4; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        
        // Shuffle
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        // Length
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 2;
        
        // Complexity
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 2;
        
        // Entropy (simple)
        const uniqueChars = new Set(password.split('')).size;
        if (uniqueChars / password.length > 0.7) score += 1;
        
        // Convert to rating
        if (score >= 8) return 'strong';
        if (score >= 5) return 'medium';
        return 'weak';
    }

    validateSessionSecurity() {
        const warnings = [];
        
        // Check for HTTP
        if (window.location.protocol === 'http:') {
            warnings.push('Website is not using HTTPS');
        }
        
        // Check for weak password
        if (this.user && this.user.passwordStrength === 'weak') {
            warnings.push('Password is weak');
        }
        
        // Check for 2FA
        if (!this.is2FAEnabled()) {
            warnings.push('Two-factor authentication is not enabled');
        }
        
        // Check for suspicious activity
        const logins = this.getLoginHistory();
        if (logins.length >= 3) {
            const recentLogins = logins.slice(-3);
            const uniqueIPs = new Set(recentLogins.map(l => l.ipAddress));
            if (uniqueIPs.size > 2) {
                warnings.push('Multiple IP addresses detected');
            }
        }
        
        return warnings;
    }
}

// Export singleton instance
const auth = new AuthManager();
export default auth;

// Export individual functions for direct use
export const {
    login,
    register,
    logout,
    hasPermission,
    hasRole,
    canAccess,
    getUser,
    isAuthenticated,
    isEmailVerified,
    is2FAEnabled,
    validatePassword,
    generateSecurePassword,
    calculatePasswordStrength
} = auth;
