// Pipeline Tracker Module - Visual Kanban Board and Pipeline Management
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
            closeDate: 'all'
        };
    }

    init() {
        console.log('Pipeline module initialized');
        
        // Listen for data changes
        DataManager.on('deal:updated', () => this.renderIfActive());
        DataManager.on('deal:deleted', () => this.renderIfActive());
        DataManager.on('deal:added', () => this.renderIfActive());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
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

        return `
            <div class="pipeline-container">
                <div class="pipeline-header">
                    <div>
                        <h2>Pipeline Tracker</h2>
                        <p>Visual pipeline management • $${(pipelineStats.totalValue / 1000000).toFixed(1)}M total • ${pipelineStats.totalDeals} active deals</p>
                    </div>
                    <div class="pipeline-controls">
                        <button class="view-btn ${this.currentView === 'kanban' ? 'active' : ''}" onclick="pipelineModule.switchView('kanban')">
                            📋 Kanban Board
                        </button>
                        <button class="view-btn ${this.currentView === 'forecast' ? 'active' : ''}" onclick="pipelineModule.switchView('forecast')">
                            📊 Forecast View
                        </button>
                        <button class="view-btn ${this.currentView === 'analytics' ? 'active' : ''}" onclick="pipelineModule.switchView('analytics')">
                            📈 Analytics
                        </button>
                        <button class="view-btn ${this.currentView === 'timeline' ? 'active' : ''}" onclick="pipelineModule.switchView('timeline')">
                            📅 Timeline
                        </button>
                        <button class="action-btn" onclick="dealsModule.showDealForm()">
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
                        <button class="action-btn secondary" onclick="pipelineModule.resetFilters()">Reset Filters</button>
                    </div>
                </div>

                <div class="pipeline-insights">
                    <div class="insight-card">
                        <span class="insight-label">Total Pipeline</span>
                        <span class="insight-value">$${(pipelineStats.totalValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Weighted Pipeline</span>
                        <span class="insight-value">$${(pipelineStats.weightedValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Average Deal Size</span>
                        <span class="insight-value">$${(pipelineStats.avgDealSize / 1000).toFixed(0)}K</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Close Rate</span>
                        <span class="insight-value">${pipelineStats.closeRate}%</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">This Quarter</span>
                        <span class="insight-value">$${(pipelineStats.quarterlyForecast / 1000000).toFixed(1)}M</span>
                    </div>
                </div>

                <div id="pipelineContent">
                    <!-- Pipeline content will be populated here -->
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
                .kanban-board {
                    display: flex;
                    gap: 20px;
                    overflow-x: auto;
                    padding-bottom: 20px;
                    min-height: 600px;
                }
                .kanban-column {
                    flex: 0 0 300px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 15px;
                    border: 2px dashed transparent;
                    transition: all 0.3s ease;
                }
                .kanban-column.drag-over {
                    border-color: #FF9900;
                    background: #fff8f0;
                }
                .column-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #dee2e6;
                }
                .column-title {
                    font-weight: bold;
                    color: #232F3E;
                    font-size: 1.1em;
                }
                .column-stats {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    font-size: 0.8em;
                    color: #666;
                }
                .deal-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    min-height: 400px;
                }
                .deal-card {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: grab;
                    transition: all 0.3s ease;
                    border-left: 4px solid #FF9900;
                }
                .deal-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }
                .deal-card:active {
                    cursor: grabbing;
                }
                .deal-card.dragging {
                    opacity: 0.5;
                    transform: rotate(5deg);
                }
                .deal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                .deal-name {
                    font-weight: bold;
                    color: #232F3E;
                    font-size: 0.95em;
                    line-height: 1.3;
                    margin: 0;
                }
                .deal-value {
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: bold;
                }
                .deal-info {
                    margin-bottom: 10px;
                }
                .deal-contact {
                    font-size: 0.85em;
                    color: #666;
                    margin-bottom: 4px;
                }
                .deal-close-date {
                    font-size: 0.8em;
                    color: #666;
                    margin-bottom: 8px;
                }
                .deal-probability {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .probability-bar {
                    flex: 1;
                    height: 4px;
                    background: #e9ecef;
                    border-radius: 2px;
                    overflow: hidden;
                }
                .probability-fill {
                    height: 100%;
                    background: #28a745;
                    transition: width 0.3s ease;
                }
                .probability-text {
                    font-size: 0.8em;
                    font-weight: bold;
                    color: #666;
                }
                .deal-actions {
                    display: flex;
                    gap: 5px;
                    margin-top: 10px;
                }
                .deal-action-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75em;
                    transition: all 0.3s ease;
                }
                .deal-action-btn:hover {
                    background: #e9ecef;
                }
                .deal-urgency {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid white;
                }
                .urgency-high { background: #dc3545; }
                .urgency-medium { background: #ffc107; }
                .urgency-low { background: #28a745; }
                .forecast-view {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                }
                .forecast-card {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }
                .forecast-chart {
                    height: 300px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    font-style: italic;
                    margin-top: 15px;
                }
                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }
                .analytics-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .timeline-view {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .timeline-month {
                    border-bottom: 1px solid #eee;
                    padding: 15px 0;
                }
                .timeline-header {
                    font-weight: bold;
                    color: #232F3E;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .timeline-deals {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 10px;
                }
                .timeline-deal {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 6px;
                    border-left: 3px solid #FF9900;
                    font-size: 0.9em;
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
                .stage-prequalified { border-left-color: #6c757d; }
                .stage-qualified { border-left-color: #17a2b8; }
                .stage-proposal-development { border-left-color: #007bff; }
                .stage-proposal-delivered { border-left-color: #6610f2; }
                .stage-legal { border-left-color: #e83e8c; }
                .stage-out-for-signature { border-left-color: #fd7e14; }
                .stage-signed { border-left-color: #20c997; }
                .stage-deal-won { border-left-color: #28a745; }
                .stage-deal-lost { border-left-color: #dc3545; }
            </style>
        `;
    }

    setupEventListeners() {
        // Event listeners will be set up through onclick handlers
        // Drag and drop will be set up in the kanban rendering
    }

    switchView(view) {
        this.currentView = view;
        const container = document.getElementById('content-area');
        if (container) {
            this.render(container);
        }
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
            closeDate: 'all'
        };
        this.selectedTimeframe = 'current-quarter';
        
        // Reset filter controls
        document.getElementById('teamFilter').value = 'all';
        document.getElementById('timeframeFilter').value = 'current-quarter';
        document.getElementById('valueFilter').value = 'all';
        
        this.renderContent();
    }

    renderContent() {
        const container = document.getElementById('pipelineContent');
        if (!container) return;

        switch(this.currentView) {
            case 'kanban':
                this.renderKanbanBoard(container);
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
        }

        this.updateInsights();
    }

    renderKanbanBoard(container) {
        const dealStages = DataManager.config.dealStages;
        const deals = this.getFilteredDeals();
        
        // Group deals by stage
        const dealsByStage = {};
        Object.keys(dealStages).forEach(stage => {
            dealsByStage[stage] = deals.filter(deal => deal.stage === stage);
        });

        const kanbanHTML = Object.keys(dealStages).map(stageId => {
            const stage = dealStages[stageId];
            const stageDeals = dealsByStage[stageId] || [];
            const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
            const weightedValue = stageDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);

            return `
                <div class="kanban-column" 
                     data-stage="${stageId}"
                     ondrop="pipelineModule.handleDrop(event)"
                     ondragover="pipelineModule.handleDragOver(event)"
                     ondragleave="pipelineModule.handleDragLeave(event)">
                    <div class="column-header">
                        <div class="column-title">${stage.name}</div>
                        <div class="column-stats">
                            <div>${stageDeals.length} deals</div>
                            <div>$${(stageValue / 1000).toFixed(0)}K total</div>
                            <div>$${(weightedValue / 1000).toFixed(0)}K weighted</div>
                        </div>
                    </div>
                    <div class="deal-cards">
                        ${stageDeals.map(deal => this.renderDealCard(deal)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="kanban-board">
                ${kanbanHTML}
            </div>
        `;

        // Set up drag and drop
        this.setupDragAndDrop();
    }

    renderDealCard(deal) {
        const contact = DataManager.getContactById(deal.contactId);
        const contactName = contact ? contact.name : 'Unknown Contact';
        const company = contact ? contact.company : 'Unknown Company';
        const urgency = this.calculateUrgency(deal);
        
        return `
            <div class="deal-card stage-${deal.stage}" 
                 draggable="true" 
                 data-deal-id="${deal.id}"
                 ondragstart="pipelineModule.handleDragStart(event)">
                <div class="deal-urgency urgency-${urgency}"></div>
                <div class="deal-header">
                    <h4 class="deal-name">${deal.name}</h4>
                    <span class="deal-value">$${(deal.value / 1000).toFixed(0)}K</span>
                </div>
                <div class="deal-info">
                    <div class="deal-contact">${contactName} • ${company}</div>
                    <div class="deal-close-date">Close: ${UIHelpers.formatDate(deal.closeDate)}</div>
                </div>
                <div class="deal-probability">
                    <div class="probability-bar">
                        <div class="probability-fill" style="width: ${deal.probability}%;"></div>
                    </div>
                    <span class="probability-text">${deal.probability}%</span>
                </div>
                <div class="deal-actions">
                    <button class="deal-action-btn" onclick="event.stopPropagation(); pipelineModule.quickEditDeal('${deal.id}')">Edit</button>
                    <button class="deal-action-btn" onclick="event.stopPropagation(); dealsModule.editDeal('${deal.id}')">Details</button>
                    <button class="deal-action-btn" onclick="event.stopPropagation(); pipelineModule.logActivity('${deal.id}')">Activity</button>
                </div>
            </div>
        `;
    }

    renderForecastView(container) {
        const deals = this.getFilteredDeals();
        const forecastData = this.calculateForecastData(deals);
        
        container.innerHTML = `
            <div class="forecast-view">
                <div class="forecast-card">
                    <h3>Quarterly Forecast</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                            <div style="font-size: 1.8em; font-weight: bold; color: #1565c0;">$${(forecastData.bestCase / 1000000).toFixed(1)}M</div>
                            <div style="color: #666;">Best Case</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                            <div style="font-size: 1.8em; font-weight: bold; color: #2e7d32;">$${(forecastData.mostLikely / 1000000).toFixed(1)}M</div>
                            <div style="color: #666;">Most Likely</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #fff3e0; border-radius: 8px;">
                            <div style="font-size: 1.8em; font-weight: bold; color: #ef6c00;">$${(forecastData.worstCase / 1000000).toFixed(1)}M</div>
                            <div style="color: #666;">Worst Case</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #fce4ec; border-radius: 8px;">
                            <div style="font-size: 1.8em; font-weight: bold; color: #c2185b;">${forecastData.dealsToClose}</div>
                            <div style="color: #666;">Deals to Close</div>
                        </div>
                    </div>
                    <div class="forecast-chart">Forecast trend chart would go here</div>
                </div>
                
                <div class="forecast-card">
                    <h3>Pipeline Health</h3>
                    <div style="margin-bottom: 20px;">
                        ${forecastData.healthMetrics.map(metric => `
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                                <span>${metric.name}</span>
                                <span style="font-weight: bold; color: ${metric.color};">${metric.value}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="forecast-chart">Pipeline health visualization would go here</div>
                </div>
            </div>
        `;
    }

    renderAnalyticsView(container) {
        const deals = this.getFilteredDeals();
        const analytics = this.calculateAnalytics(deals);
        
        container.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Conversion Rates</h3>
                    <div style="margin-top: 15px;">
                        ${analytics.conversionRates.map(rate => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span>${rate.stage}</span>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 100px; height: 6px; background: #e9ecef; border-radius: 3px;">
                                        <div style="width: ${rate.percentage}%; height: 100%; background: #FF9900; border-radius: 3px;"></div>
                                    </div>
                                    <span style="font-weight: bold;">${rate.percentage}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Deal Velocity</h3>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 2em; font-weight: bold; color: #FF9900;">${analytics.avgDealCycle} days</div>
                        <div style="color: #666; margin-bottom: 15px;">Average Deal Cycle</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: center;">
                            <div>
                                <div style="font-size: 1.2em; font-weight: bold;">${analytics.fastestDeal} days</div>
                                <div style="font-size: 0.8em; color: #666;">Fastest</div>
                            </div>
                            <div>
                                <div style="font-size: 1.2em; font-weight: bold;">${analytics.slowestDeal} days</div>
                                <div style="font-size: 0.8em; color: #666;">Slowest</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Win/Loss Analysis</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 2em; font-weight: bold; color: #28a745;">${analytics.winRate}%</div>
                            <div style="color: #666;">Win Rate</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${analytics.lossRate}%</div>
                            <div style="color: #666;">Loss Rate</div>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <strong>Top Win Reasons:</strong>
                        <ul style="margin: 10px 0; color: #666;">
                            <li>Better AWS integration capabilities</li>
                            <li>Competitive pricing and ROI</li>
                            <li>Strong technical support</li>
                        </ul>
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Pipeline by Team</h3>
                    <div style="margin-top: 15px;">
                        ${analytics.teamPerformance.map(team => `
                            <div style="margin-bottom: 15px;">
                                <div style="display: flex; justify-content: between; margin-bottom: 5px;">
                                    <span style="font-weight: bold;">${team.name}</span>
                                    <span>${(team.value / 1000).toFixed(0)}K</span>
                                </div>
                                <div style="width: 100%; height: 8px; background: #e9ecef; border-radius: 4px;">
                                    <div style="width: ${team.percentage}%; height: 100%; background: ${team.color}; border-radius: 4px;"></div>
                                </div>
                                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">${team.deals} deals • ${team.winRate}% win rate</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Deal Size Distribution</h3>
                    <div style="margin-top: 15px;">
                        ${analytics.dealSizeDistribution.map(bucket => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                                <span>${bucket.range}</span>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 0.9em; color: #666;">${bucket.count} deals</span>
                                    <span style="font-weight: bold;">${bucket.percentage}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Monthly Trends</h3>
                    <div style="height: 200px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666; font-style: italic; margin-top: 15px;">
                        Monthly pipeline trends chart would go here
                    </div>
                </div>
            </div>
        `;
    }

    renderTimelineView(container) {
        const deals = this.getFilteredDeals();
        const timelineData = this.organizeByMonth(deals);
        
        container.innerHTML = `
            <div class="timeline-view">
                <h3 style="margin-bottom: 20px;">Deal Close Timeline</h3>
                ${timelineData.map(month => `
                    <div class="timeline-month">
                        <div class="timeline-header">
                            <span>${month.monthName} ${month.year}</span>
                            <span style="color: #666;">${(month.totalValue / 1000000).toFixed(1)}M • ${month.deals.length} deals</span>
                        </div>
                        <div class="timeline-deals">
                            ${month.deals.map(deal => {
                                const contact = DataManager.getContactById(deal.contactId);
                                return `
                                    <div class="timeline-deal" onclick="dealsModule.editDeal('${deal.id}')">
                                        <strong>${deal.name}</strong><br>
                                        <span style="color: #666;">${contact ? contact.name : 'Unknown'} • ${(deal.value / 1000).toFixed(0)}K • ${deal.probability}%</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Drag and Drop functionality
    setupDragAndDrop() {
        const dealCards = document.querySelectorAll('.deal-card');
        dealCards.forEach(card => {
            card.addEventListener('dragstart', (e) => this.handleDragStart(e));
            card.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });
    }

    handleDragStart(event) {
        this.draggedDeal = event.target.dataset.dealId;
        event.target.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(event) {
        event.target.classList.remove('dragging');
        this.draggedDeal = null;
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        if (!this.draggedDeal) return;
        
        const newStage = event.currentTarget.dataset.stage;
        const deal = DataManager.getDeals().find(d => d.id === this.draggedDeal);
        
        if (deal && deal.stage !== newStage) {
            // Update deal stage and probability
            const stageConfig = DataManager.config.dealStages[newStage];
            deal.stage = newStage;
            deal.probability = stageConfig.probability;
            
            DataManager.updateDeal(deal);
            UIHelpers.showNotification(`Deal moved to ${stageConfig.name}`);
        }
    }

    // Quick edit functionality
    quickEditDeal(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;
        
        const contact = DataManager.getContactById(deal.contactId);
        const stages = DataManager.config.dealStages;
        
        const modalContent = `
            <h3>Quick Edit: ${deal.name}</h3>
            <form id="quickEditForm">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Deal Value:</label>
                        <input type="number" id="dealValue" value="${deal.value}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Probability:</label>
                        <input type="number" id="dealProbability" value="${deal.probability}" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Stage:</label>
                        <select id="dealStage" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                            ${Object.keys(stages).map(stageId => `
                                <option value="${stageId}" ${deal.stage === stageId ? 'selected' : ''}>
                                    ${stages[stageId].name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Close Date:</label>
                        <input type="date" id="dealCloseDate" value="${deal.closeDate}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Notes:</label>
                    <textarea id="dealNotes" style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="Update notes...">${deal.description || ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button type="submit" class="action-btn">Save Changes</button>
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('dealQuickEditModal')">Cancel</button>
                </div>
            </form>
        `;
        
        document.getElementById('dealQuickEditContent').innerHTML = modalContent;
        
        // Handle form submission
        document.getElementById('quickEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedDeal = {
                ...deal,
                value: parseFloat(document.getElementById('dealValue').value),
                probability: parseInt(document.getElementById('dealProbability').value),
                stage: document.getElementById('dealStage').value,
                closeDate: document.getElementById('dealCloseDate').value,
                description: document.getElementById('dealNotes').value
            };
            
            DataManager.updateDeal(updatedDeal);
            UIHelpers.closeModal('dealQuickEditModal');
            UIHelpers.showNotification('Deal updated successfully');
        });
        
        UIHelpers.showModal('dealQuickEditModal');
    }

    logActivity(dealId) {
        // This would integrate with the touchpoints module
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (deal) {
            const contact = DataManager.getContactById(deal.contactId);
            if (contact && typeof touchpointsModule !== 'undefined') {
                touchpointsModule.addTouchpointFor(deal.contactId, `Deal: ${deal.name}`);
            }
        }
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
        
        // Apply team filter
        if (this.filters.team !== 'all') {
            const teamContacts = DataManager.getContactsByTeam(this.filters.team);
            const teamContactIds = teamContacts.map(c => c.id);
            deals = deals.filter(deal => teamContactIds.includes(deal.contactId));
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
        
        return deals;
    }

    getTeamOptions() {
        const teams = DataManager.getTeams();
        return Object.keys(teams).map(teamId => 
            `<option value="${teamId}">${teams[teamId].name}</option>`
        ).join('');
    }

    calculatePipelineStats(deals) {
        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        const weightedValue = deals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
        
        // Calculate close rate
        const closedDeals = deals.filter(deal => ['deal-won', 'deal-lost'].includes(deal.stage));
        const wonDeals = deals.filter(deal => deal.stage === 'deal-won');
        const closeRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
        
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
            avgDealSize,
            closeRate,
            quarterlyForecast,
            totalDeals: deals.length
        };
    }

    calculateForecastData(deals) {
        const highProbDeals = deals.filter(deal => deal.probability >= 75);
        const mediumProbDeals = deals.filter(deal => deal.probability >= 25 && deal.probability < 75);
        const lowProbDeals = deals.filter(deal => deal.probability < 25);
        
        const bestCase = deals.reduce((sum, deal) => sum + deal.value, 0);
        const mostLikely = deals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        const worstCase = highProbDeals.reduce((sum, deal) => sum + (deal.value * 0.5), 0);
        
        const dealsToClose = deals.filter(deal => deal.probability >= 50).length;
        
        const healthMetrics = [
            { name: 'Pipeline Coverage', value: '2.3x', color: '#28a745' },
            { name: 'Average Deal Age', value: '45 days', color: '#ffc107' },
            { name: 'Stalled Deals', value: '12%', color: '#dc3545' },
            { name: 'New Deals (30d)', value: '8', color: '#17a2b8' }
        ];
        
        return {
            bestCase,
            mostLikely,
            worstCase,
            dealsToClose,
            healthMetrics
        };
    }

    calculateAnalytics(deals) {
        const stages = DataManager.config.dealStages;
        const stageNames = Object.keys(stages);
        
        // Conversion rates between stages
        const conversionRates = stageNames.map((stage, index) => {
            if (index === 0) return { stage: stages[stage].name, percentage: 100 };
            
            const currentStageDeals = deals.filter(d => d.stage === stage).length;
            const previousStageDeals = deals.filter(d => d.stage === stageNames[index - 1]).length;
            const percentage = previousStageDeals > 0 ? Math.round((currentStageDeals / previousStageDeals) * 100) : 0;
            
            return { stage: stages[stage].name, percentage };
        });
        
        // Deal velocity
        const avgDealCycle = 67; // This would be calculated from actual deal data
        const fastestDeal = 21;
        const slowestDeal = 180;
        
        // Win/Loss rates
        const closedDeals = deals.filter(deal => ['deal-won', 'deal-lost'].includes(deal.stage));
        const wonDeals = deals.filter(deal => deal.stage === 'deal-won');
        const winRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
        const lossRate = 100 - winRate;
        
        // Team performance
        const teams = DataManager.getTeams();
        const teamPerformance = Object.keys(teams).map(teamId => {
            const team = teams[teamId];
            const teamContacts = DataManager.getContactsByTeam(teamId);
            const teamContactIds = teamContacts.map(c => c.id);
            const teamDeals = deals.filter(deal => teamContactIds.includes(deal.contactId));
            const teamValue = teamDeals.reduce((sum, deal) => sum + deal.value, 0);
            const maxValue = Math.max(...Object.keys(teams).map(id => {
                const contacts = DataManager.getContactsByTeam(id);
                const contactIds = contacts.map(c => c.id);
                const deals = DataManager.getDeals().filter(deal => contactIds.includes(deal.contactId));
                return deals.reduce((sum, deal) => sum + deal.value, 0);
            }));
            
            return {
                name: team.name,
                value: teamValue,
                deals: teamDeals.length,
                percentage: maxValue > 0 ? Math.round((teamValue / maxValue) * 100) : 0,
                color: team.color,
                winRate: 75 // This would be calculated from actual data
            };
        });
        
        // Deal size distribution
        const dealSizeDistribution = [
            { range: '$500K+', count: deals.filter(d => d.value >= 500000).length, percentage: 0 },
            { range: '$100K-$500K', count: deals.filter(d => d.value >= 100000 && d.value < 500000).length, percentage: 0 },
            { range: '$25K-$100K', count: deals.filter(d => d.value >= 25000 && d.value < 100000).length, percentage: 0 },
            { range: 'Under $25K', count: deals.filter(d => d.value < 25000).length, percentage: 0 }
        ];
        
        dealSizeDistribution.forEach(bucket => {
            bucket.percentage = deals.length > 0 ? Math.round((bucket.count / deals.length) * 100) : 0;
        });
        
        return {
            conversionRates,
            avgDealCycle,
            fastestDeal,
            slowestDeal,
            winRate,
            lossRate,
            teamPerformance,
            dealSizeDistribution
        };
    }

    organizeByMonth(deals) {
        const months = {};
        
        deals.forEach(deal => {
            const closeDate = new Date(deal.closeDate);
            const monthKey = `${closeDate.getFullYear()}-${closeDate.getMonth()}`;
            
            if (!months[monthKey]) {
                months[monthKey] = {
                    monthName: closeDate.toLocaleDateString('en-US', { month: 'long' }),
                    year: closeDate.getFullYear(),
                    deals: [],
                    totalValue: 0
                };
            }
            
            months[monthKey].deals.push(deal);
            months[monthKey].totalValue += deal.value;
        });
        
        return Object.values(months).sort((a, b) => new Date(`${a.monthName} ${a.year}`) - new Date(`${b.monthName} ${b.year}`));
    }

    calculateUrgency(deal) {
        const closeDate = new Date(deal.closeDate);
        const today = new Date();
        const daysUntilClose = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilClose <= 7) return 'high';
        if (daysUntilClose <= 30) return 'medium';
        return 'low';
    }

    updateInsights() {
        const deals = this.getFilteredDeals();
        const stats = this.calculatePipelineStats(deals);
        
        // Update the insights bar
        const insightCards = document.querySelectorAll('.insight-card .insight-value');
        if (insightCards.length >= 5) {
            insightCards[0].textContent = `${(stats.totalValue / 1000000).toFixed(1)}M`;
            insightCards[1].textContent = `${(stats.weightedValue / 1000000).toFixed(1)}M`;
            insightCards[2].textContent = `${(stats.avgDealSize / 1000).toFixed(0)}K`;
            insightCards[3].textContent = `${stats.closeRate}%`;
            insightCards[4].textContent = `${(stats.quarterlyForecast / 1000000).toFixed(1)}M`;
        }
    }

    exportPipeline() {
        const deals = this.getFilteredDeals();
        let csv = 'Deal Name,Contact,Company,Stage,Value,Probability,Close Date,Description\n';
        
        deals.forEach(deal => {
            const contact = DataManager.getContactById(deal.contactId);
            const contactName = contact ? contact.name : 'Unknown';
            const company = contact ? contact.company : 'Unknown';
            const stage = DataManager.config.dealStages[deal.stage]?.name || deal.stage;
            
            csv += `"${deal.name}","${contactName}","${company}","${stage}",${deal.value},${deal.probability},"${deal.closeDate}","${deal.description || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pipeline-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        UIHelpers.showNotification('Pipeline exported successfully');
    }

    // Event handler for data changes from other modules
    onEvent(eventType, data) {
        switch(eventType) {
            case 'deal:updated':
            case 'deal:deleted':
            case 'deal:added':
                this.renderIfActive();
                break;
        }
    }
}

// Create global instance
const pipelineModule = new PipelineModule();
