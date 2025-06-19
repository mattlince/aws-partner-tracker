// Enhanced Dashboard Module with Inline Quick Actions
class DashboardModule {
    constructor() {
        this.refreshInterval = null;
        this.autoRefresh = true;
    }

    init() {
        console.log('Dashboard module initialized');
        
        // Listen for data changes
        DataManager.on('contact:added', () => this.renderIfActive());
        DataManager.on('contact:updated', () => this.renderIfActive());
        DataManager.on('pipeline:added', () => this.renderIfActive());
        DataManager.on('pipeline:updated', () => this.renderIfActive());
        DataManager.on('touchpoint:added', () => this.renderIfActive());
        DataManager.on('task:added', () => this.renderIfActive());
        DataManager.on('task:updated', () => this.renderIfActive());
        DataManager.on('data:loaded', () => this.renderIfActive());
        
        // Start auto-refresh
        this.startAutoRefresh();
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderStats();
        this.renderRecentActivity();
        this.renderQuickActions();
        this.renderUpcomingTasks();
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
                        <h2>🏠 Dashboard</h2>
                        <p>Welcome back! Here's what's happening with your AWS partnerships.</p>
                    </div>
                    <div class="dashboard-controls">
                        <button class="action-btn secondary" onclick="backupManager.showBackupManager()">
                            🔒 Backup Data
                        </button>
                        <button class="action-btn" onclick="dashboardModule.refreshDashboard()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <!-- Key Metrics -->
                <div id="dashboardStats" class="stats-grid">
                    <!-- Stats will be populated here -->
                </div>

                <!-- Main Dashboard Grid -->
                <div class="dashboard-grid">
                    <!-- Quick Actions Panel -->
                    <div class="dashboard-card quick-actions-card">
                        <div class="card-header">
                            <h3>⚡ Quick Actions</h3>
                            <span class="card-subtitle">Common tasks and shortcuts</span>
                        </div>
                        <div id="quickActionsContent" class="quick-actions-content">
                            <!-- Quick actions will be populated here -->
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="dashboard-card activity-card">
                        <div class="card-header">
                            <h3>📈 Recent Activity</h3>
                            <span class="card-subtitle">Latest updates across all modules</span>
                        </div>
                        <div id="recentActivityContent" class="activity-content">
                            <!-- Recent activity will be populated here -->
                        </div>
                    </div>

                    <!-- Upcoming Tasks -->
                    <div class="dashboard-card tasks-card">
                        <div class="card-header">
                            <h3>✅ Task Center</h3>
                            <span class="card-subtitle">Manage your action items</span>
                        </div>
                        <div id="upcomingTasksContent" class="tasks-content">
                            <!-- Tasks will be populated here -->
                        </div>
                    </div>

                    <!-- Pipeline Health -->
                    <div class="dashboard-card pipeline-health-card">
                        <div class="card-header">
                            <h3>💼 Pipeline Health</h3>
                            <span class="card-subtitle">Deal flow and conversion metrics</span>
                        </div>
                        <div id="pipelineHealthContent" class="pipeline-health-content">
                            <!-- Pipeline health will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Inline Task Modal -->
                <div id="inlineTaskModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('inlineTaskModal')">&times;</span>
                        <div id="inlineTaskContent">
                            <!-- Task form will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Inline Contact Modal -->
                <div id="inlineContactModal" class="modal" style="display: none;">
                    <div class="modal-content" style="max-width: 700px;">
                        <span class="close" onclick="UIHelpers.closeModal('inlineContactModal')">&times;</span>
                        <div id="inlineContactContent">
                            <!-- Contact form will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Inline Deal Modal -->
                <div id="inlineDealModal" class="modal" style="display: none;">
                    <div class="modal-content" style="max-width: 700px;">
                        <span class="close" onclick="UIHelpers.closeModal('inlineDealModal')">&times;</span>
                        <div id="inlineDealContent">
                            <!-- Deal form will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .dashboard-container {
                    max-width: 100%;
                    animation: fadeIn 0.5s ease-in;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
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
                    font-size: 2em;
                }

                .dashboard-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                    font-size: 1.1em;
                }

                .dashboard-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 25px;
                    border-radius: 15px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }

                .stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 100px;
                    height: 100px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                    transform: translate(30px, -30px);
                }

                .stat-card.contacts { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .stat-card.pipeline { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
                .stat-card.touchpoints { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
                .stat-card.tasks { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

                .stat-value {
                    font-size: 3em;
                    font-weight: bold;
                    margin-bottom: 5px;
                    position: relative;
                    z-index: 1;
                }

                .stat-label {
                    font-size: 1.1em;
                    opacity: 0.9;
                    position: relative;
                    z-index: 1;
                }

                .stat-trend {
                    font-size: 0.9em;
                    margin-top: 8px;
                    opacity: 0.8;
                    position: relative;
                    z-index: 1;
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 25px;
                }

                .dashboard-card {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    border: 1px solid #f0f0f0;
                    transition: all 0.3s ease;
                    min-height: 300px;
                }

                .dashboard-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
                }

                .card-header {
                    margin-bottom: 20px;
                    border-bottom: 2px solid #f8f9fa;
                    padding-bottom: 15px;
                }

                .card-header h3 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.3em;
                }

                .card-subtitle {
                    color: #666;
                    font-size: 0.9em;
                    display: block;
                    margin-top: 5px;
                }

                .quick-actions-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 15px;
                }

                .quick-action-btn {
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 20px 15px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    color: #495057;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .quick-action-btn:hover {
                    background: #FF9900;
                    color: white;
                    border-color: #FF9900;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(255, 153, 0, 0.3);
                }

                .quick-action-icon {
                    font-size: 2em;
                    margin-bottom: 5px;
                }

                .quick-action-label {
                    font-weight: 600;
                    font-size: 0.9em;
                }

                .activity-content {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .activity-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                    transition: background 0.3s ease;
                }

                .activity-item:hover {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding-left: 10px;
                    margin-left: -10px;
                    margin-right: -10px;
                }

                .activity-item:last-child {
                    border-bottom: none;
                }

                .activity-icon {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1em;
                    flex-shrink: 0;
                }

                .activity-icon.contact { background: #e3f2fd; color: #1565c0; }
                .activity-icon.pipeline { background: #fce4ec; color: #c2185b; }
                .activity-icon.touchpoint { background: #e8f5e8; color: #2e7d32; }
                .activity-icon.task { background: #fff3e0; color: #ef6c00; }

                .activity-details {
                    flex: 1;
                }

                .activity-title {
                    font-weight: 600;
                    color: #232F3E;
                    margin-bottom: 3px;
                }

                .activity-meta {
                    font-size: 0.85em;
                    color: #666;
                }

                .tasks-content {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .task-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    margin: 8px 0;
                    background: #f8f9fa;
                    border-radius: 10px;
                    border-left: 4px solid #FF9900;
                    transition: all 0.3s ease;
                }

                .task-item:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }

                .task-item.completed {
                    opacity: 0.6;
                    border-left-color: #28a745;
                }

                .task-checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .task-content {
                    flex: 1;
                }

                .task-title {
                    font-weight: 600;
                    color: #232F3E;
                    margin-bottom: 3px;
                }

                .task-meta {
                    font-size: 0.85em;
                    color: #666;
                }

                .task-actions {
                    display: flex;
                    gap: 5px;
                }

                .pipeline-health-content {
                    display: grid;
                    gap: 15px;
                }

                .health-metric {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid;
                }

                .health-metric.good { border-left-color: #28a745; }
                .health-metric.warning { border-left-color: #ffc107; }
                .health-metric.danger { border-left-color: #dc3545; }

                .metric-label {
                    font-weight: 600;
                    color: #232F3E;
                }

                .metric-value {
                    font-size: 1.2em;
                    font-weight: bold;
                }

                .no-data {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 40px 20px;
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
                    text-decoration: none;
                    display: inline-block;
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

                .action-btn.small {
                    padding: 5px 10px;
                    font-size: 0.8em;
                }

                .action-btn.danger {
                    background: #dc3545;
                }

                .action-btn.danger:hover {
                    background: #c82333;
                }

                /* Form Styles for Inline Modals */
                .form-group {
                    margin-bottom: 15px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #232F3E;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                .form-group textarea {
                    resize: vertical;
                    height: 80px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .form-row-3 {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
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

                .close:hover {
                    color: #000;
                }

                @media (max-width: 768px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .quick-actions-content {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .form-row,
                    .form-row-3 {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Auto-refresh toggle
        const refreshBtn = document.querySelector('[onclick="dashboardModule.refreshDashboard()"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('mouseenter', () => {
                refreshBtn.innerHTML = '🔄 Refreshing...';
            });
            refreshBtn.addEventListener('mouseleave', () => {
                refreshBtn.innerHTML = '🔄 Refresh';
            });
        }
    }

    renderStats() {
        const container = document.getElementById('dashboardStats');
        if (!container) return;

        const contacts = DataManager.getAllContacts();
        const pipeline = DataManager.getPipelineEntries ? DataManager.getPipelineEntries() : [];
        const touchpoints = DataManager.getTouchpoints();
        const tasks = DataManager.getTasks ? DataManager.getTasks() : [];

        // Calculate trends (simple mock for now)
        const contactsTrend = contacts.length > 10 ? '+12%' : '+5%';
        const pipelineTrend = pipeline.length > 5 ? '+8%' : '+3%';
        const touchpointsTrend = touchpoints.length > 20 ? '+15%' : '+7%';
        const tasksTrend = tasks.filter(t => !t.completed).length > 0 ? `${tasks.filter(t => !t.completed).length} pending` : 'All done!';

        container.innerHTML = `
            <div class="stat-card contacts">
                <div class="stat-value">${contacts.length}</div>
                <div class="stat-label">Active Contacts</div>
                <div class="stat-trend">📈 ${contactsTrend} this month</div>
            </div>
            <div class="stat-card pipeline">
                <div class="stat-value">${pipeline.length}</div>
                <div class="stat-label">Pipeline Deals</div>
                <div class="stat-trend">💰 ${pipelineTrend} this month</div>
            </div>
            <div class="stat-card touchpoints">
                <div class="stat-value">${touchpoints.length}</div>
                <div class="stat-label">Total Touchpoints</div>
                <div class="stat-trend">📞 ${touchpointsTrend} this month</div>
            </div>
            <div class="stat-card tasks">
                <div class="stat-value">${tasks.length}</div>
                <div class="stat-label">Active Tasks</div>
                <div class="stat-trend">✅ ${tasksTrend}</div>
            </div>
        `;
    }

    renderQuickActions() {
        const container = document.getElementById('quickActionsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="quick-action-btn" onclick="dashboardModule.showInlineContactForm()">
                <div class="quick-action-icon">👤</div>
                <div class="quick-action-label">Add Contact</div>
            </div>
            <div class="quick-action-btn" onclick="dashboardModule.showInlineDealForm()">
                <div class="quick-action-icon">💼</div>
                <div class="quick-action-label">New Deal</div>
            </div>
            <div class="quick-action-btn" onclick="dashboardModule.showInlineTaskForm()">
                <div class="quick-action-icon">✅</div>
                <div class="quick-action-label">Add Task</div>
            </div>
            <div class="quick-action-btn" onclick="AppController.switchTab('touchpoints'); touchpointsModule.addTouchpoint();">
                <div class="quick-action-icon">📞</div>
                <div class="quick-action-label">Log Call</div>
            </div>
        `;
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivityContent');
        if (!container) return;

        const contacts = DataManager.getAllContacts().slice(-3);
        const pipeline = DataManager.getPipelineEntries ? DataManager.getPipelineEntries().slice(-3) : [];
        const touchpoints = DataManager.getTouchpoints().slice(-3);

        let activities = [];

        // Add recent contacts
        contacts.forEach(contact => {
            activities.push({
                type: 'contact',
                icon: '👤',
                title: `New contact: ${contact.name}`,
                meta: `${contact.company} • ${contact.role}`,
                time: contact.dateAdded || 'Recently'
            });
        });

        // Add recent pipeline deals
        pipeline.forEach(deal => {
            const contact = DataManager.getContactById(deal.contactId);
            activities.push({
                type: 'pipeline',
                icon: '💼',
                title: `Deal: ${deal.dealName}`,
                meta: `${contact ? contact.name : 'Unknown'} • ${deal.value?.toLocaleString() || '0'}`,
                time: deal.dateAdded || 'Recently'
            });
        });

        // Add recent touchpoints
        touchpoints.forEach(tp => {
            const contact = DataManager.getContactById(tp.contactId);
            activities.push({
                type: 'touchpoint',
                icon: this.getTouchpointIcon(tp.type),
                title: tp.subject,
                meta: `${contact ? contact.name : 'Unknown'} • ${tp.type}`,
                time: UIHelpers.formatDate(tp.date)
            });
        });

        // Sort by most recent and take top 6
        activities = activities.slice(-6).reverse();

        if (activities.length === 0) {
            container.innerHTML = '<div class="no-data">No recent activity yet. Start by adding contacts or deals!</div>';
            return;
        }

        const activityHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    ${activity.icon}
                </div>
                <div class="activity-details">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-meta">${activity.meta} • ${activity.time}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = activityHTML;
    }

    renderUpcomingTasks() {
        const container = document.getElementById('upcomingTasksContent');
        if (!container) return;

        const tasks = DataManager.getTasks ? DataManager.getTasks() : [];
        const pendingTasks = tasks.filter(task => !task.completed).slice(0, 5);

        if (pendingTasks.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    🎉 No pending tasks! You're all caught up.
                    <br><br>
                    <button class="action-btn" onclick="dashboardModule.showInlineTaskForm()">
                        Add New Task
                    </button>
                </div>
            `;
            return;
        }

        const tasksHTML = pendingTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="dashboardModule.toggleTask('${task.id}')">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        ${task.dueDate ? `Due: ${UIHelpers.formatDate(task.dueDate)}` : 'No due date'} • 
                        ${task.priority || 'Normal'} priority
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn small" onclick="dashboardModule.editInlineTask('${task.id}')">Edit</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            ${tasksHTML}
            <div style="margin-top: 15px; text-align: center;">
                <button class="action-btn secondary" onclick="dashboardModule.showInlineTaskForm()">
                    + Add Task
                </button>
            </div>
        `;
    }

    renderPipelineHealth() {
        const container = document.getElementById('pipelineHealthContent');
        if (!container) return;

        const pipeline = DataManager.getPipelineEntries ? DataManager.getPipelineEntries() : [];
        const totalValue = pipeline.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const avgDealSize = pipeline.length > 0 ? totalValue / pipeline.length : 0;
        const stageDistribution = {};
        
        pipeline.forEach(deal => {
            stageDistribution[deal.stage] = (stageDistribution[deal.stage] || 0) + 1;
        });

        const closeRate = pipeline.length > 0 ? 
            (pipeline.filter(d => d.stage === 'closed-won').length / pipeline.length * 100).toFixed(1) : 0;

        container.innerHTML = `
            <div class="health-metric ${totalValue > 100000 ? 'good' : totalValue > 50000 ? 'warning' : 'danger'}">
                <span class="metric-label">Total Pipeline Value</span>
                <span class="metric-value">${totalValue.toLocaleString()}</span>
            </div>
            <div class="health-metric ${avgDealSize > 20000 ? 'good' : avgDealSize > 10000 ? 'warning' : 'danger'}">
                <span class="metric-label">Average Deal Size</span>
                <span class="metric-value">${avgDealSize.toLocaleString()}</span>
            </div>
            <div class="health-metric ${closeRate > 20 ? 'good' : closeRate > 10 ? 'warning' : 'danger'}">
                <span class="metric-label">Close Rate</span>
                <span class="metric-value">${closeRate}%</span>
            </div>
            <div class="health-metric ${pipeline.length > 10 ? 'good' : pipeline.length > 5 ? 'warning' : 'danger'}">
                <span class="metric-label">Active Deals</span>
                <span class="metric-value">${pipeline.length}</span>
            </div>
        `;
    }

    // Inline Task Management
    showInlineTaskForm(taskToEdit = null) {
        const isEdit = !!taskToEdit;
        const modalTitle = isEdit ? 'Edit Task' : 'Add New Task';

        const taskContent = `
            <h3>${modalTitle}</h3>
            <form id="inlineTaskForm">
                <input type="hidden" id="taskId" value="${isEdit ? taskToEdit.id : ''}">
                
                <div class="form-group">
                    <label for="taskTitle">Task Title *</label>
                    <input type="text" id="taskTitle" name="title" required 
                           value="${isEdit ? taskToEdit.title : ''}"
                           placeholder="e.g., Follow up with Amazon team">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="taskPriority">Priority</label>
                        <select id="taskPriority" name="priority">
                            <option value="Low" ${isEdit && taskToEdit.priority === 'Low' ? 'selected' : ''}>Low</option>
                            <option value="Normal" ${isEdit && taskToEdit.priority === 'Normal' ? 'selected' : ''}>Normal</option>
                            <option value="High" ${isEdit && taskToEdit.priority === 'High' ? 'selected' : ''}>High</option>
                            <option value="Urgent" ${isEdit && taskToEdit.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="taskDueDate">Due Date</label>
                        <input type="date" id="taskDueDate" name="dueDate" 
                               value="${isEdit && taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <textarea id="taskDescription" name="description" 
                              placeholder="Task details and notes...">${isEdit ? taskToEdit.description || '' : ''}</textarea>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="action-btn">
                        ${isEdit ? 'Update Task' : 'Add Task'}
                    </button>
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('inlineTaskModal')">
                        Cancel
                    </button>
                    ${isEdit ? `
                        <button type="button" class="action-btn danger" onclick="dashboardModule.deleteInlineTask('${taskToEdit.id}')">
                            Delete Task
                        </button>
                    ` : ''}
                </div>
            </form>
        `;

        document.getElementById('inlineTaskContent').innerHTML = taskContent;

        // Handle form submission
        document.getElementById('inlineTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const task = Object.fromEntries(formData.entries());
            
            if (isEdit) {
                task.id = taskToEdit.id;
                DataManager.updateTask(task);
                UIHelpers.showNotification('Task updated successfully', 'success');
            } else {
                DataManager.addTask(task);
                UIHelpers.showNotification('Task added successfully', 'success');
            }
            
            UIHelpers.closeModal('inlineTaskModal');
            this.renderUpcomingTasks();
        });

        UIHelpers.showModal('inlineTaskModal');
    }

    editInlineTask(taskId) {
        const tasks = DataManager.getTasks ? DataManager.getTasks() : [];
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            this.showInlineTaskForm(task);
        }
    }

    deleteInlineTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            DataManager.deleteTask(taskId);
            UIHelpers.showNotification('Task deleted successfully', 'success');
            UIHelpers.closeModal('inlineTaskModal');
            this.renderUpcomingTasks();
        }
    }

    toggleTask(taskId) {
        const tasks = DataManager.getTasks ? DataManager.getTasks() : [];
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            DataManager.updateTask(task);
            this.renderUpcomingTasks();
            UIHelpers.showNotification(
                task.completed ? 'Task marked as completed! 🎉' : 'Task marked as pending',
                'success'
            );
        }
    }

    // Inline Contact Form
    showInlineContactForm() {
        const contactContent = `
            <h3>Add New Contact</h3>
            <form id="inlineContactForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="contactName">Full Name *</label>
                        <input type="text" id="contactName" name="name" required placeholder="e.g., John Smith">
                    </div>
                    <div class="form-group">
                        <label for="contactEmail">Email</label>
                        <input type="email" id="contactEmail" name="email" placeholder="john@company.com">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="contactCompany">Company *</label>
                        <input type="text" id="contactCompany" name="company" required placeholder="e.g., Amazon Web Services">
                    </div>
                    <div class="form-group">
                        <label for="contactRole">Role</label>
                        <input type="text" id="contactRole" name="role" placeholder="e.g., Senior Partner Manager">
                    </div>
                </div>

                <div class="form-group">
                    <label for="contactPhone">Phone</label>
                    <input type="tel" id="contactPhone" name="phone" placeholder="+1 (555) 123-4567">
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="action-btn">Add Contact</button>
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('inlineContactModal')">Cancel</button>
                </div>
            </form>
        `;

        document.getElementById('inlineContactContent').innerHTML = contactContent;

        document.getElementById('inlineContactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const contact = Object.fromEntries(formData.entries());
            
            DataManager.addContact(contact);
            UIHelpers.showNotification('Contact added successfully! 🎉', 'success');
            UIHelpers.closeModal('inlineContactModal');
            this.renderStats();
            this.renderRecentActivity();
        });

        UIHelpers.showModal('inlineContactModal');
    }

    // Inline Deal Form
    showInlineDealForm() {
        const dealContent = `
            <h3>Add New Deal</h3>
            <form id="inlineDealForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="dealName">Deal Name *</label>
                        <input type="text" id="dealName" name="dealName" required placeholder="e.g., Q4 Partnership Agreement">
                    </div>
                    <div class="form-group">
                        <label for="dealValue">Deal Value</label>
                        <input type="number" id="dealValue" name="value" placeholder="50000">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="dealContact">Contact</label>
                        <select id="dealContact" name="contactId">
                            <option value="">Select Contact</option>
                            ${this.getContactOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="dealStage">Stage</label>
                        <select id="dealStage" name="stage">
                            <option value="qualification">Qualification</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed-won">Closed Won</option>
                            <option value="closed-lost">Closed Lost</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="dealNotes">Notes</label>
                    <textarea id="dealNotes" name="notes" placeholder="Deal details, next steps, etc."></textarea>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="action-btn">Add Deal</button>
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('inlineDealModal')">Cancel</button>
                </div>
            </form>
        `;

        document.getElementById('inlineDealContent').innerHTML = dealContent;

        document.getElementById('inlineDealForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const deal = Object.fromEntries(formData.entries());
            deal.value = parseFloat(deal.value) || 0;
            
            DataManager.addPipelineEntry(deal);
            UIHelpers.showNotification('Deal added successfully! 💼', 'success');
            UIHelpers.closeModal('inlineDealModal');
            this.renderStats();
            this.renderRecentActivity();
            this.renderPipelineHealth();
        });

        UIHelpers.showModal('inlineDealModal');
    }

    getContactOptions() {
        const contacts = DataManager.getAllContacts();
        return contacts.map(contact => 
            `<option value="${contact.id}">${contact.name} (${contact.company})</option>`
        ).join('');
    }

    // Helper methods
    getTouchpointIcon(type) {
        const icons = {
            meeting: '🤝',
            call: '📞',
            email: '📧',
            demo: '🖥️',
            proposal: '📋',
            followup: '🔄',
            social: '🎉',
            other: '💼'
        };
        return icons[type] || '💼';
    }

    refreshDashboard() {
        this.renderIfActive();
        UIHelpers.showNotification('Dashboard refreshed! 🔄', 'success');
    }

    startAutoRefresh() {
        if (this.autoRefresh) {
            this.refreshInterval = setInterval(() => {
                if (AppController.currentTab === 'dashboard') {
                    this.renderStats();
                    this.renderRecentActivity();
                    this.renderUpcomingTasks();
                }
            }, 30000); // Refresh every 30 seconds
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
    }
}

// Create global instance
const dashboardModule = new DashboardModule();
console.log('✅ Enhanced Dashboard module loaded successfully');
