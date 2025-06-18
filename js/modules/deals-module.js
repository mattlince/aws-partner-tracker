// Deals Module - Pipeline and Deal Management
class DealsModule {
    constructor() {
        this.currentFilter = { stage: '', contact: '' };
    }

    init() {
        console.log('Deals module initialized');
        
        // Listen for data changes
        DataManager.on('deal:updated', () => this.renderIfActive());
        DataManager.on('deal:deleted', () => this.renderIfActive());
        DataManager.on('contact:updated', () => this.updateContactDropdowns());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderDealsTable();
        this.updateContactDropdowns();
    }

    renderIfActive() {
        if (AppController.currentTab === 'deals') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        return `
            <div class="deals-container">
                <div class="controls-bar">
                    <div>
                        <button class="action-btn" onclick="dealsModule.addNewDeal()">+ Add New Deal</button>
                        <button class="action-btn secondary" onclick="dealsModule.exportDeals()">Export Deals</button>
                        <button class="action-btn secondary" onclick="dealsModule.showPipelineReport()">Pipeline Report</button>
                    </div>
                    <div>
                        <select id="filterByStage" class="search-input" onchange="dealsModule.filterDeals()">
                            <option value="">All Stages</option>
                            <option value="prequalified">Prequalified</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal-development">Proposal Development</option>
                            <option value="proposal-delivered">Proposal Delivered</option>
                            <option value="legal">Legal Review</option>
                            <option value="out-for-signature">Out for Signature</option>
                            <option value="signed">Signed</option>
                            <option value="deal-won">Deal Won</option>
                            <option value="deal-lost">Deal Lost</option>
                        </select>
                        <select id="filterByContact" class="search-input" onchange="dealsModule.filterDeals()" style="margin-left: 10px;">
                            <option value="">All Contacts</option>
                        </select>
                    </div>
                </div>
                
                <div id="dealsContainer">
                    <table class="deals-table">
                        <thead>
                            <tr>
                                <th>Deal Name</th>
                                <th>Contact</th>
                                <th>Value</th>
                                <th>Stage</th>
                                <th>Probability</th>
                                <th>Weighted Value</th>
                                <th>Close Date</th>
                                <th>Days to Close</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="dealsTableBody">
                            <!-- Deals will be populated here -->
                        </tbody>
                    </table>
                </div>

                <div id="pipelineSummary" class="pipeline-summary">
                    <!-- Pipeline summary will be populated here -->
                </div>
            </div>

            <style>
                .deals-container {
                    max-width: 100%;
                }
                .controls-bar {
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
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
                    margin: 2px;
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
                .action-btn.danger {
                    background: #dc3545;
                }
                .action-btn.danger:hover {
                    background: #c82333;
                }
                .search-input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .deals-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    margin-bottom: 30px;
                }
                .deals-table th {
                    background: #232F3E;
                    color: white;
                    padding: 12px 8px;
                    text-align: left;
                    font-size: 0.85em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .deals-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #eee;
                    font-size: 0.9em;
                }
                .deals-table tbody tr:hover {
                    background: #f8f9fa;
                }
                .stage-select {
                    padding: 4px 8px;
                    border: none;
                    border-radius: 4px;
                    font-size: 0.8em;
                    font-weight: bold;
                    cursor: pointer;
                }
                .stage-prequalified { background: #6c757d; color: white; }
                .stage-qualified { background: #17a2b8; color: white; }
                .stage-proposal-development { background: #ffc107; color: #000; }
                .stage-proposal-delivered { background: #fd7e14; color: white; }
                .stage-legal { background: #6f42c1; color: white; }
                .stage-out-for-signature { background: #20c997; color: white; }
                .stage-signed { background: #28a745; color: white; }
                .stage-deal-won { background: #28a745; color: white; }
                .stage-deal-lost { background: #dc3545; color: white; }
                .progress-indicator {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .progress-bar-small {
                    width: 50px;
                    height: 6px;
                    background: #e9ecef;
                    border-radius: 3px;
                    overflow: hidden;
                }
                .progress-fill-small {
                    height: 100%;
                    background: linear-gradient(45deg, #28a745, #20c997);
                    transition: width 0.3s ease;
                }
                .pipeline-summary {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 25px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }
                .summary-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    text-align: center;
                }
                .summary-value {
                    font-size: 1.8em;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .summary-label {
                    color: #666;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .days-indicator {
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 0.8em;
                    font-weight: bold;
                }
                .days-overdue { background: #f8d7da; color: #721c24; }
                .days-urgent { background: #fff3cd; color: #856404; }
                .days-normal { background: #d4edda; color: #155724; }
            </style>
        `;
    }

    setupEventListeners() {
        // Event listeners will be set up here
    }

    updateContactDropdowns() {
        const contacts = DataManager.getContacts();
        const filterContactSelect = document.getElementById('filterByContact');
        
        if (filterContactSelect) {
            filterContactSelect.innerHTML = '<option value="">All Contacts</option>';
            Object.keys(contacts).forEach(teamId => {
                const teamContacts = contacts[teamId] || [];
                teamContacts.forEach(contact => {
                    const option = document.createElement('option');
                    option.value = contact.id;
                    option.textContent = `${contact.name} (${DataManager.getTeams()[teamId]?.name || teamId})`;
                    filterContactSelect.appendChild(option);
                });
            });
        }
    }

    addNewDeal() {
        const modalContent = `
            <form id="dealForm">
                <input type="hidden" id="dealId" name="id">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="dealName">Deal Name:</label>
                        <input type="text" id="dealName" name="name" required style="width: 100%; padding: 8px; margin-top: 5px;" placeholder="e.g., Enterprise PPA - Acme Corp">
                    </div>
                    <div>
                        <label for="dealValue">Deal Value ($):</label>
                        <input type="number" id="dealValue" name="value" required style="width: 100%; padding: 8px; margin-top: 5px;" placeholder="250000">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="dealContact">Contact:</label>
                        <select id="dealContact" name="contactId" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="">Select Contact</option>
                            ${this.getContactOptions()}
                        </select>
                    </div>
                    <div>
                        <label for="dealStage">Stage:</label>
                        <select id="dealStage" name="stage" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="prequalified">Prequalified</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal-development">Proposal Development</option>
                            <option value="proposal-delivered">Proposal Delivered</option>
                            <option value="legal">Legal Review</option>
                            <option value="out-for-signature">Out for Signature</option>
                            <option value="signed">Signed</option>
                            <option value="deal-won">Deal Won</option>
                            <option value="deal-lost">Deal Lost</option>
                        </select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label for="dealProbability">Probability (%):</label>
                        <input type="number" id="dealProbability" name="probability" min="0" max="100" value="25" style="width: 100%; padding: 8px; margin-top: 5px;">
                    </div>
                    <div>
                        <label for="dealCloseDate">Expected Close Date:</label>
                        <input type="date" id="dealCloseDate" name="closeDate" required style="width: 100%; padding: 8px; margin-top: 5px;">
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <label for="dealDescription">Description:</label>
                    <textarea id="dealDescription" name="description" placeholder="Brief description of the opportunity..." style="width: 100%; padding: 8px; margin-top: 5px; height: 80px;"></textarea>
                </div>
                <button type="submit" class="action-btn" style="background: #FF9900; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">Save Deal</button>
            </form>
        `;

        const modal = UIHelpers.createModal('dealModal', 'Add New Deal', modalContent);
        
        // Set default close date (30 days from now)
        setTimeout(() => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            document.getElementById('dealCloseDate').value = futureDate.toISOString().split('T')[0];
            
            // Auto-update probability when stage changes
            doc
