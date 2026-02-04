// partners.js - Partners and Affiliates Management
class PartnerManager {
    constructor() {
        this.partners = [];
        this.categories = [];
        this.init();
    }

    async init() {
        await this.loadPartners();
        await this.loadCategories();
        this.renderPartners();
        this.setupEventListeners();
        this.checkAffiliateLinks();
    }

    async loadPartners() {
        try {
            const response = await fetch('/api/partners');
            this.partners = await response.json();
        } catch (error) {
            console.error('Failed to load partners:', error);
            this.partners = this.getSamplePartners();
        }
    }

    getSamplePartners() {
        return [
            {
                id: 1,
                name: 'TechCorp',
                type: 'recruitment',
                category: 'Technology',
                logo: 'https://via.placeholder.com/150x80',
                description: 'Leading tech company specializing in software development',
                website: 'https://techcorp.example.com',
                featured: true,
                jobs: 25,
                rating: 4.8,
                joined: '2023-01-15',
                contact: 'partners@techcorp.com'
            },
            {
                id: 2,
                name: 'DesignStudio',
                type: 'training',
                category: 'Design',
                logo: 'https://via.placeholder.com/150x80',
                description: 'Creative design agency offering training programs',
                website: 'https://designstudio.example.com',
                featured: false,
                jobs: 12,
                rating: 4.5,
                joined: '2023-03-20',
                contact: 'hello@designstudio.com'
            }
        ];
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/partner-categories');
            this.categories = await response.json();
        } catch (error) {
            this.categories = ['Technology', 'Finance', 'Healthcare', 'Education', 'Design', 'Marketing'];
        }
    }

    renderPartners() {
        const container = document.querySelector('.partners-container');
        if (!container) return;

        // Render featured partners first
        const featuredPartners = this.partners.filter(p => p.featured);
        const regularPartners = this.partners.filter(p => !p.featured);

        container.innerHTML = `
            ${featuredPartners.length > 0 ? `
                <div class="featured-partners-section">
                    <h3>Featured Partners</h3>
                    <div class="featured-partners-grid">
                        ${featuredPartners.map(partner => this.renderPartnerCard(partner, true)).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="all-partners-section">
                <h3>All Partners</h3>
                <div class="partners-grid">
                    ${regularPartners.map(partner => this.renderPartnerCard(partner, false)).join('')}
                </div>
            </div>
        `;
    }

    renderPartnerCard(partner, isFeatured) {
        return `
            <div class="partner-card ${isFeatured ? 'featured' : ''}" data-partner-id="${partner.id}">
                <div class="partner-header">
                    <div class="partner-logo">
                        <img src="${partner.logo}" alt="${partner.name}" 
                             onerror="this.src='https://via.placeholder.com/150x80?text=${encodeURIComponent(partner.name)}'">
                        ${partner.featured ? '<span class="partner-badge featured"><i class="fas fa-star"></i> Featured</span>' : ''}
                    </div>
                    <div class="partner-info">
                        <h3>${partner.name}</h3>
                        <div class="partner-meta">
                            <span class="partner-type ${partner.type}">${partner.type}</span>
                            <span class="partner-category">${partner.category}</span>
                        </div>
                        <div class="partner-rating">
                            ${this.renderStars(partner.rating)}
                            <span>${partner.rating}</span>
                        </div>
                    </div>
                </div>
                <div class="partner-body">
                    <p class="partner-description">${partner.description}</p>
                    <div class="partner-stats">
                        <div class="stat">
                            <i class="fas fa-briefcase"></i>
                            <span>${partner.jobs} Jobs</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Joined ${new Date(partner.joined).getFullYear()}</span>
                        </div>
                    </div>
                </div>
                <div class="partner-footer">
                    <a href="${partner.website}" class="btn-visit-website" target="_blank" rel="noopener">
                        <i class="fas fa-external-link-alt"></i> Visit Website
                    </a>
                    <button class="btn-view-jobs" onclick="partnerManager.viewPartnerJobs(${partner.id})">
                        <i class="fas fa-search"></i> View Jobs
                    </button>
                    <button class="btn-contact-partner" onclick="partnerManager.contactPartner(${partner.id})">
                        <i class="fas fa-envelope"></i> Contact
                    </button>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    }

    setupEventListeners() {
        // Filter partners by category
        document.addEventListener('change', (e) => {
            if (e.target.id === 'partner-category-filter') {
                this.filterPartners(e.target.value);
            }
        });

        // Search partners
        document.addEventListener('input', (e) => {
            if (e.target.id === 'partner-search') {
                this.searchPartners(e.target.value);
            }
        });

        // Sort partners
        document.addEventListener('change', (e) => {
            if (e.target.id === 'partner-sort') {
                this.sortPartners(e.target.value);
            }
        });
    }

    filterPartners(category) {
        const filtered = category === 'all' 
            ? this.partners 
            : this.partners.filter(partner => partner.category === category);
        
        this.renderFilteredPartners(filtered);
    }

    searchPartners(query) {
        const filtered = this.partners.filter(partner =>
            partner.name.toLowerCase().includes(query.toLowerCase()) ||
            partner.description.toLowerCase().includes(query.toLowerCase()) ||
            partner.category.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderFilteredPartners(filtered);
    }

    sortPartners(criteria) {
        let sorted = [...this.partners];
        
        switch (criteria) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'rating':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case 'jobs':
                sorted.sort((a, b) => b.jobs - a.jobs);
                break;
            case 'joined':
                sorted.sort((a, b) => new Date(b.joined) - new Date(a.joined));
                break;
        }
        
        this.partners = sorted;
        this.renderPartners();
    }

    renderFilteredPartners(filtered) {
        const container = document.querySelector('.partners-container');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="no-partners">
                    <i class="fas fa-handshake"></i>
                    <h3>No partners found</h3>
                    <p>Try different search terms or categories</p>
                </div>
            `;
            return;
        }

        this.partners = filtered;
        this.renderPartners();
    }

    async viewPartnerJobs(partnerId) {
        const partner = this.partners.find(p => p.id === partnerId);
        if (!partner) return;

        try {
            const response = await fetch(`/api/partners/${partnerId}/jobs`);
            const jobs = await response.json();
            
            this.showJobsModal(partner, jobs);
        } catch (error) {
            console.error('Failed to load jobs:', error);
            this.showJobsModal(partner, []);
        }
    }

    showJobsModal(partner, jobs) {
        const modal = document.createElement('div');
        modal.className = 'partner-jobs-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="partner-logo-small">
                        <img src="${partner.logo}" alt="${partner.name}">
                    </div>
                    <div>
                        <h3>Jobs at ${partner.name}</h3>
                        <p>${jobs.length} job${jobs.length !== 1 ? 's' : ''} available</p>
                    </div>
                    <button class="btn-close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${jobs.length === 0 ? 
                        `<div class="no-jobs">
                            <i class="fas fa-briefcase"></i>
                            <p>No jobs available at the moment</p>
                        </div>` :
                        `<div class="jobs-list">
                            ${jobs.map(job => `
                                <div class="job-item">
                                    <div class="job-info">
                                        <h4>${job.title}</h4>
                                        <p><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                                        <p><i class="fas fa-money-bill-wave"></i> ${job.salary}</p>
                                    </div>
                                    <div class="job-actions">
                                        <button class="btn-view-job" onclick="window.location.href='/jobs/${job.id}'">
                                            View Job
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`
                    }
                </div>
                <div class="modal-footer">
                    <button class="btn-partner-website" onclick="window.open('${partner.website}', '_blank')">
                        Visit ${partner.name} Website
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    contactPartner(partnerId) {
        const partner = this.partners.find(p => p.id === partnerId);
        if (!partner) return;

        this.showContactModal(partner);
    }

    showContactModal(partner) {
        const modal = document.createElement('div');
        modal.className = 'contact-partner-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Contact ${partner.name}</h3>
                <form class="contact-partner-form">
                    <div class="form-group">
                        <label for="contact-name">Your Name</label>
                        <input type="text" id="contact-name" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-email">Your Email</label>
                        <input type="email" id="contact-email" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-subject">Subject</label>
                        <input type="text" id="contact-subject" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-message">Message</label>
                        <textarea id="contact-message" rows="5" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="contact-purpose">Purpose</label>
                        <select id="contact-purpose">
                            <option value="job_inquiry">Job Inquiry</option>
                            <option value="partnership">Partnership Opportunity</option>
                            <option value="general">General Inquiry</option>
                            <option value="feedback">Feedback</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-send-message">
                            <i class="fas fa-paper-plane"></i> Send Message
                        </button>
                        <button type="button" class="btn-cancel">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector('.contact-partner-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendPartnerMessage(partner, form);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    }

    async sendPartnerMessage(partner, form) {
        const formData = new FormData(form);
        const messageData = {
            partnerId: partner.id,
            partnerEmail: partner.contact,
            senderName: formData.get('name'),
            senderEmail: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            purpose: formData.get('purpose'),
            timestamp: new Date().toISOString()
        };

        try {
            // In a real app, send via backend API
            const response = await fetch('/api/partners/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                alert('Message sent successfully!');
                modal.remove();
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    checkAffiliateLinks() {
        // Check for affiliate links in the page
        const affiliateLinks = document.querySelectorAll('a[data-affiliate]');
        affiliateLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackAffiliateClick(link.dataset.affiliate, link.href);
            });
        });
    }

    trackAffiliateClick(affiliateId, destination) {
        // Track affiliate click
        const clickData = {
            affiliateId,
            userId: localStorage.getItem('userId'),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referralUrl: document.referrer
        };

        // Save click data
        const affiliateClicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
        affiliateClicks.push(clickData);
        localStorage.setItem('affiliate_clicks', JSON.stringify(affiliateClicks));

        // Redirect to destination
        window.open(destination, '_blank');
    }

    getPartnerStats() {
        const stats = {
            total: this.partners.length,
            byCategory: {},
            byType: {},
            featured: this.partners.filter(p => p.featured).length,
            totalJobs: this.partners.reduce((sum, p) => sum + p.jobs, 0),
            averageRating: this.partners.reduce((sum, p) => sum + p.rating, 0) / this.partners.length
        };

        this.partners.forEach(partner => {
            stats.byCategory[partner.category] = (stats.byCategory[partner.category] || 0) + 1;
            stats.byType[partner.type] = (stats.byType[partner.type] || 0) + 1;
        });

        return stats;
    }

    renderPartnerStats() {
        const stats = this.getPartnerStats();
        const statsContainer = document.querySelector('.partner-stats-container');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-handshake"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.total}</h3>
                        <p>Total Partners</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.featured}</h3>
                        <p>Featured Partners</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.totalJobs}</h3>
                        <p>Total Jobs</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.averageRating.toFixed(1)}</h3>
                        <p>Average Rating</p>
                    </div>
                </div>
            </div>
        `;
    }

    becomePartner() {
        this.showBecomePartnerForm();
    }

    showBecomePartnerForm() {
        const modal = document.createElement('div');
        modal.className = 'become-partner-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Become a Partner</h2>
                <p>Join our network of trusted partners and grow your business</p>
                
                <form class="become-partner-form">
                    <div class="form-section">
                        <h4>Company Information</h4>
                        <div class="form-group">
                            <label for="company-name">Company Name *</label>
                            <input type="text" id="company-name" required>
                        </div>
                        <div class="form-group">
                            <label for="company-website">Website *</label>
                            <input type="url" id="company-website" required>
                        </div>
                        <div class="form-group">
                            <label for="company-industry">Industry *</label>
                            <select id="company-industry" required>
                                <option value="">Select Industry</option>
                                ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="company-size">Company Size</label>
                            <select id="company-size">
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="500+">500+ employees</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Contact Information</h4>
                        <div class="form-group">
                            <label for="contact-person">Contact Person *</label>
                            <input type="text" id="contact-person" required>
                        </div>
                        <div class="form-group">
                            <label for="contact-email">Email *</label>
                            <input type="email" id="contact-email" required>
                        </div>
                        <div class="form-group">
                            <label for="contact-phone">Phone</label>
                            <input type="tel" id="contact-phone">
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Partnership Type</h4>
                        <div class="form-group">
                            <label for="partnership-type">What type of partnership are you interested in? *</label>
                            <select id="partnership-type" required multiple>
                                <option value="recruitment">Recruitment</option>
                                <option value="training">Training</option>
                                <option value="sponsorship">Sponsorship</option>
                                <option value="affiliate">Affiliate</option>
                                <option value="content">Content Collaboration</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="partnership-description">Tell us about your partnership proposal</label>
                            <textarea id="partnership-description" rows="4"></textarea>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-submit-application">
                            <i class="fas fa-paper-plane"></i> Submit Application
                        </button>
                        <button type="button" class="btn-cancel">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector('.become-partner-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitPartnerApplication(form);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    }

    async submitPartnerApplication(form) {
        const formData = new FormData(form);
        const application = {
            companyName: formData.get('company-name'),
            website: formData.get('website'),
            industry: formData.get('industry'),
            companySize: formData.get('company-size'),
            contactPerson: formData.get('contact-person'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            partnershipType: formData.getAll('partnership-type'),
            description: formData.get('partnership-description'),
            submissionDate: new Date().toISOString(),
            status: 'pending'
        };

        try {
            const response = await fetch('/api/partners/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(application)
            });

            if (response.ok) {
                alert('Application submitted successfully! We will contact you soon.');
                modal.remove();
            }
        } catch (error) {
            console.error('Failed to submit application:', error);
            alert('Failed to submit application. Please try again.');
        }
    }
}

// Initialize partner manager
document.addEventListener('DOMContentLoaded', () => {
    window.partnerManager = new PartnerManager();
});
