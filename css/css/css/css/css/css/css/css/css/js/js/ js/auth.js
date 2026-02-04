/**
 * ZewedJobs - User Authentication System
 * Handles user registration, login, profile management, and session handling
 */

class UserAuth {
    constructor() {
        this.config = {
            apiUrl: 'https://api.zewedjobs.com/v1/auth',
            tokenKey: 'zewedjobs_token',
            userKey: 'zewedjobs_user',
            refreshTokenKey: 'zewedjobs_refresh_token',
            tokenExpiryKey: 'zewedjobs_token_expiry',
            autoRefresh: true,
            refreshThreshold: 300000, // 5 minutes before expiry
            sessionTimeout: 86400000 // 24 hours
        };
        
        this.state = {
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
            sessionStart: null,
            lastActivity: null,
            pendingActions: []
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🔐 User Authentication Initializing...');
        
        // Load saved session
        this.loadSession();
        
        // Initialize UI
        this.initAuthUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup auto-refresh
        if (this.config.autoRefresh) {
            this.setupTokenRefresh();
        }
        
        // Setup activity tracking
        this.setupActivityTracking();
        
        // Check session expiry
        this.checkSessionExpiry();
        
        console.log('✅ User Authentication Ready!');
    }
    
    loadSession() {
        try {
            const token = localStorage.getItem(this.config.tokenKey);
            const user = localStorage.getItem(this.config.userKey);
            const refreshToken = localStorage.getItem(this.config.refreshTokenKey);
            const expiry = localStorage.getItem(this.config.tokenExpiryKey);
            
            if (token && user) {
                // Check token expiry
                if (expiry && Date.now() > parseInt(expiry)) {
                    console.log('Token expired, attempting refresh...');
                    this.refreshAuthToken();
                    return;
                }
                
                this.state.token = token;
                this.state.user = JSON.parse(user);
                this.state.refreshToken = refreshToken;
                this.state.isAuthenticated = true;
                this.state.sessionStart = new Date();
                this.state.lastActivity = new Date();
                
                console.log('Session loaded for user:', this.state.user.email);
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
        }
    }
    
    saveSession() {
        try {
            if (this.state.token) {
                localStorage.setItem(this.config.tokenKey, this.state.token);
            }
            
            if (this.state.user) {
                localStorage.setItem(this.config.userKey, JSON.stringify(this.state.user));
            }
            
            if (this.state.refreshToken) {
                localStorage.setItem(this.config.refreshTokenKey, this.state.refreshToken);
            }
            
            // Calculate token expiry (1 hour from now)
            const expiry = Date.now() + 3600000;
            localStorage.setItem(this.config.tokenExpiryKey, expiry.toString());
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }
    
    clearSession() {
        // Clear localStorage
        localStorage.removeItem(this.config.tokenKey);
        localStorage.removeItem(this.config.userKey);
        localStorage.removeItem(this.config.refreshTokenKey);
        localStorage.removeItem(this.config.tokenExpiryKey);
        
        // Clear state
        this.state = {
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
            sessionStart: null,
            lastActivity: null,
            pendingActions: []
        };
        
        // Update UI
        this.updateAuthUI();
        
        console.log('Session cleared');
    }
    
    initAuthUI() {
        // Create auth modals if they don't exist
        this.createAuthModals();
        
        // Create user dropdown
        this.createUserDropdown();
        
        // Update UI based on auth state
        this.updateAuthUI();
    }
    
    createAuthModals() {
        // Login Modal
        if (!document.getElementById('loginModal')) {
            const loginModal = document.createElement('div');
            loginModal.id = 'loginModal';
            loginModal.className = 'auth-modal';
            loginModal.innerHTML = `
                <div class="auth-modal-overlay"></div>
                <div class="auth-modal-content">
                    <button class="auth-modal-close">&times;</button>
                    
                    <div class="auth-modal-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to your ZewedJobs account</p>
                    </div>
                    
                    <form id="loginForm" class="auth-form">
                        <div class="auth-form-group">
                            <label for="loginEmail">Email Address</label>
                            <input 
                                type="email" 
                                id="loginEmail" 
                                name="email" 
                                required
                                placeholder="you@example.com"
                            >
                        </div>
                        
                        <div class="auth-form-group">
                            <label for="loginPassword">Password</label>
                            <input 
                                type="password" 
                                id="loginPassword" 
                                name="password" 
                                required
                                placeholder="••••••••"
                            >
                            <button type="button" class="btn-show-password">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        
                        <div class="auth-form-options">
                            <label class="auth-checkbox">
                                <input type="checkbox" name="remember" id="rememberMe">
                                <span>Remember me</span>
                            </label>
                            <a href="#forgot-password" class="auth-link">Forgot Password?</a>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-auth-submit">
                            Sign In
                        </button>
                        
                        <div class="auth-divider">
                            <span>or continue with</span>
                        </div>
                        
                        <div class="auth-social-login">
                            <button type="button" class="btn-social btn-google">
                                <i class="fab fa-google"></i>
                                <span>Google</span>
                            </button>
                            <button type="button" class="btn-social btn-linkedin">
                                <i class="fab fa-linkedin"></i>
                                <span>LinkedIn</span>
                            </button>
                            <button type="button" class="btn-social btn-github">
                                <i class="fab fa-github"></i>
                                <span>GitHub</span>
                            </button>
                        </div>
                        
                        <div class="auth-footer">
                            <p>Don't have an account? <a href="#signup" class="auth-switch">Sign up</a></p>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(loginModal);
        }
        
        // Register Modal
        if (!document.getElementById('registerModal')) {
            const registerModal = document.createElement('div');
            registerModal.id = 'registerModal';
            registerModal.className = 'auth-modal';
            registerModal.innerHTML = `
                <div class="auth-modal-overlay"></div>
                <div class="auth-modal-content">
                    <button class="auth-modal-close">&times;</button>
                    
                    <div class="auth-modal-header">
                        <h2>Join ZewedJobs</h2>
                        <p>Create your free account</p>
                    </div>
                    
                    <form id="registerForm" class="auth-form">
                        <div class="auth-form-grid">
                            <div class="auth-form-group">
                                <label for="registerFirstName">First Name</label>
                                <input 
                                    type="text" 
                                    id="registerFirstName" 
                                    name="firstName" 
                                    required
                                    placeholder="John"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="registerLastName">Last Name</label>
                                <input 
                                    type="text" 
                                    id="registerLastName" 
                                    name="lastName" 
                                    required
                                    placeholder="Doe"
                                >
                            </div>
                        </div>
                        
                        <div class="auth-form-group">
                            <label for="registerEmail">Email Address</label>
                            <input 
                                type="email" 
                                id="registerEmail" 
                                name="email" 
                                required
                                placeholder="you@example.com"
                            >
                        </div>
                        
                        <div class="auth-form-group">
                            <label for="registerPassword">Password</label>
                            <input 
                                type="password" 
                                id="registerPassword" 
                                name="password" 
                                required
                                placeholder="••••••••"
                                minlength="8"
                            >
                            <div class="password-strength">
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                                <div class="strength-bar"></div>
                            </div>
                            <small class="form-help">Must be at least 8 characters</small>
                        </div>
                        
                        <div class="auth-form-group">
                            <label for="registerConfirmPassword">Confirm Password</label>
                            <input 
                                type="password" 
                                id="registerConfirmPassword" 
                                name="confirmPassword" 
                                required
                                placeholder="••••••••"
                            >
                        </div>
                        
                        <div class="auth-form-group">
                            <label for="userType">I am a:</label>
                            <select id="userType" name="userType" required>
                                <option value="">Select account type</option>
                                <option value="job_seeker">Job Seeker</option>
                                <option value="employer">Employer</option>
                                <option value="recruiter">Recruiter</option>
                            </select>
                        </div>
                        
                        <div class="auth-form-group">
                            <label class="auth-checkbox">
                                <input type="checkbox" name="newsletter" id="newsletterOptIn" checked>
                                <span>Receive job alerts and career tips</span>
                            </label>
                        </div>
                        
                        <div class="auth-form-group">
                            <label class="auth-checkbox">
                                <input type="checkbox" name="terms" id="acceptTerms" required>
                                <span>
                                    I agree to the 
                                    <a href="/terms" target="_blank">Terms of Service</a> 
                                    and 
                                    <a href="/privacy" target="_blank">Privacy Policy</a>
                                </span>
                            </label>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-auth-submit">
                            Create Account
                        </button>
                        
                        <div class="auth-divider">
                            <span>or sign up with</span>
                        </div>
                        
                        <div class="auth-social-login">
                            <button type="button" class="btn-social btn-google">
                                <i class="fab fa-google"></i>
                                <span>Google</span>
                            </button>
                            <button type="button" class="btn-social btn-linkedin">
                                <i class="fab fa-linkedin"></i>
                                <span>LinkedIn</span>
                            </button>
                        </div>
                        
                        <div class="auth-footer">
                            <p>Already have an account? <a href="#login" class="auth-switch">Sign in</a></p>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(registerModal);
        }
        
        // Forgot Password Modal
        if (!document.getElementById('forgotPasswordModal')) {
            const forgotModal = document.createElement('div');
            forgotModal.id = 'forgotPasswordModal';
            forgotModal.className = 'auth-modal';
            forgotModal.innerHTML = `
                <div class="auth-modal-overlay"></div>
                <div class="auth-modal-content">
                    <button class="auth-modal-close">&times;</button>
                    
                    <div class="auth-modal-header">
                        <h2>Reset Password</h2>
                        <p>Enter your email to receive reset instructions</p>
                    </div>
                    
                    <form id="forgotPasswordForm" class="auth-form">
                        <div class="auth-form-group">
                            <label for="forgotEmail">Email Address</label>
                            <input 
                                type="email" 
                                id="forgotEmail" 
                                name="email" 
                                required
                                placeholder="you@example.com"
                            >
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-auth-submit">
                            Send Reset Instructions
                        </button>
                        
                        <div class="auth-footer">
                            <p>Remember your password? <a href="#login" class="auth-switch">Back to login</a></p>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(forgotModal);
        }
        
        // Add CSS for auth modals
        this.addAuthStyles();
    }
    
    addAuthStyles() {
        const styles = `
            .auth-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            }
            
            .auth-modal.active {
                display: flex;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .auth-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .auth-modal-content {
                position: relative;
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 480px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .auth-modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                font-size: 24px;
                color: #6b7280;
                cursor: pointer;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s ease;
            }
            
            .auth-modal-close:hover {
                background: #f3f4f6;
            }
            
            .auth-modal-header {
                text-align: center;
                margin-bottom: 32px;
            }
            
            .auth-modal-header h2 {
                font-size: 28px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 8px;
            }
            
            .auth-modal-header p {
                color: #6b7280;
                font-size: 16px;
            }
            
            .auth-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .auth-form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            
            .auth-form-group {
                position: relative;
            }
            
            .auth-form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #374151;
                font-size: 14px;
            }
            
            .auth-form-group input,
            .auth-form-group select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.2s ease;
                background: white;
            }
            
            .auth-form-group input:focus,
            .auth-form-group select:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .auth-form-group input.error,
            .auth-form-group select.error {
                border-color: #ef4444;
            }
            
            .btn-show-password {
                position: absolute;
                right: 12px;
                top: 38px;
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 4px;
            }
            
            .password-strength {
                display: flex;
                gap: 4px;
                margin-top: 8px;
            }
            
            .strength-bar {
                flex: 1;
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                transition: background 0.3s ease;
            }
            
            .strength-bar.active {
                background: #10b981;
            }
            
            .form-help {
                display: block;
                margin-top: 4px;
                color: #6b7280;
                font-size: 12px;
            }
            
            .auth-form-options {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .auth-checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 14px;
                color: #374151;
            }
            
            .auth-checkbox input {
                width: 16px;
                height: 16px;
                cursor: pointer;
            }
            
            .auth-link {
                color: #3b82f6;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
            }
            
            .auth-link:hover {
                text-decoration: underline;
            }
            
            .btn-auth-submit {
                width: 100%;
                padding: 14px;
                font-size: 16px;
                font-weight: 600;
                margin-top: 8px;
            }
            
            .auth-divider {
                display: flex;
                align-items: center;
                gap: 16px;
                margin: 24px 0;
                color: #6b7280;
                font-size: 14px;
            }
            
            .auth-divider::before,
            .auth-divider::after {
                content: '';
                flex: 1;
                height: 1px;
                background: #e5e7eb;
            }
            
            .auth-social-login {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
            }
            
            .btn-social {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                color: #374151;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .btn-social:hover {
                border-color: #d1d5db;
                background: #f9fafb;
            }
            
            .btn-social i {
                font-size: 18px;
            }
            
            .btn-google:hover { color: #db4437; border-color: #db4437; }
            .btn-linkedin:hover { color: #0077b5; border-color: #0077b5; }
            .btn-github:hover { color: #333; border-color: #333; }
            
            .auth-footer {
                text-align: center;
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            
            .auth-switch {
                color: #3b82f6;
                text-decoration: none;
                font-weight: 600;
            }
            
            .auth-switch:hover {
                text-decoration: underline;
            }
            
            .auth-error {
                background: #fee;
                color: #c33;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid #fcc;
                font-size: 14px;
                margin-bottom: 16px;
            }
            
            .auth-success {
                background: #dfd;
                color: #3a3;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid #afa;
                font-size: 14px;
                margin-bottom: 16px;
            }
            
            @media (max-width: 640px) {
                .auth-modal-content {
                    padding: 24px;
                }
                
                .auth-form-grid {
                    grid-template-columns: 1fr;
                }
                
                .auth-social-login {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    createUserDropdown() {
        // Check if dropdown already exists
        if (document.getElementById('userDropdown')) return;
        
        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.id = 'userDropdown';
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <button class="user-dropdown-toggle">
                <img class="user-avatar" src="https://via.placeholder.com/40" alt="User">
                <span class="user-name">John Doe</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="user-dropdown-menu">
                <div class="user-info">
                    <img class="user-avatar-large" src="https://via.placeholder.com/60" alt="User">
                    <div class="user-details">
                        <h4 class="user-fullname">John Doe</h4>
                        <p class="user-email">john@example.com</p>
                        <span class="user-badge">Job Seeker</span>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                <a href="/dashboard" class="dropdown-item">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
                <a href="/profile" class="dropdown-item">
                    <i class="fas fa-user"></i>
                    <span>My Profile</span>
                </a>
                <a href="/applications" class="dropdown-item">
                    <i class="fas fa-file-alt"></i>
                    <span>My Applications</span>
                </a>
                <a href="/saved-jobs" class="dropdown-item">
                    <i class="fas fa-heart"></i>
                    <span>Saved Jobs</span>
                </a>
                <a href="/settings" class="dropdown-item">
                    <i class="fas fa-cog"></i>
                    <span>Settings</span>
                </a>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </div>
        `;
        
        // Add to header or appropriate location
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.appendChild(dropdown);
        } else {
            document.body.appendChild(dropdown);
        }
        
        // Add dropdown styles
        this.addDropdownStyles();
    }
    
    addDropdownStyles() {
        const styles = `
            .user-dropdown {
                position: relative;
            }
            
            .user-dropdown-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
                background: none;
                border: none;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .user-dropdown-toggle:hover {
                background: #f3f4f6;
            }
            
            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .user-name {
                font-weight: 500;
                color: #374151;
            }
            
            .user-dropdown-toggle i {
                font-size: 12px;
                color: #6b7280;
                transition: transform 0.2s ease;
            }
            
            .user-dropdown.open .user-dropdown-toggle i {
                transform: rotate(180deg);
            }
            
            .user-dropdown-menu {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                min-width: 280px;
                padding: 16px 0;
                margin-top: 8px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s ease;
                z-index: 1000;
                border: 1px solid #e5e7eb;
            }
            
            .user-dropdown.open .user-dropdown-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 0 16px 16px;
            }
            
            .user-avatar-large {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .user-details h4 {
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
                color: #111827;
            }
            
            .user-details p {
                margin: 0 0 8px 0;
                color: #6b7280;
                font-size: 14px;
            }
            
            .user-badge {
                display: inline-block;
                background: #3b82f6;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .dropdown-divider {
                height: 1px;
                background: #e5e7eb;
                margin: 12px 0;
            }
            
            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                color: #374151;
                text-decoration: none;
                transition: background 0.2s ease;
                cursor: pointer;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                font-size: 14px;
            }
            
            .dropdown-item:hover {
                background: #f9fafb;
                color: #3b82f6;
            }
            
            .dropdown-item i {
                width: 16px;
                text-align: center;
                color: #6b7280;
            }
            
            .dropdown-item:hover i {
                color: #3b82f6;
            }
            
            .logout-btn {
                color: #ef4444;
            }
            
            .logout-btn:hover {
                background: #fee;
                color: #dc2626;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    setupEventListeners() {
        // Global click handler for auth links
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Login button/link
            if (target.matches('.btn-login, [href="#login"], [data-action="login"]') ||
                target.closest('.btn-login, [href="#login"], [data-action="login"]')) {
                e.preventDefault();
                this.showLoginModal();
            }
            
            // Register button/link
            if (target.matches('.btn-signup, [href="#signup"], [data-action="signup"]') ||
                target.closest('.btn-signup, [href="#signup"], [data-action="signup"]')) {
                e.preventDefault();
                this.showRegisterModal();
            }
            
            // Logout button
            if (target.matches('.logout-btn, [data-action="logout"]') ||
                target.closest('.logout-btn, [data-action="logout"]')) {
                e.preventDefault();
                this.logout();
            }
            
            // Close modal buttons
            if (target.matches('.auth-modal-close, .auth-modal-overlay') ||
                target.closest('.auth-modal-close')) {
                const modal = target.closest('.auth-modal');
                if (modal) {
                    this.closeAuthModal(modal.id);
                }
            }
            
            // Switch between auth modals
            if (target.matches('.auth-switch') || target.closest('.auth-switch')) {
                e.preventDefault();
                const href = target.getAttribute('href') || target.closest('.auth-switch').getAttribute('href');
                if (href === '#login') {
                    this.closeAllModals();
                    this.showLoginModal();
                } else if (href === '#signup') {
                    this.closeAllModals();
                    this.showRegisterModal();
                }
            }
            
            // User dropdown toggle
            if (target.matches('.user-dropdown-toggle') || target.closest('.user-dropdown-toggle')) {
                e.preventDefault();
                const dropdown = document.getElementById('userDropdown');
                dropdown?.classList.toggle('open');
            }
            
            // Close dropdown when clicking outside
            if (!target.closest('.user-dropdown') && !target.closest('.auth-modal')) {
                const dropdown = document.getElementById('userDropdown');
                dropdown?.classList.remove('open');
            }
        });
        
        // Form submissions
        this.setupFormHandlers();
        
        // Social login buttons
        this.setupSocialLogin();
    }
    
    setupFormHandlers() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(loginForm);
            });
            
            // Show password toggle
            const showPasswordBtn = loginForm.querySelector('.btn-show-password');
            const passwordInput = loginForm.querySelector('#loginPassword');
            
            if (showPasswordBtn && passwordInput) {
                showPasswordBtn.addEventListener('click', () => {
                    const type = passwordInput.type === 'password' ? 'text' : 'password';
                    passwordInput.type = type;
                    showPasswordBtn.innerHTML = type === 'password' ? 
                        '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
                });
            }
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegistration(registerForm);
            });
            
            // Password strength indicator
            const passwordInput = registerForm.querySelector('#registerPassword');
            const strengthBars = registerForm.querySelectorAll('.strength-bar');
            
            if (passwordInput && strengthBars.length) {
                passwordInput.addEventListener('input', () => {
                    this.updatePasswordStrength(passwordInput.value, strengthBars);
                });
            }
            
            // Password confirmation validation
            const confirmInput = registerForm.querySelector('#registerConfirmPassword');
            if (passwordInput && confirmInput) {
                confirmInput.addEventListener('input', () => {
                    this.validatePasswordMatch(passwordInput, confirmInput);
                });
            }
        }
        
        // Forgot password form
        const forgotForm = document.getElementById('forgotPasswordForm');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleForgotPassword(forgotForm);
            });
        }
    }
    
    setupSocialLogin() {
        // Google login
        const googleButtons = document.querySelectorAll('.btn-google');
        googleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.initiateSocialLogin('google');
            });
        });
        
        // LinkedIn login
        const linkedinButtons = document.querySelectorAll('.btn-linkedin');
        linkedinButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.initiateSocialLogin('linkedin');
            });
        });
        
        // GitHub login
        const githubButtons = document.querySelectorAll('.btn-github');
        githubButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.initiateSocialLogin('github');
            });
        });
    }
    
    updatePasswordStrength(password, strengthBars) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Complexity checks
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        // Cap at 4 for our 4 bars
        strength = Math.min(strength, 4);
        
        // Update bars
        strengthBars.forEach((bar, index) => {
            if (index < strength) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    }
    
    validatePasswordMatch(passwordInput, confirmInput) {
        if (passwordInput.value !== confirmInput.value) {
            confirmInput.classList.add('error');
            confirmInput.setCustomValidity('Passwords do not match');
        } else {
            confirmInput.classList.remove('error');
            confirmInput.setCustomValidity('');
        }
    }
    
    async handleLogin(form) {
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };
        
        // Validate
        if (!this.validateEmail(data.email)) {
            this.showFormError(form, 'Please enter a valid email address');
            return;
        }
        
        // Show loading
        const submitBtn = form.querySelector('.btn-auth-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;
        
        try {
            const result = await this.login(data);
            
            if (result.success) {
                // Update state
                this.state.isAuthenticated = true;
                this.state.user = result.user;
                this.state.token = result.token;
                this.state.refreshToken = result.refreshToken;
                this.state.sessionStart = new Date();
                this.state.lastActivity = new Date();
                
                // Save session
                this.saveSession();
                
                // Update UI
                this.updateAuthUI();
                
                // Close modal
                this.closeAuthModal('loginModal');
                
                // Show success
                this.showNotification('Successfully signed in!', 'success');
                
                // Track login
                this.trackEvent('login_success', { email: data.email });
                
                // Execute pending actions
                this.executePendingActions();
            } else {
                throw new Error(result.message || 'Login failed');
            }
        } catch (error) {
            this.showFormError(form, error.message);
            this.trackEvent('login_failed', { email: data.email, error: error.message });
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async handleRegistration(form) {
        const formData = new FormData(form);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            userType: formData.get('userType'),
            newsletter: formData.get('newsletter') === 'on'
        };
        
        // Validate
        if (!this.validateEmail(data.email)) {
            this.showFormError(form, 'Please enter a valid email address');
            return;
        }
        
        if (data.password.length < 8) {
            this.showFormError(form, 'Password must be at least 8 characters');
            return;
        }
        
        if (!data.userType) {
            this.showFormError(form, 'Please select an account type');
            return;
        }
        
        // Show loading
        const submitBtn = form.querySelector('.btn-auth-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;
        
        try {
            const result = await this.register(data);
            
            if (result.success) {
                // Update state
                this.state.isAuthenticated = true;
                this.state.user = result.user;
                this.state.token = result.token;
                this.state.refreshToken = result.refreshToken;
                this.state.sessionStart = new Date();
                this.state.lastActivity = new Date();
                
                // Save session
                this.saveSession();
                
                // Update UI
                this.updateAuthUI();
                
                // Close modal
                this.closeAuthModal('registerModal');
                
                // Show success
                this.showNotification('Account created successfully!', 'success');
                
                // Track registration
                this.trackEvent('registration_success', { email: data.email, userType: data.userType });
                
                // Show welcome message
                this.showWelcomeMessage(data.userType);
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            this.showFormError(form, error.message);
            this.trackEvent('registration_failed', { email: data.email, error: error.message });
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async handleForgotPassword(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        
        if (!this.validateEmail(email)) {
            this.showFormError(form, 'Please enter a valid email address');
            return;
        }
        
        const submitBtn = form.querySelector('.btn-auth-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            await this.requestPasswordReset(email);
            
            // Show success
            this.showFormSuccess(form, 'Reset instructions sent to your email');
            
            // Close modal after delay
            setTimeout(() => {
                this.closeAuthModal('forgotPasswordModal');
                this.showLoginModal();
            }, 3000);
            
        } catch (error) {
            this.showFormError(form, error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async login(credentials) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Mock successful login
                const mockUser = {
                    id: 'user_' + Date.now(),
                    firstName: 'John',
                    lastName: 'Doe',
                    email: credentials.email,
                    userType: 'job_seeker',
                    avatar: 'https://via.placeholder.com/100',
                    profileComplete: false,
                    createdAt: new Date().toISOString()
                };
                
                resolve({
                    success: true,
                    user: mockUser,
                    token: 'mock_jwt_token_' + Date.now(),
                    refreshToken: 'mock_refresh_token_' + Date.now()
                });
            }, 1500);
        });
    }
    
    async register(userData) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Mock successful registration
                const mockUser = {
                    id: 'user_' + Date.now(),
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    userType: userData.userType,
                    avatar: `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}`,
                    profileComplete: false,
                    createdAt: new Date().toISOString()
                };
                
                resolve({
                    success: true,
                    user: mockUser,
                    token: 'mock_jwt_token_' + Date.now(),
                    refreshToken: 'mock_refresh_token_' + Date.now()
                });
            }, 2000);
        });
    }
    
    async requestPasswordReset(email) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Password reset requested for:', email);
                resolve({ success: true });
            }, 1500);
        });
    }
    
    initiateSocialLogin(provider) {
        // Redirect to social login endpoint
        const redirectUrl = `${this.config.apiUrl}/social/${provider}?redirect=${encodeURIComponent(window.location.href)}`;
        window.location.href = redirectUrl;
    }
    
    async refreshAuthToken() {
        if (!this.state.refreshToken) {
            this.logout();
            return;
        }
        
        try {
            const result = await this.refreshToken(this.state.refreshToken);
            
            if (result.success) {
                this.state.token = result.token;
                this.state.refreshToken = result.refreshToken;
                this.saveSession();
                
                console.log('Token refreshed successfully');
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
        }
    }
    
    async refreshToken(refreshToken) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    token: 'mock_jwt_token_' + Date.now(),
                    refreshToken: 'mock_refresh_token_' + Date.now()
                });
            }, 1000);
        });
    }
    
    logout() {
        // Clear session
        this.clearSession();
        
        // Show notification
        this.showNotification('Successfully logged out', 'info');
        
        // Track logout
        this.trackEvent('logout');
        
        // Redirect to home page if not already there
        if (!window.location.pathname.includes('/') || window.location.pathname !== '/') {
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        }
    }
    
    showLoginModal() {
        this.closeAllModals();
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus email input
            const emailInput = modal.querySelector('#loginEmail');
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 300);
            }
        }
    }
    
    showRegisterModal() {
        this.closeAllModals();
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus first name input
            const firstNameInput = modal.querySelector('#registerFirstName');
            if (firstNameInput) {
                setTimeout(() => firstNameInput.focus(), 300);
            }
        }
    }
    
    showForgotPasswordModal() {
        this.closeAllModals();
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus email input
            const emailInput = modal.querySelector('#forgotEmail');
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 300);
            }
        }
    }
    
    closeAuthModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Clear form errors
            const form = modal.querySelector('form');
            if (form) {
                this.clearFormErrors(form);
                form.reset();
            }
        }
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.auth-modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
    
    updateAuthUI() {
        const loginButtons = document.querySelectorAll('.btn-login, [data-auth-state="logged-out"]');
        const logoutButtons = document.querySelectorAll('.btn-logout, [data-auth-state="logged-in"]');
        const userDropdown = document.getElementById('userDropdown');
        
        if (this.state.isAuthenticated && this.state.user) {
            // User is logged in
            loginButtons.forEach(el => {
                el.style.display = 'none';
                el.classList.remove('active');
            });
            
            logoutButtons.forEach(el => {
                el.style.display = 'block';
                el.classList.add('active');
            });
            
            // Update user dropdown
            if (userDropdown) {
                userDropdown.style.display = 'block';
                
                // Update user info
                const userName = userDropdown.querySelector('.user-name');
                const userFullName = userDropdown.querySelector('.user-fullname');
                const userEmail = userDropdown.querySelector('.user-email');
                const userAvatar = userDropdown.querySelector('.user-avatar');
                const userAvatarLarge = userDropdown.querySelector('.user-avatar-large');
                const userBadge = userDropdown.querySelector('.user-badge');
                
                if (userName) userName.textContent = `${this.state.user.firstName} ${this.state.user.lastName}`;
                if (userFullName) userFullName.textContent = `${this.state.user.firstName} ${this.state.user.lastName}`;
                if (userEmail) userEmail.textContent = this.state.user.email;
                if (userAvatar) userAvatar.src = this.state.user.avatar;
                if (userAvatarLarge) userAvatarLarge.src = this.state.user.avatar;
                if (userBadge) userBadge.textContent = this.state.user.userType;
            }
        } else {
            // User is logged out
            loginButtons.forEach(el => {
                el.style.display = 'block';
                el.classList.add('active');
            });
            
            logoutButtons.forEach(el => {
                el.style.display = 'none';
                el.classList.remove('active');
            });
            
            // Hide user dropdown
            if (userDropdown) {
                userDropdown.style.display = 'none';
            }
        }
    }
    
    showFormError(form, message) {
        // Remove existing errors
        this.clearFormErrors(form);
        
        // Create error element
        const errorEl = document.createElement('div');
        errorEl.className = 'auth-error';
        errorEl.textContent = message;
        
        // Insert at top of form
        form.insertBefore(errorEl, form.firstChild);
        
        // Scroll to error
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    showFormSuccess(form, message) {
        // Remove existing messages
        const existingSuccess = form.querySelector('.auth-success');
        if (existingSuccess) existingSuccess.remove();
        
        // Create success element
        const successEl = document.createElement('div');
        successEl.className = 'auth-success';
        successEl.textContent = message;
        
        // Insert at top of form
        form.insertBefore(successEl, form.firstChild);
    }
    
    clearFormErrors(form) {
        const errors = form.querySelectorAll('.auth-error, .auth-success');
        errors.forEach(error => error.remove());
        
        // Clear input errors
        const inputs = form.querySelectorAll('input.error, select.error');
        inputs.forEach(input => {
            input.classList.remove('error');
            input.setCustomValidity('');
        });
    }
    
    showWelcomeMessage(userType) {
        const messages = {
            job_seeker: 'Welcome to ZewedJobs! Start exploring thousands of job opportunities tailored for you.',
            employer: 'Welcome to ZewedJobs! Post your job openings and find the perfect candidates.',
            recruiter: 'Welcome to ZewedJobs! Connect with top talent and streamline your recruitment process.'
        };
        
        const message = messages[userType] || 'Welcome to ZewedJobs!';
        
        // Show welcome modal or notification
        this.showNotification(message, 'success', 5000);
        
        // If profile is incomplete, prompt to complete it
        if (!this.state.user?.profileComplete) {
            setTimeout(() => {
                if (confirm('Complete your profile to get better job matches?')) {
                    window.location.href = '/profile/edit';
                }
            }, 1000);
        }
    }
    
    setupTokenRefresh() {
        // Check token expiry every minute
        this.tokenRefreshInterval = setInterval(() => {
            const expiry = localStorage.getItem(this.config.tokenExpiryKey);
            if (expiry) {
                const timeToExpiry = parseInt(expiry) - Date.now();
                if (timeToExpiry < this.config.refreshThreshold) {
                    this.refreshAuthToken();
                }
            }
        }, 60000); // Check every minute
    }
    
    setupActivityTracking() {
        // Update last activity on user interaction
        const updateActivity = () => {
            this.state.lastActivity = new Date();
        };
        
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });
        
        // Check for inactivity
        this.activityCheckInterval = setInterval(() => {
            if (this.state.isAuthenticated && this.state.lastActivity) {
                const inactiveTime = Date.now() - this.state.lastActivity.getTime();
                
                if (inactiveTime > this.config.sessionTimeout) {
                    console.log('Session expired due to inactivity');
                    this.logout();
                } else if (inactiveTime > this.config.sessionTimeout * 0.8) {
                    // Warn user 20% before expiry
                    this.showSessionWarning();
                }
            }
        }, 60000); // Check every minute
    }
    
    showSessionWarning() {
        // Show warning notification
        const warning = this.showNotification(
            'Your session will expire soon due to inactivity. Click to extend.',
            'warning',
            10000
        );
        
        warning?.addEventListener('click', () => {
            this.state.lastActivity = new Date();
            this.showNotification('Session extended', 'success');
        });
    }
    
    checkSessionExpiry() {
        const sessionStart = this.state.sessionStart;
        if (sessionStart) {
            const sessionAge = Date.now() - sessionStart.getTime();
            if (sessionAge > this.config.sessionTimeout) {
                console.log('Session expired');
                this.logout();
            }
        }
    }
    
    // Utility methods
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        // Use app notification system if available
        if (window.app && window.app.showNotification) {
            return window.app.showNotification(message, type, duration);
        } else {
            // Simple fallback
            alert(message);
            return null;
        }
    }
    
    trackEvent(eventName, data = {}) {
        if (window.app && window.app.trackEvent) {
            window.app.trackEvent('authentication', eventName, JSON.stringify(data));
        }
    }
    
    executePendingActions() {
        // Execute any actions that were pending authentication
        this.state.pendingActions.forEach(action => {
            try {
                action();
            } catch (error) {
                console.error('Error executing pending action:', error);
            }
        });
        
        this.state.pendingActions = [];
    }
    
    // Public API methods
    isAuthenticated() {
        return this.state.isAuthenticated;
    }
    
    getUser() {
        return this.state.user;
    }
    
    getToken() {
        return this.state.token;
    }
    
    requireAuth(action) {
        if (this.state.isAuthenticated) {
            action();
        } else {
            // Store action and prompt login
            this.state.pendingActions.push(action);
            this.showLoginModal();
            this.showNotification('Please sign in to continue', 'warning');
        }
    }
    
    async updateProfile(profileData) {
        this.requireAuth(async () => {
            try {
                // Simulate API call
                const result = await this.saveProfile(profileData);
                
                if (result.success) {
                    // Update user in state
                    this.state.user = { ...this.state.user, ...profileData, profileComplete: true };
                    this.saveSession();
                    
                    this.showNotification('Profile updated successfully!', 'success');
                    return result.user;
                }
            } catch (error) {
                this.showNotification('Failed to update profile', 'error');
                throw error;
            }
        });
    }
    
    async saveProfile(profileData) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    user: { ...this.state.user, ...profileData, profileComplete: true }
                });
            }, 1500);
        });
    }
    
    async changePassword(currentPassword, newPassword) {
        this.requireAuth(async () => {
            try {
                // Simulate API call
                await this.updatePassword(currentPassword, newPassword);
                this.showNotification('Password changed successfully', 'success');
            } catch (error) {
                this.showNotification('Failed to change password', 'error');
                throw error;
            }
        });
    }
    
    async updatePassword(currentPassword, newPassword) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 1500);
        });
    }
    
    async deleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                // Simulate API call
                await this.performAccountDeletion();
                this.clearSession();
                this.showNotification('Account deleted successfully', 'info');
                window.location.href = '/';
            } catch (error) {
                this.showNotification('Failed to delete account', 'error');
            }
        }
    }
    
    async performAccountDeletion() {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 2000);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.userAuth = new UserAuth();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserAuth;
}
