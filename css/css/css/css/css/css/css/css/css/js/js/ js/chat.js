/**
 * ZewedJobs - AI Chat Assistant
 * Provides intelligent job search assistance and career guidance
 */

class AIChat {
    constructor() {
        this.config = {
            apiUrl: 'https://api.zewedjobs.com/v1/ai-chat',
            model: 'gpt-4',
            maxTokens: 500,
            temperature: 0.7,
            enabled: true,
            historySize: 50
        };
        
        this.state = {
            isOpen: false,
            isTyping: false,
            conversation: [],
            context: {},
            sessionId: this.generateSessionId()
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🤖 AI Chat Assistant Initializing...');
        
        // Load saved state
        this.loadState();
        
        // Create chat interface
        this.createChatInterface();
        
        // Load context
        this.loadContext();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Greet user
        this.greetUser();
        
        console.log('✅ AI Chat Assistant Ready!');
    }
    
    createChatInterface() {
        // Create chat container
        this.container = document.createElement('div');
        this.container.id = 'ai-chat-container';
        this.container.className = 'ai-chat-container';
        
        this.container.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <i class="fas fa-robot"></i>
                    <h3>ZewedJobs AI Assistant</h3>
                    <span class="ai-status">Online</span>
                </div>
                <button class="ai-chat-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="ai-chat-messages" id="aiChatMessages">
                <!-- Messages will be inserted here -->
            </div>
            
            <div class="ai-chat-input-container">
                <div class="ai-chat-input-wrapper">
                    <textarea 
                        id="aiChatInput" 
                        placeholder="Ask me about jobs, career advice, or help with your resume..."
                        rows="1"
                    ></textarea>
                    <button id="aiChatSend" class="ai-chat-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="ai-chat-suggestions">
                    <button class="suggestion-btn" data-prompt="Find me remote developer jobs">🔍 Find Remote Jobs</button>
                    <button class="suggestion-btn" data-prompt="Help me improve my resume">📄 Resume Help</button>
                    <button class="suggestion-btn" data-prompt="Career advice for software engineers">💼 Career Advice</button>
                </div>
            </div>
            
            <div class="ai-chat-footer">
                <span class="ai-disclaimer">AI responses may not always be accurate. Verify important information.</span>
            </div>
        `;
        
        // Create toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'aiChatToggle';
        this.toggleButton.className = 'ai-chat-toggle';
        this.toggleButton.innerHTML = '<i class="fas fa-robot"></i>';
        
        // Add to page
        document.body.appendChild(this.container);
        document.body.appendChild(this.toggleButton);
        
        // Apply styles
        this.applyStyles();
    }
    
    applyStyles() {
        const styles = `
            .ai-chat-container {
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 400px;
                max-width: calc(100vw - 60px);
                height: 600px;
                max-height: 80vh;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                z-index: 10000;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }
            
            .ai-chat-container.open {
                opacity: 1;
                transform: translateY(0);
            }
            
            .ai-chat-header {
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }
            
            .ai-chat-title {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .ai-chat-title i {
                font-size: 24px;
            }
            
            .ai-chat-title h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .ai-status {
                background: rgba(255,255,255,0.2);
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                margin-left: 8px;
            }
            
            .ai-chat-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }
            
            .ai-chat-close:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .ai-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .ai-message {
                max-width: 85%;
                padding: 12px 16px;
                border-radius: 18px;
                line-height: 1.5;
                word-wrap: break-word;
                animation: fadeIn 0.3s ease;
            }
            
            .ai-message.user {
                align-self: flex-end;
                background: #3b82f6;
                color: white;
                border-bottom-right-radius: 4px;
            }
            
            .ai-message.assistant {
                align-self: flex-start;
                background: #f3f4f6;
                color: #374151;
                border-bottom-left-radius: 4px;
            }
            
            .ai-message.typing {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 16px;
            }
            
            .typing-dot {
                width: 8px;
                height: 8px;
                background: #9ca3af;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }
            
            .typing-dot:nth-child(1) { animation-delay: -0.32s; }
            .typing-dot:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes typing {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .ai-chat-input-container {
                padding: 20px;
                border-top: 1px solid #e5e7eb;
                flex-shrink: 0;
            }
            
            .ai-chat-input-wrapper {
                display: flex;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            #aiChatInput {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 24px;
                font-size: 14px;
                resize: none;
                font-family: inherit;
                line-height: 1.5;
                max-height: 120px;
                transition: border-color 0.2s ease;
            }
            
            #aiChatInput:focus {
                outline: none;
                border-color: #3b82f6;
            }
            
            .ai-chat-send {
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 50%;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s ease;
                flex-shrink: 0;
            }
            
            .ai-chat-send:hover {
                background: #2563eb;
            }
            
            .ai-chat-send:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }
            
            .ai-chat-suggestions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .suggestion-btn {
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                padding: 8px 16px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .suggestion-btn:hover {
                background: #e5e7eb;
                transform: translateY(-1px);
            }
            
            .ai-chat-footer {
                padding: 12px 20px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
                font-size: 11px;
                color: #6b7280;
                text-align: center;
                flex-shrink: 0;
            }
            
            .ai-chat-toggle {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                z-index: 9999;
                transition: all 0.3s ease;
            }
            
            .ai-chat-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
            }
            
            .ai-chat-toggle.open {
                transform: scale(0.9);
                opacity: 0;
                visibility: hidden;
            }
            
            .message-content {
                line-height: 1.6;
            }
            
            .message-content h1, 
            .message-content h2, 
            .message-content h3 {
                margin: 8px 0 4px 0;
                font-weight: 600;
            }
            
            .message-content ul, 
            .message-content ol {
                margin: 8px 0;
                padding-left: 20px;
            }
            
            .message-content li {
                margin: 4px 0;
            }
            
            .message-content code {
                background: rgba(0,0,0,0.05);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }
            
            .message-content pre {
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 12px;
                border-radius: 6px;
                overflow-x: auto;
                margin: 8px 0;
                font-size: 0.9em;
            }
            
            .message-content a {
                color: #3b82f6;
                text-decoration: none;
            }
            
            .message-content a:hover {
                text-decoration: underline;
            }
            
            @media (max-width: 768px) {
                .ai-chat-container {
                    width: 100%;
                    height: 100%;
                    max-width: 100%;
                    max-height: 100%;
                    bottom: 0;
                    right: 0;
                    border-radius: 0;
                }
                
                .ai-chat-toggle {
                    bottom: 20px;
                    right: 20px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    setupEventListeners() {
        // Toggle chat
        this.toggleButton.addEventListener('click', () => this.toggleChat());
        
        // Close chat
        this.container.querySelector('.ai-chat-close').addEventListener('click', () => this.closeChat());
        
        // Send message
        const sendBtn = document.getElementById('aiChatSend');
        const input = document.getElementById('aiChatInput');
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
        
        // Suggestion buttons
        this.container.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                input.value = prompt;
                this.sendMessage();
            });
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.closeChat();
            }
        });
    }
    
    toggleChat() {
        this.state.isOpen = !this.state.isOpen;
        
        if (this.state.isOpen) {
            this.openChat();
        } else {
            this.closeChat();
        }
    }
    
    openChat() {
        this.container.classList.add('open');
        this.toggleButton.classList.add('open');
        document.getElementById('aiChatInput').focus();
        
        // Track chat opened
        this.trackEvent('chat_opened');
    }
    
    closeChat() {
        this.container.classList.remove('open');
        this.toggleButton.classList.remove('open');
        
        // Track chat closed
        this.trackEvent('chat_closed');
    }
    
    async sendMessage() {
        const input = document.getElementById('aiChatInput');
        const message = input.value.trim();
        
        if (!message || this.state.isTyping) return;
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add AI response
            this.addMessage(response, 'assistant');
            
            // Save to conversation history
            this.state.conversation.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
            
            this.state.conversation.push({
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            });
            
            // Trim history if too long
            if (this.state.conversation.length > this.config.historySize * 2) {
                this.state.conversation = this.state.conversation.slice(-this.config.historySize * 2);
            }
            
            // Save state
            this.saveState();
            
            // Track message
            this.trackEvent('message_sent', { length: message.length });
            
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
            console.error('AI Chat Error:', error);
        }
    }
    
    async getAIResponse(message) {
        // In a real implementation, this would call an AI API
        // For now, we'll simulate responses
        
        const context = this.buildContext();
        const prompt = this.buildPrompt(message, context);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock responses based on message content
        const responses = {
            // Job search related
            'job': 'I can help you find jobs! Try searching for specific roles like "software developer" or "marketing manager". You can also filter by location, remote work, or salary range.',
            'remote': 'For remote jobs, check out our "Remote Work" category. Many companies offer fully remote positions with flexible hours.',
            'salary': 'Salaries vary based on location, experience, and role. Use our salary calculator tool for accurate estimates.',
            
            // Career advice
            'resume': 'For resume tips: 1) Use action verbs, 2) Quantify achievements, 3) Tailor for each job, 4) Keep it to 1-2 pages, 5) Proofread carefully.',
            'interview': 'Interview tips: 1) Research the company, 2) Practice common questions, 3) Prepare questions to ask, 4) Dress appropriately, 5) Follow up after.',
            'career': 'Career growth involves continuous learning, networking, setting clear goals, seeking feedback, and being adaptable to change.',
            
            // Technical help
            'skill': 'In-demand skills vary by industry. For tech: JavaScript, Python, Cloud, Data Analysis. For business: Project Management, Analytics, Communication.',
            'certificate': 'Certifications can boost your resume. Popular ones include PMP, AWS, Google Analytics, Scrum Master, and various coding bootcamp certificates.',
            
            // Default response
            'default': "I'm here to help with your job search and career questions! You can ask me about finding jobs, resume tips, interview preparation, or career advice. What specifically would you like to know?"
        };
        
        // Find appropriate response
        const messageLower = message.toLowerCase();
        let responseKey = 'default';
        
        for (const [key, response] of Object.entries(responses)) {
            if (messageLower.includes(key)) {
                responseKey = key;
                break;
            }
        }
        
        return responses[responseKey] || responses.default;
    }
    
    buildContext() {
        // Build context from user profile and current page
        const context = {
            user: {
                isLoggedIn: !!localStorage.getItem('auth_token'),
                profile: this.getUserProfile(),
                preferences: this.getUserPreferences()
            },
            page: {
                url: window.location.pathname,
                type: this.getPageType(),
                content: this.getPageContent()
            },
            jobs: {
                recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
                savedJobs: JSON.parse(localStorage.getItem('savedJobs') || '[]'),
                applications: JSON.parse(localStorage.getItem('jobApplications') || '[]')
            }
        };
        
        return context;
    }
    
    buildPrompt(message, context) {
        // Build the prompt for the AI
        return `
            You are ZewedJobs AI Assistant, a helpful career and job search assistant.
            
            Context:
            - User is ${context.user.isLoggedIn ? 'logged in' : 'not logged in'}
            - Current page: ${context.page.url}
            - Recent job searches: ${context.jobs.recentSearches.join(', ')}
            
            User's message: ${message}
            
            Please provide helpful, specific advice related to job searching, career development, resumes, interviews, or skills development. If asking about specific jobs, suggest relevant filters or categories. Keep responses concise but informative.
        `;
    }
    
    addMessage(content, role) {
        const messagesContainer = document.getElementById('aiChatMessages');
        
        const messageElement = document.createElement('div');
        messageElement.className = `ai-message ${role}`;
        
        // Format content
        const formattedContent = this.formatMessageContent(content);
        messageElement.innerHTML = `<div class="message-content">${formattedContent}</div>`;
        
        messagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    formatMessageContent(content) {
        // Basic formatting for markdown-like syntax
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        // Add numbering for lists
        formatted = formatted.replace(/(\d+\)) /g, '<br>$1 ');
        formatted = formatted.replace(/• /g, '<br>• ');
        
        return formatted;
    }
    
    showTypingIndicator() {
        this.state.isTyping = true;
        
        const messagesContainer = document.getElementById('aiChatMessages');
        const typingElement = document.createElement('div');
        typingElement.className = 'ai-message assistant typing';
        typingElement.id = 'aiTypingIndicator';
        typingElement.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        messagesContainer.appendChild(typingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    removeTypingIndicator() {
        this.state.isTyping = false;
        
        const typingIndicator = document.getElementById('aiTypingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    greetUser() {
        const greetings = [
            "Hello! I'm your AI career assistant. How can I help you today?",
            "Hi there! Ready to find your dream job? Ask me anything about careers or job searching.",
            "Welcome! I can help with job search tips, resume advice, interview preparation, and more. What would you like to know?"
        ];
        
        // Only greet on first interaction
        if (!localStorage.getItem('aiChatGreeted')) {
            setTimeout(() => {
                this.addMessage(greetings[Math.floor(Math.random() * greetings.length)], 'assistant');
                localStorage.setItem('aiChatGreeted', 'true');
            }, 1000);
        }
    }
    
    getUserProfile() {
        try {
            return JSON.parse(localStorage.getItem('user_profile') || '{}');
        } catch {
            return {};
        }
    }
    
    getUserPreferences() {
        try {
            return JSON.parse(localStorage.getItem('user_preferences') || '{}');
        } catch {
            return {};
        }
    }
    
    getPageType() {
        const path = window.location.pathname;
        if (path.includes('jobs')) return 'job_listings';
        if (path.includes('courses')) return 'courses';
        if (path.includes('events')) return 'events';
        if (path.includes('dashboard')) return 'dashboard';
        return 'other';
    }
    
    getPageContent() {
        // Extract relevant page content
        const pageTitle = document.title;
        const h1 = document.querySelector('h1')?.textContent || '';
        
        return {
            title: pageTitle,
            heading: h1
        };
    }
    
    generateSessionId() {
        return 'ai-chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('aiChatState');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state.conversation = parsed.conversation || [];
                this.state.sessionId = parsed.sessionId || this.generateSessionId();
            }
        } catch (error) {
            console.error('Error loading AI chat state:', error);
        }
    }
    
    saveState() {
        try {
            const stateToSave = {
                conversation: this.state.conversation,
                sessionId: this.state.sessionId
            };
            localStorage.setItem('aiChatState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving AI chat state:', error);
        }
    }
    
    trackEvent(eventName, data = {}) {
        // Track chat events
        const eventData = {
            ...data,
            sessionId: this.state.sessionId,
            timestamp: new Date().toISOString()
        };
        
        console.log(`AI Chat Event: ${eventName}`, eventData);
        
        // In production, send to analytics
        if (window.app && window.app.trackEvent) {
            window.app.trackEvent('ai_chat', eventName, JSON.stringify(data));
        }
    }
    
    // Public methods
    async analyzeResume(resumeText) {
        // Analyze resume text and provide feedback
        const prompt = `
            Analyze this resume and provide specific improvement suggestions:
            
            ${resumeText}
            
            Focus on:
            1. Overall structure and formatting
            2. Use of action verbs and quantifiable achievements
            3. Skills and keywords for ATS systems
            4. Areas for improvement
            5. Strengths to highlight
        `;
        
        return this.getAIResponse(prompt);
    }
    
    async prepareForInterview(jobDescription) {
        // Generate interview questions and tips based on job description
        const prompt = `
            Based on this job description, generate likely interview questions and preparation tips:
            
            ${jobDescription}
            
            Include:
            1. Common behavioral questions
            2. Technical/role-specific questions
            3. Questions to ask the interviewer
            4. Preparation tips
        `;
        
        return this.getAIResponse(prompt);
    }
    
    async suggestCareerPath(skills, interests) {
        // Suggest career paths based on skills and interests
        const prompt = `
            Suggest career paths for someone with these skills and interests:
            
            Skills: ${skills}
            Interests: ${interests}
            
            Include:
            1. Recommended roles/positions
            2. Skills to develop
            3. Industry trends
            4. Salary expectations
            5. Growth opportunities
        `;
        
        return this.getAIResponse(prompt);
    }
    
    // Utility methods
    clearHistory() {
        this.state.conversation = [];
        this.saveState();
        
        const messagesContainer = document.getElementById('aiChatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        this.greetUser();
    }
    
    exportConversation() {
        const conversationText = this.state.conversation
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');
        
        const blob = new Blob([conversationText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-chat-${this.state.sessionId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    setLanguage(language) {
        // Set chat language
        console.log(`Setting AI chat language to ${language}`);
        // In production, this would switch the AI model language
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if AI chat is enabled
    const aiChatEnabled = localStorage.getItem('aiChatEnabled') !== 'false';
    
    if (aiChatEnabled && !window.aiChat) {
        window.aiChat = new AIChat();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChat;
}
