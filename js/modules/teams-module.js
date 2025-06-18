// Teams Module - Team Overview and Management
class TeamsModule {
    constructor() {
        this.currentView = 'overview';
        this.selectedTeam = null;
    }

    init() {
        console.log('Teams module initialized');
        
        // Listen for data changes
        DataManager.on('contact:updated', () => this.renderIfActive());
        DataManager.on('contact:deleted', () => this.renderIfActive());
        DataManager.on('deal:updated', () => this.renderIfActive());
        DataManager.on('deal:deleted', () => this.renderIfActive());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderTeamCards();
    }

    renderIfActive() {
        if (AppController.currentTab === 'teams') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        return `
            <div class="teams-container">
                <div class="teams-header">
                    <div>
                        <h2>Team Overview</h2>
                        <p>9 Teams • 51 Account Managers • $2.9M Annual Target</p>
                    </div>
                    <div class="teams-controls">
                        <button class="view-btn ${this.currentView === 'overview' ? 'active' : ''}" onclick="teamsModule.switchView('overview')">
                            Overview
                        </button>
                        <button class="view-btn ${this.currentView === 'performance' ? 'active' : ''}" onclick="teamsModule.switchView('performance')">
                            Performance
                        </button>
                        <button class="view-btn ${this.currentView === 'contacts' ? 'active' : ''}" onclick="teamsModule.switchView('contacts')">
                            All Contacts
                        </button>
                        <button class="action-btn" onclick="teamsModule.showTeamAnalytics()">
                            📊 Team Analytics
                        </button>
                    </div>
                </div>

                <div id="teamsContent">
                    <!-- Team content will be populated here -->
                </div>

                <div id="teamDetailsModal" class="modal" style="display: none;">
                    <div class="modal-content" style="max-width: 1000px;">
                        <span class="close" onclick="UIHelpers.closeModal('teamDetailsModal')">&times;</span>
                        <div id="teamDetailsContent">
                            <!-- Team details will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .teams-container {
                    max-width: 100%;
                }
                .teams-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .teams-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }
                .teams-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                    font-size: 1em;
                }
                .teams-controls {
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
                .teams-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .team-card {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    border: 2px solid transparent;
                }
                .team-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    border-color: #FF9900;
                }
                .team-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .team-name {
                    font-size: 1.3em;
                    font-weight: bold;
                    color: #232F3E;
                    margin: 0;
                }
                .team-metrics {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .metric {
                    text-align: center;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .metric-value {
                    font-size: 1.4em;
                    font-weight: bold;
                    margin-bottom: 2px;
                }
                .metric-label {
                    font-size: 0.8em;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .contacts-preview {
                    margin-top: 15px;
                }
                .contacts-preview h4 {
                    margin: 0 0 10px 0;
                    color: #232F3E;
                    font-size: 0.9em;
                }
                .contact-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .contact-chip {
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: 500;
                }
                .contact-chip.active {
                    background: #4caf50;
                    color: white;
                }
                .performance-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }
                .performance-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .performance-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .performance-chart {
                    height: 200px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    font-style: italic;
                }
                .contacts-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .contacts-table th {
                    background: #232F3E;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-size: 0.9em;
                }
                .contacts-table td {
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                }
                .contacts-table tbody tr:hover {
                    background: #f8f9fa;
                }
                .status-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 6px;
                }
                .status-active { background: #4caf50; }
                .status-inactive { background: #f44336; }
                .status-pending { background: #ff9800; }
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
                    margin: 2% auto;
                    padding: 30px;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
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
            </style>
        `;
    }

    setupEventListeners() {
        // Event listeners will be attached through onclick handlers
    }

    switchView(view) {
        this.currentView = view;
        const container = document.getElementById('content-area');
        if (container) {
            this.render(container);
        }
    }

    renderTeamCards() {
        const container = document.getElementById('teamsContent');
        if (!container) return;

        switch(this.currentView) {
            case 'overview':
                this.renderOverview(container);
                break;
            case 'performance':
                this.renderPerformance(container);
                break;
            case 'contacts':
                this.renderAllContacts(container);
                break;
        }
    }

    renderOverview(container) {
        const teams = DataManager.getTeams();
        const contacts = DataManager.getContacts();
        const deals = DataManager.getDeals();

        const teamCards = Object.keys(teams).map(teamId => {
            const team = teams[teamId];
            const teamContacts = contacts[teamId] || [];
            const teamDeals = deals.filter(deal => 
                teamContacts.some(contact => contact.id === deal.contactId)
            );

            const totalPipeline = teamDeals.reduce((sum, deal) => sum + deal.value, 0);
            const activeContacts = teamContacts.filter(contact => 
                contact.lastContact && this.daysSince(contact.lastContact) <= 30
            ).length;

            return `
                <div class="team-card" onclick="teamsModule.showTeamDetails('${teamId}')">
                    <div class="team-header">
                        <h3 class="team-name">${team.name}</h3>
                        <span style="background: ${team.color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">
                            ${team.region}
                        </span>
                    </div>
                    
                    <div class="team-metrics">
                        <div class="metric">
                            <div class="metric-value" style="color: #17a2b8;">${teamContacts.length}</div>
                            <div class="metric-label">Contacts</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" style="color: #28a745;">$${(totalPipeline / 1000).toFixed(0)}K</div>
                            <div class="metric-label">Pipeline</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" style="color: #ffc107;">${teamDeals.length}</div>
                            <div class="metric-label">Active Deals</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" style="color: #fd7e14;">${activeContacts}</div>
                            <div class="metric-label">Active</div>
                        </div>
                    </div>

                    <div class="contacts-preview">
                        <h4>Recent Contacts (${teamContacts.length} total)</h4>
                        <div class="contact-list">
                            ${teamContacts.slice(0, 6).map(contact => `
                                <span class="contact-chip ${this.isRecentContact(contact) ? 'active' : ''}">
                                    ${contact.name}
                                </span>
                            `).join('')}
                            ${teamContacts.length > 6 ? `<span class="contact-chip">+${teamContacts.length - 6} more</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="teams-grid">
                ${teamCards}
            </div>
        `;
    }

    renderPerformance(container) {
        const teams = DataManager.getTeams();
        const contacts = DataManager.getContacts();
        const deals = DataManager.getDeals();

        const performanceCards = Object.keys(teams).map(teamId => {
            const team = teams[teamId];
            const teamContacts = contacts[teamId] || [];
            const teamDeals = deals.filter(deal => 
                teamContacts.some(contact => contact.id === deal.contactId)
            );

            const totalValue = teamDeals.reduce((sum, deal) => sum + deal.value, 0);
            const avgDealSize = teamDeals.length > 0 ? totalValue / teamDeals.length : 0;
            const winRate = this.calculateWinRate(teamDeals);
            const engagementRate = this.calculateEngagementRate(teamContacts);

            return `
                <div class="performance-card">
                    <div class="performance-header">
                        <h3>${team.name}</h3>
                        <span style="background: ${team.color}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em;">
                            ${team.region}
                        </span>
                    </div>
                    
                    <div class="team-metrics">
                        <div class="metric">
                            <div class="metric-value" style="color: #28a745;">${winRate}%</div>
                            <div class="metric-label">Win Rate</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" style="color: #17a2b8;">$${(avgDealSize / 1000).toFixed(0)}K</div>
                            <div class="metric-label">Avg Deal Size</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" style="color: #ffc107;">${engagementRate}%</div>
                            <div class="metric-label">Engagement</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" style="color: #fd7e14;">${teamContacts.length}</div>
                            <div class="metric-label">Contacts</div>
                        </div>
                    </div>

                    <div class="performance-chart">
                        Performance trends chart would go here
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="performance-grid">
                ${performanceCards}
            </div>
        `;
    }

    renderAllContacts(container) {
        const teams = DataManager.getTeams();
        const contacts = DataManager.getContacts();
        const deals = DataManager.getDeals();

        let allContacts = [];
        Object.keys(contacts).forEach(teamId => {
            const teamContacts = contacts[teamId] || [];
            teamContacts.forEach(contact => {
                contact.teamName = teams[teamId]?.name || teamId;
                contact.teamColor = teams[teamId]?.color || '#666';
                allContacts.push(contact);
            });
        });

        // Sort by last contact date
        allContacts.sort((a, b) => {
            const dateA = a.lastContact ? new Date(a.lastContact) : new Date(0);
            const dateB = b.lastContact ? new Date(b.lastContact) : new Date(0);
            return dateB - dateA;
        });

        const contactRows = allContacts.map(contact => {
            const contactDeals = deals.filter(deal => deal.contactId === contact.id);
            const totalValue = contactDeals.reduce((sum, deal) => sum + deal.value, 0);
            const status = this.getContactStatus(contact);
            
            return `
                <tr onclick="contactsModule.editContact('${contact.id}')" style="cursor: pointer;">
                    <td>
                        <span class="status-indicator status-${status}"></span>
                        <strong>${contact.name}</strong>
                    </td>
                    <td>${contact.title}</td>
                    <td>${contact.company}</td>
                    <td>
                        <span style="background: ${contact.teamColor}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em;">
                            ${contact.teamName}
                        </span>
                    </td>
                    <td>${contact.lastContact ? UIHelpers.formatDate(contact.lastContact) : 'Never'}</td>
                    <td>${contactDeals.length}</td>
                    <td><strong>$${(totalValue / 1000).toFixed(0)}K</strong></td>
                    <td>
                        <button class="action-btn" onclick="event.stopPropagation(); contactsModule.editContact('${contact.id}')">Edit</button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <p><strong>${allContacts.length} total contacts</strong> across ${Object.keys(teams).length} teams</p>
            </div>
            <table class="contacts-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Title</th>
                        <th>Company</th>
                        <th>Team</th>
                        <th>Last Contact</th>
                        <th>Deals</th>
                        <th>Pipeline</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${contactRows}
                </tbody>
            </table>
        `;
    }

    showTeamDetails(teamId) {
        const teams = DataManager.getTeams();
        const contacts = DataManager.getContacts();
        const deals = DataManager.getDeals();
        
        const team = teams[teamId];
        const teamContacts = contacts[teamId] || [];
        const teamDeals = deals.filter(deal => 
            teamContacts.some(contact => contact.id === deal.contactId)
        );

        const totalPipeline = teamDeals.reduce((sum, deal) => sum + deal.value, 0);
        const weightedPipeline = teamDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);

        const detailsContent = `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #232F3E; margin-bottom: 10px;">${team.name}</h2>
                <p style="color: #666; font-size: 1.1em;">${team.region} • ${teamContacts.length} contacts • ${teamDeals.length} active deals</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="metric" style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
                    <div class="metric-value" style="color: #1565c0; font-size: 2em;">$${(totalPipeline / 1000).toFixed(0)}K</div>
                    <div class="metric-label">Total Pipeline</div>
                </div>
                <div class="metric" style="background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center;">
                    <div class="metric-value" style="color: #2e7d32; font-size: 2em;">$${(weightedPipeline / 1000).toFixed(0)}K</div>
                    <div class="metric-label">Weighted Pipeline</div>
                </div>
                <div class="metric" style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center;">
                    <div class="metric-value" style="color: #ef6c00; font-size: 2em;">${teamDeals.length}</div>
                    <div class="metric-label">Active Deals</div>
                </div>
                <div class="metric" style="background: #fce4ec; padding: 20px; border-radius: 8px; text-align: center;">
                    <div class="metric-value" style="color: #c2185b; font-size: 2em;">${this.calculateEngagementRate(teamContacts)}%</div>
                    <div class="metric-label">Engagement Rate</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <h3>Team Contacts (${teamContacts.length})</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${teamContacts.map(contact => `
                            <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="contactsModule.editContact('${contact.id}')">
                                <div>
                                    <strong>${contact.name}</strong><br>
                                    <small style="color: #666;">${contact.title} at ${contact.company}</small>
                                </div>
                                <div style="text-align: right;">
                                    <span class="status-indicator status-${this.getContactStatus(contact)}"></span>
                                    <small>${contact.lastContact ? UIHelpers.formatDate(contact.lastContact) : 'No contact'}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <h3>Active Deals (${teamDeals.length})</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${teamDeals.map(deal => {
                            const contact = teamContacts.find(c => c.id === deal.contactId);
                            return `
                                <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
                                    <div>
                                        <strong>${deal.name}</strong><br>
                                        <small style="color: #666;">${contact ? contact.name : 'Unknown Contact'}</small>
                                    </div>
                                    <div style="text-align: right;">
                                        <strong>$${(deal.value / 1000).toFixed(0)}K</strong><br>
                                        <small>${deal.probability}% • ${UIHelpers.formatDate(deal.closeDate)}</small>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('teamDetailsContent').innerHTML = detailsContent;
        UIHelpers.showModal('teamDetailsModal');
    }

    showTeamAnalytics() {
        const teams = DataManager.getTeams();
        const contacts = DataManager.getContacts();
        const deals = DataManager.getDeals();

        let analytics = 'Team Analytics Report\n\n';
        
        Object.keys(teams).forEach(teamId => {
            const team = teams[teamId];
            const teamContacts = contacts[teamId] || [];
            const teamDeals = deals.filter(deal => 
                teamContacts.some(contact => contact.id === deal.contactId)
            );
            
            const totalValue = teamDeals.reduce((sum, deal) => sum + deal.value, 0);
            const engagementRate = this.calculateEngagementRate(teamContacts);
            
            analytics += `${team.name} (${team.region}):\n`;
            analytics += `  • ${teamContacts.length} contacts\n`;
            analytics += `  • ${teamDeals.length} deals worth $${(totalValue/1000).toFixed(0)}K\n`;
            analytics += `  • ${engagementRate}% engagement rate\n\n`;
        });

        alert(analytics);
    }

    // Helper functions
    daysSince(date) {
        const today = new Date();
        const contactDate = new Date(date);
        const diffTime = today - contactDate;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    isRecentContact(contact) {
        if (!contact.lastContact) return false;
        return this.daysSince(contact.lastContact) <= 7;
    }

    getContactStatus(contact) {
        if (!contact.lastContact) return 'inactive';
        const days = this.daysSince(contact.lastContact);
        if (days <= 7) return 'active';
        if (days <= 30) return 'pending';
        return 'inactive';
    }

    calculateWinRate(deals) {
        const closedDeals = deals.filter(deal => ['deal-won', 'deal-lost'].includes(deal.stage));
        const wonDeals = deals.filter(deal => deal.stage === 'deal-won');
        return closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
    }

    calculateEngagementRate(contacts) {
        if (contacts.length === 0) return 0;
        const activeContacts = contacts.filter(contact => 
            contact.lastContact && this.daysSince(contact.lastContact) <= 30
        );
        return Math.round((activeContacts.length / contacts.length) * 100);
    }

    // Event handler for data changes from other modules
    onEvent(eventType, data) {
        switch(eventType) {
            case 'contact:updated':
            case 'contact:deleted':
            case 'deal:updated':
            case 'deal:deleted':
                this.renderIfActive();
                break;
        }
    }
}

// Create global instance
const teamsModule = new TeamsModule();
