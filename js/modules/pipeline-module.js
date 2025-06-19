// Working Pipeline Module - Simple Version
class PipelineModule {
    constructor() {
        this.currentView = 'kanban';
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
        const deals = DataManager.getDeals() || [];
        const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        return `
            <div class="pipeline-container">
                <div class="pipeline-header">
                    <div>
                        <h2>🚀 Pipeline Management</h2>
                        <p>Complete deal lifecycle • $${(totalValue / 1000000).toFixed(1)}M total • ${deals.length} active deals</p>
                    </div>
                    <div class="pipeline-controls">
                        <button class="view-btn ${this.currentView === 'kanban' ? 'active' : ''}" onclick="pipelineModule.switchView('kanban')">
                            📋 Kanban Board
                        </button>
                        <button class="view-btn ${this.currentView === 'table' ? 'active' : ''}" onclick="pipelineModule.switchView('table')">
                            📊 Table View
                        </button>
                        <button class="action-btn" onclick="pipelineModule.showDealForm()">
                            + Add Deal
                        </button>
                    </div>
                </div>

                <div class="pipeline-insights">
                    <div class="insight-card">
                        <span class="insight-label">Total Pipeline</span>
                        <span class="insight-value">$${(totalValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Active Deals</span>
                        <span class="insight-value">${deals.length}</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Average Deal Size</span>
                        <span class="insight-value">$${deals.length > 0 ? ((totalValue / deals.length) / 1000).toFixed(0) : 0}K</span>
                    </div>
                </div>

                <div id="pipelineContent">
                    <!-- Pipeline content will be populated here -->
                </div>
            </div>

            <style>
                .pipeline-container {
                    max-width: 100%;
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
            </style>
        `;
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
            default:
                this.renderKanbanBoard(container);
        }
    }

    renderKanbanBoard(container) {
        const deals = DataManager.getDeals() || [];
        const dealStages = DataManager.config.dealStages;
        
        // Group deals by stage
        const dealsByStage = {};
        Object.keys(dealStages).forEach(stage => {
            dealsByStage[stage] = deals.filter(deal => deal.stage === stage);
        });

        const kanbanHTML = Object.keys(dealStages).map(stageId => {
            const stage = dealStages[stageId];
            const stageDeals = dealsByStage[stageId] || [];
            const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

            return `
                <div class="kanban-column" style="flex: 0 0 300px; background: #f8f9fa; border-radius: 12px; padding: 15px; margin-right: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #dee2e6;">
                        <div style="font-weight: bold; color: #232F3E; font-size: 1.1em;">${stage.name}</div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; font-size: 0.8em; color: #666;">
                            <div>${stageDeals.length} deals</div>
                            <div>$${(stageValue / 1000).toFixed(0)}K</div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; min-height: 300px;">
                        ${stageDeals.map(deal => this.renderDealCard(deal)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px;">
                ${kanbanHTML}
            </div>
        `;
    }

    renderDealCard(deal) {
        const contact = DataManager.getContactById ? DataManager.getContactById(deal.contactId) : null;
        const contactName = contact ? contact.name : 'Unknown Contact';
        const company = contact ? contact.company : 'Unknown Company';
        
        return `
            <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s ease; border-left: 4px solid #FF9900;" 
                 onclick="pipelineModule.editDeal('${deal.id}')">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <h4 style="font-weight: bold; color: #232F3E; font-size: 0.95em; line-height: 1.3; margin: 0;">${deal.name}</h4>
                    <span style="background: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">$${((deal.value || 0) / 1000).toFixed(0)}K</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">${contactName} • ${company}</div>
                    <div style="font-size: 0.8em; color: #666;">Close: ${UIHelpers.formatDate(deal.closeDate)}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; background: #28a745; width: ${deal.probability || 0}%; transition: width 0.3s ease;"></div>
                    </div>
                    <span style="font-size: 0.8em; font-weight: bold; color: #666;">${deal.probability || 0}%</span>
                </div>
            </div>
        `;
    }

    renderTableView(container) {
        const deals = DataManager.getDeals() || [];
        
        container.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h3>Deal Table View</h3>
                <p>Showing ${deals.length} deals</p>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <thead>
                            <tr style="background: #232F3E; color: white;">
                                <th style="padding: 12px; text-align: left;">Deal Name</th>
                                <th style="padding: 12px; text-align: left;">Contact</th>
                                <th style="padding: 12px; text-align: left;">Value</th>
                                <th style="padding: 12px; text-align: left;">Stage</th>
                                <th style="padding: 12px; text-align: left;">Close Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${deals.map(deal => {
                                const contact = DataManager.getContactById ? DataManager.getContactById(deal.contactId) : null;
                                const contactName = contact ? contact.name : 'Unknown';
                                const stage = DataManager.config.dealStages[deal.stage];
                                return `
                                    <tr style="cursor: pointer; border-bottom: 1px solid #eee;" onclick="pipelineModule.editDeal('${deal.id}')">
                                        <td style="padding: 12px; font-weight: bold;">${deal.name}</td>
                                        <td style="padding: 12px;">${contactName}</td>
                                        <td style="padding: 12px; font-weight: bold; color: #28a745;">$${((deal.value || 0) / 1000).toFixed(0)}K</td>
                                        <td style="padding: 12px;">${stage ? stage.name : deal.stage}</td>
                                        <td style="padding: 12px;">${UIHelpers.formatDate(deal.closeDate)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    switchView(view) {
        this.currentView = view;
        this.renderContent();
    }

    showDealForm() {
        UIHelpers.showNotification('Deal form coming soon!', 'info');
    }

    editDeal(dealId) {
        UIHelpers.showNotification('Deal editing coming soon!', 'info');
    }
}

// Create global instance
const pipelineModule = new PipelineModule();
console.log('✅ Pipeline module loaded successfully');
