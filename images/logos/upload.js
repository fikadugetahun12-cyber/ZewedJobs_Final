// image-upload.js - Image Upload and Processing Component
class ImageUploader {
    constructor(options = {}) {
        this.options = {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            compress: true,
            multiple: false,
            ...options
        };
        
        this.worker = null;
        this.queue = [];
        this.processing = false;
        this.init();
    }

    init() {
        this.setupWorker();
        this.setupEventListeners();
    }

    setupWorker() {
        if (window.Worker) {
            this.worker = new Worker('/js/utils/image-worker.js');
            
            this.worker.onmessage = (e) => {
                this.handleWorkerMessage(e);
            };
            
            this.worker.onerror = (error) => {
                console.error('Image worker error:', error);
                this.handleUploadError(null, 'Worker error occurred');
            };
        }
    }

    createUploadElement(container, onComplete) {
        const uploadContainer = document.createElement('div');
        uploadContainer.className = 'image-upload-container';
        
        uploadContainer.innerHTML = `
            <div class="upload-area">
                <div class="upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <h3>Upload Images</h3>
                <p>Drag & drop images or click to browse</p>
                <p class="upload-hint">
                    Max size: ${this.formatFileSize(this.options.maxSize)} • 
                    Formats: ${this.options.allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}
                </p>
                <input type="file" class="upload-input" 
                       accept="${this.options.allowedTypes.join(',')}"
                       ${this.options.multiple ? 'multiple' : ''}>
                <button class="btn-browse">Browse Files</button>
            </div>
            <div class="upload-preview"></div>
            <div class="upload-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">0%</div>
            </div>
            <div class="upload-actions">
                <button class="btn-start-upload">Start Upload</button>
                <button class="btn-cancel-upload">Cancel</button>
            </div>
        `;
        
        container.appendChild(uploadContainer);
        this.setupUploadEvents(uploadContainer, onComplete);
        
        return uploadContainer;
    }

    setupUploadEvents(container, onComplete) {
        const uploadArea = container.querySelector('.upload-area');
        const fileInput = container.querySelector('.upload-input');
        const browseBtn = container.querySelector('.btn-browse');
        const preview = container.querySelector('.upload-preview');
        const startBtn = container.querySelector('.btn-start-upload');
        const cancelBtn = container.querySelector('.btn-cancel-upload');
        const progressBar = container.querySelector('.progress-fill');
        const progressText = container.querySelector('.progress-text');

        // Click to browse
        browseBtn.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files, preview);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files, preview);
        });

        // Start upload
        startBtn.addEventListener('click', async () => {
            const images = Array.from(preview.querySelectorAll('.preview-item'))
                .map(item => item.dataset.file);
            
            if (images.length === 0) {
                this.showMessage('Please select images to upload', 'warning');
                return;
            }

            await this.processAndUpload(images, {
                progressBar,
                progressText,
                onComplete
            });
        });

        // Cancel upload
        cancelBtn.addEventListener('click', () => {
            this.cancelUpload();
            this.showMessage('Upload cancelled', 'info');
        });
    }

    handleFiles(files, previewContainer) {
        files.forEach(file => {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.showMessage(validation.error, 'error');
                return;
            }

            // Create preview
            this.createPreview(file, previewContainer);
        });
    }

    validateFile(file) {
        // Check file type
        if (!this.options.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Invalid file type. Allowed: ${this.options.allowedTypes.join(', ')}`
            };
        }

        // Check file size
        if (file.size > this.options.maxSize) {
            return {
                valid: false,
                error: `File too large. Max size: ${this.formatFileSize(this.options.maxSize)}`
            };
        }

        return { valid: true };
    }

    async createPreview(file, container) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.dataset.file = file.name;
            
            previewItem.innerHTML = `
                <div class="preview-image">
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="preview-overlay">
                        <button class="btn-remove-preview" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="file-info">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                        </div>
                    </div>
                </div>
                <div class="preview-actions">
                    <button class="btn-rotate-left" title="Rotate left">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="btn-rotate-right" title="Rotate right">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="btn-crop" title="Crop">
                        <i class="fas fa-crop"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(previewItem);
            
            // Add event listeners for preview actions
            this.setupPreviewActions(previewItem, e.target.result);
        };
        
        reader.readAsDataURL(file);
    }

    setupPreviewActions(previewItem, imageSrc) {
        const removeBtn = previewItem.querySelector('.btn-remove-preview');
        const rotateLeftBtn = previewItem.querySelector('.btn-rotate-left');
        const rotateRightBtn = previewItem.querySelector('.btn-rotate-right');
        const cropBtn = previewItem.querySelector('.btn-crop');
        const img = previewItem.querySelector('img');

        removeBtn.addEventListener('click', () => {
            previewItem.remove();
        });

        rotateLeftBtn.addEventListener('click', () => {
            this.rotateImage(img, -90);
        });

        rotateRightBtn.addEventListener('click', () => {
            this.rotateImage(img, 90);
        });

        cropBtn.addEventListener('click', () => {
            this.startCropMode(img);
        });
    }

    rotateImage(img, degrees) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (Math.abs(degrees) === 90) {
            canvas.width = img.height;
            canvas.height = img.width;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(degrees * Math.PI / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        img.src = canvas.toDataURL();
    }

    startCropMode(img) {
        // Implement cropping functionality
        // This would typically use a library like Cropper.js
        this.showMessage('Crop functionality coming soon', 'info');
    }

    async processAndUpload(files, progress) {
        this.queue = files;
        this.processing = true;
        
        const total = files.length;
        let processed = 0;
        
        for (const file of files) {
            if (!this.processing) break;
            
            try {
                // Process image
                const processedImage = await this.processImage(file);
                
                // Upload to server
                await this.uploadImage(processedImage);
                
                processed++;
                
                // Update progress
                const percent = Math.round((processed / total) * 100);
                progress.progressBar.style.width = `${percent}%`;
                progress.progressText.textContent = `${percent}%`;
                
            } catch (error) {
                console.error('Upload failed:', error);
                this.handleUploadError(file, error.message);
            }
        }
        
        this.processing = false;
        
        if (progress.onComplete) {
            progress.onComplete({
                total,
                success: processed,
                failed: total - processed
            });
        }
        
        this.showMessage(`Upload complete: ${processed}/${total} images uploaded`, 'success');
    }

    async processImage(file) {
        if (!this.options.compress) {
            return file;
        }
        
        if (this.worker) {
            return new Promise((resolve, reject) => {
                const messageId = Date.now();
                
                const handler = (e) => {
                    if (e.data.type === 'COMPRESS_IMAGE_RESULT') {
                        this.worker.removeEventListener('message', handler);
                        resolve(e.data.data);
                    }
                };
                
                this.worker.addEventListener('message', handler);
                
                this.worker.postMessage({
                    type: 'COMPRESS_IMAGE',
                    data: {
                        file,
                        options: {
                            quality: this.options.quality,
                            maxWidth: this.options.maxWidth,
                            maxHeight: this.options.maxHeight
                        }
                    }
                });
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    this.worker.removeEventListener('message', handler);
                    reject(new Error('Image processing timeout'));
                }, 30000);
            });
        } else {
            // Fallback without worker
            return this.compressImageFallback(file);
        }
    }

    async compressImageFallback(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    
                    // Resize if needed
                    if (width > this.options.maxWidth || height > this.options.maxHeight) {
                        const ratio = Math.min(
                            this.options.maxWidth / width,
                            this.options.maxHeight / height
                        );
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve({
                            blob,
                            fileName: file.name,
                            originalSize: file.size,
                            compressedSize: blob.size
                        });
                    }, file.type, this.options.quality);
                };
            };
        });
    }

    async uploadImage(processedImage) {
        const formData = new FormData();
        formData.append('image', processedImage.blob, processedImage.fileName);
        formData.append('metadata', JSON.stringify({
            originalSize: processedImage.originalSize,
            compressedSize: processedImage.compressedSize,
            timestamp: new Date().toISOString()
        }));
        
        const response = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return await response.json();
    }

    handleWorkerMessage(e) {
        const { type, data } = e.data;
        
        switch (type) {
            case 'COMPRESS_IMAGE_RESULT':
                // Handled in processImage promise
                break;
                
            case 'RESIZE_IMAGE_RESULT':
                this.emit('imageResized', data);
                break;
                
            case 'CONVERT_FORMAT_RESULT':
                this.emit('imageConverted', data);
                break;
                
            case 'EXTRACT_METADATA_RESULT':
                this.emit('metadataExtracted', data);
                break;
        }
    }

    handleUploadError(file, error) {
        this.emit('uploadError', { file, error });
        this.showMessage(`Upload failed: ${error}`, 'error');
    }

    cancelUpload() {
        this.processing = false;
        this.queue = [];
        this.emit('uploadCancelled');
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `upload-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
                <button class="message-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 5000);
        
        messageDiv.querySelector('.message-close').addEventListener('click', () => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
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

    emit(event, data) {
        const eventObj = new CustomEvent(`imageUploader:${event}`, { detail: data });
        window.dispatchEvent(eventObj);
    }

    // Public API
    upload(file) {
        return this.processAndUpload([file], {});
    }

    uploadMultiple(files) {
        return this.processAndUpload(files, {});
    }

    destroy() {
        if (this.worker) {
            this.worker.terminate();
        }
        this.queue = [];
        this.processing = false;
    }
}

// Export for use in other modules
export default ImageUploader;

// Quick upload function
export async function quickUpload(file, options = {}) {
    const uploader = new ImageUploader(options);
    return await uploader.upload(file);
}

// Batch upload function
export async function batchUpload(files, options = {}) {
    const uploader = new ImageUploader({ ...options, multiple: true });
    return await uploader.uploadMultiple(files);
}
