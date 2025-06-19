// Relationships Module - Network Mapping and Influence Analysis (Fixed)
class RelationshipsModule {
    constructor() {
        this.currentView = 'matrix';
        this.selectedContact = null;
        this.networkData = null;
        this.influenceMap = {};
    }

    init() {
        console.log('Relationships module initialized');
        
        // Listen for data changes
        DataManager.on('contact:updated', () => this.refreshRelationshipData());
        DataManager.on('contact:deleted', () => this.refreshRelationshipData());
        DataManager.on('relationship:updated', () => this.refreshRelationshipData());
        DataManager.on('data:loaded', () => this.refreshRelationshipData());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderContent(); // Call renderContent directly, not refreshRelationshipData
    }

    renderIfActive() {
        // Only render if this is the active tab
        if (AppController.currentTab === 'relationships') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        return `
            <div class="relationships-container">
                <div class="relationships-header">
                    <div>
                        <h2>Relationship Matrix</h2>
                        <p>Map organizational networks, influence patterns, and relationship strength</p>
                    </div>
                    <div class="relationships-controls">
                        <button class="view-btn ${this.currentView === 'matrix' ? 'active' : ''}" onclick="relationshipsModule.switchView('matrix')">
                            🏢 Organization Matrix
                        </button>
                        <button class="view-btn ${this.currentView === 'network' ? 'active' : ''}" onclick="relationshipsModule.switchView('network')">
                            🕸️ Network Map
                        </button>
                        <button class="view-btn ${this.currentView === 'influence' ? 'active' : ''}" onclick="relationshipsModule.switchView('influence')">
                            ⭐ Influence Analysis
                        </button>
                        <button class="action-btn" onclick="relationshipsModule.addRelationship()">
                            + Add Relationship
                        </button>
                        <button class="action-btn secondary" onclick="relationshipsModule.showRelationshipReport()">
                            📊 Relationship Report
                        </button>
                    </div>
                </div>

                <div class="insights-bar">
                    <div class="insight-card">
                        <span class="insight-label">Key Decision Makers</span>
                        <span class="insight-value" id="keyDecisionMakers">-</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Influence Champions</span>
                        <span class="insight-value" id="influenceChampions">-</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Network Reach</span>
                        <span class="insight-value" id="networkReach">-</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Relationship Gaps</span>
                        <span class="insight-value" id="relationshipGaps">-</span>
                    </div>
                </div>

                <div id="relationshipsContent">
                    <!-- Content will be populated based on current view -->
                </div>

                <!-- Relationship Details Modal -->
                <div id="relationshipModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('relationshipModal')">&times;</span>
                        <div id="relationshipModalContent">
                            <!-- Modal content will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .relationships-container {
                    max-width: 100%;
                }
                .relationships-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .relationships-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }
                .relationships-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .relationships-controls {
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
                .insights-bar {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
                    font-size: 1.5em;
                    font-weight: bold;
                }
                .organization-matrix {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 20px;
                }
                .company-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                }
                .company-card:hover {
                    border-color: #FF9900;
                    transform: translateY(-2px);
                }
                .company-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #f8f9fa;
                }
                .company-name {
                    font-size: 1.3em;
                    font-weight: bold;
                    color: #232F3E;
                }
                .company-stats {
                    display: flex;
                    gap: 15px;
                    font-size: 0.9em;
                    color: #666;
                }
                .contact-node {
                    display: inline-block;
                    padding: 8px 12px;
                    background: #e3f2fd;
                    color: #1565c0;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin: 4px;
                    font-size: 0.9em;
                    border: 2px solid transparent;
                }
                .contact-node:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    border-color: #FF9900;
                }
                .network-map {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    min-height: 400px;
                    text-align: center;
                }
                .influence-analysis {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .influence-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }
                .influence-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .influence-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .influence-item:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }
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
            </style>
        `;
    }

    setupEventListeners() {
        // Event listeners will be set up through onclick handlers
        console.log('Relationships event listeners set up');
    }

    switchView(view) {
        this.currentView = view;
        this.renderContent();
    }

    renderContent() {
        const container = document.getElementById('relationshipsContent');
        if (!container) return;

        switch(this.currentView) {
            case 'matrix':
                this.renderOrganizationMatrix(container);
                break;
            case 'network':
                this.renderNetworkMap(container);
                break;
            case 'influence':
                this.renderInfluenceAnalysis(container);
                break;
        }

        this.updateInsights();
    }

    renderOrganizationMatrix(container) {
        const contacts = DataManager.getAllContacts ? DataManager.getAllContacts() : [];
        
        if (contacts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #666;">
                    <h3>No contacts available</h3>
                    <p>Add contacts to see the organization matrix</p>
                </div>
            `;
            return;
        }

        // Group contacts by company
        const companies = {};
        contacts.forEach(contact => {
            if (!companies[contact.company]) {
                companies[contact.company] = [];
            }
            companies[contact.company].push(contact);
        });

        const matrixHTML = Object.keys(companies).map(companyName => {
            const companyContacts = companies[companyName];
            const dealCount = DataManager.getDeals ? DataManager.getDeals().filter(deal => 
                companyContacts.some(contact => contact.id === deal.contactId)
            ).length : 0;
            
            return `
                <div class="company-card">
                    <div class="company-header">
                        <div class="company-name">${companyName}</div>
                        <div class="company-stats">
                            <span>${companyContacts.length} contacts</span>
                            <span>${dealCount} deals</span>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        ${companyContacts.map(contact => `
                            <div class="contact-node" onclick="relationshipsModule.selectContact('${contact.id}')" 
                                 title="${contact.name} - ${contact.title}">
                                ${contact.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="organization-matrix">
                ${matrixHTML}
            </div>
        `;
    }

    renderNetworkMap(container) {
        container.innerHTML = `
            <div class="network-map">
                <h3>Network Relationship Map</h3>
                <p style="color: #666; margin: 20px 0;">
                    Interactive network visualization will be available in a future update.
                    For now, use the Organization Matrix to view contact relationships.
                </p>
                <div style="background: #f8f9fa; padding: 40px; border-radius: 8px; margin-top: 20px;">
                    <strong>Coming Soon:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
                        <li>Interactive network visualization</li>
                        <li>Relationship strength indicators</li>
                        <li>Influence path mapping</li>
                        <li>Connection recommendations</li>
                    </ul>
                </div>
            </div>
        `;
    }

    renderInfluenceAnalysis(container) {
        const contacts = DataManager.getAllContacts ? DataManager.getAllContacts() : [];
        
        // Simple influence calculation based on title
        const influenceData = contacts.map(contact => ({
            ...contact,
            influenceScore: this.calculateSimpleInfluence(contact)
        })).sort((a, b) => b.influenceScore - a.influenceScore);

        const topInfluencers = influenceData.slice(0, 5);
        const keyDecisionMakers = influenceData.filter(c => c.influenceScore >= 8);

        container.innerHTML = `
            <div class="influence-analysis">
                <div class="influence-card">
                    <h3>Top Influencers</h3>
                    <div class="influence-list">
                        ${topInfluencers.map(contact => `
                            <div class="influence-item" onclick="relationshipsModule.selectContact('${contact.id}')">
                                <div>
                                    <strong>${contact.name}</strong><br>
                                    <small style="color: #666;">${contact.title} • ${contact.company}</small>
                                </div>
                                <div>
                                    <span style="font-weight: bold; color: ${this.getInfluenceColor(contact.influenceScore)};">
                                        ${contact.influenceScore}/10
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                        ${topInfluencers.length === 0 ? '<div style="color: #666; font-style: italic; padding: 20px; text-align: center;">No contacts available</div>' : ''}
                    </div>
                </div>
                
                <div class="influence-card">
                    <h3>Key Decision Makers</h3>
                    <div class="influence-list">
                        ${keyDecisionMakers.map(contact => `
                            <div class="influence-item" onclick="relationshipsModule.selectContact('${contact.id}')">
                                <div>
                                    <strong>${contact.name}</strong><br>
                                    <small style="color: #666;">${contact.title} • ${contact.company}</small>
                                </div>
                                <div>
                                    <span style="font-weight: bold; color: #28a745;">
                                        🎯 ${contact.influenceScore}/10
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                        ${keyDecisionMakers.length === 0 ? '<div style="color: #666; font-style: italic; padding: 20px; text-align: center;">No key decision makers identified</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    calculateSimpleInfluence(contact) {
        if (!contact.title) return 1;
        
        const title = contact.title.toLowerCase();
        
        // Simple title-based scoring
        if (title.includes('ceo') || title.includes('president')) return 10;
        if (title.includes('cto') || title.includes('cio')) return 9;
        if (title.includes('vp') || title.includes('vice president')) return 8;
        if (title.includes('director')) return 7;
        if (title.includes('manager')) return 5;
        if (title.includes('lead') || title.includes('senior')) return 4;
        
        return 3;
    }

    getInfluenceColor(score) {
        if (score >= 8) return '#28a745';
        if (score >= 6) return '#ffc107';
        if (score >= 4) return '#fd7e14';
        return '#dc3545';
    }

    updateInsights() {
        const contacts = DataManager.getAllContacts ? DataManager.getAllContacts() : [];
        
        // Calculate basic insights
        const keyDecisionMakers = contacts.filter(c => this.calculateSimpleInfluence(c) >= 8).length;
        const influenceChampions = contacts.filter(c => this.calculateSimpleInfluence(c) >= 7).length;
        const networkReach = contacts.length;
        const relationshipGaps = Math.max(0, keyDecisionMakers - influenceChampions);
        
        // Update display safely
        const keyDecisionMakersEl = document.getElementById('keyDecisionMakers');
        const influenceChampionsEl = document.getElementById('influenceChampions');
        const networkReachEl = document.getElementById('networkReach');
        const relationshipGapsEl = document.getElementById('relationshipGaps');
        
        if (keyDecisionMakersEl) keyDecisionMakersEl.textContent = keyDecisionMakers;
        if (influenceChampionsEl) influenceChampionsEl.textContent = influenceChampions;
        if (networkReachEl) networkReachEl.textContent = networkReach;
        if (relationshipGapsEl) relationshipGapsEl.textContent = relationshipGaps;
    }

    selectContact(contactId) {
        this.selectedContact = contactId;
        const contact = DataManager.getContactById ? DataManager.getContactById(contactId) : null;
        
        if (!contact) {
            UIHelpers.showNotification('Contact not found', 'error');
            return;
        }
        
        const modalContent = `
            <h3>${contact.name}</h3>
            <p><strong>${contact.title}</strong> at <strong>${contact.company}</strong></p>
            
            <div style="margin: 20px 0;">
                <h4>Influence Metrics</h4>
                <p>Influence Score: <strong>${this.calculateSimpleInfluence(contact)}/10</strong></p>
                <p>Position Level: <strong>${this.getPositionLevel(contact)}</strong></p>
            </div>
            
            <div style="margin: 20px 0;">
                <h4>Contact Information</h4>
                <p>Email: ${contact.email || 'Not provided'}</p>
                <p>Phone: ${contact.phone || 'Not provided'}</p>
                <p>Last Contact: ${contact.lastContact ? UIHelpers.formatDate(contact.lastContact) : 'Never'}</p>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="action-btn" onclick="relationshipsModule.addRelationshipFor('${contactId}')">
                    Add Relationship
                </button>
                <button class="action-btn secondary" onclick="UIHelpers.closeModal('relationshipModal');">
                    Close
                </button>
            </div>
        `;
        
        document.getElementById('relationshipModalContent').innerHTML = modalContent;
        UIHelpers.showModal('relationshipModal');
    }

    getPositionLevel(contact) {
        const score = this.calculateSimpleInfluence(contact);
        if (score >= 9) return 'C-Level Executive';
        if (score >= 7) return 'Senior Leadership';
        if (score >= 5) return 'Management';
        if (score >= 3) return 'Professional';
        return 'Individual Contributor';
    }

    addRelationship() {
        UIHelpers.showNotification('Relationship management coming soon!', 'info');
    }

    addRelationshipFor(contactId) {
        UIHelpers.showNotification('Relationship management coming soon!', 'info');
    }

    showRelationshipReport() {
        const contacts = DataManager.getAllContacts ? DataManager.getAllContacts() : [];
        
        let report = 'Relationship Matrix Report\n\n';
        report += `Network Overview:\n`;
        report += `• Total Contacts: ${contacts.length}\n`;
        report += `• Key Decision Makers: ${contacts.filter(c => this.calculateSimpleInfluence(c) >= 8).length}\n`;
        report += `• Influence Champions: ${contacts.filter(c => this.calculateSimpleInfluence(c) >= 7).length}\n\n`;
        
        const topInfluencers = contacts
            .map(contact => ({ ...contact, score: this.calculateSimpleInfluence(contact) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        
        report += `Top Influencers:\n`;
        topInfluencers.forEach((contact, index) => {
            report += `${index + 1}. ${contact.name} (${contact.company}) - Score: ${contact.score}/10\n`;
        });
        
        alert(report);
    }

    refreshRelationshipData() {
        // Clear cached data
        this.influenceMap = {};
        this.networkData = null;
        
        // Only refresh content if currently active - prevents infinite loop
        if (AppController.currentTab === 'relationships') {
            this.renderContent(); // Call renderContent directly, not renderIfActive
        }
    }

    // Event handler for data changes from other modules
    onEvent(eventType, data) {
        switch(eventType) {
            case 'relationship:updated':
            case 'contact:updated':
            case 'contact:deleted':
                this.refreshRelationshipData();
                break;
        }
    }
}

// Create global instance
const relationshipsModule = new RelationshipsModule();
console.log('✅ Relationships module loaded successfully');
