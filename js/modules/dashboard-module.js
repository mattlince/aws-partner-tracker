// Enhanced Dashboard Module - Unified Command Center with Touchpoint Analytics
class DashboardModule {
    constructor() {
        this.refreshInterval = null;
        this.currentTimeframe = 'week';
        this.selectedMetrics = {
            touchpoints: true,
            deals: true,
            contacts: true,
            teams: true,
            performance: true
        };
        this.charts = {};
    }

    init() {
        console.log('Enhanced Dashboard module with touchpoint analytics initialized');
        
        // 🎯 KEY INTEGRATION: Subscribe to all centralized events
        if (typeof window.subscribeTouchpoints === 'function') {
            window.subscribeTouchpoints('dashboardModule', (eventType, data) => {
                console.log(`Dashboard received ${eventType}:`, data);
                
                // Refresh relevant widgets when data changes
                switch(eventType) {
                    case 'touchpoint:logged':
                    case 'touchpoint:updated':
                    case 'touchpoint:deleted':
                        this.refreshTouchpointWidgets();
                        break;
                }
            });
        }
        
        // Listen for data changes from all modules
        DataManager.on('deal:updated', () => this.refreshDealWidgets());
        DataManager.on('deal:added', () => this.refreshDealWidgets());
        DataManager.on('contact:updated', () => this.refreshContactWidgets());
        DataManager.on('contact:added', () => this.refreshContactWidgets());
        DataManager.on('team-member:added', () => this.refreshTeamWidgets());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.startAutoRefresh();
        this.renderAllWidgets();
    }

    renderIfActive() {
        if (AppController.currentTab === 'dashboard') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        return `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div>
                        <h2>📊 Mission Control Dashboard</h2>
                        <p>Real-time insights across your entire partner ecosystem • Last updated: <span id="lastUpdated">${new Date().toLocaleTimeString()}</span></p>
                    </div>
                    <div class="dashboard-controls">
                        <button class="timeframe-btn ${this.currentTimeframe === 'day' ? 'active' : ''}" onclick="dashboardModule.setTimeframe('day')">
                            Today
                        </button>
                        <button class="timeframe-btn ${this.currentTimeframe === 'week' ? 'active' : ''}" onclick="dashboardModule.setTimeframe('week')">
                            This Week
                        </button>
                        <button class="timeframe-btn ${this.currentTimeframe === 'month' ? 'active' : ''}" onclick="dashboardModule.setTimeframe('month')">
                            This Month
                        </button>
                        <button class="timeframe-btn ${this.currentTimeframe === 'quarter' ? 'active' : ''}" onclick="dashboardModule.setTimeframe('quarter')">
                            This Quarter
                        </button>
                        <button class="action-btn secondary" onclick="dashboardModule.refreshDashboard()">
                            🔄 Refresh
                        </button>
                        <button class="action-btn secondary" onclick="dashboardModule.exportDashboard()">
                            📥 Export Report
                        </button>
                    </div>
                </div>

                <!-- Quick Actions Bar -->
                <div class="quick-actions">
                    <button class="quick-action-btn" onclick="contactsModule?.showContactForm?.(); AppController.switchTab('contacts')">
                        <div class="quick-icon">👤</div>
                        <span>Add Contact</span>
                    </button>
                    <button class="quick-action-btn" onclick="dealsModule?.addNewDeal?.(); AppController.switchTab('deals')">
                        <div class="quick-icon">💼</div>
                        <span>Add Deal</span>
                    </button>
                    <button class="quick-action-btn" onclick="touchpointTracker?.showAddTouchpointModal?.()">
                        <div class="quick-icon">📞</div>
                        <span>Log Touchpoint</span>
                    </button>
                    <button class="quick-action-btn" onclick="teamsModule?.addTeamMember?.(); AppController.switchTab('teams')">
                        <div class="quick-icon">👥</div>
                        <span>Add Team Member</span>
                    </button>
                    <button class="quick-action-btn" onclick="AppController.switchTab('touchpoints')">
                        <div class="quick-icon">📈</div>
                        <span>View Analytics</span>
                    </button>
                </div>

                <!-- Alert Banner -->
                <div id="alertBanner" class="alert-banner" style="display: none;">
                    <div id="alertContent"></div>
                    <button onclick="dashboardModule.dismissAlert()" class="alert-close">×</button>
                </div>

                <!-- Key Metrics Overview -->
                <div class="metrics-overview">
                    <div class="metric-card primary">
                        <div class="metric-icon">💰</div>
                        <div class="metric-content">
                            <div class="metric-value" id="totalPipeline">$0M</div>
                            <div class="metric-label">Total Pipeline</div>
                            <div class="metric-change" id="pipelineChange">--</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">📞</div>
                        <div class="metric-content">
                            <div class="metric-value" id="totalTouchpoints">0</div>
                            <div class="metric-label">Touchpoints</div>
                            <div class="metric-change" id="touchpointsChange">--</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">👥</div>
                        <div class="metric-content">
                            <div class="metric-value" id="activeContacts">0</div>
                            <div class="metric-label">Active Contacts</div>
                            <div class="metric-change" id="contactsChange">--</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">🎯</div>
                        <div class="metric-content">
                            <div class="metric-value" id="closingDeals">0</div>
                            <div class="metric-label">Closing Soon</div>
                            <div class="metric-change" id="closingChange">--</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">⭐</div>
                        <div class="metric-content">
                            <div class="metric-value" id="avgRelationship">0.0</div>
                            <div class="metric-label">Avg Relationship</div>
                            <div class="metric-change" id="relationshipChange">--</div>
                        </div>
                    </div>
                </div>

                <!-- Main Dashboard Grid -->
                <div class="dashboard-grid">
                    <!-- Pipeline Overview Widget -->
                    <div class="dashboard-widget pipeline-widget">
                        <div class="widget-header">
                            <h3>📈 Pipeline Overview</h3>
                            <button class="widget-action" onclick="AppController.switchTab('pipeline')">View All</button>
                        </div>
                        <div class="widget-content" id="pipelineWidget">
                            <div class="loading-spinner">Loading pipeline data...</div>
                        </div>
                    </div>

                    <!-- Touchpoint Activity Widget -->
                    <div class="dashboard-widget touchpoint-widget">
                        <div class="widget-header">
                            <h3>📞 Recent Activity</h3>
                            <button class="widget-action" onclick="AppController.switchTab('touchpoints')">View All</button>
                        </div>
                        <div class="widget-content" id="touchpointWidget">
                            <div class="loading-spinner">Loading touchpoint data...</div>
                        </div>
                    </div>

                    <!-- Top Contacts Widget -->
                    <div class="dashboard-widget contacts-widget">
                        <div class="widget-header">
                            <h3>🌟 Top Contacts</h3>
                            <button class="widget-action" onclick="AppController.switchTab('contacts')">View All</button>
                        </div>
                        <div class="widget-content" id="contactsWidget">
                            <div class="loading-spinner">Loading contacts data...</div>
                        </div>
                    </div>

                    <!-- Team Performance Widget -->
                    <div class="dashboard-widget team-widget">
                        <div class="widget-header">
                            <h3>👥 Team Performance</h3>
                            <button class="widget-action" onclick="AppController.switchTab('teams')">View All</button>
                        </div>
                        <div class="widget-content" id="teamWidget">
                            <div class="loading-spinner">Loading team data...</div>
                        </div>
                    </div>

                    <!-- Priority Alerts Widget -->
                    <div class="dashboard-widget alerts-widget">
                        <div class="widget-header">
                            <h3>⚠️ Priority Alerts</h3>
                            <button class="widget-action" onclick="dashboardModule.showAllAlerts()">View All</button>
                        </div>
                        <div class="widget-content" id="alertsWidget">
                            <div class="loading-spinner">Loading alerts...</div>
                        </div>
                    </div>

                    <!-- Activity Feed Widget -->
                    <div class="dashboard-widget activity-widget">
                        <div class="widget-header">
                            <h3>📋 Recent Activity Feed</h3>
                            <button class="widget-action" onclick="dashboardModule.showActivityHistory()">View History</button>
                        </div>
                        <div class="widget-content" id="activityWidget">
                            <div class="loading-spinner">Loading activity feed...</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .dashboard-container {
                    max-width: 100%;
                    padding: 20px;
                    background: #f8f9ff;
                    min-height: calc(100vh - 100px);
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .dashboard-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .dashboard-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                    font-size: 0.95em;
                }

                .dashboard-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .timeframe-btn {
                    background: white;
                    border: 1px solid #dee2e6;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: all 0.3s ease;
                    font-weight: 500;
                }

                .timeframe-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: transparent;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .timeframe-btn:hover:not(.active) {
                    background: #f8f9fa;
                    transform: translateY(-1px);
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
                    font-weight: 500;
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

                /* Quick Actions Bar */
                .quick-actions {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 25px;
                    padding: 20px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    overflow-x: auto;
                }

                .quick-action-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 20px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    min-width: 100px;
                    font-weight: 500;
                }

                .quick-action-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                }

                .quick-icon {
                    font-size: 1.5em;
                    margin-bottom: 4px;
                }

                /* Alert Banner */
                .alert-banner {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                }

                .alert-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5em;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.3s ease;
                }

                .alert-close:hover {
                    background: rgba(255,255,255,0.2);
                }

                /* Metrics Overview */
                .metrics-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .metric-card {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    border: 2px solid transparent;
                }

                .metric-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    border-color: #667eea;
                }

                .metric-card.primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .metric-icon {
                    font-size: 2.5em;
                    opacity: 0.9;
                }

                .metric-content {
                    flex: 1;
                }

                .metric-value {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 4px;
                    line-height: 1;
                }

                .metric-label {
                    font-size: 0.9em;
                    opacity: 0.8;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .metric-change {
                    font-size: 0.8em;
                    font-weight: 500;
                    padding: 2px 8px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.1);
                }

                .metric-change.positive {
                    background: rgba(40, 167, 69, 0.2);
                    color: #28a745;
                }

                .metric-change.negative {
                    background: rgba(220, 53, 69, 0.2);
                    color: #dc3545;
                }

                /* Dashboard Grid */
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 25px;
                }

                .dashboard-widget {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    overflow: hidden;
                    border: 2px solid transparent;
                }

                .dashboard-widget:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    border-color: #667eea;
                }

                .widget-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 25px 15px;
                    border-bottom: 2px solid #f8f9fa;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
                }

                .widget-header h3 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.1em;
                    font-weight: 600;
                }

                .widget-action {
                    background: none;
                    border: 1px solid #667eea;
                    color: #667eea;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.8em;
                    transition: all 0.3s ease;
                    font-weight: 500;
                }

                .widget-action:hover {
                    background: #667eea;
                    color: white;
                    transform: translateY(-1px);
                }

                .widget-content {
                    padding: 25px;
                    min-height: 200px;
                }

                .loading-spinner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 150px;
                    color: #666;
                    font-style: italic;
                }

                /* Widget-specific styles */
                .pipeline-stage {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    margin-bottom: 10px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                    transition: all 0.3s ease;
                }

                .pipeline-stage:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }

                .stage-info {
                    flex: 1;
                }

                .stage-name {
                    font-weight: 600;
                    color: #232F3E;
                    margin-bottom: 4px;
                }

                .stage-details {
                    font-size: 0.8em;
                    color: #666;
                }

                .stage-value {
                    text-align: right;
                    font-weight: bold;
                    color: #28a745;
                }

                .touchpoint-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                    transition: background 0.3s ease;
                }

                .touchpoint-item:hover {
                    background: #f8f9ff;
                    padding-left: 10px;
                    padding-right: 10px;
                    margin-left: -10px;
                    margin-right: -10px;
                    border-radius: 8px;
                }

                .touchpoint-item:last-child {
                    border-bottom: none;
                }

                .touchpoint-info {
                    flex: 1;
                }

                .touchpoint-contact {
                    font-weight: 600;
                    color: #232F3E;
                    margin-bottom: 4px;
                }

                .touchpoint-details {
                    font-size: 0.8em;
                    color: #666;
                    display: flex;
                    gap: 10px;
                }

                .touchpoint-time {
                    color: #999;
                    font-size: 0.8em;
                    white-space: nowrap;
                }

                .contact-rank-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    margin-bottom: 10px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .contact-rank-item:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }

                .contact-info {
                    flex: 1;
                }

                .contact-name {
                    font-weight: 600;
                    color: #232F3E;
                    margin-bottom: 4px;
                }

                .contact-details {
                    font-size: 0.8em;
                    color: #666;
                }

                .contact-score {
                    text-align: right;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .score-circle {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 0.9em;
                }

                .score-excellent { background: #28a745; }
                .score-good { background: #20c997; }
                .score-fair { background: #ffc107; color: #000; }
                .score-poor { background: #fd7e14; }
                .score-critical { background: #dc3545; }

                .alert-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 15px;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    border-left: 4px solid;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .alert-item:hover {
                    transform: translateX(5px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .alert-critical {
                    background: #f8d7da;
                    border-color: #dc3545;
                    color: #721c24;
                }

                .alert-warning {
                    background: #fff3cd;
                    border-color: #ffc107;
                    color: #856404;
                }

                .alert-info {
                    background: #d1ecf1;
                    border-color: #17a2b8;
                    color: #0c5460;
                }

                .alert-icon {
                    font-size: 1.2em;
                }

                .alert-content {
                    flex: 1;
                }

                .alert-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .alert-description {
                    font-size: 0.8em;
                    opacity: 0.8;
                }

                .activity-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                }

                .activity-item:last-child {
                    border-bottom: none;
                }

                .activity-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9em;
                    font-weight: bold;
                    color: white;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .activity-deal { background: #667eea; }
                .activity-contact { background: #20c997; }
                .activity-touchpoint { background: #ffc107; color: #000; }
                .activity-team { background: #fd7e14; }

                .activity-content {
                    flex: 1;
                }

                .activity-title {
                    font-weight: 600;
                    color: #232F3E;
                    margin-bottom: 4px;
                    line-height: 1.3;
                }

                .activity-meta {
                    font-size: 0.8em;
                    color: #666;
                    display: flex;
                    gap: 8px;
                }

                .empty-widget {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 40px 20px;
                }

                .empty-widget-icon {
                    font-size: 3em;
                    margin-bottom: 15px;
                    opacity: 0.3;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .dashboard-container {
                        padding: 15px;
                    }

                    .dashboard-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 20px;
                    }

                    .dashboard-controls {
                        justify-content: center;
                        flex-wrap: wrap;
                    }

                    .quick-actions {
                        padding: 15px;
                        gap: 10px;
                    }

                    .quick-action-btn {
                        min-width: 80px;
                        padding: 12px 15px;
                    }

                    .metrics-overview {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 15px;
                    }

                    .metric-card {
                        padding: 20px 15px;
                        flex-direction: column;
                        text-align: center;
                        gap: 15px;
                    }

                    .dashboard-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .widget-header {
                        padding: 15px 20px 10px;
                        flex-direction: column;
                        align-items: stretch;
                        gap: 10px;
                    }

                    .widget-content {
                        padding: 20px 15px;
                    }
                }

                /* Dark mode support (future enhancement) */
                @media (prefers-color-scheme: dark) {
                    .dashboard-container {
                        background: #1a1a1a;
                        color: #e0e0e0;
                    }
                    
                    .dashboard-widget {
                        background: #2d2d2d;
                        border-color: #404040;
                    }
                    
                    .metric-card {
                        background: #2d2d2d;
                        color: #e0e0e0;
                    }
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Auto-refresh functionality
        this.startAutoRefresh();
        
        // Handle visibility change for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else if (AppController.currentTab === 'dashboard') {
                this.startAutoRefresh();
                this.refreshDashboard();
            }
        });
    }

    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear any existing interval
        
        // Refresh every 2 minutes
        this.refreshInterval = setInterval(() => {
            if (AppController.currentTab === 'dashboard') {
                this.refreshDashboard();
            }
        }, 120000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    setTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        
        // Update button states
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Refresh all widgets with new timeframe
        this.renderAllWidgets();
    }

    refreshDashboard() {
        document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
        this.renderAllWidgets();
        this.checkForAlerts();
        
        // Show brief refresh indicator
        const refreshBtn = document.querySelector('[onclick="dashboardModule.refreshDashboard()"]');
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '🔄 Refreshing...';
            refreshBtn.disabled = true;
            
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }, 1000);
        }
    }

    renderAllWidgets() {
        this.renderKeyMetrics();
        this.renderPipelineWidget();
        this.renderTouchpointWidget();
        this.renderContactsWidget();
        this.renderTeamWidget();
        this.renderAlertsWidget();
        this.renderActivityWidget();
    }

    // ===============================
    // 🎯 KEY METRICS RENDERING
    // ===============================

    renderKeyMetrics() {
        const deals = DataManager.getDeals();
        const contacts = DataManager.getAllContacts();
        const timeframeData = this.getTimeframeData();
        
        // Calculate metrics
        const totalPipeline = deals.reduce((sum, deal) => sum + deal.value, 0);
        const totalTouchpoints = this.getTotalTouchpoints();
        const activeContacts = this.getActiveContacts(timeframeData);
        const closingDeals = this.getClosingDeals();
        const avgRelationship = this.getAverageRelationshipScore();
        
        // Update DOM elements
        document.getElementById('totalPipeline').textContent = `$${(totalPipeline / 1000000).toFixed(1)}M`;
        document.getElementById('totalTouchpoints').textContent = totalTouchpoints;
        document.getElementById('activeContacts').textContent = activeContacts;
        document.getElementById('closingDeals').textContent = closingDeals;
        document.getElementById('avgRelationship').textContent = avgRelationship.toFixed(1);
        
        // Calculate and display changes (placeholder for now)
        this.updateMetricChanges();
    }

    updateMetricChanges() {
        // For now, show placeholder changes
        // In a real implementation, you'd compare with previous period data
        document.getElementById('pipelineChange').textContent = '+12.5%';
        document.getElementById('pipelineChange').className = 'metric-change positive';
        
        document.getElementById('touchpointsChange').textContent = '+8 this week';
        document.getElementById('touchpointsChange').className = 'metric-change positive';
        
        document.getElementById('contactsChange').textContent = '+3 new';
        document.getElementById('contactsChange').className = 'metric-change positive';
        
        document.getElementById('closingChange').textContent = '2 this week';
        document.getElementById('closingChange').className = 'metric-change';
        
        document.getElementById('relationshipChange').textContent = '+0.3';
        document.getElementById('relationshipChange').className = 'metric-change positive';
    }

    // ===============================
    // 🎯 WIDGET RENDERING METHODS
    // ===============================

    renderPipelineWidget() {
        const container = document.getElementById('pipelineWidget');
        const deals = DataManager.getDeals();
        const stages = DataManager.config.dealStages;
        
        if (deals.length === 0) {
            container.innerHTML = `
                <div class="empty-widget">
                    <div class="empty-widget-icon">💼</div>
                    <p>No deals in pipeline yet</p>
                    <button class="action-btn" onclick="dealsModule?.addNewDeal?.(); AppController.switchTab('deals')">
                        + Add First Deal
                    </button>
                </div>
            `;
            return;
        }
        
        // Group deals by stage
        const dealsByStage = {};
        Object.keys(stages).forEach(stageId => {
            const stageDeals = deals.filter(deal => deal.stage === stageId);
            const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
            
            if (stageDeals.length > 0) {
                dealsByStage[stageId] = {
                    name: stages[stageId].name,
                    count: stageDeals.length,
                    value: stageValue,
                    deals: stageDeals
                };
            }
        });
        
        const stagesHTML = Object.keys(dealsByStage).map(stageId => {
            const stage = dealsByStage[stageId];
            return `
                <div class="pipeline-stage" onclick="AppController.switchTab('pipeline')">
                    <div class="stage-info">
                        <div class="stage-name">${stage.name}</div>
                        <div class="stage-details">${stage.count} deal${stage.count !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="stage-value">${UIHelpers.formatCurrency(stage.value)}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = stagesHTML || '<div class="empty-widget">No active pipeline stages</div>';
    }

    renderTouchpointWidget() {
        const container = document.getElementById('touchpointWidget');
        
        // 🎯 KEY INTEGRATION: Get recent touchpoints from centralized system
        const recentTouchpoints = typeof window.getRecentTouchpoints === 'function' ? 
            window.getRecentTouchpoints({}).slice(0, 5) : [];
        
        if (recentTouchpoints.length === 0) {
            container.innerHTML = `
                <div class="empty-widget">
                    <div class="empty-widget-icon">📞</div>
                    <p>No recent touchpoints</p>
                    <button class="action-btn" onclick="touchpointTracker?.showAddTouchpointModal?.()">
                        + Log First Touchpoint
                    </button>
                </div>
            `;
            return;
        }
        
        const touchpointsHTML = recentTouchpoints.map(touchpoint => {
            const contactName = this.getContactName(touchpoint);
            const timeAgo = this.getTimeAgo(touchpoint.date);
            
            return `
                <div class="touchpoint-item" onclick="touchpointTracker?.showTouchpointDetails?.('${touchpoint.id}')">
                    <div class="touchpoint-info">
                        <div class="touchpoint-contact">${contactName}</div>
                        <div class="touchpoint-details">
                            <span>${this.getTypeLabel(touchpoint.type)}</span>
                            <span>${this.getOutcomeLabel(touchpoint.outcome)}</span>
                        </div>
                    </div>
                    <div class="touchpoint-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = touchpointsHTML;
    }

    renderContactsWidget() {
        const container = document.getElementById('contactsWidget');
        const contacts = DataManager.getAllContacts();
        
        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-widget">
                    <div class="empty-widget-icon">👥</div>
                    <p>No contacts added yet</p>
                    <button class="action-btn" onclick="contactsModule?.showContactForm?.(); AppController.switchTab('contacts')">
                        + Add First Contact
                    </button>
                </div>
            `;
            return;
        }
        
        // Get top contacts by relationship score
        const topContacts = contacts
            .map(contact => ({
                ...contact,
                relationshipScore: this.getContactRelationshipScore(contact.id)
            }))
            .sort((a, b) => b.relationshipScore - a.relationshipScore)
            .slice(0, 5);
        
        const contactsHTML = topContacts.map(contact => {
            return `
                <div class="contact-rank-item" onclick="contactsModule?.editContact?.('${contact.id}'); AppController.switchTab('contacts')">
                    <div class="contact-info">
                        <div class="contact-name">${contact.name}</div>
                        <div class="contact-details">${contact.company || 'No company'}</div>
                    </div>
                    <div class="contact-score">
                        <div class="score-circle ${this.getScoreClass(contact.relationshipScore)}">${contact.relationshipScore}</div>
                        <span style="font-size: 0.8em; color: #666;">/10</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = contactsHTML;
    }

    renderTeamWidget() {
        const container = document.getElementById('teamWidget');
        const teams = DataManager.getTeams();
        const teamMembers = DataManager.getTeamMembers() || {};
        
        if (Object.keys(teams).length === 0) {
            container.innerHTML = `
                <div class="empty-widget">
                    <div class="empty-widget-icon">👥</div>
                    <p>No teams configured yet</p>
                    <button class="action-btn" onclick="teamsModule?.addTeamMember?.(); AppController.switchTab('teams')">
                        + Add Team Member
                    </button>
                </div>
            `;
            return;
        }
        
        const teamStats = Object.keys(teams).map(teamId => {
            const team = teams[teamId];
            const members = teamMembers[teamId] || [];
            const activeMembers = members.filter(member => 
                this.daysSinceLastTouchpoint(member.id) <= 30
            ).length;
            
            return {
                name: team.name,
                totalMembers: members.length,
                activeMembers,
                activityRate: members.length > 0 ? (activeMembers / members.length * 100).toFixed(0) : 0
            };
        }).sort((a, b) => b.activityRate - a.activityRate);
        
        const teamsHTML = teamStats.map(team => {
            return `
                <div class="pipeline-stage" onclick="AppController.switchTab('teams')">
                    <div class="stage-info">
                        <div class="stage-name">${team.name}</div>
                        <div class="stage-details">${team.totalMembers} members, ${team.activeMembers} active</div>
                    </div>
                    <div class="stage-value">${team.activityRate}%</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = teamsHTML;
    }

    renderAlertsWidget() {
        const container = document.getElementById('alertsWidget');
        const alerts = this.generateAlerts();
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="empty-widget">
                    <div class="empty-widget-icon">✅</div>
                    <p>All caught up! No alerts at this time.</p>
                </div>
            `;
            return;
        }
        
        const alertsHTML = alerts.slice(0, 4).map(alert => {
            return `
                <div class="alert-item alert-${alert.type}" onclick="${alert.action}">
                    <div class="alert-icon">${alert.icon}</div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-description">${alert.description}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = alertsHTML;
    }

    renderActivityWidget() {
        const container = document.getElementById('activityWidget');
        const activities = this.getRecentActivities();
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-widget">
                    <div class="empty-widget-icon">📋</div>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }
        
        const activitiesHTML = activities.slice(0, 6).map(activity => {
            return `
                <div class="activity-item">
                    <div class="activity-icon activity-${activity.type}">${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-meta">
                            <span>${activity.time}</span>
                            <span>•</span>
                            <span>${activity.source}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = activitiesHTML;
    }

    // ===============================
    // 🎯 DATA CALCULATION METHODS
    // ===============================

    getTotalTouchpoints() {
        if (typeof window.getRecentTouchpoints === 'function') {
            return window.getRecentTouchpoints({}).length;
        }
        return 0;
    }

    getActiveContacts(timeframeData) {
        const contacts = DataManager.getAllContacts();
        return contacts.filter(contact => {
            const daysSince = this.daysSinceLastTouchpoint(contact.id);
            return daysSince <= timeframeData.days;
        }).length;
    }

    getClosingDeals() {
        const deals = DataManager.getDeals();
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return deals.filter(deal => {
            const closeDate = new Date(deal.closeDate);
            return closeDate >= now && closeDate <= nextWeek;
        }).length;
    }

    getAverageRelationshipScore() {
        const contacts = DataManager.getAllContacts();
        if (contacts.length === 0) return 0;
        
        const totalScore = contacts.reduce((sum, contact) => 
            sum + this.getContactRelationshipScore(contact.id), 0
        );
        
        return totalScore / contacts.length;
    }

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
            
            // Frequency scoring
            if (stats.total >= 10) score += 2;
            else if (stats.total >= 5) score += 1;
            
            // Recent activity bonus
            if (stats.thisWeek >= 2) score += 1;
            
            return Math.max(1, Math.min(10, score));
        } else {
            return 5; // Fallback score
        }
    }

    daysSinceLastTouchpoint(contactId) {
        if (typeof window.getTouchpointStats === 'function') {
            const stats = window.getTouchpointStats(contactId, null);
            if (stats.lastTouchpoint) {
                const today = new Date();
                const touchpointDate = new Date(stats.lastTouchpoint.date);
                const diffTime = today - touchpointDate;
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }
        return 999;
    }

    getTimeframeData() {
        const now = new Date();
        
        switch(this.currentTimeframe) {
            case 'day':
                return { days: 1, label: 'today' };
            case 'week':
                return { days: 7, label: 'this week' };
            case 'month':
                return { days: 30, label: 'this month' };
            case 'quarter':
                return { days: 90, label: 'this quarter' };
            default:
                return { days: 7, label: 'this week' };
        }
    }

    generateAlerts() {
        const alerts = [];
        const deals = DataManager.getDeals();
        const contacts = DataManager.getAllContacts();
        
        // Overdue deals
        const overdueDeals = deals.filter(deal => {
            const closeDate = new Date(deal.closeDate);
            return closeDate < new Date() && !['deal-won', 'deal-lost'].includes(deal.stage);
        });
        
        if (overdueDeals.length > 0) {
            alerts.push({
                type: 'critical',
                icon: '🚨',
                title: `${overdueDeals.length} Overdue Deal${overdueDeals.length !== 1 ? 's' : ''}`,
                description: 'Deals past their expected close date',
                action: "AppController.switchTab('pipeline')"
            });
        }
        
        // Stale contacts (30+ days without touchpoint)
        const staleContacts = contacts.filter(contact => 
            this.daysSinceLastTouchpoint(contact.id) > 30
        );
        
        if (staleContacts.length > 5) {
            alerts.push({
                type: 'warning',
                icon: '⚠️',
                title: `${staleContacts.length} Contacts Need Attention`,
                description: '30+ days since last touchpoint',
                action: "AppController.switchTab('contacts')"
            });
        }
        
        // Follow-up touchpoints due
        const followUpTouchpoints = typeof window.getRecentTouchpoints === 'function' ? 
            window.getRecentTouchpoints({ hasFollowUp: true }).filter(tp => 
                new Date(tp.followUpDate) <= new Date()
            ) : [];
        
        if (followUpTouchpoints.length > 0) {
            alerts.push({
                type: 'warning',
                icon: '📅',
                title: `${followUpTouchpoints.length} Follow-up${followUpTouchpoints.length !== 1 ? 's' : ''} Due`,
                description: 'Touchpoints requiring follow-up action',
                action: "AppController.switchTab('touchpoints')"
            });
        }
        
        // High-value deals closing soon
        const closingSoon = deals.filter(deal => {
            const closeDate = new Date(deal.closeDate);
            const now = new Date();
            const daysToClose = Math.ceil((closeDate - now) / (1000 * 60 * 60 * 24));
            return daysToClose <= 7 && daysToClose >= 0 && deal.value >= 100000;
        });
        
        if (closingSoon.length > 0) {
            alerts.push({
                type: 'info',
                icon: '💰',
                title: `${closingSoon.length} High-Value Deal${closingSoon.length !== 1 ? 's' : ''} Closing Soon`,
                description: 'Worth $100K+ closing within 7 days',
                action: "AppController.switchTab('pipeline')"
            });
        }
        
        return alerts.sort((a, b) => {
            const priority = { critical: 3, warning: 2, info: 1 };
            return (priority[b.type] || 0) - (priority[a.type] || 0);
        });
    }

    getRecentActivities() {
        const activities = [];
        
        // Get recent touchpoints
        const recentTouchpoints = typeof window.getRecentTouchpoints === 'function' ? 
            window.getRecentTouchpoints({}).slice(0, 3) : [];
        
        recentTouchpoints.forEach(touchpoint => {
            activities.push({
                type: 'touchpoint',
                icon: '📞',
                title: `Touchpoint logged with ${this.getContactName(touchpoint)}`,
                time: this.getTimeAgo(touchpoint.date),
                source: 'Touchpoint Tracker'
            });
        });
        
        // Get recent deals (placeholder - would need deal creation tracking)
        const recentDeals = DataManager.getDeals()
            .filter(deal => deal.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 2);
        
        recentDeals.forEach(deal => {
            activities.push({
                type: 'deal',
                icon: '💼',
                title: `New deal created: ${deal.name}`,
                time: this.getTimeAgo(deal.createdAt),
                source: 'Pipeline'
            });
        });
        
        // Sort by recency
        return activities.sort((a, b) => {
            // Simple time-based sorting (would need actual timestamps in real implementation)
            return 0;
        });
    }

    // ===============================
    // 🎯 UTILITY METHODS
    // ===============================

    getContactName(touchpoint) {
        if (touchpoint.contactId && typeof DataManager !== 'undefined') {
            const contact = DataManager.getContactById(touchpoint.contactId);
            if (contact) return contact.name;
        }
        
        if (touchpoint.teamMemberId && touchpoint.teamId && typeof DataManager !== 'undefined') {
            const member = DataManager.getTeamMember(touchpoint.teamId, touchpoint.teamMemberId);
            if (member) return member.name;
        }
        
        return 'Unknown Contact';
    }

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

    getScoreClass(score) {
        if (score >= 9) return 'score-excellent';
        if (score >= 7) return 'score-good';
        if (score >= 5) return 'score-fair';
        if (score >= 3) return 'score-poor';
        return 'score-critical';
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    // ===============================
    // 🎯 REFRESH METHODS
    // ===============================

    refreshTouchpointWidgets() {
        if (AppController.currentTab === 'dashboard') {
            this.renderTouchpointWidget();
            this.renderKeyMetrics();
            this.renderAlertsWidget();
            this.renderActivityWidget();
        }
    }

    refreshDealWidgets() {
        if (AppController.currentTab === 'dashboard') {
            this.renderPipelineWidget();
            this.renderKeyMetrics();
            this.renderAlertsWidget();
        }
    }

    refreshContactWidgets() {
        if (AppController.currentTab === 'dashboard') {
            this.renderContactsWidget();
            this.renderKeyMetrics();
        }
    }

    refreshTeamWidgets() {
        if (AppController.currentTab === 'dashboard') {
            this.renderTeamWidget();
            this.renderKeyMetrics();
        }
    }

    // ===============================
    // 🎯 ACTION METHODS
    // ===============================

    checkForAlerts() {
        const alerts = this.generateAlerts();
        const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
        
        if (criticalAlerts.length > 0) {
            this.showAlertBanner(criticalAlerts[0]);
        } else {
            this.hideAlertBanner();
        }
    }

    showAlertBanner(alert) {
        const banner = document.getElementById('alertBanner');
        const content = document.getElementById('alertContent');
        
        content.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2em;">${alert.icon}</span>
                <div>
                    <strong>${alert.title}</strong>
                    <div style="font-size: 0.9em; opacity: 0.9;">${alert.description}</div>
                </div>
            </div>
        `;
        
        banner.style.display = 'flex';
        banner.onclick = () => eval(alert.action);
    }

    hideAlertBanner() {
        document.getElementById('alertBanner').style.display = 'none';
    }

    dismissAlert() {
        this.hideAlertBanner();
    }

    showAllAlerts() {
        // Navigate to touchpoints follow-up view or create alerts modal
        AppController.switchTab('touchpoints');
        if (typeof touchpointTracker !== 'undefined') {
            touchpointTracker.switchView('followups');
        }
    }

    showActivityHistory() {
        // Navigate to a comprehensive activity view
        AppController.switchTab('touchpoints');
        if (typeof touchpointTracker !== 'undefined') {
            touchpointTracker.switchView('history');
        }
    }

    exportDashboard() {
        const data = {
            timestamp: new Date().toISOString(),
            timeframe: this.currentTimeframe,
            metrics: {
                totalPipeline: document.getElementById('totalPipeline').textContent,
                totalTouchpoints: document.getElementById('totalTouchpoints').textContent,
                activeContacts: document.getElementById('activeContacts').textContent,
                closingDeals: document.getElementById('closingDeals').textContent,
                avgRelationship: document.getElementById('avgRelationship').textContent
            },
            alerts: this.generateAlerts().length,
            summary: `Dashboard Export - ${new Date().toLocaleDateString()}`
        };
        
        const csv = [
            'Metric,Value',
            `Total Pipeline,${data.metrics.totalPipeline}`,
            `Total Touchpoints,${data.metrics.totalTouchpoints}`,
            `Active Contacts,${data.metrics.activeContacts}`,
            `Closing Soon,${data.metrics.closingDeals}`,
            `Avg Relationship Score,${data.metrics.avgRelationship}`,
            `Alerts Count,${data.alerts}`,
            `Export Date,${data.timestamp}`
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        UIHelpers.showNotification('Dashboard report exported successfully', 'success');
    }

    // Cleanup method
    destroy() {
        this.stopAutoRefresh();
        
        // Unsubscribe from touchpoint events
        if (typeof window.unsubscribeTouchpoints === 'function') {
            window.unsubscribeTouchpoints('dashboardModule');
        }
    }
}

// Create global instance
const dashboardModule = new DashboardModule();
console.log('✅ Enhanced Dashboard module with centralized analytics loaded successfully');
