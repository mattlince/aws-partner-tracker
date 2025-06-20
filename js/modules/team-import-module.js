// Team Import Module - Complete with Role Support (Everyone Tier 3)
class TeamImportModule {
    constructor() {
        this.importedData = [];
        this.teamGroups = {};
        this.teamMetrics = {};
        this.isProcessing = false;
    }

    init() {
        console.log('Team Import module initialized');
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.displayCurrentTeams();
    }

    renderIfActive() {
        if (AppController.currentTab === 'team-import') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        return `
            <div class="team-import-container">
                <div class="import-header">
                    <h2>🏢 Import Team & Rep Data</h2>
                    <p>Upload Excel/CSV with columns: <strong>Full Name | First Name | Email | District | Team Name | Role</strong></p>
                </div>

                <div class="upload-section" id="uploadSection">
                    <div class="upload-area" onclick="teamImportModule.triggerFileUpload()">
                        <div class="upload-icon">📁</div>
                        <h3>Choose Excel or CSV File</h3>
                        <p>Drag and drop or click to browse</p>
                        <p class="file-requirements">Supports .xlsx, .xls, .csv files</p>
                    </div>
                    <input type="file" id="teamFileInput" accept=".xlsx,.xls,.csv" style="display: none;">
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="action-btn" onclick="teamImportModule.downloadTemplate()">
                            📋 Download Template
                        </button>
                        <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                            Download a CSV template with the correct column format including roles
                        </p>
                    </div>
                </div>

                <div class="preview-section" id="previewSection" style="display: none;">
                    <div class="import-stats">
                        <div class="stat-card">
                            <div class="stat-number" id="totalReps">0</div>
                            <div class="stat-label">Total Reps</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="totalTeams">0</div>
                            <div class="stat-label">Teams Found</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="avgTeamSize">0</div>
                            <div class="stat-label">Avg Team Size</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="duplicateEmails">0</div>
                            <div class="stat-label">Duplicate Emails</div>
                        </div>
                    </div>

                    <div class="team-preview" id="teamPreview">
                        <!-- Team preview will be populated here -->
                    </div>

                    <div class="import-actions">
                        <button class="action-btn primary" onclick="teamImportModule.executeImport()">
                            ✅ Import All Teams & Reps
                        </button>
                        <button class="action-btn secondary" onclick="teamImportModule.cancelImport()">
                            ❌ Cancel Import
                        </button>
                        <button class="action-btn" onclick="teamImportModule.downloadTemplate()">
                            📋 Download Template
                        </button>
                    </div>
                </div>

                <div class="existing-teams" id="existingTeams">
                    <h3>📊 Current Teams</h3>
                    <div id="currentTeamsDisplay">
                        <!-- Current teams will be displayed here -->
                    </div>
                </div>
            </div>

            <style>
                .team-import-container {
                    max-width: 100%;
                    padding: 20px;
                }

                .import-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .import-header h2 {
                    color: #232F3E;
                    margin-bottom: 10px;
                }

                .upload-section {
                    margin-bottom: 30px;
                }

                .upload-area {
                    border: 3px dashed #4a90e2;
                    border-radius: 12px;
                    padding: 40px;
                    text-align: center;
                    background: #f8f9ff;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .upload-area:hover {
                    background: #f0f4ff;
                    border-color: #357abd;
                }

                .upload-icon {
                    font-size: 3em;
                    margin-bottom: 15px;
                }

                .upload-area h3 {
                    color: #232F3E;
                    margin: 10px 0;
                }

                .file-requirements {
                    font-size: 0.9em;
                    color: #666;
                    margin-top: 10px;
                }

                .import-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    text-align: center;
                }

                .stat-number {
                    font-size: 2em;
                    font-weight: bold;
                    color: #4a90e2;
                    margin-bottom: 5px;
                }

                .stat-label {
                    color: #666;
                    font-size: 0.9em;
                }

                .team-preview {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                    overflow: hidden;
                }

                .team-group {
                    border-bottom: 1px solid #eee;
                }

                .team-group:last-child {
                    border-bottom: none;
                }

                .team-header {
                    background: linear-gradient(135deg, #4a90e2, #357abd);
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .team-count {
                    background: rgba(255,255,255,0.2);
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.9em;
                }

                .rep-list {
                    padding: 0;
                }

                .rep-item {
                    display: grid;
                    grid-template-columns: 2fr 1.5fr 2fr 1fr;
                    gap: 15px;
                    padding: 12px 20px;
                    border-bottom: 1px solid #f0f0f0;
                    align-items: center;
                }

                .rep-item:hover {
                    background: #f8f9ff;
                }

                .rep-item:last-child {
                    border-bottom: none;
                }

                .rep-name {
                    font-weight: 500;
                    color: #232F3E;
                }

                .rep-email {
                    color: #666;
                    font-size: 0.9em;
                }

                .rep-district {
                    font-size: 0.8em;
                    background: #e8f0fe;
                    padding: 4px 8px;
                    border-radius: 4px;
                    color: #1a73e8;
                }

                .role-selector {
                    padding: 4px 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.85em;
                    margin-bottom: 5px;
                    width: 100%;
                }

                .tier-display {
                    padding: 6px 12px;
                    background: #e8f5e8;
                    color: #198754;
                    border-radius: 6px;
                    font-size: 0.9em;
                    text-align: center;
                    font-weight: 500;
                }

                .import-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .action-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .action-btn.primary {
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                }

                .action-btn.secondary {
                    background: #6c757d;
                    color: white;
                }

                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }

                .existing-teams {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-top: 30px;
                }

                .current-team-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }

                .processing-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .processing-content {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    text-align: center;
                }

                .error-message {
                    background: #ffe6e6;
                    color: #d63384;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                    border: 1px solid #f5c6cb;
                }

                .success-message {
                    background: #e8f5e8;
                    color: #198754;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                    border: 1px solid #c3e6cb;
                }
            </style>
        `;
    }

    setupEventListeners() {
        const fileInput = document.getElementById('teamFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        this.displayCurrentTeams();
    }

    triggerFileUpload() {
        document.getElementById('teamFileInput').click();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showProcessing('Reading file...');
        
        if (file.name.endsWith('.csv')) {
            this.parseCSVFile(file);
        } else {
            this.parseExcelFile(file);
        }
    }

    parseCSVFile(file) {
        // Use Papa Parse if available, otherwise fallback to simple parser
        if (typeof Papa !== 'undefined') {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';'],
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn('CSV parsing warnings:', results.errors);
                    }
                    
                    // Clean headers (remove whitespace)
                    const cleanedData = results.data.map(row => {
                        const cleanRow = {};
                        Object.keys(row).forEach(key => {
                            const cleanKey = key.trim();
                            cleanRow[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
                        });
                        return cleanRow;
                    });
                    
                    this.processImportData(cleanedData);
                },
                error: (error) => {
                    this.showError('Error parsing CSV file: ' + error.message);
                    this.hideProcessing();
                }
            });
        } else {
            // Fallback simple CSV parser
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                    
                    const data = [];
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                            const row = {};
                            headers.forEach((header, index) => {
                                row[header] = values[index] || '';
                            });
                            data.push(row);
                        }
                    }
                    
                    this.processImportData(data);
                } catch (error) {
                    this.showError('Error parsing CSV file. Please check the format.');
                    this.hideProcessing();
                }
            };
            reader.readAsText(file);
        }
    }

    parseExcelFile(file) {
        // For now, show message that Excel support requires additional library
        this.hideProcessing();
        this.showError('Excel files not supported yet. Please convert to CSV format or add SheetJS library.');
        
        // Uncomment this section when SheetJS is added:
        /*
        if (typeof XLSX !== 'undefined') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    this.processImportData(jsonData);
                } catch (error) {
                    this.showError('Error parsing Excel file: ' + error.message);
                    this.hideProcessing();
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            this.showError('Excel support requires SheetJS library. Please convert to CSV.');
            this.hideProcessing();
        }
        */
    }

    processImportData(data) {
        this.importedData = data.map((row, index) => ({
            id: `import-${index}`,
            name: row["Full Name"] || row["Name"] || '',
            firstName: row["First Name"] || row["First"] || '',
            email: row["Email"] || row["E-mail"] || '',
            district: row["District"] || row["Region"] || '',
            teamName: row["Team Name"] || row["Team"] || 'Unassigned',
            role: row["Role"] || 'AM',
            tier: 3, // Always Tier 3 for imports
            engagementScore: 0,
            lastContactDate: null,
            activeDeals: 0,
            totalPipelineValue: 0,
            isActive: true,
            importDate: new Date().toISOString(),
            type: 'rep'
        }));

        // Validate data
        const validation = this.validateImportData();
        if (!validation.isValid) {
            this.showError(`Import validation failed: ${validation.errors.join(', ')}`);
            this.hideProcessing();
            return;
        }

        this.processTeamGroups();
        this.showPreview();
        this.hideProcessing();
    }

    validateImportData() {
        const errors = [];
        const emailSet = new Set();
        let duplicateEmails = 0;

        this.importedData.forEach((rep, index) => {
            if (!rep.name || !rep.email) {
                errors.push(`Row ${index + 1}: Missing name or email`);
            }

            if (emailSet.has(rep.email)) {
                duplicateEmails++;
            } else {
                emailSet.add(rep.email);
            }

            if (rep.email && !this.isValidEmail(rep.email)) {
                errors.push(`Row ${index + 1}: Invalid email format`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            duplicateEmails
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    processTeamGroups() {
        this.teamGroups = {};
        this.teamMetrics = {};

        this.importedData.forEach(rep => {
            const teamName = rep.teamName || 'Unassigned';
            
            if (!this.teamGroups[teamName]) {
                this.teamGroups[teamName] = [];
                this.teamMetrics[teamName] = {
                    totalReps: 0,
                    tier1: 0, tier2: 0, tier3: 0,
                    districts: new Set()
                };
            }
            
            this.teamGroups[teamName].push(rep);
            this.teamMetrics[teamName].totalReps++;
            this.teamMetrics[teamName][`tier${rep.tier}`]++;
            this.teamMetrics[teamName].districts.add(rep.district);
        });

        Object.keys(this.teamMetrics).forEach(team => {
            this.teamMetrics[team].districts = Array.from(this.teamMetrics[team].districts);
        });
    }

    showPreview() {
        const totalReps = this.importedData.length;
        const totalTeams = Object.keys(this.teamGroups).length;
        const avgTeamSize = totalTeams > 0 ? Math.round(totalReps / totalTeams) : 0;
        const validation = this.validateImportData();

        document.getElementById('totalReps').textContent = totalReps;
        document.getElementById('totalTeams').textContent = totalTeams;
        document.getElementById('avgTeamSize').textContent = avgTeamSize;
        document.getElementById('duplicateEmails').textContent = validation.duplicateEmails;

        this.renderTeamPreview();
        document.getElementById('previewSection').style.display = 'block';
    }

    renderTeamPreview() {
        const container = document.getElementById('teamPreview');
        
        const teamHTML = Object.entries(this.teamGroups).map(([teamName, reps]) => {
            return `
                <div class="team-group">
                    <div class="team-header">
                        <span>👥 ${teamName}</span>
                        <span class="team-count">${reps.length} reps</span>
                    </div>
                    <div class="rep-list">
                        ${reps.map((rep, index) => `
                            <div class="rep-item">
                                <div>
                                    <div class="rep-name">${rep.name}</div>
                                    <div class="rep-email">${rep.email}</div>
                                </div>
                                <div class="rep-district">${rep.district || 'No District'}</div>
                                <div style="font-size: 0.9em; color: #666;">
                                    <select class="role-selector" onchange="teamImportModule.updateRepRole('${teamName}', ${index}, this.value)">
                                        <option value="LoL" ${rep.role === 'LoL' ? 'selected' : ''}>LoL - Leader of Leaders</option>
                                        <option value="DM" ${rep.role === 'DM' ? 'selected' : ''}>DM - District Manager</option>
                                        <option value="PSM" ${rep.role === 'PSM' ? 'selected' : ''}>PSM - Partner Sales Manager</option>
                                        <option value="AM" ${rep.role === 'AM' ? 'selected' : ''}>AM - Account Manager</option>
                                        <option value="SA" ${rep.role === 'SA' ? 'selected' : ''}>SA - Solution Architect</option>
                                    </select>
                                </div>
                                <div class="tier-display">
                                    Tier 3
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = teamHTML;
    }

    updateRepRole(teamName, repIndex, newRole) {
        this.teamGroups[teamName][repIndex].role = newRole;
        // Tier always stays 3 for imports
        this.teamGroups[teamName][repIndex].tier = 3;
        
        this.processTeamGroups();
    }

    executeImport() {
        this.showProcessing('Importing teams and reps...');
        
        try {
            Object.values(this.teamGroups).flat().forEach(rep => {
                const contactData = {
                    name: rep.name,
                    firstName: rep.firstName,
                    email: rep.email,
                    company: rep.district ? `Team: ${rep.teamName}` : rep.teamName,
                    district: rep.district,
                    teamName: rep.teamName,
                    role: rep.role,
                    type: 'rep',
                    tier: rep.tier,
                    engagementScore: rep.engagementScore,
                    lastContactDate: rep.lastContactDate,
                    activeDeals: rep.activeDeals,
                    totalPipelineValue: rep.totalPipelineValue,
                    isActive: rep.isActive,
                    importDate: rep.importDate
                };
                
                DataManager.addContact(contactData);
            });

            // Also create team member records directly
            Object.entries(this.teamGroups).forEach(([teamName, reps]) => {
                const teamId = DataManager.getOrCreateTeamId(teamName);
                
                reps.forEach(rep => {
                    const teamMember = {
                        id: rep.id + '_member',
                        name: rep.name,
                        email: rep.email,
                        role: rep.role,
                        startDate: rep.importDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                        phone: rep.phone || '',
                        notes: `Imported from ${rep.teamName} (District: ${rep.district || 'N/A'})`
                    };
                    
                    DataManager.addTeamMember(teamId, teamMember);
                });
            });

            // Store team metadata
            Object.keys(this.teamGroups).forEach(teamName => {
                const teamData = {
                    id: `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: teamName,
                    repCount: this.teamMetrics[teamName].totalReps,
                    districts: this.teamMetrics[teamName].districts,
                    tier1Count: this.teamMetrics[teamName].tier1,
                    tier2Count: this.teamMetrics[teamName].tier2,
                    tier3Count: this.teamMetrics[teamName].tier3,
                    importDate: new Date().toISOString()
                };
                
                if (DataManager.addTeamData) {
                    DataManager.addTeamData(teamData);
                }
            });

            this.hideProcessing();
            this.showSuccess(`Successfully imported ${this.importedData.length} reps across ${Object.keys(this.teamGroups).length} teams with roles!`);
            
            this.cancelImport();
            
            if (typeof contactsModule !== 'undefined' && contactsModule.renderIfActive) {
                contactsModule.renderIfActive();
            }

        } catch (error) {
            this.hideProcessing();
            this.showError('Import failed. Please try again.');
            console.error('Import error:', error);
        }
    }

    cancelImport() {
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('teamFileInput').value = '';
        this.importedData = [];
        this.teamGroups = {};
        this.teamMetrics = {};
    }

    downloadTemplate() {
        const templateData = [
            ['Full Name', 'First Name', 'Email', 'District', 'Team Name', 'Role'],
            ['John Smith', 'John', 'john.smith@company.com', 'West Region', 'Sales Team A', 'DM'],
            ['Jane Doe', 'Jane', 'jane.doe@company.com', 'East Region', 'Sales Team B', 'PSM'],
            ['Mike Johnson', 'Mike', 'mike.johnson@company.com', 'Central Region', 'Technical Team', 'AM'],
            ['Sarah Wilson', 'Sarah', 'sarah.wilson@company.com', 'West Region', 'Sales Team A', 'LoL'],
            ['Tom Rodriguez', 'Tom', 'tom.rodriguez@company.com', 'Central Region', 'Technical Team', 'SA']
        ];

        const csvContent = templateData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'team-import-template.csv';
        a.click();
        
        URL.revokeObjectURL(url);
        if (typeof UIHelpers !== 'undefined' && UIHelpers.showNotification) {
            UIHelpers.showNotification('Template downloaded successfully', 'success');
        }
    }

    displayCurrentTeams() {
        const container = document.getElementById('currentTeamsDisplay');
        if (!container) return;
        
        const contacts = DataManager.getAllContacts ? DataManager.getAllContacts() : [];
        const teams = {};

        contacts.filter(contact => contact.type === 'rep').forEach(rep => {
            const teamName = rep.teamName || 'Unassigned';
            if (!teams[teamName]) {
                teams[teamName] = [];
            }
            teams[teamName].push(rep);
        });

        if (Object.keys(teams).length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">No teams imported yet. Use the import tool above to get started.</p>';
            return;
        }

        const teamsHTML = Object.entries(teams).map(([teamName, reps]) => `
            <div class="current-team-item">
                <div>
                    <strong>${teamName}</strong>
                    <span style="color: #666; margin-left: 10px;">(${reps.length} reps)</span>
                </div>
                <div style="font-size: 0.9em; color: #666;">
                    Roles: ${this.getTeamRoleBreakdown(reps)}
                </div>
            </div>
        `).join('');

        container.innerHTML = teamsHTML;
    }

    getTeamRoleBreakdown(reps) {
        const roles = {};
        reps.forEach(rep => {
            const role = rep.role || 'Unknown';
            roles[role] = (roles[role] || 0) + 1;
        });
        
        return Object.entries(roles).map(([role, count]) => `${role}: ${count}`).join(' | ');
    }

    showProcessing(message) {
        const overlay = document.createElement('div');
        overlay.className = 'processing-overlay';
        overlay.id = 'processingOverlay';
        overlay.innerHTML = `
            <div class="processing-content">
                <div style="font-size: 2em; margin-bottom: 15px;">⏳</div>
                <h3>${message}</h3>
                <p>Please wait...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    hideProcessing() {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const previewSection = document.getElementById('previewSection');
        if (previewSection) {
            previewSection.insertBefore(errorDiv, previewSection.firstChild);
        } else {
            const uploadSection = document.getElementById('uploadSection');
            uploadSection.appendChild(errorDiv);
        }
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const uploadSection = document.getElementById('uploadSection');
        uploadSection.appendChild(successDiv);
        
        setTimeout(() => successDiv.remove(), 5000);
    }
}

// Create global instance
const teamImportModule = new TeamImportModule();
console.log('✅ Team Import module with role support loaded successfully');
