// Data Manager - Centralized data handling and storage with Referral Tracking
const DataManager = {
    data: {
        teams: {},
        contacts: {},
        deals: [],
        touchpoints: [],
        tasks: [],
        relationships: [],
        teamMembers: {},
        settings: {}
    },
    
    eventListeners: {},
    
    config: {
        dealStages: {
            'prequalified': { name: 'Prequalified', probability: 10 },
            'qualified': { name: 'Qualified', probability: 25 },
            'proposal-development': { name: 'Proposal Development', probability: 40 },
            'proposal-delivered': { name: 'Proposal Delivered', probability: 60 },
            'legal': { name: 'Legal Review', probability: 75 },
            'out-for-signature': { name: 'Out for Signature', probability: 90 },
            'signed': { name: 'Signed', probability: 95 },
            'deal-won': { name: 'Deal Won', probability: 100 },
            'deal-lost': { name: 'Deal Lost', probability: 0 }
        }
    },

    init() {
        console.log('DataManager initializing...');
        this.loadFromStorage();
        this.setupAutoSave();
    },

    // Event system for inter-module communication
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    },

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    },

    // Storage methods
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('aws-partner-tracker-data');
            if (stored) {
                this.data = { ...this.data, ...JSON.parse(stored) };
                console.log('Data loaded from storage');
            }
        } catch (error) {
            console.error('Error loading data from storage:', error);
        }
        this.emit('data:loaded');
    },

    saveToStorage() {
        try {
            localStorage.setItem('aws-partner-tracker-data', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data to storage:', error);
        }
    },

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveToStorage();
        }, 30000);
    },

    // Team Members methods
    getTeamMembers() {
        return this.data.teamMembers || {};
    },

    getTeamMember(teamId, memberId) {
        const teamMembers = this.getTeamMembers();
        const members = teamMembers[teamId] || [];
        return members.find(member => member.id === memberId);
    },

    addTeamMember(teamId, member) {
        if (!this.data.teamMembers) this.data.teamMembers = {};
        if (!this.data.teamMembers[teamId]) this.data.teamMembers[teamId] = [];
        
        member.id = member.id || this.generateId();
        member.addedAt = new Date().toISOString();
        this.data.teamMembers[teamId].push(member);
        this.emit('team-member:added', member);
        this.saveToStorage();
    },

    updateTeamMember(teamId, updatedMember) {
        const teamMembers = this.getTeamMembers();
        const members = teamMembers[teamId] || [];
        const index = members.findIndex(m => m.id === updatedMember.id);
        if (index >= 0) {
            members[index] = { ...members[index], ...updatedMember };
            this.emit('team-member:updated', members[index]);
            this.saveToStorage();
        }
    },

    removeTeamMember(teamId, memberId) {
        const teamMembers = this.getTeamMembers();
        const members = teamMembers[teamId] || [];
        const index = members.findIndex(m => m.id === memberId);
        if (index >= 0) {
            members.splice(index, 1);
            this.emit('team-member:removed', memberId);
            this.saveToStorage();
        }
    },

    // Teams methods
    getTeams() {
        return this.data.teams;
    },

    addTeam(team) {
        team.id = team.id || this.generateId();
        this.data.teams[team.id] = team;
        this.saveToStorage();
        this.emit('team:added', team);
    },

    updateTeam(updatedTeam) {
        if (this.data.teams[updatedTeam.id]) {
            this.data.teams[updatedTeam.id] = { ...this.data.teams[updatedTeam.id], ...updatedTeam };
            this.emit('team:updated', updatedTeam);
            this.saveToStorage();
        }
    },

    deleteTeam(teamId) {
        if (this.data.teams[teamId]) {
            delete this.data.teams[teamId];
            this.emit('team:deleted', teamId);
            this.saveToStorage();
        }
    },

    transferTeamData(fromTeamId, toTeamId) {
        // Transfer team members
        const fromMembers = this.data.teamMembers[fromTeamId] || [];
        if (!this.data.teamMembers[toTeamId]) this.data.teamMembers[toTeamId] = [];
        this.data.teamMembers[toTeamId].push(...fromMembers);
        delete this.data.teamMembers[fromTeamId];
        
        // Transfer contacts
        const fromContacts = this.data.contacts[fromTeamId] || [];
        if (!this.data.contacts[toTeamId]) this.data.contacts[toTeamId] = [];
        this.data.contacts[toTeamId].push(...fromContacts);
        delete this.data.contacts[fromTeamId];
        
        this.emit('team:data-transferred', { fromTeamId, toTeamId });
        this.saveToStorage();
    },

    transferTeamMembers(fromTeamId, toTeamId, memberIds, includeContacts = false) {
        const fromMembers = this.data.teamMembers[fromTeamId] || [];
        const toTransfer = fromMembers.filter(member => memberIds.includes(member.id));
        
        // Add members to destination team
        if (!this.data.teamMembers[toTeamId]) this.data.teamMembers[toTeamId] = [];
        this.data.teamMembers[toTeamId].push(...toTransfer);
        
        // Remove members from source team
        this.data.teamMembers[fromTeamId] = fromMembers.filter(member => !memberIds.includes(member.id));
        
        // If transferring contacts, move related contacts too
        if (includeContacts) {
            const fromContacts = this.data.contacts[fromTeamId] || [];
            const contactsToTransfer = fromContacts.splice(0, Math.ceil(fromContacts.length * (toTransfer.length / (fromMembers.length + toTransfer.length))));
            
            if (!this.data.contacts[toTeamId]) this.data.contacts[toTeamId] = [];
            this.data.contacts[toTeamId].push(...contactsToTransfer);
        }
        
        this.emit('team:members-transferred', { fromTeamId, toTeamId, memberIds });
        this.saveToStorage();
    },

    // Contacts methods
    getContacts() {
        return this.data.contacts;
    },

    getContactsByTeam(teamId) {
        return this.data.contacts[teamId] || [];
    },

    getAllContacts() {
        const allContacts = [];
        Object.keys(this.data.contacts || {}).forEach(teamId => {
            const teamContacts = this.data.contacts[teamId] || [];
            allContacts.push(...teamContacts);
        });
        return allContacts;
    },

    getContactById(contactId) {
        const allContacts = this.getAllContacts();
        return allContacts.find(contact => contact.id === contactId);
    },

    getContactName(contactId) {
        const contact = this.getContactById(contactId);
        return contact ? contact.name : 'Unknown Contact';
    },

    addContact(teamId, contact) {
        if (!this.data.contacts[teamId]) {
            this.data.contacts[teamId] = [];
        }
        contact.id = contact.id || this.generateId();
        contact.createdAt = new Date().toISOString();
        this.data.contacts[teamId].push(contact);
        this.emit('contact:added', contact);
        this.saveToStorage();
    },

    updateContact(teamId, contactId, updates) {
        const teamContacts = this.data.contacts[teamId] || [];
        const index = teamContacts.findIndex(c => c.id === contactId);
        if (index >= 0) {
            teamContacts[index] = { ...teamContacts[index], ...updates };
            this.emit('contact:updated', teamContacts[index]);
            this.saveToStorage();
        }
    },

    deleteContact(teamId, contactId) {
        const teamContacts = this.data.contacts[teamId] || [];
        const index = teamContacts.findIndex(c => c.id === contactId);
        if (index >= 0) {
            teamContacts.splice(index, 1);
            this.emit('contact:deleted', contactId);
            this.saveToStorage();
        }
    },

    // Enhanced Deals methods with Referral Tracking
    getDeals() {
        return this.data.deals || [];
    },

    // Alias for pipeline compatibility
    getPipelineEntries() {
        return this.getDeals();
    },

    addDeal(deal) {
        if (!this.data.deals) this.data.deals = [];
        deal.id = deal.id || this.generateId();
        deal.createdAt = new Date().toISOString();
        
        // Referral tracking fields - add these to every deal
        deal.referralSource = deal.referralSource || null; // Contact ID who referred
        deal.referralTeam = deal.referralTeam || null; // Team ID that referred
        deal.referralType = deal.referralType || 'direct'; // 'direct', 'warm_intro', 'event', 'cold'
        deal.referralNotes = deal.referralNotes || ''; // How the referral happened
        deal.referralDate = deal.referralDate || deal.createdAt; // When referral was made
        
        this.data.deals.push(deal);
        this.emit('deal:added', deal);
        this.saveToStorage();
    },

    // Alias for pipeline compatibility
    addPipelineEntry(deal) {
        return this.addDeal(deal);
    },

    updateDeal(updatedDeal) {
        const deals = this.getDeals();
        const index = deals.findIndex(d => d.id === updatedDeal.id);
        if (index >= 0) {
            deals[index] = { ...deals[index], ...updatedDeal };
            this.emit('deal:updated', deals[index]);
            this.saveToStorage();
        }
    },

    deleteDeal(dealId) {
        if (!this.data.deals) return;
        const index = this.data.deals.findIndex(d => d.id === dealId);
        if (index >= 0) {
            this.data.deals.splice(index, 1);
            this.emit('deal:deleted', dealId);
            this.saveToStorage();
        }
    },

    // Referral tracking methods
    getDealsByReferralSource(contactId) {
        return this.getDeals().filter(deal => deal.referralSource === contactId);
    },

    getDealsByReferralTeam(teamId) {
        return this.getDeals().filter(deal => deal.referralTeam === teamId);
    },

    getReferralAttribution() {
        const deals = this.getDeals();
        const attribution = {
            byContact: {},
            byTeam: {},
            byType: {},
            summary: {
                totalReferredValue: 0,
                totalReferredDeals: 0,
                avgReferralValue: 0,
                topReferrer: null,
                topReferralTeam: null
            }
        };

        deals.forEach(deal => {
            const value = deal.value || 0;
            const stage = deal.stage;
            const isWon = stage === 'deal-won';
            
            // Only count deals that have a referral source
            if (!deal.referralSource) return;
            
            // Track by contact
            if (!attribution.byContact[deal.referralSource]) {
                attribution.byContact[deal.referralSource] = {
                    contactId: deal.referralSource,
                    totalValue: 0,
                    wonValue: 0,
                    dealCount: 0,
                    wonDeals: 0,
                    avgDealSize: 0,
                    winRate: 0
                };
            }
            
            const contact = attribution.byContact[deal.referralSource];
            contact.totalValue += value;
            contact.dealCount += 1;
            if (isWon) {
                contact.wonValue += value;
                contact.wonDeals += 1;
            }
            
            // Track by team
            if (deal.referralTeam) {
                if (!attribution.byTeam[deal.referralTeam]) {
                    attribution.byTeam[deal.referralTeam] = {
                        teamId: deal.referralTeam,
                        totalValue: 0,
                        wonValue: 0,
                        dealCount: 0,
                        wonDeals: 0,
                        avgDealSize: 0,
                        winRate: 0
                    };
                }
                
                const team = attribution.byTeam[deal.referralTeam];
                team.totalValue += value;
                team.dealCount += 1;
                if (isWon) {
                    team.wonValue += value;
                    team.wonDeals += 1;
                }
            }
            
            // Track by type
            if (!attribution.byType[deal.referralType]) {
                attribution.byType[deal.referralType] = {
                    totalValue: 0,
                    wonValue: 0,
                    dealCount: 0,
                    wonDeals: 0
                };
            }
            attribution.byType[deal.referralType].totalValue += value;
            attribution.byType[deal.referralType].dealCount += 1;
            if (isWon) {
                attribution.byType[deal.referralType].wonValue += value;
                attribution.byType[deal.referralType].wonDeals += 1;
            }
        });

        // Calculate averages and rates
        Object.keys(attribution.byContact).forEach(contactId => {
            const contact = attribution.byContact[contactId];
            contact.avgDealSize = contact.dealCount > 0 ? contact.totalValue / contact.dealCount : 0;
            contact.winRate = contact.dealCount > 0 ? (contact.wonDeals / contact.dealCount) * 100 : 0;
        });

        Object.keys(attribution.byTeam).forEach(teamId => {
            const team = attribution.byTeam[teamId];
            team.avgDealSize = team.dealCount > 0 ? team.totalValue / team.dealCount : 0;
            team.winRate = team.dealCount > 0 ? (team.wonDeals / team.dealCount) * 100 : 0;
        });

        // Calculate summary
        const referredDeals = deals.filter(d => d.referralSource);
        attribution.summary.totalReferredValue = referredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        attribution.summary.totalReferredDeals = referredDeals.length;
        attribution.summary.avgReferralValue = attribution.summary.totalReferredDeals > 0 ? 
            attribution.summary.totalReferredValue / attribution.summary.totalReferredDeals : 0;

        // Find top performers
        const topContact = Object.values(attribution.byContact).sort((a, b) => b.wonValue - a.wonValue)[0];
        const topTeam = Object.values(attribution.byTeam).sort((a, b) => b.wonValue - a.wonValue)[0];
        
        attribution.summary.topReferrer = topContact ? topContact.contactId : null;
        attribution.summary.topReferralTeam = topTeam ? topTeam.teamId : null;

        return attribution;
    },

    getReferralSourceName(contactId) {
        if (!contactId) return 'Direct/Unknown';
        const contact = this.getContactById(contactId);
        return contact ? `${contact.name} (${contact.company})` : 'Unknown Contact';
    },

    getReferralTeamName(teamId) {
        if (!teamId) return 'Unknown Team';
        const teams = this.getTeams();
        const team = teams[teamId];
        return team ? team.name : 'Unknown Team';
    },

    migrateDealsForReferralTracking() {
        const deals = this.getDeals();
        let updated = 0;
        
        deals.forEach(deal => {
            if (deal.referralSource === undefined) {
                deal.referralSource = null;
                deal.referralTeam = null;
                deal.referralType = 'direct';
                deal.referralNotes = '';
                deal.referralDate = deal.createdAt;
                updated++;
            }
        });
        
        if (updated > 0) {
            this.saveToStorage();
            console.log(`Updated ${updated} deals with referral tracking fields`);
        }
        
        return updated;
    },

    // Touchpoints methods
    getTouchpoints() {
        return this.data.touchpoints || [];
    },

    addTouchpoint(touchpoint) {
        if (!this.data.touchpoints) this.data.touchpoints = [];
        touchpoint.id = touchpoint.id || this.generateId();
        touchpoint.createdAt = new Date().toISOString();
        this.data.touchpoints.push(touchpoint);
        this.emit('touchpoint:added', touchpoint);
        this.saveToStorage();
    },

    updateTouchpoint(updatedTouchpoint) {
        const touchpoints = this.getTouchpoints();
        const index = touchpoints.findIndex(tp => tp.id === updatedTouchpoint.id);
        if (index >= 0) {
            touchpoints[index] = { ...touchpoints[index], ...updatedTouchpoint };
            this.emit('touchpoint:updated', touchpoints[index]);
            this.saveToStorage();
        }
    },

    deleteTouchpoint(touchpointId) {
        if (!this.data.touchpoints) return;
        const index = this.data.touchpoints.findIndex(tp => tp.id === touchpointId);
        if (index >= 0) {
            this.data.touchpoints.splice(index, 1);
            this.emit('touchpoint:deleted', touchpointId);
            this.saveToStorage();
        }
    },

    // Tasks methods
    getTasks() {
        return this.data.tasks || [];
    },

    addTask(task) {
        if (!this.data.tasks) this.data.tasks = [];
        task.id = task.id || this.generateId();
        task.createdAt = new Date().toISOString();
        task.completed = task.completed || false;
        this.data.tasks.push(task);
        this.emit('task:added', task);
        this.saveToStorage();
    },

    updateTask(updatedTask) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === updatedTask.id);
        if (index >= 0) {
            tasks[index] = { ...tasks[index], ...updatedTask };
            this.emit('task:updated', tasks[index]);
            this.saveToStorage();
        }
    },

    deleteTask(taskId) {
        if (!this.data.tasks) return;
        const index = this.data.tasks.findIndex(t => t.id === taskId);
        if (index >= 0) {
            this.data.tasks.splice(index, 1);
            this.emit('task:deleted', taskId);
            this.saveToStorage();
        }
    },

    // Relationships methods
    getRelationships() {
        return this.data.relationships || [];
    },

    addRelationship(relationship) {
        if (!this.data.relationships) this.data.relationships = [];
        relationship.id = relationship.id || this.generateId();
        relationship.createdAt = new Date().toISOString();
        this.data.relationships.push(relationship);
        this.emit('relationship:added', relationship);
        this.saveToStorage();
    },

    updateRelationship(updatedRelationship) {
        const relationships = this.getRelationships();
        const index = relationships.findIndex(r => r.id === updatedRelationship.id);
        if (index >= 0) {
            relationships[index] = { ...relationships[index], ...updatedRelationship };
            this.emit('relationship:updated', relationships[index]);
            this.saveToStorage();
        }
    },

    deleteRelationship(relationshipId) {
        if (!this.data.relationships) return;
        const index = this.data.relationships.findIndex(r => r.id === relationshipId);
        if (index >= 0) {
            this.data.relationships.splice(index, 1);
            this.emit('relationship:deleted', relationshipId);
            this.saveToStorage();
        }
    },

    // Utility methods
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },

    // Export/Import functionality
    exportData() {
        return JSON.stringify(this.data, null, 2);
    },

    importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.data = { ...this.data, ...importedData };
            this.saveToStorage();
            this.emit('data:imported');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    // Load data (for reloading after import)
    loadData() {
        this.loadFromStorage();
    },

    // Statistics and analytics
    getStatistics() {
        const stats = {
            totalContacts: this.getAllContacts().length,
            totalDeals: this.getDeals().length,
            totalTouchpoints: this.getTouchpoints().length,
            totalTasks: this.getTasks().length,
            totalPipelineValue: this.getDeals().reduce((sum, deal) => sum + (deal.value || 0), 0),
            avgDealSize: 0,
            activeContacts: 0,
            engagementRate: 0
        };

        // Calculate average deal size
        if (stats.totalDeals > 0) {
            stats.avgDealSize = stats.totalPipelineValue / stats.totalDeals;
        }

        // Calculate active contacts (contacted in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        stats.activeContacts = this.getAllContacts().filter(contact => {
            if (!contact.lastContact) return false;
            return new Date(contact.lastContact) >= thirtyDaysAgo;
        }).length;

        // Calculate engagement rate
        if (stats.totalContacts > 0) {
            stats.engagementRate = (stats.activeContacts / stats.totalContacts) * 100;
        }

        return stats;
    },

    // Clear all sample data - for fresh start
    clearAllSampleData() {
        this.data = {
            teams: {},
            contacts: {},
            deals: [],
            touchpoints: [],
            tasks: [],
            relationships: [],
            teamMembers: {},
            settings: {}
        };
        this.saveToStorage();
        this.emit('data:cleared');
        console.log('All sample data cleared');
    },

    // Clear all data (for testing/reset)
    clearAllData() {
        this.clearAllSampleData();
    },

    // Sample data loading (stub for clean start)
    loadSampleData() {
        // This method is intentionally empty for a clean start
        // If you want to re-enable sample data, you can add sample data here later
        console.log('📝 Sample data loading skipped - starting with clean data');
        this.emit('data:loaded');
    }
};
