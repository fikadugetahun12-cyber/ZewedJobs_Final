/**
 * ZewedJobs - Main Page JavaScript
 * Handles homepage and general site functionality
 */

class MainPage {
    constructor() {
        this.currentPage = this.detectPage();
        this.initialize();
    }
    
    detectPage() {
        const path = window.location.pathname;
        if (path === '/' || path.includes('index')) return 'home';
        if (path.includes('jobs')) return 'jobs';
        if (path.includes('courses')) return 'courses';
        if (path.includes('events')) return 'events';
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('admin')) return 'admin';
        return 'home';
    }
    
    initialize() {
        console.log(`📄 Initializing ${this.currentPage} page...`);
        
        // Initialize based on page
        switch (this.currentPage) {
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
        }
        
        // Initialize common functionality
        this.initCommon();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log(`✅ ${this.currentPage} page initialized`);
    }
    
    initHomePage() {
        // Hero animations
        this.initHeroAnimations();
        
        // Featured jobs slider
        this.initFeaturedJobsSlider();
        
        // Stats counter animation
        this.initStatsCounter();
        
        // Testimonials slider
        this.initTestimonialsSlider();
        
        // Newsletter subscription
        this.initNewsletterSubscription();
    }
    
    initHeroAnimations() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        
        // Animate hero elements on load
        const heroTitle = hero.querySelector('.hero-title');
        const heroSubtitle = hero.querySelector('.hero-subtitle');
        const searchForm = hero.querySelector('.search-form-wrapper');
        
        if (heroTitle) {
            heroTitle.style.opacity = '0';
            heroTitle.style.transform = 'translateY(20px)';
            setTimeout(() => {
                heroTitle.style.transition = 'all 0.8s ease';
                heroTitle.style.opacity = '1';
                heroTitle.style.transform = 'translateY(0)';
            }, 300);
        }
        
        if (heroSubtitle) {
            heroSubtitle.style.opacity = '0';
            heroSubtitle.style.transform = 'translateY(20px)';
            setTimeout(() => {
                heroSubtitle.style.transition = 'all 0.8s ease 0.2s';
                heroSubtitle.style.opacity = '1';
                heroSubtitle.style.transform = 'translateY(0)';
            }, 500);
        }
        
        if (searchForm) {
            searchForm.style.opacity = '0';
            searchForm.style.transform = 'translateY(20px)';
            setTimeout(() => {
                searchForm.style.transition = 'all 0.8s ease 0.4s';
                searchForm.style.opacity = '1';
                searchForm.style.transform = 'translateY(0)';
            }, 700);
        }
    }
    
    initFeaturedJobsSlider() {
        const slider = document.querySelector('.featured-jobs-slider');
        if (!slider) return;
        
        // Initialize slider with basic functionality
        const slides = slider.querySelectorAll('.job-card');
        const prevBtn = slider.querySelector('.slider-prev');
        const nextBtn = slider.querySelector('.slider-next');
        const dotsContainer = slider.querySelector('.slider-dots');
        
        if (!slides.length || !prevBtn || !nextBtn) return;
        
        let currentSlide = 0;
        const totalSlides = slides.length;
        
        // Create dots if container exists
        if (dotsContainer) {
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('button');
                dot.className = 'slider-dot';
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => this.goToSlide(i));
                dotsContainer.appendChild(dot);
            }
        }
        
        // Update slider display
        const updateSlider = () => {
            slides.forEach((slide, index) => {
                slide.style.display = index === currentSlide ? 'block' : 'none';
                slide.classList.toggle('active', index === currentSlide);
            });
            
            // Update dots
            if (dotsContainer) {
                const dots = dotsContainer.querySelectorAll('.slider-dot');
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentSlide);
                });
            }
            
            // Update button states
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === totalSlides - 1;
        };
        
        // Navigation functions
        this.nextSlide = () => {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateSlider();
            }
        };
        
        this.prevSlide = () => {
            if (currentSlide > 0) {
                currentSlide--;
                updateSlider();
            }
        };
        
        this.goToSlide = (index) => {
            if (index >= 0 && index < totalSlides) {
                currentSlide = index;
                updateSlider();
            }
        };
        
        // Event listeners
        prevBtn.addEventListener('click', this.prevSlide);
        nextBtn.addEventListener('click', this.nextSlide);
        
        // Auto-advance slides
        this.slideInterval = setInterval(this.nextSlide, 5000);
        
        // Pause on hover
        slider.addEventListener('mouseenter', () => {
            clearInterval(this.slideInterval);
        });
        
        slider.addEventListener('mouseleave', () => {
            this.slideInterval = setInterval(this.nextSlide, 5000);
        });
        
        // Initial update
        updateSlider();
    }
    
    initStatsCounter() {
        const counters = document.querySelectorAll('.stat-counter');
        
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target) || 0;
            const duration = parseInt(counter.dataset.duration) || 2000;
            const step = target / (duration / 16); // 60fps
            
            let current = 0;
            const updateCounter = () => {
                current += step;
                if (current >= target) {
                    counter.textContent = target.toLocaleString() + '+';
                } else {
                    counter.textContent = Math.floor(current).toLocaleString() + '+';
                    requestAnimationFrame(updateCounter);
                }
            };
            
            // Start animation when in viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(counter);
        });
    }
    
    initTestimonialsSlider() {
        const testimonials = document.querySelector('.testimonials-slider');
        if (!testimonials) return;
        
        // Simple testimonials rotation
        const quotes = testimonials.querySelectorAll('.testimonial');
        let currentQuote = 0;
        
        if (quotes.length <= 1) return;
        
        const rotateTestimonials = () => {
            quotes.forEach((quote, index) => {
                quote.classList.remove('active');
                if (index === currentQuote) {
                    quote.classList.add('active');
                }
            });
            
            currentQuote = (currentQuote + 1) % quotes.length;
        };
        
        // Rotate every 8 seconds
        this.testimonialInterval = setInterval(rotateTestimonials, 8000);
        
        // Manual navigation
        const dots = testimonials.querySelectorAll('.testimonial-dot');
        if (dots.length) {
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    clearInterval(this.testimonialInterval);
                    currentQuote = index;
                    rotateTestimonials();
                    // Restart auto-rotation after manual intervention
                    setTimeout(() => {
                        this.testimonialInterval = setInterval(rotateTestimonials, 8000);
                    }, 10000);
                });
            });
        }
    }
    
    initNewsletterSubscription() {
        const newsletterForm = document.getElementById('newsletterForm');
        if (!newsletterForm) return;
        
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            
            if (!this.validateEmail(email)) {
                this.showFormError(emailInput, 'Please enter a valid email address');
                return;
            }
            
            // Show loading state
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;
            
            try {
                // Simulate API call
                await this.subscribeToNewsletter(email);
                
                // Show success
                this.showFormSuccess(newsletterForm, 'Thank you for subscribing!');
                emailInput.value = '';
                
                // Track subscription
                if (window.app) {
                    window.app.trackEvent('newsletter', 'subscribe');
                }
            } catch (error) {
                this.showFormError(emailInput, 'Subscription failed. Please try again.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    async subscribeToNewsletter(email) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate API call
                console.log(`Subscribing email: ${email}`);
                resolve({ success: true });
            }, 1500);
        });
    }
    
    initJobsPage() {
        // Job search functionality
        this.initJobSearch();
        
        // Job filters
        this.initJobFilters();
        
        // Save job functionality
        this.initSaveJob();
        
        // Job application tracking
        this.initJobApplications();
        
        // Salary calculator
        this.initSalaryCalculator();
    }
    
    initJobSearch() {
        const searchForm = document.querySelector('.job-search-form');
        if (!searchForm) return;
        
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(searchForm);
            const searchData = {
                keywords: formData.get('keywords'),
                location: formData.get('location'),
                category: formData.get('category'),
                jobType: formData.get('jobType'),
                experience: formData.get('experience')
            };
            
            // Perform search
            this.performJobSearch(searchData);
            
            // Track search
            if (window.app) {
                window.app.trackEvent('job_search', 'search', JSON.stringify(searchData));
            }
        });
        
        // Real-time search suggestions
        const keywordInput = searchForm.querySelector('input[name="keywords"]');
        if (keywordInput) {
            keywordInput.addEventListener('input', this.debounce(() => {
                this.showSearchSuggestions(keywordInput.value);
            }, 300));
        }
    }
    
    async performJobSearch(searchData) {
        // Show loading state
        const resultsContainer = document.querySelector('.job-listings-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="loading-spinner">Searching jobs...</div>';
        }
        
        try {
            // In a real app, this would be an API call
            const jobs = await this.fetchJobs(searchData);
            this.displayJobResults(jobs);
        } catch (error) {
            this.showError('Failed to search jobs. Please try again.');
        }
    }
    
    async fetchJobs(searchData) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock job data
                const mockJobs = [
                    {
                        id: 1,
                        title: 'Frontend Developer',
                        company: 'TechCorp Inc.',
                        location: 'San Francisco, CA',
                        salary: '$120,000 - $150,000',
                        type: 'Full-time',
                        remote: true,
                        posted: '2 days ago',
                        description: 'Looking for an experienced frontend developer...'
                    },
                    // Add more mock jobs as needed
                ];
                
                // Filter mock jobs based on search criteria
                const filteredJobs = mockJobs.filter(job => {
                    // Basic filtering logic
                    return true; // Simplified for example
                });
                
                resolve(filteredJobs);
            }, 1000);
        });
    }
    
    displayJobResults(jobs) {
        const container = document.querySelector('.job-listings-results');
        if (!container) return;
        
        if (!jobs.length) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No jobs found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = jobs.map(job => `
            <div class="job-card" data-job-id="${job.id}">
                <div class="job-card-header">
                    <div class="job-company">
                        <div class="company-logo">
                            <img src="https://via.placeholder.com/60" alt="${job.company}">
                        </div>
                        <div class="company-info">
                            <h3>${job.title}</h3>
                            <p>${job.company}</p>
                        </div>
                    </div>
                    <div class="job-meta">
                        <span class="job-type ${job.remote ? 'remote' : ''}">
                            ${job.remote ? 'Remote' : 'On-site'}
                        </span>
                        <button class="job-favorite" data-job-id="${job.id}">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="job-content">
                    <p class="job-description">${job.description}</p>
                    <div class="job-details">
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        <span><i class="fas fa-money-bill-wave"></i> ${job.salary}</span>
                        <span><i class="far fa-clock"></i> ${job.posted}</span>
                    </div>
                </div>
                <div class="job-footer">
                    <button class="btn-apply" data-job-id="${job.id}">Apply Now</button>
                </div>
            </div>
        `).join('');
    }
    
    initJobFilters() {
        const filterToggle = document.querySelector('.filter-toggle');
        const filterPanel = document.querySelector('.filter-panel');
        
        if (filterToggle && filterPanel) {
            filterToggle.addEventListener('click', () => {
                filterPanel.classList.toggle('active');
                filterToggle.classList.toggle('active');
            });
        }
        
        // Range sliders for salary filter
        const salarySlider = document.querySelector('.salary-slider');
        if (salarySlider) {
            const minSlider = salarySlider.querySelector('.min-slider');
            const maxSlider = salarySlider.querySelector('.max-slider');
            const minValue = salarySlider.querySelector('.min-value');
            const maxValue = salarySlider.querySelector('.max-value');
            
            if (minSlider && maxSlider && minValue && maxValue) {
                const updateValues = () => {
                    minValue.textContent = `$${minSlider.value}`;
                    maxValue.textContent = `$${maxSlider.value}`;
                };
                
                minSlider.addEventListener('input', updateValues);
                maxSlider.addEventListener('input', updateValues);
                
                updateValues();
            }
        }
    }
    
    initSaveJob() {
        // Delegate to handle favorite button clicks
        document.addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest('.job-favorite');
            if (!favoriteBtn) return;
            
            const jobId = favoriteBtn.dataset.jobId;
            const heartIcon = favoriteBtn.querySelector('i');
            
            // Toggle favorite state
            if (heartIcon.classList.contains('fas')) {
                // Already saved - remove
                heartIcon.classList.remove('fas');
                heartIcon.classList.add('far');
                this.unsaveJob(jobId);
            } else {
                // Not saved - save
                heartIcon.classList.remove('far');
                heartIcon.classList.add('fas');
                this.saveJob(jobId);
            }
        });
    }
    
    saveJob(jobId) {
        // Save job to localStorage or API
        const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
        if (!savedJobs.includes(jobId)) {
            savedJobs.push(jobId);
            localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
            
            // Show notification
            this.showNotification('Job saved to favorites', 'success');
            
            // Track event
            if (window.app) {
                window.app.trackEvent('jobs', 'save', jobId);
            }
        }
    }
    
    unsaveJob(jobId) {
        // Remove job from saved
        const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
        const index = savedJobs.indexOf(jobId);
        if (index > -1) {
            savedJobs.splice(index, 1);
            localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
            
            // Show notification
            this.showNotification('Job removed from favorites', 'info');
        }
    }
    
    initJobApplications() {
        // Handle job applications
        document.addEventListener('click', async (e) => {
            const applyBtn = e.target.closest('.btn-apply');
            if (!applyBtn) return;
            
            const jobId = applyBtn.dataset.jobId;
            const jobTitle = applyBtn.closest('.job-card')?.querySelector('h3')?.textContent;
            
            // Show application modal
            this.showJobApplicationModal(jobId, jobTitle);
        });
    }
    
    showJobApplicationModal(jobId, jobTitle) {
        const modalHtml = `
            <div class="modal-overlay active" id="applicationModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Apply for ${jobTitle}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="applicationForm" enctype="multipart/form-data">
                            <div class="form-group">
                                <label for="applicantName">Full Name *</label>
                                <input type="text" id="applicantName" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="applicantEmail">Email Address *</label>
                                <input type="email" id="applicantEmail" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="applicantPhone">Phone Number</label>
                                <input type="tel" id="applicantPhone" class="form-control">
                            </div>
                            
                            <div class="form-group">
                                <label for="applicantResume">Resume/CV *</label>
                                <input type="file" id="applicantResume" class="form-control" accept=".pdf,.doc,.docx" required>
                                <small class="form-text">Accepted formats: PDF, DOC, DOCX (Max 5MB)</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="coverLetter">Cover Letter</label>
                                <textarea id="coverLetter" class="form-control" rows="4" placeholder="Tell us why you're a great fit for this position..."></textarea>
                            </div>
                            
                            <div class="form-group checkbox">
                                <input type="checkbox" id="privacyPolicy" required>
                                <label for="privacyPolicy">I agree to the privacy policy and terms of service</label>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-block">Submit Application</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.setupApplicationForm(jobId);
    }
    
    setupApplicationForm(jobId) {
        const modal = document.querySelector('#applicationModal');
        const closeBtn = modal.querySelector('.modal-close');
        const form = modal.querySelector('#applicationForm');
        
        // Close modal
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(form);
                formData.append('jobId', jobId);
                
                await this.submitApplication(formData);
                
                this.showNotification('Application submitted successfully!', 'success');
                modal.remove();
                
                // Update apply button
                const applyBtn = document.querySelector(`[data-job-id="${jobId}"]`);
                if (applyBtn) {
                    applyBtn.textContent = 'Applied ✓';
                    applyBtn.disabled = true;
                    applyBtn.classList.add('applied');
                }
            } catch (error) {
                this.showNotification('Failed to submit application. Please try again.', 'error');
                submitBtn.textContent = 'Submit Application';
                submitBtn.disabled = false;
            }
        });
    }
    
    async submitApplication(formData) {
        // Simulate API submission
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Submitting application:', Object.fromEntries(formData));
                resolve({ success: true });
            }, 2000);
        });
    }
    
    initSalaryCalculator() {
        const calculator = document.querySelector('.salary-calculator');
        if (!calculator) return;
        
        const inputs = calculator.querySelectorAll('input[type="range"], select');
        const updateCalculator = () => {
            // Calculate estimated salary based on inputs
            const experience = calculator.querySelector('#experienceLevel')?.value || 'mid';
            const location = calculator.querySelector('#jobLocation')?.value || 'us';
            const role = calculator.querySelector('#jobRole')?.value || 'developer';
            
            // Salary estimation logic
            const baseSalaries = {
                entry: { developer: 60000, designer: 50000, manager: 55000 },
                mid: { developer: 90000, designer: 75000, manager: 85000 },
                senior: { developer: 130000, designer: 100000, manager: 120000 }
            };
            
            const locationMultipliers = {
                us: 1.0,
                uk: 0.8,
                eu: 0.85,
                asia: 0.6,
                remote: 0.9
            };
            
            const baseSalary = baseSalaries[experience]?.[role] || 75000;
            const multiplier = locationMultipliers[location] || 1.0;
            const estimatedSalary = baseSalary * multiplier;
            
            // Update display
            const resultElement = calculator.querySelector('.salary-result');
            if (resultElement) {
                resultElement.textContent = `$${estimatedSalary.toLocaleString()}`;
                resultElement.style.fontSize = '2rem';
                resultElement.style.fontWeight = 'bold';
                resultElement.style.color = '#10b981';
            }
        };
        
        inputs.forEach(input => {
            input.addEventListener('input', updateCalculator);
            input.addEventListener('change', updateCalculator);
        });
        
        // Initial calculation
        updateCalculator();
    }
    
    initCoursesPage() {
        // Course enrollment
        this.initCourseEnrollment();
        
        // Course progress tracking
        this.initCourseProgress();
        
        // Course reviews
        this.initCourseReviews();
        
        // Course search
        this.initCourseSearch();
    }
    
    initCourseEnrollment() {
        const enrollButtons = document.querySelectorAll('.btn-enroll');
        
        enrollButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                const courseId = button.dataset.courseId;
                const courseTitle = button.dataset.courseTitle;
                
                this.showEnrollmentModal(courseId, courseTitle);
            });
        });
    }
    
    initCourseProgress() {
        const progressBars = document.querySelectorAll('.course-progress');
        
        progressBars.forEach(bar => {
            const progress = bar.dataset.progress || 0;
            const fill = bar.querySelector('.progress-fill');
            
            if (fill) {
                // Animate progress bar
                setTimeout(() => {
                    fill.style.width = `${progress}%`;
                    fill.style.transition = 'width 1s ease-in-out';
                }, 500);
            }
        });
    }
    
    initCourseReviews() {
        const reviewForm = document.getElementById('courseReviewForm');
        if (!reviewForm) return;
        
        // Star rating
        const stars = reviewForm.querySelectorAll('.rating-star');
        let selectedRating = 0;
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                selectedRating = index + 1;
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('active');
                        s.innerHTML = '★';
                    } else {
                        s.classList.remove('active');
                        s.innerHTML = '☆';
                    }
                });
                
                // Update hidden input
                const ratingInput = reviewForm.querySelector('input[name="rating"]');
                if (ratingInput) {
                    ratingInput.value = selectedRating;
                }
            });
        });
        
        // Form submission
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(reviewForm);
                await this.submitReview(formData);
                
                this.showNotification('Review submitted successfully!', 'success');
                reviewForm.reset();
                
                // Reset stars
                stars.forEach(star => {
                    star.classList.remove('active');
                    star.innerHTML = '☆';
                });
                selectedRating = 0;
            } catch (error) {
                this.showNotification('Failed to submit review. Please try again.', 'error');
            } finally {
                submitBtn.textContent = 'Submit Review';
                submitBtn.disabled = false;
            }
        });
    }
    
    async submitReview(formData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Submitting review:', Object.fromEntries(formData));
                resolve({ success: true });
            }, 1500);
        });
    }
    
    initCourseSearch() {
        const searchInput = document.querySelector('.course-search-input');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', this.debounce(() => {
            this.filterCourses(searchInput.value);
        }, 300));
    }
    
    filterCourses(query) {
        const courses = document.querySelectorAll('.course-card');
        const queryLower = query.toLowerCase();
        
        courses.forEach(course => {
            const title = course.querySelector('.course-title')?.textContent.toLowerCase() || '';
            const description = course.querySelector('.course-description')?.textContent.toLowerCase() || '';
            const instructor = course.querySelector('.course-instructor')?.textContent.toLowerCase() || '';
            
            const matches = title.includes(queryLower) || 
                           description.includes(queryLower) || 
                           instructor.includes(queryLower);
            
            if (matches || query === '') {
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
    
    initEventsPage() {
        // Event calendar
        this.initEventCalendar();
        
        // Event registration
        this.initEventRegistration();
        
        // Event filtering
        this.initEventFilters();
        
        // Event reminders
        this.initEventReminders();
    }
    
    initEventCalendar() {
        const calendar = document.querySelector('.events-calendar');
        if (!calendar) return;
        
        // Basic calendar navigation
        const prevBtn = calendar.querySelector('.calendar-prev');
        const nextBtn = calendar.querySelector('.calendar-next');
        const currentMonth = calendar.querySelector('.calendar-current');
        
        if (prevBtn && nextBtn && currentMonth) {
            let currentDate = new Date();
            
            const updateCalendar = () => {
                const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
                const year = currentDate.getFullYear();
                currentMonth.textContent = `${month} ${year}`;
                
                // In a real implementation, this would update the calendar grid
            };
            
            prevBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                updateCalendar();
            });
            
            nextBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                updateCalendar();
            });
            
            updateCalendar();
        }
    }
    
    initEventRegistration() {
        const registerButtons = document.querySelectorAll('.btn-register-event');
        
        registerButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                const eventId = button.dataset.eventId;
                const eventTitle = button.dataset.eventTitle;
                
                this.showEventRegistrationModal(eventId, eventTitle);
            });
        });
    }
    
    showEventRegistrationModal(eventId, eventTitle) {
        // Similar to job application modal but for events
        console.log(`Registering for event: ${eventTitle} (${eventId})`);
        
        // Show a simple alert for now
        alert(`Registration for "${eventTitle}" would open here.`);
    }
    
    initEventFilters() {
        const filterButtons = document.querySelectorAll('.event-filter');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter events
                this.filterEvents(filter);
            });
        });
    }
    
    filterEvents(filter) {
        const events = document.querySelectorAll('.event-card');
        
        events.forEach(event => {
            const eventType = event.dataset.type;
            
            if (filter === 'all' || eventType === filter) {
                event.style.display = 'block';
                setTimeout(() => {
                    event.style.opacity = '1';
                    event.style.transform = 'translateY(0)';
                }, 10);
            } else {
                event.style.opacity = '0';
                event.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    event.style.display = 'none';
                }, 300);
            }
        });
    }
    
    initEventReminders() {
        const reminderButtons = document.querySelectorAll('.btn-set-reminder');
        
        reminderButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const eventId = button.dataset.eventId;
                const eventTitle = button.dataset.eventTitle;
                
                // Request notification permission
                if (Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        this.showNotification('Please enable notifications to set reminders', 'warning');
                        return;
                    }
                }
                
                // Set reminder
                this.setEventReminder(eventId, eventTitle);
            });
        });
    }
    
    setEventReminder(eventId, eventTitle) {
        // Schedule notification
        const eventTime = new Date();
        eventTime.setHours(eventTime.getHours() + 1); // 1 hour from now
        
        if (Notification.permission === 'granted') {
            // Schedule notification
            setTimeout(() => {
                new Notification('Event Reminder', {
                    body: `"${eventTitle}" is starting soon!`,
                    icon: '/favicon.ico'
                });
            }, eventTime.getTime() - Date.now());
            
            this.showNotification('Reminder set for 1 hour before event', 'success');
        }
    }
    
    initCommon() {
        // Mobile menu toggle
        this.initMobileMenu();
        
        // Back to top button
        this.initBackToTop();
        
        // Form validation
        this.initFormValidation();
        
        // Lazy loading images
        this.initLazyLoading();
        
        // Smooth scrolling
        this.initSmoothScrolling();
        
        // Cookie consent
        this.initCookieConsent();
    }
    
    initMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        const overlay = document.querySelector('.mobile-menu-overlay');
        
        if (!menuToggle || !navMenu) return;
        
        // Create overlay if it doesn't exist
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'mobile-menu-overlay';
            document.body.appendChild(newOverlay);
            
            newOverlay.addEventListener('click', () => {
                navMenu.classList.remove('active');
                newOverlay.classList.remove('active');
            });
        }
        
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            document.querySelector('.mobile-menu-overlay').classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                document.querySelector('.mobile-menu-overlay').classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    initBackToTop() {
        const backToTop = document.createElement('button');
        backToTop.id = 'backToTop';
        backToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
        backToTop.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: var(--primary-600);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(backToTop);
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.style.display = 'flex';
                setTimeout(() => {
                    backToTop.style.opacity = '1';
                }, 10);
            } else {
                backToTop.style.opacity = '0';
                setTimeout(() => {
                    if (window.scrollY <= 300) {
                        backToTop.style.display = 'none';
                    }
                }, 300);
            }
        });
    }
    
    initFormValidation() {
        // Add validation to forms
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                });
                
                input.addEventListener('input', () => {
                    this.clearInputError(input);
                });
            });
            
            form.addEventListener('submit', (e) => {
                let isValid = true;
                
                inputs.forEach(input => {
                    if (!this.validateInput(input)) {
                        isValid = false;
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    this.showFormError(form, 'Please fix the errors above');
                }
            });
        });
    }
    
    validateInput(input) {
        const value = input.value.trim();
        const type = input.type;
        const name = input.name;
        
        // Clear previous errors
        this.clearInputError(input);
        
        // Required validation
        if (input.required && !value) {
            this.showInputError(input, 'This field is required');
            return false;
        }
        
        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showInputError(input, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Phone validation
        if (name.includes('phone') && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\D/g, ''))) {
                this.showInputError(input, 'Please enter a valid phone number');
                return false;
            }
        }
        
        // URL validation
        if (type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                this.showInputError(input, 'Please enter a valid URL');
                return false;
            }
        }
        
        return true;
    }
    
    showInputError(input, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        
        // Remove existing error
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        // Add error class
        formGroup.classList.add('has-error');
        input.classList.add('error');
        
        // Create error message
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        error.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `;
        
        formGroup.appendChild(error);
    }
    
    clearInputError(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;
        
        formGroup.classList.remove('has-error');
        input.classList.remove('error');
        
        const error = formGroup.querySelector('.error-message');
        if (error) error.remove();
    }
    
    showFormError(form, message) {
        // Remove existing form error
        const existingError = form.querySelector('.form-error');
        if (existingError) existingError.remove();
        
        // Create form error
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = message;
        error.style.cssText = `
            background: #fee;
            color: #c33;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            border: 1px solid #fcc;
        `;
        
        form.prepend(error);
        
        // Scroll to error
        error.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    showFormSuccess(form, message) {
        // Remove existing success message
        const existingSuccess = form.querySelector('.form-success');
        if (existingSuccess) existingSuccess.remove();
        
        // Create success message
        const success = document.createElement('div');
        success.className = 'form-success';
        success.textContent = message;
        success.style.cssText = `
            background: #dfd;
            color: #3a3;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            border: 1px solid #afa;
        `;
        
        form.prepend(success);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (success.parentNode) {
                success.remove();
            }
        }, 5000);
    }
    
    initLazyLoading() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                        }
                        img.removeAttribute('data-src');
                        img.removeAttribute('data-srcset');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                }
            });
        }
    }
    
    initSmoothScrolling() {
        // Smooth scroll for anchor links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // Close mobile menu if open
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    document.querySelector('.mobile-menu-overlay')?.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                // Scroll to target
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Update URL without page reload
                history.pushState(null, null, targetId);
            }
        });
    }
    
    initCookieConsent() {
        // Check if consent already given
        if (localStorage.getItem('cookieConsent')) return;
        
        // Create cookie consent banner
        const banner = document.createElement('div');
        banner.id = 'cookieConsent';
        banner.innerHTML = `
            <div class="cookie-content">
                <p>We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
                <div class="cookie-actions">
                    <button class="btn btn-primary" id="acceptCookies">Accept</button>
                    <button class="btn btn-secondary" id="declineCookies">Decline</button>
                    <a href="/privacy-policy" class="cookie-link">Privacy Policy</a>
                </div>
            </div>
        `;
        
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #333;
            color: white;
            padding: 1.5rem;
            z-index: 10000;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(banner);
        
        // Handle consent
        document.getElementById('acceptCookies').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => banner.remove(), 300);
        });
        
        document.getElementById('declineCookies').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'declined');
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => banner.remove(), 300);
        });
    }
    
    setupEventListeners() {
        // Window load event
        window.addEventListener('load', () => {
            this.onWindowLoad();
        });
        
        // Resize events
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.onWindowResize();
            }, 250);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    onWindowLoad() {
        // Remove loading states
        document.querySelectorAll('.loading').forEach(el => {
            el.classList.remove('loading');
        });
        
        // Initialize animations
        this.initScrollAnimations();
    }
    
    onWindowResize() {
        // Handle responsive adjustments
        const width = window.innerWidth;
        
        // Update mobile/desktop classes
        if (width < 768) {
            document.body.classList.add('mobile-view');
            document.body.classList.remove('desktop-view');
        } else {
            document.body.classList.add('desktop-view');
            document.body.classList.remove('mobile-view');
        }
    }
    
    initScrollAnimations() {
        // Animate elements on scroll
        const animatedElements = document.querySelectorAll('[data-animate]');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const animation = element.dataset.animate;
                        
                        element.classList.add('animate', animation);
                        observer.unobserve(element);
                    }
                });
            }, { threshold: 0.1 });
            
            animatedElements.forEach(el => observer.observe(el));
        } else {
            // Fallback: animate all immediately
            animatedElements.forEach(el => {
                const animation = el.dataset.animate;
                el.classList.add('animate', animation);
            });
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ignore if user is typing in an input
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' || 
            e.target.isContentEditable) {
            return;
        }
        
        // '/' to focus search
        if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay.active');
            if (openModal) {
                openModal.remove();
            }
            
            // Close mobile menu
            const navMenu = document.querySelector('.nav-menu.active');
            if (navMenu) {
                navMenu.classList.remove('active');
                document.querySelector('.mobile-menu-overlay')?.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }
    
    // Utility methods
    showNotification(message, type = 'info', duration = 3000) {
        // Use app notification system if available
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type, duration);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#ef4444' : 
                           type === 'success' ? '#10b981' : 
                           type === 'warning' ? '#f59e0b' : '#3b82f6'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            // Remove after duration
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
        }
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mainPage = new MainPage();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .animate {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animate.animated {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);
