// images-loader.js - Image loading and optimization
class ImageLoader {
    constructor() {
        this.observer = null;
        this.imageCache = new Set();
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupErrorHandling();
        this.setupPreloading();
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        this.observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });

            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.observer.observe(img);
            });
        } else {
            // Fallback for older browsers
            this.loadAllImages();
        }
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        // Create new image to test loading
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = src;
            img.classList.add('lazy-loaded');
            img.removeAttribute('data-src');
            this.imageCache.add(src);
        };

        tempImg.onerror = () => {
            console.error('Failed to load image:', src);
            img.classList.add('image-error');
            this.showFallbackImage(img);
        };

        tempImg.src = src;
    }

    loadAllImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    }

    setupImageOptimization() {
        // Add responsive srcset attributes
        this.addResponsiveImages();
        
        // Optimize images on the fly
        this.optimizeExistingImages();
    }

    addResponsiveImages() {
        const responsiveImages = document.querySelectorAll('img[data-srcset]');
        
        responsiveImages.forEach(img => {
            const srcset = img.getAttribute('data-srcset');
            const sizes = img.getAttribute('data-sizes') || '100vw';
            
            img.srcset = srcset;
            img.sizes = sizes;
            
            // Remove data attributes
            img.removeAttribute('data-srcset');
            img.removeAttribute('data-sizes');
        });
    }

    optimizeExistingImages() {
        // Add loading="lazy" to images below the fold
        const images = document.querySelectorAll('img:not([loading])');
        const viewportHeight = window.innerHeight;
        
        images.forEach((img, index) => {
            const rect = img.getBoundingClientRect();
            
            if (rect.top > viewportHeight * 2) {
                img.loading = 'lazy';
            }
            
            // Add alt text if missing
            if (!img.alt && img.src) {
                img.alt = this.generateAltText(img.src);
            }
        });
    }

    generateAltText(src) {
        // Extract filename and generate alt text
        const filename = src.split('/').pop().split('.')[0];
        const words = filename.split(/[-_]/);
        const capitalized = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return capitalized || 'Image';
    }

    setupErrorHandling() {
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    handleImageError(img) {
        console.warn('Image failed to load:', img.src);
        
        // Mark as errored
        img.classList.add('image-error');
        
        // Try to show fallback
        this.showFallbackImage(img);
        
        // Retry loading after 5 seconds
        setTimeout(() => {
            if (img.classList.contains('image-error')) {
                this.retryImageLoad(img);
            }
        }, 5000);
    }

    showFallbackImage(img) {
        const fallbackSrc = img.getAttribute('data-fallback') || 
                           '/images/ui/placeholder-image.png';
        
        // Only set if not already set to avoid loops
        if (img.src !== fallbackSrc) {
            img.src = fallbackSrc;
            img.alt = 'Placeholder image - Original failed to load';
        }
    }

    retryImageLoad(img) {
        const originalSrc = img.getAttribute('data-original-src') || img.src;
        
        if (originalSrc && !this.imageCache.has(originalSrc)) {
            const tempImg = new Image();
            tempImg.onload = () => {
                img.src = originalSrc;
                img.classList.remove('image-error');
                this.imageCache.add(originalSrc);
            };
            tempImg.src = originalSrc;
        }
    }

    setupPreloading() {
        // Preload critical images
        this.preloadCriticalImages();
        
        // Preload images on hover
        this.preloadOnHover();
    }

    preloadCriticalImages() {
        const criticalImages = [
            '/images/logos/zewedjobs-logo.png',
            '/images/banners/hero-banner.jpg',
            '/images/icons/briefcase-icon.svg'
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    preloadOnHover() {
        // Preload images when user hovers over links
        document.querySelectorAll('a[data-preload-image]').forEach(link => {
            link.addEventListener('mouseenter', () => {
                const imageSrc = link.getAttribute('data-preload-image');
                this.preloadSingleImage(imageSrc);
            });
        });
    }

    preloadSingleImage(src) {
        if (!this.imageCache.has(src)) {
            const img = new Image();
            img.src = src;
            this.imageCache.add(src);
        }
    }

    // Image gallery functionality
    createGallery(containerSelector, options = {}) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const images = container.querySelectorAll('img');
        const galleryId = `gallery-${Date.now()}`;

        // Add click handlers
        images.forEach((img, index) => {
            img.dataset.galleryId = galleryId;
            img.dataset.index = index;
            
            img.addEventListener('click', () => {
                this.openGallery(galleryId, index);
            });
        });

        // Create gallery modal
        this.createGalleryModal(galleryId, images, options);
    }

    createGalleryModal(galleryId, images, options) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.id = `modal-${galleryId}`;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'image-modal-content';
        
        // Add images to modal
        images.forEach((img, index) => {
            const modalImg = document.createElement('img');
            modalImg.src = img.src;
            modalImg.alt = img.alt;
            modalImg.dataset.index = index;
            modalImg.style.display = index === 0 ? 'block' : 'none';
            modalContent.appendChild(modalImg);
        });
        
        // Add navigation
        const prevBtn = document.createElement('button');
        prevBtn.className = 'gallery-prev';
        prevBtn.innerHTML = '&lt;';
        prevBtn.addEventListener('click', () => this.navigateGallery(galleryId, -1));
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'gallery-next';
        nextBtn.innerHTML = '&gt;';
        nextBtn.addEventListener('click', () => this.navigateGallery(galleryId, 1));
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'gallery-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.closeGallery(galleryId));
        
        const counter = document.createElement('div');
        counter.className = 'gallery-counter';
        counter.innerHTML = `1 / ${images.length}`;
        
        modal.appendChild(modalContent);
        modal.appendChild(prevBtn);
        modal.appendChild(nextBtn);
        modal.appendChild(closeBtn);
        modal.appendChild(counter);
        document.body.appendChild(modal);
    }

    openGallery(galleryId, startIndex = 0) {
        const modal = document.getElementById(`modal-${galleryId}`);
        const images = modal.querySelectorAll('img');
        const counter = modal.querySelector('.gallery-counter');
        
        // Hide all images
        images.forEach(img => img.style.display = 'none');
        
        // Show selected image
        images[startIndex].style.display = 'block';
        counter.innerHTML = `${startIndex + 1} / ${images.length}`;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Store current index
        modal.dataset.currentIndex = startIndex;
    }

    navigateGallery(galleryId, direction) {
        const modal = document.getElementById(`modal-${galleryId}`);
        const images = modal.querySelectorAll('img');
        const counter = modal.querySelector('.gallery-counter');
        let currentIndex = parseInt(modal.dataset.currentIndex || 0);
        
        currentIndex += direction;
        
        if (currentIndex < 0) {
            currentIndex = images.length - 1;
        } else if (currentIndex >= images.length) {
            currentIndex = 0;
        }
        
        // Update display
        images.forEach(img => img.style.display = 'none');
        images[currentIndex].style.display = 'block';
        counter.innerHTML = `${currentIndex + 1} / ${images.length}`;
        
        modal.dataset.currentIndex = currentIndex;
    }

    closeGallery(galleryId) {
        const modal = document.getElementById(`modal-${galleryId}`);
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Image optimization utilities
    compressImage(file, quality = 0.8, maxWidth = 1920) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Resize if too large
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to blob
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, file.type, quality);
                };
                
                img.onerror = reject;
            };
            
            reader.onerror = reject;
        });
    }

    getImageDominantColor(img) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 1;
            canvas.height = 1;
            
            ctx.drawImage(img, 0, 0, 1, 1);
            
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            resolve(`rgb(${r}, ${g}, ${b})`);
        });
    }

    // Analytics
    trackImagePerformance() {
        const entries = performance.getEntriesByType('resource')
            .filter(entry => entry.initiatorType === 'img');
        
        const stats = {
            total: entries.length,
            averageSize: 0,
            averageLoadTime: 0,
            failed: 0
        };
        
        if (entries.length > 0) {
            const totalSize = entries.reduce((sum, entry) => sum + entry.transferSize, 0);
            const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);
            
            stats.averageSize = Math.round(totalSize / entries.length);
            stats.averageLoadTime = Math.round(totalTime / entries.length);
            stats.failed = entries.filter(entry => entry.transferSize === 0).length;
        }
        
        return stats;
    }

    // Cleanup
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.imageCache.clear();
    }
}

// Initialize image loader
document.addEventListener('DOMContentLoaded', () => {
    window.imageLoader = new ImageLoader();
});

// Utility function to load single image
export async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Utility function to preload multiple images
export async function preloadImages(sources) {
    return Promise.all(sources.map(src => loadImage(src)));
}

// Utility function to create responsive image element
export function createResponsiveImage(src, srcset, sizes, alt, className = '') {
    const img = document.createElement('img');
    img.src = src;
    
    if (srcset) img.srcset = srcset;
    if (sizes) img.sizes = sizes;
    if (alt) img.alt = alt;
    if (className) img.className = className;
    
    img.loading = 'lazy';
    
    return img;
}
