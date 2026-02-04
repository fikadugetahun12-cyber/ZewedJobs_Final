// i18n.js - Internationalization and Localization Manager
class I18nManager {
    constructor() {
        this.locale = 'en';
        this.fallbackLocale = 'en';
        this.translations = {};
        this.formatters = {};
        this.pluralRules = {};
        this.init();
    }

    async init() {
        await this.loadUserLocale();
        await this.loadTranslations();
        this.setupFormatters();
        this.setupEventListeners();
        this.setupLocaleDetection();
    }

    // Locale detection
    async loadUserLocale() {
        // Check localStorage first
        const savedLocale = localStorage.getItem('user_locale');
        if (savedLocale) {
            this.locale = savedLocale;
            return;
        }

        // Check browser language
        const browserLocale = this.detectBrowserLocale();
        if (await this.isLocaleSupported(browserLocale)) {
            this.locale = browserLocale;
        }

        // Save detected locale
        localStorage.setItem('user_locale', this.locale);
    }

    detectBrowserLocale() {
        // Get browser language
        const browserLang = navigator.language || navigator.userLanguage;
        
        // Extract language code (e.g., 'en-US' -> 'en')
        const langCode = browserLang.split('-')[0];
        
        // Check if it's a supported language
        const supportedLocales = this.getSupportedLocales();
        const exactMatch = supportedLocales.find(locale => locale.code === browserLang);
        const langMatch = supportedLocales.find(locale => locale.code === langCode);
        
        return exactMatch ? browserLang : (langMatch ? langCode : this.fallbackLocale);
    }

    async isLocaleSupported(locale) {
        const supported = this.getSupportedLocales();
        return supported.some(l => l.code === locale);
    }

    getSupportedLocales() {
        return [
            { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
            { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', dir: 'ltr', flag: '🇪🇹' },
            { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
            { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
            { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
            { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', flag: '🇨🇳' },
            { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', flag: '🇷🇺' },
            { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
            { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', flag: '🇯🇵' },
            { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', flag: '🇰🇷' }
        ];
    }

    // Translation loading
    async loadTranslations() {
        try {
            // Load translation files
            const localePromises = this.getSupportedLocales().map(async (locale) => {
                try {
                    const response = await fetch(`/locales/${locale.code}.json`);
                    this.translations[locale.code] = await response.json();
                } catch (error) {
                    console.warn(`Failed to load translations for ${locale.code}:`, error);
                    
                    // Load fallback if available
                    if (locale.code !== this.fallbackLocale) {
                        await this.loadFallbackTranslations(locale.code);
                    }
                }
            });

            await Promise.all(localePromises);
            
            // Ensure fallback locale is loaded
            if (!this.translations[this.fallbackLocale]) {
                await this.loadFallbackTranslations(this.fallbackLocale);
            }
        } catch (error) {
            console.error('Failed to load translations:', error);
            this.translations = this.getDefaultTranslations();
        }
    }

    async loadFallbackTranslations(locale) {
        try {
            const response = await fetch(`/locales/${this.fallbackLocale}.json`);
            this.translations[locale] = await response.json();
        } catch (error) {
            console.error(`Failed to load fallback for ${locale}:`, error);
            this.translations[locale] = this.getDefaultTranslations()[locale] || {};
        }
    }

    getDefaultTranslations() {
        return {
            en: {
                app: {
                    name: 'ZewedJobs',
                    slogan: 'Find Your Dream Job Today',
                    loading: 'Loading...',
                    error: 'An error occurred',
                    success: 'Success!',
                    confirm: 'Are you sure?',
                    cancel: 'Cancel',
                    save: 'Save',
                    delete: 'Delete',
                    edit: 'Edit',
                    view: 'View'
                },
                nav: {
                    home: 'Home',
                    jobs: 'Browse Jobs',
                    employers: 'For Employers',
                    about: 'About',
                    contact: 'Contact',
                    login: 'Login',
                    signup: 'Sign Up'
                },
                jobs: {
                    title: 'Jobs',
                    search: 'Search Jobs',
                    apply: 'Apply Now',
                    remote: 'Remote',
                    fulltime: 'Full-time',
                    parttime: 'Part-time',
                    contract: 'Contract',
                    salary: 'Salary',
                    location: 'Location',
                    posted: 'Posted',
                    deadline: 'Application Deadline'
                },
                errors: {
                    required: 'This field is required',
                    email: 'Please enter a valid email',
                    password: 'Password must be at least 8 characters',
                    match: 'Values do not match',
                    generic: 'Something went wrong'
                },
                dates: {
                    today: 'Today',
                    yesterday: 'Yesterday',
                    tomorrow: 'Tomorrow',
                    this_week: 'This Week',
                    last_week: 'Last Week',
                    this_month: 'This Month',
                    last_month: 'Last Month'
                }
            },
            am: {
                app: {
                    name: 'ዘውድ ስራ',
                    slogan: 'የህልምዎን ስራ ዛሬ ያግኙ',
                    loading: 'በመጫን ላይ...',
                    error: 'ስህተት ተከስቷል',
                    success: 'ተሳክቷል!',
                    confirm: 'እርግጠኛ ነህ?',
                    cancel: 'ሰርዝ',
                    save: 'አስቀምጥ',
                    delete: 'ሰርዝ',
                    edit: 'አርም',
                    view: 'ይመልከቱ'
                },
                nav: {
                    home: 'መግቢያ',
                    jobs: 'ስራዎችን ይመልከቱ',
                    employers: 'ለሥራ መስጫዎች',
                    about: 'ስለ እኛ',
                    contact: 'አግኙን',
                    login: 'ግባ',
                    signup: 'ተመዝገብ'
                }
            }
            // Add more languages as needed
        };
    }

    // Translation methods
    t(key, params = {}) {
        // Get translation for current locale
        let translation = this.getTranslation(key, this.locale);
        
        // Fallback to default locale if not found
        if (!translation && this.locale !== this.fallbackLocale) {
            translation = this.getTranslation(key, this.fallbackLocale);
        }
        
        // Return key if no translation found
        if (!translation) {
            console.warn(`Translation missing for key: ${key} in locale: ${this.locale}`);
            return key;
        }
        
        // Replace parameters
        translation = this.replaceParams(translation, params);
        
        return translation;
    }

    getTranslation(key, locale) {
        const keys = key.split('.');
        let value = this.translations[locale];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return typeof value === 'string' ? value : null;
    }

    replaceParams(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
            return params[paramName] !== undefined ? params[paramName] : match;
        });
    }

    // Pluralization
    plural(key, count, params = {}) {
        const pluralKey = this.getPluralKey(key, count);
        return this.t(pluralKey, { count, ...params });
    }

    getPluralKey(baseKey, count) {
        // Different languages have different plural rules
        const rules = this.getPluralRules();
        const rule = rules[this.locale] || rules[this.fallbackLocale];
        const pluralForm = rule(count);
        
        return `${baseKey}.${pluralForm}`;
    }

    getPluralRules() {
        return {
            // English: 1 singular, other plural
            en: (n) => n === 1 ? 'one' : 'other',
            
            // Amharic: similar to English
            am: (n) => n === 1 ? 'one' : 'other',
            
            // Arabic: 0, 1, 2, 3-10, 11+
            ar: (n) => {
                if (n === 0) return 'zero';
                if (n === 1) return 'one';
                if (n === 2) return 'two';
                if (n >= 3 && n <= 10) return 'few';
                return 'other';
            },
            
            // Default rule
            default: (n) => n === 1 ? 'one' : 'other'
        };
    }

    // Locale switching
    async setLocale(locale) {
        if (!await this.isLocaleSupported(locale)) {
            console.warn(`Locale ${locale} is not supported`);
            return false;
        }

        const oldLocale = this.locale;
        this.locale = locale;
        
        // Save preference
        localStorage.setItem('user_locale', locale);
        
        // Update HTML lang attribute
        document.documentElement.lang = locale;
        
        // Update text direction
        this.updateTextDirection();
        
        // Load translations if not already loaded
        if (!this.translations[locale]) {
            await this.loadLocaleTranslations(locale);
        }
        
        // Dispatch change event
        this.emitLocaleChange(oldLocale, locale);
        
        return true;
    }

    async loadLocaleTranslations(locale) {
        try {
            const response = await fetch(`/locales/${locale}.json`);
            this.translations[locale] = await response.json();
        } catch (error) {
            console.error(`Failed to load translations for ${locale}:`, error);
            
            // Use fallback translations
            if (locale !== this.fallbackLocale) {
                this.translations[locale] = this.translations[this.fallbackLocale];
            }
        }
    }

    updateTextDirection() {
        const localeInfo = this.getSupportedLocales().find(l => l.code === this.locale);
        if (localeInfo) {
            document.documentElement.dir = localeInfo.dir;
            document.body.classList.toggle('rtl', localeInfo.dir === 'rtl');
        }
    }

    emitLocaleChange(oldLocale, newLocale) {
        const event = new CustomEvent('localechange', {
            detail: { oldLocale, newLocale }
        });
        window.dispatchEvent(event);
    }

    // Formatters setup
    setupFormatters() {
        this.formatters = {
            number: new Intl.NumberFormat(this.locale),
            currency: new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.getCurrencyCode()
            }),
            date: new Intl.DateTimeFormat(this.locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: new Intl.DateTimeFormat(this.locale, {
                hour: 'numeric',
                minute: 'numeric',
                hour12: this.is12HourFormat()
            }),
            relativeTime: new Intl.RelativeTimeFormat(this.locale, {
                style: 'long'
            })
        };
    }

    getCurrencyCode() {
        const currencyMap = {
            'en-US': 'USD',
            'en-GB': 'GBP',
            'en-CA': 'CAD',
            'en-AU': 'AUD',
            'es-ES': 'EUR',
            'fr-FR': 'EUR',
            'de-DE': 'EUR',
            'ja-JP': 'JPY',
            'zh-CN': 'CNY',
            'ru-RU': 'RUB',
            'am-ET': 'ETB',
            'ar-SA': 'SAR'
        };
        
        return currencyMap[this.locale] || 'USD';
    }

    is12HourFormat() {
        // Countries that typically use 12-hour format
        const twelveHourCountries = ['US', 'CA', 'AU', 'NZ', 'PH', 'EG', 'SA'];
        const countryCode = this.locale.split('-')[1];
        
        return twelveHourCountries.includes(countryCode);
    }

    // Formatting methods
    formatNumber(number) {
        return this.formatters.number.format(number);
    }

    formatCurrency(amount) {
        return this.formatters.currency.format(amount);
    }

    formatDate(date, options = {}) {
        const formatter = new Intl.DateTimeFormat(this.locale, options);
        return formatter.format(new Date(date));
    }

    formatTime(date, options = {}) {
        const defaultOptions = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: this.is12HourFormat()
        };
        
        const formatter = new Intl.DateTimeFormat(this.locale, { ...defaultOptions, ...options });
        return formatter.format(new Date(date));
    }

    formatDateTime(date) {
        return `${this.formatDate(date)} ${this.formatTime(date)}`;
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = new Date(date) - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (Math.abs(days) < 1) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (Math.abs(hours) < 1) {
                const minutes = Math.floor(diff / (1000 * 60));
                return this.formatters.relativeTime.format(minutes, 'minute');
            }
            return this.formatters.relativeTime.format(hours, 'hour');
        }
        
        return this.formatters.relativeTime.format(days, 'day');
    }

    // Event listeners
    setupEventListeners() {
        // Listen for locale change events
        window.addEventListener('localechange', (event) => {
            this.onLocaleChange(event.detail);
        });
        
        // Listen for translation updates
        window.addEventListener('translations:update', (event) => {
            this.updateTranslations(event.detail);
        });
    }

    setupLocaleDetection() {
        // Watch for browser language changes
        window.addEventListener('languagechange', () => {
            this.detectAndSetLocale();
        });
    }

    async detectAndSetLocale() {
        const detectedLocale = this.detectBrowserLocale();
        if (detectedLocale !== this.locale && await this.isLocaleSupported(detectedLocale)) {
            await this.setLocale(detectedLocale);
        }
    }

    // Event handlers
    onLocaleChange({ oldLocale, newLocale }) {
        console.log(`Locale changed from ${oldLocale} to ${newLocale}`);
        
        // Update all dynamic text on page
        this.updatePageTranslations();
        
        // Update formatters
        this.setupFormatters();
        
        // Save analytics
        this.trackLocaleChange(oldLocale, newLocale);
    }

    updateTranslations(newTranslations) {
        Object.keys(newTranslations).forEach(locale => {
            this.translations[locale] = {
                ...this.translations[locale],
                ...newTranslations[locale]
            };
        });
        
        // Update page if locale matches
        this.updatePageTranslations();
    }

    updatePageTranslations() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = this.extractParamsFromElement(element);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = this.t(key, params);
            } else {
                element.textContent = this.t(key, params);
            }
        });
        
        // Update title and meta tags
        this.updateMetaTranslations();
    }

    extractParamsFromElement(element) {
        const params = {};
        
        // Extract params from data attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-i18n-')) {
                const paramName = attr.name.replace('data-i18n-', '');
                params[paramName] = attr.value;
            }
        });
        
        return params;
    }

    updateMetaTranslations() {
        // Update page title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
        if (metaDesc) {
            const descKey = metaDesc.getAttribute('data-i18n');
            metaDesc.setAttribute('content', this.t(descKey));
        }
    }

    // UI components
    createLocaleSelector(options = {}) {
        const container = document.createElement('div');
        container.className = 'locale-selector';
        
        const currentLocale = this.getSupportedLocales().find(l => l.code === this.locale);
        
        container.innerHTML = `
            <button class="locale-toggle">
                <span class="locale-flag">${currentLocale?.flag || '🌐'}</span>
                <span class="locale-name">${currentLocale?.name || this.locale}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="locale-dropdown">
                ${this.getSupportedLocales().map(locale => `
                    <button class="locale-option ${locale.code === this.locale ? 'active' : ''}" 
                            data-locale="${locale.code}"
                            title="${locale.nativeName}">
                        <span class="locale-flag">${locale.flag}</span>
                        <span class="locale-name">${locale.name}</span>
                        <span class="locale-native">${locale.nativeName}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        // Event listeners
        container.querySelector('.locale-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('open');
        });
        
        container.querySelectorAll('.locale-option').forEach(option => {
            option.addEventListener('click', async () => {
                const locale = option.dataset.locale;
                await this.setLocale(locale);
                container.classList.remove('open');
            });
        });
        
        // Close on outside click
        document.addEventListener('click', () => {
            container.classList.remove('open');
        });
        
        return container;
    }

    // Auto-translation (for user-generated content)
    async translateText(text, targetLocale = this.locale) {
        // First check if we have a cached translation
        const cacheKey = `translation:${text}:${targetLocale}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        try {
            // Use translation API
            const response = await api.post('/translate', {
                text,
                source: 'auto',
                target: targetLocale
            });
            
            const translated = response.translatedText;
            
            // Cache the translation
            localStorage.setItem(cacheKey, translated);
            
            return translated;
        } catch (error) {
            console.error('Translation failed:', error);
            return text; // Return original text on failure
        }
    }

    // RTL support
    isRTL() {
        const localeInfo = this.getSupportedLocales().find(l => l.code === this.locale);
        return localeInfo?.dir === 'rtl';
    }

    adjustForRTL(element) {
        if (this.isRTL()) {
            element.classList.add('rtl');
            element.style.textAlign = 'right';
            element.style.direction = 'rtl';
        } else {
            element.classList.remove('rtl');
            element.style.textAlign = 'left';
            element.style.direction = 'ltr';
        }
    }

    // Analytics
    trackLocaleChange(oldLocale, newLocale) {
        const eventData = {
            oldLocale,
            newLocale,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        // Save locally
        const changes = JSON.parse(localStorage.getItem('locale_changes') || '[]');
        changes.push(eventData);
        localStorage.setItem('locale_changes', JSON.stringify(changes.slice(-100)));
        
        // Send to analytics
        api.trackEvent('locale_change', eventData);
    }

    getLocaleStats() {
        const changes = JSON.parse(localStorage.getItem('locale_changes') || '[]');
        
        const stats = {
            totalChanges: changes.length,
            currentLocale: this.locale,
            preferredLocales: {}
        };
        
        // Count occurrences of each locale
        changes.forEach(change => {
            stats.preferredLocales[change.newLocale] = (stats.preferredLocales[change.newLocale] || 0) + 1;
        });
        
        return stats;
    }

    // Utility methods
    getLocaleInfo(locale = this.locale) {
        return this.getSupportedLocales().find(l => l.code === locale);
    }

    getAllLocales() {
        return this.getSupportedLocales();
    }

    formatPhoneNumber(phoneNumber, countryCode = 'US') {
        // Simple phone number formatting
        // In production, use a library like libphonenumber
        return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }

    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${this.formatNumber(Math.round(size * 100) / 100)} ${this.t(`units.${units[unitIndex].toLowerCase()}`)}`;
    }

    // SEO optimization
    updateHreflangTags() {
        // Remove existing hreflang tags
        document.querySelectorAll('link[hreflang]').forEach(tag => tag.remove());
        
        // Add hreflang tags for SEO
        this.getSupportedLocales().forEach(locale => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = locale.code;
            link.href = `${window.location.origin}${window.location.pathname}?lang=${locale.code}`;
            document.head.appendChild(link);
        });
        
        // Add x-default hreflang
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = window.location.href;
        document.head.appendChild(defaultLink);
    }

    // Dynamic content loading
    async loadComponent(componentName, locale = this.locale) {
        try {
            const response = await fetch(`/components/${componentName}/${locale}.html`);
            return await response.text();
        } catch (error) {
            // Fallback to default locale
            if (locale !== this.fallbackLocale) {
                return this.loadComponent(componentName, this.fallbackLocale);
            }
            throw error;
        }
    }

    // Validation messages
    getValidationMessage(rule, field) {
        const key = `validation.${rule}`;
        const message = this.t(key, { field: this.t(`fields.${field}`) });
        
        // Fallback if translation not found
        if (message === key) {
            const defaultMessages = {
                required: `${field} is required`,
                email: 'Please enter a valid email address',
                min: `${field} must be at least {min} characters`,
                max: `${field} must be no more than {max} characters`,
                match: `${field} must match`
            };
            
            return defaultMessages[rule] || `${field} is invalid`;
        }
        
        return message;
    }

    // Date formatting helpers
    getDateFormat() {
        const formatMap = {
            'en-US': 'MM/DD/YYYY',
            'en-GB': 'DD/MM/YYYY',
            'fr-FR': 'DD/MM/YYYY',
            'de-DE': 'DD.MM.YYYY',
            'ja-JP': 'YYYY/MM/DD',
            'zh-CN': 'YYYY-MM-DD',
            'ar-SA': 'DD/MM/YYYY'
        };
        
        return formatMap[this.locale] || 'YYYY-MM-DD';
    }

    getTimeFormat() {
        return this.is12HourFormat() ? '12h' : '24h';
    }
}

// Export singleton instance
const i18n = new I18nManager();
export default i18n;

// Export individual functions for direct use
export const {
    t,
    plural,
    setLocale,
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatRelativeTime,
    isRTL,
    getLocaleInfo,
    createLocaleSelector,
    translateText,
    getValidationMessage
} = i18n;

// Convenience functions for template literals
export function __(key, params) {
    return i18n.t(key, params);
}

export function __n(key, count, params) {
    return i18n.plural(key, count, params);
}
