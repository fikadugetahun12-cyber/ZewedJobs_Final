/**
 * ZewedJobs - Main Application Controller
 * Initializes and coordinates all modules
 */

class ZewedJobsApp {
    constructor() {
        this.modules = {};
        this.config = {
            apiUrl: 'https://api.zewedjobs.com/v1',
            environment: 'production',
            debug: false,
            version: '1.0.0'
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🚀 ZewedJobs App Initializing...');
        
        // Load configuration from localStorage or defaults
        this.loadConfig();
        
        // Initialize core modules
        this.initializeModules();
        
        // Set up global event listeners
        this.setupGlobalEvents();
        
        // Check authentication status
        this.checkAuth();
        
        // Initialize analytics
        this.initAnalytics();
        
        console.log('✅ ZewedJobs App Ready!');
    }
    
    loadConfig() {
        // Load saved config from localStorage
        const savedConfig = localStorage.getItem('zewedjobs_config');
        if (savedConfig) {
            try {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            } catch (error) {
                console.error('Error loading config:', error);
            }
        }
        
        // Detect environment
        this.config.environment = window.location.hostname === 'localhost' || 
                                 window.location.hostname === '127.0.0.1' ? 
                                 'development' : 'production';
        
        // Enable debug in development
        this.config.debug = this.config.environment === 'development';
        
        // Save config
        this.saveConfig();
    }
    
    saveConfig() {
        localStorage.setItem('zewedjobs_config', JSON.stringify(this.config));
    }
    
    initializeModules() {
        // Initialize modules based on page
        const page = this.getCurrentPage();
        
        switch (page) {
            case 'home':
                this.initHomePage();
                break;
            case 'jobs':
                this.initJobsPage();
                break;
            case 'courses':
                this.initCoursesPage();
                break;
            case 'events':
                this.initEventsPage();
                break;
            case 'dashboard':
                this.initDashboardPage();
                break;
            case 'admin':
                this.initAdminPage();
                break;
        }
        
        // Initialize common modules
        this.initCommonModules();
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path === '/' || path.includes('index')) return 'home';
        if (path.includes('jobs')) return 'jobs';
        if (path.includes('courses')) return 'courses';
        if (path.includes('events')) return 'events';
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('admin')) return 'admin';
        
        return 'home';
    }
    
    initHomePage() {
        // Initialize hero animations
        this.initHeroAnimations();
        
        // Initialize job search
        if (typeof JobSearch !== 'undefined') {
            this.modules.jobSearch = new JobSearch();
        }
        
        // Initialize featured jobs carousel
        this.initFeaturedJobsCarousel();
    }
    
    initJobsPage() {
        // Initialize advanced job search
        if (typeof JobSearch !== 'undefined') {
            this.modules.jobSearch = new JobSearch();
            this.modules.jobSearch.initAdvancedSearch();
        }
        
        // Initialize job filters
        this.initJobFilters();
        
        // Initialize job applications tracking
        this.initJobApplications();
    }
    
    initCoursesPage() {
        // Initialize course search and filters
        this.initCourseFilters();
        
        // Initialize enrollment system
        this.initCourseEnrollment();
    }
    
    initEventsPage() {
        // Initialize event calendar
        this.initEventCalendar();
        
        // Initialize event registration
        this.initEventRegistration();
    }
    
    initDashboardPage() {
        // Initialize user dashboard
        this.initUserDashboard();
        
        // Initialize activity feed
        this.initActivityFeed();
    }
    
    initAdminPage() {
        // Initialize admin dashboard
        this.initAdminDashboard();
        
        // Initialize admin analytics
        this.initAdminAnalytics();
    }
    
    initCommonModules() {
        // Initialize authentication
        if (typeof UserAuth !== 'undefined') {
            this.modules.auth = new UserAuth();
        }
        
        // Initialize AI chat if enabled
        if (this.config.features?.aiChat) {
            this.initAIChat();
        }
        
        // Initialize notifications
        this.initNotifications();
        
        // Initialize theme switcher
        this.initThemeSwitcher();
        
        // Initialize language switcher
        this.initLanguageSwitcher();
    }
    
    initHeroAnimations() {
        // Animate hero elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe hero elements
        document.querySelectorAll('.hero-title, .hero-subtitle, .search-form-wrapper')
            .forEach(el => observer.observe(el));
    }
    
    initFeaturedJobsCarousel() {
        const carousel = document.querySelector('.featured-jobs-carousel');
        if (!carousel) return;
        
        // Initialize carousel logic
        // This would be implemented with a carousel library like Swiper
        // For now, we'll set up basic navigation
        const nextBtn = carousel.querySelector('.carousel-next');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const slides = carousel.querySelectorAll('.job-card');
        
        if (nextBtn && prevBtn) {
            let currentSlide = 0;
            
            const updateCarousel = () => {
                slides.forEach((slide, index) => {
                    slide.style.transform = `translateX(${(index - currentSlide) * 100}%)`;
                });
            };
            
            nextBtn.addEventListener('click', () => {
                currentSlide = (currentSlide + 1) % slides.length;
                updateCarousel();
            });
            
            prevBtn.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                updateCarousel();
            });
            
            updateCarousel();
        }
    }
    
    initJobFilters() {
        const filterToggle = document.querySelector('.filter-toggle');
        const filterPanel = document.querySelector('.filter-panel');
        
        if (filterToggle && filterPanel) {
            filterToggle.addEventListener('click', () => {
                filterPanel.classList.toggle('active');
            });
            
            // Close filter panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!filterPanel.contains(e.target) && !filterToggle.contains(e.target)) {
                    filterPanel.classList.remove('active');
                }
            });
        }
    }
    
    initJobApplications() {
        // Track job applications
        const applyButtons = document.querySelectorAll('.btn-apply');
        
        applyButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const jobId = button.dataset.jobId;
                const jobTitle = button.dataset.jobTitle;
                
                // Show loading state
                const originalText = button.textContent;
                button.textContent = 'Applying...';
                button.disabled = true;
                
                try {
                    // Simulate API call
                    await this.applyToJob(jobId);
                    
                    // Update UI
                    button.textContent = 'Applied ✓';
                    button.classList.add('applied');
                    
                    // Track in analytics
                    this.trackEvent('job_application', {
                        job_id: jobId,
                        job_title: jobTitle
                    });
                    
                    // Show success message
                    this.showNotification('Application submitted successfully!', 'success');
                } catch (error) {
                    button.textContent = originalText;
                    button.disabled = false;
                    this.showNotification('Failed to submit application. Please try again.', 'error');
                }
            });
        });
    }
    
    async applyToJob(jobId) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // In a real app, this would be an API call
                console.log(`Applying to job ${jobId}`);
                resolve({ success: true, jobId });
            }, 1500);
        });
    }
    
    initCourseFilters() {
        // Initialize course category filters
        const categoryFilters = document.querySelectorAll('.course-category-filter');
        
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                const category = filter.dataset.category;
                this.filterCoursesByCategory(category);
                
                // Update active state
                categoryFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
            });
        });
    }
    
    filterCoursesByCategory(category) {
        const courses = document.querySelectorAll('.course-card');
        
        courses.forEach(course => {
            const courseCategory = course.dataset.category;
            
            if (category === 'all' || courseCategory === category) {
                course.style.display = 'block';
                setTimeout(() => {
                    course.style.opacity = '1';
                    course.style.transform = 'translateY(0)';
                }, 10);
            } else {
                course.style.opacity = '0';
                course.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    course.style.display = 'none';
                }, 300);
            }
        });
    }
    
    initCourseEnrollment() {
        const enrollButtons = document.querySelectorAll('.btn-enroll');
        
        enrollButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const courseId = button.dataset.courseId;
                const courseTitle = button.dataset.courseTitle;
                
                // Show enrollment modal
                this.showEnrollmentModal(courseId, courseTitle);
            });
        });
    }
    
    showEnrollmentModal(courseId, courseTitle) {
        const modalHtml = `
            <div class="modal-overlay active" id="enrollmentModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Enroll in "${courseTitle}"</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="enrollmentForm">
                            <div class="form-group">
                                <label for="paymentMethod">Select Payment Method</label>
                                <select id="paymentMethod" class="form-control">
                                    <option value="credit_card">Credit Card</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>
                            
                            <div class="course-summary">
                                <h4>Course Summary</h4>
                                <div class="summary-item">
                                    <span>Course Price</span>
                                    <span class="price">$99.99</span>
                                </div>
                                <div class="summary-item">
                                    <span>Tax</span>
                                    <span class="price">$9.99</span>
                                </div>
                                <div class="summary-item total">
                                    <span>Total</span>
                                    <span class="price">$109.98</span>
                                </div>
                            </div>
                            
                            <div class="form-group checkbox">
                                <input type="checkbox" id="terms" required>
                                <label for="terms">I agree to the terms and conditions</label>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-block">Complete Enrollment</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.setupEnrollmentForm(courseId);
    }
    
    setupEnrollmentForm(courseId) {
        const modal = document.querySelector('#enrollmentModal');
        const closeBtn = modal.querySelector('.modal-close');
        const form = modal.querySelector('#enrollmentForm');
        
        // Close modal
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            try {
                // Simulate enrollment process
                await this.processEnrollment(courseId);
                
                // Show success
                this.showNotification('Successfully enrolled in course!', 'success');
                modal.remove();
                
                // Update UI
                const enrollBtn = document.querySelector(`[data-course-id="${courseId}"]`);
                if (enrollBtn) {
                    enrollBtn.textContent = 'Enrolled ✓';
                    enrollBtn.disabled = true;
                    enrollBtn.classList.add('enrolled');
                }
            } catch (error) {
                submitBtn.textContent = 'Complete Enrollment';
                submitBtn.disabled = false;
                this.showNotification('Enrollment failed. Please try again.', 'error');
            }
        });
    }
    
    async processEnrollment(courseId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log(`Enrolling in course ${courseId}`);
                resolve({ success: true, courseId });
            }, 2000);
        });
    }
    
    initEventCalendar() {
        const calendarEl = document.querySelector('.events-calendar');
        if (!calendarEl) return;
        
        // Initialize calendar
        this.calendar = {
            currentDate: new Date(),
            
            render: function() {
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                
                // Render calendar UI
                this.renderMonthView(year, month);
            },
            
            renderMonthView: function(year, month) {
                // Calendar rendering logic would go here
                // For now, we'll just update the calendar title
                const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];
                
                const calendarTitle = calendarEl.querySelector('.calendar-title');
                if (calendarTitle) {
                    calendarTitle.textContent = `${monthNames[month]} ${year}`;
                }
            },
            
            nextMonth: function() {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
            },
            
            prevMonth: function() {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
            }
        };
        
        // Set up calendar navigation
        const nextBtn = calendarEl.querySelector('.calendar-next');
        const prevBtn = calendarEl.querySelector('.calendar-prev');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.calendar.nextMonth();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.calendar.prevMonth();
            });
        }
        
        // Initial render
        this.calendar.render();
    }
    
    initEventRegistration() {
        const registerButtons = document.querySelectorAll('.btn-register');
        
        registerButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                const eventId = button.dataset.eventId;
                const eventTitle = button.dataset.eventTitle;
                
                this.showRegistrationModal(eventId, eventTitle);
            });
        });
    }
    
    showRegistrationModal(eventId, eventTitle) {
        const modalHtml = `
            <div class="modal-overlay active" id="registrationModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Register for "${eventTitle}"</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="registrationForm">
                            <div class="form-group">
                                <label for="attendeeName">Full Name</label>
                                <input type="text" id="attendeeName" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="attendeeEmail">Email Address</label>
                                <input type="email" id="attendeeEmail" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="attendeeCompany">Company (Optional)</label>
                                <input type="text" id="attendeeCompany" class="form-control">
                            </div>
                            
                            <div class="form-group">
                                <label for="dietaryRequirements">Dietary Requirements</label>
                                <textarea id="dietaryRequirements" class="form-control" rows="3" placeholder="Any dietary restrictions or allergies?"></textarea>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-block">Complete Registration</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.setupRegistrationForm(eventId);
    }
    
    setupRegistrationForm(eventId) {
        const modal = document.querySelector('#registrationModal');
        const closeBtn = modal.querySelector('.modal-close');
        const form = modal.querySelector('#registrationForm');
        
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            try {
                await this.processRegistration(eventId, {
                    name: form.querySelector('#attendeeName').value,
                    email: form.querySelector('#attendeeEmail').value,
                    company: form.querySelector('#attendeeCompany').value,
                    dietary: form.querySelector('#dietaryRequirements').value
                });
                
                this.showNotification('Successfully registered for event!', 'success');
                modal.remove();
                
                // Update UI
                const registerBtn = document.querySelector(`[data-event-id="${eventId}"]`);
                if (registerBtn) {
                    registerBtn.textContent = 'Registered ✓';
                    registerBtn.disabled = true;
                    registerBtn.classList.add('registered');
                }
            } catch (error) {
                submitBtn.textContent = 'Complete Registration';
                submitBtn.disabled = false;
                this.showNotification('Registration failed. Please try again.', 'error');
            }
        });
    }
    
    async processRegistration(eventId, data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log(`Registering for event ${eventId}:`, data);
                resolve({ success: true, eventId });
            }, 1500);
        });
    }
    
    initUserDashboard() {
        // Initialize dashboard widgets
        this.initDashboardWidgets();
        
        // Initialize user profile
        this.initUserProfile();
        
        // Initialize activity timeline
        this.initActivityTimeline();
    }
    
    initDashboardWidgets() {
        // Initialize progress bars
        const progressBars = document.querySelectorAll('.progress-bar');
        
        progressBars.forEach(bar => {
            const progress = bar.dataset.progress || 0;
            const fill = bar.querySelector('.progress-fill');
            
            if (fill) {
                setTimeout(() => {
                    fill.style.width = `${progress}%`;
                }, 300);
            }
        });
        
        // Initialize charts
        this.initDashboardCharts();
    }
    
    initDashboardCharts() {
        // This would initialize charts using a library like Chart.js
        // For now, we'll just log
        console.log('Initializing dashboard charts...');
    }
    
    initUserProfile() {
        const editProfileBtn = document.querySelector('.btn-edit-profile');
        const profileForm = document.querySelector('#profileForm');
        
        if (editProfileBtn && profileForm) {
            editProfileBtn.addEventListener('click', () => {
                profileForm.classList.toggle('editing');
                
                if (profileForm.classList.contains('editing')) {
                    editProfileBtn.textContent = 'Save Profile';
                    this.enableFormEditing(profileForm);
                } else {
                    editProfileBtn.textContent = 'Edit Profile';
                    this.disableFormEditing(profileForm);
                    this.saveProfile();
                }
            });
        }
    }
    
    enableFormEditing(form) {
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.removeAttribute('disabled');
            input.classList.add('editing');
        });
    }
    
    disableFormEditing(form) {
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.setAttribute('disabled', 'disabled');
            input.classList.remove('editing');
        });
    }
    
    async saveProfile() {
        // Save profile data
        this.showNotification('Profile updated successfully!', 'success');
    }
    
    initActivityTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        // Animate timeline items on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, { threshold: 0.1 });
        
        timelineItems.forEach(item => observer.observe(item));
    }
    
    initAdminDashboard() {
        // Initialize admin-specific functionality
        this.initAdminTables();
        this.initAdminCharts();
        this.initAdminModals();
    }
    
    initAdminTables() {
        // Initialize data tables
        const tables = document.querySelectorAll('.admin-table');
        
        tables.forEach(table => {
            // Add sorting functionality
            const headers = table.querySelectorAll('th[data-sortable]');
            
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    const column = header.dataset.column;
                    const direction = header.dataset.direction === 'asc' ? 'desc' : 'asc';
                    
                    this.sortTable(table, column, direction);
                    
                    // Update sort indicator
                    headers.forEach(h => h.classList.remove('sorting-asc', 'sorting-desc'));
                    header.classList.add(`sorting-${direction}`);
                    header.dataset.direction = direction;
                });
            });
        });
    }
    
    sortTable(table, column, direction) {
        // Basic table sorting implementation
        console.log(`Sorting table by ${column} in ${direction} order`);
    }
    
    initAdminCharts() {
        // Initialize admin charts
        console.log('Initializing admin charts...');
    }
    
    initAdminModals() {
        // Initialize admin modals
        const actionButtons = document.querySelectorAll('.action-btn');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const itemId = button.dataset.id;
                
                switch (action) {
                    case 'edit':
                        this.showEditModal(itemId);
                        break;
                    case 'delete':
                        this.showDeleteModal(itemId);
                        break;
                    case 'view':
                        this.showViewModal(itemId);
                        break;
                }
            });
        });
    }
    
    showEditModal(itemId) {
        console.log(`Edit item ${itemId}`);
    }
    
    showDeleteModal(itemId) {
        const modalHtml = `
            <div class="modal-overlay active" id="deleteModal">
                <div class="modal modal-sm">
                    <div class="modal-header">
                        <h3>Confirm Deletion</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelDelete">Cancel</button>
                        <button class="btn btn-danger" id="confirmDelete">Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.querySelector('#deleteModal');
        const cancelBtn = modal.querySelector('#cancelDelete');
        const confirmBtn = modal.querySelector('#confirmDelete');
        
        cancelBtn.addEventListener('click', () => modal.remove());
        confirmBtn.addEventListener('click', () => {
            this.deleteItem(itemId);
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    async deleteItem(itemId) {
        try {
            // Simulate delete API call
            console.log(`Deleting item ${itemId}`);
            this.showNotification('Item deleted successfully', 'success');
        } catch (error) {
            this.showNotification('Failed to delete item', 'error');
        }
    }
    
    showViewModal(itemId) {
        console.log(`View item ${itemId}`);
    }
    
    initAdminAnalytics() {
        // Initialize admin analytics dashboard
        console.log('Initializing admin analytics...');
    }
    
    initAIChat() {
        // Initialize AI chat if the module exists
        if (typeof AIChat !== 'undefined') {
            this.modules.aiChat = new AIChat();
        }
    }
    
    initNotifications() {
        // Initialize notification system
        this.notificationQueue = [];
        this.notificationActive = false;
        
        // Create notification container
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        
        document.body.appendChild(container);
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Set styles based on type
        const typeStyles = {
            success: { background: '#10b981', color: 'white' },
            error: { background: '#ef4444', color: 'white' },
            warning: { background: '#f59e0b', color: 'white' },
            info: { background: '#3b82f6', color: 'white' }
        };
        
        const style = typeStyles[type] || typeStyles.info;
        
        notification.style.cssText = `
            padding: 12px 16px;
            border-radius: 8px;
            background: ${style.background};
            color: ${style.color};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            justify-content: space-between;
            align-items: center;
            animation: slideInRight 0.3s ease;
            transform: translateX(120%);
        `;
        
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" style="background:none;border:none;color:currentColor;font-size:20px;cursor:pointer;line-height:1;">&times;</button>
        `;
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }
        
        return notification;
    }
    
    hideNotification(notification) {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    initThemeSwitcher() {
        const themeToggle = document.querySelector('#themeToggle');
        if (!themeToggle) return;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            this.setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update toggle button text
        const themeToggle = document.querySelector('#themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
            themeToggle.title = `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`;
        }
    }
    
    initLanguageSwitcher() {
        const langSelect = document.querySelector('#languageSelect');
        if (!langSelect) return;
        
        // Load saved language
        const savedLang = localStorage.getItem('language') || 'en';
        langSelect.value = savedLang;
        
        langSelect.addEventListener('change', (e) => {
            const lang = e.target.value;
            this.setLanguage(lang);
            localStorage.setItem('language', lang);
        });
    }
    
    setLanguage(lang) {
        // This would load language files in a real app
        console.log(`Setting language to ${lang}`);
        
        // For now, just update the HTML lang attribute
        document.documentElement.lang = lang;
        
        // Show notification
        this.showNotification(`Language changed to ${this.getLanguageName(lang)}`, 'info');
    }
    
    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German'
        };
        return languages[code] || code;
    }
    
    setupGlobalEvents() {
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
        
        // Handle offline/online events
        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may not work.', 'warning', 0);
        });
        
        window.addEventListener('online', () => {
            this.showNotification('You are back online!', 'success');
        });
        
        // Handle beforeunload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }
    
    handleResize() {
        // Update responsive classes
        const width = window.innerWidth;
        
        if (width < 576) {
            document.body.classList.add('mobile-xs');
        } else {
            document.body.classList.remove('mobile-xs');
        }
        
        if (width < 768) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
        
        if (width < 1024) {
            document.body.classList.add('tablet');
        } else {
            document.body.classList.remove('tablet');
        }
        
        // Notify modules of resize
        Object.values(this.modules).forEach(module => {
            if (module.handleResize) {
                module.handleResize(width);
            }
        });
    }
    
    onPageHidden() {
        // Pause animations, videos, etc.
        console.log('Page hidden');
    }
    
    onPageVisible() {
        // Resume animations, update data
        console.log('Page visible');
    }
    
    hasUnsavedChanges() {
        // Check forms for unsaved changes
        const forms = document.querySelectorAll('form');
        return Array.from(forms).some(form => {
            return form.classList.contains('dirty') || form.dataset.dirty === 'true';
        });
    }
    
    checkAuth() {
        // Check authentication status
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            // Validate token
            this.validateToken(token).then(isValid => {
                if (isValid) {
                    this.updateAuthUI(true);
                } else {
                    this.updateAuthUI(false);
                    localStorage.removeItem('auth_token');
                }
            });
        } else {
            this.updateAuthUI(false);
        }
    }
    
    async validateToken(token) {
        // Validate token with server
        try {
            // Simulate API call
            return new Promise(resolve => {
                setTimeout(() => {
                    // In a real app, this would validate the token
                    resolve(true);
                }, 100);
            });
        } catch (error) {
            return false;
        }
    }
    
    updateAuthUI(isAuthenticated) {
        // Update UI based on auth status
        const authElements = document.querySelectorAll('[data-auth]');
        
        authElements.forEach(element => {
            const requiredAuth = element.dataset.auth === 'true';
            
            if (requiredAuth && !isAuthenticated) {
                element.style.display = 'none';
            } else if (!requiredAuth && isAuthenticated) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        });
        
        // Update auth-specific elements
        const loginBtn = document.querySelector('.btn-login');
        const logoutBtn = document.querySelector('.btn-logout');
        const userMenu = document.querySelector('.user-menu');
        
        if (isAuthenticated) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'flex';
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'none';
        }
    }
    
    initAnalytics() {
        // Initialize analytics tracking
        if (this.config.analyticsEnabled) {
            this.trackPageView();
            
            // Track custom events
            this.setupAnalyticsTracking();
        }
    }
    
    trackPageView() {
        const page = this.getCurrentPage();
        const url = window.location.pathname;
        
        console.log(`📊 Analytics: Page view - ${page} (${url})`);
        
        // In a real app, send to analytics service
        if (window.ga) {
            window.ga('send', 'pageview', url);
        }
    }
    
    trackEvent(category, action, label, value) {
        console.log(`📊 Analytics Event: ${category} - ${action}`, { label, value });
        
        // In a real app, send to analytics service
        if (window.ga) {
            window.ga('send', 'event', category, action, label, value);
        }
    }
    
    setupAnalyticsTracking() {
        // Track clicks on important buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, a');
            if (button) {
                const action = button.textContent || button.dataset.action || 'click';
                const category = button.dataset.category || 'engagement';
                
                this.trackEvent(category, action);
            }
        });
        
        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formId = form.id || 'unknown_form';
            this.trackEvent('forms', 'submit', formId);
        });
    }
    
    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    formatDate(date, format = 'medium') {
        const dateObj = new Date(date);
        const options = {
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            medium: { year: 'numeric', month: 'long', day: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        };
        
        return dateObj.toLocaleDateString(undefined, options[format] || options.medium);
    }
    
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    // Public API
    getModule(name) {
        return this.modules[name];
    }
    
    setConfig(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }
    
    getConfig(key) {
        return this.config[key];
    }
    
    // Error handling
    handleError(error, context = '') {
        console.error(`❌ Error${context ? ` in ${context}` : ''}:`, error);
        
        // Show user-friendly error message
        const message = error.message || 'An unexpected error occurred';
        this.showNotification(`${message}. Please try again.`, 'error');
        
        // Log to error tracking service in production
        if (this.config.environment === 'production') {
            this.logErrorToService(error, context);
        }
    }
    
    logErrorToService(error, context) {
        // Send error to error tracking service
        const errorData = {
            message: error.message,
            stack: error.stack,
            context: context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        // In a real app, send to error tracking service
        console.log('📋 Error logged:', errorData);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ZewedJobsApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZewedJobsApp;
}
