// events.js - Events and Webinars Management
class EventManager {
    constructor() {
        this.events = [];
        this.userRegistrations = [];
        this.init();
    }

    async init() {
        await this.loadEvents();
        await this.loadRegistrations();
        this.renderEvents();
        this.setupEventListeners();
        this.checkUpcomingEvents();
    }

    async loadEvents() {
        try {
            const response = await fetch('/api/events');
            this.events = await response.json();
        } catch (error) {
            console.error('Failed to load events:', error);
            this.events = this.getSampleEvents();
        }
    }

    getSampleEvents() {
        return [
            {
                id: 1,
                title: 'Tech Career Fair 2024',
                type: 'career_fair',
                date: '2024-06-15',
                time: '10:00 AM - 4:00 PM',
                location: 'Virtual / Online',
                description: 'Connect with top tech companies hiring now',
                speakers: ['John TechLead', 'Sarah HR'],
                price: 0,
                seats: 500,
                registered: 320,
                thumbnail: 'https://via.placeholder.com/300x200',
                organizer: 'ZewedJobs',
                tags: ['tech', 'hiring', 'networking']
            },
            {
                id: 2,
                title: 'AI in Recruitment Webinar',
                type: 'webinar',
                date: '2024-06-20',
                time: '2:00 PM - 3:30 PM',
                location: 'Online',
                description: 'Learn how AI is transforming recruitment',
                speakers: ['Dr. AI Expert', 'Jane Recruiter'],
                price: 49,
                seats: 100,
                registered: 78,
                thumbnail: 'https://via.placeholder.com/300x200',
                organizer: 'ZewedJobs Academy',
                tags: ['ai', 'webinar', 'recruitment']
            }
        ];
    }

    async loadRegistrations() {
        const userId = localStorage.getItem('userId');
        if (userId) {
            try {
                const response = await fetch(`/api/users/${userId}/event-registrations`);
                this.userRegistrations = await response.json();
            } catch (error) {
                this.userRegistrations = JSON.parse(localStorage.getItem('event_registrations') || '[]');
            }
        }
    }

    renderEvents() {
        const container = document.querySelector('.events-container');
        if (!container) return;

        container.innerHTML = this.events.map(event => {
            const isRegistered = this.userRegistrations.some(reg => reg.eventId === event.id);
            const seatsLeft = event.seats - event.registered;
            const isSoldOut = seatsLeft <= 0;
            
            return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-header">
                    <div class="event-date">
                        <span class="event-day">${new Date(event.date).getDate()}</span>
                        <span class="event-month">${new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div class="event-title">
                        <h3>${event.title}</h3>
                        <span class="event-type ${event.type}">${event.type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    ${isRegistered ? 
                        '<span class="event-badge registered"><i class="fas fa-check"></i> Registered</span>' : 
                        ''}
                </div>
                <div class="event-thumbnail">
                    <img src="${event.thumbnail}" alt="${event.title}">
                    ${isSoldOut ? '<span class="event-badge sold-out">Sold Out</span>' : ''}
                </div>
                <div class="event-details">
                    <p><i class="fas fa-calendar"></i> ${event.date} | ${event.time}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    <p><i class="fas fa-users"></i> ${event.registered} registered (${seatsLeft} seats left)</p>
                    <p><i class="fas fa-microphone"></i> Speakers: ${event.speakers.join(', ')}</p>
                    <div class="event-description">${event.description}</div>
                    <div class="event-tags">
                        ${event.tags.map(tag => `<span class="event-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="event-footer">
                    <div class="event-price">
                        ${event.price > 0 ? `$${event.price}` : 'FREE'}
                    </div>
                    ${isRegistered ?
                        `<button class="btn-view-details" onclick="eventManager.viewEventDetails(${event.id})">
                            <i class="fas fa-calendar-check"></i> View Details
                        </button>` :
                        `<button class="btn-register ${isSoldOut ? 'disabled' : ''}" 
                                 onclick="eventManager.registerForEvent(${event.id})"
                                 ${isSoldOut ? 'disabled' : ''}>
                            <i class="fas fa-user-plus"></i> 
                            ${isSoldOut ? 'Sold Out' : 'Register Now'}
                        </button>`
                    }
                </div>
            </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Filter events by type
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('event-filter')) {
                const filter = e.target.dataset.filter;
                this.filterEvents(filter);
            }
        });

        // Calendar view toggle
        document.addEventListener('click', (e) => {
            if (e.target.id === 'toggle-calendar-view') {
                this.toggleCalendarView();
            }
        });
    }

    filterEvents(filter) {
        const filtered = filter === 'all' 
            ? this.events 
            : this.events.filter(event => event.type === filter);
        
        this.renderFilteredEvents(filtered);
    }

    renderFilteredEvents(events) {
        const container = document.querySelector('.events-container');
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No events found</h3>
                    <p>Check back later for upcoming events</p>
                </div>
            `;
            return;
        }

        this.events = events;
        this.renderEvents();
    }

    toggleCalendarView() {
        const container = document.querySelector('.events-container');
        container.classList.toggle('calendar-view');
        
        if (container.classList.contains('calendar-view')) {
            this.renderCalendarView();
        } else {
            this.renderEvents();
        }
    }

    renderCalendarView() {
        const container = document.querySelector('.events-container');
        const eventsByMonth = this.groupEventsByMonth();
        
        container.innerHTML = Object.entries(eventsByMonth).map(([month, events]) => `
            <div class="calendar-month">
                <h3>${month}</h3>
                <div class="calendar-days">
                    ${events.map(event => `
                        <div class="calendar-day-event" style="grid-column: ${new Date(event.date).getDay() + 1}">
                            <div class="day-number">${new Date(event.date).getDate()}</div>
                            <div class="day-event-title">${event.title}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    groupEventsByMonth() {
        return this.events.reduce((groups, event) => {
            const month = new Date(event.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[month]) groups[month] = [];
            groups[month].push(event);
            return groups;
        }, {});
    }

    async registerForEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Please login to register for events');
            return;
        }

        if (event.price > 0) {
            // Redirect to payment
            window.location.href = `/payment?type=event&id=${eventId}&amount=${event.price}`;
            return;
        }

        try {
            const response = await fetch('/api/events/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, eventId })
            });

            if (response.ok) {
                event.registered++;
                this.userRegistrations.push({ eventId, registrationDate: new Date().toISOString() });
                this.saveRegistrations();
                this.renderEvents();
                
                // Send confirmation
                this.sendConfirmation(event);
                alert('Successfully registered!');
            }
        } catch (error) {
            console.error('Registration failed:', error);
        }
    }

    sendConfirmation(event) {
        const emailData = {
            to: localStorage.getItem('userEmail'),
            subject: `Registration Confirmation: ${event.title}`,
            body: `
                <h2>Registration Confirmed!</h2>
                <p>You have successfully registered for <strong>${event.title}</strong></p>
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                <p>We'll send you a reminder before the event.</p>
            `
        };

        // In a real app, send email via API
        console.log('Confirmation email:', emailData);
    }

    viewEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        this.showEventModal(event);
    }

    showEventModal(event) {
        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="btn-close-modal">&times;</button>
                <div class="modal-header">
                    <h2>${event.title}</h2>
                    <span class="event-type ${event.type}">${event.type.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div class="modal-body">
                    <img src="${event.thumbnail}" alt="${event.title}" class="modal-thumbnail">
                    <div class="event-info-grid">
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <div>
                                <strong>Date & Time</strong>
                                <p>${event.date} | ${event.time}</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <strong>Location</strong>
                                <p>${event.location}</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-users"></i>
                            <div>
                                <strong>Attendees</strong>
                                <p>${event.registered} registered</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-microphone"></i>
                            <div>
                                <strong>Speakers</strong>
                                <p>${event.speakers.join(', ')}</p>
                            </div>
                        </div>
                    </div>
                    <div class="event-description">
                        <h3>About This Event</h3>
                        <p>${event.description}</p>
                    </div>
                    <div class="event-agenda">
                        <h3>Event Agenda</h3>
                        <div class="agenda-items">
                            ${this.generateAgenda(event).map(item => `
                                <div class="agenda-item">
                                    <span class="agenda-time">${item.time}</span>
                                    <span class="agenda-title">${item.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-add-to-calendar" onclick="eventManager.addToCalendar(${event.id})">
                        <i class="fas fa-calendar-plus"></i> Add to Calendar
                    </button>
                    <button class="btn-share-event" onclick="eventManager.shareEvent(${event.id})">
                        <i class="fas fa-share"></i> Share Event
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    generateAgenda(event) {
        // Generate sample agenda based on event type
        if (event.type === 'webinar') {
            return [
                { time: '2:00 PM', title: 'Welcome & Introduction' },
                { time: '2:15 PM', title: 'Main Presentation' },
                { time: '3:00 PM', title: 'Q&A Session' },
                { time: '3:25 PM', title: 'Closing Remarks' }
            ];
        } else {
            return [
                { time: '10:00 AM', title: 'Registration & Welcome' },
                { time: '11:00 AM', title: 'Keynote Speech' },
                { time: '12:00 PM', title: 'Networking Session' },
                { time: '1:00 PM', title: 'Company Presentations' },
                { time: '3:00 PM', title: 'One-on-One Interviews' }
            ];
        }
    }

    addToCalendar(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Create .ics file for calendar
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title.replace(/\s+/g, '-')}.ics`;
        a.click();
    }

    shareEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: event.description,
                url: `${window.location.origin}/events/${eventId}`
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(`${event.title} - ${window.location.origin}/events/${eventId}`);
            alert('Event link copied to clipboard!');
        }
    }

    saveRegistrations() {
        localStorage.setItem('event_registrations', JSON.stringify(this.userRegistrations));
    }

    checkUpcomingEvents() {
        const now = new Date();
        const upcomingEvents = this.events.filter(event => 
            new Date(event.date) > now && 
            this.userRegistrations.some(reg => reg.eventId === event.id)
        );

        if (upcomingEvents.length > 0) {
            this.showUpcomingReminder(upcomingEvents);
        }
    }

    showUpcomingReminder(events) {
        const reminder = document.createElement('div');
        reminder.className = 'upcoming-events-reminder';
        reminder.innerHTML = `
            <div class="reminder-content">
                <i class="fas fa-bell"></i>
                <div>
                    <h4>Upcoming Events</h4>
                    <p>You have ${events.length} event${events.length > 1 ? 's' : ''} coming up</p>
                </div>
                <button class="btn-view-events" onclick="eventManager.viewMyEvents()">View</button>
                <button class="btn-dismiss-reminder">&times;</button>
            </div>
        `;
        document.body.appendChild(reminder);

        reminder.querySelector('.btn-dismiss-reminder').addEventListener('click', () => {
            reminder.remove();
        });
    }

    viewMyEvents() {
        const myEvents = this.events.filter(event => 
            this.userRegistrations.some(reg => reg.eventId === event.id)
        );
        
        const modal = document.createElement('div');
        modal.className = 'my-events-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>My Registered Events</h2>
                <div class="my-events-list">
                    ${myEvents.map(event => `
                        <div class="my-event-item">
                            <div class="event-date">${new Date(event.date).toLocaleDateString()}</div>
                            <div class="event-info">
                                <h4>${event.title}</h4>
                                <p>${event.time} | ${event.location}</p>
                            </div>
                            <div class="event-actions">
                                <button class="btn-view-details" onclick="eventManager.viewEventDetails(${event.id})">
                                    Details
                                </button>
                                <button class="btn-cancel-registration" onclick="eventManager.cancelRegistration(${event.id})">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    cancelRegistration(eventId) {
        if (confirm('Are you sure you want to cancel your registration?')) {
            const index = this.userRegistrations.findIndex(reg => reg.eventId === eventId);
            if (index > -1) {
                this.userRegistrations.splice(index, 1);
                this.saveRegistrations();
                
                const event = this.events.find(e => e.id === eventId);
                if (event) event.registered--;
                
                this.renderEvents();
                alert('Registration cancelled');
            }
        }
    }
}

// Initialize event manager
document.addEventListener('DOMContentLoaded', () => {
    window.eventManager = new EventManager();
});
