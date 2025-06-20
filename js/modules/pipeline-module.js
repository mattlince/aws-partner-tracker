// Helper methods for referral tracking
    getReferralBadge(deal) {
        if (!deal.referralSource || deal.referralSource === 'direct') return '';
        
        const badges = {
            aws: '<span class="referral-badge referral-aws">AWS</span>',
            cdw: '<span class="referral-badge referral-cdw">CDW</span>',
            other: '<span class="referral-badge referral-other">Partner</span>'
        };
        
        return badges[deal.referralSource] || '';
    }

    getReferralDetails(deal) {
        if (!deal.referralSource || deal.referralSource === 'direct') return '';
        
        const referralContact = deal.referralContactId ? DataManager.getContactById(deal.referralContactId) : null;
        const contactName = referralContact ? referralContact.name : '';
        
        return `<div style="font-size: 0.8em; color: #888; margin-top: 4px;">
            ${contactName ? `Ref: ${contactName}` : ''}
            ${deal.referralType ? ` • ${deal.referralType}` : ''}
        </div>`;
    }

    getReferralContactName(deal) {
        if (!deal.referralContactId) return '';
        const contact = DataManager.getContactById(deal.referralContactId);
        return contact ? contact.name : '';
    }

    getAwsContacts() {
        // Check if DataManager has getAwsContacts method, otherwise return empty array
        if (typeof DataManager.getAwsContacts === 'function') {
            return DataManager.getAwsContacts();
        }
        // Fallback: filter contacts by company/team containing AWS
        return DataManager.getAllContacts().filter(contact => 
            contact.company?.toLowerCase().includes('aws') || 
            contact.team?.toLowerCase().includes('aws')
        );
    }

    getCdwContacts() {
        // Check if DataManager has getCdwContacts method, otherwise return empty array
        if (typeof DataManager.getCdwContacts === 'function') {
            return DataManager.getCdwContacts();
        }
        // Fallback: filter contacts by company containing CDW
        return DataManager.getAllContacts().filter(contact => 
            contact.company?.toLowerCase().includes('cdw')
        );
    }

    calculateReferralStats(deals) {
        const awsDeals = deals.filter(deal => deal.referralSource === 'aws');
        const cdwDeals = deals.filter(deal => deal.referralSource === 'cdw');
        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        
        const awsValue = awsDeals.reduce((sum, deal) => sum + deal.value, 0);
        const cdwValue = cdwDeals.reduce((sum, deal) => sum + deal.value, 0);
        
        return {
            awsCount: awsDeals.length,
            cdwCount: cdwDeals.length,
            awsValue,
            cdwValue,
            awsPercentage: totalValue > 0 ? Math.round((awsValue / totalValue) * 100) : 0,
            cdwPercentage: totalValue > 0 ? Math.round((cdwValue / totalValue) * 100) : 0
        };
    }

    calculateReferralAnalytics(deals) {
        const awsDeals = deals.filter(deal => deal.referralSource === 'aws');
        const cdwDeals = deals.filter(deal => deal.referralSource === 'cdw');
        const directDeals = deals.filter(deal => !deal.referralSource || deal.referralSource === 'direct');
        const otherDeals = deals.filter(deal => deal.referralSource === 'other');
        
        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        
        // AWS Analytics
        const awsWonDeals = awsDeals.filter(deal => deal.stage === 'deal-won');
        const awsClosedDeals = awsDeals.filter(deal => ['deal-won', 'deal-lost'].includes(deal.stage));
        const awsConversionRate = awsClosedDeals.length > 0 ? Math.round((awsWonDeals.length / awsClosedDeals.length) * 100) : 0;
        
        // CDW Analytics
        const cdwWonDeals = cdwDeals.filter(deal => deal.stage === 'deal-won');
        const cdwClosedDeals = cdwDeals.filter(deal => ['deal-won', 'deal-lost'].includes(deal.stage));
        const cdwConversionRate = cdwClosedDeals.length > 0 ? Math.round((cdwWonDeals.length / cdwClosedDeals.length) * 100) : 0;
        
        // Top AWS teams (placeholder - would need team data)
        const awsTopTeams = [
            { name: 'AWS Enterprise West', value: awsDeals.slice(0, 3).reduce((sum, deal) => sum + deal.value, 0), count: 3 },
            { name: 'AWS SMB Central', value: awsDeals.slice(3, 6).reduce((sum, deal) => sum + deal.value, 0), count: 2 },
            { name: 'AWS Enterprise East', value: awsDeals.slice(6, 9).reduce((sum, deal) => sum + deal.value, 0), count: 1 }
        ].filter(team => team.count > 0);
        
        // Top CDW contacts
        const cdwTopContacts = [
            { name: 'CDW Account Manager', value: cdwDeals.slice(0, 2).reduce((sum, deal) => sum + deal.value, 0), count: 2 },
            { name: 'CDW Solutions Architect', value: cdwDeals.slice(2, 4).reduce((sum, deal) => sum + deal.value, 0), count: 1 }
        ].filter(contact => contact.count > 0);
        
        return {
            aws: {
                count: awsDeals.length,
                wonCount: awsWonDeals.length,
                totalValue: awsDeals.reduce((sum, deal) => sum + deal.value, 0),
                conversionRate: awsConversionRate,
                avgDealSize: awsDeals.length > 0 ? awsDeals.reduce((sum, deal) => sum + deal.value, 0) / awsDeals.length : 0,
                avgCycle: 45, // Placeholder
                bestStage: 'Proposal Development',
                topTeams: awsTopTeams
            },
            cdw: {
                count: cdwDeals.length,
                wonCount: cdwWonDeals.length,
                totalValue: cdwDeals.reduce((sum, deal) => sum + deal.value, 0),
                conversionRate: cdwConversionRate,
                avgDealSize: cdwDeals.length > 0 ? cdwDeals.reduce((sum, deal) => sum + deal.value, 0) / cdwDeals.length : 0,
                avgCycle: 38, // Placeholder
                bestStage: 'Qualified',
                topContacts: cdwTopContacts
            },
            comparison: {
                aws: { percentage: totalValue > 0 ? Math.round((awsDeals.reduce((sum, deal) => sum + deal.value, 0) / totalValue) * 100) : 0 },
                cdw: { percentage: totalValue > 0 ? Math.round((cdwDeals.reduce((sum, deal) => sum + deal.value, 0) / totalValue) * 100) : 0 },
                direct: { percentage: totalValue > 0 ? Math.round((directDeals.reduce((sum, deal) => sum + deal.value, 0) / totalValue) * 100) : 0 },
                other: { percentage: totalValue > 0 ? Math.round((otherDeals.reduce((sum, deal) => sum + deal.value, 0) / totalValue) * 100) : 0 }
            }
        };
    }

    quickEditDeal(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;
        
        const stages = DataManager.config.dealStages;
        
        const modalContent = `
            <h3>Quick Edit: ${deal.name}</h3>
            <form id="quickEditForm">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Deal Value:</label>
                        <input type="number" id="dealValue" value="${deal.value}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Probability:</label>
                        <input type="number" id="dealProbability" value="${deal.probability}" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Stage:</label>
                        <select id="dealStage" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                            ${Object.keys(stages).map(stageId => `
                                <option value="${stageId}" ${deal.stage === stageId ? 'selected' : ''}>
                                    ${stages[stageId].name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Close Date:</label>
                        <input type="date" id="dealCloseDate" value="${deal.closeDate}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Referral Source:</label>
                        <select id="referralSource" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="direct" ${!deal.referralSource || deal.referralSource === 'direct' ? 'selected' : ''}>Direct Sales</option>
                            <option value="aws" ${deal.referralSource === 'aws' ? 'selected' : ''}>AWS Referral</option>
                            <option value="cdw" ${deal.referralSource === 'cdw' ? 'selected' : ''}>CDW Referral</option>
                            <option value="other" ${deal.referralSource === 'other' ? 'selected' : ''}>Other Partner</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Referral Type:</label>
                        <select id="referralType" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Type</option>
                            <option value="direct-intro" ${deal.referralType === 'direct-intro' ? 'selected' : ''}>Direct Introduction</option>
                            <option value="event-lead" ${deal.referralType === 'event-lead' ? 'selected' : ''}>Event Lead</option>
                            <option value="partner-program" ${deal.referralType === 'partner-program' ? 'selected' : ''}>Partner Program</option>
                            <option value="co-sell" ${deal.referralType === 'co-sell' ? 'selected' : ''}>Co-sell Opportunity</option>
                            <option value="marketplace" ${deal.referralType === 'marketplace' ? 'selected' : ''}>Marketplace Lead</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Notes:</label>
                    <textarea id="dealNotes" style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 6px;" placeholder="Update notes...">${deal.description || ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button type="submit" class="action-btn">Save Changes</button>
                    <button type="button" class="action-btn secondary" onclick="UIHelpers.closeModal('dealQuickEditModal')">Cancel</button>
                </div>
            </form>
        `;
        
        document.getElementById('dealQuickEditContent').innerHTML = modalContent;
        
        // Handle form submission
        document.getElementById('quickEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedDeal = {
                ...deal,
                value: parseFloat(document.getElementById('dealValue').value),
                probability: parseInt(document.getElementById('dealProbability').value),
                stage: document.getElementById('dealStage').value,
                closeDate: document.getElementById('dealCloseDate').value,
                referralSource: document.getElementById('referralSource').value,
                referralType: document.getElementById('referralType').value,
                description: document.getElementById('dealNotes').value
            };
            
            DataManager.updateDeal(updatedDeal);
            UIHelpers.closeModal('dealQuickEditModal');
            UIHelpers.showNotification('Deal updated successfully', 'success');
        });
        
        UIHelpers.showModal('dealQuickEditModal');
    }

    editDeal(dealId) {
        this.showDealForm(dealId);
    }

    cloneDeal(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;
        
        const clonedDeal = {
            ...deal,
            name: deal.name + ' (Copy)',
            stage: 'prequalified',
            probability: 10,
            closeDate: '',
            createdAt: new Date().toISOString()
        };
        delete clonedDeal.id;
        
        DataManager.addDeal(clonedDeal);
        UIHelpers.showNotification('Deal cloned successfully', 'success');
    }

    deleteDeal(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (!deal) return;
        
        if (confirm(`Are you sure you want to delete "${deal.name}"? This action cannot be undone.`)) {
            DataManager.deleteDeal(dealId);
            UIHelpers.closeModal('dealFormModal');
            UIHelpers.showNotification('Deal deleted successfully', 'success');
        }
    }

    logActivity(dealId) {
        const deal = DataManager.getDeals().find(d => d.id === dealId);
        if (deal) {
            const contact = DataManager.getContactById(deal.contactId);
            if (contact && typeof touchpointsModule !== 'undefined') {
                touchpointsModule.addTouchpointFor(deal.contactId, `Deal: ${deal.name}`);
            } else {
                UIHelpers.showNotification('Activity logging coming soon!', 'info');
            }
        }
    }

    // Table sorting and filtering
    sortTable(column) {
        if (this.sortBy === column) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = column;
            this.sortOrder = 'asc';
        }
        this.renderContent();
    }

    sortDeals(deals) {
        return deals.sort((a, b) => {
            let aValue, bValue;
            
            switch(this.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'contact':
                    const contactA = DataManager.getContactById(a.contactId);
                    const contactB = DataManager.getContactById(b.contactId);
                    aValue = contactA ? contactA.name.toLowerCase() : '';
                    bValue = contactB ? contactB.name.toLowerCase() : '';
                    break;
                case 'value':
                    aValue = a.value;
                    bValue = b.value;
                    break;
                case 'stage':
                    const stages = Object.keys(DataManager.config.dealStages);
                    aValue = stages.indexOf(a.stage);
                    bValue = stages.indexOf(b.stage);
                    break;
                case 'probability':
                    aValue = a.probability;
                    bValue = b.probability;
                    break;
                case 'referralSource':
                    aValue = a.referralSource || 'direct';
                    bValue = b.referralSource || 'direct';
                    break;
                case 'closeDate':
                    aValue = new Date(a.closeDate);
                    bValue = new Date(b.closeDate);
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    updateSortIndicators() {
        // Remove all sort classes
        document.querySelectorAll('.deals-table th').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        
        // Add sort class to current column
        const sortableHeaders = document.querySelectorAll('.deals-table th.sortable');
        sortableHeaders.forEach(th => {
            const columnName = th.textContent.toLowerCase().replace(' ', '');
            if (columnName.includes(this.sortBy.toLowerCase())) {
                th.classList.add(this.sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        });
    }

    bulkEditDeals() {
        UIHelpers.showNotification('Bulk edit feature coming soon!', 'info');
    }

    // Data processing methods
    getFilteredDeals() {
        let deals = DataManager.getDeals();
        
        // Apply timeframe filter
        if (this.selectedTimeframe !== 'all') {
            const now = new Date();
            let startDate, endDate;
            
            switch(this.selectedTimeframe) {
                case 'current-quarter':
                    const currentQuarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
                    endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
                    break;
                case 'next-quarter':
                    const nextQuarter = Math.floor(now.getMonth() / 3) + 1;
                    startDate = new Date(now.getFullYear(), nextQuarter * 3, 1);
                    endDate = new Date(now.getFullYear(), (nextQuarter + 1) * 3, 0);
                    break;
                case 'this-year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    break;
            }
            
            if (startDate && endDate) {
                deals = deals.filter(deal => {
                    const closeDate = new Date(deal.closeDate);
                    return closeDate >= startDate && closeDate <= endDate;
                });
            }
        }
        
        // Apply team filter
        if (this.filters.team !== 'all') {
            const teamContacts = DataManager.getContactsByTeam(this.filters.team);
            const teamContactIds = teamContacts.map(c => c.id);
            deals = deals.filter(deal => teamContactIds.includes(deal.contactId));
        }
        
        // Apply value filter
        if (this.filters.value !== 'all') {
            deals = deals.filter(deal => {
                switch(this.filters.value) {
                    case 'enterprise': return deal.value >= 500000;
                    case 'large': return deal.value >= 100000 && deal.value < 500000;
                    case 'medium': return deal.value >= 25000 && deal.value < 100000;
                    case 'small': return deal.value < 25000;
                    default: return true;
                }
            });
        }
        
        // Apply referral source filter
        if (this.filters.referralSource !== 'all') {
            deals = deals.filter(deal => {
                const dealSource = deal.referralSource || 'direct';
                return dealSource === this.filters.referralSource;
            });
        }
        
        // Apply stage filter
        if (this.filters.stage !== 'all') {
            deals = deals.filter(deal => deal.stage === this.filters.stage);
        }
        
        return deals;
    }

    getTeamOptions() {
        const teams = DataManager.getTeams();
        return Object.keys(teams).map(teamId => 
            `<option value="${teamId}">${teams[teamId].name}</option>`
        ).join('');
    }

    getStageOptions() {
        const stages = DataManager.config.dealStages;
        return Object.keys(stages).map(stageId => 
            `<option value="${stageId}">${stages[stageId].name}</option>`
        ).join('');
    }

    calculatePipelineStats(deals) {
        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        const weightedValue = deals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
        
        // Calculate close rate
        const closedDeals = deals.filter(deal => ['deal-won', 'deal-lost'].includes(deal.stage));
        const wonDeals = deals.filter(deal => deal.stage === 'deal-won');
        const closeRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
        
        // Calculate quarterly forecast
        const quarterlyDeals = deals.filter(deal => {
            const closeDate = new Date(deal.closeDate);
            const now = new Date();
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
            const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
            return closeDate >= quarterStart && closeDate <= quarterEnd;
        });
        const quarterlyForecast = quarterlyDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        
        return {
            totalValue,
            weightedValue,
            avgDealSize,
            closeRate,
            quarterlyForecast,
            totalDeals: deals.length
        };
    }

    calculateForecastData(deals) {
        const highProbDeals = deals.filter(deal => deal.probability >= 75);
        const mediumProbDeals = deals.filter(deal => deal.probability >= 25 && deal.probability < 75);
        
        const bestCase = deals.reduce((sum, deal) => sum + deal.value, 0);
        const mostLikely = deals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        const worstCase = highProbDeals.reduce((sum, deal) => sum + (deal.value * 0.5), 0);
        
        const dealsToClose = deals.filter(deal => deal.probability >= 50).length;
        
        // Referral source forecasts
        const awsDeals = deals.filter(deal => deal.referralSource === 'aws');
        const cdwDeals = deals.filter(deal => deal.referralSource === 'cdw');
        const directDeals = deals.filter(deal => !deal.referralSource || deal.referralSource === 'direct');
        
        const awsForecast = awsDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        const cdwForecast = cdwDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        const directForecast = directDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
        
        const healthMetrics = [
            { name: 'Pipeline Coverage', value: '2.3x', color: '#28a745' },
            { name: 'Average Deal Age', value: '45 days', color: '#ffc107' },
            { name: 'Stalled Deals', value: '12%', color: '#dc3545' },
            { name: 'New Deals (30d)', value: '8', color: '#17a2b8' },
            { name: 'AWS Referrals', value: `${awsDeals.length}`, color: '#FF9900' },
            { name: 'CDW Referrals', value: `${cdwDeals.length}`, color: '#E31B23' }
        ];
        
        return {
            bestCase,
            mostLikely,
            worstCase,
            dealsToClose,
            awsForecast,
            cdwForecast,
            directForecast,
            healthMetrics,
            partnerMetrics: {
                awsConversion: awsDeals.length > 0 ? Math.round((awsDeals.filter(d => d.stage === 'deal-won').length / awsDeals.length) * 100) : 0,
                cdwConversion: cdwDeals.length > 0 ? Math.round((cdwDeals.filter(d => d.stage === 'deal-won').length / cdwDeals.length) * 100) : 0,
                topMonth: 'October 2024'
            }
        };
    }

    calculateAnalytics(deals) {
        const stages = DataManager.config.dealStages;
        const stageNames = Object.keys(stages);
        
        // Conversion rates between stages
        const conversionRates = stageNames.map((stage, index) => {
            if (index === 0) return { stage: stages[stage].name, percentage: 100 };
            
            const currentStageDeals = deals.filter(d => d.stage === stage).length;
            const previousStageDeals = deals.filter(d => d.stage === stageNames[index - 1]).length;
            const percentage = previousStageDeals > 0 ? Math.round((currentStageDeals / previousStageDeals) * 100) : 0;
            
            return { stage: stages[stage].name, percentage };
        });
        
        // Deal velocity by referral source
        const referralVelocity = {
            aws: 42,
            cdw: 35,
            direct: 67
        };
        
        // Win rates by referral source
        const awsDeals = deals.filter(deal => deal.referralSource === 'aws');
        const cdwDeals = deals.filter(deal => deal.referralSource === 'cdw');
        const directDeals = deals.filter(deal => !deal.referralSource || deal.referralSource === 'direct');
        
        const referralWinRates = {
            aws: awsDeals.length > 0 ? Math.round((awsDeals.filter(d => d.stage === 'deal-won').length / awsDeals.length) * 100) : 0,
            cdw: cdwDeals.length > 0 ? Math.round((cdwDeals.filter(d => d.stage === 'deal-won').length / cdwDeals.length) * 100) : 0,
            direct: directDeals.length > 0 ? Math.round((directDeals.filter(d => d.stage === 'deal-won').length / directDeals.length) * 100) : 0
        };
        
        // Deal velocity
        const avgDealCycle = 67;
        const fastestDeal = 21;
        const slowestDeal = 180;
        
        // Win/Loss rates
        const closedDeals = deals.filter(deal => ['deal-won', 'deal-lost'].includes(deal.stage));
        const wonDeals = deals.filter(deal => deal.stage === 'deal-won');
        const winRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
        const lossRate = 100 - winRate;
        
        // Referral source performance
        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        const referralPerformance = [
            {
                name: 'AWS Referrals',
                value: awsDeals.reduce((sum, deal) => sum + deal.value, 0),
                deals: awsDeals.length,
                percentage: totalValue > 0 ? Math.round((awsDeals.reduce((sum, deal) => sum + deal.value, 0) / totalValue) * 100) : 0,
                color: '#FF9900',
                winRate: referralWinRates.aws
            },
            {
                name: 'CDW Referrals',
                value: cdwDeals.reduce((sum, deal) => sum + deal.value, 0),
                deals: cdwDeals.length,
                percentage: totalValue > 0 ? Math.round((cdwDeals.reduce((sum, deal) => sum + deal.value, 0) / totalValue) * 100) : 0,
                color: '#E31B23',
                winRate: referralWinRates.cdw
            },
            {
                name: 'Direct Sales',
                value: directDeals.reduce((sum, deal) => sum + deal.value, 0),
                deals: directDeals.length,
                percentage: totalValue > 0 ? Math.round((directDeals.reduce((sum, deal) => sum + deal.value, 0) / totalValue) * 100) : 0,
                color: '#28a745',
                winRate: referralWinRates.direct
            }
        ];
        
        return {
            conversionRates,
            avgDealCycle,
            fastestDeal,
            slowestDeal,
            winRate,
            lossRate,
            referralVelocity,
            referralWinRates,
            referralPerformance
        };
    }

    organizeByMonth(deals) {
        const months = {};
        
        deals.forEach(deal => {
            const closeDate = new Date(deal.closeDate);
            const monthKey = `${closeDate.getFullYear()}-${closeDate.getMonth()}`;
            
            if (!months[monthKey]) {
                months[monthKey] = {
                    monthName: closeDate.toLocaleDateString('en-US', { month: 'long' }),
                    year: closeDate.getFullYear(),
                    deals: [],
                    totalValue: 0
                };
            }
            
            months[monthKey].deals.push(deal);
            months[monthKey].totalValue += deal.value;
        });
        
        return Object.values(months).sort((a, b) => new Date(`${a.monthName} ${a.year}`) - new Date(`${b.monthName} ${b.year}`));
    }

    calculateUrgency(deal) {
        const closeDate = new Date(deal.closeDate);
        const today = new Date();
        const daysUntilClose = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilClose <= 7) return 'high';
        if (daysUntilClose <= 30) return 'medium';
        return 'low';
    }

    getUrgencyText(deal) {
        const closeDate = new Date(deal.closeDate);
        const today = new Date();
        const daysUntilClose = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilClose < 0) return 'Overdue';
        if (daysUntilClose === 0) return 'Due today';
        if (daysUntilClose === 1) return 'Due tomorrow';
        if (daysUntilClose <= 7) return `${daysUntilClose} days left`;
        if (daysUntilClose <= 30) return `${daysUntilClose} days left`;
        return `${Math.ceil(daysUntilClose / 7)} weeks left`;
    }

    updateInsights() {
        const deals = this.getFilteredDeals();
        const stats = this.calculatePipelineStats(deals);
        const referralStats = this.calculateReferralStats(deals);
        
        // Update the insights bar
        const insightCards = document.querySelectorAll('.insight-card .insight-value');
        if (insightCards.length >= 5) {
            insightCards[0].textContent = `${(stats.totalValue / 1000000).toFixed(1)}M`;
            insightCards[1].textContent = `${(stats.weightedValue / 1000000).toFixed(1)}M`;
            insightCards[2].textContent = `${(referralStats.awsValue / 1000000).toFixed(1)}M (${referralStats.awsCount})`;
            insightCards[3].textContent = `${(referralStats.cdwValue / 1000000).toFixed(1)}M (${referralStats.cdwCount})`;
            insightCards[4].textContent = `${(stats.quarterlyForecast / 1000000).toFixed(1)}M`;
        }
    }

    exportPipeline() {
        const deals = this.getFilteredDeals();
        let csv = 'Deal Name,Contact,Company,Stage,Value,Probability,Close Date,Referral Source,Referral Type,Referral Contact,AWS Opportunity ID,Description\n';
        
        deals.forEach(deal => {
            const contact = DataManager.getContactById(deal.contactId);
            const contactName = contact ? contact.name : 'Unknown';
            const company = contact ? contact.company : 'Unknown';
            const stage = DataManager.config.dealStages[deal.stage]?.name || deal.stage;
            const referralContact = deal.referralContactId ? DataManager.getContactById(deal.referralContactId) : null;
            const referralContactName = referralContact ? referralContact.name : '';
            
            csv += `"${deal.name}","${contactName}","${company}","${stage}",${deal.value},${deal.probability},"${deal.closeDate}","${deal.referralSource || 'direct'}","${deal.referralType || ''}","${referralContactName}","${deal.awsOpportunityId || ''}","${deal.description || ''}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pipeline-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        UIHelpers.showNotification('Pipeline exported successfully', 'success');
    }
}

// Create global instance
const pipelineModule = new PipelineModule();
console.log('✅ Enhanced Pipeline module with AWS & CDW referral tracking loaded successfully');// Enhanced Pipeline Management Module - Enterprise-Grade Features with AWS & CDW Referral Tracking
class PipelineModule {
    constructor() {
        this.currentView = 'kanban';
        this.selectedTimeframe = 'current-quarter';
        this.selectedTeam = 'all';
        this.draggedDeal = null;
        this.filters = {
            team: 'all',
            owner: 'all',
            value: 'all',
            closeDate: 'all',
            stage: 'all',
            referralSource: 'all'  // New referral filter
        };
        this.sortBy = 'closeDate';
        this.sortOrder = 'asc';
    }

    init() {
        console.log('Pipeline module initialized with referral tracking');
        
        // Listen for data changes
        DataManager.on('deal:updated', () => this.renderIfActive());
        DataManager.on('deal:deleted', () => this.renderIfActive());
        DataManager.on('deal:added', () => this.renderIfActive());
        DataManager.on('data:loaded', () => this.renderIfActive());
    }

    render(container) {
        container.innerHTML = this.getHTML();
        this.setupEventListeners();
        this.renderContent();
    }

    renderIfActive() {
        if (AppController.currentTab === 'pipeline') {
            const container = document.getElementById('content-area');
            if (container) {
                this.render(container);
            }
        }
    }

    getHTML() {
        const deals = this.getFilteredDeals();
        const pipelineStats = this.calculatePipelineStats(deals);
        const referralStats = this.calculateReferralStats(deals);

        return `
            <div class="pipeline-container">
                <div class="pipeline-header">
                    <div>
                        <h2>🚀 Pipeline Management</h2>
                        <p>Complete deal lifecycle • ${(pipelineStats.totalValue / 1000000).toFixed(1)}M total • ${pipelineStats.totalDeals} active deals • ${referralStats.awsPercentage}% AWS • ${referralStats.cdwPercentage}% CDW</p>
                    </div>
                    <div class="pipeline-controls">
                        <button class="view-btn ${this.currentView === 'kanban' ? 'active' : ''}" onclick="pipelineModule.switchView('kanban')">
                            📋 Kanban Board
                        </button>
                        <button class="view-btn ${this.currentView === 'table' ? 'active' : ''}" onclick="pipelineModule.switchView('table')">
                            📊 Table View
                        </button>
                        <button class="view-btn ${this.currentView === 'forecast' ? 'active' : ''}" onclick="pipelineModule.switchView('forecast')">
                            📈 Forecast
                        </button>
                        <button class="view-btn ${this.currentView === 'analytics' ? 'active' : ''}" onclick="pipelineModule.switchView('analytics')">
                            📉 Analytics
                        </button>
                        <button class="view-btn ${this.currentView === 'timeline' ? 'active' : ''}" onclick="pipelineModule.switchView('timeline')">
                            📅 Timeline
                        </button>
                        <button class="view-btn ${this.currentView === 'referrals' ? 'active' : ''}" onclick="pipelineModule.switchView('referrals')">
                            🤝 Referral Analysis
                        </button>
                        <button class="action-btn" onclick="pipelineModule.showDealForm()">
                            + Add Deal
                        </button>
                        <button class="action-btn secondary" onclick="pipelineModule.exportPipeline()">
                            📥 Export
                        </button>
                    </div>
                </div>

                <div class="pipeline-filters">
                    <div class="filter-group">
                        <label>Team:</label>
                        <select id="teamFilter" onchange="pipelineModule.updateFilter('team', this.value)">
                            <option value="all">All Teams</option>
                            ${this.getTeamOptions()}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Timeframe:</label>
                        <select id="timeframeFilter" onchange="pipelineModule.updateTimeframe(this.value)">
                            <option value="current-quarter" ${this.selectedTimeframe === 'current-quarter' ? 'selected' : ''}>Current Quarter</option>
                            <option value="next-quarter" ${this.selectedTimeframe === 'next-quarter' ? 'selected' : ''}>Next Quarter</option>
                            <option value="this-year" ${this.selectedTimeframe === 'this-year' ? 'selected' : ''}>This Year</option>
                            <option value="all" ${this.selectedTimeframe === 'all' ? 'selected' : ''}>All Time</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Deal Size:</label>
                        <select id="valueFilter" onchange="pipelineModule.updateFilter('value', this.value)">
                            <option value="all">All Sizes</option>
                            <option value="enterprise">$500K+ (Enterprise)</option>
                            <option value="large">$100K-$500K (Large)</option>
                            <option value="medium">$25K-$100K (Medium)</option>
                            <option value="small">Under $25K (Small)</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Referral Source:</label>
                        <select id="referralSourceFilter" onchange="pipelineModule.updateFilter('referralSource', this.value)">
                            <option value="all">All Sources</option>
                            <option value="aws">AWS Referrals</option>
                            <option value="cdw">CDW Referrals</option>
                            <option value="direct">Direct Sales</option>
                            <option value="other">Other Partners</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Stage:</label>
                        <select id="stageFilter" onchange="pipelineModule.updateFilter('stage', this.value)">
                            <option value="all">All Stages</option>
                            ${this.getStageOptions()}
                        </select>
                    </div>
                    <div class="filter-group">
                        <button class="action-btn secondary" onclick="pipelineModule.resetFilters()">Reset Filters</button>
                    </div>
                </div>

                <div class="pipeline-insights">
                    <div class="insight-card">
                        <span class="insight-label">Total Pipeline</span>
                        <span class="insight-value">${(pipelineStats.totalValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">Weighted Pipeline</span>
                        <span class="insight-value">${(pipelineStats.weightedValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">AWS Referrals</span>
                        <span class="insight-value">${(referralStats.awsValue / 1000000).toFixed(1)}M (${referralStats.awsCount})</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">CDW Referrals</span>
                        <span class="insight-value">${(referralStats.cdwValue / 1000000).toFixed(1)}M (${referralStats.cdwCount})</span>
                    </div>
                    <div class="insight-card">
                        <span class="insight-label">This Quarter</span>
                        <span class="insight-value">${(pipelineStats.quarterlyForecast / 1000000).toFixed(1)}M</span>
                    </div>
                </div>

                <div id="pipelineContent">
                    <!-- Pipeline content will be populated here -->
                </div>

                <!-- Deal Form Modal -->
                <div id="dealFormModal" class="modal" style="display: none;">
                    <div class="modal-content" style="max-width: 1000px;">
                        <span class="close" onclick="UIHelpers.closeModal('dealFormModal')">&times;</span>
                        <div id="dealFormContent">
                            <!-- Deal form will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Deal Quick Edit Modal -->
                <div id="dealQuickEditModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <span class="close" onclick="UIHelpers.closeModal('dealQuickEditModal')">&times;</span>
                        <div id="dealQuickEditContent">
                            <!-- Quick edit form will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .pipeline-container {
                    max-width: 100%;
                    overflow-x: auto;
                }
                .pipeline-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .pipeline-header h2 {
                    margin: 0;
                    color: #232F3E;
                    font-size: 1.8em;
                }
                .pipeline-header p {
                    margin: 5px 0 0 0;
                    color: #666;
                }
                .pipeline-controls {
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
                .action-btn.danger {
                    background: #dc3545;
                }
                .action-btn.danger:hover {
                    background: #c82333;
                }
                .pipeline-filters {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    padding: 15px 20px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .filter-group label {
                    font-weight: 500;
                    color: #232F3E;
                    font-size: 0.9em;
                }
                .filter-group select {
                    padding: 6px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9em;
                    background: white;
                }
                .pipeline-insights {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    color: white;
                }
                .insight-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .insight-label {
                    font-size: 0.9em;
                    opacity: 0.9;
                    margin-bottom: 5px;
                }
                .insight-value {
                    font-size: 1.4em;
                    font-weight: bold;
                }

                /* Referral badges */
                .referral-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 0.7em;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .referral-aws {
                    background: #FF9900;
                    color: white;
                }
                .referral-cdw {
                    background: #E31B23;
                    color: white;
                }
                .referral-direct {
                    background: #28a745;
                    color: white;
                }
                .referral-other {
                    background: #6c757d;
                    color: white;
                }

                /* Kanban Board Styles */
                .kanban-board {
                    display: flex;
                    gap: 20px;
                    overflow-x: auto;
                    padding-bottom: 20px;
                    min-height: 600px;
                }
                .kanban-column {
                    flex: 0 0 300px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 15px;
                    border: 2px dashed transparent;
                    transition: all 0.3s ease;
                }
                .kanban-column.drag-over {
                    border-color: #FF9900;
                    background: #fff8f0;
                }
                .column-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #dee2e6;
                }
                .column-title {
                    font-weight: bold;
                    color: #232F3E;
                    font-size: 1.1em;
                }
                .column-stats {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    font-size: 0.8em;
                    color: #666;
                }
                .deal-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    min-height: 400px;
                }
                .deal-card {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: grab;
                    transition: all 0.3s ease;
                    border-left: 4px solid #FF9900;
                    position: relative;
                }
                .deal-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }
                .deal-card:active {
                    cursor: grabbing;
                }
                .deal-card.dragging {
                    opacity: 0.5;
                    transform: rotate(5deg);
                }
                .deal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                .deal-name {
                    font-weight: bold;
                    color: #232F3E;
                    font-size: 0.95em;
                    line-height: 1.3;
                    margin: 0;
                }
                .deal-value {
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: bold;
                }
                .deal-info {
                    margin-bottom: 10px;
                }
                .deal-contact {
                    font-size: 0.85em;
                    color: #666;
                    margin-bottom: 4px;
                }
                .deal-close-date {
                    font-size: 0.8em;
                    color: #666;
                    margin-bottom: 8px;
                }
                .deal-probability {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .probability-bar {
                    flex: 1;
                    height: 4px;
                    background: #e9ecef;
                    border-radius: 2px;
                    overflow: hidden;
                }
                .probability-fill {
                    height: 100%;
                    background: #28a745;
                    transition: width 0.3s ease;
                }
                .probability-text {
                    font-size: 0.8em;
                    font-weight: bold;
                    color: #666;
                }
                .deal-actions {
                    display: flex;
                    gap: 5px;
                    margin-top: 10px;
                }
                .deal-action-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75em;
                    transition: all 0.3s ease;
                }
                .deal-action-btn:hover {
                    background: #e9ecef;
                }
                .deal-urgency {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid white;
                }
                .urgency-high { background: #dc3545; }
                .urgency-medium { background: #ffc107; }
                .urgency-low { background: #28a745; }

                /* Table View Styles */
                .deals-table-container {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    overflow-x: auto;
                }
                .deals-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                .deals-table th {
                    background: #232F3E;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-size: 0.9em;
                    cursor: pointer;
                    position: relative;
                }
                .deals-table th:hover {
                    background: #1a252f;
                }
                .deals-table th.sortable::after {
                    content: ' ⇅';
                    opacity: 0.5;
                }
                .deals-table th.sorted-asc::after {
                    content: ' ▲';
                    opacity: 1;
                }
                .deals-table th.sorted-desc::after {
                    content: ' ▼';
                    opacity: 1;
                }
                .deals-table td {
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                    font-size: 0.9em;
                }
                .deals-table tbody tr {
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                .deals-table tbody tr:hover {
                    background: #f8f9fa;
                }
                .deal-name-cell {
                    font-weight: bold;
                    color: #232F3E;
                }
                .deal-value-cell {
                    font-weight: bold;
                    color: #28a745;
                }
                .deal-stage-cell {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: bold;
                    color: white;
                    text-align: center;
                    display: inline-block;
                }
                .stage-prequalified { background: #6c757d; }
                .stage-qualified { background: #17a2b8; }
                .stage-proposal-development { background: #007bff; }
                .stage-proposal-delivered { background: #6610f2; }
                .stage-legal { background: #e83e8c; }
                .stage-out-for-signature { background: #fd7e14; }
                .stage-signed { background: #20c997; }
                .stage-deal-won { background: #28a745; }
                .stage-deal-lost { background: #dc3545; }
                .probability-cell {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .probability-bar-small {
                    flex: 1;
                    height: 4px;
                    background: #e9ecef;
                    border-radius: 2px;
                    overflow: hidden;
                }
                .probability-fill-small {
                    height: 100%;
                    background: #28a745;
                    transition: width 0.3s ease;
                }
                .table-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .table-info {
                    color: #666;
                    font-size: 0.9em;
                }
                .table-actions {
                    display: flex;
                    gap: 10px;
                }
                .table-action-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75em;
                    transition: all 0.3s ease;
                }
                .table-action-btn:hover {
                    background: #e9ecef;
                }

                /* Referral Analysis Styles */
                .referral-analysis {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }
                .referral-card {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }
                .referral-metrics {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .metric-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    text-align: center;
                }
                .metric-value {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .metric-label {
                    color: #666;
                    font-size: 0.9em;
                }
                .aws-metric .metric-value { color: #FF9900; }
                .cdw-metric .metric-value { color: #E31B23; }

                /* Form Styles */
                .deal-form {
                    display: grid;
                    gap: 20px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .form-row-triple {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                }
                .form-group label {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #232F3E;
                }
                .form-group input,
                .form-group select,
                .form-group textarea {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .form-group textarea {
                    height: 80px;
                    resize: vertical;
                }
                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #FF9900;
                    box-shadow: 0 0 0 2px rgba(255, 153, 0, 0.2);
                }
                .referral-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #FF9900;
                }
                .referral-section h4 {
                    margin: 0 0 15px 0;
                    color: #232F3E;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* Forecast and Analytics Views */
                .forecast-view {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                }
                .forecast-card {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }
                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }
                .analytics-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .timeline-view {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
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
                .close:hover { color: #000; }
            </style>
        `;
    }

    setupEventListeners() {
        // Event listeners will be set up through onclick handlers
    }

    switchView(view) {
        this.currentView = view;
        this.renderContent();
    }

    updateFilter(filterType, value) {
        this.filters[filterType] = value;
        this.renderContent();
    }

    updateTimeframe(timeframe) {
        this.selectedTimeframe = timeframe;
        this.renderContent();
    }

    resetFilters() {
        this.filters = {
            team: 'all',
            owner: 'all',
            value: 'all',
            closeDate: 'all',
            stage: 'all',
            referralSource: 'all'
        };
        this.selectedTimeframe = 'current-quarter';
        
        // Reset filter controls
        document.getElementById('teamFilter').value = 'all';
        document.getElementById('timeframeFilter').value = 'current-quarter';
        document.getElementById('valueFilter').value = 'all';
        document.getElementById('stageFilter').value = 'all';
        document.getElementById('referralSourceFilter').value = 'all';
        
        this.renderContent();
    }

    renderContent() {
        const container = document.getElementById('pipelineContent');
        if (!container) return;

        switch(this.currentView) {
            case 'kanban':
                this.renderKanbanBoard(container);
                break;
            case 'table':
                this.renderTableView(container);
                break;
            case 'forecast':
                this.renderForecastView(container);
                break;
            case 'analytics':
                this.renderAnalyticsView(container);
                break;
            case 'timeline':
                this.renderTimelineView(container);
                break;
            case 'referrals':
                this.renderReferralAnalysisView(container);
                break;
        }

        this.updateInsights();
    }

    renderKanbanBoard(container) {
        const dealStages = DataManager.config.dealStages;
        const deals = this.getFilteredDeals();
        
        // Group deals by stage
        const dealsByStage = {};
        Object.keys(dealStages).forEach(stage => {
            dealsByStage[stage] = deals.filter(deal => deal.stage === stage);
        });

        const kanbanHTML = Object.keys(dealStages).map(stageId => {
            const stage = dealStages[stageId];
            const stageDeals = dealsByStage[stageId] || [];
            const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
            const weightedValue = stageDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);

            return `
                <div class="kanban-column" 
                     data-stage="${stageId}"
                     ondrop="pipelineModule.handleDrop(event)"
                     ondragover="pipelineModule.handleDragOver(event)"
                     ondragleave="pipelineModule.handleDragLeave(event)">
                    <div class="column-header">
                        <div class="column-title">${stage.name}</div>
                        <div class="column-stats">
                            <div>${stageDeals.length} deals</div>
                            <div>${(stageValue / 1000).toFixed(0)}K total</div>
                            <div>${(weightedValue / 1000).toFixed(0)}K weighted</div>
                        </div>
                    </div>
                    <div class="deal-cards">
                        ${stageDeals.map(deal => this.renderDealCard(deal)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="kanban-board">
                ${kanbanHTML}
            </div>
        `;

        // Set up drag and drop
        this.setupDragAndDrop();
    }

    renderDealCard(deal) {
        const contact = DataManager.getContactById(deal.contactId);
        const contactName = contact ? contact.name : 'Unknown Contact';
        const company = contact ? contact.company : 'Unknown Company';
        const urgency = this.calculateUrgency(deal);
        const referralBadge = this.getReferralBadge(deal);
        
        return `
            <div class="deal-card stage-${deal.stage}" 
                 draggable="true" 
                 data-deal-id="${deal.id}"
                 ondragstart="pipelineModule.handleDragStart(event)">
                <div class="deal-urgency urgency-${urgency}"></div>
                ${referralBadge}
                <div class="deal-header">
                    <h4 class="deal-name">${deal.name}</h4>
                    <span class="deal-value">${(deal.value / 1000).toFixed(0)}K</span>
                </div>
                <div class="deal-info">
                    <div class="deal-contact">${contactName} • ${company}</div>
                    <div class="deal-close-date">Close: ${UIHelpers.formatDate(deal.closeDate)}</div>
                    ${this.getReferralDetails(deal)}
                </div>
                <div class="deal-probability">
                    <div class="probability-bar">
                        <div class="probability-fill" style="width: ${deal.probability}%;"></div>
                    </div>
                    <span class="probability-text">${deal.probability}%</span>
                </div>
                <div class="deal-actions">
                    <button class="deal-action-btn" onclick="event.stopPropagation(); pipelineModule.quickEditDeal('${deal.id}')">Edit</button>
                    <button class="deal-action-btn" onclick="event.stopPropagation(); pipelineModule.editDeal('${deal.id}')">Details</button>
                    <button class="deal-action-btn" onclick="event.stopPropagation(); pipelineModule.logActivity('${deal.id}')">Activity</button>
                </div>
            </div>
        `;
    }

    renderTableView(container) {
        const deals = this.getFilteredDeals();
        const sortedDeals = this.sortDeals(deals);
        
        container.innerHTML = `
            <div class="deals-table-container">
                <div class="table-controls">
                    <div class="table-info">
                        Showing ${sortedDeals.length} deals
                    </div>
                    <div class="table-actions">
                        <button class="action-btn" onclick="pipelineModule.showDealForm()">+ Add Deal</button>
                        <button class="action-btn secondary" onclick="pipelineModule.bulkEditDeals()">Bulk Edit</button>
                    </div>
                </div>
                
                <table class="deals-table">
                    <thead>
                        <tr>
                            <th class="sortable" onclick="pipelineModule.sortTable('name')">Deal Name</th>
                            <th class="sortable" onclick="pipelineModule.sortTable('contact')">Contact</th>
                            <th class="sortable" onclick="pipelineModule.sortTable('value')">Value</th>
                            <th class="sortable" onclick="pipelineModule.sortTable('stage')">Stage</th>
                            <th class="sortable" onclick="pipelineModule.sortTable('probability')">Probability</th>
                            <th class="sortable" onclick="pipelineModule.sortTable('referralSource')">Referral Source</th>
                            <th class="sortable" onclick="pipelineModule.sortTable('closeDate')">Close Date</th>
                            <th class="sortable" onclick="pipelineModule.sortTable('createdAt')">Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedDeals.map(deal => this.renderTableRow(deal)).join('')}
                    </tbody>
                </table>
                
                ${sortedDeals.length === 0 ? `
                    <div style="text-align: center; padding: 60px; color: #666;">
                        <h3>No deals found</h3>
                        <p>Try adjusting your filters or add a new deal to get started.</p>
                        <button class="action-btn" onclick="pipelineModule.showDealForm()">+ Add First Deal</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Update sort indicators
        this.updateSortIndicators();
    }

    renderTableRow(deal) {
        const contact = DataManager.getContactById(deal.contactId);
        const contactName = contact ? contact.name : 'Unknown Contact';
        const company = contact ? contact.company : 'Unknown Company';
        const stage = DataManager.config.dealStages[deal.stage];
        const urgency = this.calculateUrgency(deal);
        const referralBadge = this.getReferralBadge(deal);
        
        return `
            <tr onclick="pipelineModule.editDeal('${deal.id}')" data-deal-id="${deal.id}">
                <td class="deal-name-cell">${deal.name}</td>
                <td>
                    <div><strong>${contactName}</strong></div>
                    <div style="font-size: 0.8em; color: #666;">${company}</div>
                </td>
                <td class="deal-value-cell">${(deal.value / 1000).toFixed(0)}K</td>
                <td>
                    <span class="deal-stage-cell stage-${deal.stage}">
                        ${stage ? stage.name : deal.stage}
                    </span>
                </td>
                <td class="probability-cell">
                    <div class="probability-bar-small">
                        <div class="probability-fill-small" style="width: ${deal.probability}%;"></div>
                    </div>
                    <span>${deal.probability}%</span>
                </td>
                <td>
                    ${referralBadge}
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                        ${this.getReferralContactName(deal)}
                    </div>
                </td>
                <td>
                    <div>${UIHelpers.formatDate(deal.closeDate)}</div>
                    <div style="font-size: 0.8em; color: ${urgency === 'high' ? '#dc3545' : urgency === 'medium' ? '#ffc107' : '#28a745'};">
                        ${this.getUrgencyText(deal)}
                    </div>
                </td>
                <td>${UIHelpers.formatDate(deal.createdAt)}</td>
                <td onclick="event.stopPropagation()">
                    <button class="table-action-btn" onclick="pipelineModule.editDeal('${deal.id}')">Edit</button>
                    <button class="table-action-btn" onclick="pipelineModule.cloneDeal('${deal.id}')">Clone</button>
                    <button class="table-action-btn" onclick="pipelineModule.deleteDeal('${deal.id}')">Delete</button>
                </td>
            </tr>
        `;
    }

    renderReferralAnalysisView(container) {
        const deals = this.getFilteredDeals();
        const referralAnalytics = this.calculateReferralAnalytics(deals);
        
        container.innerHTML = `
            <div class="referral-metrics">
                <div class="metric-card aws-metric">
                    <div class="metric-value">${(referralAnalytics.aws.totalValue / 1000000).toFixed(1)}M</div>
                    <div class="metric-label">AWS Referral Value</div>
                </div>
                <div class="metric-card cdw-metric">
                    <div class="metric-value">${(referralAnalytics.cdw.totalValue / 1000000).toFixed(1)}M</div>
                    <div class="metric-label">CDW Referral Value</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${referralAnalytics.aws.conversionRate}%</div>
                    <div class="metric-label">AWS Conversion Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${referralAnalytics.cdw.conversionRate}%</div>
                    <div class="metric-label">CDW Conversion Rate</div>
                </div>
            </div>
            
            <div class="referral-analysis">
                <div class="referral-card">
                    <h3>🛒 AWS Referral Performance</h3>
                    <div style="margin-top: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div style="text-align: center; padding: 15px; background: #fff8f0; border-radius: 8px;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #FF9900;">${referralAnalytics.aws.count}</div>
                                <div style="color: #666;">Total Deals</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">${referralAnalytics.aws.wonCount}</div>
                                <div style="color: #666;">Won Deals</div>
                            </div>
                        </div>
                        <h4>Top AWS Teams:</h4>
                        <div style="margin-top: 10px;">
                            ${referralAnalytics.aws.topTeams.map(team => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <span>${team.name}</span>
                                    <span style="font-weight: bold;">${(team.value / 1000).toFixed(0)}K (${team.count} deals)</span>
                                </div>
                            `).join('')}
                        </div>
                        <h4 style="margin-top: 20px;">AWS Referral Trends:</h4>
                        <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div>Average Deal Size: <strong>${(referralAnalytics.aws.avgDealSize / 1000).toFixed(0)}K</strong></div>
                            <div>Average Sales Cycle: <strong>${referralAnalytics.aws.avgCycle} days</strong></div>
                            <div>Best Performing Stage: <strong>${referralAnalytics.aws.bestStage}</strong></div>
                        </div>
                    </div>
                </div>
                
                <div class="referral-card">
                    <h3>🏢 CDW Referral Performance</h3>
                    <div style="margin-top: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div style="text-align: center; padding: 15px; background: #fff0f0; border-radius: 8px;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #E31B23;">${referralAnalytics.cdw.count}</div>
                                <div style="color: #666;">Total Deals</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                                <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">${referralAnalytics.cdw.wonCount}</div>
                                <div style="color: #666;">Won Deals</div>
                            </div>
                        </div>
                        <h4>CDW Contact Performance:</h4>
                        <div style="margin-top: 10px;">
                            ${referralAnalytics.cdw.topContacts.map(contact => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <span>${contact.name}</span>
                                    <span style="font-weight: bold;">${(contact.value / 1000).toFixed(0)}K (${contact.count} deals)</span>
                                </div>
                            `).join('')}
                        </div>
                        <h4 style="margin-top: 20px;">CDW Referral Trends:</h4>
                        <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div>Average Deal Size: <strong>${(referralAnalytics.cdw.avgDealSize / 1000).toFixed(0)}K</strong></div>
                            <div>Average Sales Cycle: <strong>${referralAnalytics.cdw.avgCycle} days</strong></div>
                            <div>Best Performing Stage: <strong>${referralAnalytics.cdw.bestStage}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-top: 30px;">
                <h3>📊 Referral Source Comparison</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 1.2em; font-weight: bold; color: #FF9900;">AWS</div>
                        <div style="font-size: 2em; font-weight: bold; margin: 10px 0;">${referralAnalytics.comparison.aws.percentage}%</div>
                        <div style="color: #666;">of Total Pipeline</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 1.2em; font-weight: bold; color: #E31B23;">CDW</div>
                        <div style="font-size: 2em; font-weight: bold; margin: 10px 0;">${referralAnalytics.comparison.cdw.percentage}%</div>
                        <div style="color: #666;">of Total Pipeline</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 1.2em; font-weight: bold; color: #28a745;">Direct</div>
                        <div style="font-size: 2em; font-weight: bold; margin: 10px 0;">${referralAnalytics.comparison.direct.percentage}%</div>
                        <div style="color: #666;">of Total Pipeline</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 1.2em; font-weight: bold; color: #6c757d;">Other</div>
                        <div style="font-size: 2em; font-weight: bold; margin: 10px 0;">${referralAnalytics.comparison.other.percentage}%</div>
                        <div style="color: #666;">of Total Pipeline</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Existing methods continue...
    renderForecastView(container) {
        const deals = this.getFilteredDeals();
        const forecastData = this.calculateForecastData(deals);
        
        container.innerHTML = `
            <div class="forecast-view">
                <div class="forecast-card">
                    <h3>Quarterly Forecast</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                            <div style="font-size: 1.8em; font-weight: bold; color: #1565c0;">${(forecastData.bestCase / 1000000).toFixed(1)}M</div>
                            <div style="color: #666;">Best Case</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 8px;">
                            <div style="font-size: 1.8em; font-weight: bold; color: #2e7d32;">${(forecastData.mostLikely / 1000000).toFixed(1)}M</div>
                            <div style="color: #666;">Most Likely</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #fff3e0; border-radius: 8px;">
                            <div style="font-size: 1.8em; font-weight: bold; color: #ef6c00;">${(forecastData.worstCase / 1000000).toFixed(1)}M</div>
                            <div style="color: #666;">Worst Case</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #fce4ec; border-radius: 8px;">
                            <div style="font-size: 1.8em; font-weight: bold; color: #c2185b;">${forecastData.dealsToClose}</div>
                            <div style="color: #666;">Deals to Close</div>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <h4>Referral Source Breakdown:</h4>
                        <div style="margin-top: 10px;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                <span>AWS Referrals:</span>
                                <span style="font-weight: bold; color: #FF9900;">${(forecastData.awsForecast / 1000000).toFixed(1)}M</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                <span>CDW Referrals:</span>
                                <span style="font-weight: bold; color: #E31B23;">${(forecastData.cdwForecast / 1000000).toFixed(1)}M</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                <span>Direct Sales:</span>
                                <span style="font-weight: bold; color: #28a745;">${(forecastData.directForecast / 1000000).toFixed(1)}M</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="forecast-card">
                    <h3>Pipeline Health</h3>
                    <div style="margin-bottom: 20px;">
                        ${forecastData.healthMetrics.map(metric => `
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                                <span>${metric.name}</span>
                                <span style="font-weight: bold; color: ${metric.color};">${metric.value}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 20px;">
                        <h4>Partner Performance:</h4>
                        <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div>AWS Conversion Rate: <strong>${forecastData.partnerMetrics.awsConversion}%</strong></div>
                            <div>CDW Conversion Rate: <strong>${forecastData.partnerMetrics.cdwConversion}%</strong></div>
                            <div>Top Referral Month: <strong>${forecastData.partnerMetrics.topMonth}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
