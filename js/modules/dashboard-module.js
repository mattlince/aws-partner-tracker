// Dashboard Module - Main overview and KPIs
class DashboardModule {
    constructor() {
        this.metrics = {
            totalPipeline: 0,
            totalDeals: 0,
            avgDealSize: 0,
            totalContacts: 0,
            activeTeams: 0,
            recentTouchpoints: 0
        };
    }

    init() {
        console.log('Dashboard module initialized');
        
        // Listen for data changes to update metrics
        DataManager.on('deal:updated', () => this.refreshMetrics());
        DataManager.on('deal:added', () => this.refreshMetrics());
        DataManager.on('contact:updated', () => this.refreshMetrics());
        DataManager.on('contact:added', () => this.refreshMetrics());
        DataManager.on('data:loaded', () => this.refreshMetrics());
    }

    render(container) {
        this.calculateMetrics();
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderCharts();
    }

    calculateMetrics() {
        try {
            // Get data safely
            const deals = DataManager.getDeals ? DataManager.getDeals() : [];
            const contacts = DataManager.getAllContacts ? DataManager.getAllContacts() : [];
            const teams = DataManager.getTeams ? DataManager.getTeams() : {};
            const touchpoints = DataManager.getTouchpoints ? DataManager.getTouchpoints() : [];
            
            // Calculate metrics
            this.metrics.totalPipeline = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            this.metrics.totalDeals = deals.length;
            this.metrics.avgDealSize = deals.length > 0 ? this.metrics.totalPipeline / deals.length : 0;
            this.metrics.totalContacts = contacts.length;
            this.metrics.activeTeams = Object.keys(teams).length;
            
            // Recent touchpoints (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            this.metrics.recentTouchpoints = touchpoints.filter(tp => {
                return new Date(tp.date || tp.createdAt) >= thirtyDaysAgo;
            }).length;
            
        } catch (error) {
            console.error('Error calculating metrics:', error);
            // Set default values on error
            this.metrics = {
                totalPipeline: 0,
                totalDeals: 0,
                avgDealSize: 0,
                totalContacts: 0,
                activeTeams: 0,
                recentTouchpoints: 0
            };
        }
    }

    getHTML() {
        return `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div>
                        <h2>📊 Dashboard Overview</h2>
                        <p>Real-time insights and key performance indicators</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="action-btn" onclick="dashboardModule.refreshData()">
                            🔄 Refresh Data
                        </button>
                        <button class="action-btn secondary" onclick="dashboardModule.exportReport()">
                            📊 Export Report
                        </button>
                    </div>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card pipeline">
                        <div class="kpi-icon">💰</div>
                        <div class="kpi-content">
                            <div class="kpi-value">$${(this.metrics.totalPipeline / 1000000).toFixed(1)}M</div>
                            <div class="kpi-label">Total Pipeline</div>
                            <div class="kpi-change">+12% vs last month</div>
                        </div>
                    </div>

                    <div class="kpi-card deals">
                        <div class="kpi-icon">🚀</div>
                        <div class="kpi-content">
                            <div class="kpi-value">${this.metrics.totalDeals}</div>
                            <div class="kpi-label">Active Deals</div>
                            <div class="kpi-change">+${Math.max(0, this.metrics.totalDeals - 10)} new this month</div>
                        </div>
                    </div>

                    <div class="kpi-card contacts">
                        <div class="kpi-icon">👥</div>
                        <div class="kpi-content">
                            <div class="kpi-value">${this.metrics.totalContacts}</div>
                            <div class="kpi-label">Total Contacts</div>
                            <div class="kpi-change">${this.metrics.activeTeams} teams</div>
                        </div>
                    </div>

                    <div class="kpi-card average">
                        <div class="kpi-icon">📈</div>
                        <div class="kpi-content">
                            <div class="kpi-value">$${(this.metrics.avgDealSize / 1000).toFixed(0)}K</div>
                            <div class="kpi-label">Avg Deal Size</div>
                            <div class="kpi-change">+8% efficiency</div>
                        </div>
                    </div>

                    <div class="kpi-card touchpoints">
                        <div class="kpi-icon">📞</div>
                        <div class="kpi-content">
                            <div class="kpi-value">${this.metrics.recentTouchpoints}</div>
                            <div class="kpi-label">Recent Touchpoints</div>
                            <div class="kpi-change">Last 30 days</div>
                        </div>
                    </div>

                    <div class="kpi-card forecast">
                        <div class="kpi-icon">🎯</div>
                        <div class="kpi-content">
                            <div class="kpi-value">${this.calculateQuarterlyForecast()}%</div>
                            <div class="kpi-label">Quarterly Forecast</div>
                            <div class="kpi-change">On track</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <div class="dashboard-card pipeline-card">
                        <h3>Pipeline by Stage</h3>
                        <div id="pipelineChart" class="chart-container pipeline-chart">
                            ${this.renderPipelineChart()}
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <h3>Team Performance</h3>
                        <div id="teamChart" class="chart-container">
                            ${this.renderTeamPerformance()}
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <h3>Recent Activity</h3>
                        <div class="activity-feed">
                            ${this.renderRecentActivity()}
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <h3>Quick Actions</h3>
                        <div class="quick-actions">
                            <button class="quick-action-btn" onclick="AppController.switchTab('pipeline')">
                                <span class="quick-action-icon">🚀</span>
                                <span>Add New Deal</span>
                            </button>
                            <button class="quick-action-btn" onclick="AppController.switchTab('teams')">
                                <span class="quick-action-icon">👥</span>
                                <span>Add Contact</span>
                            </button>
                            <button class="quick-action-btn" onclick="AppController.switchTab('touchpoints')">
                                <span class="quick-action-icon">📞</span>
                                <span>Log Touchpoint</span>
                            </button>
                            <button class="quick-action-btn" onclick="AppController.switchTab('relationships')">
                                <span class="quick-action-icon">🕸️</span>
                                <span>View Network</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .dashboard-container {
                    max-width: 100%;
                    padding: 0 10px;
                }
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .dashboard-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }
                .dashboard-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .dashboard-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
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
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .kpi-card {
                    background: white;
                    border-radius: 12px;
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    border-left: 4px solid #FF9900;
                    transition: all 0.3s ease;
                    min-height: 80px;
                }
                .kpi-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                }
                .kpi-card.pipeline { border-left-color: #28a745; }
                .kpi-card.deals { border-left-color: #007bff; }
                .kpi-card.contacts { border-left-color: #17a2b8; }
                .kpi-card.average { border-left-color: #ffc107; }
                .kpi-card.touchpoints { border-left-color: #6610f2; }
                .kpi-card.forecast { border-left-color: #e83e8c; }
                .kpi-icon {
                    font-size: 1.5em;
                    opacity: 0.8;
                    flex-shrink: 0;
                }
                .kpi-content {
                    flex: 1;
                    min-width: 0;
                }
                .kpi-value {
                    font-size: 1.4em;
                    font-weight: bold;
                    color: #232F3E;
                    margin-bottom: 2px;
                }
                .kpi-label {
                    font-size: 0.8em;
                    color: #666;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .kpi-change {
                    font-size: 0.75em;
                    color: #28a745;
                    font-weight: 500;
                }
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }
                .dashboard-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    min-height: 250px;
                }
                .dashboard-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                }
                .dashboard-card h3 {
                    margin: 0 0 15px 0;
                    color: #232F3E;
                    font-size: 1.1em;
                }
                .chart-container {
                    height: 180px;
                    overflow-y: auto;
                }
                .pipeline-chart {
                    max-height: 180px;
                    overflow-y: auto;
                    padding-right: 8px;
                }
                .pipeline-chart::-webkit-scrollbar {
                    width: 4px;
                }
                .pipeline-chart::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 2px;
                }
                .pipeline-chart::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 2px;
                }
                .pipeline-chart::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
                .activity-feed {
                    max-height: 180px;
                    overflow-y: auto;
                    padding-right: 8px;
                }
                .activity-feed::-webkit-scrollbar {
                    width: 4px;
                }
                .activity-feed::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 2px;
                }
                .activity-feed::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 2px;
                }
                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                .activity-item:last-child {
                    border-bottom: none;
                }
                .activity-icon {
                    font-size: 1em;
                    opacity: 0.7;
                    flex-shrink: 0;
                }
                .activity-content {
                    flex: 1;
                    min-width: 0;
                }
                .activity-text {
                    font-size: 0.85em;
                    color: #333;
                    margin-bottom: 2px;
                    line-height: 1.3;
                }
                .activity-time {
                    font-size: 0.75em;
                    color: #666;
                }
                .quick-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                .quick-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: left;
                    font-size: 0.85em;
                }
                .quick-action-btn:hover {
                    background: #e9ecef;
                    transform: translateY(-1px);
                }
                .quick-action-icon {
                    font-size: 1em;
                    flex-shrink: 0;
                }
                .pipeline-stage {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 0;
                    border-bottom: 1px solid #eee;
                    min-height: 30px;
                }
                .pipeline-stage:last-child {
                    border-bottom: none;
                }
                .stage-name {
                    min-width: 80px;
                    font-size: 0.8em;
                    color: #333;
                    flex-shrink: 0;
                }
                .stage-bar {
                    flex: 1;
                    height: 6px;
                    background: #e9ecef;
                    border-radius: 3px;
                    margin: 0 8px;
                    overflow: hidden;
                }
                .stage-fill {
                    height: 100%;
                    background: #FF9900;
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }
                .stage-value {
                    min-width: 50px;
                    text-align: right;
                    font-size: 0.8em;
                    font-weight: bold;
                    color: #333;
                    flex-shrink: 0;
                }
                .team-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    margin-bottom: 6px;
                }
                .team-name {
                    font-weight: 500;
                    color: #232F3E;
                    font-size: 0.9em;
                }
                .team-metric {
                    font-size: 0.85em;
                    color: #666;
                    font-weight: bold;
                }
                
                @media (max-width: 768px) {
                    .dashboard-container {
                        padding: 0 5px;
                    }
                    .kpi-grid {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 10px;
                    }
                    .kpi-card {
                        padding: 12px;
                        gap: 8px;
                    }
                    .kpi-icon {
                        font-size: 1.2em;
                    }
                    .kpi-value {
                        font-size: 1.2em;
                    }
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                    .dashboard-card {
                        padding: 15px;
                        min-height: 200px;
                    }
                    .quick-actions {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }

    renderPipelineChart() {
        try {
            const deals = DataManager.getDeals ? DataManager.getDeals() : [];
            const stages = DataManager.config ? DataManager.config.dealStages : {};
            
            if (Object.keys(stages).length === 0) {
                return '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">No pipeline data available</div>';
            }
            
            const maxValue = Math.max(...Object.keys(stages).map(stageId => {
                return deals.filter(deal => deal.stage === stageId).reduce((sum, deal) => sum + (deal.value || 0), 0);
            }), 1);
            
            return Object.keys(stages).map(stageId => {
                const stage = stages[stageId];
                const stageDeals = deals.filter(deal => deal.stage === stageId);
                const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                const percentage = (stageValue / maxValue) * 100;
                
                return `
                    <div class="pipeline-stage">
                        <span class="stage-name">${stage.name}</span>
                        <div class="stage-bar">
                            <div class="stage-fill" style="width: ${percentage}%;"></div>
                        </div>
                        <span class="stage-value">$${(stageValue / 1000).toFixed(0)}K</span>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering pipeline chart:', error);
            return '<div style="color: #dc3545; text-align: center; padding: 20px;">Error loading pipeline data</div>';
        }
    }

    renderTeamPerformance() {
        try {
            const teams = DataManager.getTeams ? DataManager.getTeams() : {};
            const deals = DataManager.getDeals ? DataManager.getDeals() : [];
            const contacts = DataManager.getContacts ? DataManager.getContacts() : {};
            
            if (Object.keys(teams).length === 0) {
                return '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">No team data available</div>';
            }
            
            return Object.keys(teams).slice(0, 5).map(teamId => {
                const team = teams[teamId];
                const teamContacts = contacts[teamId] || [];
                const teamDeals = deals.filter(deal => 
                    teamContacts.some(contact => contact.id === deal.contactId)
                );
                const teamValue = teamDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                
                return `
                    <div class="team-item">
                        <div class="team-name">${team.name}</div>
                        <div class="team-metric">$${(teamValue / 1000).toFixed(0)}K</div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering team performance:', error);
            return '<div style="color: #dc3545; text-align: center; padding: 20px;">Error loading team data</div>';
        }
    }

    renderRecentActivity() {
        try {
            const touchpoints = DataManager.getTouchpoints ? DataManager.getTouchpoints() : [];
            const recentTouchpoints = touchpoints
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                .slice(0, 8);
            
            if (recentTouchpoints.length === 0) {
                return `
                    <div class="activity-item">
                        <div class="activity-icon">📝</div>
                        <div class="activity-content">
                            <div class="activity-text">No recent activity</div>
                            <div class="activity-time">Add touchpoints to see activity</div>
                        </div>
                    </div>
                `;
            }
            
            return recentTouchpoints.map(touchpoint => {
                const contact = DataManager.getContactById ? DataManager.getContactById(touchpoint.contactId) : null;
                const contactName = contact ? contact.name : 'Unknown Contact';
                
                const icons = {
                    'meeting': '🤝',
                    'call': '📞',
                    'email': '📧',
                    'demo': '🖥️',
                    'proposal': '📋'
                };
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon">${icons[touchpoint.type] || '📝'}</div>
                        <div class="activity-content">
                            <div class="activity-text">${touchpoint.subject} with ${contactName}</div>
                            <div class="activity-time">${UIHelpers.formatDate(touchpoint.date || touchpoint.createdAt)}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering recent activity:', error);
            return '<div style="color: #dc3545; text-align: center; padding: 20px;">Error loading activity data</div>';
        }
    }

    calculateQuarterlyForecast() {
        try {
            const deals = DataManager.getDeals ? DataManager.getDeals() : [];
            if (deals.length === 0) return 0;
            
            const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            const weightedValue = deals.reduce((sum, deal) => sum + ((deal.value || 0) * ((deal.probability || 0) / 100)), 0);
            const target = 1000000; // $1M target
            
            return Math.min(Math.round((weightedValue / target) * 100), 100);
        } catch (error) {
            return 0;
        }
    }

    setupEventListeners() {
        // Event listeners are set up through onclick handlers
        console.log('Dashboard event listeners set up');
    }

    renderCharts() {
        // Charts are rendered inline in the HTML
        console.log('Dashboard charts rendered');
    }

    refreshData() {
        this.calculateMetrics();
        const container = document.getElementById('content-area');
        if (container && AppController.currentTab === 'dashboard') {
            this.render(container);
        }
        UIHelpers.showNotification('Dashboard data refreshed', 'success');
    }

    refreshMetrics() {
        // Only refresh if dashboard is currently active
        if (AppController.currentTab === 'dashboard') {
            this.refreshData();
        }
    }

    exportReport() {
        const report = `AWS Partner Tracker Dashboard Report
Generated: ${new Date().toLocaleString()}

Key Metrics:
- Total Pipeline: $${(this.metrics.totalPipeline / 1000000).toFixed(1)}M
- Active Deals: ${this.metrics.totalDeals}
- Average Deal Size: $${(this.metrics.avgDealSize / 1000).toFixed(0)}K
- Total Contacts: ${this.metrics.totalContacts}
- Active Teams: ${this.metrics.activeTeams}
- Recent Touchpoints: ${this.metrics.recentTouchpoints}
- Quarterly Forecast: ${this.calculateQuarterlyForecast()}%`;

        // Create and download text file
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        UIHelpers.showNotification('Dashboard report exported', 'success');
    }
}

// Create global instance
const dashboardModule = new DashboardModule();
console.log('✅ Dashboard module loaded successfully');
