// Contacts Management Module
class ContactsModule {
    constructor() {
        this.currentView = 'grid';
        this.searchTerm = '';
        this.selectedTeam = 'all';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
    }

    init() {
        console.log('Contacts module initialized');
        
        // Listen for data changes
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
                        <p>Manage your professional network • ${contacts.length} contacts • ${stats.teams} teams</p>
                    </div>
                    <div class="contacts-controls">
                        <button class="view-btn ${this.currentView === 'grid' ? 'active' : ''}" onclick="contactsModule.switchView('grid')">
                            📱 Grid View
                        </button>
                        <button class="view-btn ${this.currentView === 'table' ? 'active' : ''}" onclick="contactsModule.switchView('table')">
                            📋 Table View
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
                        <label>Sort:</label>
                        <select id="sortBy" onchange="contactsModule.updateSort(this.value)">
                            <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Name</option>
                            <option value="company" ${this.sortBy === 'company' ? 'selected' : ''}>Company</option>
                            <option value="title" ${this.sortBy === 'title' ? 'selected' : ''}>Title</option>
                            <option value="lastContact" ${this.sortBy === 'lastContact' ? 'selected' : ''}>Last Contact</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <button class="action-btn secondary" onclick="contactsModule.resetFilters()">Reset</button>
                    </div>
                </div>

                <div class="contacts-stats">
                    <div class="stat-card">
                        <span class="stat-label">Total Contacts</span>
                        <span class="stat-value">${stats.total}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">AWS Contacts</span>
                        <span class="stat-value">${stats.aws}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Recent Activity</span>
                        <span class="stat-value">${stats.recentActivity}</span>
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
            </div>

            <style>
                .contacts-container {
                    max-width: 100%;
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
                .contacts-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    color: white;
                }
                .stat-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .stat-label {
                    font-size: 0.9em;
                    opacity: 0.9;
                    margin-bottom: 5px;
                }
                .stat-value {
                    font-size: 1.4em;
                    font-weight: bold;
                }

                /* Grid View Styles */
                .contacts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
                .contact-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 15px;
                }
                .contact-action-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75em;
                    transition: all 0.3s ease;
                }
                .contact-action-btn:hover {
                    background: #e9ecef;
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
                }
                .contacts-table th {
                    background: #232F3E;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-size: 0.9em;
                    cursor: pointer;
                }
                .contacts-table th:hover {
                    background: #1a252f;
                }
                .contacts-table td {
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                    font-size: 0.9em;
                }
                .contacts-table tbody tr {
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                .contacts-table tbody tr:hover {
                    background: #f8f9fa;
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

    updateSort(sortBy) {
        this.sortBy = sortBy;
        this.renderContactsContent();
    }

    resetFilters() {
        this.searchTerm = '';
        this.selectedTeam = 'all';
        this.sortBy = 'name';
        
        document.getElementById('contactSearch').value = '';
        document.getElementById('teamFilter').value = 'all';
        document.getElementById('sortBy').value = 'name';
        
        this.renderContactsContent();
    }

    renderContactsContent() {
        const container = document.getElementById('contactsContent');
        if (!container) return;
        
        const contacts = this.getFilteredContacts();
        container.innerHTML = this.renderContactsContentHTML(contacts);
    }

    renderContactsContentHTML(contacts) {
        if (this.currentView === 'grid') {
            return this.renderGridView(contacts);
        } else {
            return this.renderTableView(contacts);
        }
    }

    renderGridView(contacts) {
        if (contacts.length === 0) {
            return `
                <div style="text-align: center; padding: 60px; color: #666;">
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
        const lastContactDate = contact.lastContact ? new Date(contact.lastContact).toLocaleDateString() : 'Never';
        
        return `
            <div class="contact-card" onclick="contactsModule.editContact('${contact.id}')">
                <div class="contact-header">
                    <div>
                        <h3 class="contact-name">${contact.name}</h3>
                        <div class="contact-title">${contact.title || 'No title'}</div>
                        <div class="contact-company">${contact.company || 'No company'}</div>
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
                    <div class="contact-detail">
                        <span>📅</span>
                        <span>Last contact: ${lastContactDate}</span>
                    </div>
                </div>
                <div class="contact-actions" onclick="event.stopPropagation()">
                    <button class="contact-action-btn" onclick="contactsModule.editContact('${contact.id}')">Edit</button>
                    <button class="contact-action-btn" onclick="contactsModule.deleteContact('${contact.id}')">Delete</button>
                    ${contact.email ? `<button class="contact-action-btn" onclick="window.open('mailto:${contact.email}')">Email</button>` : ''}
                </div>
            </div>
        `;
    }

    renderTableView(contacts) {
        if (contacts.length === 0) {
            return `
                <div class="contacts-table-container">
                    <div style="text-align: center; padding: 60px; color: #666;">
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
                            <th onclick="contactsModule.updateSort('title')">Title</th>
                            <th onclick="contactsModule.updateSort('company')">Company</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th onclick="contactsModule.updateSort('lastContact')">Last Contact</th>
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
        const lastContactDate = contact.lastContact ? new Date(contact.lastContact).toLocaleDateString() : 'Never';
        
        return `
            <tr onclick="contactsModule.editContact('${contact.id}')">
                <td style="font-weight: bold; color: #232F3E;">${contact.name}</td>
                <td>${contact.title || '-'}</td>
                <td style="color: #FF9900; font-weight: 500;">${contact.company || '-'}</td>
                <td>${contact.email || '-'}</td>
                <td>${contact.phone || '-'}</td>
                <td>${lastContactDate}</td>
                <td onclick="event.stopPropagation()">
                    <button class="contact-action-btn" onclick="contactsModule.editContact('${contact.id}')">Edit</button>
                    <button class="contact-action-btn" onclick="contactsModule.deleteContact('${contact.id}')">Delete</button>
                </td>
            </tr>
        `;
    }

    // Contact Management Methods
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
                
                <div class="form-group">
                    <label for="contactNotes">Notes</label>
                    <textarea id="contactNotes" name="notes" 
                              placeholder="Additional notes or context...">${contact ? contact.notes || '' : ''}</textarea>
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
            
            // Remove empty fields
            Object.keys(contactData).forEach(key => {
                if (!contactData[key]) {
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
                case 'title':
                    aValue = (a.title || '').toLowerCase();
                    bValue = (b.title || '').toLowerCase();
                    break;
                case 'lastContact':
                    aValue = new Date(a.lastContact || 0);
                    bValue = new Date(b.lastContact || 0);
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
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
        
        // Calculate recent activity (contacts contacted in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentActivity = contacts.filter(contact => 
            contact.lastContact && new Date(contact.lastContact) > thirtyDaysAgo
        ).length;
        
        const teams = new Set(contacts.map(contact => contact.team).filter(Boolean)).size;
        
        return { total, aws, recentActivity, teams };
    }

    exportContacts() {
        const contacts = this.getFilteredContacts();
        let csv = 'Name,Title,Company,Team,Email,Phone,Last Contact,Notes\n';
        
        contacts.forEach(contact => {
            const team = contact.team ? DataManager.getTeams()[contact.team]?.name || contact.team : '';
            const lastContact = contact.lastContact ? new Date(contact.lastContact).toLocaleDateString() : '';
            
            csv += `"${contact.name}","${contact.title || ''}","${contact.company || ''}","${team}","${contact.email || ''}","${contact.phone || ''}","${lastContact}","${contact.notes || ''}"\n`;
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
console.log('✅ Contacts module loaded successfully');
