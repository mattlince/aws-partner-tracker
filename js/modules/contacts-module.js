// Contacts Module - Team and Contact Management
class ContactsModule {
    constructor() {
        this.currentFilter = { team: '', search: '' };
    }

    init() {
        console.log('Contacts module initialized');
        
        // Listen for data changes
        DataManager.on('contact:updated', () => this.renderIfActive());
        DataManager.on('contact:deleted', () => this.renderIfActive());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderAllTeams();
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
            <div class="contacts-container">
                <div class="controls-bar">
                    <div>
                        <button class="action-btn" onclick="contactsModule.addNewContact()">+ Add Individual</button>
                        <button class="action-btn" onclick="contactsModule.addNewTeam()">+ Add Team</button>
                        <button class="action-btn secondary" onclick="contactsModule.exportAllData()">Export All Data</button>
                    </div>
                    <div>
                        <input type="text" id="searchContacts" class="search-input" placeholder="Search contacts..." oninput="contactsModule.filterContacts()">
                        <select id="filterByTeam" class="search-input" onchange="contactsModule.filterContacts()" style="width: auto; margin-left: 10px;">
                            <option value="">All Teams</option>
                        </select>
                    </div>
                </div>
                <div id="teamsContainer">
                    <!-- Teams will be populated here -->
                </div>
            </div>

            <style>
                .controls-bar {
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
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
                    margin: 2px;
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
                .search-input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .team-section {
                    margin-bottom: 40px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 25px;
                }
                .team-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e9ecef;
                }
                .team-name {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #232F3E;
                }
                .team-stats {
                    display: flex;
                    gap: 20px;
                    font-size: 0.9em;
                    color: #666;
                    align-items: center;
                }
                .rep-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .rep-table th {
                    background: #232F3E;
                    color: white;
                    padding: 12px 8px;
                    text-align: left;
                    font-size: 0.85em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .rep-table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #eee;
                    font-size: 0.9em;
                }
                .rep-table tbody tr:hover {
                    background: #f8f9fa;
                }
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 20px;
                    font-size: 0.75em;
                    font-weight: bold;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .status-badge:hover { transform: scale(1.05); }
                .status-tier1 { background: #d4edda; color: #155724; }
                .status-tier2 { background: #fff3cd; color: #856404; }
                .status-tier3 { background: #f8d7da; color: #721c24; }
                .relationship-score {
                    display: inline-block;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 30px;
                    color: white;
                    font-weight: bold;
                    font-size: 0.8em;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .relationship-score:hover { transform: scale(1.1); }
                .score-5 { background: #28a745; }
                .score-4 { background: #17a2b8; }
                .score-3 { background: #ffc107; color: #000; }
                .score-2 { background: #fd7e14; }
                .score-1 { background: #dc3545; }
                .editable {
                    background: transparent;
                    border: 1px solid transparent;
                    padding: 2px 4px;
                    border-radius: 3px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .editable:hover {
                    background: #f8f9fa;
                    border-color: #ddd;
                }
                .editable:focus {
                    outline: none;
                    border-color: #FF9900;
                    background: white;
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Set up editable field handling
        document.addEventListener('blur', (e) => {
            if (e.target.classList.contains('editable')) {
                this.handleEditableUpdate(e.target);
            }
        }, true);

        // Update team dropdowns
        this.updateTeamDropdowns();
    }

    handleEditableUpdate(element) {
        const field = element.dataset.field;
        const contactId = element.dataset.contact;
        const teamId = element.dataset.team;
        const value = element.textContent.trim();
        
        if (contactId && teamId && field) {
            const updates = {};
            updates[field] = value;
            DataManager.updateContact(teamId, contactId, updates);
            UIHelpers.showNotification(`${field} updated`);
        }
    }

    updateTeamDropdowns() {
        const teams = DataManager.getTeams();
        const filterTeamSelect = document.getElementById('filterByTeam');
        
        if (filterTeamSelect) {
            filterTeamSelect.innerHTML = '<option value="">All Teams</option>';
            Object.keys(teams).forEach(teamId => {
                const option = document.createElement('option');
                option.value = teamId;
                option.textContent = teams[teamId].name;
                filterTeamSelect.appendChild(option);
            });
        }
    }

    addNewContact() {
        const modalContent = `
            <form id="contactForm">
                <input type="hidden" id="contactId" name="id">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="contactName">Name:</label>
                        <input type="text" id="contactName" name="name" required style="width: 100%; padding: 8px; margin-top: 5px;">
                    </div>
                    <div>
                        <label for="contactRole">Role:</label>
                        <select id="contactRole" name="role" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="AM">Account Manager (AM)</option>
                            <option value="PSM">Partner Solutions Manager (PSM)</option>
                            <option value="DM">District Manager (DM)</option>
                            <option value="PDM">Partner Development Manager (PDM)</option>
                            <option value="ISV">ISV Partner</option>
                        </select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="contactTeam">Team:</label>
                        <select id="contactTeam" name="team" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="">Select Team</option>
                            ${Object.keys(DataManager.getTeams()).map(teamId => 
                                `<option value="${teamId}">${DataManager.getTeams()[teamId].name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="contactGeo">Geography:</label>
                        <input type="text" id="contactGeo" name="geo" placeholder="e.g., HQ1, ATX, Remote" style="width: 100%; padding: 8px; margin-top: 5px;">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="contactTier">Tier Status:</label>
                        <select id="contactTier" name="tier" style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="tier3">Tier 3 - Prospect</option>
                            <option value="tier2">Tier 2 - Active Partner</option>
                            <option value="tier1">Tier 1 - Strategic Partner</option>
                        </select>
                    </div>
                    <div>
                        <label for="contactScore">Relationship Score:</label>
                        <select id="contactScore" name="relationshipScore" style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="1">1 - Cold/No Response</option>
                            <option value="2">2 - Initial Contact</option>
                            <option value="3">3 - Engaged</option>
                            <option value="4">4 - Strong Partnership</option>
                            <option value="5">5 - Strategic Alliance</option>
                        </select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="contactLastContact">Last Contact Date:</label>
                        <input type="date" id="contactLastContact" name="lastContact" style="width: 100%; padding: 8px; margin-top: 5px;">
                    </div>
                    <div>
                        <label for="contactPipeline">Pipeline Value:</label>
                        <input type="text" id="contactPipeline" name="pipeline" placeholder="$0" style="width: 100%; padding: 8px; margin-top: 5px;">
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <label for="contactNextSteps">Next Steps:</label>
                    <textarea id="contactNextSteps" name="nextSteps" placeholder="Initial outreach planned..." style="width: 100%; padding: 8px; margin-top: 5px; height: 80px;"></textarea>
                </div>
                <button type="submit" class="action-btn" style="background: #FF9900; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">Save Contact</button>
            </form>
        `;

        const modal = UIHelpers.createModal('contactModal', 'Add New Individual', modalContent);
        
        // Set default values
        const today = new Date().toISOString().split('T')[0];
        setTimeout(() => {
            document.getElementById('contactLastContact').value = today;
            document.getElementById('contactPipeline').value = '$0';
            document.getElementById('contactNextSteps').value = 'Initial outreach planned';
        }, 100);

        // Handle form submission
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const contact = Object.fromEntries(formData.entries());
            contact.relationshipScore = parseInt(contact.relationshipScore);
            
            DataManager.addContact(contact.team, contact);
            UIHelpers.closeModal('contactModal');
            UIHelpers.showNotification('Contact added successfully');
        });

        UIHelpers.showModal('contactModal');
    }

    addNewTeam() {
        // Simplified team addition for now
        const teamName = prompt('Team Name:');
        const teamId = prompt('Team ID (lowercase, hyphens only):');
        
        if (teamName && teamId) {
            const teams = DataManager.getTeams();
            teams[teamId] = {
                name: teamName,
                dm: 'TBD',
                psm: 'TBD'
            };
            DataManager.data.teams = teams;
            DataManager.saveToStorage();
            this.renderAllTeams();
            this.updateTeamDropdowns();
            UIHelpers.showNotification(`Team "${teamName}" created successfully`);
        }
    }

    renderAllTeams() {
        const container = document.getElementById('teamsContainer');
        if (!container) return;

        const teams = DataManager.getTeams();
        const contacts = DataManager.getContacts();
        
        container.innerHTML = '';
        
        Object.keys(teams).forEach(teamId => {
            const teamConfig = teams[teamId];
            const teamContacts = contacts[teamId] || [];
            
            const teamSection = this.renderTeamSection(teamId, teamConfig, teamContacts);
            container.appendChild(teamSection);
        });
    }

    renderTeamSection(teamId, teamConfig, teamContacts) {
        const engagedContacts = teamContacts.filter(c => c.relationshipScore > 2).length;
        const engagementRate = teamContacts.length > 0 ? Math.round((engagedContacts / teamContacts.length) * 100) : 0;
        
        const section = document.createElement('div');
        section.className = 'team-section';
        
        if (teamContacts.length === 0) {
            section.innerHTML = `
                <div class="team-header">
                    <div class="team-name">${teamConfig.name}</div>
                    <div class="team-stats">
                        <span>DM: ${teamConfig.dm}</span>
                        <span>PSM: ${teamConfig.psm}</span>
                        <span>0 members</span>
                        <button class="action-btn" onclick="contactsModule.addContactToTeam('${teamId}')">+ Add Member</button>
                    </div>
                </div>
                <p style="text-align: center; color: #666; padding: 20px;">No team members yet. Click "Add Member" to get started.</p>
            `;
        } else {
            section.innerHTML = `
                <div class="team-header">
                    <div class="team-name">${teamConfig.name}</div>
                    <div class="team-stats">
                        <span>DM: ${teamConfig.dm}</span>
                        <span>PSM: ${teamConfig.psm}</span>
                        <span>${teamContacts.length} members</span>
                        <span>Engagement: ${engagementRate}%</span>
                        <button class="action-btn" onclick="contactsModule.addContactToTeam('${teamId}')">+ Add Member</button>
                    </div>
                </div>
                <table class="rep-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Geo</th>
                            <th>Tier</th>
                            <th>Rel Score</th>
                            <th>Last Contact</th>
                            <th>Response</th>
                            <th>Pipeline</th>
                            <th>Next Steps</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teamContacts.map(contact => this.renderContactRow(contact, teamId)).join('')}
                    </tbody>
                </table>
            `;
        }
        
        return section;
    }

    renderContactRow(contact, teamId) {
        const responseStatus = contact.relationshipScore > 2 ? '✅ Yes' : '❌ No';
        
        return `
            <tr data-contact="${contact.id}" data-team="${teamId}">
                <td><strong>${contact.name}</strong></td>
                <td>${contact.role}</td>
                <td>${contact.geo}</td>
                <td><span class="status-badge status-${contact.tier}" onclick="contactsModule.toggleTier('${contact.id}', '${teamId}')">${contact.tier.charAt(0).toUpperCase() + contact.tier.slice(1)}</span></td>
                <td><span class="relationship-score score-${contact.relationshipScore}" onclick="contactsModule.changeScore('${contact.id}', '${teamId}')">${contact.relationshipScore}</span></td>
                <td class="editable" contenteditable="true" data-field="lastContact" data-contact="${contact.id}" data-team="${teamId}">${contact.lastContact}</td>
                <td>${responseStatus}</td>
                <td class="editable" contenteditable="true" data-field="pipeline" data-contact="${contact.id}" data-team="${teamId}">${contact.pipeline}</td>
                <td class="editable" contenteditable="true" data-field="nextSteps" data-contact="${contact.id}" data-team="${teamId}">${contact.nextSteps}</td>
                <td>
                    <button class="action-btn" onclick="contactsModule.editContact('${contact.id}', '${teamId}')">Edit</button>
                    <button class="action-btn danger" onclick="contactsModule.deleteContact('${contact.id}', '${teamId}')">Delete</button>
                </td>
            </tr>
        `;
    }

    addContactToTeam(teamId) {
        // Similar to addNewContact but pre-select the team
        this.addNewContact();
        setTimeout(() => {
            const teamSelect = document.getElementById('contactTeam');
            if (teamSelect) {
                teamSelect.value = teamId;
            }
        }, 100);
    }

    editContact(contactId, teamId) {
        const contact = DataManager.getContacts()[teamId]?.find(c => c.id === contactId);
        if (!contact) return;

        // Pre-populate the form with existing data
        this.addNewContact();
        setTimeout(() => {
            document.getElementById('contactId').value = contact.id;
            document.getElementById('contactName').value = contact.name;
            document.getElementById('contactRole').value = contact.role;
            document.getElementById('contactTeam').value = teamId;
            document.getElementById('contactGeo').value = contact.geo;
            document.getElementById('contactTier').value = contact.tier;
            document.getElementById('contactScore').value = contact.relationshipScore;
            document.getElementById('contactLastContact').value = contact.lastContact;
            document.getElementById('contactPipeline').value = contact.pipeline;
            document.getElementById('contactNextSteps').value = contact.nextSteps;
        }, 100);
    }

    deleteContact(contactId, teamId) {
        if (confirm('Are you sure you want to delete this contact?')) {
            DataManager.deleteContact(teamId, contactId);
            UIHelpers.showNotification('Contact deleted successfully');
        }
    }

    toggleTier(contactId, teamId) {
        const contact = DataManager.getContacts()[teamId]?.find(c => c.id === contactId);
        if (!contact) return;

        const tiers = ['tier1', 'tier2', 'tier3'];
        const currentIndex = tiers.indexOf(contact.tier);
        const nextIndex = (currentIndex + 1) % tiers.length;
        
        DataManager.updateContact(teamId, contactId, { tier: tiers[nextIndex] });
        UIHelpers.showNotification('Tier updated');
    }

    changeScore(contactId, teamId) {
        const contact = DataManager.getContacts()[teamId]?.find(c => c.id === contactId);
        if (!contact) return;

        let currentScore = parseInt(contact.relationshipScore);
        currentScore = currentScore >= 5 ? 1 : currentScore + 1;
        
        DataManager.updateContact(teamId, contactId, { relationshipScore: currentScore });
        UIHelpers.showNotification('Relationship score updated');
    }

    filterContacts() {
        const searchTerm = document.getElementById('searchContacts')?.value.toLowerCase() || '';
        const teamFilter = document.getElementById('filterByTeam')?.value || '';
        
        document.querySelectorAll('.team-section').forEach(section => {
            const teamHeader = section.querySelector('.team-name').textContent;
            const teams = DataManager.getTeams();
            const teamId = Object.keys(teams).find(id => teams[id].name === teamHeader);
            
            let showTeam = !teamFilter || teamFilter === teamId;
            let hasVisibleRows = false;
            
            const table = section.querySelector('.rep-table');
            if (table) {
                section.querySelectorAll('.rep-table tbody tr').forEach(row => {
                    const text = row.textContent.toLowerCase();
                    const matchesSearch = !searchTerm || text.includes(searchTerm);
                    
                    if (showTeam && matchesSearch) {
                        row.style.display = '';
                        hasVisibleRows = true;
                    } else {
                        row.style.display = 'none';
                    }
                });
            }
            
            section.style.display = (showTeam && (hasVisibleRows || !table)) ? '' : 'none';
        });
    }

    exportAllData() {
        const allData = {
            contacts: DataManager.getContacts(),
            teams: DataManager.getTeams(),
            exportDate: new Date().toISOString()
        };
        
        const jsonStr = JSON.stringify(allData, null, 2);
        this.downloadFile(jsonStr, 'aws_contacts_export.json', 'application/json');
    }

    downloadFile(content, filename, contentType) {
        const blob = ne
