// image-worker.js - Web Worker for image processing
self.addEventListener('message', async (e) => {
    const { type, data } = e.data;
    
    switch (type) {
        case 'COMPRESS_IMAGE':
            const compressed = await compressImage(data.file, data.options);
            self.postMessage({
                type: 'COMPRESS_IMAGE_RESULT',
                data: compressed
            });
            break;
            
        case 'RESIZE_IMAGE':
            const resized = await resizeImage(data.file, data.options);
            self.postMessage({
                type: 'RESIZE_IMAGE_RESULT',
                data: resized
            });
            break;
            
        case 'CONVERT_FORMAT':
            const converted = await convertImageFormat(data.file, data.format);
            self.postMessage({
                type: 'CONVERT_FORMAT_RESULT',
                data: converted
            });
            break;
            
        case 'EXTRACT_METADATA':
            const metadata = await extractImageMetadata(data.file);
            self.postMessage({
                type: 'EXTRACT_METADATA_RESULT',
                data: metadata
            });
            break;
    }
});

async function compressImage(file, options = {}) {
    const { quality = 0.8, maxWidth = 1920, maxHeight = 1080 } = options;
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                
                // Calculate new dimensions
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
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
                        width,
                        height,
                        size: blob.size,
                        originalSize: file.size,
                        compressionRatio: (blob.size / file.size * 100).toFixed(2)
                    });
                }, file.type, quality);
            };
        };
    });
}

async function resizeImage(file, options = {}) {
    const { width, height, maintainAspectRatio = true } = options;
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let newWidth = width || img.width;
                let newHeight = height || img.height;
                
                if (maintainAspectRatio && width && !height) {
                    newHeight = (img.height * width) / img.width;
                } else if (maintainAspectRatio && height && !width) {
                    newWidth = (img.width * height) / img.height;
                }
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                canvas.toBlob((blob) => {
                    resolve({
                        blob,
                        width: newWidth,
                        height: newHeight
                    });
                }, file.type);
            };
        };
    });
}

async function convertImageFormat(file, format = 'webp') {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const mimeType = `image/${format}`;
                canvas.toBlob((blob) => {
                    resolve({
                        blob,
                        format,
                        mimeType,
                        size: blob.size
                    });
                }, mimeType, 0.8);
            };
        };
    });
}

async function extractImageMetadata(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file.slice(0, 1024)); // Read first 1KB for metadata
        
        reader.onload = (e) => {
            const buffer = e.target.result;
            const view = new DataView(buffer);
            
            let metadata = {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                lastModified: file.lastModified,
                width: null,
                height: null,
                colorDepth: null,
                compression: null,
                resolution: null
            };
            
            // Try to extract EXIF/JPEG metadata
            try {
                // Check for JPEG
                if (view.getUint16(0) === 0xFFD8) {
                    let offset = 2;
                    while (offset < view.byteLength) {
                        const marker = view.getUint16(offset);
                        offset += 2;
                        
                        if (marker === 0xFFC0 || marker === 0xFFC2) { // SOF0 or SOF2
                            metadata.height = view.getUint16(offset + 3);
                            metadata.width = view.getUint16(offset + 5);
                            metadata.colorDepth = view.getUint8(offset + 7);
                            metadata.compression = marker === 0xFFC0 ? 'Baseline' : 'Progressive';
                            break;
                        }
                        
                        const length = view.getUint16(offset);
                        offset += length;
                    }
                }
                
                // Check for PNG
                if (view.getUint32(0) === 0x89504E47) {
                    // PNG signature found
                    metadata.width = view.getUint32(16);
                    metadata.height = view.getUint32(20);
                    metadata.colorDepth = view.getUint8(24);
                    metadata.compression = 'Deflate';
                }
            } catch (error) {
                console.warn('Failed to extract metadata:', error);
            }
            
            resolve(metadata);
        };
    });
}
