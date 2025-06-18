// Centralized data management
const DataManager = {
    data: {
        contacts: {},
        teams: {},
        deals: [],
        touchpoints: [],
        nextSteps: []
    },

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
        },

        touchpointTypes: {
            'call': { name: 'Call', icon: '📞' },
            'email': { name: 'Email', icon: '📧' },
            'slack': { name: 'Slack', icon: '💬' },
            'meeting': { name: 'Meeting', icon: '🤝' },
            'other': { name: 'Other', icon: '📝' }
        }
    },

    listeners: {},

    init() {
        // Initialize data structure
        this.loadFromStorage();
    },

    // Event system for modules to communicate
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    },

    // Data access methods
    getContacts() {
        return this.data.contacts;
    },

    getTeams() {
        return this.data.teams;
    },

    getDeals() {
        return this.data.deals;
    },

    getTouchpoints() {
        return this.data.touchpoints;
    },

    getNextSteps() {
        return this.data.nextSteps;
    },

    // Data modification methods
    addContact(teamId, contact) {
        if (!this.data.contacts[teamId]) {
            this.data.contacts[teamId] = [];
        }
        
        if (!contact.id) {
            contact.id = contact.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        }
        
        const existingIndex = this.data.contacts[teamId].findIndex(c => c.id === contact.id);
        if (existingIndex >= 0) {
            this.data.contacts[teamId][existingIndex] = contact;
        } else {
            this.data.contacts[teamId].push(contact);
        }
        
        this.saveToStorage();
        this.emit('contact:updated', { teamId, contact });
        return contact;
    },

    updateContact(teamId, contactId, updates) {
        const contact = this.getContactById(contactId);
        if (contact && this.data.contacts[teamId]) {
            const index = this.data.contacts[teamId].findIndex(c => c.id === contactId);
            if (index >= 0) {
                Object.assign(this.data.contacts[teamId][index], updates);
                this.saveToStorage();
                this.emit('contact:updated', { teamId, contact: this.data.contacts[teamId][index] });
                return this.data.contacts[teamId][index];
            }
        }
        return null;
    },

    deleteContact(teamId, contactId) {
        if (this.data.contacts[teamId]) {
            this.data.contacts[teamId] = this.data.contacts[teamId].filter(c => c.id !== contactId);
            this.saveToStorage();
            this.emit('contact:deleted', { teamId, contactId });
        }
    },

    getContactById(contactId) {
        for (const teamId in this.data.contacts) {
            const contact = this.data.contacts[teamId].find(c => c.id === contactId);
            if (contact) return contact;
        }
        return null;
    },

    getContactName(contactId) {
        const contact = this.getContactById(contactId);
        return contact ? contact.name : 'Unknown Contact';
    },

    // Deal methods
    addDeal(deal) {
        if (!deal.id) {
            deal.id = 'deal_' + Date.now();
            deal.createdDate = new Date().toISOString().split('T')[0];
        }
        
        const existingIndex = this.data.deals.findIndex(d => d.id === deal.id);
        if (existingIndex >= 0) {
            this.data.deals[existingIndex] = deal;
        } else {
            this.data.deals.push(deal);
        }
        
        this.saveToStorage();
        this.emit('deal:updated', deal);
        return deal;
    },

    // Storage methods
    saveToStorage() {
        // Note: localStorage not available in artifacts, but this sets up the pattern
        try {
            const dataToSave = {
                ...this.data,
                lastUpdated: new Date().toISOString()
            };
            console.log('Data would be saved to localStorage:', dataToSave);
            // localStorage.setItem('awsPartnerData', JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    },

    loadFromStorage() {
        try {
            // const saved = localStorage.getItem('awsPartnerData');
            // if (saved) {
            //     const parsedData = JSON.parse(saved);
            //     this.data = { ...this.data, ...parsedData };
            // }
        } catch (error) {
            console.warn('Could not load from localStorage:', error);
        }
    },

    loadSampleData() {
        // Load your existing sample data
        this.data.teams = {
            'csc': { name: 'ENT-CSC-C (SWIM)', dm: 'Tara Jayne-O\'Donnell', psm: 'Noah Arling' },
            'isv-genai': { name: 'ISV - GenAI', dm: 'TBD', psm: 'TBD' },
            'isv-data': { name: 'ISV - Data Analytics', dm: 'TBD', psm: 'TBD' },
            'isv-manufacturing': { name: 'ISV - Manufacturing', dm: 'TBD', psm: 'TBD' },
            'smb-east': { name: 'SMB - East', dm: 'TBD', psm: 'TBD' },
            'smb-west': { name: 'SMB - West', dm: 'TBD', psm: 'TBD' },
            'smb-central': { name: 'SMB - Central', dm: 'TBD', psm: 'TBD' },
            'enterprise-global': { name: 'Enterprise - Global', dm: 'TBD', psm: 'TBD' },
            'partner-ops': { name: 'Partner Operations', dm: 'TBD', psm: 'TBD' }
        };

        this.data.contacts = {
            'csc': [
                {
                    id: 'demaree',
                    name: 'Demaree Barton',
                    role: 'AM',
                    geo: 'HQ1',
                    tier: 'tier1',
                    relationshipScore: 4,
                    lastContact: '6/10/2025',
                    pipeline: '$85K',
                    nextSteps: 'Joint account review'
                },
                {
                    id: 'lars',
                    name: 'Lars Branvold',
                    role: 'AM',
                    geo: 'HQ1',
                    tier: 'tier1',
                    relationshipScore: 4,
                    lastContact: '6/8/2025',
                    pipeline: '$120K',
                    nextSteps: 'VMware migration opp'
                },
                {
                    id: 'will',
                    name: 'Will Desmond',
                    role: 'AM',
                    geo: 'HQ1',
                    tier: 'tier1',
                    relationshipScore: 4,
                    lastContact: '6/5/2025',
                    pipeline: '$95K',
                    nextSteps: 'PPA discussion'
                }
            ],
            'isv-genai': [
                {
                    id: 'helen',
                    name: 'Helen Har Theisen',
                    role: 'AM',
                    geo: 'TBD',
                    tier: 'tier3',
                    relationshipScore: 1,
                    lastContact: '6/9/2025',
                    pipeline: '$0',
                    nextSteps: 'Initial contact'
                }
            ]
        };

        this.emit('data:loaded');
    }
};
