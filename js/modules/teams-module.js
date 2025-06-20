// Enhanced Teams Module - Complete with GEO, Tier, Relationship Score, and Touchpoint Tracking
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
        DataManager.on('team-member:updated', () => this.renderIfActive());
        DataManager.on('team-member:removed', () => this.renderIfActive());
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
                                <hr style="margin: 5px 0; border: none; border-top: 1px solid #eee;">
                                <a href="#" onclick="teamsModule.bulkUpdateRoles()">🔄 Bulk Update Roles</a>
                                <a href="#" onclick="teamsModule.transferTeamMembers()">↔️ Transfer Members</a>
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

                <!-- Modals -->
                <div id="teamDetailsModal" class="modal" style="display: none;">
                    <div class="modal-content" style="max-width: 1000px;">
                        <span class="close" onclick="UIHelpers.closeModal('teamDetailsModal')">&times;</span>
                        <div id="teamDetailsContent"></div>
                    </div>
                </div>

                <div id="teamMemberModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('teamMemberModal')">&times;</span>
                        <div id="teamMemberModalContent"></div>
                    </div>
                </div>

                <div id="touchpointModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('touchpointModal')">&times;</span>
                        <div id="touchpointModalContent"></div>
                    </div>
                </div>
            </div>

            <style>
                .teams-container {
                    max-width: 100%;
                    padding: 20px;
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

                /* Team Cards for Overview */
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

                .geo-badge {
                    background: #28a745;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 8px;
                    font-size: 0.7em;
                    font-weight: bold;
                    cursor: pointer;
                    margin-left: 4px;
                }

                .geo-badge:hover {
                    background: #218838;
                }

                /* Team Members Table */
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
                    padding: 12px 8px;
                    text-align: left;
                    font-size: 0.85em;
                    font-weight: 600;
                }

                .members-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #eee;
                    vertical-align: middle;
                }

                .members-table tbody tr:hover {
                    background: #f8f9fa;
                }

                .name-email-cell {
                    min-width: 160px;
                }

                .name-email-cell .name {
                    font-weight: 600;
                    color: #232F3E;
                    margin-bottom: 2px;
                }

                .name-email-cell .email {
                    font-size: 0.8em;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .role-selector {
                    padding: 4px 6px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.8em;
                    width: 100%;
                    max-width: 80px;
                }

                .tier-indicator {
                    display: inline-block;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    color: white;
                    font-size: 0.8em;
                    font-weight: bold;
                    text-align: center;
                    line-height: 24px;
                    margin-right: 8px;
                }

                .tier-1 { background: #dc3545; }
                .tier-2 { background: #ffc107; color: #000; }
                .tier-3 { background: #28a745; }

                .relationship-score {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .score-bar {
                    flex: 1;
                    height: 8px;
                    background: #e9ecef;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .score-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                }

                .score-excellent { background: #28a745; }
                .score-good { background: #20c997; }
                .score-fair { background: #ffc107; }
                .score-poor { background: #fd7e14; }
                .score-critical { background: #dc3545; }

                .touchpoint-indicator {
                    font-size: 0.85em;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 500;
                }

                .touchpoint-recent { background: #d4edda; color: #155724; }
                .touchpoint-moderate { background: #fff3cd; color: #856404; }
                .touchpoint-overdue { background: #f8d7da; color: #721c24; }

                .action-icons {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }

                .icon-btn {
                    background: none;
                    border: none;
                    font-size: 1.1em;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.3s ease;
                }

                .icon-btn:hover {
                    background: #f8f9fa;
                }

                .icon-btn.touchpoint { color: #28a745; }
                .icon-btn.edit { color: #17a2b8; }
                .icon-btn.delete { color: #dc3545; }

                .copy-btn {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8em;
                    margin-left: 8px;
                    transition: all 0.3s ease;
                }

                .copy-btn:hover {
                    background: #5a6268;
                }

                .copy-btn.success {
                    background: #28a745;
                }

                /* Modals */
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
                    max-width: 600px;
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

                /* Responsive Design */
                @media (max-width: 768px) {
                    .teams-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .teams-controls {
                        justify-content: center;
                    }

                    .members-table {
                        font-size: 0.9em;
                    }

                    .members-table th,
                    .members-table td {
                        padding: 8px 6px;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                const dropdown = document.getElementById('addDropdown');
                if (dropdown) dropdown.style.display = 'none';
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
                                    ${member.geo ? `<span class="geo-badge">${member.geo}</span>` : ''}
                                </span>
                            `).join('')}
                            ${members.length > 4 ? `<span class="member-chip">+${members.length - 4} more</span>` : ''}
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

            return `
                <div class="team-section">
                    <h3>
                        <span style="color: ${team.color};">● ${team.name}</span>
                        <div>
                            <button class="action-btn" onclick="teamsModule.addTeamMemberToTeam('${teamId}')">
                                + Add Member
                            </button>
                            <button class="action-btn secondary" onclick="teamsModule.editTeam('${teamId}')">
                                ✏️ Edit Team
                            </button>
                        </div>
                    </h3>
                    
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th style="width: 200px;">Name & Email</th>
                                <th style="width: 80px;">Role</th>
                                <th style="width: 80px;">GEO</th>
                                <th style="width: 60px;">Tier</th>
                                <th style="width: 120px;">Relationship Score</th>
                                <th style="width: 120px;">Days Since Touchpoint</th>
                                <th style="width: 120px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${members.length > 0 ? members.map(member => {
                                const relationshipScore = this.calculateRelationshipScore(member);
                                const daysSinceContact = this.daysSinceLastTouchpoint(member);
                                const touchpointStatus = this.getTouchpointStatus(daysSinceContact);
                                
                                return `
                                    <tr>
                                        <td class="name-email-cell">
                                            <div class="name">${member.name}</div>
                                            <div class="email">
                                                ${member.email || 'No email'}
                                                ${member.email ? `<button class="copy-btn" onclick="teamsModule.copyToClipboard('${member.email}', this)" title="Copy email">📋</button>` : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <select class="role-selector" onchange="teamsModule.updateMemberRole('${teamId}', '${member.id}', this.value)">
                                                <option value="LoL" ${member.role === 'LoL' ? 'selected' : ''}>LoL</option>
                                                <option value="DM" ${member.role === 'DM' ? 'selected' : ''}>DM</option>
                                                <option value="PSM" ${member.role === 'PSM' ? 'selected' : ''}>PSM</option>
                                                <option value="AM" ${member.role === 'AM' ? 'selected' : ''}>AM</option>
                                                <option value="SA" ${member.role === 'SA' ? 'selected' : ''}>SA</option>
                                            </select>
                                        </td>
                                        <td>
                                            <span class="geo-badge" onclick="teamsModule.editGeo('${teamId}', '${member.id}')" title="Click to edit GEO">
                                                ${member.geo || 'Set GEO'}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="tier-indicator tier-${member.tier || 3}" title="Tier ${member.tier || 3}">
                                                T${member.tier || 3}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="relationship-score">
                                                <span style="font-weight: bold; font-size: 0.9em;">${relationshipScore}/10</span>
                                                <div class="score-bar">
                                                    <div class="score-fill ${this.getScoreClass(relationshipScore)}" style="width: ${relationshipScore * 10}%"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="touchpoint-indicator ${touchpointStatus.class}">
                                                ${touchpointStatus.text}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="action-icons">
                                                <button class="icon-btn touchpoint" onclick="teamsModule.logTouchpoint('${teamId}', '${member.id}')" title="Log Touchpoint">📞</button>
                                                <button class="icon-btn edit" onclick="teamsModule.editTeamMember('${teamId}', '${member.id}')" title="Edit">✏️</button>
                                                <button class="icon-btn delete" onclick="teamsModule.removeTeamMember('${teamId}', '${member.id}')" title="Remove">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr>
                                    <td colspan="7" style="text-align: center; color: #666; font-style: italic; padding: 40px;">
                                        No team members added yet. Click "Add Member" to get started.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <strong>Team Composition:</strong>
                        ${this.getTeamComposition(members)}
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
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">Performance view implementation needed</div>';
    }

    renderAllContacts(container) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">All contacts view implementation needed</div>';
    }

    // Helper methods for relationship scoring and touchpoint tracking
    calculateRelationshipScore(member) {
        let score = 5; // Base score
        
        // Tier weight (higher tier = higher importance, needs more attention)
        const tierMultiplier = {1: 1.2, 2: 1.1, 3: 1.0};
        const tier = member.tier || 3;
        
        // Touchpoint recency scoring
        const daysSince = this.daysSinceLastTouchpoint(member);
        if (daysSince <= 7) score += 3;
        else if (daysSince <= 14) score += 2;
        else if (daysSince <= 30) score += 1;
        else if (daysSince <= 60) score -= 1;
        else if (daysSince <= 90) score -= 2;
        else score -= 3;
        
        // Touchpoint frequency (if available)
        const touchpointCount = member.touchpointCount || 0;
        if (touchpointCount >= 10) score += 2;
        else if (touchpointCount >= 5) score += 1;
        
        // Apply tier multiplier and clamp between 1-10
        score = Math.round(score * tierMultiplier[tier]);
        return Math.max(1, Math.min(10, score));
    }

    daysSinceLastTouchpoint(member) {
        if (!member.lastTouchpoint) return 999; // No touchpoint recorded
        const today = new Date();
        const touchpointDate = new Date(member.lastTouchpoint);
        const diffTime = today - touchpointDate;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getTouchpointStatus(daysSince) {
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

    getTeamComposition(members) {
        const composition = { LoL: 0, DM: 0, PSM: 0, AM: 0, SA: 0 };
        members.forEach(member => {
            composition[member.role] = (composition[member.role] || 0) + 1;
        });
        return Object.entries(composition)
            .filter(([role, count]) => count > 0)
            .map(([role, count]) => `${role}: ${count}`)
            .join(' • ');
    }

    // Team member management methods
    updateMemberRole(teamId, memberId, newRole) {
        const member = DataManager.getTeamMember(teamId, memberId);
        if (member) {
            const oldRole = member.role;
            member.role = newRole;
            DataManager.updateTeamMember(teamId, member);
            
            UIHelpers.showNotification(`Role updated from ${oldRole} to ${newRole}`, 'success');
            this.renderTeamMembers(document.getElementById('teamsContent'));
        }
    }

    editGeo(teamId, memberId) {
        const member = DataManager.getTeamMember(teamId, memberId);
        if (!member) return;

        const newGeo = prompt(`Enter GEO for ${member.name}:`, member.geo || '');
        if (newGeo !== null) {
            member.geo = newGeo.trim();
            DataManager.updateTeamMember(teamId, member);
            UIHelpers.showNotification(`GEO updated to: ${newGeo}`, 'success');
            this.renderTeamMembers(document.getElementById('teamsContent'));
        }
    }

    logTouchpoint(teamId, memberId) {
        const member = DataManager.getTeamMember(teamId, memberId);
        if (!member) return;

        const modalContent = `
            <h3>Log Touchpoint - ${member.name}</h3>
            <form id="touchpointForm">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="touchpointDate">Date:</label>
                    <input type="date" id="touchpointDate" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="touchpointType">Type:</label>
                    <select id="touchpointType" name="type" required>
                        <option value="call">📞 Phone Call</option>
                        <option value="email">📧 Email</option>
                        <option value="meeting">🤝 Meeting</option>
                        <option value="text">💬 Text/Slack</option>
                        <option value="event">🎉 Event/Social</option>
                        <option value="other">📝 Other</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="touchpointOutcome">Outcome:</label>
                    <select id="touchpointOutcome" name="outcome" required>
                        <option value="positive">✅ Positive</option>
                        <option value="neutral">➖ Neutral</option>
                        <option value="needs-follow-up">⚠️ Needs Follow-up</option>
                        <option value="negative">❌ Negative</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="touchpointNotes">Notes:</label>
                    <textarea id="touchpointNotes" name="notes" placeholder="What was discussed? Next steps?" rows="4"></textarea>
                </div>
                
                <button type="submit" class="action-btn">Log Touchpoint</button>
            </form>
        `;

        document.getElementById('touchpointModalContent').innerHTML = modalContent;
        
        document.getElementById('touchpointForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const touchpoint = Object.fromEntries(formData.entries());
            
            // Update member's last touchpoint
            member.lastTouchpoint = touchpoint.date;
            member.touchpointCount = (member.touchpointCount || 0) + 1;
            
            // Store the touchpoint record
            if (!member.touchpoints) member.touchpoints = [];
            member.touchpoints.push({
                id: Date.now().toString(),
                date: touchpoint.date,
                type: touchpoint.type,
                outcome: touchpoint.outcome,
                notes: touchpoint.notes,
                timestamp: new Date().toISOString()
            });
            
            DataManager.updateTeamMember(teamId, member);
            UIHelpers.closeModal('touchpointModal');
            UIHelpers.showNotification(`Touchpoint logged for ${member.name}`, 'success');
            this.renderTeamMembers(document.getElementById('teamsContent'));
        });
        
        UIHelpers.showModal('touchpointModal');
    }

    async copyToClipboard(text, buttonElement) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                this.fallbackCopyToClipboard(text);
            }
            
            this.showCopySuccess(buttonElement, text);
            
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            UIHelpers.showNotification('Failed to copy email', 'error');
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            throw err;
        } finally {
            document.body.removeChild(textArea);
        }
    }

    showCopySuccess(buttonElement, email) {
        const originalText = buttonElement.innerHTML;
        const originalClass = buttonElement.className;
        
        buttonElement.innerHTML = '✅';
        buttonElement.classList.add('success');
        
        UIHelpers.showNotification(`Email copied: ${email}`, 'success');
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.className = originalClass;
        }, 1000);
    }

    // Team member form methods
    addTeamMember() {
        this.showTeamMemberForm();
    }

    addTeamMemberToTeam(teamId) {
        this.showTeamMemberForm(teamId);
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
                            <option value="SA">SA - Solution Architect</option>
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
                        <label for="memberGeo">GEO:</label>
                        <input type="text" id="memberGeo" name="geo" placeholder="e.g., West Coast, EMEA, APAC">
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="memberEmail">Email:</label>
                        <input type="email" id="memberEmail" name="email" placeholder="john.smith@company.com">
                    </div>
                    <div class="form-group">
                        <label for="memberTier">Tier:</label>
                        <select id="memberTier" name="tier" required>
                            <option value="3" selected>Tier 3 - Standard</option>
                            <option value="2">Tier 2 - Important</option>
                            <option value="1">Tier 1 - Strategic</option>
                        </select>
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
        
        document.getElementById('teamMemberForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const member = Object.fromEntries(formData.entries());
            member.tier = parseInt(member.tier);
            member.id = Date.now().toString();
            
            DataManager.addTeamMember(member.teamId, member);
            UIHelpers.closeModal('teamMemberModal');
            UIHelpers.showNotification('Team member added successfully');
            this.renderIfActive();
        });
        
        UIHelpers.showModal('teamMemberModal');
    }

    editTeamMember(teamId, memberId) {
        const member = DataManager.getTeamMember(teamId, memberId);
        if (!member) return;
        
        this.showTeamMemberForm(teamId);
        setTimeout(() => {
            document.getElementById('memberName').value = member.name;
            document.getElementById('memberRole').value = member.role;
            document.getElementById('memberTeam').value = teamId;
            document.getElementById('memberGeo').value = member.geo || '';
            document.getElementById('memberEmail').value = member.email || '';
            document.getElementById('memberTier').value = member.tier || 3;
            document.getElementById('memberNotes').value = member.notes || '';
            
            const form = document.getElementById('teamMemberForm');
            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedMember = Object.fromEntries(formData.entries());
                updatedMember.id = memberId;
                updatedMember.tier = parseInt(updatedMember.tier);
                
                DataManager.updateTeamMember(teamId, updatedMember);
                UIHelpers.closeModal('teamMemberModal');
                UIHelpers.showNotification('Team member updated successfully');
                this.renderIfActive();
            };
        }, 100);
    }

    removeTeamMember(teamId, memberId) {
        const member = DataManager.getTeamMember(teamId, memberId);
        if (member && confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
            DataManager.removeTeamMember(teamId, memberId);
            UIHelpers.showNotification('Team member removed successfully');
            this.renderIfActive();
        }
    }

    // Placeholder methods for future implementation
    addFullTeam() {
        UIHelpers.showNotification('Add Full Team feature coming soon');
    }

    createNewTeam() {
        UIHelpers.showNotification('Create New Team feature coming soon');
    }

    editTeam(teamId) {
        UIHelpers.showNotification('Edit Team feature coming soon');
    }

    bulkUpdateRoles() {
        UIHelpers.showNotification('Bulk Update Roles feature coming soon');
    }

    transferTeamMembers() {
        UIHelpers.showNotification('Transfer Team Members feature coming soon');
    }

    showTeamDetails(teamId) {
        UIHelpers.showNotification('Team Details feature coming soon');
    }

    showTeamAnalytics() {
        UIHelpers.showNotification('Team Analytics feature coming soon');
    }

    // Helper methods
    daysSince(date) {
        const today = new Date();
        const contactDate = new Date(date);
        const diffTime = today - contactDate;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

// Create global instance
const teamsModule = new TeamsModule();
console.log('✅ Enhanced Teams module with GEO, relationship scores, and touchpoint tracking loaded successfully');
