// payments.js - Payment Processing System
class PaymentHandler {
    constructor() {
        this.stripe = null;
        this.paymentMethods = ['card', 'mobile_money', 'bank_transfer'];
        this.currency = 'USD';
        this.init();
    }

    async init() {
        // Initialize payment gateway (Stripe, PayPal, etc.)
        await this.loadStripe();
        this.setupEventListeners();
        console.log('Payment system initialized');
    }

    async loadStripe() {
        // Load Stripe.js dynamically
        if (typeof Stripe === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            document.head.appendChild(script);
            
            return new Promise(resolve => {
                script.onload = () => {
                    this.stripe = Stripe('pk_test_your_publishable_key');
                    resolve();
                };
            });
        }
    }

    setupEventListeners() {
        // Form submission for payments
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('payment-form')) {
                e.preventDefault();
                this.processPayment(e.target);
            }
        });

        // Payment method selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'payment_method') {
                this.togglePaymentFields(e.target.value);
            }
        });
    }

    togglePaymentFields(method) {
        const fields = {
            'card': '.card-fields',
            'mobile_money': '.mobile-money-fields',
            'bank_transfer': '.bank-transfer-fields'
        };

        // Hide all fields
        Object.values(fields).forEach(selector => {
            const element = document.querySelector(selector);
            if (element) element.style.display = 'none';
        });

        // Show selected field
        if (fields[method]) {
            const element = document.querySelector(fields[method]);
            if (element) element.style.display = 'block';
        }
    }

    async processPayment(form) {
        const formData = new FormData(form);
        const paymentData = {
            amount: formData.get('amount'),
            currency: this.currency,
            description: formData.get('description'),
            payment_method: formData.get('payment_method'),
            metadata: {
                userId: localStorage.getItem('userId'),
                itemId: formData.get('item_id')
            }
        };

        // Show loading state
        this.showLoading();

        try {
            let result;
            switch (paymentData.payment_method) {
                case 'card':
                    result = await this.processCardPayment(paymentData);
                    break;
                case 'mobile_money':
                    result = await this.processMobileMoneyPayment(paymentData);
                    break;
                case 'bank_transfer':
                    result = await this.processBankTransfer(paymentData);
                    break;
                default:
                    throw new Error('Invalid payment method');
            }

            if (result.success) {
                this.showSuccess(result);
                this.saveTransaction(paymentData);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async processCardPayment(paymentData) {
        // Create payment intent on backend
        const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        const { clientSecret } = await response.json();

        // Confirm card payment
        const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: this.cardElement,
                billing_details: {
                    name: document.getElementById('card-name').value
                }
            }
        });

        if (error) {
            throw new Error(error.message);
        }

        return {
            success: true,
            paymentId: paymentIntent.id,
            amount: paymentIntent.amount / 100
        };
    }

    async processMobileMoneyPayment(paymentData) {
        // Process mobile money payment
        const response = await fetch('/api/payments/mobile-money', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...paymentData,
                phone: document.getElementById('mobile-phone').value,
                provider: document.getElementById('mobile-provider').value
            })
        });

        const result = await response.json();
        return result;
    }

    processBankTransfer(paymentData) {
        // Generate bank transfer details
        return {
            success: true,
            bankDetails: {
                bankName: 'ZewedJobs Bank',
                accountNumber: '1234567890',
                accountName: 'ZewedJobs Ltd',
                reference: `ZEWED-${Date.now()}`
            },
            message: 'Please transfer to the account above'
        };
    }

    showLoading() {
        const loader = document.createElement('div');
        loader.className = 'payment-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="spinner"></div>
                <p>Processing payment...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.querySelector('.payment-loader');
        if (loader) loader.remove();
    }

    showSuccess(result) {
        const successModal = document.createElement('div');
        successModal.className = 'payment-success-modal';
        successModal.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h3>Payment Successful!</h3>
                <p>Payment ID: ${result.paymentId}</p>
                <p>Amount: $${result.amount}</p>
                <button class="btn-close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(successModal);

        successModal.querySelector('.btn-close-modal').addEventListener('click', () => {
            successModal.remove();
        });
    }

    showError(error) {
        alert(`Payment failed: ${error}`);
    }

    saveTransaction(paymentData) {
        const transactions = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
        transactions.push({
            ...paymentData,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });
        localStorage.setItem('payment_transactions', JSON.stringify(transactions));
    }

    getTransactionHistory() {
        return JSON.parse(localStorage.getItem('payment_transactions') || '[]');
    }

    generateReceipt(transactionId) {
        const transactions = this.getTransactionHistory();
        const transaction = transactions.find(t => t.paymentId === transactionId);
        
        if (!transaction) return null;

        return {
            receiptId: `REC-${Date.now()}`,
            date: new Date().toLocaleDateString(),
            transaction,
            total: transaction.amount,
            tax: transaction.amount * 0.1, // 10% tax
            grandTotal: transaction.amount * 1.1
        };
    }
}

// Initialize payment system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.paymentHandler = new PaymentHandler();
});
