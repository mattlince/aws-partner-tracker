// Dashboard Module - Metrics and Overview
class DashboardModule {
    constructor() {
        this.metrics = {
            engagementRate: 0,
            pipelineValue: 0,
            activeDeals: 0,
            coverageRatio: 0
        };
    }

    init() {
        console.log('Dashboard module initialized');
        
        // Listen for data changes to update metrics
        DataManager.on('contact:updated', () => this.updateMetrics());
        DataManager.on('contact:deleted', () => this.updateMetrics());
        DataManager.on('deal:updated', () => this.updateMetrics());
        DataManager.on('data:loaded', () => this.updateMetrics());
        
        // Initial render
        this.render();
    }

    render() {
        const dashboardContainer = document.getElementById('dashboard');
        if (!dashboardContainer) return;

        dashboardContainer.innerHTML = this.getDashboardHTML();
        this.updateMetrics();
    }

    getDashboardHTML() {
        return `
            <div class="metric-card">
                <div class="metric-value" style="color: #28a745;" id="engagementRate">0%</div>
                <div class="metric-label">Total Engagement Rate</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%;" id="engagementProgress"></div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #17a2b8;" id="pipelineValue">$0</div>
                <div class="metric-label">Active Pipeline</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%;" id="pipelineProgress"></div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #ffc107;" id="activeDeals">0</div>
                <div class="metric-label">Active Deals</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%;" id="dealsProgress"></div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #fd7e14;" id="coverageRatio">0x</div>
                <div class="metric-label">Pipeline Coverage</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%;" id="coverageProgress"></div>
                </div>
            </div>

            <style>
                .metric-card {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                    text-align: center;
                    transition: transform 0.3s ease;
                }
                .metric-card:hover { 
                    transform: translateY(-5px); 
                }
                .metric-value {
                    font-size: 2.5em;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .metric-label {
                    color: #666;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .progress-bar {
                    width: 100%;
                    height: 20px;
                    background: #e9ecef;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-top: 10px;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(45deg, #28a745, #20c997);
                    transition: width 0.3s ease;
                }
            </style>
        `;
    }

    updateMetrics() {
        // Calculate engagement rate
        const contacts = DataManager.getContacts();
        const allContacts = Object.values(contacts).flat();
        const engagedContacts = allContacts.filter(c => c.relationshipScore > 2).length;
        const engagementRate = allContacts.length > 0 ? Math.round((engagedContacts / allContacts.length) * 100) : 0;

        // Calculate pipeline metrics
        const deals = DataManager.getDeals();
        const activeDeals = deals.filter(d => !['deal-won', 'deal-lost'].includes(d.stage));
        const totalPipelineValue = activeDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        // Calculate weighted pipeline value (considering probability)
        const weightedPipelineValue = activeDeals.reduce((sum, deal) => {
            const probability = deal.probability || 0;
            return sum + ((deal.value || 0) * (probability / 100));
        }, 0);

        // Calculate coverage ratio (assuming $2.9M annual target)
        const annualTarget = 2900000;
        const coverageRatio = annualTarget > 0 ? (totalPipelineValue / annualTarget) : 0;

        // Update the metrics object
        this.metrics = {
            engagementRate,
            pipelineValue: totalPipelineValue,
            activeDeals: activeDeals.length,
            coverageRatio
        };

        // Update the DOM
        this.updateMetricDisplay('engagementRate', `${engagementRate}%`, engagementRate);
        this.updateMetricDisplay('pipelineValue', this.formatCurrency(totalPipelineValue), Math.min((totalPipelineValue / annualTarget) * 100, 100));
        this.updateMetricDisplay('activeDeals', activeDeals.length, Math.min(activeDeals.length * 5, 100));
        this.updateMetricDisplay('coverageRatio', `${coverageRatio.toFixed(1)}x`, Math.min(coverageRatio * 20, 100));

        // Log metrics for debugging
        console.log('Dashboard metrics updated:', this.metrics);
    }

    updateMetricDisplay(elementId, value, progressPercentage) {
        const valueElement = document.getElementById(elementId);
        const progressElement = document.getElementById(elementId.replace('Rate', 'Progress').replace('Value', 'Progress').replace('Deals', 'Progress').replace('Ratio', 'Progress'));
        
        if (valueElement) {
            valueElement.textContent = value;
        }
        
        if (progressElement) {
            progressElement.style.width = `${Math.max(0, Math.min(100, progressPercentage))}%`;
        }
    }

    formatCurrency(amount) {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(0)}K`;
        } else {
            return `$${amount.toFixed(0)}`;
        }
    }

    // Method to get current metrics (for other modules to use)
    getMetrics() {
        return { ...this.metrics };
    }

    // Method to get detailed breakdown
    getDetailedMetrics() {
        const contacts = DataManager.getContacts();
        const deals = DataManager.getDeals();
        const teams = DataManager.getTeams();

        // Team-level breakdown
        const teamMetrics = {};
        Object.keys(teams).forEach(teamId => {
            const teamContacts = contacts[teamId] || [];
            const teamDeals = deals.filter(deal => 
                teamContacts.some(contact => contact.id === deal.contactId)
            );
            
            const engagedContacts = teamContacts.filter(c => c.relationshipScore > 2).length;
            const teamEngagementRate = teamContacts.length > 0 ? 
                Math.round((engagedContacts / teamContacts.length) * 100) : 0;
            
            const teamPipelineValue = teamDeals
                .filter(d => !['deal-won', 'deal-lost'].includes(d.stage))
                .reduce((sum, deal) => sum + (deal.value || 0), 0);

            teamMetrics[teamId] = {
                name: teams[teamId].name,
                contactCount: teamContacts.length,
                engagementRate: teamEngagementRate,
                pipelineValue: teamPipelineValue,
                dealCount: teamDeals.length
            };
        });

        // Deal stage breakdown
        const stageBreakdown = {};
        const dealStages = DataManager.config.dealStages;
        Object.keys(dealStages).forEach(stageId => {
            const stageDeals = deals.filter(d => d.stage === stageId);
            stageBreakdown[stageId] = {
                name: dealStages[stageId].name,
                count: stageDeals.length,
                value: stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
            };
        });

        return {
            overall: this.metrics,
            teams: teamMetrics,
            stages: stageBreakdown,
            summary: {
                totalContacts: Object.values(contacts).flat().length,
                totalTeams: Object.keys(teams).length,
                totalDeals: deals.length,
                wonDeals: deals.filter(d => d.stage === 'deal-won').length,
                lostDeals: deals.filter(d => d.stage === 'deal-lost').length
            }
        };
    }

    // Method to export metrics summary
    exportMetrics() {
        const metrics = this.getDetailedMetrics();
        const csvData = this.convertMetricsToCSV(metrics);
        this.downloadFile(csvData, 'aws_metrics_export.csv', 'text/csv');
    }

    convertMetricsToCSV(metrics) {
        let csv = 'Metric Type,Name,Value,Additional Info\n';
        
        // Overall metrics
        csv += `Overall,Engagement Rate,${metrics.overall.engagementRate}%,\n`;
        csv += `Overall,Pipeline Value,${this.formatCurrency(metrics.overall.pipelineValue)},\n`;
        csv += `Overall,Active Deals,${metrics.overall.activeDeals},\n`;
        csv += `Overall,Coverage Ratio,${metrics.overall.coverageRatio.toFixed(1)}x,\n`;
        
        // Team metrics
        Object.keys(metrics.teams).forEach(teamId => {
            const team = metrics.teams[teamId];
            csv += `Team,${team.name},${team.contactCount} contacts,"Engagement: ${team.engagementRate}%, Pipeline: ${this.formatCurrency(team.pipelineValue)}"\n`;
        });
        
        // Stage metrics
        Object.keys(metrics.stages).forEach(stageId => {
            const stage = metrics.stages[stageId];
            csv += `Deal Stage,${stage.name},${stage.count} deals,${this.formatCurrency(stage.value)}\n`;
        });
        
        return csv;
    }

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
        UIHelpers.showNotification(`${filename} downloaded successfully`);
    }

    // Method for other modules to trigger metric updates
    refresh() {
        this.updateMetrics();
    }

    // Event handler for data changes from other modules
    onEvent(eventType, data) {
        switch(eventType) {
            case 'contact:updated':
            case 'contact:deleted':
            case 'deal:updated':
            case 'deal:deleted':
                this.updateMetrics();
                break;
        }
    }
}

// Create global instance
const dashboardModule = new DashboardModule();
