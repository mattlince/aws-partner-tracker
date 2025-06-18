// Touchpoints Module - Interaction and Communication Tracking
class TouchpointsModule {
    constructor() {
        this.currentFilter = { type: '', contact: '', dateRange: '' };
        this.currentView = 'timeline';
    }

    init() {
        console.log('Touchpoints module initialized');
        
        // Listen for data changes
        DataManager.on('touchpoint:added', () => this.renderIfActive());
        DataManager.on('touchpoint:updated', () => this.renderIfActive());
        DataManager.on('touchpoint:deleted', () => this.renderIfActive());
        DataManager.on('contact:updated', () => this.updateContactDropdowns());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderContent();
        this.updateContactDropdowns();
    }

    renderIfActive() {
        if (AppController.currentTab === 'touchpoints') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        return `
            <div class="touchpoints-container">
                <div class="touchpoints-header">
                    <div>
                        <h2>Touchpoint Tracker</h2>
                        <p>Track all interactions, meetings, calls, and communications</p>
                    </div>
                    <div class="touchpoints-controls">
                        <button class="view-btn ${this.currentView === 'timeline' ? 'active' : ''}" onclick="touchpointsModule.switchView('timeline')">
                            📅 Timeline
                        </button>
                        <button class="view-btn ${this.currentView === 'calendar' ? 'active' : ''}" onclick="touchpointsModule.switchView('calendar')">
                            📊 Calendar View
                        </button>
                        <button class="view-btn ${this.currentView === 'analytics' ? 'active' : ''}" onclick="touchpointsModule.switchView('analytics')">
                            📈 Analytics
                        </button>
                        <button class="action-btn" onclick="touchpointsModule.addTouchpoint()">
                            + Log Touchpoint
                        </button>
                    </div>
                </div>

                <div class="filters-bar">
                    <select id="filterByType" class="filter-input" onchange="touchpointsModule.applyFilters()">
                        <option value="">All Types</option>
                        <option value="meeting">Meeting</option>
                        <option value="call">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="demo">Demo</option>
                        <option value="proposal">Proposal</option>
                        <option value="followup">Follow-up</option>
                        <option value="social">Social Event</option>
                        <option value="other">Other</option>
                    </select>
                    
                    <select id="filterByContact" class="filter-input" onchange="touchpointsModule.applyFilters()">
                        <option value="">All Contacts</option>
                    </select>
                    
                    <select id="filterByDateRange" class="filter-input" onchange="touchpointsModule.applyFilters()">
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                    </select>
                    
                    <button class="action-btn secondary" onclick="touchpointsModule.exportTouchpoints()">
                        📥 Export
                    </button>
                    <button class="action-btn secondary" onclick="touchpointsModule.showTouchpointReport()">
                        📋 Report
                    </button>
                </div>

                <div id="touchpointsContent">
                    <!-- Content will be populated based on current view -->
                </div>

                <!-- Quick Stats Bar -->
                <div id="touchpointsStats" class="stats-bar">
                    <!-- Stats will be populated here -->
                </div>
            </div>

            <style>
                .touchpoints-container {
                    max-width: 100%;
                }
                .touchpoints-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .touchpoints-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }
                .touchpoints-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .touchpoints-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .view-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: all 0.3s ease;
                }
                .view-btn.active {
                    background: #232F3E;
                    color: white;
                    border-color: #232F3E;
                }
                .view-btn:hover:not(.active) {
                    background: #e9ecef;
                }
                .action-btn {
                    background: #FF9900;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: all 0.3s ease;
                }
                .action-btn:hover {
                    background: #e68900;
                    transform: translateY(-1px);
                }
                .action-btn.secondary {
                    background: #6c757d;
                }
                .action-btn.secondary:hover {
                    background: #5a6268;
                }
                .action-btn.danger {
                    background: #dc3545;
                }
                .action-btn.danger:hover {
                    background: #c82333;
                }
                .filters-bar {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    margin-bottom: 25px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    flex-wrap: wrap;
                }
                .filter-input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    min-width: 150px;
                }
                .timeline-container {
                    max-height: 600px;
                    overflow-y: auto;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    background: white;
                }
                .timeline-item {
                    display: flex;
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    transition: all 0.3s ease;
                    position: relative;
                }
                .timeline-item:hover {
                    background: #f8f9fa;
                }
                .timeline-item:last-child {
                    border-bottom: none;
                }
                .timeline-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2em;
                    margin-right: 15px;
                    flex-shrink: 0;
                }
                .timeline-content {
                    flex: 1;
                }
                .timeline-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .timeline-title {
                    font-weight: bold;
                    color: #232F3E;
                    font-size: 1.1em;
                }
                .timeline-meta {
                    display: flex;
                    gap: 15px;
                    color: #666;
                    font-size: 0.9em;
                    margin-bottom: 10px;
                }
                .timeline-description {
                    color: #555;
                    line-height: 1.5;
                    margin-bottom: 10px;
                }
                .timeline-actions {
                    display: flex;
                    gap: 8px;
                }
                .touchpoint-type {
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .type-meeting { background: #e3f2fd; color: #1565c0; }
                .type-call { background: #e8f5e8; color: #2e7d32; }
                .type-email { background: #fff3e0; color: #ef6c00; }
                .type-demo { background: #f3e5f5; color: #7b1fa2; }
                .type-proposal { background: #e0f2f1; color: #00695c; }
                .type-followup { background: #fce4ec; color: #c2185b; }
                .type-social { background: #e8eaf6; color: #3f51b5; }
                .type-other { background: #f5f5f5; color: #616161; }
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 1px;
                    background: #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 20px;
                }
                .calendar-header {
                    background: #232F3E;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 0.9em;
                }
                .calendar-day {
                    background: white;
                    min-height: 100px;
                    padding: 8px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                .calendar-day:hover {
                    background: #f8f9fa;
                }
                .calendar-day.other-month {
                    background: #f5f5f5;
                    color: #999;
                }
                .calendar-day.today {
                    background: #fff3cd;
                    border: 2px solid #ffc107;
                }
                .calendar-date {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .calendar-touchpoint {
                    font-size: 0.7em;
                    padding: 1px 4px;
                    margin: 1px 0;
                    border-radius: 8px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .stats-bar {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                    padding: 25px;
                    background: #f8f9fa;
                    border-radius: 12px;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .stat-value {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .stat-label {
                    color: #666;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }
                .analytics-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .analytics-chart {
                    height: 200px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    font-style: italic;
                    margin-top: 15px;
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Event listeners will be set up through onclick handlers
    }

    switchView(view) {
        this.currentView = view;
        const container = document.getElementById('content-area');
        if (container) {
            this.render(container);
        }
    }

    renderContent() {
        const container = document.getElementById('touchpointsContent');
        if (!container) return;

        switch(this.currentView) {
            case 'timeline':
                this.renderTimeline(container);
                break;
            case 'calendar':
                this.renderCalendar(container);
                break;
            case 'analytics':
                this.renderAnalytics(container);
                break;
        }

        this.renderStats();
    }

    renderTimeline(container) {
        const touchpoints = this.getFilteredTouchpoints();
        
        if (touchpoints.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #666;">
                    <h3>No touchpoints found</h3>
                    <p>Click "Log Touchpoint" to start tracking interactions</p>
                </div>
            `;
            return;
        }

        // Sort by date, most recent first
        touchpoints.sort((a, b) => new Date(b.date) - new Date(a.date));

        const timelineHTML = touchpoints.map(touchpoint => {
            const contact = DataManager.getContactById(touchpoint.contactId);
            const contactName = contact ? contact.name : 'Unknown Contact';
            const icon = this.getTouchpointIcon(touchpoint.type);
            
            return `
                <div class="timeline-item">
                    <div class="timeline-icon ${this.getTouchpointIconClass(touchpoint.type)}">
                        ${icon}
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <div class="timeline-title">${touchpoint.subject}</div>
                            <div class="timeline-actions">
                                <button class="action-btn" onclick="touchpointsModule.editTouchpoint('${touchpoint.id}')">Edit</button>
                                <button class="action-btn danger" onclick="touchpointsModule.deleteTouchpoint('${touchpoint.id}')">Delete</button>
                            </div>
                        </div>
                        <div class="timeline-meta">
                            <span class="touchpoint-type type-${touchpoint.type}">${touchpoint.type}</span>
                            <span>👤 ${contactName}</span>
                            <span>📅 ${UIHelpers.formatDate(touchpoint.date)}</span>
                            ${touchpoint.duration ? `<span>⏱️ ${touchpoint.duration} min</span>` : ''}
                        </div>
                        <div class="timeline-description">
                            ${touchpoint.notes || 'No additional notes'}
                        </div>
                        ${touchpoint.nextSteps ? `
                            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                                <strong>Next Steps:</strong> ${touchpoint.nextSteps}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="timeline-container">
                ${timelineHTML}
            </div>
        `;
    }

    renderCalendar(container) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get first day of month and how many days
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
        
        const touchpoints = this.getFilteredTouchpoints();
        const touchpointsByDate = {};
        
        touchpoints.forEach(tp => {
            const dateKey = tp.date.split('T')[0]; // Get YYYY-MM-DD
            if (!touchpointsByDate[dateKey]) {
                touchpointsByDate[dateKey] = [];
            }
            touchpointsByDate[dateKey].push(tp);
        });

        let calendarHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h3>${firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            </div>
            <div class="calendar-grid">
                <div class="calendar-header">Sun</div>
                <div class="calendar-header">Mon</div>
                <div class="calendar-header">Tue</div>
                <div class="calendar-header">Wed</div>
                <div class="calendar-header">Thu</div>
                <div class="calendar-header">Fri</div>
                <div class="calendar-header">Sat</div>
        `;

        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const dateKey = currentDate.toISOString().split('T')[0];
                const dayTouchpoints = touchpointsByDate[dateKey] || [];
                const isCurrentMonth = currentDate.getMonth() === currentMonth;
                const isToday = currentDate.toDateString() === today.toDateString();
                
                let dayClass = 'calendar-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                if (isToday) dayClass += ' today';

                calendarHTML += `
                    <div class="${dayClass}" onclick="touchpointsModule.showDayTouchpoints('${dateKey}')">
                        <div class="calendar-date">${currentDate.getDate()}</div>
                        ${dayTouchpoints.slice(0, 3).map(tp => `
                            <div class="calendar-touchpoint type-${tp.type}" title="${tp.subject}">
                                ${tp.subject.substring(0, 15)}${tp.subject.length > 15 ? '...' : ''}
                            </div>
                        `).join('')}
                        ${dayTouchpoints.length > 3 ? `<div class="calendar-touchpoint" style="background: #999; color: white;">+${dayTouchpoints.length - 3} more</div>` : ''}
                    </div>
                `;
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        calendarHTML += '</div>';
        container.innerHTML = calendarHTML;
    }

    renderAnalytics(container) {
        const touchpoints = DataManager.getTouchpoints();
        const contacts = DataManager.getAllContacts();
        
        // Calculate analytics
        const typeDistribution = {};
        const monthlyActivity = {};
        const contactActivity = {};
        
        touchpoints.forEach(tp => {
            // Type distribution
            typeDistribution[tp.type] = (typeDistribution[tp.type] || 0) + 1;
            
            // Monthly activity
            const month = tp.date.substring(0, 7); // YYYY-MM
            monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
            
            // Contact activity
            const contact = DataManager.getContactById(tp.contactId);
            if (contact) {
                const contactName = contact.name;
                contactActivity[contactName] = (contactActivity[contactName] || 0) + 1;
            }
        });

        const analyticsHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Touchpoint Types</h3>
                    <div class="analytics-chart">
                        ${Object.entries(typeDistribution).map(([type, count]) => `
                            <div style="margin: 5px 10px;">
                                <span class="touchpoint-type type-${type}">${type}</span>
                                <strong style="margin-left: 10px;">${count}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Monthly Activity</h3>
                    <div class="analytics-chart">
                        ${Object.entries(monthlyActivity)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 6)
                            .map(([month, count]) => `
                                <div style="margin: 5px 0; display: flex; justify-content: space-between; width: 200px;">
                                    <span>${month}</span>
                                    <strong>${count} touchpoints</strong>
                                </div>
                            `).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Most Active Contacts</h3>
                    <div class="analytics-chart">
                        ${Object.entries(contactActivity)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([contact, count]) => `
                                <div style="margin: 5px 0; display: flex; justify-content: space-between; width: 200px;">
                                    <span>${contact}</span>
                                    <strong>${count} touchpoints</strong>
                                </div>
                            `).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Engagement Trends</h3>
                    <div class="analytics-chart">
                        <p>Average touchpoints per contact: <strong>${(touchpoints.length / contacts.length).toFixed(1)}</strong></p>
                        <p>Most active day: <strong>${this.getMostActiveDay(touchpoints)}</strong></p>
                        <p>Response rate: <strong>${this.calculateResponseRate(touchpoints)}%</strong></p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = analyticsHTML;
    }

    renderStats() {
        const container = document.getElementById('touchpointsStats');
        if (!container) return;

        const touchpoints = DataManager.getTouchpoints();
        const thisWeek = touchpoints.filter(tp => this.isThisWeek(tp.date));
        const thisMonth = touchpoints.filter(tp => this.isThisMonth(tp.date));
        const avgPerWeek = thisMonth.length / 4;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value" style="color: #17a2b8;">${touchpoints.length}</div>
                <div class="stat-label">Total Touchpoints</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #28a745;">${thisWeek.length}</div>
                <div class="stat-label">This Week</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #ffc107;">${thisMonth.length}</div>
                <div class="stat-label">This Month</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #fd7e14;">${avgPerWeek.toFixed(1)}</div>
                <div class="stat-label">Avg Per Week</div>
            </div>
        `;
    }

    updateContactDropdowns() {
        const contacts = DataManager.getAllContacts();
        const filterContactSelect = document.getElementById('filterByContact');
        
        if (filterContactSelect) {
            filterContactSelect.innerHTML = '<option value="">All Contacts</option>';
            contacts.forEach(contact => {
                const option = document.createElement('option');
                option.value = contact.id;
                option.textContent = `${contact.name} (${contact.company})`;
                filterContactSelect.appendChild(option);
            });
        }
    }

    addTouchpoint() {
        const modalContent = `
            <form id="touchpointForm">
                <input type="hidden" id="touchpointId" name="id">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="touchpointSubject">Subject:</label>
                        <input type="text" id="touchpointSubject" name="subject" required 
                               style="width: 100%; padding: 8px; margin-top: 5px;" 
                               placeholder="e.g., Q4 Planning Call">
                    </div>
                    <div>
                        <label for="touchpointType">Type:</label>
                        <select id="touchpointType" name="type" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="meeting">Meeting</option>
                            <option value="call">Phone Call</option>
                            <option value="email">Email</option>
                            <option value="demo">Demo</option>
                            <option value="proposal">Proposal</option>
                            <option value="followup">Follow-up</option>
                            <option value="social">Social Event</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="touchpointContact">Contact:</label>
                        <select id="touchpointContact" name="contactId" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="">Select Contact</option>
                            ${this.getContactOptions()}
                        </select>
                    </div>
                    <div>
                        <label for="touchpointDate">Date:</label>
                        <input type="datetime-local" id="touchpointDate" name="date" required 
                               style="width: 100%; padding: 8px; margin-top: 5px;">
                    </div>
                    <div>
                        <label for="touchpointDuration">Duration (minutes):</label>
                        <input type="number" id="touchpointDuration" name="duration" 
                               style="width: 100%; padding: 8px; margin-top: 5px;" 
                               placeholder="30">
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label for="touchpointNotes">Notes:</label>
                    <textarea id="touchpointNotes" name="notes" 
                              style="width: 100%; padding: 8px; margin-top: 5px; height: 100px;" 
                              placeholder="Meeting notes, key discussion points, etc."></textarea>
                </div>

                <div style="margin-bottom: 20px;">
                    <label for="touchpointNextSteps">Next Steps:</label>
                    <textarea id="touchpointNextSteps" name="nextSteps" 
                              style="width: 100%; padding: 8px; margin-top: 5px; height: 60px;" 
                              placeholder="Follow-up actions, scheduled meetings, etc."></textarea>
                </div>

                <button type="submit" class="action-btn" style="background: #FF9900; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                    Save Touchpoint
                </button>
            </form>
        `;

        const modal = UIHelpers.createModal('touchpointModal', 'Log Touchpoint', modalContent);
        
        // Set default date to now
        setTimeout(() => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('touchpointDate').value = now.toISOString().slice(0, 16);
        }, 100);

        // Handle form submission
        document.getElementById('touchpointForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const touchpoint = Object.fromEntries(formData.entries());
            touchpoint.duration = parseInt(touchpoint.duration) || null;
            
            if (touchpoint.id) {
                DataManager.updateTouchpoint(touchpoint);
                UIHelpers.showNotification('Touchpoint updated successfully');
            } else {
                DataManager.addTouchpoint(touchpoint);
                UIHelpers.showNotification('Touchpoint logged successfully');
            }
            
            UIHelpers.closeModal('touchpointModal');
        });

        UIHelpers.showModal('touchpointModal');
    }

    getContactOptions() {
        const contacts = DataManager.getAllContacts();
        return contacts.map(contact => 
            `<option value="${contact.id}">${contact.name} (${contact.company})</option>`
        ).join('');
    }

    getFilteredTouchpoints() {
        const touchpoints = DataManager.getTouchpoints();
        const typeFilter = document.getElementById('filterByType')?.value || '';
        const contactFilter = document.getElementById('filterByContact')?.value || '';
        const dateRangeFilter = document.getElementById('filterByDateRange')?.value || '';
        
        return touchpoints.filter(touchpoint => {
            const matchesType = !typeFilter || touchpoint.type === typeFilter;
            const matchesContact = !contactFilter || touchpoint.contactId === contactFilter;
            const matchesDateRange = !dateRangeFilter || this.matchesDateRange(touchpoint.date, dateRangeFilter);
            return matchesType && matchesContact && matchesDateRange;
        });
    }

    applyFilters() {
        this.renderContent();
    }

    editTouchpoint(touchpointId) {
        const touchpoint = DataManager.getTouchpoints().find(tp => tp.id === touchpointId);
        if (!touchpoint) return;

        // Pre-populate the form with existing data
        this.addTouchpoint();
        setTimeout(() => {
            document.getElementById('touchpointId').value = touchpoint.id;
            document.getElementById('touchpointSubject').value = touchpoint.subject;
            document.getElementById('touchpointType').value = touchpoint.type;
            document.getElementById('touchpointContact').value = touchpoint.contactId;
            document.getElementById('touchpointDate').value = touchpoint.date.slice(0, 16);
            document.getElementById('touchpointDuration').value = touchpoint.duration || '';
            document.getElementById('touchpointNotes').value = touchpoint.notes || '';
            document.getElementById('touchpointNextSteps').value = touchpoint.nextSteps || '';
        }, 100);
    }

    deleteTouchpoint(touchpointId) {
        if (confirm('Are you sure you want to delete this touchpoint?')) {
            DataManager.deleteTouchpoint(touchpointId);
            UIHelpers.showNotification('Touchpoint deleted successfully');
        }
    }

    showDayTouchpoints(dateKey) {
        const touchpoints = DataManager.getTouchpoints().filter(tp => 
            tp.date.startsWith(dateKey)
        );
        
        if (touchpoints.length === 0) {
            UIHelpers.showNotification('No touchpoints on this date');
            return;
        }

        const dayContent = `
            <h3>Touchpoints for ${UIHelpers.formatDate(dateKey)}</h3>
            <div style="max-height: 400px; overflow-y: auto;">
                ${touchpoints.map(tp => {
                    const contact = DataManager.getContactById(tp.contactId);
                    return `
                        <div style="border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 10px 0;">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                                <strong>${tp.subject}</strong>
                                <span class="touchpoint-type type-${tp.type}">${tp.type}</span>
                            </div>
                            <p><strong>Contact:</strong> ${contact ? contact.name : 'Unknown'}</p>
                            <p><strong>Time:</strong> ${new Date(tp.date).toLocaleTimeString()}</p>
                            ${tp.duration ? `<p><strong>Duration:</strong> ${tp.duration} minutes</p>` : ''}
                            ${tp.notes ? `<p><strong>Notes:</strong> ${tp.notes}</p>` : ''}
                            <div style="margin-top: 10px;">
                                <button class="action-btn" onclick="touchpointsModule.editTouchpoint('${tp.id}'); UIHelpers.closeModal('dayTouchpointsModal');">Edit</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        const modal = UIHelpers.createModal('dayTouchpointsModal', 'Daily Touchpoints', dayContent);
        UIHelpers.showModal('dayTouchpointsModal');
    }

    exportTouchpoints() {
        const touchpoints = this.getFilteredTouchpoints();
        if (touchpoints.length === 0) {
            UIHelpers.showNotification('No touchpoints to export', 3000, 'warning');
            return;
        }
        
        let csv = 'Date,Type,Subject,Contact,Duration,Notes,Next Steps\n';
        touchpoints.forEach(tp => {
            const contact = DataManager.getContactById(tp.contactId);
            const contactName = contact ? contact.name : 'Unknown';
            csv += `"${tp.date}","${tp.type}","${tp.subject}","${contactName}","${tp.duration || ''}","${(tp.notes || '').replace(/"/g, '""')}","${(tp.nextSteps || '').replace(/"/g, '""')}"\n`;
        });
        
        this.downloadFile(csv, 'touchpoints_export.csv', 'text/csv');
    }

    showTouchpointReport() {
        const touchpoints = DataManager.getTouchpoints();
        const contacts = DataManager.getAllContacts();
        
        let report = 'Touchpoint Activity Report\n\n';
        report += `Total Touchpoints: ${touchpoints.length}\n`;
        report += `Active Contacts: ${contacts.length}\n`;
        report += `Average per Contact: ${(touchpoints.length / contacts.length).toFixed(1)}\n\n`;
        
        report += 'Touchpoint Types:\n';
        const types = {};
        touchpoints.forEach(tp => {
            types[tp.type] = (types[tp.type] || 0) + 1;
        });
        
        Object.entries(types).forEach(([type, count]) => {
            report += `  ${type}: ${count}\n`;
        });
        
        alert(report);
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        UIHelpers.showNotification(`${filename} downloaded successfully`);
    }

    // Helper functions
    getTouchpointIcon(type) {
        const icons = {
            meeting: '🤝',
            call: '📞',
            email: '📧',
            demo: '🖥️',
            proposal: '📋',
            followup: '🔄',
            social: '🎉',
            other: '💼'
        };
        return icons[type] || '💼';
    }

    getTouchpointIconClass(type) {
        return `type-${type}`;
    }

    matchesDateRange(date, range) {
        const touchpointDate = new Date(date);
        const today = new Date();
        
        switch(range) {
            case 'today':
                return touchpointDate.toDateString() === today.toDateString();
            case 'week':
                return this.isThisWeek(date);
            case 'month':
                return this.isThisMonth(date);
            case 'quarter':
                return this.isThisQuarter(date);
            default:
                return true;
        }
    }

    isThisWeek(date) {
        const touchpointDate = new Date(date);
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return touchpointDate >= startOfWeek && touchpointDate <= endOfWeek;
    }

    isThisMonth(date) {
        const touchpointDate = new Date(date);
        const today = new Date();
        return touchpointDate.getMonth() === today.getMonth() && 
               touchpointDate.getFullYear() === today.getFullYear();
    }

    isThisQuarter(date) {
        const touchpointDate = new Date(date);
        const today = new Date();
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const touchpointQuarter = Math.floor(touchpointDate.getMonth() / 3);
        return touchpointQuarter === currentQuarter && 
               touchpointDate.getFullYear() === today.getFullYear();
    }

    getMostActiveDay(touchpoints) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCount = {};
        
        touchpoints.forEach(tp => {
            const day = new Date(tp.date).getDay();
            dayCount[day] = (dayCount[day] || 0) + 1;
        });
        
        const mostActiveDay = Object.entries(dayCount).reduce((a, b) => 
            dayCount[a[0]] > dayCount[b[0]] ? a : b, [0, 0]
        );
        
        return days[mostActiveDay[0]];
    }

    calculateResponseRate(touchpoints) {
        // Simple calculation - assume follow-ups indicate responses
        const followUps = touchpoints.filter(tp => tp.type === 'followup').length;
        const outreach = touchpoints.filter(tp => ['email', 'call'].includes(tp.type)).length;
        return outreach > 0 ? Math.round((followUps / outreach) * 100) : 0;
    }

    // Event handler for data changes from other modules
    onEvent(eventType, data) {
        switch(eventType) {
            case 'touchpoint:added':
            case 'touchpoint:updated':
            case 'touchpoint:deleted':
                this.renderIfActive();
                break;
        }
    }
}

// Create global instance
const touchpointsModule = new TouchpointsModule();
