// Enhanced App Controller - Main Application Controller with Touchpoint Notifications & Smart Routing
const AppController = {
    modules: {},
    currentTab: 'dashboard',
    notifications: [],
    touchpointAlerts: [],
    notificationInterval: null,
    lastActivityCheck: null,

    init() {
        console.log('🚀 Enhanced AppController initializing with touchpoint notifications...');
        
        // Initialize all modules
        this.initializeModules();
        
        // Set up touchpoint notification system
        this.initializeTouchpointNotifications();
        
        // Set up periodic notification checks
        this.startNotificationMonitoring();
        
        // Load initial view
        this.switchTab('dashboard');
        
        // Set up global event listeners
        this.setupGlobalEventListeners();
        
        console.log('✅ Enhanced AppController initialized successfully with notifications');
    },

    initializeModules() {
        console.log('🔧 Initializing all modules with touchpoint integration...');
        
        // Core modules with touchpoint integration
        const moduleList = [
            { name: 'dashboard', module: dashboardModule, description: 'Dashboard with analytics' },
            { name: 'contacts', module: contactsModule, description: 'Contact management' },
            { name: 'teams', module: teamsModule, description: 'Team management' },
            { name: 'deals', module: dealsModule, description: 'Deal management' },
            { name: 'pipeline', module: pipelineModule, description: 'Pipeline management' },
            { name: 'touchpoints', module: touchpointTracker, description: 'Touchpoint tracking' },
            { name: 'relationships', module: relationshipsModule, description: 'Relationship mapping' },
            { name: 'teamImport', module: teamImportModule, description: 'Team import' }
        ];

        moduleList.forEach(({ name, module, description }) => {
            if (typeof module !== 'undefined') {
                this.modules[name] = module;
                
                // Initialize module if it has an init method
                if (typeof module.init === 'function') {
                    module.init();
                }
                
                console.log(`✅ ${description} module registered and initialized`);
            } else {
                console.warn(`⚠️ ${description} module not found (${name})`);
            }
        });

        // Initialize touchpoint tracker with special attention
        if (typeof touchpointTracker !== 'undefined') {
            // Ensure touchpoint tracker is fully initialized
            touchpointTracker.init();
            
            // Subscribe to touchpoint events for notifications
            this.subscribeTouchpointEvents();
            
            console.log('📞 Touchpoint tracking system fully integrated');
        }
        
        console.log(`🎯 Module initialization complete: ${Object.keys(this.modules).length} modules loaded`);
    },

    initializeTouchpointNotifications() {
        console.log('🔔 Setting up touchpoint notification system...');
        
        // Create notification container if it doesn't exist
        this.createNotificationContainer();
        
        // Check for immediate notifications
        this.checkTouchpointAlerts();
        
        // Set up notification badges
        this.updateNotificationBadges();
        
        console.log('✅ Touchpoint notification system ready');
    },

    createNotificationContainer() {
        // Remove existing container if present
        const existing = document.getElementById('app-notifications');
        if (existing) existing.remove();

        // Create new notification container
        const notificationHTML = `
            <div id="app-notifications" class="app-notifications-container">
                <!-- Notifications will be populated here -->
            </div>
            
            <!-- Notification Badge for Navigation -->
            <div id="notification-badge" class="notification-badge" style="display: none;">
                <span id="badge-count">0</span>
            </div>

            <style>
                .app-notifications-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 400px;
                    pointer-events: none;
                }

                .app-notification {
                    background: white;
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin-bottom: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    border-left: 4px solid #FF9900;
                    pointer-events: auto;
                    transform: translateX(420px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .app-notification.show {
                    transform: translateX(0);
                }

                .app-notification.priority-high {
                    border-left-color: #dc3545;
                    background: linear-gradient(135deg, #fff 0%, #ffe6e6 100%);
                }

                .app-notification.priority-medium {
                    border-left-color: #ffc107;
                    background: linear-gradient(135deg, #fff 0%, #fff8e1 100%);
                }

                .app-notification.priority-low {
                    border-left-color: #28a745;
                    background: linear-gradient(135deg, #fff 0%, #e8f5e8 100%);
                }

                .app-notification.touchpoint-alert {
                    border-left-color: #667eea;
                    background: linear-gradient(135deg, #fff 0%, #e8f0ff 100%);
                }

                .notification-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 8px;
                }

                .notification-title {
                    font-weight: 600;
                    color: #232F3E;
                    font-size: 0.95em;
                    margin: 0;
                    line-height: 1.3;
                }

                .notification-time {
                    color: #666;
                    font-size: 0.8em;
                    white-space: nowrap;
                    margin-left: 12px;
                }

                .notification-message {
                    color: #555;
                    font-size: 0.9em;
                    line-height: 1.4;
                    margin-bottom: 12px;
                }

                .notification-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .notification-btn {
                    background: #FF9900;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.8em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .notification-btn:hover {
                    background: #e68900;
                    transform: translateY(-1px);
                }

                .notification-btn.secondary {
                    background: #6c757d;
                }

                .notification-btn.secondary:hover {
                    background: #5a6268;
                }

                .notification-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 1.2em;
                    color: #999;
                    cursor: pointer;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .notification-close:hover {
                    background: rgba(0,0,0,0.1);
                    color: #666;
                }

                .notification-badge {
                    position: fixed;
                    top: 15px;
                    right: 15px;
                    background: #dc3545;
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8em;
                    font-weight: bold;
                    z-index: 10000;
                    animation: pulse 2s infinite;
                    cursor: pointer;
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                .notification-badge.hidden {
                    display: none;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .app-notifications-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }

                    .app-notification {
                        transform: translateY(-100px);
                        margin-bottom: 8px;
                    }

                    .app-notification.show {
                        transform: translateY(0);
                    }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', notificationHTML);

        // Add badge click handler
        document.getElementById('notification-badge').addEventListener('click', () => {
            this.showNotificationCenter();
        });
    },

    subscribeTouchpointEvents() {
        if (typeof window.subscribeTouchpoints === 'function') {
            window.subscribeTouchpoints('appController', (eventType, data) => {
                console.log(`🔔 AppController received ${eventType}:`, data);
                
                switch(eventType) {
                    case 'touchpoint:logged':
                        this.handleTouchpointLogged(data);
                        break;
                    case 'touchpoint:updated':
                        this.handleTouchpointUpdated(data);
                        break;
                    case 'touchpoint:deleted':
                        this.handleTouchpointDeleted(data);
                        break;
                }
                
                // Update notification badges
                this.updateNotificationBadges();
            });
        }
    },

    handleTouchpointLogged(touchpoint) {
        const contactName = this.getEntityName(touchpoint);
        
        // Show success notification
        this.showNotification({
            type: 'touchpoint-alert',
            priority: 'low',
            title: '📞 Touchpoint Logged',
            message: `Successfully logged ${this.getTypeLabel(touchpoint.type)} with ${contactName}`,
            actions: [
                {
                    label: 'View Details',
                    action: () => this.viewTouchpointDetails(touchpoint.id)
                }
            ],
            autoHide: 4000
        });

        // Check if this touchpoint has relationship impact
        if (touchpoint.relationshipScoreImpact > 0) {
            setTimeout(() => {
                this.showNotification({
                    type: 'priority-medium',
                    title: '📈 Relationship Improved',
                    message: `Relationship score increased by +${touchpoint.relationshipScoreImpact} points with ${contactName}!`,
                    autoHide: 3000
                });
            }, 1000);
        }
    },

    handleTouchpointUpdated(touchpoint) {
        const contactName = this.getEntityName(touchpoint);
        
        this.showNotification({
            type: 'touchpoint-alert',
            priority: 'low',
            title: '📝 Touchpoint Updated',
            message: `Updated touchpoint with ${contactName}`,
            autoHide: 3000
        });
    },

    handleTouchpointDeleted(touchpoint) {
        const contactName = this.getEntityName(touchpoint);
        
        this.showNotification({
            type: 'priority-medium',
            title: '🗑️ Touchpoint Deleted',
            message: `Removed touchpoint with ${contactName}`,
            autoHide: 3000
        });
    },

    startNotificationMonitoring() {
        // Check for notifications every 5 minutes
        this.notificationInterval = setInterval(() => {
            this.checkTouchpointAlerts();
            this.checkOverdueFollowUps();
            this.checkStaleContacts();
            this.updateNotificationBadges();
        }, 5 * 60 * 1000);

        // Initial check
        setTimeout(() => {
            this.checkTouchpointAlerts();
            this.checkOverdueFollowUps();
            this.checkStaleContacts();
        }, 2000);
    },

    checkTouchpointAlerts() {
        try {
            // Check for overdue follow-ups
            const overdueFollowUps = this.getOverdueFollowUps();
            if (overdueFollowUps.length > 0) {
                this.showNotification({
                    type: 'priority-high',
                    title: '⚠️ Overdue Follow-ups',
                    message: `You have ${overdueFollowUps.length} overdue follow-up${overdueFollowUps.length === 1 ? '' : 's'} requiring attention`,
                    actions: [
                        {
                            label: 'View Follow-ups',
                            action: () => this.switchTab('touchpoints', 'followups')
                        }
                    ],
                    persistent: true
                });
            }

            // Check for deals needing attention
            this.checkDealAlerts();
            
        } catch (error) {
            console.error('Error checking touchpoint alerts:', error);
        }
    },

    checkOverdueFollowUps() {
        if (typeof window.getRecentTouchpoints === 'function') {
            const touchpoints = window.getRecentTouchpoints({ hasFollowUp: true });
            const now = new Date();
            
            const overdue = touchpoints.filter(tp => 
                tp.followUpDate && new Date(tp.followUpDate) < now && !tp.followUpCompleted
            );

            if (overdue.length > 0 && !this.hasRecentNotification('overdue-followups')) {
                this.showNotification({
                    type: 'priority-high',
                    title: '🚨 Urgent Follow-ups',
                    message: `${overdue.length} follow-up${overdue.length === 1 ? ' is' : 's are'} overdue and need immediate attention`,
                    actions: [
                        {
                            label: 'Review Now',
                            action: () => this.switchTab('touchpoints', 'followups')
                        },
                        {
                            label: 'Dismiss',
                            action: () => this.dismissNotificationType('overdue-followups')
                        }
                    ],
                    persistent: true,
                    notificationType: 'overdue-followups'
                });
            }
        }
    },

    checkStaleContacts() {
        try {
            const contacts = DataManager.getAllContacts();
            const staleContacts = contacts.filter(contact => {
                const daysSince = this.daysSinceLastTouchpoint(contact.id);
                return daysSince > 30;
            });

            if (staleContacts.length > 5 && !this.hasRecentNotification('stale-contacts')) {
                this.showNotification({
                    type: 'priority-medium',
                    title: '📅 Stale Contacts Alert',
                    message: `${staleContacts.length} contacts haven't been contacted in 30+ days`,
                    actions: [
                        {
                            label: 'View Contacts',
                            action: () => this.switchTab('contacts')
                        }
                    ],
                    autoHide: 8000,
                    notificationType: 'stale-contacts'
                });
            }
        } catch (error) {
            console.error('Error checking stale contacts:', error);
        }
    },

    checkDealAlerts() {
        try {
            if (typeof DataManager.getDeals === 'function') {
                const deals = DataManager.getDeals();
                const now = new Date();
                
                // Check for deals closing soon
                const closingSoon = deals.filter(deal => {
                    const closeDate = new Date(deal.closeDate);
                    const daysToClose = Math.ceil((closeDate - now) / (1000 * 60 * 60 * 24));
                    return daysToClose <= 7 && daysToClose >= 0 && deal.value >= 50000;
                });

                if (closingSoon.length > 0 && !this.hasRecentNotification('deals-closing')) {
                    this.showNotification({
                        type: 'priority-medium',
                        title: '💰 High-Value Deals Closing',
                        message: `${closingSoon.length} deal${closingSoon.length === 1 ? '' : 's'} worth $${this.formatValue(closingSoon.reduce((sum, deal) => sum + deal.value, 0))} closing within 7 days`,
                        actions: [
                            {
                                label: 'View Pipeline',
                                action: () => this.switchTab('pipeline')
                            }
                        ],
                        autoHide: 10000,
                        notificationType: 'deals-closing'
                    });
                }

                // Check for overdue deals
                const overdueDeals = deals.filter(deal => {
                    const closeDate = new Date(deal.closeDate);
                    return closeDate < now && !['deal-won', 'deal-lost'].includes(deal.stage);
                });

                if (overdueDeals.length > 0 && !this.hasRecentNotification('deals-overdue')) {
                    this.showNotification({
                        type: 'priority-high',
                        title: '🚨 Overdue Deals',
                        message: `${overdueDeals.length} deal${overdueDeals.length === 1 ? ' is' : 's are'} past their expected close date`,
                        actions: [
                            {
                                label: 'Update Deals',
                                action: () => this.switchTab('pipeline')
                            }
                        ],
                        persistent: true,
                        notificationType: 'deals-overdue'
                    });
                }
            }
        } catch (error) {
            console.error('Error checking deal alerts:', error);
        }
    },

    showNotification(options) {
        const notification = {
            id: this.generateNotificationId(),
            timestamp: new Date(),
            ...options
        };

        // Add to notification array
        this.notifications.unshift(notification);

        // Limit to 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        // Create and show notification element
        this.displayNotification(notification);

        // Update badge
        this.updateNotificationBadges();

        return notification.id;
    },

    displayNotification(notification) {
        const container = document.getElementById('app-notifications');
        if (!container) return;

        const notificationEl = document.createElement('div');
        notificationEl.className = `app-notification ${notification.type} priority-${notification.priority}`;
        notificationEl.id = `notification-${notification.id}`;

        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        notificationEl.innerHTML = `
            <button class="notification-close" onclick="AppController.dismissNotification('${notification.id}')">&times;</button>
            <div class="notification-header">
                <h4 class="notification-title">${notification.title}</h4>
                <span class="notification-time">${timeAgo}</span>
            </div>
            <div class="notification-message">${notification.message}</div>
            ${notification.actions ? `
                <div class="notification-actions">
                    ${notification.actions.map((action, index) => `
                        <button class="notification-btn ${index === 0 ? '' : 'secondary'}" 
                                onclick="AppController.executeNotificationAction('${notification.id}', ${index})">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        container.appendChild(notificationEl);

        // Trigger animation
        setTimeout(() => notificationEl.classList.add('show'), 50);

        // Auto-hide if specified
        if (notification.autoHide && !notification.persistent) {
            setTimeout(() => {
                this.dismissNotification(notification.id);
            }, notification.autoHide);
        }
    },

    executeNotificationAction(notificationId, actionIndex) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && notification.actions && notification.actions[actionIndex]) {
            try {
                notification.actions[actionIndex].action();
                this.dismissNotification(notificationId);
            } catch (error) {
                console.error('Error executing notification action:', error);
            }
        }
    },

    dismissNotification(notificationId) {
        const notificationEl = document.getElementById(`notification-${notificationId}`);
        if (notificationEl) {
            notificationEl.classList.remove('show');
            setTimeout(() => {
                notificationEl.remove();
            }, 400);
        }

        // Remove from notifications array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.updateNotificationBadges();
    },

    updateNotificationBadges() {
        const badge = document.getElementById('notification-badge');
        const count = document.getElementById('badge-count');
        
        if (badge && count) {
            const activeCount = this.notifications.filter(n => !n.dismissed).length;
            
            if (activeCount > 0) {
                count.textContent = activeCount > 99 ? '99+' : activeCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }

        // Update navigation indicators
        this.updateNavigationIndicators();
    },

    updateNavigationIndicators() {
        // Add notification indicators to relevant navigation tabs
        const indicators = {
            'touchpoints': this.getOverdueFollowUps().length,
            'pipeline': this.getOverdueDeals().length,
            'contacts': this.getStaleContacts().length
        };

        Object.entries(indicators).forEach(([tab, count]) => {
            const navBtn = document.querySelector(`[data-tab="${tab}"]`);
            if (navBtn) {
                // Remove existing indicator
                const existing = navBtn.querySelector('.nav-indicator');
                if (existing) existing.remove();

                // Add new indicator if count > 0
                if (count > 0) {
                    const indicator = document.createElement('span');
                    indicator.className = 'nav-indicator';
                    indicator.textContent = count > 99 ? '99+' : count;
                    indicator.style.cssText = `
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        background: #dc3545;
                        color: white;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        font-size: 0.7em;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                    `;
                    navBtn.style.position = 'relative';
                    navBtn.appendChild(indicator);
                }
            }
        });
    },

    setupGlobalEventListeners() {
        // Listen for browser visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible - check for new alerts
                setTimeout(() => {
                    this.checkTouchpointAlerts();
                    this.updateNotificationBadges();
                }, 1000);
            }
        });

        // Listen for focus events
        window.addEventListener('focus', () => {
            this.checkTouchpointAlerts();
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + N - Show notifications
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.showNotificationCenter();
            }
        });
    },

    switchTab(tabName, subView = null) {
        console.log(`🔀 Switching to tab: ${tabName}${subView ? ` (${subView})` : ''}`);
        
        let container;
        
        try {
            // Update active button
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (targetButton) {
                targetButton.classList.add('active');
            }
            
            // Update current tab
            this.currentTab = tabName;
            
            // Get content container
            container = document.getElementById('content-area');
            if (!container) {
                console.error('Content area not found');
                return;
            }
            
            // Show loading state
            container.innerHTML = '<div class="loading">Loading...</div>';
            
            // Route to appropriate module
            switch(tabName) {
                case 'dashboard':
                    if (this.modules.dashboard) {
                        this.modules.dashboard.render(container);
                    } else {
                        this.showModuleError(container, 'Dashboard');
                    }
                    break;
                    
                case 'teams':
                    if (this.modules.teams) {
                        this.modules.teams.render(container);
                    } else {
                        this.showModuleError(container, 'Teams');
                    }
                    break;
                    
                case 'pipeline':
                    if (this.modules.pipeline) {
                        this.modules.pipeline.render(container);
                    } else if (this.modules.deals) {
                        this.modules.deals.render(container);
                    } else {
                        this.showModuleError(container, 'Pipeline');
                    }
                    break;

                case 'deals':
                    if (this.modules.deals) {
                        this.modules.deals.render(container);
                    } else {
                        this.showModuleError(container, 'Deals');
                    }
                    break;
                    
                case 'touchpoints':
                    if (this.modules.touchpoints) {
                        this.modules.touchpoints.render(container);
                        // Switch to specific sub-view if requested
                        if (subView) {
                            setTimeout(() => {
                                if (this.modules.touchpoints.switchView) {
                                    this.modules.touchpoints.switchView(subView);
                                }
                            }, 100);
                        }
                    } else {
                        this.showModuleError(container, 'Touchpoints');
                    }
                    break;
                    
                case 'contacts':
                    if (this.modules.contacts) {
                        this.modules.contacts.render(container);
                    } else {
                        this.showModuleError(container, 'Contacts');
                    }
                    break;
                    
                case 'relationships':
                    if (this.modules.relationships) {
                        this.modules.relationships.render(container);
                    } else {
                        this.showModuleError(container, 'Relationships');
                    }
                    break;
                    
                case 'team-import':
                    if (this.modules.teamImport) {
                        this.modules.teamImport.render(container);
                    } else {
                        this.showModuleError(container, 'Team Import');
                    }
                    break;
                    
                default:
                    container.innerHTML = `
                        <div class="error">
                            <h3>🚫 Page Not Found</h3>
                            <p>The requested page "${tabName}" could not be found.</p>
                            <p>Available pages: Dashboard, Teams, Pipeline, Touchpoints, Contacts, Relationships, Team Import</p>
                            <button onclick="AppController.switchTab('dashboard')" 
                                    style="background: #FF9900; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                                🏠 Go to Dashboard
                            </button>
                        </div>
                    `;
                    console.warn(`Unknown tab: ${tabName}`);
            }
            
            // Update notification indicators after tab switch
            setTimeout(() => this.updateNavigationIndicators(), 100);
            
        } catch (error) {
            console.error('Error switching tabs:', error);
            
            if (!container) {
                container = document.getElementById('content-area');
            }
            
            if (container) {
                container.innerHTML = `
                    <div class="error">
                        <h3>🚫 Navigation Error</h3>
                        <p>An error occurred while switching to "${tabName}".</p>
                        <p><strong>Error:</strong> ${error.message}</p>
                        <button onclick="location.reload()" 
                                style="background: #FF9900; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                            🔄 Refresh Page
                        </button>
                    </div>
                `;
            }
        }
    },

    showModuleError(container, moduleName) {
        container.innerHTML = `
            <div class="error">
                <h3>🚫 Module Not Available</h3>
                <p>The ${moduleName} module is not currently loaded.</p>
                <p>Please check that the module file is properly uploaded and included in the page.</p>
                <p><strong>Expected file:</strong> js/modules/${moduleName.toLowerCase().replace(' ', '-')}-module.js</p>
                <div style="margin-top: 15px;">
                    <button onclick="AppController.switchTab('dashboard')" 
                            style="background: #FF9900; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        🏠 Go to Dashboard
                    </button>
                    <button onclick="location.reload()" 
                            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                        🔄 Refresh Page
                    </button>
                </div>
            </div>
        `;
    },

    // Notification Center
    showNotificationCenter() {
        const centerContent = `
            <h3>🔔 Notification Center</h3>
            <div style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
                    <span style="color: #666;">Showing ${this.notifications.length} notifications</span>
                    <button class="notification-btn secondary" onclick="AppController.clearAllNotifications()">
                        Clear All
                    </button>
                </div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                ${this.notifications.length > 0 ? this.notifications.map(notification => `
                    <div class="notification-center-item" style="padding: 15px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="AppController.dismissNotification('${notification.id}')">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <strong>${notification.title}</strong>
                            <span style="color: #666; font-size: 0.8em;">${this.getTimeAgo(notification.timestamp)}</span>
                        </div>
                        <div style="color: #666; font-size: 0.9em;">${notification.message}</div>
                    </div>
                `).join('') : `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 3em; margin-bottom: 15px;">🔕</div>
                        <h4>No notifications</h4>
                        <p>You're all caught up!</p>
                    </div>
                `}
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button class="notification-btn secondary" onclick="UIHelpers.closeModal('notificationCenterModal')">
                    Close
                </button>
            </div>
        `;
        
        // Create modal if it doesn't exist
        if (!document.getElementById('notificationCenterModal')) {
            const modalHTML = `
                <div id="notificationCenterModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('notificationCenterModal')">&times;</span>
                        <div id="notificationCenterContent"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        document.getElementById('notificationCenterContent').innerHTML = centerContent;
        UIHelpers.showModal('notificationCenterModal');
    },

    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationBadges();
        
        // Remove all visible notifications
        const notifications = document.querySelectorAll('.app-notification');
        notifications.forEach(notification => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 400);
        });
        
        UIHelpers.closeModal('notificationCenterModal');
        UIHelpers.showNotification('All notifications cleared', 'success');
    },

    // Utility Methods
    getEntityName(touchpoint) {
        if (touchpoint.contactId && typeof DataManager !== 'undefined') {
            const contact = DataManager.getContactById(touchpoint.contactId);
            if (contact) return contact.name;
        }
        
        if (touchpoint.teamMemberId && touchpoint.teamId && typeof DataManager !== 'undefined') {
            const member = DataManager.getTeamMember(touchpoint.teamId, touchpoint.teamMemberId);
            if (member) return member.name;
        }
        
        return 'Unknown Contact';
    },

    getTypeLabel(type) {
        const labels = {
            'call': 'call',
            'email': 'email',
            'meeting': 'meeting',
            'text': 'text message',
            'event': 'event',
            'other': 'touchpoint'
        };
        return labels[type] || 'touchpoint';
    },

    viewTouchpointDetails(touchpointId) {
        this.switchTab('touchpoints');
        setTimeout(() => {
            if (typeof touchpointTracker !== 'undefined' && touchpointTracker.showTouchpointDetails) {
                touchpointTracker.showTouchpointDetails(touchpointId);
            }
        }, 500);
    },

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
    },

    getOverdueFollowUps() {
        if (typeof window.getRecentTouchpoints === 'function') {
            const touchpoints = window.getRecentTouchpoints({ hasFollowUp: true });
            const now = new Date();
            return touchpoints.filter(tp => 
                tp.followUpDate && new Date(tp.followUpDate) < now && !tp.followUpCompleted
            );
        }
        return [];
    },

    getOverdueDeals() {
        try {
            if (typeof DataManager.getDeals === 'function') {
                const deals = DataManager.getDeals();
                const now = new Date();
                return deals.filter(deal => {
                    const closeDate = new Date(deal.closeDate);
                    return closeDate < now && !['deal-won', 'deal-lost'].includes(deal.stage);
                });
            }
        } catch (error) {
            console.error('Error getting overdue deals:', error);
        }
        return [];
    },

    getStaleContacts() {
        try {
            const contacts = DataManager.getAllContacts();
            return contacts.filter(contact => {
                const daysSince = this.daysSinceLastTouchpoint(contact.id);
                return daysSince > 30;
            });
        } catch (error) {
            console.error('Error getting stale contacts:', error);
        }
        return [];
    },

    hasRecentNotification(type) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.notifications.some(n => 
            n.notificationType === type && n.timestamp > fiveMinutesAgo
        );
    },

    dismissNotificationType(type) {
        this.notifications = this.notifications.filter(n => n.notificationType !== type);
        this.updateNotificationBadges();
    },

    generateNotificationId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        
        return date.toLocaleDateString();
    },

    formatValue(value) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'K';
        }
        return value.toLocaleString();
    },

    // Debug and utility methods
    getCurrentModule() {
        return this.modules[this.currentTab];
    },

    isModuleLoaded(moduleName) {
        return !!this.modules[moduleName];
    },

    getModuleInfo() {
        const info = {
            currentTab: this.currentTab,
            loadedModules: Object.keys(this.modules),
            notifications: this.notifications.length,
            moduleDetails: {}
        };
        
        Object.keys(this.modules).forEach(moduleName => {
            const module = this.modules[moduleName];
            info.moduleDetails[moduleName] = {
                hasRender: typeof module.render === 'function',
                hasInit: typeof module.init === 'function',
                initialized: true
            };
        });
        
        return info;
    },

    debug() {
        console.log('=== Enhanced AppController Debug Info ===');
        console.log('Current tab:', this.currentTab);
        console.log('Loaded modules:', Object.keys(this.modules));
        console.log('Active notifications:', this.notifications.length);
        console.log('Overdue follow-ups:', this.getOverdueFollowUps().length);
        console.log('Overdue deals:', this.getOverdueDeals().length);
        console.log('Stale contacts:', this.getStaleContacts().length);
        console.log('Module details:', this.getModuleInfo());
        
        // Test each module
        Object.keys(this.modules).forEach(moduleName => {
            const module = this.modules[moduleName];
            console.log(`${moduleName} module:`, {
                hasRender: typeof module.render === 'function',
                hasInit: typeof module.init === 'function',
                constructor: module.constructor.name
            });
        });
    },

    // Cleanup method
    destroy() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
        
        // Unsubscribe from touchpoint events
        if (typeof window.unsubscribeTouchpoints === 'function') {
            window.unsubscribeTouchpoints('appController');
        }
        
        // Clear notifications
        this.notifications = [];
        
        console.log('AppController cleaned up');
    }
};

// Global function to handle navigation (called from HTML)
function switchTab(tabName) {
    AppController.switchTab(tabName);
}

console.log('✅ Enhanced AppController with touchpoint notifications and smart routing loaded successfully');
