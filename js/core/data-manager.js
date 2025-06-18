// Data Manager - Centralized data handling and storage
const DataManager = {
    data: {
        teams: {},
        contacts: {},
        deals: [],
        touchpoints: [],
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
// Add these methods to your DataManager object:

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

    updateContact(teamId, updatedContact) {
        const teamContacts = this.data.contacts[teamId] || [];
        const index = teamContacts.findIndex(c => c.id === updatedContact.id);
        if (index >= 0) {
            teamContacts[index] = { ...teamContacts[index], ...updatedContact };
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

    // Deals methods
    getDeals() {
        return this.data.deals || [];
    },

    addDeal(deal) {
        if (!this.data.deals) this.data.deals = [];
        deal.id = deal.id || this.generateId();
        deal.createdAt = new Date().toISOString();
        this.data.deals.push(deal);
        this.emit('deal:added', deal);
        this.saveToStorage();
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
// Add to DataManager object
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

    // Sample data for development
    loadSampleData() {
        // Only load if no existing data
        if (Object.keys(this.data.teams).length > 0) {
            return;
        }

        console.log('Loading sample data...');
        
        // Sample teams
        this.data.teams = {
            'team_1': {
                id: 'team_1',
                name: 'Enterprise North',
                region: 'North America',
                color: '#1e88e5',
                manager: 'Sarah Johnson'
            },
            'team_2': {
                id: 'team_2',
                name: 'Enterprise South',
                region: 'South America',
                color: '#43a047',
                manager: 'Carlos Rodriguez'
            },
            'team_3': {
                id: 'team_3',
                name: 'SMB East',
                region: 'Eastern US',
                color: '#fb8c00',
                manager: 'Jennifer Kim'
            },
            'team_4': {
                id: 'team_4',
                name: 'SMB West',
                region: 'Western US',
                color: '#8e24aa',
                manager: 'Michael Chen'
            }
        };

        // Sample contacts
        this.data.contacts = {
            'team_1': [
                {
                    id: 'contact_1',
                    name: 'John Smith',
                    title: 'CTO',
                    company: 'TechCorp Solutions',
                    email: 'john.smith@techcorp.com',
                    phone: '+1-555-0123',
                    lastContact: '2024-06-15',
                    status: 'active',
                    notes: 'Interested in enterprise migration to AWS',
                    createdAt: '2024-01-15T10:00:00Z'
                },
                {
                    id: 'contact_2',
                    name: 'Emily Davis',
                    title: 'VP Engineering',
                    company: 'DataFlow Inc',
                    email: 'emily.davis@dataflow.com',
                    phone: '+1-555-0124',
                    lastContact: '2024-06-10',
                    status: 'active',
                    notes: 'Looking for data analytics solutions',
                    createdAt: '2024-02-01T09:30:00Z'
                }
            ],
            'team_2': [
                {
                    id: 'contact_3',
                    name: 'Roberto Silva',
                    title: 'IT Director',
                    company: 'InnovaTech Brazil',
                    email: 'roberto.silva@innovatech.br',
                    phone: '+55-11-9999-8888',
                    lastContact: '2024-06-12',
                    status: 'active',
                    notes: 'Expanding operations, needs scalable infrastructure',
                    createdAt: '2024-01-20T14:00:00Z'
                }
            ],
            'team_3': [
                {
                    id: 'contact_4',
                    name: 'Lisa Wang',
                    title: 'CEO',
                    company: 'StartupX',
                    email: 'lisa@startupx.com',
                    phone: '+1-555-0125',
                    lastContact: '2024-06-08',
                    status: 'pending',
                    notes: 'Early stage startup, budget conscious',
                    createdAt: '2024-03-01T11:15:00Z'
                }
            ]
        };

        // Sample deals
        this.data.deals = [
            {
                id: 'deal_1',
                name: 'TechCorp Enterprise Migration',
                contactId: 'contact_1',
                value: 250000,
                stage: 'proposal-development',
                probability: 40,
                closeDate: '2024-08-15',
                description: 'Complete migration of on-premise infrastructure to AWS',
                createdAt: '2024-05-01T10:00:00Z'
            },
            {
                id: 'deal_2',
                name: 'DataFlow Analytics Platform',
                contactId: 'contact_2',
                value: 150000,
                stage: 'qualified',
                probability: 25,
                closeDate: '2024-07-30',
                description: 'AWS-based data analytics and ML platform',
                createdAt: '2024-05-15T14:30:00Z'
            },
            {
                id: 'deal_3',
                name: 'InnovaTech Infrastructure',
                contactId: 'contact_3',
                value: 180000,
                stage: 'proposal-delivered',
                probability: 60,
                closeDate: '2024-07-15',
                description: 'Scalable cloud infrastructure for Latin American expansion',
                createdAt: '2024-04-20T16:00:00Z'
            }
        ];

        // Sample touchpoints
        this.data.touchpoints = [
            {
                id: 'touchpoint_1',
                contactId: 'contact_1',
                type: 'meeting',
                subject: 'Initial Discovery Call',
                date: '2024-06-15T14:00:00',
                duration: 60,
                notes: 'Discussed current infrastructure challenges and migration timeline. John is very interested in moving to AWS but needs board approval.',
                nextSteps: 'Send detailed migration proposal by Friday',
                createdAt: '2024-06-15T15:00:00Z'
            },
            {
                id: 'touchpoint_2',
                contactId: 'contact_2',
                type: 'demo',
                subject: 'AWS Analytics Services Demo',
                date: '2024-06-10T10:00:00',
                duration: 90,
                notes: 'Showed SageMaker, Redshift, and QuickSight capabilities. Emily was impressed with the ML features.',
                nextSteps: 'Prepare custom demo with their sample data',
                createdAt: '2024-06-10T11:30:00Z'
            },
            {
                id: 'touchpoint_3',
                contactId: 'contact_3',
                type: 'call',
                subject: 'Pricing Discussion',
                date: '2024-06-12T16:00:00',
                duration: 45,
                notes: 'Roberto wants to understand cost implications for their expansion plans.',
                nextSteps: 'Send detailed pricing breakdown for 3-year growth projection',
                createdAt: '2024-06-12T16:45:00Z'
            },
            {
                id: 'touchpoint_4',
                contactId: 'contact_4',
                type: 'email',
                subject: 'AWS Credits Program Information',
                date: '2024-06-08T09:30:00',
                notes: 'Sent information about AWS Activate program for startups. Lisa responded positively.',
                nextSteps: 'Schedule follow-up call to discuss implementation timeline',
                createdAt: '2024-06-08T09:35:00Z'
            },
            {
                id: 'touchpoint_5',
                contactId: 'contact_1',
                type: 'proposal',
                subject: 'Migration Proposal Delivery',
                date: '2024-06-14T11:00:00',
                notes: 'Delivered comprehensive migration proposal including timeline, costs, and risk mitigation strategies.',
                nextSteps: 'Follow up next week for feedback and questions',
                createdAt: '2024-06-14T11:15:00Z'
            }
        ];

        this.saveToStorage();
        this.emit('data:loaded');
        console.log('Sample data loaded successfully');
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

    // Statistics and analytics
    getStatistics() {
        const stats = {
            totalContacts: this.getAllContacts().length,
            totalDeals: this.getDeals().length,
            totalTouchpoints: this.getTouchpoints().length,
            totalPipelineValue: this.getDeals().reduce((sum, deal) => sum + deal.value, 0),
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

    // Clear all data (for testing/reset)
    clearAllData() {
        this.data = {
            teams: {},
            contacts: {},
            deals: [],
            touchpoints: [],
            settings: {}
        };
        this.saveToStorage();
        this.emit('data:cleared');
    }
};
