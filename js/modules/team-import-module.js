// Enhanced Team Import Module - Complete with GEO and Tier Support
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
                    <p>Upload Excel/CSV with columns: <strong>Full Name | First Name | Email | GEO | Team Name | Role | Tier</strong></p>
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
                            Download a CSV template with the correct column format including GEO and tier assignments
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
                            <div class="stat-number" id="uniqueGeos">0</div>
                            <div class="stat-label">Unique GEOs</div>
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
                    font-size: 2em;
                }

                .import-header p {
                    color: #666;
                    font-size: 1.1em;
                    margin: 0;
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
                    font-size: 1.3em;
                }

                .upload-area p {
                    color: #666;
                    margin: 5px 0;
                }

                .file-requirements {
                    font-size: 0.9em;
                    color: #888;
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
                    transition: transform 0.3s ease;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
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
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
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
                    font-weight: 500;
                }

                .rep-list {
                    padding: 0;
                }

                .rep-item {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 0.8fr;
                    gap: 15px;
                    padding: 12px 20px;
                    border-bottom: 1px solid #f0f0f0;
                    align-items: center;
                    transition: background 0.3s ease;
                }

                .rep-item:hover {
                    background: #f8f9ff;
                }

                .rep-item:last-child {
                    border-bottom: none;
                }

                .rep-name {
                    font-weight: 600;
                    color: #232F3E;
                    margin-bottom: 2px;
                }

                .rep-email {
                    color: #666;
                    font-size: 0.9em;
                }

                .geo-badge {
                    background: #28a745;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.8em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-block;
                    min-width: 60px;
                    text-align: center;
                }

                .geo-badge:hover {
                    background: #218838;
                    transform: scale(1.05);
                }

                .geo-badge.empty {
                    background: #6c757d;
                }

                .role-selector {
                    padding: 4px 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.85em;
                    width: 100%;
                    cursor: pointer;
                }

                .tier-selector {
                    padding: 4px 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.85em;
                    width: 100%;
                    cursor: pointer;
                }

                .tier-display {
                    display: inline-block;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    color: white;
                    font-size: 0.9em;
                    font-weight: bold;
                    text-align: center;
                    line-height: 32px;
                }

                .tier-1 { background: #dc3545; }
                .tier-2 { background: #ffc107; color: #000; }
                .tier-3 { background: #28a745; }

                .import-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 30px;
                }

                .action-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
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

                .action-btn.primary:hover {
                    background: linear-gradient(135deg, #218838, #1ea085);
                }

                .action-btn.secondary:hover {
                    background: #5a6268;
                }

                .existing-teams {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-top: 30px;
                }

                .existing-teams h3 {
                    margin: 0 0 20px 0;
                    color: #232F3E;
                    font-size: 1.3em;
                }

                .current-team-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 15px;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    transition: all 0.3s ease;
                }

                .current-team-item:hover {
                    border-color: #4a90e2;
                    background: #f8f9ff;
                }

                .team-stats {
                    font-size: 0.9em;
                    color: #666;
                    margin-top: 8px;
                    line-height: 1.4;
                }

                .team-stats strong {
                    color: #232F3E;
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
                    backdrop-filter: blur(5px);
                }

                .processing-content {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }

                .processing-content h3 {
                    margin: 15px 0 10px 0;
                    color: #232F3E;
                }

                .error-message {
                    background: #ffe6e6;
                    color: #d63384;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                    border: 1px solid #f5c6cb;
                    font-weight: 500;
                }

                .success-message {
                    background: #e8f5e8;
                    color: #198754;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                    border: 1px solid #c3e6cb;
                    font-weight: 500;
                }

                .validation-summary {
                    background: #fff3cd;
                    border: 1px solid #ffecb5;
                    color: #856404;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .validation-summary h4 {
                    margin: 0 0 10px 0;
                    color: #856404;
                }

                .validation-summary ul {
                    margin: 0;
                    padding-left: 20px;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .team-import-container {
                        padding: 15px;
                    }

                    .import-stats {
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 15px;
                    }

                    .rep-item {
                        grid-template-columns: 1fr;
                        gap: 10px;
                        padding: 15px;
                    }

                    .rep-item > div {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .upload-area {
                        padding: 30px 20px;
                    }

                    .import-actions {
                        flex-direction: column;
                        align-items: center;
                    }

                    .action-btn {
                        width: 100%;
                        max-width: 300px;
                        justify-content: center;
                    }
                }

                /* Animation for stats */
                @keyframes countUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .stat-card.animate {
                    animation: countUp 0.6s ease-out forwards;
                }

                /* Drag and drop styles */
                .upload-area.drag-over {
                    border-color: #28a745;
                    background: #e8f5e8;
                }
            </style>
        `;
    }

    setupEventListeners() {
        const fileInput = document.getElementById('teamFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Drag and drop functionality
        const uploadArea = document.querySelector('.upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload({ target: { files } });
                }
            });
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
            geo: row["GEO"] || row["Geography"] || row["Region"] || '',
            teamName: row["Team Name"] || row["Team"] || 'Unassigned',
            role: row["Role"] || 'AM',
            tier: parseInt(row["Tier"]) || 3, // Default to Tier 3
            engagementScore: 0,
            lastContactDate: null,
            lastTouchpoint: null,
            touchpointCount: 0,
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

            // Validate tier
            if (rep.tier < 1 || rep.tier > 3) {
                errors.push(`Row ${index + 1}: Tier must be 1, 2, or 3`);
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
                    geos: new Set(),
                    roles: new Set()
                };
            }
            
            this.teamGroups[teamName].push(rep);
            this.teamMetrics[teamName].totalReps++;
            this.teamMetrics[teamName][`tier${rep.tier}`]++;
            this.teamMetrics[teamName].geos.add(rep.geo);
            this.teamMetrics[teamName].roles.add(rep.role);
        });

        Object.keys(this.teamMetrics).forEach(team => {
            this.teamMetrics[team].geos = Array.from(this.teamMetrics[team].geos).filter(geo => geo);
            this.teamMetrics[team].roles = Array.from(this.teamMetrics[team].roles);
        });
    }

    showPreview() {
        const totalReps = this.importedData.length;
        const totalTeams = Object.keys(this.teamGroups).length;
        const avgTeamSize = totalTeams > 0 ? Math.round(totalReps / totalTeams) : 0;
        const validation = this.validateImportData();
        const uniqueGeos = new Set(this.importedData.map(rep => rep.geo).filter(geo => geo)).size;

        // Animate the stats
        setTimeout(() => {
            document.getElementById('totalReps').textContent = totalReps;
            document.getElementById('totalTeams').textContent = totalTeams;
            document.getElementById('avgTeamSize').textContent = avgTeamSize;
            document.getElementById('uniqueGeos').textContent = uniqueGeos;
            document.getElementById('duplicateEmails').textContent = validation.duplicateEmails;

            // Add animation class
            document.querySelectorAll('.stat-card').forEach((card, index) => {
                setTimeout(() => card.classList.add('animate'), index * 100);
            });
        }, 100);

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
                                <div>
                                    <select class="role-selector" onchange="teamImportModule.updateRepRole('${teamName}', ${index}, this.value)">
                                        <option value="LoL" ${rep.role === 'LoL' ? 'selected' : ''}>LoL</option>
                                        <option value="DM" ${rep.role === 'DM' ? 'selected' : ''}>DM</option>
                                        <option value="PSM" ${rep.role === 'PSM' ? 'selected' : ''}>PSM</option>
                                        <option value="AM" ${rep.role === 'AM' ? 'selected' : ''}>AM</option>
                                        <option value="SA" ${rep.role === 'SA' ? 'selected' : ''}>SA</option>
                                    </select>
                                </div>
                                <div>
                                    <span class="geo-badge ${!rep.geo ? 'empty' : ''}" onclick="teamImportModule.editGeo('${teamName}', ${index})" title="Click to edit GEO">
                                        ${rep.geo || 'Set GEO'}
                                    </span>
                                </div>
                                <div>
                                    <select class="tier-selector" onchange="teamImportModule.updateRepTier('${teamName}', ${index}, this.value)">
                                        <option value="1" ${rep.tier === 1 ? 'selected' : ''}>Tier 1 - Strategic</option>
                                        <option value="2" ${rep.tier === 2 ? 'selected' : ''}>Tier 2 - Important</option>
                                        <option value="3" ${rep.tier === 3 ? 'selected' : ''}>Tier 3 - Standard</option>
                                    </select>
                                </div>
                                <div>
                                    <span class="tier-display tier-${rep.tier}" title="Tier ${rep.tier}">
                                        T${rep.tier}
                                    </span>
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
        this.processTeamGroups();
    }

    updateRepTier(teamName, repIndex, newTier) {
        this.teamGroups[teamName][repIndex].tier = parseInt(newTier);
        this.processTeamGroups();
        this.renderTeamPreview();
    }

    editGeo(teamName, repIndex) {
        const rep = this.teamGroups[teamName][repIndex];
        const newGeo = prompt(`Enter GEO for ${rep.name}:`, rep.geo || '');
        if (newGeo !== null) {
            rep.geo = newGeo.trim();
            this.processTeamGroups();
            this.renderTeamPreview();
        }
    }

    executeImport() {
        this.showProcessing('Importing teams and reps...');
        
        try {
            let importedCount = 0;
            
            Object.values(this.teamGroups).flat().forEach(rep => {
                const contactData = {
                    name: rep.name,
                    firstName: rep.firstName,
                    email: rep.email,
                    company: rep.geo ? `Team: ${rep.teamName} (${rep.geo})` : rep.teamName,
                    geo: rep.geo,
                    teamName: rep.teamName,
                    role: rep.role,
                    type: 'rep',
                    tier: rep.tier,
                    engagementScore: rep.engagementScore,
                    lastContactDate: rep.lastContactDate,
                    lastTouchpoint: rep.lastTouchpoint,
                    touchpointCount: rep.touchpointCount,
                    activeDeals: rep.activeDeals,
                    totalPipelineValue: rep.totalPipelineValue,
                    isActive: rep.isActive,
                    importDate: rep.importDate
                };
                
                DataManager.addContact(contactData);
                importedCount++;
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
                        geo: rep.geo,
                        tier: rep.tier,
                        startDate: rep.importDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                        phone: rep.phone || '',
                        notes: `Imported from ${rep.teamName}${rep.geo ? ` (GEO: ${rep.geo})` : ''}`,
                        lastTouchpoint: rep.lastTouchpoint,
                        touchpointCount: rep.touchpointCount,
                        touchpoints: []
                    };
                    
                    DataManager.addTeamMember(teamId, teamMember);
                });
            });

            // Store team metadata with GEO information
            Object.keys(this.teamGroups).forEach(teamName => {
                const teamData = {
                    id: `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: teamName,
                    repCount: this.teamMetrics[teamName].totalReps,
                    geos: this.teamMetrics[teamName].geos,
                    roles: this.teamMetrics[teamName].roles,
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
            this.showSuccess(
                `🎉 Successfully imported ${importedCount} reps across ${Object.keys(this.teamGroups).length} teams!\n` +
                `✅ GEO assignments: ${new Set(this.importedData.map(rep => rep.geo).filter(geo => geo)).size} unique regions\n` +
                `✅ Tier distribution: T1: ${this.importedData.filter(rep => rep.tier === 1).length}, T2: ${this.importedData.filter(rep => rep.tier === 2).length}, T3: ${this.importedData.filter(rep => rep.tier === 3).length}`
            );
            
            this.cancelImport();
            
            // Refresh other modules if they exist
            if (typeof contactsModule !== 'undefined' && contactsModule.renderIfActive) {
                contactsModule.renderIfActive();
            }
            if (typeof teamsModule !== 'undefined' && teamsModule.renderIfActive) {
                teamsModule.renderIfActive();
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
            ['Full Name', 'First Name', 'Email', 'GEO', 'Team Name', 'Role', 'Tier'],
            ['John Smith', 'John', 'john.smith@company.com', 'West Coast', 'Sales Team A', 'DM', '2'],
            ['Jane Doe', 'Jane', 'jane.doe@company.com', 'East Coast', 'Sales Team B', 'PSM', '1'],
            ['Mike Johnson', 'Mike', 'mike.johnson@company.com', 'EMEA', 'Technical Team', 'AM', '3'],
            ['Sarah Wilson', 'Sarah', 'sarah.wilson@company.com', 'APAC', 'Sales Team A', 'LoL', '1'],
            ['Tom Rodriguez', 'Tom', 'tom.rodriguez@company.com', 'Central', 'Technical Team', 'SA', '2'],
            ['Lisa Chen', 'Lisa', 'lisa.chen@company.com', 'APAC', 'Enterprise Team', 'PSM', '1'],
            ['David Brown', 'David', 'david.brown@company.com', 'West Coast', 'Enterprise Team', 'AM', '3'],
            ['Maria Garcia', 'Maria', 'maria.garcia@company.com', 'LATAM', 'Global Team', 'DM', '2'],
            ['Robert Kim', 'Robert', 'robert.kim@company.com', 'APAC', 'Global Team', 'SA', '3']
        ];

        const csvContent = templateData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'team-import-template-with-geo-tier.csv';
        a.click();
        
        URL.revokeObjectURL(url);
        
        if (typeof UIHelpers !== 'undefined' && UIHelpers.showNotification) {
            UIHelpers.showNotification('Enhanced template downloaded successfully! 📋', 'success');
        } else {
            alert('Template downloaded successfully!');
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
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3em; margin-bottom: 15px;">📭</div>
                    <h4>No teams imported yet</h4>
                    <p>Use the import tool above to get started with your team data.</p>
                </div>
            `;
            return;
        }

        const teamsHTML = Object.entries(teams).map(([teamName, reps]) => {
            const geoBreakdown = this.getGeoBreakdown(reps);
            const tierBreakdown = this.getTierBreakdown(reps);
            const roleBreakdown = this.getTeamRoleBreakdown(reps);
            
            return `
                <div class="current-team-item">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <strong style="font-size: 1.1em; color: #232F3E;">${teamName}</strong>
                            <span style="background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 500;">
                                ${reps.length} member${reps.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div class="team-stats">
                            <div style="margin-bottom: 4px;"><strong>Roles:</strong> ${roleBreakdown}</div>
                            <div style="margin-bottom: 4px;"><strong>GEOs:</strong> ${geoBreakdown}</div>
                            <div><strong>Tiers:</strong> ${tierBreakdown}</div>
                        </div>
                    </div>
                    <div style="text-align: right; color: #666; font-size: 0.9em;">
                        Last updated:<br>
                        ${new Date().toLocaleDateString()}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = teamsHTML;
    }

    getTeamRoleBreakdown(reps) {
        const roles = {};
        reps.forEach(rep => {
            const role = rep.role || 'Unknown';
            roles[role] = (roles[role] || 0) + 1;
        });
        
        return Object.entries(roles)
            .map(([role, count]) => `${role}: ${count}`)
            .join(' | ') || 'No roles assigned';
    }

    getGeoBreakdown(reps) {
        const geos = {};
        reps.forEach(rep => {
            const geo = rep.geo || 'No GEO';
            geos[geo] = (geos[geo] || 0) + 1;
        });
        
        return Object.entries(geos)
            .map(([geo, count]) => `${geo}: ${count}`)
            .join(' | ') || 'No GEOs assigned';
    }

    getTierBreakdown(reps) {
        const tiers = {1: 0, 2: 0, 3: 0};
        reps.forEach(rep => {
            const tier = rep.tier || 3;
            tiers[tier] = (tiers[tier] || 0) + 1;
        });
        
        return Object.entries(tiers)
            .filter(([tier, count]) => count > 0)
            .map(([tier, count]) => `T${tier}: ${count}`)
            .join(' | ') || 'No tiers assigned';
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
        errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
        
        const previewSection = document.getElementById('previewSection');
        if (previewSection && previewSection.style.display !== 'none') {
            previewSection.insertBefore(errorDiv, previewSection.firstChild);
        } else {
            const uploadSection = document.getElementById('uploadSection');
            uploadSection.appendChild(errorDiv);
        }
        
        setTimeout(() => errorDiv.remove(), 8000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = message.replace(/\n/g, '<br>');
        
        const uploadSection = document.getElementById('uploadSection');
        uploadSection.appendChild(successDiv);
        
        setTimeout(() => successDiv.remove(), 10000);
    }
}

// Create global instance
const teamImportModule = new TeamImportModule();
console.log('✅ Enhanced Team Import module with GEO and tier support loaded successfully');
