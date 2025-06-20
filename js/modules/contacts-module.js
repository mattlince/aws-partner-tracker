// Enhanced Contacts Module - Integrated with Centralized Touchpoint System
class ContactsModule {
    constructor() {
        this.currentView = 'grid';
        this.searchTerm = '';
        this.selectedTeam = 'all';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.filters = {
            lastContact: 'all', // all, recent, overdue, never
            relationship: 'all', // all, excellent, good, fair, poor
            engagement: 'all'    // all, high, medium, low
        };
    }

    init() {
        console.log('Enhanced Contacts module with touchpoint integration initialized');
        
        // 🎯 KEY INTEGRATION: Subscribe to centralized touchpoint events
        if (typeof window.subscribeTouchpoints === 'function') {
            window.subscribeTouchpoints('contactsModule', (eventType, data) => {
                console.log(`Contacts module received ${eventType}:`, data);
                
                switch(eventType) {
                    case 'touchpoint:logged':
                    case 'touchpoint:updated':
                    case 'touchpoint:deleted':
                        // Refresh the view if the touchpoint affects a contact we're displaying
                        if (data.contactId) {
                            this.renderIfActive();
                        }
                        break;
                }
            });
        }
        
        // Listen for data changes (existing code)
        DataManager.on('contact:updated', () => this.renderIfActive());
        DataManager.on('contact:deleted', () => this.renderIfActive());
        DataManager.on('contact:added', () => this.renderIfActive());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
    }

    renderIfActive() {
        if (AppController.currentTab === 'contacts') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        const contacts = this.getFilteredContacts();
        const stats = this.calculateStats(contacts);

        return `
            <div class="contacts-container">
                <div class="contacts-header">
                    <div>
                        <h2>👥 Contact Management</h2>
                        <p>Manage your professional network • ${contacts.length} contacts • ${stats.teams} teams • ${stats.totalTouchpoints} touchpoints</p>
                    </div>
                    <div class="contacts-controls">
                        <button class="view-btn ${this.currentView === 'grid' ? 'active' : ''}" onclick="contactsModule.switchView('grid')">
                            📱 Grid View
                        </button>
                        <button class="view-btn ${this.currentView === 'table' ? 'active' : ''}" onclick="contactsModule.switchView('table')">
                            📋 Table View
                        </button>
                        <button class="view-btn ${this.currentView === 'engagement' ? 'active' : ''}" onclick="contactsModule.switchView('engagement')">
                            📈 Engagement View
                        </button>
                        <button class="action-btn" onclick="contactsModule.showContactForm()">
                            + Add Contact
                        </button>
                        <button class="action-btn secondary" onclick="contactsModule.exportContacts()">
                            📥 Export
                        </button>
                    </div>
                </div>

                <div class="contacts-filters">
                    <div class="filter-group">
                        <label>Search:</label>
                        <input type="text" id="contactSearch" placeholder="Search contacts..." 
                               value="${this.searchTerm}" onkeyup="contactsModule.updateSearch(this.value)">
                    </div>
                    <div class="filter-group">
                        <label>Team:</label>
                        <select id="teamFilter" onchange="contactsModule.updateTeamFilter(this.value)">
                            <option value="all">All Teams</option>
                            ${this.getTeamOptions()}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Last Contact:</label>
                        <select id="lastContactFilter" onchange="contactsModule.updateFilter('lastContact', this.value)">
                            <option value="all" ${this.filters.lastContact === 'all' ? 'selected' : ''}>All Contacts</option>
                            <option value="recent" ${this.filters.lastContact === 'recent' ? 'selected' : ''}>Recent (7 days)</option>
                            <option value="overdue" ${this.filters.lastContact === 'overdue' ? 'selected' : ''}>Overdue (30+ days)</option>
                            <option value="never" ${this.filters.lastContact === 'never' ? 'selected' : ''}>Never Contacted</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Relationship:</label>
                        <select id="relationshipFilter" onchange="contactsModule.updateFilter('relationship', this.value)">
                            <option value="all" ${this.filters.relationship === 'all' ? 'selected' : ''}>All Levels</option>
                            <option value="excellent" ${this.filters.relationship === 'excellent' ? 'selected' : ''}>Excellent (9-10)</option>
                            <option value="good" ${this.filters.relationship === 'good' ? 'selected' : ''}>Good (7-8)</option>
                            <option value="fair" ${this.filters.relationship === 'fair' ? 'selected' : ''}>Fair (5-6)</option>
                            <option value="poor" ${this.filters.relationship === 'poor' ? 'selected' : ''}>Poor (1-4)</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Sort:</label>
                        <select id="sortBy" onchange="contactsModule.updateSort(this.value)">
                            <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Name</option>
                            <option value="company" ${this.sortBy === 'company' ? 'selected' : ''}>Company</option>
                            <option value="lastTouchpoint" ${this.sortBy === 'lastTouchpoint' ? 'selected' : ''}>Last Touchpoint</option>
                            <option value="touchpointCount" ${this.sortBy === 'touchpointCount' ? 'selected' : ''}>Engagement Level</option>
                            <option value="relationshipScore" ${this.sortBy === 'relationshipScore' ? 'selected' : ''}>Relationship Score</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <button class="action-btn secondary" onclick="contactsModule.resetFilters()">Reset</button>
                    </div>
                </div>

                <div class="contacts-insights">
                    <div class="insight-card">
                        <span class="insight-label">Total Contacts</span>
                        <span class="insight-value">${stats.total}</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Active This Week</span>
                        <span class="insight-value">${stats.activeThisWeek}</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Need Follow-up</span>
                        <span class="insight-value">${stats.needFollowUp}</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">High Engagement</span>
                        <span class="insight-value">${stats.highEngagement}</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Avg Relationship Score</span>
                        <span class="insight-value">${stats.avgRelationshipScore.toFixed(1)}/10</span>
                    </div>
                </div>

                <div id="contactsContent">
                    ${this.renderContactsContent(contacts)}
                </div>

                <!-- Contact Form Modal -->
                <div id="contactFormModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('contactFormModal')">&times;</span>
                        <div id="contactFormContent">
                            <!-- Contact form will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Touchpoint History Modal -->
                <div id="contactTouchpointModal" class="modal" style="display: none;">
                    <div class="modal-content large-modal">
                        <span class="close" onclick="UIHelpers.closeModal('contactTouchpointModal')">&times;</span>
                        <div id="contactTouchpointContent">
                            <!-- Touchpoint history will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .contacts-container {
                    max-width: 100%;
                    padding: 20px;
                }
                .contacts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .contacts-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }
                .contacts-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .contacts-controls {
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
                .action-btn.small {
                    padding: 4px 8px;
                    font-size: 0.8em;
                }
                .contacts-filters {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    padding: 15px 20px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .filter-group label {
                    font-weight: 500;
                    color: #232F3E;
                    font-size: 0.9em;
                }
                .filter-group input,
                .filter-group select {
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9em;
                    background: white;
                }
                .contacts-insights {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    color: white;
                }
                .insight-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .insight-label {
                    font-size: 0.9em;
                    opacity: 0.9;
                    margin-bottom: 5px;
                }
                .insight-value {
                    font-size: 1.4em;
                    font-weight: bold;
                }

                /* Grid View Styles */
                .contacts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                }
                .contact-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    border-left: 4px solid #FF9900;
                    position: relative;
                }
                .contact-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .contact-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                .contact-name {
                    font-size: 1.1em;
                    font-weight: bold;
                    color: #232F3E;
                    margin: 0 0 5px 0;
                }
                .contact-title {
                    color: #666;
                    font-size: 0.9em;
                    margin-bottom: 5px;
                }
                .contact-company {
                    color: #FF9900;
                    font-weight: 500;
                    font-size: 0.9em;
                }
                .contact-details {
                    margin-bottom: 15px;
                }
                .contact-detail {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 5px;
                    font-size: 0.9em;
                    color: #666;
                }
                .touchpoint-summary {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    font-size: 0.9em;
                }
                .touchpoint-quick-stats {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .relationship-score-display {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9em;
                }
                .score-circle {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    color: white;
                    font-weight: bold;
                    font-size: 0.8em;
                }
                .score-excellent { background: #28a745; }
                .score-good { background: #20c997; }
                .score-fair { background: #ffc107; color: #000; }
                .score-poor { background: #fd7e14; }
                .score-critical { background: #dc3545; }
                .touchpoint-indicator {
                    font-size: 0.85em;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .touchpoint-indicator:hover {
                    transform: scale(1.05);
                }
                .touchpoint-recent { background: #d4edda; color: #155724; }
                .touchpoint-moderate { background: #fff3cd; color: #856404; }
                .touchpoint-overdue { background: #f8d7da; color: #721c24; }
                .contact-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 15px;
                    flex-wrap: wrap;
                }
                .contact-action-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8em;
                    transition: all 0.3s ease;
                    flex: 1;
                    text-align: center;
                    min-width: 70px;
                }
                .contact-action-btn:hover {
                    background: #e9ecef;
                }
                .contact-action-btn.primary {
                    background: #28a745;
                    color: white;
                    border-color: #28a745;
                }
                .contact-action-btn.primary:hover {
                    background: #218838;
                }

                /* Table View Styles */
                .contacts-table-container {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    overflow-x: auto;
                }
                .contacts-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 800px;
                }
                .contacts-table th {
                    background: #232F3E;
                    color: white;
                    padding: 12px 8px;
                    text-align: left;
                    font-size: 0.9em;
                    cursor: pointer;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .contacts-table th:hover {
                    background: #1a252f;
                }
                .contacts-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #eee;
                    font-size: 0.9em;
                    vertical-align: middle;
                }
                .contacts-table tbody tr {
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                .contacts-table tbody tr:hover {
                    background: #f8f9fa;
                }
                .table-contact-name {
                    font-weight: bold;
                    color: #232F3E;
                }
                .table-touchpoint-cell {
                    min-width: 120px;
                }
                .table-actions-cell {
                    min-width: 140px;
                }

                /* Engagement View Styles */
                .engagement-view {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                }
                .engagement-section {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .engagement-section h3 {
                    margin: 0 0 15px 0;
                    color: #232F3E;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .engagement-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .engagement-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .engagement-item:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }

                /* Modal Styles */
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    backdrop-filter: blur(5px);
                }
                .modal-content {
                    background-color: white;
                    margin: 5% auto;
                    padding: 30px;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .modal-content.large-modal {
                    max-width: 900px;
                }
                .close {
                    color: #aaa;
                    float: right;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    position: absolute;
                    right: 20px;
                    top: 15px;
                }
                .close:hover { color: #000; }

                /* Form Styles */
                .contact-form {
                    display: grid;
                    gap: 20px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                }
                .form-group label {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #232F3E;
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .form-group textarea {
                    height: 80px;
                    resize: vertical;
                }
                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #FF9900;
                    box-shadow: 0 0 0 2px rgba(255, 153, 0, 0.2);
                }

                /* Empty state */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }
                .empty-state-icon {
                    font-size: 4em;
                    margin-bottom: 20px;
                    opacity: 0.5;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .contacts-container {
                        padding: 15px;
                    }
                    .contacts-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 20px;
                    }
                    .contacts-controls {
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    .contacts-filters {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 15px;
                        padding: 15px;
                    }
                    .filter-group {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 5px;
                    }
                    .contacts-insights {
                        grid-template-columns: repeat(2, 1fr);
                        padding: 15px;
                    }
                    .contacts-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    .contact-actions {
                        flex-direction: column;
                    }
                    .contact-action-btn {
                        min-width: auto;
                    }
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Event listeners will be set up through onclick handlers
    }

    switchView(view) {
        this.currentView = view;
        this.renderContactsContent();
    }

    updateSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.renderContactsContent();
    }

    updateTeamFilter(team) {
        this.selectedTeam = team;
        this.renderContactsContent();
    }

    updateFilter(filterType, value) {
        this.filters[filterType] = value;
        this.renderContactsContent();
    }

    updateSort(sortBy) {
        this.sortBy = sortBy;
        this.renderContactsContent();
    }

    resetFilters() {
        this.searchTerm = '';
        this.selectedTeam = 'all';
        this.sortBy = 'name';
        this.filters = {
            lastContact: 'all',
            relationship: 'all',
            engagement: 'all'
        };
        
        document.getElementById('contactSearch').value = '';
        document.getElementById('teamFilter').value = 'all';
        document.getElementById('sortBy').value = 'name';
        document.getElementById('lastContactFilter').value = 'all';
        document.getElementById('relationshipFilter').value = 'all';
        
        this.renderContactsContent();
    }

    renderContactsContent() {
        const container = document.getElementById('contactsContent');
        if (!container) return;
        
        const contacts = this.getFilteredContacts();
        container.innerHTML = this.renderContactsContentHTML(contacts);
    }

    renderContactsContentHTML(contacts) {
        switch(this.currentView) {
            case 'grid':
                return this.renderGridView(contacts);
            case 'table':
                return this.renderTableView(contacts);
            case 'engagement':
                return this.renderEngagementView(contacts);
            default:
                return this.renderGridView(contacts);
        }
    }

    renderGridView(contacts) {
        if (contacts.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No contacts found</h3>
                    <p>Try adjusting your filters or add a new contact to get started.</p>
                    <button class="action-btn" onclick="contactsModule.showContactForm()">+ Add First Contact</button>
                </div>
            `;
        }

        return `
            <div class="contacts-grid">
                ${contacts.map(contact => this.renderContactCard(contact)).join('')}
            </div>
        `;
    }

    renderContactCard(contact) {
        const touchpointStats = this.getTouchpointStats(contact.id);
        const relationshipScore = this.calculateRelationshipScore(contact);
        const lastTouchpointDisplay = this.getLastTouchpointDisplay(contact.id);
        
        return `
            <div class="contact-card" onclick="contactsModule.editContact('${contact.id}')">
                <div class="contact-header">
                    <div>
                        <h3 class="contact-name">${contact.name}</h3>
                        <div class="contact-title">${contact.title || 'No title'}</div>
                        <div class="contact-company">${contact.company || 'No company'}</div>
                    </div>
                    <div class="relationship-score-display">
                        <span class="score-circle ${this.getScoreClass(relationshipScore)}">${relationshipScore}</span>
                    </div>
                </div>
                
                <div class="contact-details">
                    ${contact.email ? `
                        <div class="contact-detail">
                            <span>📧</span>
                            <span>${contact.email}</span>
                        </div>
                    ` : ''}
                    ${contact.phone ? `
                        <div class="contact-detail">
                            <span>📞</span>
                            <span>${contact.phone}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="touchpoint-summary">
                    <div class="touchpoint-quick-stats">
                        <span><strong>${touchpointStats.total}</strong> touchpoints</span>
                        <span class="touchpoint-indicator ${lastTouchpointDisplay.class}" 
                              onclick="event.stopPropagation(); contactsModule.showTouchpointHistory('${contact.id}')"
                              title="Click to view touchpoint history">
                            ${lastTouchpointDisplay.text}
                        </span>
                    </div>
                    ${touchpointStats.thisWeek > 0 ? `
                        <div style="color: #28a745; font-size: 0.8em;">
                            📈 ${touchpointStats.thisWeek} touchpoint${touchpointStats.thisWeek !== 1 ? 's' : ''} this week
                        </div>
                    ` : ''}
                </div>
                
                <div class="contact-actions" onclick="event.stopPropagation()">
                    <button class="contact-action-btn primary" onclick="contactsModule.logTouchpoint('${contact.id}')">
                        📞 Log Contact
                    </button>
                    <button class="contact-action-btn" onclick="contactsModule.showTouchpointHistory('${contact.id}')">
                        📝 History
                    </button>
                    <button class="contact-action-btn" onclick="contactsModule.editContact('${contact.id}')">
                        ✏️ Edit
                    </button>
                    ${contact.email ? `<button class="contact-action-btn" onclick="window.open('mailto:${contact.email}')">📧 Email</button>` : ''}
                </div>
            </div>
        `;
    }

    renderTableView(contacts) {
        if (contacts.length === 0) {
            return `
                <div class="contacts-table-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <h3>No contacts found</h3>
                        <p>Try adjusting your filters or add a new contact to get started.</p>
                        <button class="action-btn" onclick="contactsModule.showContactForm()">+ Add First Contact</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="contacts-table-container">
                <table class="contacts-table">
                    <thead>
                        <tr>
                            <th onclick="contactsModule.updateSort('name')">Name</th>
                            <th onclick="contactsModule.updateSort('company')">Company</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th onclick="contactsModule.updateSort('relationshipScore')">Relationship</th>
                            <th onclick="contactsModule.updateSort('touchpointCount')">Touchpoints</th>
                            <th onclick="contactsModule.updateSort('lastTouchpoint')">Last Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contacts.map(contact => this.renderTableRow(contact)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderTableRow(contact) {
        const touchpointStats = this.getTouchpointStats(contact.id);
        const relationshipScore = this.calculateRelationshipScore(contact);
        const lastTouchpointDisplay = this.getLastTouchpointDisplay(contact.id);
        
        return `
            <tr onclick="contactsModule.editContact('${contact.id}')">
                <td>
                    <div class="table-contact-name">${contact.name}</div>
                    <div style="font-size: 0.8em; color: #666;">${contact.title || ''}</div>
                </td>
                <td style="color: #FF9900; font-weight: 500;">${contact.company || '-'}</td>
                <td>${contact.email || '-'}</td>
                <td>${contact.phone || '-'}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="score-circle ${this.getScoreClass(relationshipScore)}" style="width: 24px; height: 24px; line-height: 24px; font-size: 0.7em;">${relationshipScore}</span>
                        <span style="font-size: 0.8em;">/10</span>
                    </div>
                </td>
                <td class="table-touchpoint-cell">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <strong>${touchpointStats.total}</strong>
                        ${touchpointStats.thisWeek > 0 ? `<span style="color: #28a745; font-size: 0.8em;">(+${touchpointStats.thisWeek} this week)</span>` : ''}
                    </div>
                </td>
                <td>
                    <span class="touchpoint-indicator ${lastTouchpointDisplay.class}" 
                          onclick="event.stopPropagation(); contactsModule.showTouchpointHistory('${contact.id}')"
                          title="Click to view history">
                        ${lastTouchpointDisplay.text}
                    </span>
                </td>
                <td class="table-actions-cell" onclick="event.stopPropagation()">
                    <button class="action-btn small" onclick="contactsModule.logTouchpoint('${contact.id}')">📞 Log</button>
                    <button class="action-btn small secondary" onclick="contactsModule.showTouchpointHistory('${contact.id}')">📝 History</button>
                </td>
            </tr>
        `;
    }

    renderEngagementView(contacts) {
        const highEngagement = contacts.filter(c => this.getTouchpointStats(c.id).total >= 5 && this.calculateRelationshipScore(c) >= 7);
        const needsAttention = contacts.filter(c => this.daysSinceLastTouchpoint(c.id) > 30);
        const newContacts = contacts.filter(c => this.getTouchpointStats(c.id).total === 0);
        const recentlyActive = contacts.filter(c => this.getTouchpointStats(c.id).thisWeek > 0);

        return `
            <div class="engagement-view">
                <div class="engagement-section">
                    <h3>🔥 High Engagement (${highEngagement.length})</h3>
                    <div class="engagement-list">
                        ${highEngagement.slice(0, 10).map(contact => this.renderEngagementItem(contact)).join('')}
                        ${highEngagement.length === 0 ? '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">No highly engaged contacts yet</div>' : ''}
                    </div>
                </div>
                
                <div class="engagement-section">
                    <h3>⚠️ Needs Attention (${needsAttention.length})</h3>
                    <div class="engagement-list">
                        ${needsAttention.slice(0, 10).map(contact => this.renderEngagementItem(contact)).join('')}
                        ${needsAttention.length === 0 ? '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">All contacts are up to date!</div>' : ''}
                    </div>
                </div>
                
                <div class="engagement-section">
                    <h3>🆕 New Contacts (${newContacts.length})</h3>
                    <div class="engagement-list">
                        ${newContacts.slice(0, 10).map(contact => this.renderEngagementItem(contact)).join('')}
                        ${newContacts.length === 0 ? '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">No new contacts to reach out to</div>' : ''}
                    </div>
                </div>
                
                <div class="engagement-section">
                    <h3>📈 Recently Active (${recentlyActive.length})</h3>
                    <div class="engagement-list">
                        ${recentlyActive.slice(0, 10).map(contact => this.renderEngagementItem(contact)).join('')}
                        ${recentlyActive.length === 0 ? '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">No recent activity this week</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderEngagementItem(contact) {
        const relationshipScore = this.calculateRelationshipScore(contact);
        const touchpointStats = this.getTouchpointStats(contact.id);
        
        return `
            <div class="engagement-item" onclick="contactsModule.editContact('${contact.id}')">
                <div>
                    <div style="font-weight: bold; color: #232F3E;">${contact.name}</div>
                    <div style="font-size: 0.8em; color: #666;">${contact.company || 'No company'}</div>
                </div>
                <div style="text-align: right;">
                    <div class="relationship-score-display">
                        <span class="score-circle ${this.getScoreClass(relationshipScore)}" style="width: 24px; height: 24px; line-height: 24px; font-size: 0.7em;">${relationshipScore}</span>
                    </div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">${touchpointStats.total} touchpoints</div>
                </div>
            </div>
        `;
    }

    // ===============================
    // 🎯 TOUCHPOINT INTEGRATION METHODS
    // ===============================

    /**
     * 🎯 Log touchpoint using centralized system
     */
    async logTouchpoint(contactId) {
        const contact = DataManager.getContactById(contactId);
        if (!contact) return;

        // 🎯 KEY INTEGRATION: Use centralized touchpoint logging
        if (typeof window.logTouchpoint === 'function') {
            try {
                const touchpointData = {
                    contactId: contactId,
                    type: 'call', // Default type
                    outcome: 'neutral',
                    notes: '',
                    isImportant: this.calculateRelationshipScore(contact) >= 8 // High relationship contacts are important
                };

                // Let the centralized system handle the full touchpoint modal
                if (typeof touchpointTracker !== 'undefined' && touchpointTracker.showAddTouchpointModal) {
                    touchpointTracker.showAddTouchpointModal(touchpointData);
                } else {
                    // Fallback to direct API call
                    const result = await window.logTouchpoint(touchpointData, 'contactsModule');
                    if (result) {
                        UIHelpers.showNotification(`Touchpoint logged for ${contact.name}`, 'success');
                        this.renderContactsContent();
                    }
                }
            } catch (error) {
                console.error('Error logging touchpoint:', error);
                UIHelpers.showNotification('Failed to log touchpoint. Please try again.', 'error');
            }
        } else {
            UIHelpers.showNotification('Touchpoint system not available', 'error');
        }
    }

    /**
     * 🎯 Show touchpoint history for a contact
     */
    showTouchpointHistory(contactId) {
        const contact = DataManager.getContactById(contactId);
        if (!contact) return;

        // 🎯 KEY INTEGRATION: Get touchpoints from centralized system
        const touchpoints = typeof window.getRecentTouchpoints === 'function' ? 
            window.getRecentTouchpoints({ contactId: contactId }) : [];

        const stats = this.getTouchpointStats(contactId);

        const historyHTML = touchpoints.length > 0 ? touchpoints.map(tp => {
            const daysSince = Math.ceil((new Date() - new Date(tp.date)) / (1000 * 60 * 60 * 24));
            
            return `
                <div style="border-bottom: 1px solid #eee; padding: 15px 0; cursor: pointer;" onclick="touchpointTracker?.showTouchpointDetails?.('${tp.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>${this.getTypeLabel(tp.type)}</strong>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="color: #666; font-size: 0.9em;">
                                ${daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
                            </span>
                            <span class="outcome-badge outcome-${tp.outcome}" style="font-size: 0.8em;">${this.getOutcomeLabel(tp.outcome)}</span>
                        </div>
                    </div>
                    <div style="color: #232F3E; margin-bottom: 8px;">${tp.notes}</div>
                    ${tp.tags && tp.tags.length > 0 ? `
                        <div style="margin-top: 8px;">
                            ${tp.tags.map(tag => `<span style="background: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 12px; font-size: 0.8em; margin-right: 4px;">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${tp.relationshipScoreImpact ? `
                        <div style="margin-top: 8px; font-size: 0.9em; color: ${tp.relationshipScoreImpact > 0 ? '#28a745' : '#dc3545'};">
                            Relationship Impact: ${tp.relationshipScoreImpact > 0 ? '+' : ''}${tp.relationshipScoreImpact}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('') : '<div style="text-align: center; color: #666; padding: 40px;">No touchpoints recorded yet</div>';

        const modalContent = `
            <h3>Touchpoint History - ${contact.name}</h3>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #232F3E;">${stats.total}</div>
                        <div style="font-size: 0.9em; color: #666;">Total</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">${stats.thisWeek}</div>
                        <div style="font-size: 0.9em; color: #666;">This Week</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #17a2b8;">${stats.averageGap || 0}d</div>
                        <div style="font-size: 0.9em; color: #666;">Avg Gap</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #6f42c1;">${this.calculateRelationshipScore(contact)}/10</div>
                        <div style="font-size: 0.9em; color: #666;">Relationship</div>
                    </div>
                </div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                ${historyHTML}
            </div>
            
            <div style="margin-top: 20px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                <button class="action-btn" onclick="contactsModule.logTouchpoint('${contactId}'); UIHelpers.closeModal('contactTouchpointModal');">
                    + Log New Touchpoint
                </button>
                <button class="action-btn secondary" onclick="UIHelpers.closeModal('contactTouchpointModal');">
                    Close
                </button>
            </div>
        `;
        
        document.getElementById('contactTouchpointContent').innerHTML = modalContent;
        UIHelpers.showModal('contactTouchpointModal');
    }

    /**
     * 🎯 Get touchpoint statistics from centralized system
     */
    getTouchpointStats(contactId) {
        if (typeof window.getTouchpointStats === 'function') {
            return window.getTouchpointStats(contactId, null);
        } else {
            // Fallback to basic stats
            return {
                total: 0,
                thisWeek: 0,
                averageGap: 0,
                lastTouchpoint: null,
                relationshipTrend: 'stable'
            };
        }
    }

    /**
     * 🎯 Calculate relationship score using centralized data
     */
    calculateRelationshipScore(contact) {
        // Use centralized touchpoint stats for more accurate scoring
        const stats = this.getTouchpointStats(contact.id);
        
        let score = 5; // Base score
        
        // Use centralized touchpoint data for scoring
        const daysSince = stats.lastTouchpoint ? 
            Math.ceil((new Date() - new Date(stats.lastTouchpoint.date)) / (1000 * 60 * 60 * 24)) : 999;
        
        // Touchpoint recency scoring
        if (daysSince <= 7) score += 3;
        else if (daysSince <= 14) score += 2;
        else if (daysSince <= 30) score += 1;
        else if (daysSince <= 60) score -= 1;
        else if (daysSince <= 90) score -= 2;
        else score -= 3;
        
        // Touchpoint frequency scoring
        if (stats.total >= 10) score += 2;
        else if (stats.total >= 5) score += 1;
        
        // Recent activity bonus (this week)
        if (stats.thisWeek >= 2) score += 1;
        
        // Relationship trend impact
        if (stats.relationshipTrend === 'improving') score += 1;
        else if (stats.relationshipTrend === 'declining') score -= 1;
        
        // Apply tier multiplier if contact has importance level
        const tierMultiplier = {1: 1.2, 2: 1.1, 3: 1.0};
        const tier = contact.tier || 3;
        
        score = Math.round(score * tierMultiplier[tier]);
        return Math.max(1, Math.min(10, score));
    }

    /**
     * 🎯 Get days since last touchpoint using centralized data
     */
    daysSinceLastTouchpoint(contactId) {
        const stats = this.getTouchpointStats(contactId);
        if (stats.lastTouchpoint) {
            const today = new Date();
            const touchpointDate = new Date(stats.lastTouchpoint.date);
            const diffTime = today - touchpointDate;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 999;
    }

    getLastTouchpointDisplay(contactId) {
        const daysSince = this.daysSinceLastTouchpoint(contactId);
        
        if (daysSince <= 7) {
            return { class: 'touchpoint-recent', text: `${daysSince}d ago` };
        } else if (daysSince <= 30) {
            return { class: 'touchpoint-moderate', text: `${daysSince}d ago` };
        } else if (daysSince <= 999) {
            return { class: 'touchpoint-overdue', text: `${daysSince}d ago` };
        } else {
            return { class: 'touchpoint-overdue', text: 'Never' };
        }
    }

    getScoreClass(score) {
        if (score >= 9) return 'score-excellent';
        if (score >= 7) return 'score-good';
        if (score >= 5) return 'score-fair';
        if (score >= 3) return 'score-poor';
        return 'score-critical';
    }

    // Helper methods for touchpoint display
    getTypeLabel(type) {
        const labels = {
            'call': '📞 Call',
            'email': '📧 Email',
            'meeting': '🤝 Meeting',
            'text': '💬 Text',
            'event': '🎉 Event',
            'other': '📝 Other'
        };
        return labels[type] || '📝 Other';
    }

    getOutcomeLabel(outcome) {
        const labels = {
            'positive': '✅ Positive',
            'neutral': '➖ Neutral',
            'needs-follow-up': '⚠️ Follow-up',
            'negative': '❌ Negative'
        };
        return labels[outcome] || '➖ Neutral';
    }

    // ===============================
    // EXISTING CONTACT MANAGEMENT METHODS
    // ===============================

    showContactForm(contactId = null) {
        const contact = contactId ? DataManager.getContactById(contactId) : null;
        const teams = DataManager.getTeams();
        const isEdit = !!contact;
        
        const modalContent = `
            <h3>${isEdit ? 'Edit Contact' : 'Add New Contact'}</h3>
            <form id="contactForm" class="contact-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="contactName">Name *</label>
                        <input type="text" id="contactName" name="name" required 
                               value="${contact ? contact.name : ''}" 
                               placeholder="Enter full name">
                    </div>
                    <div class="form-group">
                        <label for="contactTitle">Title</label>
                        <input type="text" id="contactTitle" name="title" 
                               value="${contact ? contact.title || '' : ''}" 
                               placeholder="Job title">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="contactCompany">Company</label>
                        <input type="text" id="contactCompany" name="company" 
                               value="${contact ? contact.company || '' : ''}" 
                               placeholder="Company name">
                    </div>
                    <div class="form-group">
                        <label for="contactTeam">Team</label>
                        <select id="contactTeam" name="team">
                            <option value="">Select Team</option>
                            ${Object.keys(teams).map(teamId => `
                                <option value="${teamId}" ${contact && contact.team === teamId ? 'selected' : ''}>
                                    ${teams[teamId].name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="contactEmail">Email</label>
                        <input type="email" id="contactEmail" name="email" 
                               value="${contact ? contact.email || '' : ''}" 
                               placeholder="email@example.com">
                    </div>
                    <div class="form-group">
                        <label for="contactPhone">Phone</label>
                        <input type="tel" id="contactPhone" name="phone" 
                               value="${contact ? contact.phone || '' : ''}" 
                               placeholder="Phone number">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="contactTier">Importance Tier</label>
                        <select id="contactTier" name="tier">
                            <option value="3" ${!contact || contact.tier === 3 ? 'selected' : ''}>Tier 3 - Standard</option>
                            <option value="2" ${contact && contact.tier === 2 ? 'selected' : ''}>Tier 2 - Important</option>
                            <option value="1" ${contact && contact.tier === 1 ? 'selected' : ''}>Tier 1 - Strategic</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contactLocation">Location</label>
                        <input type="text" id="contactLocation" name="location" 
                               value="${contact ? contact.location || '' : ''}" 
                               placeholder="City, State/Country">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="contactNotes">Notes</label>
                    <textarea id="contactNotes" name="notes" 
                              placeholder="Additional information about this contact...">${contact ? contact.notes || '' : ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="action-btn">
                        ${isEdit ? 'Update Contact' : 'Create Contact'}
                    </button>
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('contactFormModal')">
                        Cancel
                    </button>
                    ${isEdit ? `
                        <button type="button" class="action-btn danger" onclick="contactsModule.deleteContact('${contact.id}')">
                            Delete Contact
                        </button>
                    ` : ''}
                </div>
            </form>
        `;
        
        document.getElementById('contactFormContent').innerHTML = modalContent;
        
        // Handle form submission
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const contactData = Object.fromEntries(formData.entries());
            
            // Convert tier to number
            contactData.tier = parseInt(contactData.tier);
            
            // Remove empty fields
            Object.keys(contactData).forEach(key => {
                if (!contactData[key] && contactData[key] !== 0) {
                    delete contactData[key];
                }
            });
            
            if (isEdit) {
                DataManager.updateContact({ ...contact, ...contactData });
                UIHelpers.showNotification('Contact updated successfully', 'success');
            } else {
                DataManager.addContact(contactData);
                UIHelpers.showNotification('Contact created successfully', 'success');
            }
            
            UIHelpers.closeModal('contactFormModal');
        });
        
        UIHelpers.showModal('contactFormModal');
    }

    editContact(contactId) {
        this.showContactForm(contactId);
    }

    deleteContact(contactId) {
        const contact = DataManager.getContactById(contactId);
        if (!contact) return;
        
        if (confirm(`Are you sure you want to delete "${contact.name}"? This action cannot be undone.`)) {
            DataManager.deleteContact(contactId);
            UIHelpers.closeModal('contactFormModal');
            UIHelpers.showNotification('Contact deleted successfully', 'success');
        }
    }

    // Data processing methods
    getFilteredContacts() {
        let contacts = DataManager.getAllContacts();
        
        // Apply search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            contacts = contacts.filter(contact => 
                contact.name.toLowerCase().includes(term) ||
                (contact.company && contact.company.toLowerCase().includes(term)) ||
                (contact.title && contact.title.toLowerCase().includes(term)) ||
                (contact.email && contact.email.toLowerCase().includes(term))
            );
        }
        
        // Apply team filter
        if (this.selectedTeam !== 'all') {
            contacts = contacts.filter(contact => contact.team === this.selectedTeam);
        }
        
        // Apply last contact filter
        if (this.filters.lastContact !== 'all') {
            contacts = contacts.filter(contact => {
                const daysSince = this.daysSinceLastTouchpoint(contact.id);
                switch(this.filters.lastContact) {
                    case 'recent': return daysSince <= 7;
                    case 'overdue': return daysSince > 30;
                    case 'never': return daysSince >= 999;
                    default: return true;
                }
            });
        }
        
        // Apply relationship filter
        if (this.filters.relationship !== 'all') {
            contacts = contacts.filter(contact => {
                const score = this.calculateRelationshipScore(contact);
                switch(this.filters.relationship) {
                    case 'excellent': return score >= 9;
                    case 'good': return score >= 7 && score < 9;
                    case 'fair': return score >= 5 && score < 7;
                    case 'poor': return score < 5;
                    default: return true;
                }
            });
        }
        
        // Apply sorting
        contacts.sort((a, b) => {
            let aValue, bValue;
            
            switch(this.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'company':
                    aValue = (a.company || '').toLowerCase();
                    bValue = (b.company || '').toLowerCase();
                    break;
                case 'lastTouchpoint':
                    aValue = this.daysSinceLastTouchpoint(a.id);
                    bValue = this.daysSinceLastTouchpoint(b.id);
                    break;
                case 'touchpointCount':
                    aValue = this.getTouchpointStats(a.id).total;
                    bValue = this.getTouchpointStats(b.id).total;
                    break;
                case 'relationshipScore':
                    aValue = this.calculateRelationshipScore(a);
                    bValue = this.calculateRelationshipScore(b);
                    break;
                default:
                    return 0;
            }
            
            if (this.sortBy === 'touchpointCount' || this.sortBy === 'relationshipScore') {
                // For these, higher is better, so reverse the sort
                if (aValue < bValue) return this.sortOrder === 'asc' ? 1 : -1;
                if (aValue > bValue) return this.sortOrder === 'asc' ? -1 : 1;
            } else {
                if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
                if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });
        
        return contacts;
    }

    getTeamOptions() {
        try {
            const teams = DataManager.getTeams();
            return Object.keys(teams).map(teamId => 
                `<option value="${teamId}">${teams[teamId].name}</option>`
            ).join('');
        } catch (error) {
            return '';
        }
    }

    calculateStats(contacts) {
        const total = contacts.length;
        const aws = contacts.filter(contact => 
            contact.company && contact.company.toLowerCase().includes('aws')
        ).length;
        
        // Calculate activity stats using centralized touchpoint data
        const activeThisWeek = contacts.filter(contact => 
            this.getTouchpointStats(contact.id).thisWeek > 0
        ).length;
        
        const needFollowUp = contacts.filter(contact => 
            this.daysSinceLastTouchpoint(contact.id) > 30
        ).length;
        
        const highEngagement = contacts.filter(contact => 
            this.getTouchpointStats(contact.id).total >= 5 && this.calculateRelationshipScore(contact) >= 7
        ).length;
        
        const totalTouchpoints = contacts.reduce((sum, contact) => 
            sum + this.getTouchpointStats(contact.id).total, 0
        );
        
        const avgRelationshipScore = contacts.length > 0 ? 
            contacts.reduce((sum, contact) => sum + this.calculateRelationshipScore(contact), 0) / contacts.length : 0;
        
        const teams = new Set(contacts.map(contact => contact.team).filter(Boolean)).size;
        
        return { 
            total, 
            aws, 
            activeThisWeek, 
            needFollowUp,
            highEngagement,
            totalTouchpoints,
            avgRelationshipScore,
            teams 
        };
    }

    exportContacts() {
        const contacts = this.getFilteredContacts();
        if (contacts.length === 0) {
            UIHelpers.showNotification('No contacts to export', 'warning');
            return;
        }
        
        let csv = 'Name,Title,Company,Team,Email,Phone,Location,Tier,Relationship Score,Total Touchpoints,Last Touchpoint,Notes\n';
        
        contacts.forEach(contact => {
            const team = contact.team ? DataManager.getTeams()[contact.team]?.name || contact.team : '';
            const relationshipScore = this.calculateRelationshipScore(contact);
            const touchpointStats = this.getTouchpointStats(contact.id);
            const lastTouchpoint = touchpointStats.lastTouchpoint ? 
                new Date(touchpointStats.lastTouchpoint.date).toLocaleDateString() : 'Never';
            
            csv += `"${contact.name}","${contact.title || ''}","${contact.company || ''}","${team}","${contact.email || ''}","${contact.phone || ''}","${contact.location || ''}","${contact.tier || 3}","${relationshipScore}","${touchpointStats.total}","${lastTouchpoint}","${contact.notes || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        UIHelpers.showNotification('Contacts exported successfully', 'success');
    }
}

// Create global instance
const contactsModule = new ContactsModule();
console.log('✅ Enhanced Contacts module with centralized touchpoint integration loaded successfully');
