// Enhanced Pipeline Management Module - Enterprise-Grade Features with AWS & CDW Referral Tracking
class PipelineModule {
    constructor() {
        this.currentView = 'kanban';
        this.selectedTimeframe = 'current-quarter';
        this.selectedTeam = 'all';
        this.draggedDeal = null;
        this.filters = {
            team: 'all',
            owner: 'all',
            value: 'all',
            closeDate: 'all',
            stage: 'all',
            referralSource: 'all'
        };
        this.sortBy = 'closeDate';
        this.sortOrder = 'asc';
    }

    init() {
        console.log('Pipeline module initialized with referral tracking');
        
        // Listen for data changes
        DataManager.on('deal:updated', () => this.renderIfActive());
        DataManager.on('deal:deleted', () => this.renderIfActive());
        DataManager.on('deal:added', () => this.renderIfActive());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
       setupEventListeners() {
    // Event listeners are set up through onclick handlers in the HTML
    // This method exists to prevent errors when called from render()
}
        this.renderContent();
    }

    renderIfActive() {
        if (AppController.currentTab === 'pipeline') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        const deals = this.getFilteredDeals();
        const pipelineStats = this.calculatePipelineStats(deals);
        const referralStats = this.calculateReferralStats(deals);

        return `
            <div class="pipeline-container">
                <div class="pipeline-header">
                    <div>
                        <h2>🚀 Pipeline Management</h2>
                        <p>Complete deal lifecycle • ${(pipelineStats.totalValue / 1000000).toFixed(1)}M total • ${pipelineStats.totalDeals} active deals • ${referralStats.awsPercentage}% AWS • ${referralStats.cdwPercentage}% CDW</p>
                    </div>
                    <div class="pipeline-controls">
                        <button class="view-btn ${this.currentView === 'kanban' ? 'active' : ''}" onclick="pipelineModule.switchView('kanban')">
                            📋 Kanban Board
                        </button>
                        <button class="view-btn ${this.currentView === 'table' ? 'active' : ''}" onclick="pipelineModule.switchView('table')">
                            📊 Table View
                        </button>
                        <button class="view-btn ${this.currentView === 'forecast' ? 'active' : ''}" onclick="pipelineModule.switchView('forecast')">
                            📈 Forecast
                        </button>
                        <button class="view-btn ${this.currentView === 'analytics' ? 'active' : ''}" onclick="pipelineModule.switchView('analytics')">
                            📉 Analytics
                        </button>
                        <button class="view-btn ${this.currentView === 'timeline' ? 'active' : ''}" onclick="pipelineModule.switchView('timeline')">
                            📅 Timeline
                        </button>
                        <button class="view-btn ${this.currentView === 'referrals' ? 'active' : ''}" onclick="pipelineModule.switchView('referrals')">
                            🤝 Referral Analysis
                        </button>
                        <button class="action-btn" onclick="pipelineModule.showDealForm()">
                            + Add Deal
                        </button>
                        <button class="action-btn secondary" onclick="pipelineModule.exportPipeline()">
                            📥 Export
                        </button>
                    </div>
                </div>

                <div class="pipeline-filters">
                    <div class="filter-group">
                        <label>Team:</label>
                        <select id="teamFilter" onchange="pipelineModule.updateFilter('team', this.value)">
                            <option value="all">All Teams</option>
                            ${this.getTeamOptions()}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Timeframe:</label>
                        <select id="timeframeFilter" onchange="pipelineModule.updateTimeframe(this.value)">
                            <option value="current-quarter" ${this.selectedTimeframe === 'current-quarter' ? 'selected' : ''}>Current Quarter</option>
                            <option value="next-quarter" ${this.selectedTimeframe === 'next-quarter' ? 'selected' : ''}>Next Quarter</option>
                            <option value="this-year" ${this.selectedTimeframe === 'this-year' ? 'selected' : ''}>This Year</option>
                            <option value="all" ${this.selectedTimeframe === 'all' ? 'selected' : ''}>All Time</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Deal Size:</label>
                        <select id="valueFilter" onchange="pipelineModule.updateFilter('value', this.value)">
                            <option value="all">All Sizes</option>
                            <option value="enterprise">$500K+ (Enterprise)</option>
                            <option value="large">$100K-$500K (Large)</option>
                            <option value="medium">$25K-$100K (Medium)</option>
                            <option value="small">Under $25K (Small)</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Referral Source:</label>
                        <select id="referralSourceFilter" onchange="pipelineModule.updateFilter('referralSource', this.value)">
                            <option value="all">All Sources</option>
                            <option value="aws">AWS Referrals</option>
                            <option value="cdw">CDW Referrals</option>
                            <option value="direct">Direct Sales</option>
                            <option value="other">Other Partners</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Stage:</label>
                        <select id="stageFilter" onchange="pipelineModule.updateFilter('stage', this.value)">
                            <option value="all">All Stages</option>
                            ${this.getStageOptions()}
                        </select>
                    </div>
                    <div class="filter-group">
                        <button class="action-btn secondary" onclick="pipelineModule.resetFilters()">Reset Filters</button>
                    </div>
                </div>

                <div class="pipeline-insights">
                    <div class="insight-card">
                        <span class="insight-label">Total Pipeline</span>
                        <span class="insight-value">${(pipelineStats.totalValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Weighted Pipeline</span>
                        <span class="insight-value">${(pipelineStats.weightedValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">AWS Referrals</span>
                        <span class="insight-value">${(referralStats.awsValue / 1000000).toFixed(1)}M (${referralStats.awsCount})</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">CDW Referrals</span>
                        <span class="insight-value">${(referralStats.cdwValue / 1000000).toFixed(1)}M (${referralStats.cdwCount})</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">This Quarter</span>
                        <span class="insight-value">${(pipelineStats.quarterlyForecast / 1000000).toFixed(1)}M</span>
                    </div>
                </div>

                <div id="pipelineContent">
                    <!-- Pipeline content will be populated here -->
                </div>

                <!-- Deal Form Modal -->
                <div id="dealFormModal" class="modal" style="display: none;">
                    <div class="modal-content" style="max-width: 1000px;">
                        <span class="close" onclick="UIHelpers.closeModal('dealFormModal')">&times;</span>
                        <div id="dealFormContent">
                            <!-- Deal form will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Deal Quick Edit Modal -->
                <div id="dealQuickEditModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('dealQuickEditModal')">&times;</span>
                        <div id="dealQuickEditContent">
                            <!-- Quick edit form will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .pipeline-container {
                    max-width: 100%;
                    overflow-x: auto;
                }
                .pipeline-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .pipeline-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }
                .pipeline-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .pipeline-controls {
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
                .pipeline-filters {
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

                /* Referral badges */
                .referral-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 0.7em;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .referral-aws {
                    background: #FF9900;
                    color: white;
                }
                .referral-cdw {
                    background: #E31B23;
                    color: white;
                }
                .referral-direct {
                    background: #28a745;
                    color: white;
                }
                .referral-other {
                    background: #6c757d;
                    color: white;
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
                .form-row-triple {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
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
                .referral-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #FF9900;
                }
                .referral-section h4 {
                    margin: 0 0 15px 0;
                    color: #232F3E;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            </style>
        `;
    }

    switchView(view) {
        this.currentView = view;
        this.renderContent();
    }

    updateFilter(filterType, value) {
        this.filters[filterType] = value;
        this.renderContent();
    }

    updateTimeframe(timeframe) {
        this.selectedTimeframe = timeframe;
        this.renderContent();
    }

    resetFilters() {
        this.filters = {
            team: 'all',
            owner: 'all',
            value: 'all',
            closeDate: 'all',
            stage: 'all',
            referralSource: 'all'
        };
        this.selectedTimeframe = 'current-quarter';
        
        // Reset filter controls
        document.getElementById('teamFilter').value = 'all';
        document.getElementById('timeframeFilter').value = 'current-quarter';
        document.getElementById('valueFilter').value = 'all';
        document.getElementById('stageFilter').value = 'all';
        document.getElementById('referralSourceFilter').value = 'all';
        
        this.renderContent();
    }

    renderContent() {
        const container = document.getElementById('pipelineContent');
        if (!container) return;

        switch(this.currentView) {
            case 'kanban':
                this.renderKanbanBoard(container);
                break;
            case 'table':
                this.renderTableView(container);
                break;
            case 'forecast':
                this.renderForecastView(container);
                break;
            case 'analytics':
                this.renderAnalyticsView(container);
                break;
            case 'timeline':
                this.renderTimelineView(container);
                break;
            case 'referrals':
                this.renderReferralAnalysisView(container);
                break;
        }

        this.updateInsights();
    }

    renderKanbanBoard(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #666;">
                <h3>Kanban Board View</h3>
                <p>Advanced kanban board with AWS/CDW referral tracking coming soon!</p>
                <button class="action-btn" onclick="pipelineModule.showDealForm()">+ Add Deal</button>
            </div>
        `;
    }

    renderTableView(container) {
        const deals = this.getFilteredDeals();
        
        container.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Pipeline Table View</h3>
                    <button class="action-btn" onclick="pipelineModule.showDealForm()">+ Add Deal</button>
                </div>
                <p>Showing ${deals.length} deals with referral tracking</p>
                <div style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                    Enhanced table view with AWS/CDW referral columns coming soon!
                </div>
            </div>
        `;
    }

    renderForecastView(container) {
        container.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h3>Forecast Analysis</h3>
                <p>Advanced forecasting with AWS/CDW referral breakdown</p>
                <div style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                    Detailed forecast view with partner performance coming soon!
                </div>
            </div>
        `;
    }

    renderAnalyticsView(container) {
        container.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h3>Pipeline Analytics</h3>
                <p>Comprehensive analytics including referral source performance</p>
                <div style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                    Advanced analytics with AWS/CDW metrics coming soon!
                </div>
            </div>
        `;
    }

    renderTimelineView(container) {
        container.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h3>Deal Timeline</h3>
                <p>Timeline view with referral source tracking</p>
                <div style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                    Timeline view with partner referral indicators coming soon!
                </div>
            </div>
        `;
    }

    renderReferralAnalysisView(container) {
        const deals = this.getFilteredDeals();
        const referralStats = this.calculateReferralStats(deals);
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;" class="aws-metric">
                    <div style="font-size: 2em; font-weight: bold; color: #FF9900;">${(referralStats.awsValue / 1000000).toFixed(1)}M</div>
                    <div style="color: #666;">AWS Referral Value</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;" class="cdw-metric">
                    <div style="font-size: 2em; font-weight: bold; color: #E31B23;">${(referralStats.cdwValue / 1000000).toFixed(1)}M</div>
                    <div style="color: #666;">CDW Referral Value</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;">
                    <div style="font-size: 2em; font-weight: bold; color: #28a745;">${referralStats.awsCount}</div>
                    <div style="color: #666;">AWS Deals</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;">
                    <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${referralStats.cdwCount}</div>
                    <div style="color: #666;">CDW Deals</div>
                </div>
            </div>
            
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h3>🤝 Referral Source Analysis</h3>
                <p>Detailed breakdown of AWS and CDW referral performance</p>
                <div style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                    Advanced referral analysis with team performance, conversion rates, and ROI metrics coming soon!
                </div>
            </div>
        `;
    }

    // Deal Management Methods
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
                                    ${contact.name} (${contact.company})
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
                        <select id="dealStage" name="stage" required onchange="pipelineModule.updateProbabilityFromStage()">
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
                    <div class="form-row-triple">
                        <div class="form-group">
                            <label for="referralSource">Referral Source</label>
                            <select id="referralSource" name="referralSource">
                                <option value="direct" ${!deal || deal.referralSource === 'direct' ? 'selected' : ''}>Direct Sales</option>
                                <option value="aws" ${deal && deal.referralSource === 'aws' ? 'selected' : ''}>AWS Referral</option>
                                <option value="cdw" ${deal && deal.referralSource === 'cdw' ? 'selected' : ''}>CDW Referral</option>
                                <option value="other" ${deal && deal.referralSource === 'other' ? 'selected' : ''}>Other Partner</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="referralType">Referral Type</label>
                            <select id="referralType" name="referralType">
                                <option value="">Select Type</option>
                                <option value="direct-intro" ${deal && deal.referralType === 'direct-intro' ? 'selected' : ''}>Direct Introduction</option>
                                <option value="event-lead" ${deal && deal.referralType === 'event-lead' ? 'selected' : ''}>Event Lead</option>
                                <option value="partner-program" ${deal && deal.referralType === 'partner-program' ? 'selected' : ''}>Partner Program</option>
                                <option value="co-sell" ${deal && deal.referralType === 'co-sell' ? 'selected' : ''}>Co-sell Opportunity</option>
                                <option value="marketplace" ${deal && deal.referralType === 'marketplace' ? 'selected' : ''}>Marketplace Lead</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="awsOpportunityId">AWS Opportunity ID</label>
                            <input type="text" id="awsOpportunityId" name="awsOpportunityId" 
                                   value="${deal ? deal.awsOpportunityId || '' : ''}"
                                   placeholder="AWS Partner Central ID">
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="dealDescription">Description</label>
                    <textarea id="dealDescription" name="description" 
                              placeholder="Enter deal description, notes, or key details...">${deal ? deal.description || '' : ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="action-btn">
                        ${isEdit ? 'Update Deal' : 'Create Deal'}
                    </button>
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('dealFormModal')">
                        Cancel
                    </button>
                    ${isEdit ? `
                        <button type="button" class="action-btn danger" onclick="pipelineModule.deleteDeal('${deal.id}')">
                            Delete Deal
                        </button>
                    ` : ''}
                </div>
            </form>
        `;
        
        document.getElementById('dealFormContent').innerHTML = modalContent;
        
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
            
            // Handle empty referral fields
            if (!dealData.awsOpportunityId) delete dealData.awsOpportunityId;
            
            if (isEdit) {
                DataManager.updateDeal({ ...deal, ...dealData });
                UIHelpers.showNotification('Deal updated successfully', 'success');
            } else {
                DataManager.addDeal(dealData);
                UIHelpers.showNotification('Deal created successfully', 'success');
            }
            
            UIHelpers.closeModal('dealFormModal');
        });
        
        UIHelpers.showModal('dealFormModal');
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

    editDeal(dealId) {
        this.showDealForm(dealId);
    }

    deleteDeal(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;
        
        if (confirm(`Are you sure you want to delete "${deal.name}"? This action cannot be undone.`)) {
            DataManager.deleteDeal(dealId);
            UIHelpers.closeModal('dealFormModal');
            UIHelpers.showNotification('Deal deleted successfully', 'success');
        }
    }

    // Helper methods for referral tracking
    getReferralBadge(deal) {
        if (!deal.referralSource || deal.referralSource === 'direct') return '';
        
        const badges = {
            aws: '<span class="referral-badge referral-aws">AWS</span>',
            cdw: '<span class="referral-badge referral-cdw">CDW</span>',
            other: '<span class="referral-badge referral-other">Partner</span>'
        };
        
        return badges[deal.referralSource] || '';
    }

    // Data processing methods
    getFilteredDeals() {
        let deals = DataManager.getDeals();
        
        // Apply timeframe filter
        if (this.selectedTimeframe !== 'all') {
            const now = new Date();
            let startDate, endDate;
            
            switch(this.selectedTimeframe) {
                case 'current-quarter':
                    const currentQuarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
                    endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
                    break;
                case 'next-quarter':
                    const nextQuarter = Math.floor(now.getMonth() / 3) + 1;
                    startDate = new Date(now.getFullYear(), nextQuarter * 3, 1);
                    endDate = new Date(now.getFullYear(), (nextQuarter + 1) * 3, 0);
                    break;
                case 'this-year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    break;
            }
            
            if (startDate && endDate) {
                deals = deals.filter(deal => {
                    const closeDate = new Date(deal.closeDate);
                    return closeDate >= startDate && closeDate <= endDate;
                });
            }
        }
        
        // Apply referral source filter
        if (this.filters.referralSource !== 'all') {
            deals = deals.filter(deal => {
                const dealSource = deal.referralSource || 'direct';
                return dealSource === this.filters.referralSource;
            });
        }
        
        // Apply value filter
        if (this.filters.value !== 'all') {
            deals = deals.filter(deal => {
                switch(this.filters.value) {
                    case 'enterprise': return deal.value >= 500000;
                    case 'large': return deal.value >= 100000 && deal.value < 500000;
                    case 'medium': return deal.value >= 25000 && deal.value < 100000;
                    case 'small': return deal.value < 25000;
                    default: return true;
                }
            });
        }
        
        // Apply stage filter
        if (this.filters.stage !== 'all') {
            deals = deals.filter(deal => deal.stage === this.filters.stage);
        }
        
        return deals;
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

    getStageOptions() {
        const stages = DataManager.config.dealStages;
        return Object.keys(stages).map(stageId => 
            `<option value="${stageId}">${stages[stageId].name}</option>`
        ).join('');
    }

    calculatePipelineStats(deals) {
        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        const weightedValue = deals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        
        // Calculate quarterly forecast
        const quarterlyDeals = deals.filter(deal => {
            const closeDate = new Date(deal.closeDate);
            const now = new Date();
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
            const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
            return closeDate >= quarterStart && closeDate <= quarterEnd;
        });
        const quarterlyForecast = quarterlyDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        
        return {
            totalValue,
            weightedValue,
            quarterlyForecast,
            totalDeals: deals.length
        };
    }

    calculateReferralStats(deals) {
        const awsDeals = deals.filter(deal => deal.referralSource === 'aws');
        const cdwDeals = deals.filter(deal => deal.referralSource === 'cdw');
        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        
        const awsValue = awsDeals.reduce((sum, deal) => sum + deal.value, 0);
        const cdwValue = cdwDeals.reduce((sum, deal) => sum + deal.value, 0);
        
        return {
            awsCount: awsDeals.length,
            cdwCount: cdwDeals.length,
            awsValue,
            cdwValue,
            awsPercentage: totalValue > 0 ? Math.round((awsValue / totalValue) * 100) : 0,
            cdwPercentage: totalValue > 0 ? Math.round((cdwValue / totalValue) * 100) : 0
        };
    }

    updateInsights() {
        const deals = this.getFilteredDeals();
        const stats = this.calculatePipelineStats(deals);
        const referralStats = this.calculateReferralStats(deals);
        
        // Update the insights bar
        const insightCards = document.querySelectorAll('.insight-card .insight-value');
        if (insightCards.length >= 5) {
            insightCards[0].textContent = `${(stats.totalValue / 1000000).toFixed(1)}M`;
            insightCards[1].textContent = `${(stats.weightedValue / 1000000).toFixed(1)}M`;
            insightCards[2].textContent = `${(referralStats.awsValue / 1000000).toFixed(1)}M (${referralStats.awsCount})`;
            insightCards[3].textContent = `${(referralStats.cdwValue / 1000000).toFixed(1)}M (${referralStats.cdwCount})`;
            insightCards[4].textContent = `${(stats.quarterlyForecast / 1000000).toFixed(1)}M`;
        }
    }

    exportPipeline() {
        const deals = this.getFilteredDeals();
        let csv = 'Deal Name,Contact,Company,Stage,Value,Probability,Close Date,Referral Source,Referral Type,AWS Opportunity ID,Description\n';
        
        deals.forEach(deal => {
            const contact = DataManager.getContactById(deal.contactId);
            const contactName = contact ? contact.name : 'Unknown';
            const company = contact ? contact.company : 'Unknown';
            const stage = DataManager.config.dealStages[deal.stage]?.name || deal.stage;
            
            csv += `"${deal.name}","${contactName}","${company}","${stage}",${deal.value},${deal.probability},"${deal.closeDate}","${deal.referralSource || 'direct'}","${deal.referralType || ''}","${deal.awsOpportunityId || ''}","${deal.description || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pipeline-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        UIHelpers.showNotification('Pipeline exported successfully', 'success');
    }
}

// Create global instance
const pipelineModule = new PipelineModule();
console.log('✅ Enhanced Pipeline module with AWS & CDW referral tracking loaded successfully');
