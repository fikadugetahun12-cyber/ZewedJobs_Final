/**
 * ZewedJobs - Advanced Job Search
 * Enhanced job search with filters, sorting, and recommendations
 */

class JobSearch {
    constructor() {
        this.config = {
            apiUrl: 'https://api.zewedjobs.com/v1/jobs',
            resultsPerPage: 20,
            maxFilters: 10,
            cacheDuration: 300000, // 5 minutes
            enableGeolocation: true,
            defaultRadius: 50 // miles
        };
        
        this.state = {
            currentPage: 1,
            totalResults: 0,
            totalPages: 1,
            filters: {
                keywords: '',
                location: '',
                category: '',
                jobType: [],
                salaryRange: [0, 300000],
                experienceLevel: [],
                datePosted: 'any',
                remoteOnly: false,
                radius: 50,
                companySize: [],
                industry: [],
                benefits: [],
                skills: []
            },
            sortBy: 'relevance',
            sortOrder: 'desc',
            viewMode: 'grid', // grid, list, map
            savedSearches: [],
            recentSearches: []
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🔍 Job Search Initializing...');
        
        // Load saved state
        this.loadState();
        
        // Initialize search interface
        this.initSearchInterface();
        
        // Initialize filters
        this.initFilters();
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Perform initial search if on jobs page
        if (this.isJobsPage()) {
            this.performSearch();
        }
        
        console.log('✅ Job Search Ready!');
    }
    
    isJobsPage() {
        return window.location.pathname.includes('jobs');
    }
    
    initSearchInterface() {
        // Initialize search form
        this.searchForm = document.querySelector('.job-search-form');
        this.searchInput = document.querySelector('#jobKeywords');
        this.locationInput = document.querySelector('#jobLocation');
        this.searchButton = document.querySelector('#searchButton');
        this.advancedToggle = document.querySelector('.advanced-search-toggle');
        this.advancedPanel = document.querySelector('.advanced-search-panel');
        
        // Initialize results container
        this.resultsContainer = document.querySelector('.job-results-container');
        this.resultsCount = document.querySelector('.results-count');
        this.sortSelect = document.querySelector('#sortSelect');
        this.viewToggle = document.querySelector('.view-toggle');
        
        // Initialize pagination
        this.pagination = document.querySelector('.pagination');
        
        // Initialize loading states
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'search-loading';
        this.loadingIndicator.innerHTML = '<div class="spinner"></div><p>Searching jobs...</p>';
        
        // Initialize empty state
        this.emptyState = document.createElement('div');
        this.emptyState.className = 'empty-state';
        this.emptyState.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>No jobs found</h3>
            <p>Try adjusting your search criteria</p>
            <button class="btn btn-secondary" id="clearFilters">Clear All Filters</button>
        `;
        
        // Initialize map view if available
        if (this.config.enableGeolocation && typeof google !== 'undefined') {
            this.initMapView();
        }
    }
    
    initFilters() {
        // Initialize filter controls
        this.filterControls = {
            jobType: document.querySelectorAll('input[name="jobType"]'),
            experience: document.querySelectorAll('input[name="experience"]'),
            salary: document.querySelector('.salary-range-slider'),
            datePosted: document.querySelector('#datePosted'),
            remoteOnly: document.querySelector('#remoteOnly'),
            radius: document.querySelector('#searchRadius'),
            companySize: document.querySelectorAll('input[name="companySize"]'),
            industry: document.querySelector('#industrySelect'),
            benefits: document.querySelectorAll('input[name="benefits"]'),
            skills: document.querySelector('#skillsInput')
        };
        
        // Initialize salary range slider
        this.initSalarySlider();
        
        // Initialize skills input
        this.initSkillsInput();
        
        // Initialize tag system for active filters
        this.initFilterTags();
    }
    
    initSalarySlider() {
        const salarySlider = this.filterControls.salary;
        if (!salarySlider) return;
        
        // Initialize dual-range slider
        const minSlider = salarySlider.querySelector('.min-slider');
        const maxSlider = salarySlider.querySelector('.max-slider');
        const minValue = salarySlider.querySelector('.min-value');
        const maxValue = salarySlider.querySelector('.max-value');
        const range = salarySlider.querySelector('.slider-range');
        
        if (minSlider && maxSlider && minValue && maxValue && range) {
            const updateSlider = () => {
                const min = parseInt(minSlider.value);
                const max = parseInt(maxSlider.value);
                
                minValue.textContent = this.formatSalary(min);
                maxValue.textContent = this.formatSalary(max);
                
                // Update range track
                const minPercent = (min / 300000) * 100;
                const maxPercent = (max / 300000) * 100;
                range.style.left = minPercent + '%';
                range.style.width = (maxPercent - minPercent) + '%';
                
                // Update state
                this.state.filters.salaryRange = [min, max];
            };
            
            minSlider.addEventListener('input', updateSlider);
            maxSlider.addEventListener('input', updateSlider);
            
            // Initial update
            updateSlider();
        }
    }
    
    initSkillsInput() {
        const skillsInput = this.filterControls.skills;
        if (!skillsInput) return;
        
        // Initialize skills autocomplete
        const skillsList = [
            'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue.js',
            'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
            'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
            'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
            'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins',
            'Agile', 'Scrum', 'Kanban', 'Project Management',
            'HTML5', 'CSS3', 'SASS', 'LESS', 'Bootstrap',
            'TypeScript', 'GraphQL', 'REST API', 'Microservices',
            'Machine Learning', 'Data Science', 'AI', 'Deep Learning',
            'Cybersecurity', 'DevOps', 'SRE', 'IT Infrastructure'
        ];
        
        // Create datalist for autocomplete
        const datalist = document.createElement('datalist');
        datalist.id = 'skillsList';
        skillsList.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill;
            datalist.appendChild(option);
        });
        
        skillsInput.parentNode.appendChild(datalist);
        skillsInput.setAttribute('list', 'skillsList');
        
        // Handle skills input
        skillsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const skill = skillsInput.value.trim();
                if (skill && !this.state.filters.skills.includes(skill)) {
                    this.addSkillFilter(skill);
                    skillsInput.value = '';
                }
            }
        });
    }
    
    initFilterTags() {
        this.filterTagsContainer = document.createElement('div');
        this.filterTagsContainer.className = 'filter-tags';
        this.searchForm?.parentNode.insertBefore(this.filterTagsContainer, this.searchForm.nextSibling);
        
        this.updateFilterTags();
    }
    
    addSkillFilter(skill) {
        if (!this.state.filters.skills.includes(skill)) {
            this.state.filters.skills.push(skill);
            this.updateFilterTags();
            this.performSearch();
        }
    }
    
    removeSkillFilter(skill) {
        const index = this.state.filters.skills.indexOf(skill);
        if (index > -1) {
            this.state.filters.skills.splice(index, 1);
            this.updateFilterTags();
            this.performSearch();
        }
    }
    
    updateFilterTags() {
        if (!this.filterTagsContainer) return;
        
        this.filterTagsContainer.innerHTML = '';
        
        // Add tags for active filters
        const activeFilters = this.getActiveFilters();
        
        activeFilters.forEach(filter => {
            const tag = document.createElement('div');
            tag.className = 'filter-tag';
            tag.innerHTML = `
                <span>${filter.label}: ${filter.value}</span>
                <button class="filter-tag-remove" data-filter="${filter.key}" data-value="${filter.value}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            this.filterTagsContainer.appendChild(tag);
        });
        
        // Add event listeners for remove buttons
        this.filterTagsContainer.querySelectorAll('.filter-tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const filterKey = btn.dataset.filter;
                const filterValue = btn.dataset.value;
                this.removeFilter(filterKey, filterValue);
            });
        });
    }
    
    getActiveFilters() {
        const activeFilters = [];
        
        // Keywords
        if (this.state.filters.keywords) {
            activeFilters.push({
                key: 'keywords',
                label: 'Keywords',
                value: this.state.filters.keywords
            });
        }
        
        // Location
        if (this.state.filters.location) {
            activeFilters.push({
                key: 'location',
                label: 'Location',
                value: this.state.filters.location
            });
        }
        
        // Job Type
        if (this.state.filters.jobType.length > 0) {
            activeFilters.push({
                key: 'jobType',
                label: 'Job Type',
                value: this.state.filters.jobType.join(', ')
            });
        }
        
        // Salary Range
        if (this.state.filters.salaryRange[0] > 0 || this.state.filters.salaryRange[1] < 300000) {
            activeFilters.push({
                key: 'salaryRange',
                label: 'Salary',
                value: `${this.formatSalary(this.state.filters.salaryRange[0])} - ${this.formatSalary(this.state.filters.salaryRange[1])}`
            });
        }
        
        // Remote Only
        if (this.state.filters.remoteOnly) {
            activeFilters.push({
                key: 'remoteOnly',
                label: 'Remote',
                value: 'Remote Only'
            });
        }
        
        // Skills
        if (this.state.filters.skills.length > 0) {
            activeFilters.push({
                key: 'skills',
                label: 'Skills',
                value: this.state.filters.skills.join(', ')
            });
        }
        
        return activeFilters;
    }
    
    removeFilter(filterKey, filterValue) {
        switch (filterKey) {
            case 'keywords':
                this.state.filters.keywords = '';
                this.searchInput.value = '';
                break;
                
            case 'location':
                this.state.filters.location = '';
                this.locationInput.value = '';
                break;
                
            case 'jobType':
                const index = this.state.filters.jobType.indexOf(filterValue);
                if (index > -1) {
                    this.state.filters.jobType.splice(index, 1);
                    // Update checkbox
                    const checkbox = document.querySelector(`input[name="jobType"][value="${filterValue}"]`);
                    if (checkbox) checkbox.checked = false;
                }
                break;
                
            case 'salaryRange':
                this.state.filters.salaryRange = [0, 300000];
                // Reset sliders
                const minSlider = this.filterControls.salary?.querySelector('.min-slider');
                const maxSlider = this.filterControls.salary?.querySelector('.max-slider');
                if (minSlider && maxSlider) {
                    minSlider.value = 0;
                    maxSlider.value = 300000;
                    this.initSalarySlider();
                }
                break;
                
            case 'remoteOnly':
                this.state.filters.remoteOnly = false;
                const remoteCheckbox = this.filterControls.remoteOnly;
                if (remoteCheckbox) remoteCheckbox.checked = false;
                break;
                
            case 'skills':
                this.removeSkillFilter(filterValue);
                return; // Already updates tags and performs search
        }
        
        this.updateFilterTags();
        this.performSearch();
    }
    
    setupEventListeners() {
        // Search form submission
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateFiltersFromForm();
                this.performSearch();
            });
        }
        
        // Advanced search toggle
        if (this.advancedToggle) {
            this.advancedToggle.addEventListener('click', () => {
                this.advancedPanel.classList.toggle('active');
                this.advancedToggle.classList.toggle('active');
            });
        }
        
        // Filter changes
        this.setupFilterListeners();
        
        // Sort changes
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', (e) => {
                this.state.sortBy = e.target.value;
                this.performSearch();
            });
        }
        
        // View mode toggle
        if (this.viewToggle) {
            this.viewToggle.addEventListener('click', (e) => {
                const button = e.target.closest('.view-button');
                if (button) {
                    const viewMode = button.dataset.view;
                    this.setViewMode(viewMode);
                }
            });
        }
        
        // Clear filters button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clearFilters' || e.target.closest('#clearFilters')) {
                this.clearAllFilters();
            }
        });
        
        // Save search button
        const saveSearchBtn = document.querySelector('#saveSearch');
        if (saveSearchBtn) {
            saveSearchBtn.addEventListener('click', () => this.saveCurrentSearch());
        }
        
        // Load saved searches
        this.loadSavedSearches();
    }
    
    setupFilterListeners() {
        // Job Type checkboxes
        this.filterControls.jobType?.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.state.filters.jobType = Array.from(this.filterControls.jobType)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                this.performSearch();
            });
        });
        
        // Experience checkboxes
        this.filterControls.experience?.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.state.filters.experienceLevel = Array.from(this.filterControls.experience)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                this.performSearch();
            });
        });
        
        // Date Posted select
        if (this.filterControls.datePosted) {
            this.filterControls.datePosted.addEventListener('change', (e) => {
                this.state.filters.datePosted = e.target.value;
                this.performSearch();
            });
        }
        
        // Remote Only checkbox
        if (this.filterControls.remoteOnly) {
            this.filterControls.remoteOnly.addEventListener('change', (e) => {
                this.state.filters.remoteOnly = e.target.checked;
                this.performSearch();
            });
        }
        
        // Search Radius
        if (this.filterControls.radius) {
            this.filterControls.radius.addEventListener('change', (e) => {
                this.state.filters.radius = parseInt(e.target.value);
                this.performSearch();
            });
        }
        
        // Company Size checkboxes
        this.filterControls.companySize?.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.state.filters.companySize = Array.from(this.filterControls.companySize)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                this.performSearch();
            });
        });
        
        // Industry select
        if (this.filterControls.industry) {
            this.filterControls.industry.addEventListener('change', (e) => {
                this.state.filters.industry = e.target.value ? [e.target.value] : [];
                this.performSearch();
            });
        }
        
        // Benefits checkboxes
        this.filterControls.benefits?.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.state.filters.benefits = Array.from(this.filterControls.benefits)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                this.performSearch();
            });
        });
    }
    
    updateFiltersFromForm() {
        if (this.searchInput) {
            this.state.filters.keywords = this.searchInput.value.trim();
        }
        
        if (this.locationInput) {
            this.state.filters.location = this.locationInput.value.trim();
        }
        
        // Update filter tags
        this.updateFilterTags();
    }
    
    async performSearch() {
        console.log('Performing search with filters:', this.state.filters);
        
        // Show loading
        this.showLoading();
        
        try {
            // Get jobs data
            const jobs = await this.fetchJobs();
            
            // Update results
            this.displayResults(jobs);
            
            // Update pagination
            this.updatePagination();
            
            // Save search to recent searches
            this.saveToRecentSearches();
            
            // Track search event
            this.trackSearchEvent();
            
        } catch (error) {
            this.showError('Failed to load jobs. Please try again.');
            console.error('Search error:', error);
        } finally {
            this.hideLoading();
        }
    }
    
    async fetchJobs() {
        // Check cache first
        const cacheKey = this.getCacheKey();
        const cached = this.getFromCache(cacheKey);
        
        if (cached && !this.isCacheExpired(cached)) {
            return cached.data;
        }
        
        // Build API request
        const requestData = this.buildRequestData();
        
        // In a real implementation, this would be an API call
        // For now, return mock data
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockJobs = this.generateMockJobs(50);
                const filteredJobs = this.filterJobs(mockJobs);
                const sortedJobs = this.sortJobs(filteredJobs);
                const paginatedJobs = this.paginateJobs(sortedJobs);
                
                // Cache results
                this.saveToCache(cacheKey, paginatedJobs);
                
                resolve(paginatedJobs);
            }, 800);
        });
    }
    
    buildRequestData() {
        return {
            keywords: this.state.filters.keywords,
            location: this.state.filters.location,
            category: this.state.filters.category,
            job_types: this.state.filters.jobType,
            salary_min: this.state.filters.salaryRange[0],
            salary_max: this.state.filters.salaryRange[1],
            experience_levels: this.state.filters.experienceLevel,
            date_posted: this.state.filters.datePosted,
            remote_only: this.state.filters.remoteOnly,
            radius: this.state.filters.radius,
            company_sizes: this.state.filters.companySize,
            industries: this.state.filters.industry,
            benefits: this.state.filters.benefits,
            skills: this.state.filters.skills,
            sort_by: this.state.sortBy,
            sort_order: this.state.sortOrder,
            page: this.state.currentPage,
            per_page: this.config.resultsPerPage
        };
    }
    
    generateMockJobs(count) {
        const jobTitles = [
            'Senior Software Engineer', 'Frontend Developer', 'Backend Developer',
            'Full Stack Developer', 'DevOps Engineer', 'Data Scientist',
            'Machine Learning Engineer', 'Product Manager', 'UX/UI Designer',
            'Marketing Manager', 'Sales Executive', 'Business Analyst',
            'Project Manager', 'HR Specialist', 'Financial Analyst'
        ];
        
        const companies = [
            'TechCorp Inc.', 'Digital Solutions LLC', 'Innovate Labs',
            'Future Technologies', 'Cloud Systems', 'DataWorks Corp',
            'Creative Minds', 'Global Enterprises', 'StartUp Ventures',
            'EcoTech Solutions'
        ];
        
        const locations = [
            'San Francisco, CA', 'New York, NY', 'Austin, TX',
            'Seattle, WA', 'Boston, MA', 'Chicago, IL',
            'Denver, CO', 'Atlanta, GA', 'Remote', 'Hybrid'
        ];
        
        const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];
        const experienceLevels = ['entry', 'mid', 'senior', 'executive'];
        
        const jobs = [];
        
        for (let i = 0; i < count; i++) {
            jobs.push({
                id: `job-${i + 1}`,
                title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
                company: companies[Math.floor(Math.random() * companies.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                salary: {
                    min: Math.floor(Math.random() * 100000) + 50000,
                    max: Math.floor(Math.random() * 150000) + 100000
                },
                type: jobTypes[Math.floor(Math.random() * jobTypes.length)],
                experience: experienceLevels[Math.floor(Math.random() * experienceLevels.length)],
                posted: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
                remote: Math.random() > 0.5,
                description: 'This is a mock job description for testing purposes.',
                requirements: [
                    'Bachelor\'s degree in Computer Science or related field',
                    '3+ years of experience',
                    'Strong communication skills'
                ],
                benefits: [
                    'Health insurance',
                    '401(k) matching',
                    'Flexible schedule'
                ],
                skills: ['JavaScript', 'React', 'Node.js'].slice(0, Math.floor(Math.random() * 3) + 1)
            });
        }
        
        return jobs;
    }
    
    filterJobs(jobs) {
        return jobs.filter(job => {
            // Filter by keywords
            if (this.state.filters.keywords) {
                const searchText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
                const keywords = this.state.filters.keywords.toLowerCase().split(' ');
                if (!keywords.every(keyword => searchText.includes(keyword))) {
                    return false;
                }
            }
            
            // Filter by location
            if (this.state.filters.location && job.location.toLowerCase() !== 'remote') {
                if (!job.location.toLowerCase().includes(this.state.filters.location.toLowerCase())) {
                    return false;
                }
            }
            
            // Filter by job type
            if (this.state.filters.jobType.length > 0) {
                if (!this.state.filters.jobType.includes(job.type)) {
                    return false;
                }
            }
            
            // Filter by salary range
            if (job.salary.max < this.state.filters.salaryRange[0] || 
                job.salary.min > this.state.filters.salaryRange[1]) {
                return false;
            }
            
            // Filter by experience level
            if (this.state.filters.experienceLevel.length > 0) {
                if (!this.state.filters.experienceLevel.includes(job.experience)) {
                    return false;
                }
            }
            
            // Filter by remote only
            if (this.state.filters.remoteOnly && !job.remote) {
                return false;
            }
            
            // Filter by skills
            if (this.state.filters.skills.length > 0) {
                const jobSkills = job.skills.map(s => s.toLowerCase());
                if (!this.state.filters.skills.every(skill => 
                    jobSkills.includes(skill.toLowerCase()))) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    sortJobs(jobs) {
        const sortField = this.state.sortBy;
        const order = this.state.sortOrder === 'asc' ? 1 : -1;
        
        return jobs.sort((a, b) => {
            let valueA, valueB;
            
            switch (sortField) {
                case 'date':
                    valueA = new Date(a.posted).getTime();
                    valueB = new Date(b.posted).getTime();
                    break;
                    
                case 'salary':
                    valueA = a.salary.max;
                    valueB = b.salary.max;
                    break;
                    
                case 'relevance':
                default:
                    // Simple relevance based on keyword matching
                    valueA = this.calculateRelevance(a);
                    valueB = this.calculateRelevance(b);
                    break;
            }
            
            return (valueA - valueB) * order;
        });
    }
    
    calculateRelevance(job) {
        let score = 0;
        
        if (this.state.filters.keywords) {
            const searchText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
            const keywords = this.state.filters.keywords.toLowerCase().split(' ');
            
            keywords.forEach(keyword => {
                if (searchText.includes(keyword)) {
                    score += 10;
                }
            });
        }
        
        // Bonus for exact matches
        if (this.state.filters.location && job.location.includes(this.state.filters.location)) {
            score += 20;
        }
        
        // Bonus for remote if searching remote
        if (this.state.filters.remoteOnly && job.remote) {
            score += 15;
        }
        
        return score;
    }
    
    paginateJobs(jobs) {
        const startIndex = (this.state.currentPage - 1) * this.config.resultsPerPage;
        const endIndex = startIndex + this.config.resultsPerPage;
        
        this.state.totalResults = jobs.length;
        this.state.totalPages = Math.ceil(jobs.length / this.config.resultsPerPage);
        
        return jobs.slice(startIndex, endIndex);
    }
    
    displayResults(jobs) {
        if (!this.resultsContainer) return;
        
        // Update results count
        if (this.resultsCount) {
            this.resultsCount.textContent = `${this.state.totalResults} jobs found`;
        }
        
        if (jobs.length === 0) {
            this.resultsContainer.innerHTML = '';
            this.resultsContainer.appendChild(this.emptyState);
            return;
        }
        
        // Clear container
        this.resultsContainer.innerHTML = '';
        
        // Add jobs based on view mode
        if (this.state.viewMode === 'list') {
            this.displayListResults(jobs);
        } else if (this.state.viewMode === 'map') {
            this.displayMapResults(jobs);
        } else {
            this.displayGridResults(jobs);
        }
    }
    
    displayGridResults(jobs) {
        const grid = document.createElement('div');
        grid.className = 'jobs-grid';
        
        jobs.forEach(job => {
            const jobCard = this.createJobCard(job);
            grid.appendChild(jobCard);
        });
        
        this.resultsContainer.appendChild(grid);
    }
    
    displayListResults(jobs) {
        const list = document.createElement('div');
        list.className = 'jobs-list';
        
        jobs.forEach(job => {
            const jobItem = this.createJobListItem(job);
            list.appendChild(jobItem);
        });
        
        this.resultsContainer.appendChild(list);
    }
    
    displayMapResults(jobs) {
        // Initialize map if not already
        if (!this.map) {
            this.initMapView();
        }
        
        const mapContainer = document.createElement('div');
        mapContainer.id = 'jobsMap';
        mapContainer.style.height = '500px';
        mapContainer.style.width = '100%';
        mapContainer.style.borderRadius = '8px';
        
        this.resultsContainer.appendChild(mapContainer);
        
        // In a real implementation, plot jobs on map
        // For now, show a message
        if (!window.google) {
            mapContainer.innerHTML = `
                <div class="map-placeholder">
                    <i class="fas fa-map-marked-alt"></i>
                    <h4>Map View</h4>
                    <p>${jobs.length} jobs in this area</p>
                    <button class="btn btn-secondary" onclick="jobSearch.setViewMode('grid')">
                        Switch to Grid View
                    </button>
                </div>
            `;
        }
    }
    
    createJobCard(job) {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.dataset.jobId = job.id;
        
        card.innerHTML = `
            <div class="job-card-header">
                <div class="company-logo">
                    <img src="https://via.placeholder.com/60" alt="${job.company}">
                </div>
                <div class="job-info">
                    <h3 class="job-title">${job.title}</h3>
                    <p class="company-name">${job.company}</p>
                    <div class="job-meta">
                        <span class="job-type ${job.type}">${job.type}</span>
                        <span class="job-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${job.remote ? 'Remote' : job.location}
                        </span>
                    </div>
                </div>
                <button class="job-save" data-job-id="${job.id}">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            
            <div class="job-card-body">
                <p class="job-description">${job.description}</p>
                
                <div class="job-salary">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>${this.formatSalary(job.salary.min)} - ${this.formatSalary(job.salary.max)}</span>
                </div>
                
                <div class="job-skills">
                    ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            
            <div class="job-card-footer">
                <span class="job-posted">
                    <i class="far fa-clock"></i>
                    ${this.formatDate(job.posted)}
                </span>
                <button class="btn btn-primary btn-apply" data-job-id="${job.id}">
                    Apply Now
                </button>
            </div>
        `;
        
        // Add event listeners
        card.querySelector('.job-save').addEventListener('click', (e) => {
            this.toggleSaveJob(job.id, e.target);
        });
        
        card.querySelector('.btn-apply').addEventListener('click', () => {
            this.applyToJob(job);
        });
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.job-save') && !e.target.closest('.btn-apply')) {
                this.viewJobDetails(job);
            }
        });
        
        return card;
    }
    
    createJobListItem(job) {
        const item = document.createElement('div');
        item.className = 'job-list-item';
        item.dataset.jobId = job.id;
        
        item.innerHTML = `
            <div class="job-list-main">
                <div class="company-logo">
                    <img src="https://via.placeholder.com/50" alt="${job.company}">
                </div>
                <div class="job-list-info">
                    <h3 class="job-title">${job.title}</h3>
                    <p class="company-name">${job.company}</p>
                    <div class="job-list-meta">
                        <span class="job-type ${job.type}">${job.type}</span>
                        <span class="job-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${job.remote ? 'Remote' : job.location}
                        </span>
                        <span class="job-salary">
                            <i class="fas fa-money-bill-wave"></i>
                            ${this.formatSalary(job.salary.min)} - ${this.formatSalary(job.salary.max)}
                        </span>
                        <span class="job-experience">
                            <i class="fas fa-chart-line"></i>
                            ${job.experience}
                        </span>
                    </div>
                    <div class="job-skills">
                        ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="job-list-actions">
                <span class="job-posted">
                    <i class="far fa-clock"></i>
                    ${this.formatDate(job.posted)}
                </span>
                <div class="action-buttons">
                    <button class="job-save" data-job-id="${job.id}">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="btn btn-primary btn-apply" data-job-id="${job.id}">
                        Apply Now
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        item.querySelector('.job-save').addEventListener('click', (e) => {
            this.toggleSaveJob(job.id, e.target);
        });
        
        item.querySelector('.btn-apply').addEventListener('click', () => {
            this.applyToJob(job);
        });
        
        item.querySelector('.job-list-main').addEventListener('click', () => {
            this.viewJobDetails(job);
        });
        
        return item;
    }
    
    toggleSaveJob(jobId, button) {
        const icon = button.querySelector('i');
        const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
        
        if (savedJobs.includes(jobId)) {
            // Remove from saved
            const index = savedJobs.indexOf(jobId);
            savedJobs.splice(index, 1);
            icon.className = 'far fa-heart';
            
            this.showNotification('Job removed from favorites', 'info');
        } else {
            // Add to saved
            savedJobs.push(jobId);
            icon.className = 'fas fa-heart';
            
            this.showNotification('Job saved to favorites', 'success');
        }
        
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
        
        // Track event
        this.trackEvent('job_saved', { jobId });
    }
    
    applyToJob(job) {
        // Show application modal or redirect
        console.log('Applying to job:', job.id);
        
        // In a real app, this would open an application form
        const applyUrl = `/jobs/${job.id}/apply`;
        window.open(applyUrl, '_blank');
        
        // Track application
        this.trackEvent('job_application_started', { 
            jobId: job.id,
            jobTitle: job.title 
        });
    }
    
    viewJobDetails(job) {
        // Navigate to job details page
        const jobUrl = `/jobs/${job.id}`;
        window.location.href = jobUrl;
    }
    
    setViewMode(mode) {
        this.state.viewMode = mode;
        
        // Update active button
        if (this.viewToggle) {
            this.viewToggle.querySelectorAll('.view-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === mode);
            });
        }
        
        // Re-display results with new view mode
        this.performSearch();
    }
    
    updatePagination() {
        if (!this.pagination || this.state.totalPages <= 1) return;
        
        this.pagination.innerHTML = '';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'page-button prev';
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = this.state.currentPage === 1;
        prevButton.addEventListener('click', () => this.goToPage(this.state.currentPage - 1));
        this.pagination.appendChild(prevButton);
        
        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.state.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.state.totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `page-button ${i === this.state.currentPage ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => this.goToPage(i));
            this.pagination.appendChild(pageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'page-button next';
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = this.state.currentPage === this.state.totalPages;
        nextButton.addEventListener('click', () => this.goToPage(this.state.currentPage + 1));
        this.pagination.appendChild(nextButton);
    }
    
    goToPage(page) {
        if (page < 1 || page > this.state.totalPages || page === this.state.currentPage) return;
        
        this.state.currentPage = page;
        this.performSearch();
        
        // Scroll to top of results
        this.resultsContainer?.scrollIntoView({ behavior: 'smooth' });
    }
    
    clearAllFilters() {
        // Reset all filters to default
        this.state.filters = {
            keywords: '',
            location: '',
            category: '',
            jobType: [],
            salaryRange: [0, 300000],
            experienceLevel: [],
            datePosted: 'any',
            remoteOnly: false,
            radius: 50,
            companySize: [],
            industry: [],
            benefits: [],
            skills: []
        };
        
        // Reset form inputs
        if (this.searchInput) this.searchInput.value = '';
        if (this.locationInput) this.locationInput.value = '';
        
        // Reset checkboxes and selects
        this.resetFilterControls();
        
        // Update UI
        this.updateFilterTags();
        
        // Perform search
        this.performSearch();
    }
    
    resetFilterControls() {
        // Reset all filter controls to default
        this.filterControls.jobType?.forEach(cb => cb.checked = false);
        this.filterControls.experience?.forEach(cb => cb.checked = false);
        
        if (this.filterControls.datePosted) {
            this.filterControls.datePosted.value = 'any';
        }
        
        if (this.filterControls.remoteOnly) {
            this.filterControls.remoteOnly.checked = false;
        }
        
        if (this.filterControls.radius) {
            this.filterControls.radius.value = '50';
        }
        
        this.filterControls.companySize?.forEach(cb => cb.checked = false);
        
        if (this.filterControls.industry) {
            this.filterControls.industry.value = '';
        }
        
        this.filterControls.benefits?.forEach(cb => cb.checked = false);
        
        if (this.filterControls.skills) {
            this.filterControls.skills.value = '';
        }
        
        // Reset salary slider
        const minSlider = this.filterControls.salary?.querySelector('.min-slider');
        const maxSlider = this.filterControls.salary?.querySelector('.max-slider');
        if (minSlider && maxSlider) {
            minSlider.value = 0;
            maxSlider.value = 300000;
            this.initSalarySlider();
        }
    }
    
    saveCurrentSearch() {
        const search = {
            id: 'search-' + Date.now(),
            name: `Search ${new Date().toLocaleDateString()}`,
            filters: { ...this.state.filters },
            sortBy: this.state.sortBy,
            sortOrder: this.state.sortOrder,
            createdAt: new Date().toISOString(),
            resultsCount: this.state.totalResults
        };
        
        this.state.savedSearches.unshift(search);
        
        // Keep only last 10 searches
        if (this.state.savedSearches.length > 10) {
            this.state.savedSearches.pop();
        }
        
        this.saveState();
        this.showNotification('Search saved successfully!', 'success');
        
        // Update saved searches UI
        this.updateSavedSearchesUI();
    }
    
    loadSavedSearches() {
        try {
            const saved = localStorage.getItem('savedSearches');
            if (saved) {
                this.state.savedSearches = JSON.parse(saved);
                this.updateSavedSearchesUI();
            }
        } catch (error) {
            console.error('Error loading saved searches:', error);
        }
    }
    
    updateSavedSearchesUI() {
        const savedSearchesList = document.querySelector('.saved-searches-list');
        if (!savedSearchesList) return;
        
        savedSearchesList.innerHTML = '';
        
        if (this.state.savedSearches.length === 0) {
            savedSearchesList.innerHTML = '<p class="no-searches">No saved searches yet</p>';
            return;
        }
        
        this.state.savedSearches.forEach(search => {
            const item = document.createElement('div');
            item.className = 'saved-search-item';
            item.innerHTML = `
                <div class="saved-search-info">
                    <h4>${search.name}</h4>
                    <p>${search.resultsCount} results • ${this.formatDate(search.createdAt)}</p>
                </div>
                <div class="saved-search-actions">
                    <button class="btn-load-search" data-search-id="${search.id}">
                        <i class="fas fa-search"></i>
                    </button>
                    <button class="btn-delete-search" data-search-id="${search.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            savedSearchesList.appendChild(item);
        });
        
        // Add event listeners
        savedSearchesList.querySelectorAll('.btn-load-search').forEach(btn => {
            btn.addEventListener('click', () => this.loadSavedSearch(btn.dataset.searchId));
        });
        
        savedSearchesList.querySelectorAll('.btn-delete-search').forEach(btn => {
            btn.addEventListener('click', () => this.deleteSavedSearch(btn.dataset.searchId));
        });
    }
    
    loadSavedSearch(searchId) {
        const search = this.state.savedSearches.find(s => s.id === searchId);
        if (!search) return;
        
        // Load search filters
        this.state.filters = { ...search.filters };
        this.state.sortBy = search.sortBy;
        this.state.sortOrder = search.sortOrder;
        
        // Update UI
        this.updateUIFromFilters();
        
        // Perform search
        this.performSearch();
        
        this.showNotification('Search loaded successfully!', 'success');
    }
    
    deleteSavedSearch(searchId) {
        this.state.savedSearches = this.state.savedSearches.filter(s => s.id !== searchId);
        this.saveState();
        this.updateSavedSearchesUI();
        this.showNotification('Search deleted', 'info');
    }
    
    updateUIFromFilters() {
        // Update form inputs
        if (this.searchInput) this.searchInput.value = this.state.filters.keywords;
        if (this.locationInput) this.locationInput.value = this.state.filters.location;
        
        // Update checkboxes
        this.state.filters.jobType.forEach(type => {
            const checkbox = document.querySelector(`input[name="jobType"][value="${type}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Update salary slider
        const minSlider = this.filterControls.salary?.querySelector('.min-slider');
        const maxSlider = this.filterControls.salary?.querySelector('.max-slider');
        if (minSlider && maxSlider) {
            minSlider.value = this.state.filters.salaryRange[0];
            maxSlider.value = this.state.filters.salaryRange[1];
            this.initSalarySlider();
        }
        
        // Update filter tags
        this.updateFilterTags();
    }
    
    saveToRecentSearches() {
        const search = {
            query: this.state.filters.keywords,
            location: this.state.filters.location,
            timestamp: new Date().toISOString()
        };
        
        this.state.recentSearches.unshift(search);
        
        // Keep only last 5 searches
        if (this.state.recentSearches.length > 5) {
            this.state.recentSearches.pop();
        }
        
        this.saveState();
        this.updateRecentSearchesUI();
    }
    
    updateRecentSearchesUI() {
        const recentSearches = document.querySelector('.recent-searches');
        if (!recentSearches) return;
        
        const list = recentSearches.querySelector('.recent-searches-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        this.state.recentSearches.forEach(search => {
            const item = document.createElement('div');
            item.className = 'recent-search-item';
            item.innerHTML = `
                <i class="fas fa-history"></i>
                <div class="recent-search-info">
                    <strong>${search.query || 'Any'}</strong>
                    <span>${search.location || 'Anywhere'}</span>
                </div>
                <button class="btn-reuse-search" data-query="${search.query}" data-location="${search.location}">
                    <i class="fas fa-search"></i>
                </button>
            `;
            
            item.querySelector('.btn-reuse-search').addEventListener('click', () => {
                this.state.filters.keywords = search.query || '';
                this.state.filters.location = search.location || '';
                this.updateUIFromFilters();
                this.performSearch();
            });
            
            list.appendChild(item);
        });
    }
    
    initMapView() {
        if (typeof google === 'undefined') return;
        
        // Initialize Google Maps
        const mapOptions = {
            zoom: 10,
            center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        };
        
        this.map = new google.maps.Map(document.getElementById('jobsMap'), mapOptions);
        
        // Add geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    this.map.setCenter(userLocation);
                    
                    // Add user marker
                    new google.maps.Marker({
                        position: userLocation,
                        map: this.map,
                        icon: {
                            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                        },
                        title: "Your Location"
                    });
                },
                () => {
                    console.log("Geolocation permission denied");
                }
            );
        }
    }
    
    // Cache methods
    getCacheKey() {
        return `job_search_${JSON.stringify(this.state.filters)}_${this.state.sortBy}_${this.state.sortOrder}_${this.state.currentPage}`;
    }
    
    getFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    }
    
    saveToCache(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }
    
    isCacheExpired(cacheData) {
        return Date.now() - cacheData.timestamp > this.config.cacheDuration;
    }
    
    // Utility methods
    formatSalary(amount) {
        if (amount >= 1000) {
            return '$' + (amount / 1000).toFixed(0) + 'k';
        }
        return '$' + amount;
    }
    
    formatDate(date) {
        const now = new Date();
        const jobDate = new Date(date);
        const diffTime = Math.abs(now - jobDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }
    
    showLoading() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '';
            this.resultsContainer.appendChild(this.loadingIndicator);
        }
    }
    
    hideLoading() {
        if (this.loadingIndicator.parentNode) {
            this.loadingIndicator.parentNode.removeChild(this.loadingIndicator);
        }
    }
    
    showError(message) {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = `
                <div class="search-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Jobs</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="jobSearch.performSearch()">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
    
    showNotification(message, type = 'info') {
        // Use app notification system if available
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            // Simple notification
            alert(message);
        }
    }
    
    trackSearchEvent() {
        if (window.app && window.app.trackEvent) {
            window.app.trackEvent('job_search', 'performed', JSON.stringify(this.state.filters));
        }
    }
    
    trackEvent(eventName, data = {}) {
        if (window.app && window.app.trackEvent) {
            window.app.trackEvent('job_search', eventName, JSON.stringify(data));
        }
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('jobSearchState');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Error loading job search state:', error);
        }
    }
    
    saveState() {
        try {
            const stateToSave = {
                filters: this.state.filters,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder,
                viewMode: this.state.viewMode,
                savedSearches: this.state.savedSearches,
                recentSearches: this.state.recentSearches
            };
            localStorage.setItem('jobSearchState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving job search state:', error);
        }
    }
    
    // Public API
    getSearchResults() {
        return this.state.totalResults;
    }
    
    getCurrentFilters() {
        return { ...this.state.filters };
    }
    
    setFilter(key, value) {
        if (key in this.state.filters) {
            this.state.filters[key] = value;
            this.updateFilterTags();
            this.performSearch();
        }
    }
    
    getJobRecommendations(userProfile) {
        // Generate job recommendations based on user profile
        // This would be an advanced AI-powered feature
        console.log('Generating job recommendations for:', userProfile);
        
        // Return mock recommendations
        return this.generateMockJobs(5);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.job-search-form')) {
        window.jobSearch = new JobSearch();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobSearch;
}
