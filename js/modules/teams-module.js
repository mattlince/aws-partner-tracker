// Enhanced Teams Module - Team Overview and Member Management
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
        DataManager.on('team:updated', () => this.renderIfActive());
        DataManager.on('team-member:added', () => this.renderIfActive());
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
        const teams = DataManager.getTeams();
        const teamMembers = DataManager.getTeamMembers() || {};
        const totalMembers = Object.values(teamMembers).reduce((sum, members) => sum + members.length, 0);

        return `
            <div class="teams-container">
                <div class="teams-header">
                    <div>
                        <h2>Team Overview</h2>
                        <p>${Object.keys(teams).length} Teams • ${totalMembers} Team Members • $2.9M Annual Target</p>
                    </div>
                    <div class="teams-controls">
                        <button class="view-btn ${this.currentView === 'overview' ? 'active' : ''}" onclick="teamsModule.switchView('overview')">
                            📊 Overview
                        </button>
                        <button class="view-btn ${this.currentView === 'members' ? 'active' : ''}" onclick="teamsModule.switchView('members')">
                            👥 Team Members
                        </button>
                        <button class="view-btn ${this.currentView === 'performance' ? 'active' : ''}" onclick="teamsModule.switchView('performance')">
                            📈 Performance
                        </button>
                        <button class="view-btn ${this.currentView === 'contacts' ? 'active' : ''}" onclick="teamsModule.switchView('contacts')">
                            📋 All Contacts
                        </button>
                        <div class="dropdown" style="position: relative; display: inline-block;">
                            <button class="action-btn dropdown-toggle" onclick="teamsModule.toggleDropdown()">
                                + Add ▼
                            </button>
                            <div id="addDropdown" class="dropdown-menu" style="display: none;">
                                <a href="#" onclick="teamsModule.addTeamMember()">👤 Add Team Member</a>
                                <a href="#" onclick="teamsModule.addFullTeam()">👥 Add Full Team</a>
                                <a href="#" onclick="teamsModule.createNewTeam()">🏢 Create New Team</a>
                            </div>
                        </div>
                        <button class="action-btn secondary" onclick="teamsModule.showTeamAnalytics()">
                            📊 Analytics
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

                <div id="teamMemberModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('teamMemberModal')">&times;</span>
                        <div id="teamMemberModalContent">
                            <!-- Team member form will be populated here -->
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
                .dropdown {
                    position: relative;
                    display: inline-block;
                }
                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    min-width: 180px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    border-radius: 8px;
                    z-index: 1000;
                    border: 1px solid #ddd;
                    overflow: hidden;
                }
                .dropdown-menu a {
                    display: block;
                    padding: 12px 16px;
                    text-decoration: none;
                    color: #232F3E;
                    transition: background 0.3s ease;
                }
                .dropdown-menu a:hover {
                    background: #f8f9fa;
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
                .team-members-preview {
                    margin-top: 15px;
                }
                .team-members-preview h4 {
                    margin: 0 0 10px 0;
                    color: #232F3E;
                    font-size: 0.9em;
                }
                .member-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .member-chip {
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .role-badge {
                    background: #FF9900;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 8px;
                    font-size: 0.7em;
                    font-weight: bold;
                }
                .members-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    margin-bottom: 20px;
                }
                .members-table th {
                    background: #232F3E;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-size: 0.9em;
                }
                .members-table td {
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                }
                .members-table tbody tr:hover {
                    background: #f8f9fa;
                }
                .team-section {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .team-section h3 {
                    margin: 0 0 15px 0;
                    color: #232F3E;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
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
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
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
                .bulk-add-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                .bulk-member-row {
                    display: grid;
                    grid-template-columns: 2fr 2fr 1.5fr 1fr auto;
                    gap: 10px;
                    align-items: end;
                    margin-bottom: 10px;
                    padding: 10px;
                    background: white;
                    border-radius: 6px;
                }
                .remove-member {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8em;
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.getElementById('addDropdown').style.display = 'none';
            }
        });
    }

    toggleDropdown() {
        const dropdown = document.getElementById('addDropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
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
            case 'members':
                this.renderTeamMembers(container);
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
        const teamMembers = DataManager.getTeamMembers() || {};

        const teamCards = Object.keys(teams).map(teamId => {
            const team = teams[teamId];
            const teamContacts = contacts[teamId] || [];
            const members = teamMembers[teamId] || [];
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
                            <div class="metric-value" style="color: #17a2b8;">${members.length}</div>
                            <div class="metric-label">Team Members</div>
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
                            <div class="metric-value" style="color: #fd7e14;">${teamContacts.length}</div>
                            <div class="metric-label">Contacts</div>
                        </div>
                    </div>

                    <div class="team-members-preview">
                        <h4>Team Members (${members.length})</h4>
                        <div class="member-list">
                            ${members.slice(0, 4).map(member => `
                                <span class="member-chip">
                                    <span class="role-badge">${member.role}</span>
                                    ${member.name}
                                </span>
                            `).join('')}
                            ${members.length > 4 ? `<span class="member-chip">+${members.length - 4} more</span>` : ''}
                        </div>
                    </div>

                    <div class="contacts-preview">
                        <h4>Recent Contacts (${teamContacts.length} total)</h4>
                        <div class="contact-list">
                            ${teamContacts.slice(0, 4).map(contact => `
                                <span class="contact-chip ${this.isRecentContact(contact) ? 'active' : ''}">
                                    ${contact.name}
                                </span>
                            `).join('')}
                            ${teamContacts.length > 4 ? `<span class="contact-chip">+${teamContacts.length - 4} more</span>` : ''}
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

    renderTeamMembers(container) {
        const teams = DataManager.getTeams();
        const teamMembers = DataManager.getTeamMembers() || {};

        const teamSections = Object.keys(teams).map(teamId => {
            const team = teams[teamId];
            const members = teamMembers[teamId] || [];
            
            const membersByRole = {
                'LoL': members.filter(m => m.role === 'LoL'),
                'DM': members.filter(m => m.role === 'DM'),
                'PSM': members.filter(m => m.role === 'PSM'),
                'AM': members.filter(m => m.role === 'AM')
            };

            return `
                <div class="team-section">
                    <h3>
                        <span style="color: ${team.color};">● ${team.name}</span>
                        <div>
                            <button class="action-btn" onclick="teamsModule.addTeamMemberToTeam('${teamId}')">
                                + Add Member
                            </button>
                            <button class="action-btn secondary" onclick="teamsModule.editTeam('${teamId}')">
                                Edit Team
                            </button>
                        </div>
                    </h3>
                    
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Start Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${members.length > 0 ? members.map(member => `
                                <tr>
                                    <td><strong>${member.name}</strong></td>
                                    <td><span class="role-badge">${member.role}</span></td>
                                    <td>${member.email || '-'}</td>
                                    <td>${member.phone || '-'}</td>
                                    <td>${member.startDate ? UIHelpers.formatDate(member.startDate) : '-'}</td>
                                    <td>
                                        <button class="action-btn" onclick="teamsModule.editTeamMember('${teamId}', '${member.id}')">Edit</button>
                                        <button class="action-btn danger" onclick="teamsModule.removeTeamMember('${teamId}', '${member.id}')">Remove</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="6" style="text-align: center; color: #666; font-style: italic; padding: 40px;">
                                        No team members added yet. Click "Add Member" to get started.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <strong>Team Composition:</strong>
                        LoL: ${membersByRole.LoL.length} • 
                        DM: ${membersByRole.DM.length} • 
                        PSM: ${membersByRole.PSM.length} • 
                        AM: ${membersByRole.AM.length}
                        <span style="margin-left: 20px; color: #666;">
                            Total: ${members.length} members
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = teamSections;
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
                    <td><strong>${(totalValue / 1000).toFixed(0)}K</strong></td>
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

    // Team member management methods
    addTeamMember() {
        this.showTeamMemberForm();
    }

    addTeamMemberToTeam(teamId) {
        this.showTeamMemberForm(teamId);
    }

    addFullTeam() {
        this.showFullTeamForm();
    }

    createNewTeam() {
        this.showNewTeamForm();
    }

    showTeamMemberForm(preselectedTeamId = null) {
        const teams = DataManager.getTeams();
        
        const modalContent = `
            <h3>Add Team Member</h3>
            <form id="teamMemberForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="memberName">Full Name:</label>
                        <input type="text" id="memberName" name="name" required placeholder="e.g., John Smith">
                    </div>
                    <div class="form-group">
                        <label for="memberRole">Role:</label>
                        <select id="memberRole" name="role" required>
                            <option value="">Select Role</option>
                            <option value="LoL">LoL - Leader of Leaders</option>
                            <option value="DM">DM - District Manager</option>
                            <option value="PSM">PSM - Partner Sales Manager</option>
                            <option value="AM">AM - Account Manager</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="memberTeam">Team:</label>
                        <select id="memberTeam" name="teamId" required>
                            <option value="">Select Team</option>
                            ${Object.keys(teams).map(teamId => `
                                <option value="${teamId}" ${preselectedTeamId === teamId ? 'selected' : ''}>
                                    ${teams[teamId].name} (${teams[teamId].region})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="memberStartDate">Start Date:</label>
                        <input type="date" id="memberStartDate" name="startDate">
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="memberEmail">Email:</label>
                        <input type="email" id="memberEmail" name="email" placeholder="john.smith@company.com">
                    </div>
                    <div class="form-group">
                        <label for="memberPhone">Phone:</label>
                        <input type="tel" id="memberPhone" name="phone" placeholder="+1-555-0123">
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="memberNotes">Notes:</label>
                    <textarea id="memberNotes" name="notes" placeholder="Additional information about this team member..."></textarea>
                </div>
                
                <button type="submit" class="action-btn">Add Team Member</button>
            </form>
        `;
        
        document.getElementById('teamMemberModalContent').innerHTML = modalContent;
        
        // Handle form submission
        document.getElementById('teamMemberForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const member = Object.fromEntries(formData.entries());
            
            DataManager.addTeamMember(member.teamId, member);
            UIHelpers.closeModal('teamMemberModal');
            UIHelpers.showNotification('Team member added successfully');
        });
        
        UIHelpers.showModal('teamMemberModal');
    }

    showFullTeamForm() {
        const teams = DataManager.getTeams();
        
        const modalContent = `
            <h3>Add Full Team</h3>
            <div style="margin-bottom: 20px;">
                <div class="form-group">
                    <label for="bulkTeamSelect">Select Team:</label>
                    <select id="bulkTeamSelect" required>
                        <option value="">Select Team</option>
                        ${Object.keys(teams).map(teamId => `
                            <option value="${teamId}">
                                ${teams[teamId].name} (${teams[teamId].region})
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="bulk-add-section">
                <h4>Team Members</h4>
                <p style="color: #666; margin-bottom: 15px;">Add multiple team members at once. You can add/remove rows as needed.</p>
                
                <div id="bulkMembersList">
                    <div class="bulk-member-row">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" class="member-name" placeholder="Full Name" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="member-email" placeholder="email@company.com">
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select class="member-role" required>
                                <option value="">Select</option>
                                <option value="LoL">LoL</option>
                                <option value="DM">DM</option>
                                <option value="PSM">PSM</option>
                                <option value="AM">AM</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" class="member-phone" placeholder="+1-555-0123">
                        </div>
                        <div>
                            <button type="button" class="remove-member" onclick="this.parentElement.parentElement.remove()">×</button>
                        </div>
                    </div>
                </div>
                
                <div style="margin: 15px 0;">
                    <button type="button" class="action-btn secondary" onclick="teamsModule.addBulkMemberRow()">
                        + Add Another Member
                    </button>
                </div>
                
                <button type="button" class="action-btn" onclick="teamsModule.saveBulkTeamMembers()">
                    Save All Team Members
                </button>
            </div>
        `;
        
        document.getElementById('teamMemberModalContent').innerHTML = modalContent;
        UIHelpers.showModal('teamMemberModal');
    }

    addBulkMemberRow() {
        const container = document.getElementById('bulkMembersList');
        const newRow = document.createElement('div');
        newRow.className = 'bulk-member-row';
        newRow.innerHTML = `
            <div class="form-group">
                <input type="text" class="member-name" placeholder="Full Name" required>
            </div>
            <div class="form-group">
                <input type="email" class="member-email" placeholder="email@company.com">
            </div>
            <div class="form-group">
                <select class="member-role" required>
                    <option value="">Select</option>
                    <option value="LoL">LoL</option>
                    <option value="DM">DM</option>
                    <option value="PSM">PSM</option>
                    <option value="AM">AM</option>
                </select>
            </div>
            <div class="form-group">
                <input type="tel" class="member-phone" placeholder="+1-555-0123">
            </div>
            <div>
                <button type="button" class="remove-member" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        container.appendChild(newRow);
    }

    saveBulkTeamMembers() {
        const teamId = document.getElementById('bulkTeamSelect').value;
        if (!teamId) {
            alert('Please select a team first');
            return;
        }
        
        const rows = document.querySelectorAll('.bulk-member-row');
        const members = [];
        
        rows.forEach(row => {
            const name = row.querySelector('.member-name').value;
            const email = row.querySelector('.member-email').value;
            const role = row.querySelector('.member-role').value;
            const phone = row.querySelector('.member-phone').value;
            
            if (name && role) {
                members.push({
                    name,
                    email,
                    role,
                    phone,
                    startDate: new Date().toISOString().split('T')[0]
                });
            }
        });
        
        if (members.length === 0) {
            alert('Please add at least one team member');
            return;
        }
        
        members.forEach(member => {
            DataManager.addTeamMember(teamId, member);
        });
        
        UIHelpers.closeModal('teamMemberModal');
        UIHelpers.showNotification(`${members.length} team members added successfully`);
    }

    showNewTeamForm() {
        const modalContent = `
            <h3>Create New Team</h3>
            <form id="newTeamForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="teamName">Team Name:</label>
                        <input type="text" id="teamName" name="name" required placeholder="e.g., Enterprise West">
                    </div>
                    <div class="form-group">
                        <label for="teamRegion">Region:</label>
                        <input type="text" id="teamRegion" name="region" required placeholder="e.g., Western US">
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="teamColor">Team Color:</label>
                        <select id="teamColor" name="color" required>
                            <option value="#1e88e5">Blue</option>
                            <option value="#43a047">Green</option>
                            <option value="#fb8c00">Orange</option>
                            <option value="#8e24aa">Purple</option>
                            <option value="#e53935">Red</option>
                            <option value="#00acc1">Teal</option>
                            <option value="#7cb342">Light Green</option>
                            <option value="#f4511e">Deep Orange</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="teamManager">Team Manager:</label>
                        <input type="text" id="teamManager" name="manager" placeholder="Manager Name">
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="teamDescription">Description:</label>
                    <textarea id="teamDescription" name="description" placeholder="Team description and objectives..."></textarea>
                </div>
                
                <button type="submit" class="action-btn">Create Team</button>
            </form>
        `;
        
        document.getElementById('teamMemberModalContent').innerHTML = modalContent;
        
        // Handle form submission
        document.getElementById('newTeamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const team = Object.fromEntries(formData.entries());
            
            DataManager.addTeam(team);
            UIHelpers.closeModal('teamMemberModal');
            UIHelpers.showNotification('Team created successfully');
        });
        
        UIHelpers.showModal('teamMemberModal');
    }

    editTeamMember(teamId, memberId) {
        const member = DataManager.getTeamMember(teamId, memberId);
        if (!member) return;
        
        // Pre-populate the form with existing data
        this.showTeamMemberForm(teamId);
        setTimeout(() => {
            document.getElementById('memberName').value = member.name;
            document.getElementById('memberRole').value = member.role;
            document.getElementById('memberTeam').value = teamId;
            document.getElementById('memberStartDate').value = member.startDate || '';
            document.getElementById('memberEmail').value = member.email || '';
            document.getElementById('memberPhone').value = member.phone || '';
            document.getElementById('memberNotes').value = member.notes || '';
            
            // Change form submission to update instead of add
            const form = document.getElementById('teamMemberForm');
            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedMember = Object.fromEntries(formData.entries());
                updatedMember.id = memberId;
                
                DataManager.updateTeamMember(teamId, updatedMember);
                UIHelpers.closeModal('teamMemberModal');
                UIHelpers.showNotification('Team member updated successfully');
            };
        }, 100);
    }

    removeTeamMember(teamId, memberId) {
        const member = DataManager.getTeamMember(teamId, memberId);
        if (member && confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
            DataManager.removeTeamMember(teamId, memberId);
            UIHelpers.showNotification('Team member removed successfully');
        }
    }

    showTeamDetails(teamId) {
        const teams = DataManager.getTeams();
        const contacts = DataManager.getContacts();
        const deals = DataManager.getDeals();
        const teamMembers = DataManager.getTeamMembers() || {};
        
        const team = teams[teamId];
        const teamContacts = contacts[teamId] || [];
        const members = teamMembers[teamId] || [];
        const teamDeals = deals.filter(deal => 
            teamContacts.some(contact => contact.id === deal.contactId)
        );

        const totalPipeline = teamDeals.reduce((sum, deal) => sum + deal.value, 0);
        const weightedPipeline = teamDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);

        const detailsContent = `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #232F3E; margin-bottom: 10px;">${team.name}</h2>
                <p style="color: #666; font-size: 1.1em;">${team.region} • ${members.length} team members • ${teamContacts.length} contacts • ${teamDeals.length} active deals</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="metric" style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
                    <div class="metric-value" style="color: #1565c0; font-size: 2em;">${(totalPipeline / 1000).toFixed(0)}K</div>
                    <div class="metric-label">Total Pipeline</div>
                </div>
                <div class="metric" style="background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center;">
                    <div class="metric-value" style="color: #2e7d32; font-size: 2em;">${(weightedPipeline / 1000).toFixed(0)}K</div>
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
                    <h3>Team Members (${members.length})</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${members.map(member => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                                <div>
                                    <strong>${member.name}</strong>
                                    <span class="role-badge" style="margin-left: 8px;">${member.role}</span><br>
                                    <small style="color: #666;">${member.email || 'No email'}</small>
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    <button class="action-btn" onclick="teamsModule.editTeamMember('${teamId}', '${member.id}'); UIHelpers.closeModal('teamDetailsModal');">Edit</button>
                                </div>
                            </div>
                        `).join('')}
                        ${members.length === 0 ? '<p style="color: #666; font-style: italic; padding: 20px; text-align: center;">No team members added yet</p>' : ''}
                    </div>
                </div>

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
            </div>
            
            <div style="margin-top: 30px; display: flex; gap: 10px;">
                <button class="action-btn" onclick="teamsModule.addTeamMemberToTeam('${teamId}'); UIHelpers.closeModal('teamDetailsModal');">
                    Add Team Member
                </button>
                <button class="action-btn secondary" onclick="contactsModule.addContactToTeam('${teamId}'); UIHelpers.closeModal('teamDetailsModal');">
                    Add Contact
                </button>
            </div>
        `;

        document.getElementById('teamDetailsContent').innerHTML = detailsContent;
        UIHelpers.showModal('teamDetailsModal');
    }

    showTeamAnalytics() {
        const teams = DataManager.getTeams();
        const contacts = DataManager.getContacts();
        const deals = DataManager.getDeals();
        const teamMembers = DataManager.getTeamMembers() || {};

        let analytics = 'Team Analytics Report\n\n';
        
        Object.keys(teams).forEach(teamId => {
            const team = teams[teamId];
            const teamContacts = contacts[teamId] || [];
            const members = teamMembers[teamId] || [];
            const teamDeals = deals.filter(deal => 
                teamContacts.some(contact => contact.id === deal.contactId)
            );
            
            const totalValue = teamDeals.reduce((sum, deal) => sum + deal.value, 0);
            const engagementRate = this.calculateEngagementRate(teamContacts);
            
            analytics += `${team.name} (${team.region}):\n`;
            analytics += `  • ${members.length} team members\n`;
            analytics += `  • ${teamContacts.length} contacts\n`;
            analytics += `  • ${teamDeals.length} deals worth ${(totalValue/1000).toFixed(0)}K\n`;
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
            case 'team-member:added':
            case 'team-member:updated':
            case 'team-member:removed':
                this.renderIfActive();
                break;
        }
    }
}

// Create global instance
const teamsModule = new TeamsModule();
