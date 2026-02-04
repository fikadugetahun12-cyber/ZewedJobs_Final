// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = 'white';
            navLinks.style.padding = '1rem';
            navLinks.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });
    }
    
    // Favorite button functionality
    const favoriteButtons = document.querySelectorAll('.favorite');
    
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('far');
            this.classList.toggle('fas');
            this.classList.toggle('active');
            
            // Show notification
            if (this.classList.contains('active')) {
                showNotification('Job saved to favorites!');
            } else {
                showNotification('Job removed from favorites!');
            }
        });
    });
    
    // Apply button functionality
    const applyButtons = document.querySelectorAll('.btn-apply');
    
    applyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const jobTitle = this.closest('.job-card').querySelector('h3').textContent;
            const companyName = this.closest('.job-card').querySelector('.company-name').textContent;
            
            showNotification(`Applying for ${jobTitle} at ${companyName}...`);
            
            // Simulate application process
            setTimeout(() => {
                showNotification('Application submitted successfully!', 'success');
            }, 1500);
        });
    });
    
    // Search form submission
    const searchForm = document.querySelector('.search-form');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const jobInput = this.querySelector('input[type="text"]').value;
            const locationInput = this.querySelectorAll('input[type="text"]')[1].value;
            
            if (!jobInput.trim()) {
                showNotification('Please enter a job title or keyword', 'warning');
                return;
            }
            
            showNotification(`Searching for "${jobInput}" jobs in "${locationInput || 'any location'}"...`);
            
            // In a real app, you would submit the form or make an API call here
            // For now, just simulate search
            setTimeout(() => {
                showNotification(`Found 42 jobs matching your search!`, 'success');
            }, 1000);
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's a login/signup link
            if (href === '#login' || href === '#signup') {
                return;
            }
            
            if (href !== '#') {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Update active nav link
                    document.querySelectorAll('.nav-links a').forEach(link => {
                        link.classList.remove('active');
                    });
                    this.classList.add('active');
                }
            }
        });
    });
    
    // Job card hover effects
    const jobCards = document.querySelectorAll('.job-card');
    
    jobCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#4a6cf7'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Add keyframe animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
    }
    
    // Initialize jobs counter animation
    function animateCounter(element, target, duration) {
        let start = 0;
        const increment = target / (duration / 16); // 60fps
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target + '+';
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start) + '+';
            }
        }, 16);
    }
    
    // Simulate live job count
    const jobCountElement = document.createElement('div');
    jobCountElement.className = 'job-count';
    jobCountElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 10px 15px;
        border-radius: 20px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(74, 108, 247, 0.3);
        z-index: 1000;
        cursor: pointer;
    `;
    jobCountElement.innerHTML = '<i class="fas fa-briefcase"></i> <span id="liveJobCount">0</span> Jobs Available';
    
    document.body.appendChild(jobCountElement);
    
    // Animate job count
    setTimeout(() => {
        animateCounter(document.getElementById('liveJobCount'), 1247, 2000);
    }, 1000);
    
    // Job count click event
    jobCountElement.addEventListener('click', () => {
        document.querySelector('#jobs').scrollIntoView({
            behavior: 'smooth'
        });
    });
});
