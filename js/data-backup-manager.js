// Data Backup Manager - Export/Import All Data
class DataBackupManager {
    constructor() {
        this.version = '1.0';
    }

    // Export all data as a single JSON file
    exportAllData() {
        try {
            const allData = {
                version: this.version,
                exportDate: new Date().toISOString(),
                appName: 'AWS Partner Tracker',
                data: {
                    contacts: DataManager.getAllContacts(),
                    pipeline: DataManager.getPipeline(),
                    touchpoints: DataManager.getTouchpoints(),
                    tasks: DataManager.getTasks ? DataManager.getTasks() : [],
                    settings: this.getAppSettings()
                },
                stats: {
                    totalContacts: DataManager.getAllContacts().length,
                    totalPipeline: DataManager.getPipeline().length,
                    totalTouchpoints: DataManager.getTouchpoints().length,
                    totalTasks: DataManager.getTasks ? DataManager.getTasks().length : 0
                }
            };

            const dataStr = JSON.stringify(allData, null, 2);
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `aws-partner-tracker-backup-${timestamp}.json`;
            
            this.downloadFile(dataStr, filename, 'application/json');
            
            UIHelpers.showNotification(
                `✅ Complete backup exported successfully! (${this.formatFileSize(dataStr.length)})`, 
                'success'
            );
            
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            UIHelpers.showNotification('❌ Export failed: ' + error.message, 'error');
            return false;
        }
    }

    // Import data from JSON file
    async importAllData(file) {
        try {
            const fileContent = await this.readFile(file);
            const importedData = JSON.parse(fileContent);
            
            // Validate the backup file
            if (!this.validateBackupFile(importedData)) {
                throw new Error('Invalid backup file format');
            }
            
            // Show confirmation dialog with import details
            const confirmImport = await this.showImportConfirmation(importedData);
            if (!confirmImport) {
                UIHelpers.showNotification('Import cancelled', 'info');
                return false;
            }
            
            // Backup current data before importing
            const currentBackup = this.createEmergencyBackup();
            
            try {
                // Import data with options
                await this.performImport(importedData);
                
                UIHelpers.showNotification(
                    '✅ Data imported successfully! Page will refresh to apply changes.', 
                    'success'
                );
                
                // Refresh the page to reload all modules with new data
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
                return true;
                
            } catch (importError) {
                // Restore from emergency backup if import fails
                this.restoreEmergencyBackup(currentBackup);
                throw new Error('Import failed, data restored: ' + importError.message);
            }
            
        } catch (error) {
            console.error('Import failed:', error);
            UIHelpers.showNotification('❌ Import failed: ' + error.message, 'error');
            return false;
        }
    }

    // Show import confirmation dialog
    showImportConfirmation(importedData) {
        return new Promise((resolve) => {
            const stats = importedData.stats;
            const exportDate = new Date(importedData.exportDate).toLocaleDateString();
            
            const confirmContent = `
                <h3>⚠️ Confirm Data Import</h3>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                    <strong>Warning:</strong> This will replace ALL your current data!
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div>
                        <h4>📁 Import File Details:</h4>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Export Date: ${exportDate}</li>
                            <li>Version: ${importedData.version}</li>
                            <li>Contacts: ${stats.totalContacts}</li>
                            <li>Pipeline: ${stats.totalPipeline}</li>
                            <li>Touchpoints: ${stats.totalTouchpoints}</li>
                            <li>Tasks: ${stats.totalTasks}</li>
                        </ul>
                    </div>
                    <div>
                        <h4>📊 Current Data:</h4>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Contacts: ${DataManager.getAllContacts().length}</li>
                            <li>Pipeline: ${DataManager.getPipeline().length}</li>
                            <li>Touchpoints: ${DataManager.getTouchpoints().length}</li>
                            <li>Tasks: ${DataManager.getTasks ? DataManager.getTasks().length : 0}</li>
                        </ul>
                    </div>
                </div>
                
                <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
                    <strong>Safety:</strong> Your current data will be automatically backed up before import.
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="action-btn" onclick="backupManager.confirmImport(true)">
                        ✅ Import Data
                    </button>
                    <button class="action-btn secondary" onclick="backupManager.confirmImport(false)">
                        ❌ Cancel
                    </button>
                </div>
            `;
            
            // Store the resolve function for the confirmation buttons
            this.importResolver = resolve;
            
            // Show modal
            document.getElementById('backupModalContent').innerHTML = confirmContent;
            UIHelpers.showModal('backupModal');
        });
    }

    confirmImport(proceed) {
        UIHelpers.closeModal('backupModal');
        if (this.importResolver) {
            this.importResolver(proceed);
            this.importResolver = null;
        }
    }

    // Validate backup file structure
    validateBackupFile(data) {
        const requiredFields = ['version', 'exportDate', 'appName', 'data'];
        const requiredDataFields = ['contacts', 'pipeline', 'touchpoints'];
        
        // Check main structure
        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Check data structure
        for (const field of requiredDataFields) {
            if (!data.data.hasOwnProperty(field)) {
                throw new Error(`Missing data field: ${field}`);
            }
            if (!Array.isArray(data.data[field])) {
                throw new Error(`Invalid data format for: ${field}`);
            }
        }
        
        // Check if it's from AWS Partner Tracker
        if (data.appName !== 'AWS Partner Tracker') {
            throw new Error('This backup file is not from AWS Partner Tracker');
        }
        
        return true;
    }

    // Create emergency backup of current data
    createEmergencyBackup() {
        return {
            contacts: DataManager.getAllContacts(),
            pipeline: DataManager.getPipeline(),
            touchpoints: DataManager.getTouchpoints(),
            tasks: DataManager.getTasks ? DataManager.getTasks() : []
        };
    }

    // Restore from emergency backup
    restoreEmergencyBackup(backup) {
        try {
            localStorage.setItem('awsPartnerTracker_contacts', JSON.stringify(backup.contacts));
            localStorage.setItem('awsPartnerTracker_pipeline', JSON.stringify(backup.pipeline));
            localStorage.setItem('awsPartnerTracker_touchpoints', JSON.stringify(backup.touchpoints));
            if (backup.tasks) {
                localStorage.setItem('awsPartnerTracker_tasks', JSON.stringify(backup.tasks));
            }
        } catch (error) {
            console.error('Failed to restore emergency backup:', error);
        }
    }

    // Perform the actual import
    async performImport(importedData) {
        const data = importedData.data;
        
        // Clear existing data and import new data
        localStorage.setItem('awsPartnerTracker_contacts', JSON.stringify(data.contacts));
        localStorage.setItem('awsPartnerTracker_pipeline', JSON.stringify(data.pipeline));
        localStorage.setItem('awsPartnerTracker_touchpoints', JSON.stringify(data.touchpoints));
        
        // Import tasks if they exist
        if (data.tasks) {
            localStorage.setItem('awsPartnerTracker_tasks', JSON.stringify(data.tasks));
        }
        
        // Import settings if they exist
        if (data.settings) {
            localStorage.setItem('awsPartnerTracker_settings', JSON.stringify(data.settings));
        }
        
        // Reload DataManager to reflect changes
        DataManager.loadData();
    }

    // Get current app settings
    getAppSettings() {
        try {
            const settings = localStorage.getItem('awsPartnerTracker_settings');
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            return {};
        }
    }

    // Show backup manager interface
    showBackupManager() {
        const backupContent = `
            <h3>🔒 Data Backup Manager</h3>
            <p>Safely backup and restore all your AWS Partner Tracker data.</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 25px 0;">
                <div class="backup-section">
                    <h4>📤 Export Data</h4>
                    <p>Create a complete backup of all your data including contacts, pipeline, touchpoints, and tasks.</p>
                    <button class="action-btn" onclick="backupManager.exportAllData()" style="width: 100%; margin-top: 10px;">
                        📥 Export All Data
                    </button>
                </div>
                
                <div class="backup-section">
                    <h4>📥 Import Data</h4>
                    <p>Restore data from a previously exported backup file. This will replace all current data.</p>
                    <input type="file" id="importFileInput" accept=".json" style="width: 100%; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                    <button class="action-btn secondary" onclick="backupManager.handleImportFile()" style="width: 100%;">
                        📤 Import Data
                    </button>
                </div>
            </div>
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
                <h4>💡 Backup Tips:</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>Regular Backups:</strong> Export your data weekly or before major changes</li>
                    <li><strong>Safe Storage:</strong> Store backup files in cloud storage (Google Drive, Dropbox)</li>
                    <li><strong>File Names:</strong> Backup files include the date for easy identification</li>
                    <li><strong>Import Safety:</strong> Current data is automatically backed up before import</li>
                </ul>
            </div>
            
            <div id="currentDataStats" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4>📊 Current Data Overview:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #2196F3;">${DataManager.getAllContacts().length}</div>
                        <div style="font-size: 0.9em; color: #666;">Contacts</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #4CAF50;">${DataManager.getPipeline().length}</div>
                        <div style="font-size: 0.9em; color: #666;">Pipeline</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #FF9800;">${DataManager.getTouchpoints().length}</div>
                        <div style="font-size: 0.9em; color: #666;">Touchpoints</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: #9C27B0;">${DataManager.getTasks ? DataManager.getTasks().length : 0}</div>
                        <div style="font-size: 0.9em; color: #666;">Tasks</div>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 25px;">
                <button class="action-btn secondary" onclick="UIHelpers.closeModal('backupModal')">
                    Close
                </button>
            </div>
            
            <style>
                .backup-section {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    border: 1px solid #eee;
                }
                .backup-section h4 {
                    margin-top: 0;
                    color: #232F3E;
                }
            </style>
        `;
        
        // Create modal if it doesn't exist
        if (!document.getElementById('backupModal')) {
            const modalHTML = `
                <div id="backupModal" class="modal" style="display: none;">
                    <div class="modal-content" style="max-width: 800px;">
                        <span class="close" onclick="UIHelpers.closeModal('backupModal')">&times;</span>
                        <div id="backupModalContent"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        document.getElementById('backupModalContent').innerHTML = backupContent;
        UIHelpers.showModal('backupModal');
    }

    // Handle file selection for import
    handleImportFile() {
        const fileInput = document.getElementById('importFileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            UIHelpers.showNotification('Please select a backup file first', 'warning');
            return;
        }
        
        if (!file.name.endsWith('.json')) {
            UIHelpers.showNotification('Please select a valid JSON backup file', 'error');
            return;
        }
        
        this.importAllData(file);
    }

    // Read file content
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Download file utility
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Add backup manager to settings or main menu
    init() {
        // Add backup button to navigation or settings
        this.addBackupButton();
    }

    addBackupButton() {
        // Add to the navigation if there's a settings area
        const nav = document.querySelector('.nav-tabs') || document.querySelector('nav');
        if (nav) {
            const backupBtn = document.createElement('button');
            backupBtn.innerHTML = '🔒 Backup';
            backupBtn.className = 'nav-btn backup-btn';
            backupBtn.onclick = () => this.showBackupManager();
            backupBtn.style.cssText = 'background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin-left: 10px; font-size: 0.9em;';
            nav.appendChild(backupBtn);
        }
    }
}

// Create global instance
const backupManager = new DataBackupManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => backupManager.init());
} else {
    backupManager.init();
}

console.log('✅ Data Backup Manager loaded successfully');
