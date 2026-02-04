# ZewedJobs Images Directory

This directory contains all images for the ZewedJobs platform.

## Directory Structure

## Image Specifications

### Logo Images
- **Format**: SVG (primary), PNG (fallback)
- **Size**: 400x100px (desktop), 200x50px (mobile)
- **Background**: Transparent or solid brand colors

### Banner Images
- **Hero Banner**: 2000x800px (16:9 ratio)
- **Ad Banners**: 
  - 728x90px (Leaderboard)
  - 300x250px (Medium Rectangle)
  - 970x250px (Billboard)
  - 300x600px (Half Page)
  - 320x50px (Mobile Banner)
- **Format**: JPEG (photos), PNG (graphics), WebP (optimized)

### Course & Event Images
- **Thumbnails**: 400x300px (4:3 ratio)
- **Cover Images**: 1200x400px (3:1 ratio)
- **Format**: JPEG for photos, WebP for optimization

### Partner Logos
- **Size**: 200x100px
- **Background**: White or transparent
- **Format**: PNG with transparency

## Optimization Guidelines

1. **Compress all images**
   - Use lossless compression for logos
   - Use 80% quality for photos
   - Max file size: 500KB per image

2. **Responsive images**
   - Provide multiple sizes using srcset
   - Use WebP format with JPEG/PNG fallbacks
   - Lazy load images below the fold

3. **Accessibility**
   - Always add alt text
   - Ensure color contrast
   - Provide text alternatives for informative images

## Usage Examples

### HTML
```html
<!-- Responsive image with lazy loading -->
<img src="/images/ui/placeholder.jpg" 
     data-src="/images/courses/web-development.jpg"
     data-srcset="/images/courses/web-development-400.jpg 400w,
                  /images/courses/web-development-800.jpg 800w,
                  /images/courses/web-development-1200.jpg 1200w"
     sizes="(max-width: 768px) 100vw, 50vw"
     alt="Web Development Course"
     class="lazy-load course-thumbnail">
