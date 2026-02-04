// social.js - Social Media Integration and Features
class SocialManager {
    constructor() {
        this.posts = [];
        this.comments = {};
        this.likes = {};
        this.followers = {};
        this.init();
    }

    async init() {
        await this.loadPosts();
        await this.loadSocialData();
        this.renderPosts();
        this.setupEventListeners();
        this.initializeSocialSDKs();
        this.setupSocialFeed();
    }

    async loadPosts() {
        try {
            const response = await fetch('/api/social/posts');
            this.posts = await response.json();
        } catch (error) {
            console.error('Failed to load posts:', error);
            this.posts = this.getSamplePosts();
        }
    }

    getSamplePosts() {
        return [
            {
                id: 1,
                userId: 'user1',
                userName: 'John Doe',
                userAvatar: 'https://via.placeholder.com/40',
                content: 'Just landed my dream job through ZewedJobs! Highly recommend this platform.',
                image: 'https://via.placeholder.com/600x400',
                timestamp: '2024-05-15T10:30:00Z',
                likes: 42,
                comments: 12,
                shares: 5,
                type: 'success_story',
                tags: ['#career', '#success', '#hiring'],
                verified: true
            },
            {
                id: 2,
                userId: 'zewedjobs',
                userName: 'ZewedJobs',
                userAvatar: 'https://via.placeholder.com/40?text=ZJ',
                content: 'New webinar alert! Join us for "Mastering Remote Interviews" tomorrow at 2 PM.',
                timestamp: '2024-05-14T14:20:00Z',
                likes: 89,
                comments: 25,
                shares: 18,
                type: 'announcement',
                tags: ['#webinar', '#remotework', '#careeradvice'],
                link: '/events/webinar-remote-interviews',
                verified: true
            }
        ];
    }

    async loadSocialData() {
        const userId = localStorage.getItem('userId');
        if (userId) {
            try {
                const [likesData, commentsData, followersData] = await Promise.all([
                    fetch(`/api/users/${userId}/likes`).then(r => r.json()),
                    fetch(`/api/users/${userId}/comments`).then(r => r.json()),
                    fetch(`/api/users/${userId}/followers`).then(r => r.json())
                ]);
                
                this.likes = likesData;
                this.comments = commentsData;
                this.followers = followersData;
            } catch (error) {
                this.likes = JSON.parse(localStorage.getItem('social_likes') || '{}');
                this.comments = JSON.parse(localStorage.getItem('social_comments') || '{}');
                this.followers = JSON.parse(localStorage.getItem('social_followers') || '{}');
            }
        }
    }

    renderPosts() {
        const container = document.querySelector('.social-feed');
        if (!container) return;

        container.innerHTML = `
            <div class="create-post-container">
                <div class="post-input-container">
                    <div class="user-avatar">
                        <img src="${localStorage.getItem('userAvatar') || 'https://via.placeholder.com/40'}" 
                             alt="Your Avatar">
                    </div>
                    <div class="post-input-wrapper">
                        <textarea class="post-input" 
                                  placeholder="Share your career news, ask questions, or post updates..."></textarea>
                        <div class="post-actions">
                            <button class="btn-add-media" onclick="socialManager.showMediaOptions()">
                                <i class="fas fa-image"></i> Media
                            </button>
                            <button class="btn-add-poll" onclick="socialManager.createPoll()">
                                <i class="fas fa-chart-bar"></i> Poll
                            </button>
                            <button class="btn-add-event" onclick="socialManager.shareEvent()">
                                <i class="fas fa-calendar"></i> Event
                            </button>
                            <button class="btn-post-submit" onclick="socialManager.createPost()">
                                <i class="fas fa-paper-plane"></i> Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="posts-container">
                ${this.posts.map(post => this.renderPost(post)).join('')}
            </div>
        `;
    }

    renderPost(post) {
        const isLiked = this.likes[post.id];
        const userComments = this.comments[post.id] || [];
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-user-info">
                        <img src="${post.userAvatar}" alt="${post.userName}" class="post-user-avatar">
                        <div>
                            <div class="post-user-name">
                                ${post.userName}
                                ${post.verified ? '<i class="fas fa-check-circle verified"></i>' : ''}
                            </div>
                            <div class="post-timestamp">
                                ${this.formatTimeAgo(post.timestamp)}
                                ${post.type ? `<span class="post-type ${post.type}">${post.type.replace('_', ' ')}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <button class="btn-post-options">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
                
                <div class="post-content">
                    <p>${this.formatPostContent(post.content)}</p>
                    ${post.image ? `
                        <div class="post-media">
                            <img src="${post.image}" alt="Post image" class="post-image">
                        </div>
                    ` : ''}
                    ${post.link ? `
                        <div class="post-link-preview">
                            <a href="${post.link}" target="_blank">${post.link}</a>
                        </div>
                    ` : ''}
                    ${post.tags?.length > 0 ? `
                        <div class="post-tags">
                            ${post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="post-stats">
                    <span><i class="fas fa-heart"></i> ${post.likes} likes</span>
                    <span><i class="fas fa-comment"></i> ${post.comments} comments</span>
                    <span><i class="fas fa-share"></i> ${post.shares} shares</span>
                </div>
                
                <div class="post-actions">
                    <button class="btn-like ${isLiked ? 'liked' : ''}" onclick="socialManager.toggleLike(${post.id})">
                        <i class="fas fa-heart"></i> Like
                    </button>
                    <button class="btn-comment" onclick="socialManager.focusComment(${post.id})">
                        <i class="fas fa-comment"></i> Comment
                    </button>
                    <button class="btn-share" onclick="socialManager.sharePost(${post.id})">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <button class="btn-save" onclick="socialManager.toggleSavePost(${post.id})">
                        <i class="fas fa-bookmark"></i> Save
                    </button>
                </div>
                
                <div class="post-comments">
                    <div class="comment-input-container">
                        <img src="${localStorage.getItem('userAvatar') || 'https://via.placeholder.com/30'}" 
                             class="comment-user-avatar">
                        <div class="comment-input-wrapper">
                            <input type="text" 
                                   class="comment-input" 
                                   data-post-id="${post.id}"
                                   placeholder="Write a comment...">
                            <button class="btn-post-comment" onclick="socialManager.postComment(${post.id})">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${userComments.length > 0 ? `
                        <div class="comments-list">
                            ${userComments.slice(0, 3).map(comment => `
                                <div class="comment-item">
                                    <img src="${comment.userAvatar}" class="comment-avatar">
                                    <div class="comment-content">
                                        <div class="comment-header">
                                            <span class="comment-author">${comment.userName}</span>
                                            <span class="comment-time">${this.formatTimeAgo(comment.timestamp)}</span>
                                        </div>
                                        <p class="comment-text">${comment.text}</p>
                                    </div>
                                </div>
                            `).join('')}
                            ${userComments.length > 3 ? `
                                <button class="btn-view-all-comments" onclick="socialManager.showAllComments(${post.id})">
                                    View all ${userComments.length} comments
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    formatPostContent(content) {
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, url => 
            `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
        );
    }

    setupEventListeners() {
        // Post input auto-resize
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('post-input')) {
                this.autoResizeTextarea(e.target);
            }
        });

        // Comment submission on Enter
        document.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
                const postId = e.target.dataset.postId;
                this.postComment(postId);
            }
        });

        // Infinite scroll
        window.addEventListener('scroll', () => {
            if (this.isNearBottom()) {
                this.loadMorePosts();
            }
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    isNearBottom() {
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.documentElement.scrollHeight;
        return pageHeight - scrollPosition < 500;
    }

    async loadMorePosts() {
        if (this.isLoadingMore) return;
        this.isLoadingMore = true;

        try {
            const response = await fetch(`/api/social/posts?offset=${this.posts.length}`);
            const newPosts = await response.json();
            this.posts.push(...newPosts);
            this.renderPosts();
        } catch (error) {
            console.error('Failed to load more posts:', error);
        } finally {
            this.isLoadingMore = false;
        }
    }

    async createPost() {
        const content = document.querySelector('.post-input').value.trim();
        if (!content) {
            alert('Please enter some content');
            return;
        }

        const postData = {
            content,
            userId: localStorage.getItem('userId'),
            userName: localStorage.getItem('userName') || 'User',
            userAvatar: localStorage.getItem('userAvatar') || 'https://via.placeholder.com/40',
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: 0,
            shares: 0,
            type: 'user_post'
        };

        try {
            const response = await fetch('/api/social/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                const newPost = await response.json();
                this.posts.unshift(newPost);
                this.renderPosts();
                document.querySelector('.post-input').value = '';
                alert('Post created successfully!');
            }
        } catch (error) {
            console.error('Failed to create post:', error);
        }
    }

    async toggleLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const isLiked = this.likes[postId];
        
        try {
            const response = await fetch(`/api/social/posts/${postId}/like`, {
                method: isLiked ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: localStorage.getItem('userId') })
            });

            if (response.ok) {
                if (isLiked) {
                    post.likes--;
                    delete this.likes[postId];
                } else {
                    post.likes++;
                    this.likes[postId] = true;
                }
                this.renderPosts();
            }
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    }

    async postComment(postId) {
        const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
        const text = input?.value.trim();
        if (!text) return;

        const commentData = {
            postId,
            userId: localStorage.getItem('userId'),
            userName: localStorage.getItem('userName') || 'User',
            userAvatar: localStorage.getItem('userAvatar') || 'https://via.placeholder.com/30',
            text,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(`/api/social/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentData)
            });

            if (response.ok) {
                if (!this.comments[postId]) {
                    this.comments[postId] = [];
                }
                this.comments[postId].push(commentData);
                
                const post = this.posts.find(p => p.id === postId);
                if (post) post.comments++;
                
                this.renderPosts();
                input.value = '';
            }
        } catch (error) {
            console.error('Failed to post comment:', error);
        }
    }

    focusComment(postId) {
        const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
        if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    async sharePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const shareData = {
            title: `Post by ${post.userName}`,
            text: post.content.substring(0, 100) + '...',
            url: `${window.location.origin}/social/posts/${postId}`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                post.shares++;
                this.renderPosts();
            } catch (error) {
                console.error('Share failed:', error);
            }
        } else {
            this.showShareOptions(post);
        }
    }

    showShareOptions(post) {
        const modal = document.createElement('div');
        modal.className = 'share-post-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Share Post</h3>
                <div class="share-options">
                    <button class="btn-share-facebook" onclick="socialManager.shareToFacebook(${post.id})">
                        <i class="fab fa-facebook"></i> Facebook
                    </button>
                    <button class="btn-share-twitter" onclick="socialManager.shareToTwitter(${post.id})">
                        <i class="fab fa-twitter"></i> Twitter
                    </button>
                    <button class="btn-share-linkedin" onclick="socialManager.shareToLinkedIn(${post.id})">
                        <i class="fab fa-linkedin"></i> LinkedIn
                    </button>
                    <button class="btn-copy-link" onclick="socialManager.copyPostLink(${post.id})">
                        <i class="fas fa-link"></i> Copy Link
                    </button>
                    <button class="btn-embed-post" onclick="socialManager.embedPost(${post.id})">
                        <i class="fas fa-code"></i> Embed
                    </button>
                </div>
                <button class="btn-close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    shareToFacebook(postId) {
        const post = this.posts.find(p => p.id === postId);
        const url = encodeURIComponent(`${window.location.origin}/social/posts/${postId}`);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }

    shareToTwitter(postId) {
        const post = this.posts.find(p => p.id === postId);
        const text = encodeURIComponent(`Check out this post by ${post.userName} on ZewedJobs`);
        const url = encodeURIComponent(`${window.location.origin}/social/posts/${postId}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }

    shareToLinkedIn(postId) {
        const url = encodeURIComponent(`${window.location.origin}/social/posts/${postId}`);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    }

    copyPostLink(postId) {
        const url = `${window.location.origin}/social/posts/${postId}`;
        navigator.clipboard.writeText(url);
        alert('Post link copied to clipboard!');
    }

    embedPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const embedCode = `<blockquote class="zewedjobs-embedded-post" data-post-id="${postId}">
            <p>${post.content.substring(0, 200)}...</p>
            <cite>— ${post.userName} on ZewedJobs</cite>
        </blockquote>
        <script async src="${window.location.origin}/embed.js"></script>`;

        navigator.clipboard.writeText(embedCode);
        alert('Embed code copied to clipboard!');
    }

    async toggleSavePost(postId) {
        const savedPosts = JSON.parse(localStorage.getItem('saved_posts') || '[]');
        const index = savedPosts.indexOf(postId);

        if (index > -1) {
            savedPosts.splice(index, 1);
        } else {
            savedPosts.push(postId);
        }

        localStorage.setItem('saved_posts', JSON.stringify(savedPosts));
        this.renderPosts();
    }

    showMediaOptions() {
        const modal = document.createElement('div');
        modal.className = 'media-upload-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Add Media to Post</h3>
                <div class="media-options">
                    <label class="media-option">
                        <input type="file" accept="image/*" class="media-file-input" multiple>
                        <div class="option-content">
                            <i class="fas fa-image"></i>
                            <span>Upload Images</span>
                        </div>
                    </label>
                    <label class="media-option">
                        <input type="file" accept="video/*" class="media-file-input">
                        <div class="option-content">
                            <i class="fas fa-video"></i>
                            <span>Upload Video</span>
                        </div>
                    </label>
                    <button class="media-option" onclick="socialManager.addYoutubeLink()">
                        <i class="fab fa-youtube"></i>
                        <span>YouTube Link</span>
                    </button>
                    <button class="media-option" onclick="socialManager.addGif()">
                        <i class="fas fa-film"></i>
                        <span>GIF</span>
                    </button>
                </div>
                <div class="media-preview" id="media-preview"></div>
                <button class="btn-close-modal">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);

        const fileInputs = modal.querySelectorAll('.media-file-input');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleMediaUpload(e.target.files);
            });
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    handleMediaUpload(files) {
        const preview = document.getElementById('media-preview');
        preview.innerHTML = '';
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const mediaElement = file.type.startsWith('video/') ? 
                    `<video controls><source src="${e.target.result}" type="${file.type}"></video>` :
                    `<img src="${e.target.result}" alt="Preview">`;
                
                preview.innerHTML += `
                    <div class="media-preview-item">
                        ${mediaElement}
                        <button class="btn-remove-media">&times;</button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        });
    }

    createPoll() {
        const modal = document.createElement('div');
        modal.className = 'create-poll-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Create a Poll</h3>
                <form class="poll-form">
                    <div class="form-group">
                        <label for="poll-question">Poll Question *</label>
                        <input type="text" id="poll-question" required>
                    </div>
                    <div class="form-group">
                        <label>Options (minimum 2)</label>
                        <div class="poll-options">
                            <div class="poll-option">
                                <input type="text" class="poll-option-input" placeholder="Option 1" required>
                                <button type="button" class="btn-remove-option" onclick="this.parentElement.remove()">&times;</button>
                            </div>
                            <div class="poll-option">
                                <input type="text" class="poll-option-input" placeholder="Option 2" required>
                                <button type="button" class="btn-remove-option" onclick="this.parentElement.remove()">&times;</button>
                            </div>
                        </div>
                        <button type="button" class="btn-add-option" onclick="socialManager.addPollOption()">
                            <i class="fas fa-plus"></i> Add Option
                        </button>
                    </div>
                    <div class="form-group">
                        <label for="poll-duration">Duration</label>
                        <select id="poll-duration">
                            <option value="1">1 day</option>
                            <option value="3">3 days</option>
                            <option value="7" selected>1 week</option>
                            <option value="30">1 month</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="poll-multiple" checked>
                            <span>Allow multiple selections</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="poll-anonymous">
                            <span>Anonymous poll</span>
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-create-poll">Create Poll</button>
                        <button type="button" class="btn-cancel">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const form = modal.querySelector('.poll-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPollPost(form);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    }

    addPollOption() {
        const optionsContainer = document.querySelector('.poll-options');
        const optionCount = optionsContainer.children.length + 1;
        
        const optionDiv = document.createElement('div');
        optionDiv.className = 'poll-option';
        optionDiv.innerHTML = `
            <input type="text" class="poll-option-input" placeholder="Option ${optionCount}" required>
            <button type="button" class="btn-remove-option" onclick="this.parentElement.remove()">&times;</button>
        `;
        optionsContainer.appendChild(optionDiv);
    }

    createPollPost(form) {
        const formData = new FormData(form);
        const pollData = {
            question: formData.get('question'),
            options: Array.from(document.querySelectorAll('.poll-option-input')).map(input => input.value),
            duration: formData.get('duration'),
            multiple: formData.get('multiple') === 'on',
            anonymous: formData.get('anonymous') === 'on',
            expires: new Date(Date.now() + formData.get('duration') * 24 * 60 * 60 * 1000).toISOString()
        };

        // Create post with poll
        this.createPostWithPoll(pollData);
        modal.remove();
    }

    createPostWithPoll(pollData) {
        const postContent = `Poll: ${pollData.question}\n\n${pollData.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`;
        
        // Create a post with poll data
        const post = {
            ...pollData,
            content: postContent,
            type: 'poll',
            votes: {}
        };

        this.posts.unshift(post);
        this.renderPosts();
    }

    initializeSocialSDKs() {
        // Load Facebook SDK
        if (!document.getElementById('facebook-jssdk')) {
            const fbScript = document.createElement('script');
            fbScript.id = 'facebook-jssdk';
            fbScript.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v12.0';
            fbScript.async = true;
            fbScript.defer = true;
            document.head.appendChild(fbScript);
        }

        // Load Twitter widget
        if (!document.getElementById('twitter-wjs')) {
            const twScript = document.createElement('script');
            twScript.id = 'twitter-wjs';
            twScript.src = 'https://platform.twitter.com/widgets.js';
            twScript.async = true;
            document.head.appendChild(twScript);
        }
    }

    setupSocialFeed() {
        // Setup hashtag tracking
        this.setupHashtagTracking();
        
        // Setup trending topics
        this.setupTrendingTopics();
        
        // Setup notifications
        this.setupSocialNotifications();
    }

    setupHashtagTracking() {
        // Track hashtag clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('post-tag')) {
                const hashtag = e.target.textContent;
                this.showHashtagPosts(hashtag);
            }
        });
    }

    async showHashtagPosts(hashtag) {
        try {
            const response = await fetch(`/api/social/hashtags/${hashtag.substring(1)}`);
            const posts = await response.json();
            
            this.showFilteredPosts(posts, `Posts with ${hashtag}`);
        } catch (error) {
            console.error('Failed to load hashtag posts:', error);
        }
    }

    showFilteredPosts(posts, title) {
        const modal = document.createElement('div');
        modal.className = 'filtered-posts-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="btn-close-modal">&times;</button>
                </div>
                <div class="posts-container">
                    ${posts.map(post => this.renderPost(post)).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    setupTrendingTopics() {
        // Calculate trending topics from posts
        const hashtagCount = {};
        this.posts.forEach(post => {
            post.tags?.forEach(tag => {
                if (tag.startsWith('#')) {
                    hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
                }
            });
        });

        const trending = Object.entries(hashtagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        this.renderTrendingTopics(trending);
    }

    renderTrendingTopics(trending) {
        const container = document.querySelector('.trending-topics');
        if (!container) return;

        container.innerHTML = `
            <h4>Trending Topics</h4>
            <div class="trending-list">
                ${trending.map(([tag, count], index) => `
                    <div class="trending-item">
                        <span class="trending-rank">${index + 1}</span>
                        <a href="#" class="trending-tag" onclick="socialManager.showHashtagPosts('${tag}')">
                            ${tag}
                        </a>
                        <span class="trending-count">${count} posts</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupSocialNotifications() {
        // Check for new posts periodically
        setInterval(() => {
            this.checkForNewPosts();
        }, 30000); // Every 30 seconds

        // Check for mentions
        setInterval(() => {
            this.checkForMentions();
        }, 60000); // Every minute
    }

    async checkForNewPosts() {
        try {
            const response = await fetch('/api/social/posts/new?since=' + this.lastCheck);
            const newPosts = await response.json();
            
            if (newPosts.length > 0) {
                this.showNewPostsNotification(newPosts);
                this.lastCheck = new Date().toISOString();
            }
        } catch (error) {
            console.error('Failed to check for new posts:', error);
        }
    }

    showNewPostsNotification(newPosts) {
        if (Notification.permission === 'granted') {
            new Notification(`${newPosts.length} new posts`, {
                body: 'There are new posts in your feed',
                icon: '/favicon.ico'
            });
        }
    }

    async checkForMentions() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const response = await fetch(`/api/users/${userId}/mentions`);
            const mentions = await response.json();
            
            if (mentions.length > 0) {
                this.showMentionsNotification(mentions);
            }
        } catch (error) {
            console.error('Failed to check for mentions:', error);
        }
    }

    showMentionsNotification(mentions) {
        if (Notification.permission === 'granted') {
            new Notification(`You were mentioned ${mentions.length} times`, {
                body: 'Check your mentions',
                icon: '/favicon.ico'
            });
        }
    }

    followUser(userId) {
        if (!this.followers[userId]) {
            this.followers[userId] = [];
        }
        
        const currentUser = localStorage.getItem('userId');
        if (!this.followers[userId].includes(currentUser)) {
            this.followers[userId].push(currentUser);
            localStorage.setItem('social_followers', JSON.stringify(this.followers));
            
            // Send follow notification
            this.sendFollowNotification(userId);
        }
    }

    async sendFollowNotification(userId) {
        const notification = {
            userId,
            type: 'follow',
            fromUser: localStorage.getItem('userId'),
            fromUserName: localStorage.getItem('userName'),
            timestamp: new Date().toISOString()
        };

        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notification)
            });
        } catch (error) {
            console.error('Failed to send follow notification:', error);
        }
    }

    getSocialStats() {
        const totalPosts = this.posts.length;
        const totalLikes = this.posts.reduce((sum, post) => sum + post.likes, 0);
        const totalComments = this.posts.reduce((sum, post) => sum + post.comments, 0);
        const totalShares = this.posts.reduce((sum, post) => sum + post.shares, 0);
        
        return {
            totalPosts,
            totalLikes,
            totalComments,
            totalShares,
            averageEngagement: ((totalLikes + totalComments + totalShares) / totalPosts).toFixed(2),
            topPost: this.posts.reduce((top, post) => 
                (post.likes + post.comments + post.shares) > (top.likes + top.comments + top.shares) ? post : top
            )
        };
    }
}

// Initialize social manager
document.addEventListener('DOMContentLoaded', () => {
    window.socialManager = new SocialManager();
});
