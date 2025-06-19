// App Controller - Main application controller and router
const AppController = {
    modules: {},
    currentTab: 'dashboard',

    init() {
        console.log('AppController initializing...');
        
        // Initialize all modules
        this.initializeModules();
        
        // Load initial view
        this.switchTab('dashboard');
        
        console.log('AppController initialized successfully');
    },

    initializeModules() {
        console.log('Initializing modules...');
        
        // Register dashboard module
        if (typeof dashboardModule !== 'undefined') {
            this.modules.dashboard = dashboardModule;
            dashboardModule.init();
            console.log('✅ Dashboard module registered');
        } else {
            console.warn('⚠️ Dashboard module not found');
        }
        
        // Register contacts module
        if (typeof contactsModule !== 'undefined') {
            this.modules.contacts = contactsModule;
            contactsModule.init();
            console.log('✅ Contacts module registered');
        } else {
            console.warn('⚠️ Contacts module not found');
        }
        
        // Register teams module
        if (typeof teamsModule !== 'undefined') {
            this.modules.teams = teamsModule;
            teamsModule.init();
            console.log('✅ Teams module registered');
        } else {
            console.warn('⚠️ Teams module not found');
        }
        
        // Register pipeline module
        if (typeof pipelineModule !== 'undefined') {
            this.modules.pipeline = pipelineModule;
            pipelineModule.init();
            console.log('✅ Pipeline module registered');
        } else {
            console.warn('⚠️ Pipeline module not found');
        }
        
        // Register touchpoints module
        if (typeof touchpointsModule !== 'undefined') {
            this.modules.touchpoints = touchpointsModule;
            touchpointsModule.init();
            console.log('✅ Touchpoints module registered');
        } else {
            console.warn('⚠️ Touchpoints module not found');
        }
        
        // Register relationships module
        if (typeof relationshipsModule !== 'undefined') {
            this.modules.relationships = relationshipsModule;
            relationshipsModule.init();
            console.log('✅ Relationships module registered');
        } else {
            console.warn('⚠️ Relationships module not found');
        }
        
        console.log('Module initialization complete');
        console.log('Registered modules:', Object.keys(this.modules));
    },

    switchTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        
        let container; // Declare container at the top to avoid scope issues
        
        try {
            // Update active button
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (targetButton) {
                targetButton.classList.add('active');
            } else {
                console.warn(`Button for tab '${tabName}' not found`);
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
                    } else {
                        this.showModuleError(container, 'Pipeline');
                    }
                    break;
                    
                case 'touchpoints':
                    if (this.modules.touchpoints) {
                        this.modules.touchpoints.render(container);
                    } else {
                        this.showModuleError(container, 'Touchpoints');
                    }
                    break;
                    
                case 'relationships':
                    if (this.modules.relationships) {
                        this.modules.relationships.render(container);
                    } else {
                        this.showModuleError(container, 'Relationships');
                    }
                    break;
                    
                default:
                    container.innerHTML = `
                        <div class="error">
                            <h3>🚫 Page Not Found</h3>
                            <p>The requested page "${tabName}" could not be found.</p>
                            <p>Available pages: Dashboard, Teams, Pipeline, Touchpoints, Relationships</p>
                            <button onclick="AppController.switchTab('dashboard')" 
                                    style="background: #FF9900; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                                🏠 Go to Dashboard
                            </button>
                        </div>
                    `;
                    console.warn(`Unknown tab: ${tabName}`);
            }
            
        } catch (error) {
            console.error('Error switching tabs:', error);
            
            // Make sure container is available for error display
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
                <p><strong>Expected file:</strong> js/modules/${moduleName.toLowerCase()}-module.js</p>
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

    // Utility method to get current module
    getCurrentModule() {
        return this.modules[this.currentTab];
    },

    // Utility method to check if a module is loaded
    isModuleLoaded(moduleName) {
        return !!this.modules[moduleName];
    },

    // Method to get module info for debugging
    getModuleInfo() {
        const info = {
            currentTab: this.currentTab,
            loadedModules: Object.keys(this.modules),
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

    // Method for debugging - call AppController.debug() in console
    debug() {
        console.log('=== AppController Debug Info ===');
        console.log('Current tab:', this.currentTab);
        console.log('Loaded modules:', Object.keys(this.modules));
        console.log('Module details:', this.getModuleInfo());
        console.log('DataManager available:', typeof DataManager !== 'undefined');
        console.log('UIHelpers available:', typeof UIHelpers !== 'undefined');
        
        // Test each module
        Object.keys(this.modules).forEach(moduleName => {
            const module = this.modules[moduleName];
            console.log(`${moduleName} module:`, {
                hasRender: typeof module.render === 'function',
                hasInit: typeof module.init === 'function',
                constructor: module.constructor.name
            });
        });
    }
};

// Global function to handle navigation (called from HTML)
function switchTab(tabName) {
    AppController.switchTab(tabName);
}

console.log('✅ AppController loaded successfully');
