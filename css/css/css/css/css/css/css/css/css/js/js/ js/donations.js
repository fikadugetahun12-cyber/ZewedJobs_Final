// donations.js - Donations and Fundraising System
class DonationManager {
    constructor() {
        this.campaigns = [];
        this.donations = [];
        this.init();
    }

    async init() {
        await this.loadCampaigns();
        await this.loadDonations();
        this.renderCampaigns();
        this.setupEventListeners();
        this.setupRecurringDonations();
    }

    async loadCampaigns() {
        try {
            const response = await fetch('/api/donation-campaigns');
            this.campaigns = await response.json();
        } catch (error) {
            console.error('Failed to load campaigns:', error);
            this.campaigns = this.getSampleCampaigns();
        }
    }

    getSampleCampaigns() {
        return [
            {
                id: 1,
                title: 'Education for All',
                description: 'Help provide education opportunities for underprivileged students',
                goal: 50000,
                raised: 32500,
                currency: 'USD',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                organizer: 'ZewedJobs Foundation',
                category: 'education',
                image: 'https://via.placeholder.com/400x300',
                progress: 65,
                donors: 128,
                featured: true
            },
            {
                id: 2,
                title: 'Tech Training for Youth',
                description: 'Fund tech skills training for young adults',
                goal: 30000,
                raised: 18500,
                currency: 'USD',
                startDate: '2024-03-01',
                endDate: '2024-09-30',
                organizer: 'ZewedJobs Academy',
                category: 'training',
                image: 'https://via.placeholder.com/400x300',
                progress: 62,
                donors: 89,
                featured: false
            }
        ];
    }

    async loadDonations() {
        const userId = localStorage.getItem('userId');
        if (userId) {
            try {
                const response = await fetch(`/api/users/${userId}/donations`);
                this.donations = await response.json();
            } catch (error) {
                this.donations = JSON.parse(localStorage.getItem('user_donations') || '[]');
            }
        }
    }

    renderCampaigns() {
        const container = document.querySelector('.campaigns-container');
        if (!container) return;

        container.innerHTML = this.campaigns.map(campaign => `
            <div class="campaign-card" data-campaign-id="${campaign.id}">
                <div class="campaign-image">
                    <img src="${campaign.image}" alt="${campaign.title}">
                    ${campaign.featured ? '<span class="campaign-badge featured"><i class="fas fa-star"></i> Featured</span>' : ''}
                    ${new Date(campaign.endDate) < new Date() ? 
                        '<span class="campaign-badge ended">Ended</span>' : 
                        '<span class="campaign-badge active">Active</span>'}
                </div>
                <div class="campaign-content">
                    <div class="campaign-header">
                        <h3>${campaign.title}</h3>
                        <span class="campaign-category ${campaign.category}">${campaign.category}</span>
                    </div>
                    <p class="campaign-description">${campaign.description}</p>
                    <div class="campaign-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${campaign.progress}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span>$${this.formatNumber(campaign.raised)} raised</span>
                            <span>${campaign.progress}% of $${this.formatNumber(campaign.goal)} goal</span>
                        </div>
                    </div>
                    <div class="campaign-meta">
                        <div class="meta-item">
                            <i class="fas fa-users"></i>
                            <span>${campaign.donors} donors</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>Ends ${this.formatDate(campaign.endDate)}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-building"></i>
                            <span>${campaign.organizer}</span>
                        </div>
                    </div>
                    <div class="campaign-actions">
                        <div class="quick-donation-amounts">
                            <button class="btn-donation-amount" data-amount="10">$10</button>
                            <button class="btn-donation-amount" data-amount="25">$25</button>
                            <button class="btn-donation-amount" data-amount="50">$50</button>
                            <button class="btn-donation-amount" data-amount="100">$100</button>
                            <input type="number" class="custom-amount" placeholder="Other amount" min="1">
                        </div>
                        <button class="btn-donate" onclick="donationManager.showDonationModal(${campaign.id})">
                            <i class="fas fa-heart"></i> Donate Now
                        </button>
                        <button class="btn-share-campaign" onclick="donationManager.shareCampaign(${campaign.id})">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    setupEventListeners() {
        // Quick donation amount buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-donation-amount')) {
                const amount = e.target.dataset.amount;
                const campaignId = e.target.closest('.campaign-card').dataset.campaignId;
                this.processQuickDonation(campaignId, amount);
            }
        });

        // Filter campaigns
        document.addEventListener('change', (e) => {
            if (e.target.id === 'campaign-filter') {
                this.filterCampaigns(e.target.value);
            }
        });

        // Donation frequency toggle
        document.addEventListener('change', (e) => {
            if (e.target.name === 'donation-frequency') {
                this.toggleRecurringOptions(e.target.value);
            }
        });
    }

    filterCampaigns(filter) {
        let filtered;
        switch (filter) {
            case 'active':
                filtered = this.campaigns.filter(c => new Date(c.endDate) >= new Date());
                break;
            case 'ended':
                filtered = this.campaigns.filter(c => new Date(c.endDate) < new Date());
                break;
            case 'featured':
                filtered = this.campaigns.filter(c => c.featured);
                break;
            case 'education':
                filtered = this.campaigns.filter(c => c.category === 'education');
                break;
            default:
                filtered = this.campaigns;
        }
        
        this.renderFilteredCampaigns(filtered);
    }

    renderFilteredCampaigns(filtered) {
        const container = document.querySelector('.campaigns-container');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="no-campaigns">
                    <i class="fas fa-hands-helping"></i>
                    <h3>No campaigns found</h3>
                    <p>Check back later for new campaigns</p>
                </div>
            `;
            return;
        }

        this.campaigns = filtered;
        this.renderCampaigns();
    }

    processQuickDonation(campaignId, amount) {
        const campaign = this.campaigns.find(c => c.id == campaignId);
        if (!campaign) return;

        if (confirm(`Donate $${amount} to "${campaign.title}"?`)) {
            this.processDonation(campaignId, parseFloat(amount), 'one-time');
        }
    }

    showDonationModal(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        const modal = document.createElement('div');
        modal.className = 'donation-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="btn-close-modal">&times;</button>
                <h2>Support ${campaign.title}</h2>
                
                <div class="campaign-summary">
                    <img src="${campaign.image}" alt="${campaign.title}">
                    <div class="summary-content">
                        <p>${campaign.description}</p>
                        <div class="progress-summary">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${campaign.progress}%"></div>
                            </div>
                            <p>$${this.formatNumber(campaign.raised)} raised of $${this.formatNumber(campaign.goal)} goal</p>
                        </div>
                    </div>
                </div>

                <form class="donation-form">
                    <div class="form-section">
                        <h4>Donation Amount</h4>
                        <div class="donation-amount-options">
                            <button type="button" class="amount-option active" data-amount="25">$25</button>
                            <button type="button" class="amount-option" data-amount="50">$50</button>
                            <button type="button" class="amount-option" data-amount="100">$100</button>
                            <button type="button" class="amount-option" data-amount="250">$250</button>
                            <button type="button" class="amount-option" data-amount="500">$500</button>
                            <div class="custom-amount-input">
                                <span>$</span>
                                <input type="number" id="custom-amount" min="1" placeholder="Other amount">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Donation Type</h4>
                        <div class="donation-type-options">
                            <label class="donation-type-option">
                                <input type="radio" name="donation-type" value="one-time" checked>
                                <div class="option-content">
                                    <i class="fas fa-calendar-day"></i>
                                    <span>One-time Donation</span>
                                </div>
                            </label>
                            <label class="donation-type-option">
                                <input type="radio" name="donation-type" value="monthly">
                                <div class="option-content">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>Monthly Donation</span>
                                    <small>Help sustain our work</small>
                                </div>
                            </label>
                            <label class="donation-type-option">
                                <input type="radio" name="donation-type" value="yearly">
                                <div class="option-content">
                                    <i class="fas fa-calendar"></i>
                                    <span>Yearly Donation</span>
                                    <small>Make a lasting impact</small>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Personal Information</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="donor-name">Full Name *</label>
                                <input type="text" id="donor-name" required>
                            </div>
                            <div class="form-group">
                                <label for="donor-email">Email *</label>
                                <input type="email" id="donor-email" required>
                            </div>
                            <div class="form-group">
                                <label for="donor-phone">Phone</label>
                                <input type="tel" id="donor-phone">
                            </div>
                            <div class="form-group">
                                <label for="donor-address">Address</label>
                                <input type="text" id="donor-address">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Payment Information</h4>
                        <div class="payment-methods">
                            <label class="payment-method">
                                <input type="radio" name="payment-method" value="card" checked>
                                <div class="method-content">
                                    <i class="fas fa-credit-card"></i>
                                    <span>Credit/Debit Card</span>
                                </div>
                            </label>
                            <label class="payment-method">
                                <input type="radio" name="payment-method" value="paypal">
                                <div class="method-content">
                                    <i class="fab fa-paypal"></i>
                                    <span>PayPal</span>
                                </div>
                            </label>
                            <label class="payment-method">
                                <input type="radio" name="payment-method" value="bank">
                                <div class="method-content">
                                    <i class="fas fa-university"></i>
                                    <span>Bank Transfer</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="form-section">
                        <label class="checkbox-label">
                            <input type="checkbox" id="anonymous-donation">
                            <span>Make this donation anonymous</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="receipt-email" checked>
                            <span>Send receipt to email</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="newsletter-subscribe" checked>
                            <span>Subscribe to updates about this campaign</span>
                        </label>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-submit-donation">
                            <i class="fas fa-heart"></i> Complete Donation
                        </button>
                        <p class="secure-notice">
                            <i class="fas fa-lock"></i> Secure payment processed by Stripe
                        </p>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Setup amount options
        modal.querySelectorAll('.amount-option').forEach(button => {
            button.addEventListener('click', () => {
                modal.querySelectorAll('.amount-option').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                modal.querySelector('#custom-amount').value = '';
            });
        });

        // Setup custom amount input
        const customAmountInput = modal.querySelector('#custom-amount');
        customAmountInput.addEventListener('input', () => {
            modal.querySelectorAll('.amount-option').forEach(b => b.classList.remove('active'));
        });

        const form = modal.querySelector('.donation-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processDonationForm(campaignId, form);
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    async processDonationForm(campaignId, form) {
        const formData = new FormData(form);
        const amount = formData.get('custom-amount') || 
                      modal.querySelector('.amount-option.active')?.dataset.amount;
        
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid donation amount');
            return;
        }

        const donationData = {
            campaignId,
            amount: parseFloat(amount),
            donationType: formData.get('donation-type'),
            paymentMethod: formData.get('payment-method'),
            donorName: formData.get('donor-name'),
            donorEmail: formData.get('donor-email'),
            donorPhone: formData.get('donor-phone'),
            donorAddress: formData.get('donor-address'),
            anonymous: formData.get('anonymous-donation') === 'on',
            sendReceipt: formData.get('receipt-email') === 'on',
            subscribeUpdates: formData.get('newsletter-subscribe') === 'on',
            timestamp: new Date().toISOString()
        };

        // Show loading
        this.showDonationLoading();

        try {
            const result = await this.processDonation(campaignId, donationData);
            
            if (result.success) {
                this.showDonationSuccess(result);
                this.saveDonation(donationData);
                
                // Update campaign raised amount
                const campaign = this.campaigns.find(c => c.id == campaignId);
                if (campaign) {
                    campaign.raised += donationData.amount;
                    campaign.progress = (campaign.raised / campaign.goal) * 100;
                    campaign.donors++;
                    this.renderCampaigns();
                }
            } else {
                this.showDonationError(result.error);
            }
        } catch (error) {
            this.showDonationError(error.message);
        } finally {
            this.hideDonationLoading();
        }
    }

    async processDonation(campaignId, donationData) {
        // Process payment based on payment method
        switch (donationData.paymentMethod) {
            case 'card':
                return await this.processCardDonation(donationData);
            case 'paypal':
                return await this.processPayPalDonation(donationData);
            case 'bank':
                return await this.processBankDonation(donationData);
            default:
                throw new Error('Invalid payment method');
        }
    }

    async processCardDonation(donationData) {
        // Use Stripe or similar payment processor
        const response = await fetch('/api/donations/process-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donationData)
        });

        return await response.json();
    }

    async processPayPalDonation(donationData) {
        // Process PayPal donation
        const response = await fetch('/api/donations/process-paypal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donationData)
        });

        return await response.json();
    }

    async processBankDonation(donationData) {
        // Provide bank details for transfer
        return {
            success: true,
            paymentId: `BANK-${Date.now()}`,
            bankDetails: {
                bankName: 'ZewedJobs Foundation Bank',
                accountNumber: '9876543210',
                accountName: 'ZewedJobs Foundation',
                reference: `DONATION-${Date.now()}`,
                swiftCode: 'ZEWDUS33'
            }
        };
    }

    showDonationLoading() {
        const loader = document.createElement('div');
        loader.className = 'donation-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="spinner"></div>
                <p>Processing your donation...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideDonationLoading() {
        const loader = document.querySelector('.donation-loader');
        if (loader) loader.remove();
    }

    showDonationSuccess(result) {
        const modal = document.createElement('div');
        modal.className = 'donation-success-modal';
        modal.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h2>Thank You!</h2>
                <p>Your donation has been processed successfully.</p>
                <div class="donation-details">
                    <p><strong>Amount:</strong> $${result.amount}</p>
                    <p><strong>Transaction ID:</strong> ${result.paymentId}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                ${result.bankDetails ? `
                    <div class="bank-details">
                        <h4>Bank Transfer Details:</h4>
                        <p>Bank: ${result.bankDetails.bankName}</p>
                        <p>Account: ${result.bankDetails.accountNumber}</p>
                        <p>Reference: ${result.bankDetails.reference}</p>
                    </div>
                ` : ''}
                <div class="success-actions">
                    <button class="btn-download-receipt" onclick="donationManager.downloadReceipt('${result.paymentId}')">
                        <i class="fas fa-download"></i> Download Receipt
                    </button>
                    <button class="btn-share-donation" onclick="donationManager.shareDonation('${result.paymentId}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <button class="btn-close-success">Continue</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-success').addEventListener('click', () => {
            modal.remove();
            document.querySelector('.donation-modal')?.remove();
        });
    }

    showDonationError(error) {
        alert(`Donation failed: ${error}`);
    }

    saveDonation(donationData) {
        this.donations.push({
            ...donationData,
            id: `DON-${Date.now()}`,
            status: 'completed'
        });
        localStorage.setItem('user_donations', JSON.stringify(this.donations));
    }

    downloadReceipt(paymentId) {
        const donation = this.donations.find(d => d.paymentId === paymentId);
        if (!donation) return;

        const receipt = this.generateReceipt(donation);
        const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donation-receipt-${paymentId}.json`;
        a.click();
    }

    generateReceipt(donation) {
        return {
            receiptId: `RECEIPT-${Date.now()}`,
            date: new Date().toLocaleDateString(),
            organization: 'ZewedJobs Foundation',
            taxId: 'TAX-123456789',
            donation,
            amount: donation.amount,
            taxDeductible: true,
            thankYouNote: 'Thank you for your generous donation!'
        };
    }

    shareDonation(paymentId) {
        const donation = this.donations.find(d => d.paymentId === paymentId);
        if (!donation) return;

        const shareData = {
            title: 'I just made a donation!',
            text: `I donated to support a great cause through ZewedJobs Foundation.`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback to social sharing
            navigator.clipboard.writeText(`I donated to ZewedJobs Foundation!`);
            alert('Donation message copied to clipboard!');
        }
    }

    shareCampaign(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        const shareData = {
            title: campaign.title,
            text: campaign.description,
            url: `${window.location.origin}/campaigns/${campaignId}`
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            this.showShareOptions(campaign);
        }
    }

    showShareOptions(campaign) {
        const modal = document.createElement('div');
        modal.className = 'share-campaign-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Share Campaign</h3>
                <div class="share-options">
                    <button class="btn-share-facebook" onclick="donationManager.shareToFacebook(${campaign.id})">
                        <i class="fab fa-facebook"></i> Facebook
                    </button>
                    <button class="btn-share-twitter" onclick="donationManager.shareToTwitter(${campaign.id})">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button class="btn-share-linkedin" onclick="donationManager.shareToLinkedIn(${campaign.id})">
                        <i class="fab fa-linkedin"></i> LinkedIn
                    </button>
                    <button class="btn-copy-link" onclick="donationManager.copyCampaignLink(${campaign.id})">
                        <i class="fas fa-link"></i> Copy Link
                    </button>
                    <button class="btn-share-email" onclick="donationManager.shareViaEmail(${campaign.id})">
                        <i class="fas fa-envelope"></i> Email
                    </button>
                </div>
                <button class="btn-close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    shareToFacebook(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        const url = encodeURIComponent(`${window.location.origin}/campaigns/${campaignId}`);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }

    shareToTwitter(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        const text = encodeURIComponent(`Support ${campaign.title} on ZewedJobs!`);
        const url = encodeURIComponent(`${window.location.origin}/campaigns/${campaignId}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }

    shareToLinkedIn(campaignId) {
        const url = encodeURIComponent(`${window.location.origin}/campaigns/${campaignId}`);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    }

    copyCampaignLink(campaignId) {
        const url = `${window.location.origin}/campaigns/${campaignId}`;
        navigator.clipboard.writeText(url);
        alert('Campaign link copied to clipboard!');
    }

    shareViaEmail(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        const subject = encodeURIComponent(`Check out this campaign: ${campaign.title}`);
        const body = encodeURIComponent(
            `I wanted to share this campaign with you:\n\n` +
            `${campaign.title}\n` +
            `${campaign.description}\n\n` +
            `You can learn more and donate here: ${window.location.origin}/campaigns/${campaignId}`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    setupRecurringDonations() {
        // Check for recurring donations that need processing
        const recurringDonations = JSON.parse(localStorage.getItem('recurring_donations') || '[]');
        const today = new Date().toDateString();

        recurringDonations.forEach(donation => {
            if (donation.nextPaymentDate && new Date(donation.nextPaymentDate).toDateString() === today) {
                this.processRecurringDonation(donation);
            }
        });
    }

    processRecurringDonation(donation) {
        // Process recurring donation
        console.log('Processing recurring donation:', donation);
        // Update next payment date
        donation.nextPaymentDate = this.calculateNextPaymentDate(donation);
        localStorage.setItem('recurring_donations', JSON.stringify(recurringDonations));
    }

    calculateNextPaymentDate(donation) {
        const date = new Date();
        switch (donation.frequency) {
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        return date.toISOString();
    }

    getDonationHistory() {
        return this.donations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getDonationStats() {
        const total = this.donations.reduce((sum, d) => sum + d.amount, 0);
        const campaigns = {};
        
        this.donations.forEach(donation => {
            const campaign = this.campaigns.find(c => c.id == donation.campaignId);
            if (campaign) {
                if (!campaigns[campaign.title]) {
                    campaigns[campaign.title] = 0;
                }
                campaigns[campaign.title] += donation.amount;
            }
        });

        return {
            total,
            count: this.donations.length,
            average: total / this.donations.length,
            campaigns,
            lastDonation: this.donations[0]?.timestamp
        };
    }
}

// Initialize donation manager
document.addEventListener('DOMContentLoaded', () => {
    window.donationManager = new DonationManager();
});
