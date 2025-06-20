// Complete Touchpoint Tracker - Centralized System for All Modules
class TouchpointTracker {
    constructor() {
        this.touchpoints = [];
        this.currentView = 'calendar';
        this.selectedDate = new Date();
        this.subscribers = new Map();
        this.filters = {
            dateRange: null,
            type: '',
            outcome: '',
            contactId: '',
            teamId: '',
            teamMemberId: ''
        };
        this.followUpAlerts = [];
    }

    init() {
        console.log('Complete Touchpoint Tracker initialized');
        this.loadTouchpoints();
        this.checkFollowUpAlerts();
        
        // Set up periodic follow-up checks (every hour)
        setInterval(() => this.checkFollowUpAlerts(), 60 * 60 * 1000);
    }

    // ===============================
    // CORE TOUCHPOINT API
    // ===============================

    /**
     * Central API to log a touchpoint - called by all modules
     * @param {Object} touchpointData - The touchpoint data
     * @param {string} sourceModule - Which module is logging this
     * @returns {Promise<Object>} The created touchpoint with ID
     */
    async logTouchpoint(touchpointData, sourceModule = 'touchpoint-tracker') {
        const touchpoint = {
            id: this.generateTouchpointId(),
            timestamp: new Date().toISOString(),
            sourceModule: sourceModule,
            
            // Core touchpoint data
            date: touchpointData.date || new Date().toISOString().split('T')[0],
            type: touchpointData.type || 'other',
            outcome: touchpointData.outcome || 'neutral',
            notes: touchpointData.notes || '',
            
            // Contact/Team member references
            contactId: touchpointData.contactId || null,
            teamId: touchpointData.teamId || null,
            teamMemberId: touchpointData.teamMemberId || null,
            
            // Enhanced metadata
            duration: parseInt(touchpointData.duration) || null,
            followUpRequired: touchpointData.followUpRequired || touchpointData.outcome === 'needs-follow-up',
            followUpDate: touchpointData.followUpDate || null,
            tags: Array.isArray(touchpointData.tags) ? touchpointData.tags : 
                  (touchpointData.tags ? touchpointData.tags.split(',').map(t => t.trim()) : []),
            
            // Relationship context
            relationshipScoreImpact: this.calculateScoreImpact(touchpointData),
            isImportant: touchpointData.isImportant || false,
            
            // Additional context
            location: touchpointData.location || '',
            attendees: touchpointData.attendees || [],
            nextSteps: touchpointData.nextSteps || '',
            dealId: touchpointData.dealId || null,
            
            // System metadata
            createdBy: touchpointData.createdBy || 'Current User',
            lastModified: new Date().toISOString(),
            followUpCompleted: false,
            followUpCompletedDate: null
        };

        // Store the touchpoint
        this.touchpoints.push(touchpoint);
        this.saveTouchpoints();

        // Update the source entity (contact/team member)
        await this.updateSourceEntity(touchpoint);

        // Create follow-up alert if needed
        if (touchpoint.followUpRequired && touchpoint.followUpDate) {
            this.createFollowUpAlert(touchpoint);
        }

        // Notify subscribers (other modules)
        this.notifySubscribers('touchpoint:logged', touchpoint);

        console.log(`✅ Touchpoint logged from ${sourceModule}:`, touchpoint);
        return touchpoint;
    }

    /**
     * Update an existing touchpoint
     */
    async updateTouchpoint(touchpointId, updates, sourceModule = 'touchpoint-tracker') {
        const index = this.touchpoints.findIndex(tp => tp.id === touchpointId);
        if (index === -1) {
            throw new Error('Touchpoint not found');
        }

        const oldTouchpoint = this.touchpoints[index];
        const updatedTouchpoint = {
            ...oldTouchpoint,
            ...updates,
            lastModified: new Date().toISOString(),
            relationshipScoreImpact: this.calculateScoreImpact({...oldTouchpoint, ...updates})
        };

        this.touchpoints[index] = updatedTouchpoint;
        this.saveTouchpoints();

        // Update entity data
        await this.updateSourceEntity(updatedTouchpoint);

        // Update follow-up alerts
        this.updateFollowUpAlert(updatedTouchpoint);

        this.notifySubscribers('touchpoint:updated', updatedTouchpoint);
        console.log(`📝 Touchpoint updated by ${sourceModule}:`, updatedTouchpoint);
        
        return updatedTouchpoint;
    }

    /**
     * Delete a touchpoint
     */
    async deleteTouchpoint(touchpointId, sourceModule = 'touchpoint-tracker') {
        const index = this.touchpoints.findIndex(tp => tp.id === touchpointId);
        if (index === -1) {
            throw new Error('Touchpoint not found');
        }

        const touchpoint = this.touchpoints[index];
        this.touchpoints.splice(index, 1);
        this.saveTouchpoints();

        // Remove follow-up alert
        this.removeFollowUpAlert(touchpointId);

        // Recalculate entity stats
        await this.updateSourceEntity(touchpoint, true);

        this.notifySubscribers('touchpoint:deleted', touchpoint);
        console.log(`🗑️ Touchpoint deleted by ${sourceModule}:`, touchpoint);
    }

    /**
     * Get touchpoints with filtering
     */
    getTouchpoints(filters = {}) {
        let filteredTouchpoints = [...this.touchpoints];

        if (filters.contactId) {
            filteredTouchpoints = filteredTouchpoints.filter(tp => tp.contactId === filters.contactId);
        }
        
        if (filters.teamMemberId) {
            filteredTouchpoints = filteredTouchpoints.filter(tp => tp.teamMemberId === filters.teamMemberId);
        }
        
        if (filters.teamId) {
            filteredTouchpoints = filteredTouchpoints.filter(tp => tp.teamId === filters.teamId);
        }
        
        if (filters.dealId) {
            filteredTouchpoints = filteredTouchpoints.filter(tp => tp.dealId === filters.dealId);
        }
        
        if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            filteredTouchpoints = filteredTouchpoints.filter(tp => {
                const tpDate = new Date(tp.date);
                return tpDate >= new Date(start) && tpDate <= new Date(end);
            });
        }
        
        if (filters.type) {
            filteredTouchpoints = filteredTouchpoints.filter(tp => tp.type === filters.type);
        }
        
        if (filters.outcome) {
            filteredTouchpoints = filteredTouchpoints.filter(tp => tp.outcome === filters.outcome);
        }

        if (filters.tags && filters.tags.length > 0) {
            filteredTouchpoints = filteredTouchpoints.filter(tp => 
                filters.tags.some(tag => tp.tags.includes(tag))
            );
        }

        if (filters.hasFollowUp !== undefined) {
            filteredTouchpoints = filteredTouchpoints.filter(tp => tp.followUpRequired === filters.hasFollowUp);
        }

        return filteredTouchpoints.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Get the last touchpoint for a contact/team member
     */
    getLastTouchpoint(contactId = null, teamMemberId = null, dealId = null) {
        const touchpoints = this.getTouchpoints({ contactId, teamMemberId, dealId });
        return touchpoints.length > 0 ? touchpoints[0] : null;
    }

    /**
     * Get comprehensive touchpoint statistics
     */
    getTouchpointStats(contactId = null, teamMemberId = null, dealId = null) {
        const touchpoints = this.getTouchpoints({ contactId, teamMemberId, dealId });
        
        const stats = {
            total: touchpoints.length,
            thisWeek: 0,
            thisMonth: 0,
            lastTouchpoint: touchpoints[0] || null,
            averageGap: 0,
            typeBreakdown: {},
            outcomeBreakdown: {},
            relationshipTrend: this.calculateRelationshipTrend(touchpoints),
            totalDuration: 0,
            averageDuration: 0,
            followUpsPending: 0,
            tagsUsed: new Set(),
            activityScore: 0
        };

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let totalDuration = 0;
        let durationCount = 0;

        touchpoints.forEach(tp => {
            const tpDate = new Date(tp.date);
            
            if (tpDate >= weekAgo) stats.thisWeek++;
            if (tpDate >= monthAgo) stats.thisMonth++;
            
            // Type breakdown
            stats.typeBreakdown[tp.type] = (stats.typeBreakdown[tp.type] || 0) + 1;
            
            // Outcome breakdown
            stats.outcomeBreakdown[tp.outcome] = (stats.outcomeBreakdown[tp.outcome] || 0) + 1;
            
            // Duration stats
            if (tp.duration) {
                totalDuration += tp.duration;
                durationCount++;
            }
            
            // Follow-ups
            if (tp.followUpRequired && tp.followUpDate && new Date(tp.followUpDate) >= now) {
                stats.followUpsPending++;
            }
            
            // Tags
            tp.tags.forEach(tag => stats.tagsUsed.add(tag));
        });

        // Calculate average gap between touchpoints
        if (touchpoints.length > 1) {
            const gaps = [];
            for (let i = 0; i < touchpoints.length - 1; i++) {
                const gap = (new Date(touchpoints[i].date) - new Date(touchpoints[i + 1].date)) / (1000 * 60 * 60 * 24);
                gaps.push(gap);
            }
            stats.averageGap = Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
        }

        stats.totalDuration = totalDuration;
        stats.averageDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
        stats.tagsUsed = Array.from(stats.tagsUsed);
        
        // Calculate activity score (0-100)
        stats.activityScore = this.calculateActivityScore(stats);

        return stats;
    }

    // ===============================
    // UI RENDERING
    // ===============================

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderCurrentView();
        this.updateQuickStats();
    }

    renderIfActive() {
        if (AppController.currentTab === 'touchpoints') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        return `
            <div class="touchpoint-tracker">
                <div class="touchpoint-header">
                    <div>
                        <h2>📞 Touchpoint Tracker</h2>
                        <p>Central hub for all contact and team member interactions</p>
                    </div>
                    <div class="touchpoint-controls">
                        <button class="view-btn ${this.currentView === 'calendar' ? 'active' : ''}" onclick="touchpointTracker.switchView('calendar')">
                            📅 Calendar
                        </button>
                        <button class="view-btn ${this.currentView === 'history' ? 'active' : ''}" onclick="touchpointTracker.switchView('history')">
                            📝 History
                        </button>
                        <button class="view-btn ${this.currentView === 'analytics' ? 'active' : ''}" onclick="touchpointTracker.switchView('analytics')">
                            📊 Analytics
                        </button>
                        <button class="view-btn ${this.currentView === 'followups' ? 'active' : ''}" onclick="touchpointTracker.switchView('followups')">
                            ⚠️ Follow-ups
                        </button>
                        <button class="action-btn" onclick="touchpointTracker.showAddTouchpointModal()">
                            + Log Touchpoint
                        </button>
                    </div>
                </div>

                <!-- Quick Stats Bar -->
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-value" id="todayCount">0</span>
                        <span class="stat-label">Today</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="weekCount">0</span>
                        <span class="stat-label">This Week</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="monthCount">0</span>
                        <span class="stat-label">This Month</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="overdueCount">0</span>
                        <span class="stat-label">Overdue Follow-ups</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="totalCount">0</span>
                        <span class="stat-label">Total Touchpoints</span>
                    </div>
                </div>

                <div id="touchpointContent">
                    <!-- Content will be populated based on current view -->
                </div>

                <!-- Add/Edit Touchpoint Modal -->
                <div id="touchpointModal" class="modal" style="display: none;">
                    <div class="modal-content large-modal">
                        <span class="close" onclick="UIHelpers.closeModal('touchpointModal')">&times;</span>
                        <div id="touchpointModalContent">
                            <!-- Form will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Touchpoint Details Modal -->
                <div id="touchpointDetailsModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('touchpointDetailsModal')">&times;</span>
                        <div id="touchpointDetailsContent">
                            <!-- Details will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .touchpoint-tracker {
                    max-width: 100%;
                    padding: 20px;
                }

                .touchpoint-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .touchpoint-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }

                .touchpoint-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                    font-size: 1em;
                }

                .touchpoint-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .view-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: all 0.3s ease;
                }

                .view-btn.active {
                    background: #232F3E;
                    color: white;
                    border-color: #232F3E;
                }

                .view-btn:hover:not(.active) {
                    background: #e9ecef;
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

                .action-btn.small {
                    padding: 4px 8px;
                    font-size: 0.8em;
                }

                .quick-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }

                .stat-item {
                    text-align: center;
                    padding: 15px;
                    border-radius: 8px;
                    background: #f8f9fa;
                    transition: all 0.3s ease;
                }

                .stat-item:hover {
                    background: #e9ecef;
                    transform: translateY(-2px);
                }

                .stat-value {
                    display: block;
                    font-size: 2em;
                    font-weight: bold;
                    color: #232F3E;
                    margin-bottom: 5px;
                }

                .stat-label {
                    font-size: 0.9em;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .content-section {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f8f9fa;
                }

                .section-title {
                    font-size: 1.3em;
                    font-weight: bold;
                    color: #232F3E;
                    margin: 0;
                }

                .filters-section {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .filter-group label {
                    font-size: 0.9em;
                    color: #666;
                    font-weight: 500;
                }

                .filter-group select,
                .filter-group input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9em;
                    background: white;
                }

                .calendar-view {
                    margin-top: 20px;
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .calendar-nav {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .nav-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: all 0.3s ease;
                }

                .nav-btn:hover {
                    background: #e9ecef;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 1px;
                    background: #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .calendar-day {
                    background: white;
                    padding: 12px 8px;
                    min-height: 120px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }

                .calendar-day:hover {
                    background: #f8f9ff;
                }

                .calendar-day.other-month {
                    background: #f8f9fa;
                    color: #6c757d;
                }

                .calendar-day.today {
                    background: #e3f2fd;
                    border: 2px solid #1976d2;
                }

                .calendar-day.has-touchpoints {
                    border-left: 4px solid #FF9900;
                }

                .day-number {
                    font-weight: bold;
                    margin-bottom: 8px;
                    font-size: 0.9em;
                }

                .day-touchpoints {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .touchpoint-pill {
                    background: #FF9900;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.7em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                }

                .touchpoint-pill:hover {
                    background: #e68900;
                    transform: scale(1.02);
                }

                .touchpoint-pill.call { background: #28a745; }
                .touchpoint-pill.email { background: #17a2b8; }
                .touchpoint-pill.meeting { background: #6f42c1; }
                .touchpoint-pill.text { background: #20c997; }
                .touchpoint-pill.event { background: #fd7e14; }
                .touchpoint-pill.other { background: #6c757d; }

                .touchpoint-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .touchpoint-card {
                    border: 1px solid #eee;
                    border-radius: 8px;
                    padding: 20px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    background: white;
                }

                .touchpoint-card:hover {
                    border-color: #FF9900;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }

                .touchpoint-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }

                .touchpoint-contact {
                    font-size: 1.1em;
                    font-weight: bold;
                    color: #232F3E;
                    margin-bottom: 5px;
                }

                .touchpoint-meta {
                    display: flex;
                    gap: 15px;
                    font-size: 0.9em;
                    color: #666;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }

                .touchpoint-notes {
                    color: #232F3E;
                    line-height: 1.5;
                    margin-bottom: 15px;
                }

                .touchpoint-tags {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 10px;
                }

                .tag {
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: 500;
                }

                .touchpoint-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }

                .type-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.8em;
                    font-weight: bold;
                    color: white;
                }

                .outcome-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.8em;
                    font-weight: bold;
                }

                .outcome-positive { background: #28a745; color: white; }
                .outcome-neutral { background: #6c757d; color: white; }
                .outcome-needs-follow-up { background: #ffc107; color: #000; }
                .outcome-negative { background: #dc3545; color: white; }

                .follow-up-alert {
                    background: #fff3cd;
                    border: 1px solid #ffecb5;
                    color: #856404;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .follow-up-alert.overdue {
                    background: #f8d7da;
                    border-color: #f5c6cb;
                    color: #721c24;
                }

                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .analytics-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }

                .analytics-card h4 {
                    margin: 0 0 15px 0;
                    color: #232F3E;
                    font-size: 1.1em;
                }

                .chart-placeholder {
                    background: #f8f9fa;
                    padding: 40px;
                    border-radius: 8px;
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }

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

                .modal-content.large-modal {
                    max-width: 800px;
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

                .close:hover { color: #000; }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group.full-width {
                    grid-column: 1 / -1;
                }

                .form-group label {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #232F3E;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.3s ease;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #FF9900;
                }

                .form-group textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 10px;
                }

                .checkbox-group input[type="checkbox"] {
                    width: auto;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }

                .empty-state-icon {
                    font-size: 4em;
                    margin-bottom: 20px;
                    opacity: 0.5;
                }

                .empty-state h3 {
                    margin: 0 0 10px 0;
                    color: #333;
                }

                .empty-state p {
                    margin: 0 0 20px 0;
                    line-height: 1.5;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .touchpoint-tracker {
                        padding: 15px;
                    }

                    .touchpoint-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 20px;
                    }

                    .touchpoint-controls {
                        justify-content: center;
                        flex-wrap: wrap;
                    }

                    .quick-stats {
                        grid-template-columns: repeat(2, 1fr);
                        padding: 15px;
                    }

                    .filters-section {
                        grid-template-columns: 1fr;
                        padding: 15px;
                    }

                    .calendar-grid {
                        gap: 2px;
                    }

                    .calendar-day {
                        min-height: 80px;
                        padding: 8px 4px;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .touchpoint-card-header {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .touchpoint-meta {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .analytics-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Calendar day clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-day')) {
                this.selectDate(e.target.dataset.date);
            }
            
            if (e.target.classList.contains('touchpoint-pill')) {
                e.stopPropagation();
                this.showTouchpointDetails(e.target.dataset.touchpointId);
            }
        });

        // Update stats periodically
        this.updateQuickStats();
        setInterval(() => this.updateQuickStats(), 60000); // Update every minute
    }

    renderCurrentView() {
        const container = document.getElementById('touchpointContent');
        if (!container) return;

        switch(this.currentView) {
            case 'calendar':
                this.renderCalendarView(container);
                break;
            case 'history':
                this.renderHistoryView(container);
                break;
            case 'analytics':
                this.renderAnalyticsView(container);
                break;
            case 'followups':
                this.renderFollowUpsView(container);
                break;
        }
    }

    renderCalendarView(container) {
        const calendarHTML = this.generateCalendarHTML();
        container.innerHTML = `
            <div class="content-section">
                <div class="section-header">
                    <h3 class="section-title">📅 Touchpoint Calendar</h3>
                    <div class="calendar-nav">
                        <button class="nav-btn" onclick="touchpointTracker.previousMonth()">‹ Previous</button>
                        <button class="nav-btn" onclick="touchpointTracker.currentMonth()">Today</button>
                        <button class="nav-btn" onclick="touchpointTracker.nextMonth()">Next ›</button>
                    </div>
                </div>
                
                <div class="calendar-view">
                    <div class="calendar-header">
                        <h4>${this.selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                    </div>
                    <div class="calendar-grid">
                        ${calendarHTML}
                    </div>
                </div>
            </div>
        `;
    }

    renderHistoryView(container) {
        const touchpoints = this.getTouchpoints(this.filters);
        
        container.innerHTML = `
            <div class="content-section">
                <div class="section-header">
                    <h3 class="section-title">📝 Touchpoint History</h3>
                    <button class="action-btn" onclick="touchpointTracker.clearFilters()">
                        Clear Filters
                    </button>
                </div>
                
                <div class="filters-section">
                    <div class="filter-group">
                        <label>Date From</label>
                        <input type="date" id="filterStartDate" onchange="touchpointTracker.applyFilters()">
                    </div>
                    <div class="filter-group">
                        <label>Date To</label>
                        <input type="date" id="filterEndDate" onchange="touchpointTracker.applyFilters()">
                    </div>
                    <div class="filter-group">
                        <label>Type</label>
                        <select id="filterType" onchange="touchpointTracker.applyFilters()">
                            <option value="">All Types</option>
                            <option value="call">📞 Phone Call</option>
                            <option value="email">📧 Email</option>
                            <option value="meeting">🤝 Meeting</option>
                            <option value="text">💬 Text/Slack</option>
                            <option value="event">🎉 Event</option>
                            <option value="other">📝 Other</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Outcome</label>
                        <select id="filterOutcome" onchange="touchpointTracker.applyFilters()">
                            <option value="">All Outcomes</option>
                            <option value="positive">✅ Positive</option>
                            <option value="neutral">➖ Neutral</option>
                            <option value="needs-follow-up">⚠️ Needs Follow-up</option>
                            <option value="negative">❌ Negative</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Search Notes</label>
                        <input type="text" id="filterSearch" placeholder="Search in notes..." onchange="touchpointTracker.applyFilters()">
                    </div>
                </div>
                
                <div class="touchpoint-list" id="touchpointList">
                    ${touchpoints.length > 0 ? this.renderTouchpointCards(touchpoints) : this.renderEmptyState('history')}
                </div>
            </div>
        `;
    }

    renderFollowUpsView(container) {
        const followUps = this.getTouchpoints({ hasFollowUp: true });
        const now = new Date();
        
        const overdue = followUps.filter(tp => new Date(tp.followUpDate) < now);
        const upcoming = followUps.filter(tp => new Date(tp.followUpDate) >= now);
        
        container.innerHTML = `
            <div class="content-section">
                <div class="section-header">
                    <h3 class="section-title">⚠️ Follow-up Management</h3>
                    <div style="color: #666; font-size: 0.9em;">
                        ${overdue.length} overdue • ${upcoming.length} upcoming
                    </div>
                </div>
                
                ${overdue.length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h4 style="color: #dc3545; margin-bottom: 15px;">🚨 Overdue Follow-ups</h4>
                        <div class="touchpoint-list">
                            ${this.renderTouchpointCards(overdue, true)}
                        </div>
                    </div>
                ` : ''}
                
                ${upcoming.length > 0 ? `
                    <div>
                        <h4 style="color: #ffc107; margin-bottom: 15px;">📅 Upcoming Follow-ups</h4>
                        <div class="touchpoint-list">
                            ${this.renderTouchpointCards(upcoming, true)}
                        </div>
                    </div>
                ` : ''}
                
                ${followUps.length === 0 ? this.renderEmptyState('followups') : ''}
            </div>
        `;
    }

    renderAnalyticsView(container) {
        const stats = this.getOverallStats();
        
        container.innerHTML = `
            <div class="content-section">
                <div class="section-header">
                    <h3 class="section-title">📊 Touchpoint Analytics</h3>
                    <div style="color: #666; font-size: 0.9em;">
                        Insights and trends from your touchpoint data
                    </div>
                </div>
                
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h4>📈 Activity Overview</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 2em; font-weight: bold; color: #28a745;">${stats.total}</div>
                                <div style="color: #666; font-size: 0.9em;">Total Touchpoints</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 2em; font-weight: bold; color: #17a2b8;">${stats.thisWeek}</div>
                                <div style="color: #666; font-size: 0.9em;">This Week</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 2em; font-weight: bold; color: #ffc107;">${stats.averagePerDay}</div>
                                <div style="color: #666; font-size: 0.9em;">Avg per Day</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 2em; font-weight: bold; color: #fd7e14;">${stats.averageGap}d</div>
                                <div style="color: #666; font-size: 0.9em;">Avg Gap</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>📞 Type Breakdown</h4>
                        <div>
                            ${Object.entries(stats.typeBreakdown).map(([type, count]) => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span>${this.getTypeLabel(type)}</span>
                                    <strong>${count} (${((count/stats.total)*100).toFixed(1)}%)</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>🎯 Outcome Distribution</h4>
                        <div>
                            ${Object.entries(stats.outcomeBreakdown).map(([outcome, count]) => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span>${this.getOutcomeLabel(outcome)}</span>
                                    <strong>${count} (${((count/stats.total)*100).toFixed(1)}%)</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>⏱️ Duration Insights</h4>
                        <div style="text-align: center;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #6f42c1; margin-bottom: 10px;">
                                ${stats.averageDuration} min
                            </div>
                            <div style="color: #666; margin-bottom: 15px;">Average Duration</div>
                            <div style="font-size: 1.2em; color: #28a745;">
                                ${Math.round(stats.totalDuration / 60)} hours total
                            </div>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>🏷️ Popular Tags</h4>
                        <div>
                            ${stats.topTags.slice(0, 10).map(([tag, count]) => `
                                <span class="tag" style="margin-right: 8px; margin-bottom: 8px; display: inline-block;">
                                    ${tag} (${count})
                                </span>
                            `).join('')}
                            ${stats.topTags.length === 0 ? '<div style="color: #666; font-style: italic;">No tags used yet</div>' : ''}
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>📅 Recent Trends</h4>
                        <div class="chart-placeholder">
                            📈 Trend charts coming soon
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTouchpointCards(touchpoints, showFollowUpDate = false) {
        return touchpoints.map(tp => {
            const contactName = this.getContactName(tp);
            const daysSince = Math.ceil((new Date() - new Date(tp.date)) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="touchpoint-card" onclick="touchpointTracker.showTouchpointDetails('${tp.id}')">
                    <div class="touchpoint-card-header">
                        <div>
                            <div class="touchpoint-contact">${contactName}</div>
                            <div style="font-size: 0.9em; color: #666;">
                                ${new Date(tp.date).toLocaleDateString()} 
                                <span style="margin-left: 10px; color: #999;">
                                    ${daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
                                </span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: flex-start;">
                            <span class="type-badge" style="background: ${this.getTypeBadgeColor(tp.type)};">
                                ${this.getTypeLabel(tp.type)}
                            </span>
                            <span class="outcome-badge outcome-${tp.outcome}">
                                ${this.getOutcomeLabel(tp.outcome)}
                            </span>
                        </div>
                    </div>
                    
                    ${tp.notes ? `<div class="touchpoint-notes">${tp.notes}</div>` : ''}
                    
                    <div class="touchpoint-meta">
                        <span>📱 ${tp.sourceModule}</span>
                        ${tp.duration ? `<span>⏱️ ${tp.duration} min</span>` : ''}
                        ${tp.location ? `<span>📍 ${tp.location}</span>` : ''}
                        ${tp.attendees.length > 0 ? `<span>👥 ${tp.attendees.length} attendees</span>` : ''}
                        ${showFollowUpDate && tp.followUpDate ? 
                            `<span style="color: ${new Date(tp.followUpDate) < new Date() ? '#dc3545' : '#ffc107'};">
                                📅 Follow-up: ${new Date(tp.followUpDate).toLocaleDateString()}
                            </span>` : ''}
                    </div>
                    
                    ${tp.tags.length > 0 ? `
                        <div class="touchpoint-tags">
                            ${tp.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="touchpoint-actions">
                        <button class="action-btn small" onclick="event.stopPropagation(); touchpointTracker.editTouchpoint('${tp.id}')">
                            ✏️ Edit
                        </button>
                        <button class="action-btn small secondary" onclick="event.stopPropagation(); touchpointTracker.duplicateTouchpoint('${tp.id}')">
                            📋 Duplicate
                        </button>
                        ${tp.followUpRequired && !tp.followUpCompleted ? `
                            <button class="action-btn small" onclick="event.stopPropagation(); touchpointTracker.completeFollowUp('${tp.id}')" style="background: #28a745;">
                                ✅ Complete Follow-up
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderEmptyState(view) {
        const emptyStates = {
            history: {
                icon: '📝',
                title: 'No touchpoints found',
                message: 'Start logging touchpoints to build your relationship history.'
            },
            followups: {
                icon: '✅',
                title: 'No follow-ups pending',
                message: 'All caught up! No follow-up actions required at this time.'
            },
            calendar: {
                icon: '📅',
                title: 'No touchpoints this month',
                message: 'Log your first touchpoint to get started tracking relationships.'
            }
        };
        
        const state = emptyStates[view] || emptyStates.history;
        
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${state.icon}</div>
                <h3>${state.title}</h3>
                <p>${state.message}</p>
                <button class="action-btn" onclick="touchpointTracker.showAddTouchpointModal()">
                    + Log Your First Touchpoint
                </button>
            </div>
        `;
    }

    generateCalendarHTML() {
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get starting day of week (0 = Sunday)
        const startingDayOfWeek = firstDay.getDay();
        
        // Generate calendar header
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let calendarHTML = weekDays.map(day => 
            `<div style="background: #232F3E; color: white; padding: 10px; text-align: center; font-weight: bold;">${day}</div>`
        ).join('');
        
        // Get touchpoints for this month
        const monthTouchpoints = this.getTouchpoints({
            dateRange: {
                start: firstDay.toISOString().split('T')[0],
                end: lastDay.toISOString().split('T')[0]
            }
        });
        
        // Group touchpoints by date
        const touchpointsByDate = {};
        monthTouchpoints.forEach(tp => {
            if (!touchpointsByDate[tp.date]) {
                touchpointsByDate[tp.date] = [];
            }
            touchpointsByDate[tp.date].push(tp);
        });
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const prevDate = new Date(year, month, 1 - startingDayOfWeek + i);
            calendarHTML += `
                <div class="calendar-day other-month" data-date="${prevDate.toISOString().split('T')[0]}">
                    <div class="day-number">${prevDate.getDate()}</div>
                </div>
            `;
        }
        
        // Add days of the month
        const today = new Date().toISOString().split('T')[0];
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dateStr = currentDate.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const dayTouchpoints = touchpointsByDate[dateStr] || [];
            const hasTouchpoints = dayTouchpoints.length > 0;
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${hasTouchpoints ? 'has-touchpoints' : ''}" 
                     data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    <div class="day-touchpoints">
                        ${dayTouchpoints.slice(0, 3).map(tp => `
                            <div class="touchpoint-pill ${tp.type}" 
                                 data-touchpoint-id="${tp.id}"
                                 title="${this.getContactName(tp)} - ${tp.notes || 'No notes'}">
                                ${this.getContactName(tp).split(' ')[0]}
                            </div>
                        `).join('')}
                        ${dayTouchpoints.length > 3 ? `
                            <div class="touchpoint-pill" style="background: #6c757d;">
                                +${dayTouchpoints.length - 3} more
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // Add empty cells to complete the grid
        const totalCells = 42; // 6 rows × 7 days
        const cellsUsed = startingDayOfWeek + daysInMonth;
        for (let i = cellsUsed; i < totalCells; i++) {
            const nextDate = new Date(year, month + 1, i - cellsUsed + 1);
            calendarHTML += `
                <div class="calendar-day other-month" data-date="${nextDate.toISOString().split('T')[0]}">
                    <div class="day-number">${nextDate.getDate()}</div>
                </div>
            `;
        }
        
        return calendarHTML;
    }

    // ===============================
    // MODAL METHODS
    // ===============================

    showAddTouchpointModal(prefilledData = {}) {
        const contacts = this.getAllContactsAndTeamMembers();
        
        const modalContent = `
            <h3>${prefilledData.id ? 'Edit' : 'Log'} Touchpoint</h3>
            <form id="touchpointForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="touchpointContact">Contact/Team Member:</label>
                        <select id="touchpointContact" name="contactSelection" required>
                            <option value="">Select contact...</option>
                            ${contacts.map(contact => `
                                <option value="${contact.type}:${contact.id}" 
                                        ${(prefilledData.contactId === contact.id || prefilledData.teamMemberId === contact.id) ? 'selected' : ''}>
                                    ${contact.name} ${contact.type === 'team' ? '(Team Member)' : '(Contact)'}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="touchpointDate">Date:</label>
                        <input type="date" id="touchpointDate" name="date" 
                               value="${prefilledData.date || new Date().toISOString().split('T')[0]}" required>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="touchpointType">Type:</label>
                        <select id="touchpointType" name="type" required>
                            <option value="call" ${prefilledData.type === 'call' ? 'selected' : ''}>📞 Phone Call</option>
                            <option value="email" ${prefilledData.type === 'email' ? 'selected' : ''}>📧 Email</option>
                            <option value="meeting" ${prefilledData.type === 'meeting' ? 'selected' : ''}>🤝 Meeting</option>
                            <option value="text" ${prefilledData.type === 'text' ? 'selected' : ''}>💬 Text/Slack</option>
                            <option value="event" ${prefilledData.type === 'event' ? 'selected' : ''}>🎉 Event/Social</option>
                            <option value="other" ${prefilledData.type === 'other' ? 'selected' : ''}>📝 Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="touchpointDuration">Duration (minutes):</label>
                        <input type="number" id="touchpointDuration" name="duration" 
                               value="${prefilledData.duration || ''}" placeholder="Optional" min="1">
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="touchpointOutcome">Outcome:</label>
                        <select id="touchpointOutcome" name="outcome" required>
                            <option value="positive" ${prefilledData.outcome === 'positive' ? 'selected' : ''}>✅ Positive</option>
                            <option value="neutral" ${prefilledData.outcome === 'neutral' ? 'selected' : ''}>➖ Neutral</option>
                            <option value="needs-follow-up" ${prefilledData.outcome === 'needs-follow-up' ? 'selected' : ''}>⚠️ Needs Follow-up</option>
                            <option value="negative" ${prefilledData.outcome === 'negative' ? 'selected' : ''}>❌ Negative</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="touchpointLocation">Location:</label>
                        <input type="text" id="touchpointLocation" name="location" 
                               value="${prefilledData.location || ''}" placeholder="Office, Zoom, Coffee shop...">
                    </div>
                </div>
                
                <div class="form-group" style="display: none;" id="followUpGroup">
                    <label for="followUpDate">Follow-up Date:</label>
                    <input type="date" id="followUpDate" name="followUpDate" 
                           value="${prefilledData.followUpDate || ''}">
                </div>
                
                <div class="form-group full-width">
                    <label for="touchpointNotes">Notes:</label>
                    <textarea id="touchpointNotes" name="notes" required 
                              placeholder="What was discussed? Key outcomes? Important details...">${prefilledData.notes || ''}</textarea>
                </div>
                
                <div class="form-group full-width">
                    <label for="touchpointTags">Tags (comma separated):</label>
                    <input type="text" id="touchpointTags" name="tags" 
                           value="${prefilledData.tags ? prefilledData.tags.join(', ') : ''}"
                           placeholder="e.g., quarterly-review, budget-discussion, technical-issue">
                </div>
                
                <div class="form-group full-width">
                    <label for="nextSteps">Next Steps:</label>
                    <textarea id="nextSteps" name="nextSteps" 
                              placeholder="What actions need to be taken? By whom? By when?">${prefilledData.nextSteps || ''}</textarea>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="isImportant" name="isImportant" 
                           ${prefilledData.isImportant ? 'checked' : ''}>
                    <label for="isImportant">Mark as important touchpoint</label>
                </div>
                
                <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('touchpointModal')">
                        Cancel
                    </button>
                    <button type="submit" class="action-btn">
                        ${prefilledData.id ? 'Update' : 'Log'} Touchpoint
                    </button>
                </div>
            </form>
        `;
        
        document.getElementById('touchpointModalContent').innerHTML = modalContent;
        
        // Setup form event listeners
        this.setupTouchpointFormListeners(prefilledData.id);
        
        UIHelpers.showModal('touchpointModal');
    }

    setupTouchpointFormListeners(editingId = null) {
        // Show/hide follow-up date based on outcome
        document.getElementById('touchpointOutcome').addEventListener('change', function(e) {
            const followUpGroup = document.getElementById('followUpGroup');
            if (e.target.value === 'needs-follow-up') {
                followUpGroup.style.display = 'block';
                document.getElementById('followUpDate').required = true;
            } else {
                followUpGroup.style.display = 'none';
                document.getElementById('followUpDate').required = false;
            }
        });

        // Trigger initial check
        document.getElementById('touchpointOutcome').dispatchEvent(new Event('change'));

        // Handle form submission
        document.getElementById('touchpointForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const touchpointData = Object.fromEntries(formData.entries());
            
            // Parse contact selection
            const [contactType, contactId] = touchpointData.contactSelection.split(':');
            if (contactType === 'contact') {
                touchpointData.contactId = contactId;
            } else if (contactType === 'team') {
                touchpointData.teamMemberId = contactId;
                // Get team ID from team member
                const teamMember = this.getTeamMemberById(contactId);
                if (teamMember) {
                    touchpointData.teamId = teamMember.teamId;
                }
            }
            
            // Convert tags string to array
            if (touchpointData.tags) {
                touchpointData.tags = touchpointData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
            
            // Convert checkbox values
            touchpointData.isImportant = document.getElementById('isImportant').checked;
            touchpointData.followUpRequired = touchpointData.outcome === 'needs-follow-up';
            
            // Remove the contactSelection field
            delete touchpointData.contactSelection;
            
            try {
                let result;
                if (editingId) {
                    result = await this.updateTouchpoint(editingId, touchpointData, 'touchpoint-tracker');
                } else {
                    result = await this.logTouchpoint(touchpointData, 'touchpoint-tracker');
                }
                
                if (result) {
                    UIHelpers.closeModal('touchpointModal');
                    UIHelpers.showNotification(
                        `Touchpoint ${editingId ? 'updated' : 'logged'} successfully!`, 
                        'success'
                    );
                    
                    // Refresh current view
                    this.renderCurrentView();
                    this.updateQuickStats();
                    
                    // Show relationship impact if applicable
                    if (result.relationshipScoreImpact > 0) {
                        UIHelpers.showNotification(
                            `Relationship score improved by ${result.relationshipScoreImpact} points! 📈`, 
                            'success'
                        );
                    } else if (result.relationshipScoreImpact < 0) {
                        UIHelpers.showNotification(
                            `Relationship score decreased by ${Math.abs(result.relationshipScoreImpact)} points. Consider follow-up. 📉`, 
                            'warning'
                        );
                    }
                }
            } catch (error) {
                console.error('Error saving touchpoint:', error);
                UIHelpers.showNotification('Failed to save touchpoint. Please try again.', 'error');
            }
        });
    }

    showTouchpointDetails(touchpointId) {
        const touchpoint = this.touchpoints.find(tp => tp.id === touchpointId);
        if (!touchpoint) return;
        
        const contactName = this.getContactName(touchpoint);
        const daysSince = Math.ceil((new Date() - new Date(touchpoint.date)) / (1000 * 60 * 60 * 24));
        
        const detailsContent = `
            <h3>Touchpoint Details</h3>
            
            <div style="margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; color: #232F3E;">${contactName}</h4>
                        <div style="color: #666; font-size: 0.9em;">
                            ${new Date(touchpoint.date).toLocaleDateString()} 
                            (${daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`})
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <span class="type-badge" style="background: ${this.getTypeBadgeColor(touchpoint.type)};">
                            ${this.getTypeLabel(touchpoint.type)}
                        </span>
                        <span class="outcome-badge outcome-${touchpoint.outcome}">
                            ${this.getOutcomeLabel(touchpoint.outcome)}
                        </span>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <strong>Notes:</strong><br>
                    ${touchpoint.notes || 'No notes provided'}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <strong>Details:</strong>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                            ${touchpoint.duration ? `<li>Duration: ${touchpoint.duration} minutes</li>` : ''}
                            ${touchpoint.location ? `<li>Location: ${touchpoint.location}</li>` : ''}
                            ${touchpoint.attendees.length > 0 ? `<li>Attendees: ${touchpoint.attendees.join(', ')}</li>` : ''}
                            <li>Source: ${touchpoint.sourceModule}</li>
                            ${touchpoint.isImportant ? '<li style="color: #FF9900; font-weight: bold;">⭐ Important touchpoint</li>' : ''}
                        </ul>
                    </div>
                    <div>
                        <strong>Impact:</strong>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                            <li>Relationship Score Impact: ${touchpoint.relationshipScoreImpact > 0 ? '+' : ''}${touchpoint.relationshipScoreImpact}</li>
                            ${touchpoint.followUpRequired ? `<li style="color: ${new Date(touchpoint.followUpDate) < new Date() ? '#dc3545' : '#ffc107'};">Follow-up: ${new Date(touchpoint.followUpDate).toLocaleDateString()}</li>` : ''}
                            <li>Created: ${new Date(touchpoint.timestamp).toLocaleString()}</li>
                            ${touchpoint.lastModified !== touchpoint.timestamp ? `<li>Modified: ${new Date(touchpoint.lastModified).toLocaleString()}</li>` : ''}
                        </ul>
                    </div>
                </div>
                
                ${touchpoint.nextSteps ? `
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <strong>Next Steps:</strong><br>
                        ${touchpoint.nextSteps}
                    </div>
                ` : ''}
                
                ${touchpoint.tags.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <strong>Tags:</strong><br>
                        <div style="margin-top: 8px;">
                            ${touchpoint.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="action-btn secondary" onclick="UIHelpers.closeModal('touchpointDetailsModal')">
                    Close
                </button>
                <button class="action-btn" onclick="touchpointTracker.editTouchpoint('${touchpoint.id}'); UIHelpers.closeModal('touchpointDetailsModal');">
                    ✏️ Edit
                </button>
                <button class="action-btn secondary" onclick="touchpointTracker.duplicateTouchpoint('${touchpoint.id}'); UIHelpers.closeModal('touchpointDetailsModal');">
                    📋 Duplicate
                </button>
                ${touchpoint.followUpRequired && !touchpoint.followUpCompleted ? `
                    <button class="action-btn" onclick="touchpointTracker.completeFollowUp('${touchpoint.id}'); UIHelpers.closeModal('touchpointDetailsModal');" style="background: #28a745;">
                        ✅ Complete Follow-up
                    </button>
                ` : ''}
            </div>
        `;
        
        document.getElementById('touchpointDetailsContent').innerHTML = detailsContent;
        UIHelpers.showModal('touchpointDetailsModal');
    }

    editTouchpoint(touchpointId) {
        const touchpoint = this.touchpoints.find(tp => tp.id === touchpointId);
        if (!touchpoint) return;
        
        this.showAddTouchpointModal(touchpoint);
    }

    async duplicateTouchpoint(touchpointId) {
        const touchpoint = this.touchpoints.find(tp => tp.id === touchpointId);
        if (!touchpoint) return;
        
        const duplicateData = {
            ...touchpoint,
            date: new Date().toISOString().split('T')[0], // Today's date
            notes: `[Duplicate] ${touchpoint.notes}`,
            followUpDate: null,
            followUpRequired: false,
            followUpCompleted: false
        };
        
        delete duplicateData.id;
        delete duplicateData.timestamp;
        delete duplicateData.lastModified;
        
        this.showAddTouchpointModal(duplicateData);
    }

    async completeFollowUp(touchpointId) {
        try {
            await this.updateTouchpoint(touchpointId, {
                followUpCompleted: true,
                followUpCompletedDate: new Date().toISOString()
            }, 'touchpoint-tracker');
            
            UIHelpers.showNotification('Follow-up marked as completed!', 'success');
            this.renderCurrentView();
            this.updateQuickStats();
        } catch (error) {
            console.error('Error completing follow-up:', error);
            UIHelpers.showNotification('Failed to complete follow-up', 'error');
        }
    }

    // ===============================
    // UTILITY METHODS
    // ===============================

    calculateScoreImpact(touchpointData) {
        let impact = 0;
        
        // Type impact
        const typeImpacts = {
            'call': 3,
            'meeting': 4,
            'email': 2,
            'text': 1,
            'event': 3,
            'other': 1
        };
        impact += typeImpacts[touchpointData.type] || 1;
        
        // Outcome impact
        const outcomeImpacts = {
            'positive': 2,
            'neutral': 0,
            'needs-follow-up': 1,
            'negative': -2
        };
        impact += outcomeImpacts[touchpointData.outcome] || 0;
        
        // Duration bonus (longer meetings = more engagement)
        if (touchpointData.duration && touchpointData.duration >= 30) {
            impact += 1;
        }
        
        // Important touchpoint bonus
        if (touchpointData.isImportant) {
            impact += 1;
        }
        
        return Math.max(-5, Math.min(5, impact));
    }

    calculateRelationshipTrend(touchpoints) {
        if (touchpoints.length < 2) return 'stable';
        
        const recentTouchpoints = touchpoints.slice(0, 5);
        const avgRecentImpact = recentTouchpoints.reduce((sum, tp) => sum + (tp.relationshipScoreImpact || 0), 0) / recentTouchpoints.length;
        
        if (avgRecentImpact > 1) return 'improving';
        if (avgRecentImpact < -1) return 'declining';
        return 'stable';
    }

    calculateActivityScore(stats) {
        let score = 0;
        
        // Recent activity (0-40 points)
        score += Math.min(40, stats.thisWeek * 8); // 8 points per touchpoint this week
        
        // Consistency (0-30 points)
        if (stats.averageGap <= 7) score += 30;
        else if (stats.averageGap <= 14) score += 20;
        else if (stats.averageGap <= 30) score += 10;
        
        // Variety (0-20 points)
        const typeVariety = Object.keys(stats.typeBreakdown).length;
        score += Math.min(20, typeVariety * 4);
        
        // Positive outcomes (0-10 points)
        const positiveRatio = (stats.outcomeBreakdown.positive || 0) / Math.max(1, stats.total);
        score += positiveRatio * 10;
        
        return Math.min(100, Math.round(score));
    }

    async updateSourceEntity(touchpoint, isDeleting = false) {
        // Update contact last touchpoint
        if (touchpoint.contactId && typeof DataManager !== 'undefined') {
            const contact = DataManager.getContact(touchpoint.contactId);
            if (contact) {
                if (isDeleting) {
                    // Recalculate from remaining touchpoints
                    const remaining = this.getTouchpoints({ contactId: touchpoint.contactId });
                    contact.lastTouchpoint = remaining[0]?.date || null;
                    contact.touchpointCount = remaining.length;
                } else {
                    contact.lastTouchpoint = touchpoint.date;
                    contact.touchpointCount = this.getTouchpoints({ contactId: touchpoint.contactId }).length;
                }
                DataManager.updateContact(contact);
            }
        }
        
        // Update team member last touchpoint
        if (touchpoint.teamMemberId && touchpoint.teamId && typeof DataManager !== 'undefined') {
            const member = DataManager.getTeamMember(touchpoint.teamId, touchpoint.teamMemberId);
            if (member) {
                if (isDeleting) {
                    // Recalculate from remaining touchpoints
                    const remaining = this.getTouchpoints({ teamMemberId: touchpoint.teamMemberId });
                    member.lastTouchpoint = remaining[0]?.date || null;
                    member.touchpointCount = remaining.length;
                } else {
                    member.lastTouchpoint = touchpoint.date;
                    member.touchpointCount = this.getTouchpoints({ teamMemberId: touchpoint.teamMemberId }).length;
                }
                DataManager.updateTeamMember(touchpoint.teamId, member);
            }
        }
    }

    getAllContactsAndTeamMembers() {
        const contacts = [];
        
        // Get regular contacts
        if (typeof DataManager !== 'undefined' && DataManager.getAllContacts) {
            const allContacts = DataManager.getAllContacts();
            allContacts.forEach(contact => {
                contacts.push({
                    id: contact.id,
                    name: contact.name,
                    type: 'contact'
                });
            });
        }
        
        // Get team members
        if (typeof DataManager !== 'undefined' && DataManager.getTeamMembers) {
            const teamMembers = DataManager.getTeamMembers();
            Object.keys(teamMembers).forEach(teamId => {
                teamMembers[teamId].forEach(member => {
                    contacts.push({
                        id: member.id,
                        name: member.name,
                        type: 'team',
                        teamId: teamId
                    });
                });
            });
        }
        
        return contacts.sort((a, b) => a.name.localeCompare(b.name));
    }

    getTeamMemberById(memberId) {
        if (typeof DataManager !== 'undefined' && DataManager.getTeamMembers) {
            const teamMembers = DataManager.getTeamMembers();
            for (const teamId of Object.keys(teamMembers)) {
                const member = teamMembers[teamId].find(m => m.id === memberId);
                if (member) {
                    return { ...member, teamId };
                }
            }
        }
        return null;
    }

    getContactName(touchpoint) {
        // Try to get the actual contact/team member name
        if (touchpoint.contactId && typeof DataManager !== 'undefined') {
            const contact = DataManager.getContact(touchpoint.contactId);
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

    getTypeBadgeColor(type) {
        const colors = {
            'call': '#28a745',
            'email': '#17a2b8',
            'meeting': '#6f42c1',
            'text': '#20c997',
            'event': '#fd7e14',
            'other': '#6c757d'
        };
        return colors[type] || '#6c757d';
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

    getOverallStats() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const thisWeek = this.touchpoints.filter(tp => new Date(tp.date) >= weekAgo).length;
        const typeCount = {};
        const outcomeCount = {};
        const tagCount = {};
        let totalDuration = 0;
        let durationCount = 0;
        
        this.touchpoints.forEach(tp => {
            typeCount[tp.type] = (typeCount[tp.type] || 0) + 1;
            outcomeCount[tp.outcome] = (outcomeCount[tp.outcome] || 0) + 1;
            
            if (tp.duration) {
                totalDuration += tp.duration;
                durationCount++;
            }
            
            tp.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });
        
        const topTags = Object.entries(tagCount).sort(([,a], [,b]) => b - a);
        
        return {
            total: this.touchpoints.length,
            thisWeek,
            averagePerDay: (thisWeek / 7).toFixed(1),
            typeBreakdown: typeCount,
            outcomeBreakdown: outcomeCount,
            topTags,
            totalDuration,
            averageDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
            averageGap: this.calculateAverageGap()
        };
    }

    calculateAverageGap() {
        if (this.touchpoints.length < 2) return 0;
        
        const sortedTouchpoints = [...this.touchpoints].sort((a, b) => new Date(b.date) - new Date(a.date));
        const gaps = [];
        
        for (let i = 0; i < sortedTouchpoints.length - 1; i++) {
            const gap = (new Date(sortedTouchpoints[i].date) - new Date(sortedTouchpoints[i + 1].date)) / (1000 * 60 * 60 * 24);
            gaps.push(gap);
        }
        
        return Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
    }

    // ===============================
    // FOLLOW-UP MANAGEMENT
    // ===============================

    createFollowUpAlert(touchpoint) {
        if (!touchpoint.followUpDate) return;
        
        const alert = {
            id: `followup-${touchpoint.id}`,
            touchpointId: touchpoint.id,
            contactName: this.getContactName(touchpoint),
            dueDate: touchpoint.followUpDate,
            created: new Date().toISOString(),
            completed: false
        };
        
        this.followUpAlerts.push(alert);
        this.saveFollowUpAlerts();
    }

    updateFollowUpAlert(touchpoint) {
        const alertIndex = this.followUpAlerts.findIndex(alert => alert.touchpointId === touchpoint.id);
        if (alertIndex !== -1) {
            if (touchpoint.followUpRequired && touchpoint.followUpDate) {
                this.followUpAlerts[alertIndex].dueDate = touchpoint.followUpDate;
                this.followUpAlerts[alertIndex].completed = touchpoint.followUpCompleted || false;
            } else {
                this.followUpAlerts.splice(alertIndex, 1);
            }
            this.saveFollowUpAlerts();
        }
    }

    removeFollowUpAlert(touchpointId) {
        const alertIndex = this.followUpAlerts.findIndex(alert => alert.touchpointId === touchpointId);
        if (alertIndex !== -1) {
            this.followUpAlerts.splice(alertIndex, 1);
            this.saveFollowUpAlerts();
        }
    }

    checkFollowUpAlerts() {
        const now = new Date();
        const overdue = this.followUpAlerts.filter(alert => 
            !alert.completed && new Date(alert.dueDate) < now
        );
        
        if (overdue.length > 0 && typeof UIHelpers !== 'undefined') {
            UIHelpers.showNotification(
                `You have ${overdue.length} overdue follow-up${overdue.length === 1 ? '' : 's'}!`,
                'warning'
            );
        }
    }

    // ===============================
    // DATA PERSISTENCE & SUBSCRIPTION
    // ===============================

    loadTouchpoints() {
        const stored = localStorage.getItem('crm_touchpoints');
        if (stored) {
            this.touchpoints = JSON.parse(stored);
        }
        
        const storedAlerts = localStorage.getItem('crm_followup_alerts');
        if (storedAlerts) {
            this.followUpAlerts = JSON.parse(storedAlerts);
        }
    }

    saveTouchpoints() {
        localStorage.setItem('crm_touchpoints', JSON.stringify(this.touchpoints));
    }

    saveFollowUpAlerts() {
        localStorage.setItem('crm_followup_alerts', JSON.stringify(this.followUpAlerts));
    }

    subscribe(moduleName, callback) {
        this.subscribers.set(moduleName, callback);
        console.log(`📡 ${moduleName} subscribed to touchpoint events`);
    }

    unsubscribe(moduleName) {
        this.subscribers.delete(moduleName);
        console.log(`📡 ${moduleName} unsubscribed from touchpoint events`);
    }

    notifySubscribers(eventType, data) {
        this.subscribers.forEach((callback, moduleName) => {
            try {
                callback(eventType, data);
            } catch (error) {
                console.error(`Error notifying ${moduleName} of ${eventType}:`, error);
            }
        });
    }

    // ===============================
    // PUBLIC VIEW METHODS
    // ===============================

    switchView(view) {
        this.currentView = view;
        this.renderCurrentView();
    }

    previousMonth() {
        this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
        this.renderCurrentView();
    }

    nextMonth() {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
        this.renderCurrentView();
    }

    currentMonth() {
        this.selectedDate = new Date();
        this.renderCurrentView();
    }

    selectDate(dateString) {
        this.selectedDate = new Date(dateString);
        // Show touchpoints for selected date
        const dayTouchpoints = this.getTouchpoints({
            dateRange: {
                start: dateString,
                end: dateString
            }
        });
        
        if (dayTouchpoints.length > 0) {
            // Show list of touchpoints for this day
            const dayModal = `
                <h3>Touchpoints for ${new Date(dateString).toLocaleDateString()}</h3>
                <div class="touchpoint-list">
                    ${this.renderTouchpointCards(dayTouchpoints)}
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <button class="action-btn" onclick="touchpointTracker.showAddTouchpointModal({date: '${dateString}'}); UIHelpers.closeModal('touchpointDetailsModal');">
                        + Add Touchpoint for This Day
                    </button>
                </div>
            `;
            
            document.getElementById('touchpointDetailsContent').innerHTML = dayModal;
            UIHelpers.showModal('touchpointDetailsModal');
        } else {
            // Offer to add touchpoint for this day
            this.showAddTouchpointModal({ date: dateString });
        }
    }

    applyFilters() {
        const startDate = document.getElementById('filterStartDate')?.value;
        const endDate = document.getElementById('filterEndDate')?.value;
        const type = document.getElementById('filterType')?.value;
        const outcome = document.getElementById('filterOutcome')?.value;
        const search = document.getElementById('filterSearch')?.value;
        
        this.filters = {
            dateRange: startDate && endDate ? { start: startDate, end: endDate } : null,
            type: type || '',
            outcome: outcome || '',
            search: search || ''
        };
        
        // Apply search filter
        let touchpoints = this.getTouchpoints(this.filters);
        if (this.filters.search) {
            touchpoints = touchpoints.filter(tp => 
                tp.notes.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                this.getContactName(tp).toLowerCase().includes(this.filters.search.toLowerCase())
            );
        }
        
        // Re-render filtered results
        const container = document.getElementById('touchpointList');
        if (container) {
            container.innerHTML = touchpoints.length > 0 ? 
                this.renderTouchpointCards(touchpoints) : 
                this.renderEmptyState('history');
        }
    }

    clearFilters() {
        this.filters = {
            dateRange: null,
            type: '',
            outcome: '',
            search: ''
        };
        
        // Clear form fields
        const fields = ['filterStartDate', 'filterEndDate', 'filterType', 'filterOutcome', 'filterSearch'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
        
        this.renderCurrentView();
    }

    updateQuickStats() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const todayCount = this.touchpoints.filter(tp => tp.date === today).length;
        const weekCount = this.touchpoints.filter(tp => new Date(tp.date) >= weekAgo).length;
        const monthCount = this.touchpoints.filter(tp => new Date(tp.date) >= monthAgo).length;
        const overdueCount = this.followUpAlerts.filter(alert => 
            !alert.completed && new Date(alert.dueDate) < now
        ).length;
        
        // Update DOM elements
        const elements = {
            'todayCount': todayCount,
            'weekCount': weekCount,
            'monthCount': monthCount,
            'overdueCount': overdueCount,
            'totalCount': this.touchpoints.length
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    generateTouchpointId() {
        return `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// ===============================
// GLOBAL API FUNCTIONS
// ===============================

/**
 * Global function for other modules to easily log touchpoints
 * Usage: await logTouchpoint({ contactId: 'contact_123', type: 'call', outcome: 'positive', notes: 'Great conversation' }, 'teamsModule')
 */
window.logTouchpoint = async function(touchpointData, sourceModule) {
    if (typeof touchpointTracker !== 'undefined') {
        return await touchpointTracker.logTouchpoint(touchpointData, sourceModule);
    } else {
        console.error('TouchpointTracker not available');
        return null;
    }
};

/**
 * Global function to get touchpoint stats for a contact/team member
 */
window.getTouchpointStats = function(contactId = null, teamMemberId = null) {
    if (typeof touchpointTracker !== 'undefined') {
        return touchpointTracker.getTouchpointStats(contactId, teamMemberId);
    } else {
        console.error('TouchpointTracker not available');
        return null;
    }
};

/**
 * Global function to get recent touchpoints
 */
window.getRecentTouchpoints = function(filters = {}) {
    if (typeof touchpointTracker !== 'undefined') {
        return touchpointTracker.getTouchpoints(filters);
    } else {
        console.error('TouchpointTracker not available');
        return [];
    }
};

/**
 * Global function to subscribe to touchpoint events
 */
window.subscribeTouchpoints = function(moduleName, callback) {
    if (typeof touchpointTracker !== 'undefined') {
        touchpointTracker.subscribe(moduleName, callback);
    } else {
        console.error('TouchpointTracker not available');
    }
};

/**
 * Global function to unsubscribe from touchpoint events
 */
window.unsubscribeTouchpoints = function(moduleName) {
    if (typeof touchpointTracker !== 'undefined') {
        touchpointTracker.unsubscribe(moduleName);
    } else {
        console.error('TouchpointTracker not available');
    }
};

// Create global instance
const touchpointTracker = new TouchpointTracker();
console.log('✅ Complete Touchpoint Tracker loaded successfully');

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => touchpointTracker.init());
} else {
    touchpointTracker.init();
}
