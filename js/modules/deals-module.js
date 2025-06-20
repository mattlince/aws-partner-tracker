// Enhanced Deals Module - Integrated with Centralized Touchpoint System
class DealsModule {
    constructor() {
        this.currentFilter = { stage: '', contact: '', touchpointActivity: '' };
        this.currentView = 'table';
        this.sortBy = 'priority';
        this.sortOrder = 'desc';
        this.showArchived = false;
    }

    init() {
        console.log('Enhanced Deals module with touchpoint integration initialized');
        
        // 🎯 KEY INTEGRATION: Subscribe to centralized touchpoint events
        if (typeof window.subscribeTouchpoints === 'function') {
            window.subscribeTouchpoints('dealsModule', (eventType, data) => {
                console.log(`Deals module received ${eventType}:`, data);
                
                switch(eventType) {
                    case 'touchpoint:logged':
                    case 'touchpoint:updated':
                    case 'touchpoint:deleted':
                        // Refresh if the touchpoint affects a deal we're displaying
                        if (data.dealId || data.contactId) {
                            this.renderIfActive();
                        }
                        break;
                }
            });
        }
        
        // Listen for data changes (existing code)
        DataManager.on('deal:updated', () => this.renderIfActive());
        DataManager.on('deal:deleted', () => this.renderIfActive());
        DataManager.on('deal:added', () => this.renderIfActive());
        DataManager.on('contact:updated', () => this.updateContactDropdowns());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderDealsTable();
        this.updateContactDropdowns();
    }

    renderIfActive() {
        if (AppController.currentTab === 'deals' || AppController.currentTab === 'pipeline') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        const deals = this.getFilteredDeals();
        const stats = this.calculateDealStats(deals);

        return `
            <div class="deals-container">
                <div class="deals-header">
                    <div>
                        <h2>💼 Pipeline Management</h2>
                        <p>Track deals with relationship insights • ${deals.length} active deals • $${(stats.totalValue / 1000000).toFixed(1)}M pipeline • ${stats.dealsWithTouchpoints} deals with recent activity</p>
                    </div>
                    <div class="deals-controls">
                        <button class="view-btn ${this.currentView === 'table' ? 'active' : ''}" onclick="dealsModule.switchView('table')">
                            📋 Table View
                        </button>
                        <button class="view-btn ${this.currentView === 'kanban' ? 'active' : ''}" onclick="dealsModule.switchView('kanban')">
                            📱 Kanban Board
                        </button>
                        <button class="view-btn ${this.currentView === 'forecast' ? 'active' : ''}" onclick="dealsModule.switchView('forecast')">
                            📈 Forecast
                        </button>
                        <button class="action-btn" onclick="dealsModule.addNewDeal()">+ Add New Deal</button>
                        <button class="action-btn secondary" onclick="dealsModule.exportDeals()">📥 Export</button>
                        <button class="action-btn secondary" onclick="dealsModule.showPipelineReport()">📊 Report</button>
                    </div>
                </div>

                <div class="deals-filters">
                    <div class="filter-group">
                        <label>Stage:</label>
                        <select id="filterByStage" onchange="dealsModule.filterDeals()">
                            <option value="">All Stages</option>
                            <option value="prequalified">Prequalified</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal-development">Proposal Development</option>
                            <option value="proposal-delivered">Proposal Delivered</option>
                            <option value="legal">Legal Review</option>
                            <option value="out-for-signature">Out for Signature</option>
                            <option value="signed">Signed</option>
                            <option value="deal-won">Deal Won</option>
                            <option value="deal-lost">Deal Lost</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Contact:</label>
                        <select id="filterByContact" onchange="dealsModule.filterDeals()">
                            <option value="">All Contacts</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Activity:</label>
                        <select id="filterByActivity" onchange="dealsModule.filterDeals()">
                            <option value="">All Deals</option>
                            <option value="recent">Recent Activity (7 days)</option>
                            <option value="stale">Stale (30+ days)</option>
                            <option value="no-activity">No Touchpoints</option>
                            <option value="high-engagement">High Engagement</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Sort:</label>
                        <select id="sortBy" onchange="dealsModule.updateSort(this.value)">
                            <option value="priority" ${this.sortBy === 'priority' ? 'selected' : ''}>Priority Score</option>
                            <option value="value" ${this.sortBy === 'value' ? 'selected' : ''}>Deal Value</option>
                            <option value="weighted" ${this.sortBy === 'weighted' ? 'selected' : ''}>Weighted Value</option>
                            <option value="closeDate" ${this.sortBy === 'closeDate' ? 'selected' : ''}>Close Date</option>
                            <option value="lastActivity" ${this.sortBy === 'lastActivity' ? 'selected' : ''}>Last Activity</option>
                            <option value="relationship" ${this.sortBy === 'relationship' ? 'selected' : ''}>Relationship Score</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <button class="action-btn secondary" onclick="dealsModule.resetFilters()">Reset</button>
                    </div>
                </div>

                <div class="pipeline-insights">
                    <div class="insight-card">
                        <span class="insight-label">Total Pipeline</span>
                        <span class="insight-value">$${(stats.totalValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Weighted Pipeline</span>
                        <span class="insight-value">$${(stats.weightedValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Active This Week</span>
                        <span class="insight-value">${stats.dealsWithRecentActivity}</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Need Attention</span>
                        <span class="insight-value">${stats.staleDeals}</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Avg Relationship</span>
                        <span class="insight-value">${stats.avgRelationshipScore.toFixed(1)}/10</span>
                    </div>
                </div>

                <div id="dealsContainer">
                    <!-- Content will be populated based on current view -->
                </div>

                <!-- Deal Form Modal -->
                <div id="dealModal" class="modal" style="display: none;">
                    <div class="modal-content large-modal">
                        <span class="close" onclick="UIHelpers.closeModal('dealModal')">&times;</span>
                        <div id="dealModalContent">
                            <!-- Deal form will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Deal Details Modal -->
                <div id="dealDetailsModal" class="modal" style="display: none;">
                    <div class="modal-content large-modal">
                        <span class="close" onclick="UIHelpers.closeModal('dealDetailsModal')">&times;</span>
                        <div id="dealDetailsContent">
                            <!-- Deal details will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Deal Touchpoint History Modal -->
                <div id="dealTouchpointModal" class="modal" style="display: none;">
                    <div class="modal-content large-modal">
                        <span class="close" onclick="UIHelpers.closeModal('dealTouchpointModal')">&times;</span>
                        <div id="dealTouchpointContent">
                            <!-- Deal touchpoint history will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .deals-container {
                    max-width: 100%;
                    padding: 20px;
                }
                .deals-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .deals-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }
                .deals-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .deals-controls {
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
                .deals-filters {
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
                .filter-group select {
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9em;
                    background: white;
                }
                .pipeline-insights {
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

                /* Table View Styles */
                .deals-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    margin-bottom: 30px;
                }
                .deals-table th {
                    background: #232F3E;
                    color: white;
                    padding: 12px 8px;
                    text-align: left;
                    font-size: 0.85em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                }
                .deals-table th:hover {
                    background: #1a252f;
                }
                .deals-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #eee;
                    font-size: 0.9em;
                    vertical-align: middle;
                }
                .deals-table tbody tr {
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                .deals-table tbody tr:hover {
                    background: #f8f9fa;
                }
                .deal-name-cell {
                    min-width: 200px;
                }
                .deal-name {
                    font-weight: bold;
                    color: #232F3E;
                    margin-bottom: 4px;
                }
                .deal-description {
                    font-size: 0.8em;
                    color: #666;
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .contact-cell {
                    min-width: 160px;
                }
                .contact-name {
                    font-weight: 500;
                    color: #232F3E;
                    margin-bottom: 2px;
                }
                .contact-company {
                    font-size: 0.8em;
                    color: #666;
                }
                .stage-select {
                    padding: 4px 6px;
                    border: none;
                    border-radius: 4px;
                    font-size: 0.8em;
                    font-weight: bold;
                    cursor: pointer;
                    min-width: 140px;
                }
                .stage-prequalified { background: #6c757d; color: white; }
                .stage-qualified { background: #17a2b8; color: white; }
                .stage-proposal-development { background: #ffc107; color: #000; }
                .stage-proposal-delivered { background: #fd7e14; color: white; }
                .stage-legal { background: #6f42c1; color: white; }
                .stage-out-for-signature { background: #20c997; color: white; }
                .stage-signed { background: #28a745; color: white; }
                .stage-deal-won { background: #28a745; color: white; }
                .stage-deal-lost { background: #dc3545; color: white; }
                .progress-indicator {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .progress-bar-small {
                    width: 50px;
                    height: 6px;
                    background: #e9ecef;
                    border-radius: 3px;
                    overflow: hidden;
                }
                .progress-fill-small {
                    height: 100%;
                    background: linear-gradient(45deg, #28a745, #20c997);
                    transition: width 0.3s ease;
                }
                .priority-indicator {
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
                .priority-critical { background: #dc3545; }
                .priority-high { background: #fd7e14; }
                .priority-medium { background: #ffc107; color: #000; }
                .priority-low { background: #28a745; }
                .relationship-score-cell {
                    min-width: 120px;
                }
                .relationship-display {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .score-circle {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
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
                .touchpoint-summary-cell {
                    min-width: 140px;
                }
                .touchpoint-quick-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .touchpoint-count {
                    font-weight: bold;
                    color: #232F3E;
                }
                .last-activity {
                    font-size: 0.8em;
                    padding: 2px 6px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .last-activity:hover {
                    transform: scale(1.05);
                }
                .activity-recent { background: #d4edda; color: #155724; }
                .activity-moderate { background: #fff3cd; color: #856404; }
                .activity-stale { background: #f8d7da; color: #721c24; }
                .activity-none { background: #e2e3e5; color: #6c757d; }
                .days-indicator {
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 0.8em;
                    font-weight: bold;
                }
                .days-overdue { background: #f8d7da; color: #721c24; }
                .days-urgent { background: #fff3cd; color: #856404; }
                .days-normal { background: #d4edda; color: #155724; }
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
                .icon-btn.details { color: #6f42c1; }

                /* Kanban Board Styles */
                .kanban-board {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .kanban-column {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 15px;
                    min-height: 400px;
                }
                .kanban-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #dee2e6;
                }
                .kanban-title {
                    font-weight: bold;
                    color: #232F3E;
                }
                .kanban-count {
                    background: #232F3E;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                }
                .kanban-deals {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .kanban-card {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-left: 4px solid #FF9900;
                }
                .kanban-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }
                .kanban-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                .kanban-deal-name {
                    font-weight: bold;
                    color: #232F3E;
                    font-size: 0.9em;
                    line-height: 1.3;
                }
                .kanban-deal-value {
                    font-size: 1.1em;
                    font-weight: bold;
                    color: #28a745;
                }
                .kanban-contact {
                    font-size: 0.8em;
                    color: #666;
                    margin-bottom: 8px;
                }
                .kanban-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8em;
                    color: #666;
                }

                /* Forecast View Styles */
                .forecast-view {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .forecast-period {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .forecast-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    text-align: center;
                }
                .forecast-title {
                    font-size: 1.1em;
                    margin-bottom: 10px;
                    opacity: 0.9;
                }
                .forecast-value {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .forecast-subtitle {
                    font-size: 0.9em;
                    opacity: 0.8;
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
                .deal-form {
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
                .form-group.full-width {
                    grid-column: 1 / -1;
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
                .referral-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #FF9900;
                    margin: 15px 0;
                }
                .referral-section h4 {
                    margin: 0 0 15px 0;
                    color: #232F3E;
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
                    .deals-container {
                        padding: 15px;
                    }
                    .deals-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 20px;
                    }
                    .deals-controls {
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    .deals-filters {
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
                    .pipeline-insights {
                        grid-template-columns: repeat(2, 1fr);
                        padding: 15px;
                    }
                    .deals-table {
                        font-size: 0.8em;
                    }
                    .deals-table th,
                    .deals-table td {
                        padding: 8px 4px;
                    }
                    .kanban-board {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                    .form-row {
                        grid-template-columns: 1fr;
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
        this.renderCurrentView();
    }

    updateSort(sortBy) {
        this.sortBy = sortBy;
        this.renderCurrentView();
    }

    resetFilters() {
        this.currentFilter = { stage: '', contact: '', touchpointActivity: '' };
        this.sortBy = 'priority';
        
        document.getElementById('filterByStage').value = '';
        document.getElementById('filterByContact').value = '';
        document.getElementById('filterByActivity').value = '';
        document.getElementById('sortBy').value = 'priority';
        
        this.renderCurrentView();
    }

    renderCurrentView() {
        const container = document.getElementById('dealsContainer');
        if (!container) return;

        switch(this.currentView) {
            case 'table':
                this.renderDealsTable();
                break;
            case 'kanban':
                this.renderKanbanBoard(container);
                break;
            case 'forecast':
                this.renderForecastView(container);
                break;
        }
    }

    updateContactDropdowns() {
        const contacts = DataManager.getAllContacts();
        const filterContactSelect = document.getElementById('filterByContact');
        
        if (filterContactSelect) {
            filterContactSelect.innerHTML = '<option value="">All Contacts</option>';
            contacts.forEach(contact => {
                const option = document.createElement('option');
                option.value = contact.id;
                option.textContent = `${contact.name} ${contact.company ? `(${contact.company})` : ''}`;
                filterContactSelect.appendChild(option);
            });
        }
    }

    renderDealsTable() {
        const tbody = document.getElementById('dealsTableBody');
        if (!tbody) {
            // Create table structure if it doesn't exist
            const container = document.getElementById('dealsContainer');
            container.innerHTML = `
                <table class="deals-table">
                    <thead>
                        <tr>
                            <th onclick="dealsModule.updateSort('name')">Deal Name</th>
                            <th onclick="dealsModule.updateSort('contact')">Contact</th>
                            <th onclick="dealsModule.updateSort('value')">Value</th>
                            <th>Stage</th>
                            <th onclick="dealsModule.updateSort('probability')">Probability</th>
                            <th onclick="dealsModule.updateSort('weighted')">Weighted Value</th>
                            <th onclick="dealsModule.updateSort('closeDate')">Close Date</th>
                            <th onclick="dealsModule.updateSort('priority')">Priority</th>
                            <th onclick="dealsModule.updateSort('relationship')">Relationship</th>
                            <th onclick="dealsModule.updateSort('lastActivity')">Activity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="dealsTableBody">
                        <!-- Deals will be populated here -->
                    </tbody>
                </table>
            `;
            return this.renderDealsTable(); // Retry after creating structure
        }
        
        const deals = this.getFilteredAndSortedDeals();
        
        if (deals.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11">
                        <div class="empty-state">
                            <div class="empty-state-icon">💼</div>
                            <h3>No deals found</h3>
                            <p>Create your first deal to start tracking your pipeline.</p>
                            <button class="action-btn" onclick="dealsModule.addNewDeal()">+ Add First Deal</button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = deals.map(deal => this.renderDealRow(deal)).join('');
    }

    renderDealRow(deal) {
        const contact = DataManager.getContactById(deal.contactId);
        const contactName = contact ? contact.name : 'Unknown Contact';
        const contactCompany = contact ? contact.company : '';
        const weightedValue = (deal.value * (deal.probability / 100));
        const daysToClose = this.calculateDaysToClose(deal.closeDate);
        const daysClass = this.getDaysClass(daysToClose);
        const priorityScore = this.calculatePriorityScore(deal);
        const relationshipScore = contact ? this.getContactRelationshipScore(contact.id) : 0;
        const touchpointInfo = this.getDealTouchpointInfo(deal.id, deal.contactId);
        
        return `
            <tr onclick="dealsModule.showDealDetails('${deal.id}')">
                <td class="deal-name-cell">
                    <div class="deal-name">${deal.name}</div>
                    ${deal.description ? `<div class="deal-description">${deal.description}</div>` : ''}
                </td>
                <td class="contact-cell">
                    <div class="contact-name">${contactName}</div>
                    ${contactCompany ? `<div class="contact-company">${contactCompany}</div>` : ''}
                </td>
                <td><strong>${UIHelpers.formatCurrency(deal.value)}</strong></td>
                <td>
                    <select class="stage-select stage-${deal.stage}" onchange="event.stopPropagation(); dealsModule.changeDealStage('${deal.id}', this.value)">
                        ${Object.keys(DataManager.config.dealStages).map(stageId => `
                            <option value="${stageId}" ${stageId === deal.stage ? 'selected' : ''}>
                                ${DataManager.config.dealStages[stageId].name}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td>
                    <div class="progress-indicator">
                        <span>${deal.probability}%</span>
                        <div class="progress-bar-small">
                            <div class="progress-fill-small" style="width: ${deal.probability}%;"></div>
                        </div>
                    </div>
                </td>
                <td><strong>${UIHelpers.formatCurrency(weightedValue)}</strong></td>
                <td>
                    <div>${UIHelpers.formatDate(deal.closeDate)}</div>
                    <span class="days-indicator ${daysClass}">
                        ${daysToClose > 0 ? `${daysToClose} days` : daysToClose === 0 ? 'Today' : `${Math.abs(daysToClose)} days overdue`}
                    </span>
                </td>
                <td>
                    <div style="display: flex; align-items: center;">
                        <span class="priority-indicator ${this.getPriorityClass(priorityScore)}">${priorityScore}</span>
                        <span style="font-size: 0.8em; color: #666;">/100</span>
                    </div>
                </td>
                <td class="relationship-score-cell">
                    <div class="relationship-display">
                        <span class="score-circle ${this.getScoreClass(relationshipScore)}">${relationshipScore}</span>
                        <span style="font-size: 0.8em; color: #666;">/10</span>
                    </div>
                </td>
                <td class="touchpoint-summary-cell">
                    <div class="touchpoint-quick-info">
                        <div class="touchpoint-count">${touchpointInfo.count} touchpoints</div>
                        <div class="last-activity ${touchpointInfo.activityClass}" 
                             onclick="event.stopPropagation(); dealsModule.showDealTouchpointHistory('${deal.id}')"
                             title="Click to view touchpoint history">
                            ${touchpointInfo.lastActivityText}
                        </div>
                    </div>
                </td>
                <td onclick="event.stopPropagation()">
                    <div class="action-icons">
                        <button class="icon-btn touchpoint" onclick="dealsModule.logDealTouchpoint('${deal.id}')" title="Log Touchpoint">📞</button>
                        <button class="icon-btn details" onclick="dealsModule.showDealDetails('${deal.id}')" title="View Details">👁️</button>
                        <button class="icon-btn edit" onclick="dealsModule.editDeal('${deal.id}')" title="Edit">✏️</button>
                        <button class="icon-btn delete" onclick="dealsModule.deleteDeal('${deal.id}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderKanbanBoard(container) {
        const deals = this.getFilteredAndSortedDeals();
        const stages = DataManager.config.dealStages;
        
        // Group deals by stage
        const dealsByStage = {};
        Object.keys(stages).forEach(stageId => {
            dealsByStage[stageId] = deals.filter(deal => deal.stage === stageId);
        });

        const kanbanHTML = `
            <div class="kanban-board">
                ${Object.keys(stages).map(stageId => `
                    <div class="kanban-column">
                        <div class="kanban-header">
                            <div class="kanban-title">${stages[stageId].name}</div>
                            <div class="kanban-count">${dealsByStage[stageId].length}</div>
                        </div>
                        <div class="kanban-deals">
                            ${dealsByStage[stageId].map(deal => this.renderKanbanCard(deal)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = kanbanHTML;
    }

    renderKanbanCard(deal) {
        const contact = DataManager.getContactById(deal.contactId);
        const contactName = contact ? contact.name : 'Unknown Contact';
        const relationshipScore = contact ? this.getContactRelationshipScore(contact.id) : 0;
        const daysToClose = this.calculateDaysToClose(deal.closeDate);
        const priorityScore = this.calculatePriorityScore(deal);
        
        return `
            <div class="kanban-card" onclick="dealsModule.showDealDetails('${deal.id}')">
                <div class="kanban-card-header">
                    <div class="kanban-deal-name">${deal.name}</div>
                    <div class="kanban-deal-value">${UIHelpers.formatCurrency(deal.value)}</div>
                </div>
                <div class="kanban-contact">${contactName}</div>
                <div class="kanban-meta">
                    <span>⭐ ${relationshipScore}/10</span>
                    <span>${daysToClose > 0 ? `${daysToClose}d` : 'Overdue'}</span>
                    <span>📊 ${priorityScore}/100</span>
                </div>
            </div>
        `;
    }

    renderForecastView(container) {
        const deals = this.getFilteredAndSortedDeals();
        const forecast = this.calculateForecast(deals);

        container.innerHTML = `
            <div class="forecast-view">
                <h3>📈 Pipeline Forecast</h3>
                <div class="forecast-period">
                    <div class="forecast-card">
                        <div class="forecast-title">This Quarter</div>
                        <div class="forecast-value">${UIHelpers.formatCurrency(forecast.thisQuarter)}</div>
                        <div class="forecast-subtitle">${forecast.thisQuarterDeals} deals</div>
                    </div>
                    <div class="forecast-card">
                        <div class="forecast-title">Next Quarter</div>
                        <div class="forecast-value">${UIHelpers.formatCurrency(forecast.nextQuarter)}</div>
                        <div class="forecast-subtitle">${forecast.nextQuarterDeals} deals</div>
                    </div>
                    <div class="forecast-card">
                        <div class="forecast-title">Weighted Pipeline</div>
                        <div class="forecast-value">${UIHelpers.formatCurrency(forecast.weightedTotal)}</div>
                        <div class="forecast-subtitle">Probability adjusted</div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #666; font-style: italic;">
                    📊 Advanced forecasting charts and trend analysis coming soon!
                </div>
            </div>
        `;
    }

    // ===============================
    // 🎯 TOUCHPOINT INTEGRATION METHODS
    // ===============================

    /**
     * 🎯 Log touchpoint for a deal using centralized system
     */
    async logDealTouchpoint(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;

        const contact = DataManager.getContactById(deal.contactId);
        
        // 🎯 KEY INTEGRATION: Use centralized touchpoint logging
        if (typeof window.logTouchpoint === 'function') {
            try {
                const touchpointData = {
                    contactId: deal.contactId,
                    dealId: dealId,
                    type: 'call', // Default type
                    outcome: 'neutral',
                    notes: '',
                    isImportant: deal.value >= 100000 || this.calculatePriorityScore(deal) >= 80 // High value or priority deals are important
                };

                // Let the centralized system handle the full touchpoint modal
                if (typeof touchpointTracker !== 'undefined' && touchpointTracker.showAddTouchpointModal) {
                    touchpointTracker.showAddTouchpointModal(touchpointData);
                } else {
                    // Fallback to direct API call
                    const result = await window.logTouchpoint(touchpointData, 'dealsModule');
                    if (result) {
                        UIHelpers.showNotification(`Touchpoint logged for ${deal.name}`, 'success');
                        this.renderCurrentView();
                    }
                }
            } catch (error) {
                console.error('Error logging deal touchpoint:', error);
                UIHelpers.showNotification('Failed to log touchpoint. Please try again.', 'error');
            }
        } else {
            UIHelpers.showNotification('Touchpoint system not available', 'error');
        }
    }

    /**
     * 🎯 Show touchpoint history for a deal
     */
    showDealTouchpointHistory(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;

        const contact = DataManager.getContactById(deal.contactId);
        
        // 🎯 KEY INTEGRATION: Get touchpoints from centralized system
        const dealTouchpoints = typeof window.getRecentTouchpoints === 'function' ? 
            window.getRecentTouchpoints({ dealId: dealId }) : [];
        
        const contactTouchpoints = typeof window.getRecentTouchpoints === 'function' ? 
            window.getRecentTouchpoints({ contactId: deal.contactId }) : [];

        // Combine and sort all related touchpoints
        const allTouchpoints = [...dealTouchpoints, ...contactTouchpoints]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const historyHTML = allTouchpoints.length > 0 ? allTouchpoints.map(tp => {
            const daysSince = Math.ceil((new Date() - new Date(tp.date)) / (1000 * 60 * 60 * 24));
            const isDealSpecific = tp.dealId === dealId;
            
            return `
                <div style="border-bottom: 1px solid #eee; padding: 15px 0; cursor: pointer; ${isDealSpecific ? 'border-left: 4px solid #FF9900; padding-left: 16px;' : ''}" onclick="touchpointTracker?.showTouchpointDetails?.('${tp.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>${this.getTypeLabel(tp.type)} ${isDealSpecific ? '💼' : '👤'}</strong>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="color: #666; font-size: 0.9em;">
                                ${daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
                            </span>
                            <span class="outcome-badge outcome-${tp.outcome}" style="font-size: 0.8em;">${this.getOutcomeLabel(tp.outcome)}</span>
                        </div>
                    </div>
                    <div style="color: #232F3E; margin-bottom: 8px;">${tp.notes}</div>
                    <div style="font-size: 0.8em; color: #666;">
                        ${isDealSpecific ? '💼 Deal-specific touchpoint' : '👤 Contact touchpoint'}
                    </div>
                    ${tp.tags && tp.tags.length > 0 ? `
                        <div style="margin-top: 8px;">
                            ${tp.tags.map(tag => `<span style="background: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 12px; font-size: 0.8em; margin-right: 4px;">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('') : '<div style="text-align: center; color: #666; padding: 40px;">No touchpoints recorded for this deal yet</div>';

        const modalContent = `
            <h3>Deal Activity History - ${deal.name}</h3>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #232F3E;">${dealTouchpoints.length}</div>
                        <div style="font-size: 0.9em; color: #666;">Deal Touchpoints</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #17a2b8;">${contactTouchpoints.length}</div>
                        <div style="font-size: 0.9em; color: #666;">Contact Touchpoints</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">${UIHelpers.formatCurrency(deal.value)}</div>
                        <div style="font-size: 0.9em; color: #666;">Deal Value</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #6f42c1;">${this.calculatePriorityScore(deal)}/100</div>
                        <div style="font-size: 0.9em; color: #666;">Priority Score</div>
                    </div>
                </div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                ${historyHTML}
            </div>
            
            <div style="margin-top: 20px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                <button class="action-btn" onclick="dealsModule.logDealTouchpoint('${dealId}'); UIHelpers.closeModal('dealTouchpointModal');">
                    + Log Deal Touchpoint
                </button>
                <button class="action-btn secondary" onclick="dealsModule.showDealDetails('${dealId}'); UIHelpers.closeModal('dealTouchpointModal');">
                    View Deal Details
                </button>
                <button class="action-btn secondary" onclick="UIHelpers.closeModal('dealTouchpointModal');">
                    Close
                </button>
            </div>
        `;
        
        document.getElementById('dealTouchpointContent').innerHTML = modalContent;
        UIHelpers.showModal('dealTouchpointModal');
    }

    /**
     * 🎯 Get touchpoint information for a deal
     */
    getDealTouchpointInfo(dealId, contactId) {
        // Get both deal-specific and contact touchpoints
        const dealTouchpoints = typeof window.getRecentTouchpoints === 'function' ? 
            window.getRecentTouchpoints({ dealId: dealId }) : [];
        
        const contactTouchpoints = typeof window.getRecentTouchpoints === 'function' ? 
            window.getRecentTouchpoints({ contactId: contactId }) : [];

        const totalCount = dealTouchpoints.length + contactTouchpoints.length;
        
        // Find the most recent touchpoint
        const allTouchpoints = [...dealTouchpoints, ...contactTouchpoints]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const lastTouchpoint = allTouchpoints[0];
        
        if (!lastTouchpoint) {
            return {
                count: 0,
                lastActivityText: 'No activity',
                activityClass: 'activity-none'
            };
        }

        const daysSince = Math.ceil((new Date() - new Date(lastTouchpoint.date)) / (1000 * 60 * 60 * 24));
        
        let activityClass, lastActivityText;
        if (daysSince <= 7) {
            activityClass = 'activity-recent';
            lastActivityText = `${daysSince}d ago`;
        } else if (daysSince <= 30) {
            activityClass = 'activity-moderate';
            lastActivityText = `${daysSince}d ago`;
        } else {
            activityClass = 'activity-stale';
            lastActivityText = `${daysSince}d ago`;
        }

        return {
            count: totalCount,
            lastActivityText,
            activityClass
        };
    }

    /**
     * 🎯 Get relationship score for a contact
     */
    getContactRelationshipScore(contactId) {
        if (typeof window.getTouchpointStats === 'function') {
            const stats = window.getTouchpointStats(contactId, null);
            
            let score = 5; // Base score
            
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
            
            // Recent activity bonus
            if (stats.thisWeek >= 2) score += 1;
            
            return Math.max(1, Math.min(10, score));
        } else {
            // Fallback scoring
            return 5;
        }
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
    // EXISTING DEAL MANAGEMENT METHODS
    // ===============================

    addNewDeal() {
        this.showDealForm();
    }

    showDealForm(dealId = null) {
        const deal = dealId ? DataManager.getDeals().find(d => d.id === dealId) : null;
        const contacts = DataManager.getAllContacts();
        const stages = DataManager.config.dealStages;
        const isEdit = !!deal;
        
        const modalContent = `
            <h3>${isEdit ? 'Edit Deal' : 'Add New Deal'}</h3>
            <form id="dealForm" class="deal-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="dealName">Deal Name *</label>
                        <input type="text" id="dealName" name="name" required 
                               value="${deal ? deal.name : ''}" 
                               placeholder="Enter deal name">
                    </div>
                    <div class="form-group">
                        <label for="dealContact">Contact *</label>
                        <select id="dealContact" name="contactId" required>
                            <option value="">Select Contact</option>
                            ${contacts.map(contact => `
                                <option value="${contact.id}" ${deal && deal.contactId === contact.id ? 'selected' : ''}>
                                    ${contact.name} ${contact.company ? `(${contact.company})` : ''}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="dealValue">Deal Value ($) *</label>
                        <input type="number" id="dealValue" name="value" required min="0" step="1000"
                               value="${deal ? deal.value : ''}" 
                               placeholder="Enter deal value">
                    </div>
                    <div class="form-group">
                        <label for="dealStage">Stage *</label>
                        <select id="dealStage" name="stage" required onchange="dealsModule.updateProbabilityFromStage()">
                            ${Object.keys(stages).map(stageId => `
                                <option value="${stageId}" ${deal && deal.stage === stageId ? 'selected' : ''}>
                                    ${stages[stageId].name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="dealProbability">Probability (%) *</label>
                        <input type="number" id="dealProbability" name="probability" required min="0" max="100"
                               value="${deal ? deal.probability : ''}" 
                               placeholder="Enter probability">
                    </div>
                    <div class="form-group">
                        <label for="dealCloseDate">Expected Close Date *</label>
                        <input type="date" id="dealCloseDate" name="closeDate" required
                               value="${deal ? deal.closeDate : ''}">
                    </div>
                </div>
                
                <div class="referral-section">
                    <h4>🤝 Referral Information</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="referralSource">Referral Source</label>
                            <select id="referralSource" name="referralSource">
                                <option value="direct" ${!deal || deal.referralSource === 'direct' ? 'selected' : ''}>Direct Sales</option>
                                <option value="aws" ${deal && deal.referralSource === 'aws' ? 'selected' : ''}>AWS Referral</option>
                                <option value="cdw" ${deal && deal.referralSource === 'cdw' ? 'selected' : ''}>CDW Referral</option>
                                <option value="partner" ${deal && deal.referralSource === 'partner' ? 'selected' : ''}>Partner Referral</option>
                                <option value="other" ${deal && deal.referralSource === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="referralTeam">Referring Team</label>
                            <input type="text" id="referralTeam" name="referralTeam" 
                                   value="${deal ? deal.referralTeam || '' : ''}"
                                   placeholder="Team or person who referred">
                        </div>
                    </div>
                </div>
                
                <div class="form-group full-width">
                    <label for="dealDescription">Description</label>
                    <textarea id="dealDescription" name="description" 
                              placeholder="Enter deal description, notes, or key details...">${deal ? deal.description || '' : ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="action-btn">
                        ${isEdit ? 'Update Deal' : 'Create Deal'}
                    </button>
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('dealModal')">
                        Cancel
                    </button>
                    ${isEdit ? `
                        <button type="button" class="action-btn danger" onclick="dealsModule.deleteDeal('${deal.id}')">
                            Delete Deal
                        </button>
                    ` : ''}
                </div>
            </form>
        `;
        
        document.getElementById('dealModalContent').innerHTML = modalContent;
        
        // Set default probability based on stage
        if (!isEdit) {
            this.updateProbabilityFromStage();
        }
        
        // Handle form submission
        document.getElementById('dealForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const dealData = Object.fromEntries(formData.entries());
            
            // Convert numeric fields
            dealData.value = parseFloat(dealData.value);
            dealData.probability = parseInt(dealData.probability);
            
            if (isEdit) {
                DataManager.updateDeal({ ...deal, ...dealData });
                UIHelpers.showNotification('Deal updated successfully', 'success');
            } else {
                DataManager.addDeal(dealData);
                UIHelpers.showNotification('Deal created successfully', 'success');
            }
            
            UIHelpers.closeModal('dealModal');
        });
        
        UIHelpers.showModal('dealModal');
    }

    updateProbabilityFromStage() {
        const stageSelect = document.getElementById('dealStage');
        const probabilityInput = document.getElementById('dealProbability');
        
        if (stageSelect && probabilityInput) {
            const selectedStage = stageSelect.value;
            const stageConfig = DataManager.config.dealStages[selectedStage];
            if (stageConfig) {
                probabilityInput.value = stageConfig.probability;
            }
        }
    }

    showDealDetails(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;

        const contact = DataManager.getContactById(deal.contactId);
        const contactName = contact ? contact.name : 'Unknown Contact';
        const contactCompany = contact ? contact.company : 'No company';
        const relationshipScore = contact ? this.getContactRelationshipScore(contact.id) : 0;
        const touchpointInfo = this.getDealTouchpointInfo(deal.id, deal.contactId);
        const priorityScore = this.calculatePriorityScore(deal);
        const daysToClose = this.calculateDaysToClose(deal.closeDate);
        const stageInfo = DataManager.config.dealStages[deal.stage];

        const detailsContent = `
            <h3>Deal Details - ${deal.name}</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
                <div>
                    <h4>📋 Deal Information</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <div style="margin-bottom: 10px;"><strong>Value:</strong> ${UIHelpers.formatCurrency(deal.value)}</div>
                        <div style="margin-bottom: 10px;"><strong>Stage:</strong> ${stageInfo.name}</div>
                        <div style="margin-bottom: 10px;"><strong>Probability:</strong> ${deal.probability}%</div>
                        <div style="margin-bottom: 10px;"><strong>Weighted Value:</strong> ${UIHelpers.formatCurrency(deal.value * (deal.probability / 100))}</div>
                        <div style="margin-bottom: 10px;"><strong>Close Date:</strong> ${UIHelpers.formatDate(deal.closeDate)}</div>
                        <div><strong>Days to Close:</strong> 
                            <span class="${this.getDaysClass(daysToClose)}">
                                ${daysToClose > 0 ? `${daysToClose} days` : daysToClose === 0 ? 'Today' : `${Math.abs(daysToClose)} days overdue`}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4>👤 Contact & Relationship</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <div style="margin-bottom: 10px;"><strong>Contact:</strong> ${contactName}</div>
                        <div style="margin-bottom: 10px;"><strong>Company:</strong> ${contactCompany}</div>
                        <div style="margin-bottom: 10px;">
                            <strong>Relationship Score:</strong> 
                            <span class="score-circle ${this.getScoreClass(relationshipScore)}" style="width: 24px; height: 24px; line-height: 24px; font-size: 0.8em; margin-left: 8px;">${relationshipScore}</span>
                            <span style="margin-left: 4px;">/10</span>
                        </div>
                        <div style="margin-bottom: 10px;"><strong>Total Touchpoints:</strong> ${touchpointInfo.count}</div>
                        <div style="margin-bottom: 10px;"><strong>Last Activity:</strong> ${touchpointInfo.lastActivityText}</div>
                        <div><strong>Priority Score:</strong> 
                            <span class="priority-indicator ${this.getPriorityClass(priorityScore)}" style="width: 24px; height: 24px; line-height: 24px; margin-left: 8px;">${priorityScore}</span>
                            <span style="margin-left: 4px;">/100</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${deal.referralSource && deal.referralSource !== 'direct' ? `
                <div style="margin-bottom: 25px;">
                    <h4>🤝 Referral Information</h4>
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                        <div style="margin-bottom: 8px;"><strong>Source:</strong> ${deal.referralSource.toUpperCase()}</div>
                        ${deal.referralTeam ? `<div><strong>Referring Team:</strong> ${deal.referralTeam}</div>` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${deal.description ? `
                <div style="margin-bottom: 25px;">
                    <h4>📝 Description</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        ${deal.description}
                    </div>
                </div>
            ` : ''}
            
            <div style="margin-bottom: 25px;">
                <h4>📊 Deal Insights</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    <div style="text-align: center; background: #e3f2fd; padding: 15px; border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #1976d2;">${deal.probability}%</div>
                        <div style="font-size: 0.9em; color: #666;">Win Probability</div>
                    </div>
                    <div style="text-align: center; background: #f3e5f5; padding: 15px; border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #7b1fa2;">${priorityScore}</div>
                        <div style="font-size: 0.9em; color: #666;">Priority Score</div>
                    </div>
                    <div style="text-align: center; background: #e8f5e8; padding: 15px; border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #388e3c;">${relationshipScore}/10</div>
                        <div style="font-size: 0.9em; color: #666;">Relationship</div>
                    </div>
                    <div style="text-align: center; background: #fff3e0; padding: 15px; border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #f57c00;">${touchpointInfo.count}</div>
                        <div style="font-size: 0.9em; color: #666;">Touchpoints</div>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="action-btn" onclick="dealsModule.logDealTouchpoint('${deal.id}'); UIHelpers.closeModal('dealDetailsModal');">
                    📞 Log Touchpoint
                </button>
                <button class="action-btn secondary" onclick="dealsModule.showDealTouchpointHistory('${deal.id}'); UIHelpers.closeModal('dealDetailsModal');">
                    📝 View Activity History
                </button>
                <button class="action-btn secondary" onclick="dealsModule.editDeal('${deal.id}'); UIHelpers.closeModal('dealDetailsModal');">
                    ✏️ Edit Deal
                </button>
                <button class="action-btn secondary" onclick="UIHelpers.closeModal('dealDetailsModal');">
                    Close
                </button>
            </div>
        `;
        
        document.getElementById('dealDetailsContent').innerHTML = detailsContent;
        UIHelpers.showModal('dealDetailsModal');
    }

    editDeal(dealId) {
        this.showDealForm(dealId);
    }

    deleteDeal(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;
        
        if (confirm(`Are you sure you want to delete "${deal.name}"? This action cannot be undone.`)) {
            DataManager.deleteDeal(dealId);
            UIHelpers.closeModal('dealModal');
            UIHelpers.closeModal('dealDetailsModal');
            UIHelpers.showNotification('Deal deleted successfully', 'success');
        }
    }

    changeDealStage(dealId, newStage) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (deal) {
            const oldStage = deal.stage;
            deal.stage = newStage;
            deal.probability = DataManager.config.dealStages[newStage].probability;
            DataManager.updateDeal(deal);
            
            UIHelpers.showNotification(`Deal moved from ${DataManager.config.dealStages[oldStage].name} to ${DataManager.config.dealStages[newStage].name}`, 'success');
            this.renderCurrentView();
        }
    }

    // Data processing and calculation methods
    getFilteredAndSortedDeals() {
        let deals = this.getFilteredDeals();
        
        // Apply sorting
        deals.sort((a, b) => {
            let aValue, bValue;
            
            switch(this.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'value':
                    aValue = a.value;
                    bValue = b.value;
                    break;
                case 'weighted':
                    aValue = a.value * (a.probability / 100);
                    bValue = b.value * (b.probability / 100);
                    break;
                case 'closeDate':
                    aValue = new Date(a.closeDate);
                    bValue = new Date(b.closeDate);
                    break;
                case 'probability':
                    aValue = a.probability;
                    bValue = b.probability;
                    break;
                case 'priority':
                    aValue = this.calculatePriorityScore(a);
                    bValue = this.calculatePriorityScore(b);
                    break;
                case 'relationship':
                    const contactA = DataManager.getContactById(a.contactId);
                    const contactB = DataManager.getContactById(b.contactId);
                    aValue = contactA ? this.getContactRelationshipScore(contactA.id) : 0;
                    bValue = contactB ? this.getContactRelationshipScore(contactB.id) : 0;
                    break;
                case 'lastActivity':
                    const infoA = this.getDealTouchpointInfo(a.id, a.contactId);
                    const infoB = this.getDealTouchpointInfo(b.id, b.contactId);
                    aValue = infoA.count > 0 ? 1 : 0; // Simple activity indicator
                    bValue = infoB.count > 0 ? 1 : 0;
                    break;
                default:
                    return 0;
            }
            
            if (this.sortOrder === 'desc') {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            } else {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
        });
        
        return deals;
    }

    getFilteredDeals() {
        const deals = DataManager.getDeals();
        const stageFilter = document.getElementById('filterByStage')?.value || '';
        const contactFilter = document.getElementById('filterByContact')?.value || '';
        const activityFilter = document.getElementById('filterByActivity')?.value || '';
        
        return deals.filter(deal => {
            const matchesStage = !stageFilter || deal.stage === stageFilter;
            const matchesContact = !contactFilter || deal.contactId === contactFilter;
            
            let matchesActivity = true;
            if (activityFilter) {
                const touchpointInfo = this.getDealTouchpointInfo(deal.id, deal.contactId);
                const contact = DataManager.getContactById(deal.contactId);
                const relationshipScore = contact ? this.getContactRelationshipScore(contact.id) : 0;
                
                switch(activityFilter) {
                    case 'recent':
                        matchesActivity = touchpointInfo.activityClass === 'activity-recent';
                        break;
                    case 'stale':
                        matchesActivity = touchpointInfo.activityClass === 'activity-stale';
                        break;
                    case 'no-activity':
                        matchesActivity = touchpointInfo.count === 0;
                        break;
                    case 'high-engagement':
                        matchesActivity = touchpointInfo.count >= 5 && relationshipScore >= 7;
                        break;
                }
            }
            
            return matchesStage && matchesContact && matchesActivity;
        });
    }

    filterDeals() {
        this.renderCurrentView();
    }

    calculatePriorityScore(deal) {
        let score = 0;
        
        // Value weight (40 points max)
        const valueScore = Math.min(40, (deal.value / 1000000) * 40);
        score += valueScore;
        
        // Probability weight (30 points max)
        score += (deal.probability / 100) * 30;
        
        // Days to close weight (20 points max)
        const daysToClose = this.calculateDaysToClose(deal.closeDate);
        if (daysToClose <= 0) {
            score += 20; // Overdue or due today
        } else if (daysToClose <= 7) {
            score += 18;
        } else if (daysToClose <= 30) {
            score += 15;
        } else if (daysToClose <= 90) {
            score += 10;
        } else {
            score += 5;
        }
        
        // Relationship score weight (10 points max)
        const contact = DataManager.getContactById(deal.contactId);
        if (contact) {
            const relationshipScore = this.getContactRelationshipScore(contact.id);
            score += (relationshipScore / 10) * 10;
        }
        
        return Math.round(Math.min(100, score));
    }

    calculateDaysToClose(closeDate) {
        const today = new Date();
        const close = new Date(closeDate);
        const diffTime = close - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getDaysClass(days) {
        if (days < 0) return 'days-overdue';
        if (days <= 7) return 'days-urgent';
        return 'days-normal';
    }

    getPriorityClass(score) {
        if (score >= 80) return 'priority-critical';
        if (score >= 60) return 'priority-high';
        if (score >= 40) return 'priority-medium';
        return 'priority-low';
    }

    getScoreClass(score) {
        if (score >= 9) return 'score-excellent';
        if (score >= 7) return 'score-good';
        if (score >= 5) return 'score-fair';
        if (score >= 3) return 'score-poor';
        return 'score-critical';
    }

    calculateDealStats(deals) {
        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        const weightedValue = deals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        
        // Count deals with recent touchpoint activity
        const dealsWithRecentActivity = deals.filter(deal => {
            const touchpointInfo = this.getDealTouchpointInfo(deal.id, deal.contactId);
            return touchpointInfo.activityClass === 'activity-recent';
        }).length;
        
        // Count stale deals
        const staleDeals = deals.filter(deal => {
            const touchpointInfo = this.getDealTouchpointInfo(deal.id, deal.contactId);
            return touchpointInfo.activityClass === 'activity-stale' || touchpointInfo.count === 0;
        }).length;
        
        // Count deals with any touchpoints
        const dealsWithTouchpoints = deals.filter(deal => {
            const touchpointInfo = this.getDealTouchpointInfo(deal.id, deal.contactId);
            return touchpointInfo.count > 0;
        }).length;
        
        // Calculate average relationship score
        const avgRelationshipScore = deals.length > 0 ? 
            deals.reduce((sum, deal) => {
                const contact = DataManager.getContactById(deal.contactId);
                return sum + (contact ? this.getContactRelationshipScore(contact.id) : 0);
            }, 0) / deals.length : 0;

        return {
            totalValue,
            weightedValue,
            dealsWithRecentActivity,
            staleDeals,
            dealsWithTouchpoints,
            avgRelationshipScore
        };
    }

    calculateForecast(deals) {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        const nextQuarterStart = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 1);
        const nextQuarterEnd = new Date(now.getFullYear(), (currentQuarter + 2) * 3, 0);
        
        const thisQuarterDeals = deals.filter(deal => {
            const closeDate = new Date(deal.closeDate);
            return closeDate >= quarterStart && closeDate <= quarterEnd;
        });
        
        const nextQuarterDeals = deals.filter(deal => {
            const closeDate = new Date(deal.closeDate);
            return closeDate >= nextQuarterStart && closeDate <= nextQuarterEnd;
        });
        
        const thisQuarter = thisQuarterDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        const nextQuarter = nextQuarterDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        const weightedTotal = deals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        
        return {
            thisQuarter,
            nextQuarter,
            weightedTotal,
            thisQuarterDeals: thisQuarterDeals.length,
            nextQuarterDeals: nextQuarterDeals.length
        };
    }

    exportDeals() {
        const deals = this.getFilteredAndSortedDeals();
        if (deals.length === 0) {
            UIHelpers.showNotification('No deals to export', 'warning');
            return;
        }
        
        let csv = 'Deal Name,Contact,Company,Stage,Value,Probability,Weighted Value,Close Date,Priority Score,Relationship Score,Total Touchpoints,Last Activity,Referral Source,Description\n';
        
        deals.forEach(deal => {
            const contact = DataManager.getContactById(deal.contactId);
            const contactName = contact ? contact.name : 'Unknown';
            const company = contact ? contact.company : 'Unknown';
            const stage = DataManager.config.dealStages[deal.stage]?.name || deal.stage;
            const weightedValue = deal.value * (deal.probability / 100);
            const priorityScore = this.calculatePriorityScore(deal);
            const relationshipScore = contact ? this.getContactRelationshipScore(contact.id) : 0;
            const touchpointInfo = this.getDealTouchpointInfo(deal.id, deal.contactId);
            
            csv += `"${deal.name}","${contactName}","${company}","${stage}",${deal.value},${deal.probability},${weightedValue},"${deal.closeDate}",${priorityScore},${relationshipScore},${touchpointInfo.count},"${touchpointInfo.lastActivityText}","${deal.referralSource || 'direct'}","${deal.description || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deals-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        UIHelpers.showNotification('Deals exported successfully', 'success');
    }

    showPipelineReport() {
        const deals = this.getFilteredAndSortedDeals();
        const stages = DataManager.config.dealStages;
        const stats = this.calculateDealStats(deals);
        
        let report = `📊 Pipeline Report - ${new Date().toLocaleDateString()}\n\n`;
        report += `💰 Total Pipeline: ${UIHelpers.formatCurrency(stats.totalValue)}\n`;
        report += `⚖️ Weighted Pipeline: ${UIHelpers.formatCurrency(stats.weightedValue)}\n`;
        report += `📈 Active This Week: ${stats.dealsWithRecentActivity} deals\n`;
        report += `⚠️ Need Attention: ${stats.staleDeals} deals\n`;
        report += `🤝 Avg Relationship Score: ${stats.avgRelationshipScore.toFixed(1)}/10\n\n`;
        
        report += `📋 By Stage:\n`;
        Object.keys(stages).forEach(stageId => {
            const stageDeals = deals.filter(d => d.stage === stageId);
            const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
            if (stageDeals.length > 0) {
                report += `  ${stages[stageId].name}: ${stageDeals.length} deals, ${UIHelpers.formatCurrency(stageValue)}\n`;
            }
        });
        
        alert(report);
    }
}

// Create global instance
const dealsModule = new DealsModule();
console.log('✅ Enhanced Deals module with centralized touchpoint integration loaded successfully');
