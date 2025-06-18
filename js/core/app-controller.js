// Main application controller
const AppController = {
    currentTab: 'teams',
    modules: {},

    init() {
        console.log('Initializing AWS Partner Tracker...');
        
        // Initialize data manager first
        DataManager.init();
        
        // Initialize all modules
        this.initializeModules();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial data and render
        this.loadInitialData();
        
        UIHelpers.showNotification('Partner Management System loaded successfully!', 4000);
    },

    initializeModules() {
        // Register modules as they become available
        if (typeof dashboardModule !== 'undefined') {
            this.modules.dashboard = dashboardModule;
            dashboardModule.init();
            console.log('Dashboard module registered');
        }
        
        if (typeof contactsModule !== 'undefined') {
            this.modules.contacts = contactsModule;
            contactsModule.init();
            console.log('Contacts module registered');
        }
        
        if (typeof dealsModule !== 'undefined') {
            this.modules.deals = dealsModule;
            dealsModule.init();
            console.log('Deals module registered');
        }
        
        if (typeof touchpointsModule !== 'undefined') {
            this.modules.touchpoints = touchpointsModule;
            touchpointsModule.init();
            console.log('Touchpoints module registered');
        }

        if (typeof teamsModule !== 'undefined') {
            this.modules.teams = teamsModule;
            teamsModule.init();
            console.log('Teams module registered');
        }

        if (typeof touchpointsModule !== 'undefined') {
            this.modules.touchpoints = touchpointsModule;
            touchpointsModule.init();
            console.log('Touchpoints module registered');
        }

        if (typeof relationshipsModule !== 'undefined') {
            this.modules.relationships = relationshipsModule;
            relationshipsModule.init();
            console.log('Relationships module registered');
        }
    },

    showTab(tabName) {
        // Update tab UI
        document.querySelectorAll('.tab').forEach(tab => 
            tab.classList.remove('active'));
        
        // Find and activate the clicked tab
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        // Clear content area and show loading
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '<div class="loading">Loading...</div>';
        
        // Let the appropriate module handle rendering
        if (this.modules[tabName]) {
            this.modules[tabName].render(contentArea);
        } else {
            contentArea.innerHTML = `
                <h3>${tabName.charAt(0).toUpperCase() + tabName.slice(1)} - Coming Soon</h3>
                <p>This module will be available in the next update.</p>
            `;
        }
        
        this.currentTab = tabName;
    },

    setupEventListeners() {
        // Global event listeners that don't belong to specific modules
        
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        // Handle escape key for modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });
    },

    loadInitialData() {
        // Load sample data for development
        DataManager.loadSampleData();
        
        // Render dashboard
        if (this.modules.dashboard) {
            this.modules.dashboard.render();
        }
        
        // Show default tab
        this.showTab('teams');
    },

    // Method for modules to communicate
    broadcast(event, data) {
        Object.values(this.modules).forEach(module => {
            if (module.onEvent) {
                module.onEvent(event, data);
            }
        });
    },

    // Utility method to refresh all modules
    refreshAll() {
        Object.values(this.modules).forEach(module => {
            if (module.refresh) {
                module.refresh();
            }
        });
    },

    // Method to get a specific module
    getModule(name) {
        return this.modules[name];
    }
};
