// certificates.js - Digital Certificates Management
class CertificateManager {
    constructor() {
        this.certificates = [];
        this.templates = [];
        this.init();
    }

    async init() {
        await this.loadCertificates();
        await this.loadTemplates();
        this.renderCertificates();
        this.setupEventListeners();
    }

    async loadCertificates() {
        const userId = localStorage.getItem('userId');
        if (userId) {
            try {
                const response = await fetch(`/api/users/${userId}/certificates`);
                this.certificates = await response.json();
            } catch (error) {
                this.certificates = JSON.parse(localStorage.getItem('user_certificates') || '[]');
            }
        }
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/certificate-templates');
            this.templates = await response.json();
        } catch (error) {
            this.templates = this.getSampleTemplates();
        }
    }

    getSampleTemplates() {
        return [
            {
                id: 1,
                name: 'Professional Blue',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderColor: '#4c51bf',
                fontFamily: 'Montserrat',
                hasLogo: true,
                hasSeal: true
            },
            {
                id: 2,
                name: 'Modern Red',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderColor: '#c53030',
                fontFamily: 'Poppins',
                hasLogo: true,
                hasSeal: false
            },
            {
                id: 3,
                name: 'Elegant Gold',
                background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                borderColor: '#d69e2e',
                fontFamily: 'Playfair Display',
                hasLogo: false,
                hasSeal: true
            }
        ];
    }

    renderCertificates() {
        const container = document.querySelector('.certificates-container');
        if (!container) return;

        if (this.certificates.length === 0) {
            container.innerHTML = `
                <div class="no-certificates">
                    <i class="fas fa-award"></i>
                    <h3>No Certificates Yet</h3>
                    <p>Complete courses to earn certificates</p>
                    <a href="/courses" class="btn-explore-courses">Explore Courses</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.certificates.map(cert => `
            <div class="certificate-card" data-certificate-id="${cert.id}">
                <div class="certificate-preview" style="background: ${this.getTemplateBackground(cert.templateId)}">
                    <div class="certificate-content">
                        <div class="certificate-header">
                            ${cert.hasLogo ? 
                                '<div class="certificate-logo"><i class="fas fa-certificate"></i> ZewedJobs</div>' : 
                                ''}
                            <h3>CERTIFICATE OF COMPLETION</h3>
                        </div>
                        <div class="certificate-body">
                            <p>This certifies that</p>
                            <h2>${cert.studentName || 'Student Name'}</h2>
                            <p>has successfully completed</p>
                            <h3>${cert.courseTitle || 'Course Title'}</h3>
                            <div class="certificate-details">
                                <p>Date of Completion: ${cert.completionDate}</p>
                                <p>Certificate ID: ${cert.certificateId}</p>
                            </div>
                        </div>
                        <div class="certificate-footer">
                            ${cert.hasSeal ? 
                                '<div class="certificate-seal"><i class="fas fa-stamp"></i></div>' : 
                                ''}
                            <div class="signature">
                                <p>Authorized Signature</p>
                                <p>ZewedJobs Academy</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="certificate-actions">
                    <button class="btn-download-certificate" onclick="certificateManager.downloadCertificate('${cert.certificateId}')">
                        <i class="fas fa-download"></i> Download PDF
                    </button>
                    <button class="btn-share-certificate" onclick="certificateManager.shareCertificate('${cert.certificateId}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <button class="btn-verify-certificate" onclick="certificateManager.verifyCertificate('${cert.certificateId}')">
                        <i class="fas fa-check-circle"></i> Verify
                    </button>
                </div>
                <div class="certificate-info">
                    <p><i class="fas fa-calendar"></i> Issued: ${cert.issueDate}</p>
                    <p><i class="fas fa-clock"></i> Duration: ${cert.duration || '40 hours'}</p>
                    <p><i class="fas fa-graduation-cap"></i> Instructor: ${cert.instructor || 'ZewedJobs Academy'}</p>
                </div>
            </div>
        `).join('');
    }

    getTemplateBackground(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        return template ? template.background : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    setupEventListeners() {
        // Filter certificates by date
        document.addEventListener('change', (e) => {
            if (e.target.id === 'certificate-sort') {
                this.sortCertificates(e.target.value);
            }
        });

        // Search certificates
        document.addEventListener('input', (e) => {
            if (e.target.id === 'certificate-search') {
                this.searchCertificates(e.target.value);
            }
        });
    }

    sortCertificates(criteria) {
        let sorted = [...this.certificates];
        
        switch (criteria) {
            case 'date_newest':
                sorted.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
                break;
            case 'date_oldest':
                sorted.sort((a, b) => new Date(a.issueDate) - new Date(b.issueDate));
                break;
            case 'name':
                sorted.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
                break;
        }
        
        this.certificates = sorted;
        this.renderCertificates();
    }

    searchCertificates(query) {
        const filtered = this.certificates.filter(cert =>
            cert.courseTitle.toLowerCase().includes(query.toLowerCase()) ||
            cert.certificateId.toLowerCase().includes(query.toLowerCase()) ||
            (cert.studentName && cert.studentName.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.renderFilteredCertificates(filtered);
    }

    renderFilteredCertificates(filtered) {
        const container = document.querySelector('.certificates-container');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No certificates found</h3>
                    <p>Try different search terms</p>
                </div>
            `;
            return;
        }

        this.certificates = filtered;
        this.renderCertificates();
    }

    async downloadCertificate(certificateId) {
        const certificate = this.certificates.find(c => c.certificateId === certificateId);
        if (!certificate) return;

        try {
            // Generate PDF using html2pdf or similar
            const element = document.querySelector(`[data-certificate-id="${certificate.id}"] .certificate-preview`);
            
            const opt = {
                margin:       0,
                filename:     `${certificate.courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
            };

            // If html2pdf is loaded
            if (window.html2pdf) {
                await html2pdf().from(element).set(opt).save();
            } else {
                // Fallback to simple download
                this.downloadCertificateAsImage(certificate);
            }
        } catch (error) {
            console.error('Download failed:', error);
            this.downloadCertificateAsImage(certificate);
        }
    }

    downloadCertificateAsImage(certificate) {
        const element = document.querySelector(`[data-certificate-id="${certificate.id}"] .certificate-preview`);
        html2canvas(element).then(canvas => {
            const link = document.createElement('a');
            link.download = `${certificate.courseTitle.replace(/\s+/g, '_')}_Certificate.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }

    shareCertificate(certificateId) {
        const certificate = this.certificates.find(c => c.certificateId === certificateId);
        if (!certificate) return;

        const shareData = {
            title: `My Certificate: ${certificate.courseTitle}`,
            text: `I earned a certificate in ${certificate.courseTitle} from ZewedJobs!`,
            url: `${window.location.origin}/certificates/${certificateId}`
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback to social sharing
            this.showShareModal(certificate);
        }
    }

    showShareModal(certificate) {
        const modal = document.createElement('div');
        modal.className = 'share-certificate-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Share Certificate</h3>
                <div class="share-options">
                    <button class="btn-share-facebook" onclick="certificateManager.shareToFacebook('${certificate.certificateId}')">
                        <i class="fab fa-facebook"></i> Facebook
                    </button>
                    <button class="btn-share-linkedin" onclick="certificateManager.shareToLinkedIn('${certificate.certificateId}')">
                        <i class="fab fa-linkedin"></i> LinkedIn
                    </button>
                    <button class="btn-share-twitter" onclick="certificateManager.shareToTwitter('${certificate.certificateId}')">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button class="btn-copy-link" onclick="certificateManager.copyCertificateLink('${certificate.certificateId}')">
                        <i class="fas fa-link"></i> Copy Link
                    </button>
                </div>
                <button class="btn-close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    shareToFacebook(certificateId) {
        const url = encodeURIComponent(`${window.location.origin}/certificates/${certificateId}`);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }

    shareToLinkedIn(certificateId) {
        const url = encodeURIComponent(`${window.location.origin}/certificates/${certificateId}`);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    }

    shareToTwitter(certificateId) {
        const certificate = this.certificates.find(c => c.certificateId === certificateId);
        const text = encodeURIComponent(`I earned a certificate in ${certificate.courseTitle} from @ZewedJobs!`);
        const url = encodeURIComponent(`${window.location.origin}/certificates/${certificateId}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }

    copyCertificateLink(certificateId) {
        const url = `${window.location.origin}/certificates/${certificateId}`;
        navigator.clipboard.writeText(url);
        alert('Certificate link copied to clipboard!');
    }

    async verifyCertificate(certificateId) {
        try {
            const response = await fetch(`/api/certificates/verify/${certificateId}`);
            const result = await response.json();
            
            if (result.valid) {
                this.showVerificationModal(result);
            } else {
                alert('Certificate verification failed: Invalid certificate');
            }
        } catch (error) {
            console.error('Verification failed:', error);
            alert('Unable to verify certificate at this time');
        }
    }

    showVerificationModal(verificationData) {
        const modal = document.createElement('div');
        modal.className = 'verification-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="verification-header">
                    <i class="fas fa-check-circle"></i>
                    <h3>Certificate Verified</h3>
                </div>
                <div class="verification-details">
                    <div class="detail-item">
                        <strong>Certificate ID:</strong>
                        <span>${verificationData.certificateId}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Student Name:</strong>
                        <span>${verificationData.studentName}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Course:</strong>
                        <span>${verificationData.courseTitle}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Issue Date:</strong>
                        <span>${verificationData.issueDate}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Issued By:</strong>
                        <span>${verificationData.issuedBy}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Verification Date:</strong>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="verification-footer">
                    <p>This certificate has been verified and is authentic.</p>
                    <button class="btn-close-modal">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    generateCertificate(courseData, studentData, templateId = 1) {
        const template = this.templates.find(t => t.id === templateId);
        
        const certificate = {
            id: this.certificates.length + 1,
            certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            studentName: studentData.name,
            studentId: studentData.id,
            courseTitle: courseData.title,
            courseId: courseData.id,
            issueDate: new Date().toISOString(),
            completionDate: new Date().toISOString(),
            duration: courseData.duration,
            instructor: courseData.instructor,
            templateId: templateId,
            hasLogo: template?.hasLogo || true,
            hasSeal: template?.hasSeal || true,
            verificationUrl: `${window.location.origin}/verify/${Date.now()}`
        };

        this.certificates.push(certificate);
        this.saveCertificates();
        this.renderCertificates();
        
        return certificate;
    }

    saveCertificates() {
        localStorage.setItem('user_certificates', JSON.stringify(this.certificates));
    }

    getCertificateStats() {
        return {
            total: this.certificates.length,
            byMonth: this.groupCertificatesByMonth(),
            byCategory: this.groupCertificatesByCategory()
        };
    }

    groupCertificatesByMonth() {
        const groups = {};
        this.certificates.forEach(cert => {
            const month = new Date(cert.issueDate).toLocaleString('default', { month: 'short', year: 'numeric' });
            groups[month] = (groups[month] || 0) + 1;
        });
        return groups;
    }

    groupCertificatesByCategory() {
        const groups = {};
        this.certificates.forEach(cert => {
            // Assuming course has category property
            const category = cert.category || 'General';
            groups[category] = (groups[category] || 0) + 1;
        });
        return groups;
    }

    printCertificate(certificateId) {
        const certificate = this.certificates.find(c => c.certificateId === certificateId);
        if (!certificate) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${certificate.courseTitle} - Certificate</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .certificate { 
                            border: 20px solid #4c51bf;
                            padding: 50px;
                            text-align: center;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            height: 100vh;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                        }
                        h1 { font-size: 3em; margin: 20px 0; }
                        h2 { font-size: 2em; margin: 10px 0; }
                        .certificate-id { font-size: 0.8em; margin-top: 30px; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="certificate">
                        <h1>CERTIFICATE OF COMPLETION</h1>
                        <p>This certifies that</p>
                        <h2>${certificate.studentName}</h2>
                        <p>has successfully completed</p>
                        <h2>${certificate.courseTitle}</h2>
                        <p>Date of Completion: ${certificate.completionDate}</p>
                        <p class="certificate-id">Certificate ID: ${certificate.certificateId}</p>
                        <button class="no-print" onclick="window.print()">Print Certificate</button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
}

// Initialize certificate manager
document.addEventListener('DOMContentLoaded', () => {
    window.certificateManager = new CertificateManager();
});
