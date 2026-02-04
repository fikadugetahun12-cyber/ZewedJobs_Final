// courses.js - Courses and Learning Management
class CourseManager {
    constructor() {
        this.courses = [];
        this.userProgress = {};
        this.init();
    }

    async init() {
        await this.loadCourses();
        await this.loadUserProgress();
        this.renderCourses();
        this.setupEventListeners();
    }

    async loadCourses() {
        try {
            const response = await fetch('/api/courses');
            this.courses = await response.json();
        } catch (error) {
            console.error('Failed to load courses:', error);
            // Load sample courses if API fails
            this.courses = this.getSampleCourses();
        }
    }

    getSampleCourses() {
        return [
            {
                id: 1,
                title: 'Web Development Bootcamp',
                category: 'Technology',
                instructor: 'John Doe',
                duration: '8 weeks',
                level: 'Beginner',
                price: 299,
                rating: 4.7,
                students: 1500,
                thumbnail: 'https://via.placeholder.com/300x200',
                description: 'Learn full-stack web development',
                modules: 12,
                language: 'English',
                certificate: true
            },
            {
                id: 2,
                title: 'Digital Marketing Mastery',
                category: 'Marketing',
                instructor: 'Jane Smith',
                duration: '6 weeks',
                level: 'Intermediate',
                price: 199,
                rating: 4.5,
                students: 1200,
                thumbnail: 'https://via.placeholder.com/300x200',
                description: 'Master digital marketing strategies',
                modules: 10,
                language: 'English',
                certificate: true
            }
        ];
    }

    async loadUserProgress() {
        const userId = localStorage.getItem('userId');
        if (userId) {
            try {
                const response = await fetch(`/api/users/${userId}/progress`);
                this.userProgress = await response.json();
            } catch (error) {
                this.userProgress = JSON.parse(localStorage.getItem('course_progress') || '{}');
            }
        }
    }

    renderCourses() {
        const container = document.querySelector('.courses-container');
        if (!container) return;

        container.innerHTML = this.courses.map(course => `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-thumbnail">
                    <img src="${course.thumbnail}" alt="${course.title}">
                    ${course.price === 0 ? '<span class="course-badge free">Free</span>' : ''}
                </div>
                <div class="course-content">
                    <div class="course-header">
                        <h3>${course.title}</h3>
                        <div class="course-meta">
                            <span><i class="fas fa-chalkboard-teacher"></i> ${course.instructor}</span>
                            <span><i class="fas fa-clock"></i> ${course.duration}</span>
                            <span><i class="fas fa-signal"></i> ${course.level}</span>
                        </div>
                    </div>
                    <p class="course-description">${course.description}</p>
                    <div class="course-stats">
                        <span><i class="fas fa-star"></i> ${course.rating}</span>
                        <span><i class="fas fa-users"></i> ${course.students}</span>
                        <span><i class="fas fa-book"></i> ${course.modules} modules</span>
                    </div>
                    <div class="course-footer">
                        ${this.userProgress[course.id] ? 
                            `<div class="progress-container">
                                <div class="progress-bar" style="width: ${this.userProgress[course.id].progress}%"></div>
                                <span>${this.userProgress[course.id].progress}% Complete</span>
                            </div>
                            <button class="btn-continue" onclick="courseManager.continueCourse(${course.id})">
                                Continue
                            </button>` :
                            `<div class="course-price">
                                ${course.price > 0 ? `$${course.price}` : 'Free'}
                            </div>
                            <button class="btn-enroll" onclick="courseManager.enrollCourse(${course.id})">
                                Enroll Now
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Course category filter
        document.addEventListener('change', (e) => {
            if (e.target.id === 'course-category') {
                this.filterCourses(e.target.value);
            }
        });

        // Search courses
        document.addEventListener('input', (e) => {
            if (e.target.id === 'course-search') {
                this.searchCourses(e.target.value);
            }
        });
    }

    filterCourses(category) {
        const filtered = category === 'all' 
            ? this.courses 
            : this.courses.filter(course => course.category === category);
        
        this.renderFilteredCourses(filtered);
    }

    searchCourses(query) {
        const filtered = this.courses.filter(course =>
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.description.toLowerCase().includes(query.toLowerCase()) ||
            course.instructor.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderFilteredCourses(filtered);
    }

    renderFilteredCourses(courses) {
        const container = document.querySelector('.courses-container');
        if (!container) return;

        if (courses.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No courses found</h3>
                    <p>Try different search terms or categories</p>
                </div>
            `;
            return;
        }

        this.renderCourses();
    }

    async enrollCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        if (course.price > 0) {
            // Redirect to payment
            window.location.href = `/payment?type=course&id=${courseId}&amount=${course.price}`;
            return;
        }

        // Free enrollment
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Please login to enroll');
            return;
        }

        try {
            const response = await fetch('/api/courses/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseId })
            });

            if (response.ok) {
                this.userProgress[courseId] = { progress: 0, currentModule: 1 };
                this.saveProgress();
                this.renderCourses();
                alert('Successfully enrolled!');
            }
        } catch (error) {
            console.error('Enrollment failed:', error);
        }
    }

    continueCourse(courseId) {
        const progress = this.userProgress[courseId];
        if (progress) {
            window.location.href = `/course/${courseId}/module/${progress.currentModule}`;
        }
    }

    updateProgress(courseId, moduleId, completed = true) {
        if (!this.userProgress[courseId]) {
            this.userProgress[courseId] = { progress: 0, currentModule: 1 };
        }

        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        if (completed) {
            const progressPercent = (moduleId / course.modules) * 100;
            this.userProgress[courseId].progress = Math.min(progressPercent, 100);
            this.userProgress[courseId].currentModule = moduleId + 1;
            
            if (progressPercent === 100) {
                this.completeCourse(courseId);
            }
        }

        this.saveProgress();
    }

    completeCourse(courseId) {
        // Award certificate
        const certificate = {
            courseId,
            userId: localStorage.getItem('userId'),
            date: new Date().toISOString(),
            certificateId: `CERT-${Date.now()}-${courseId}`
        };

        this.saveCertificate(certificate);
        
        // Show completion modal
        this.showCompletionModal(courseId);
    }

    showCompletionModal(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        const modal = document.createElement('div');
        modal.className = 'course-completion-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <i class="fas fa-trophy"></i>
                <h2>Course Completed!</h2>
                <p>Congratulations on completing "${course.title}"</p>
                <p>You can now download your certificate.</p>
                <div class="modal-actions">
                    <button class="btn-download-certificate" onclick="courseManager.downloadCertificate(${courseId})">
                        Download Certificate
                    </button>
                    <button class="btn-close-modal">Continue Learning</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveProgress() {
        localStorage.setItem('course_progress', JSON.stringify(this.userProgress));
    }

    saveCertificate(certificate) {
        const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        certificates.push(certificate);
        localStorage.setItem('certificates', JSON.stringify(certificates));
    }

    async downloadCertificate(courseId) {
        // Generate and download certificate
        const certificate = this.generateCertificate(courseId);
        
        // In a real app, this would generate a PDF
        const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${courseId}.json`;
        a.click();
    }

    generateCertificate(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        const userId = localStorage.getItem('userId');
        
        return {
            certificateId: `CERT-${Date.now()}-${courseId}`,
            studentId: userId,
            studentName: localStorage.getItem('userName') || 'Student',
            courseTitle: course?.title || 'Course',
            completionDate: new Date().toLocaleDateString(),
            instructor: course?.instructor || 'Instructor',
            hours: '40',
            issuedBy: 'ZewedJobs Academy',
            verificationUrl: `https://zewedjobs.com/verify/${Date.now()}`
        };
    }
}

// Initialize course manager
document.addEventListener('DOMContentLoaded', () => {
    window.courseManager = new CourseManager();
});
