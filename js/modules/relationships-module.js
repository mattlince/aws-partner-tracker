// Relationships Module - Network Mapping and Influence Analysis
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
        DataManager.on('relationship:updated', () => this.renderIfActive());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.refreshRelationshipData();
        this.renderContent();
    }

    renderIfActive() {
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
                .org-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .org-level {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .contact-node {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    background: white;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    font-size: 0.9em;
                }
                .contact-node:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .contact-node.selected {
                    border-color: #FF9900;
                    background: #fff3cd;
                }
                .influence-high { border-left: 4px solid #28a745; }
                .influence-medium { border-left: 4px solid #ffc107; }
                .influence-low { border-left: 4px solid #dc3545; }
                .influence-unknown { border-left: 4px solid #6c757d; }
                .relationship-strength {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 6px;
                }
                .strength-strong { background: #28a745; }
                .strength-medium { background: #ffc107; }
                .strength-weak { background: #dc3545; }
                .strength-unknown { background: #6c757d; }
                .network-map {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    min-height: 500px;
                }
                .network-canvas {
                    width: 100%;
                    height: 500px;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(45deg, #f8f9fa 25%, transparent 25%), 
                                linear-gradient(-45deg, #f8f9fa 25%, transparent 25%);
                    background-size: 20px 20px;
                }
                .network-node {
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.8em;
                    text-align: center;
                    font-weight: bold;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                .network-node:hover {
                    transform: scale(1.1);
                    z-index: 10;
                }
                .network-connection {
                    position: absolute;
                    background: #666;
                    transform-origin: left;
                    opacity: 0.6;
                    z-index: 1;
                }
                .connection-strong {
                    height: 3px;
                    background: #28a745;
                    opacity: 0.8;
                }
                .connection-medium {
                    height: 2px;
                    background: #ffc107;
                    opacity: 0.6;
                }
                .connection-weak {
                    height: 1px;
                    background: #dc3545;
                    opacity: 0.4;
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
                .influence-score {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .score-bar {
                    width: 60px;
                    height: 6px;
                    background: #e9ecef;
                    border-radius: 3px;
                    overflow: hidden;
                }
                .score-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                }
                .score-high { background: #28a745; }
                .score-medium { background: #ffc107; }
                .score-low { background: #dc3545; }
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
                .relationship-form {
                    display: grid;
                    gap: 15px;
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
                .legend {
                    display: flex;
                    gap: 20px;
                    margin: 15px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    font-size: 0.9em;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
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
        const contacts = DataManager.getAllContacts();
        const relationships = DataManager.getRelationships() || [];
        
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
            const dealCount = DataManager.getDeals().filter(deal => 
                companyContacts.some(contact => contact.id === deal.contactId)
            ).length;
            
            // Organize contacts by hierarchy (simplified)
            const executives = companyContacts.filter(c => 
                ['CEO', 'CTO', 'CIO', 'VP', 'President', 'Director'].some(title => 
                    c.title.includes(title)
                )
            );
            const managers = companyContacts.filter(c => 
                ['Manager', 'Lead', 'Senior'].some(title => 
                    c.title.includes(title) && !executives.includes(c)
                )
            );
            const others = companyContacts.filter(c => 
                !executives.includes(c) && !managers.includes(c)
            );

            return `
                <div class="company-card">
                    <div class="company-header">
                        <div class="company-name">${companyName}</div>
                        <div class="company-stats">
                            <span>${companyContacts.length} contacts</span>
                            <span>${dealCount} deals</span>
                        </div>
                    </div>
                    <div class="org-chart">
                        ${executives.length > 0 ? `
                            <div class="org-level">
                                <strong style="width: 100%; margin-bottom: 5px; color: #232F3E;">Leadership</strong>
                                ${executives.map(contact => this.renderContactNode(contact, relationships)).join('')}
                            </div>
                        ` : ''}
                        ${managers.length > 0 ? `
                            <div class="org-level">
                                <strong style="width: 100%; margin-bottom: 5px; color: #666;">Management</strong>
                                ${managers.map(contact => this.renderContactNode(contact, relationships)).join('')}
                            </div>
                        ` : ''}
                        ${others.length > 0 ? `
                            <div class="org-level">
                                <strong style="width: 100%; margin-bottom: 5px; color: #999;">Team Members</strong>
                                ${others.map(contact => this.renderContactNode(contact, relationships)).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="legend">
                <div class="legend-item">
                    <span class="relationship-strength strength-strong"></span>
                    <span>Strong Relationship</span>
                </div>
                <div class="legend-item">
                    <span class="relationship-strength strength-medium"></span>
                    <span>Medium Relationship</span>
                </div>
                <div class="legend-item">
                    <span class="relationship-strength strength-weak"></span>
                    <span>Weak Relationship</span>
                </div>
                <div class="legend-item">
                    <span class="relationship-strength strength-unknown"></span>
                    <span>Unknown</span>
                </div>
            </div>
            <div class="organization-matrix">
                ${matrixHTML}
            </div>
        `;
    }

    renderContactNode(contact, relationships) {
        const influence = this.calculateInfluence(contact, relationships);
        const relationshipStrength = this.getRelationshipStrength(contact.id, relationships);
        
        return `
            <div class="contact-node influence-${influence}" 
                 onclick="relationshipsModule.selectContact('${contact.id}')"
                 title="${contact.name} - ${contact.title}">
                <span class="relationship-strength strength-${relationshipStrength}"></span>
                ${contact.name}
            </div>
        `;
    }

    renderNetworkMap(container) {
        const contacts = DataManager.getAllContacts();
        const relationships = DataManager.getRelationships() || [];
        
        if (contacts.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px; color: #666;"><h3>No contacts available</h3><p>Add contacts to see the network map</p></div>';
            return;
        }

        container.innerHTML = `
            <div class="network-map">
                <div style="margin-bottom: 15px; display: flex; justify-content: between; align-items: center;">
                    <h3>Network Relationship Map</h3>
                    <div style="font-size: 0.9em; color: #666;">
                        Click nodes to see relationships • Hover for details
                    </div>
                </div>
                <div class="network-canvas" id="networkCanvas">
                    <!-- Network visualization will be generated here -->
                </div>
            </div>
        `;

        setTimeout(() => this.generateNetworkVisualization(contacts, relationships), 100);
    }

    generateNetworkVisualization(contacts, relationships) {
        const canvas = document.getElementById('networkCanvas');
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        const centerX = canvasRect.width / 2;
        const centerY = canvasRect.height / 2;
        const radius = Math.min(centerX, centerY) - 80;

        // Clear existing content
        canvas.innerHTML = '';

        // Position nodes in a circle
        contacts.forEach((contact, index) => {
            const angle = (index / contacts.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle) - 40; // -40 for node width/2
            const y = centerY + radius * Math.sin(angle) - 40; // -40 for node height/2
            
            const influence = this.calculateInfluence(contact, relationships);
            const nodeColor = this.getNodeColor(influence);
            
            const node = document.createElement('div');
            node.className = 'network-node';
            node.style.left = x + 'px';
            node.style.top = y + 'px';
            node.style.background = nodeColor;
            node.innerHTML = contact.name.split(' ').map(n => n[0]).join('');
            node.title = `${contact.name}\n${contact.title}\n${contact.company}`;
            node.onclick = () => this.selectContact(contact.id);
            
            canvas.appendChild(node);
        });

        // Draw connections
        this.drawConnections(canvas, contacts, relationships);
    }

    drawConnections(canvas, contacts, relationships) {
        relationships.forEach(rel => {
            const contact1 = contacts.find(c => c.id === rel.contactId1);
            const contact2 = contacts.find(c => c.id === rel.contactId2);
            
            if (contact1 && contact2) {
                const node1 = Array.from(canvas.children).find(node => 
                    node.title.includes(contact1.name)
                );
                const node2 = Array.from(canvas.children).find(node => 
                    node.title.includes(contact2.name)
                );
                
                if (node1 && node2) {
                    this.drawConnection(canvas, node1, node2, rel.strength);
                }
            }
        });
    }

    drawConnection(canvas, node1, node2, strength) {
        const rect1 = node1.getBoundingClientRect();
        const rect2 = node2.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const x1 = rect1.left - canvasRect.left + rect1.width / 2;
        const y1 = rect1.top - canvasRect.top + rect1.height / 2;
        const x2 = rect2.left - canvasRect.left + rect2.width / 2;
        const y2 = rect2.top - canvasRect.top + rect2.height / 2;
        
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        const connection = document.createElement('div');
        connection.className = `network-connection connection-${strength}`;
        connection.style.left = x1 + 'px';
        connection.style.top = y1 + 'px';
        connection.style.width = length + 'px';
        connection.style.transform = `rotate(${angle}deg)`;
        
        canvas.appendChild(connection);
    }

    renderInfluenceAnalysis(container) {
        const contacts = DataManager.getAllContacts();
        const relationships = DataManager.getRelationships() || [];
        
        // Calculate influence scores
        const influenceData = contacts.map(contact => ({
            ...contact,
            influenceScore: this.calculateInfluenceScore(contact, relationships),
            networkSize: this.calculateNetworkSize(contact.id, relationships),
            decisionPower: this.calculateDecisionPower(contact)
        })).sort((a, b) => b.influenceScore - a.influenceScore);

        const topInfluencers = influenceData.slice(0, 10);
        const keyDecisionMakers = influenceData.filter(c => c.decisionPower > 7);

        container.innerHTML = `
            <div class="influence-analysis">
                <div class="influence-card">
                    <h3>Top Influencers</h3>
                    <div class="influence-list">
                        ${topInfluencers.map(contact => `
                            <div class="influence-item" onclick="relationshipsModule.selectContact('${contact.id}')">
                                <div>
                                    <strong>${contact.name}</strong><br>
                                    <small>${contact.title} • ${contact.company}</small>
                                </div>
                                <div class="influence-score">
                                    <span>${contact.influenceScore}/10</span>
                                    <div class="score-bar">
                                        <div class="score-fill ${this.getScoreClass(contact.influenceScore)}" 
                                             style="width: ${contact.influenceScore * 10}%;"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="influence-card">
                    <h3>Key Decision Makers</h3>
                    <div class="influence-list">
                        ${keyDecisionMakers.map(contact => `
                            <div class="influence-item" onclick="relationshipsModule.selectContact('${contact.id}')">
                                <div>
                                    <strong>${contact.name}</strong><br>
                                    <small>${contact.title} • ${contact.company}</small>
                                </div>
                                <div class="influence-score">
                                    <span>🎯 ${contact.decisionPower}/10</span>
                                    <div class="score-bar">
                                        <div class="score-fill score-high" 
                                             style="width: ${contact.decisionPower * 10}%;"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                <h3>Relationship Strategy Insights</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                    ${this.generateStrategicInsights(influenceData, relationships)}
                </div>
            </div>
        `;
    }

    // Helper methods for calculations
    calculateInfluence(contact, relationships) {
        const score = this.calculateInfluenceScore(contact, relationships);
        if (score >= 7) return 'high';
        if (score >= 4) return 'medium';
        if (score >= 1) return 'low';
        return 'unknown';
    }

    calculateInfluenceScore(contact, relationships) {
        let score = 0;
        
        // Title-based influence
        const titleWeight = {
            'CEO': 10, 'CTO': 9, 'CIO': 9, 'President': 9,
            'VP': 8, 'Vice President': 8,
            'Director': 7, 'Principal': 7,
            'Manager': 5, 'Lead': 4, 'Senior': 3
        };
        
        Object.keys(titleWeight).forEach(title => {
            if (contact.title.includes(title)) {
                score = Math.max(score, titleWeight[title]);
            }
        });
        
        // Network connections
        const connections = relationships.filter(rel => 
            rel.contactId1 === contact.id || rel.contactId2 === contact.id
        );
        score += connections.length * 0.5;
        
        // Strong relationships bonus
        const strongConnections = connections.filter(rel => rel.strength === 'strong');
        score += strongConnections.length * 1;
        
        return Math.min(score, 10);
    }

    calculateNetworkSize(contactId, relationships) {
        return relationships.filter(rel => 
            rel.contactId1 === contactId || rel.contactId2 === contactId
        ).length;
    }

    calculateDecisionPower(contact) {
        const decisionTitles = ['CEO', 'CTO', 'CIO', 'President', 'VP', 'Director'];
        for (let title of decisionTitles) {
            if (contact.title.includes(title)) {
                return decisionTitles.indexOf(title) === 0 ? 10 : 10 - decisionTitles.indexOf(title);
            }
        }
        return 3;
    }

    getRelationshipStrength(contactId, relationships) {
        // Find strongest relationship for this contact
        const contactRels = relationships.filter(rel => 
            rel.contactId1 === contactId || rel.contactId2 === contactId
        );
        
        if (contactRels.length === 0) return 'unknown';
        
        const strengths = contactRels.map(rel => rel.strength);
        if (strengths.includes('strong')) return 'strong';
        if (strengths.includes('medium')) return 'medium';
        if (strengths.includes('weak')) return 'weak';
        return 'unknown';
    }

    getNodeColor(influence) {
        const colors = {
            'high': '#28a745',
            'medium': '#ffc107', 
            'low': '#dc3545',
            'unknown': '#6c757d'
        };
        return colors[influence] || colors.unknown;
    }

    getScoreClass(score) {
        if (score >= 7) return 'score-high';
        if (score >= 4) return 'score-medium';
        return 'score-low';
    }

    generateStrategicInsights(influenceData, relationships) {
        const insights = [];
        
        // Unconnected high-influence contacts
        const highInfluence = influenceData.filter(c => c.influenceScore >= 7);
        const unconnected = highInfluence.filter(contact => 
            this.calculateNetworkSize(contact.id, relationships) === 0
        );
        
        if (unconnected.length > 0) {
            insights.push(`
                <div style="padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <strong>⚠️ Relationship Gap</strong><br>
                    <small>${unconnected.length} high-influence contact(s) with no recorded relationships</small>
                </div>
            `);
        }
        
        // Champion identification
        const champions = influenceData.filter(c => 
            c.influenceScore >= 6 && this.getRelationshipStrength(c.id, relationships) === 'strong'
        );
        
        if (champions.length > 0) {
            insights.push(`
                <div style="padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <strong>🎯 Champions Identified</strong><br>
                    <small>${champions.length} high-influence contact(s) with strong relationships</small>
                </div>
            `);
        }
        
        // Network density
        const totalPossibleConnections = (influenceData.length * (influenceData.length - 1)) / 2;
        const actualConnections = relationships.length;
        const density = totalPossibleConnections > 0 ? (actualConnections / totalPossibleConnections * 100) : 0;
        
        insights.push(`
            <div style="padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <strong>🕸️ Network Density</strong><br>
                <small>${density.toFixed(1)}% of possible relationships mapped</small>
            </div>
        `);
        
        return insights.join('');
    }

    updateInsights() {
        const contacts = DataManager.getAllContacts();
        const relationships = DataManager.getRelationships() || [];
        
        // Calculate insights
        const keyDecisionMakers = contacts.filter(c => this.calculateDecisionPower(c) >= 7).length;
        const influenceChampions = contacts.filter(c => 
            this.calculateInfluenceScore(c, relationships) >= 7 && 
            this.getRelationshipStrength(c.id, relationships) === 'strong'
        ).length;
        const networkReach = relationships.length;
        const relationshipGaps = contacts.filter(c => 
            this.calculateInfluenceScore(c, relationships) >= 7 && 
            this.calculateNetworkSize(c.id, relationships) === 0
        ).length;
        
        // Update display
        document.getElementById('keyDecisionMakers').textContent = keyDecisionMakers;
        document.getElementById('influenceChampions').textContent = influenceChampions;
        document.getElementById('networkReach').textContent = networkReach;
        document.getElementById('relationshipGaps').textContent = relationshipGaps;
    }

    selectContact(contactId) {
        this.selectedContact = contactId;
        const contact = DataManager.getContactById(contactId);
        const relationships = DataManager.getRelationships() || [];
        
        if (!contact) return;
        
        const contactRels = relationships.filter(rel => 
            rel.contactId1 === contactId || rel.contactId2 === contactId
        );
        
        const modalContent = `
            <h3>${contact.name}</h3>
            <p><strong>${contact.title}</strong> at <strong>${contact.company}</strong></p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div>
                    <h4>Influence Metrics</h4>
                    <p>Influence Score: <strong>${this.calculateInfluenceScore(contact, relationships)}/10</strong></p>
                    <p>Decision Power: <strong>${this.calculateDecisionPower(contact)}/10</strong></p>
                    <p>Network Size: <strong>${this.calculateNetworkSize(contactId, relationships)} connections</strong></p>
                </div>
                <div>
                    <h4>Contact Info</h4>
                    <p>Email: ${contact.email || 'Not provided'}</p>
                    <p>Phone: ${contact.phone || 'Not provided'}</p>
                    <p>Last Contact: ${contact.lastContact ? UIHelpers.formatDate(contact.lastContact) : 'Never'}</p>
                </div>
            </div>
            
            <h4>Relationships (${contactRels.length})</h4>
            <div style="max-height: 200px; overflow-y: auto;">
                ${contactRels.length > 0 ? contactRels.map(rel => {
                    const otherContactId = rel.contactId1 === contactId ? rel.contactId2 : rel.contactId1;
                    const otherContact = DataManager.getContactById(otherContactId);
                    return `
                        <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;">
                            <span>${otherContact ? otherContact.name : 'Unknown'}</span>
                            <span class="touchpoint-type type-${rel.strength}">${rel.strength}</span>
                        </div>
                    `;
                }).join('') : '<p style="color: #666; font-style: italic;">No relationships recorded</p>'}
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="action-btn" onclick="relationshipsModule.addRelationshipFor('${contactId}')">
                    Add Relationship
                </button>
                <button class="action-btn secondary" onclick="contactsModule.editContact('${contactId}'); UIHelpers.closeModal('relationshipModal');">
                    Edit Contact
                </button>
            </div>
        `;
        
        document.getElementById('relationshipModalContent').innerHTML = modalContent;
        UIHelpers.showModal('relationshipModal');
    }

    addRelationship() {
        this.showRelationshipForm();
    }

    addRelationshipFor(contactId) {
        this.showRelationshipForm(contactId);
    }

    showRelationshipForm(preselectedContactId = null) {
        const contacts = DataManager.getAllContacts();
        
        const modalContent = `
            <h3>Add Relationship</h3>
            <form id="relationshipForm" class="relationship-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="contact1">First Contact:</label>
                        <select id="contact1" name="contactId1" required>
                            <option value="">Select Contact</option>
                            ${contacts.map(contact => `
                                <option value="${contact.id}" ${preselectedContactId === contact.id ? 'selected' : ''}>
                                    ${contact.name} (${contact.company})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contact2">Second Contact:</label>
                        <select id="contact2" name="contactId2" required>
                            <option value="">Select Contact</option>
                            ${contacts.map(contact => `
                                <option value="${contact.id}">
                                    ${contact.name} (${contact.company})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="strength">Relationship Strength:</label>
                        <select id="strength" name="strength" required>
                            <option value="strong">Strong - Close working relationship</option>
                            <option value="medium" selected>Medium - Professional relationship</option>
                            <option value="weak">Weak - Limited interaction</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="type">Relationship Type:</label>
                        <select id="type" name="type" required>
                            <option value="reports-to">Reports To</option>
                            <option value="peer">Peer/Colleague</option>
                            <option value="influences">Influences</option>
                            <option value="collaborates">Collaborates With</option>
                            <option value="vendor-client">Vendor-Client</option>
                            <option value="mentor">Mentor-Mentee</option>
                            <option value="other" selected>Other</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="notes">Notes:</label>
                    <textarea id="notes" name="notes" placeholder="Additional context about this relationship..."></textarea>
                </div>
                
                <button type="submit" class="action-btn">Save Relationship</button>
            </form>
        `;
        
        document.getElementById('relationshipModalContent').innerHTML = modalContent;
        
        // Handle form submission
        document.getElementById('relationshipForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const relationship = Object.fromEntries(formData.entries());
            
            if (relationship.contactId1 === relationship.contactId2) {
                alert('Please select two different contacts');
                return;
            }
            
            DataManager.addRelationship(relationship);
            UIHelpers.closeModal('relationshipModal');
            UIHelpers.showNotification('Relationship added successfully');
        });
        
        UIHelpers.showModal('relationshipModal');
    }

    showRelationshipReport() {
        const contacts = DataManager.getAllContacts();
        const relationships = DataManager.getRelationships() || [];
        
        let report = 'Relationship Matrix Report\n\n';
        
        report += `Network Overview:\n`;
        report += `• Total Contacts: ${contacts.length}\n`;
        report += `• Total Relationships: ${relationships.length}\n`;
        report += `• Average Connections per Contact: ${(relationships.length * 2 / contacts.length).toFixed(1)}\n\n`;
        
        report += `Top Influencers:\n`;
        const influenceData = contacts.map(contact => ({
            ...contact,
            score: this.calculateInfluenceScore(contact, relationships)
        })).sort((a, b) => b.score - a.score).slice(0, 5);
        
        influenceData.forEach((contact, index) => {
            report += `${index + 1}. ${contact.name} (${contact.company}) - Score: ${contact.score}/10\n`;
        });
        
        report += `\nRelationship Strength Distribution:\n`;
        const strengthCounts = { strong: 0, medium: 0, weak: 0 };
        relationships.forEach(rel => {
            strengthCounts[rel.strength] = (strengthCounts[rel.strength] || 0) + 1;
        });
        
        Object.entries(strengthCounts).forEach(([strength, count]) => {
            report += `• ${strength}: ${count} (${((count / relationships.length) * 100).toFixed(1)}%)\n`;
        });
        
        alert(report);
    }

    refreshRelationshipData() {
        // Refresh any cached relationship calculations
        this.influenceMap = {};
        this.networkData = null;
        this.renderIfActive();
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
