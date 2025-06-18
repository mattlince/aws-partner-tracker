// Shared UI utilities
const UIHelpers = {
    showNotification(message, duration = 3000, type = 'success') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notificationText');
        
        if (!notification || !text) return;
        
        const colors = {
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
        };
        
        notification.style.background = colors[type] || colors.success;
        text.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    },

    createModal(id, title, content, options = {}) {
        // Remove existing modal if it exists
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="background: white; margin: 5% auto; padding: 30px; border-radius: 12px; width: 80%; max-width: 600px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;">
                <span class="close" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                <h2>${title}</h2>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Add to modals container or body
        const container = document.getElementById('modals-container') || document.body;
        container.appendChild(modal);

        // Set up close handlers
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => this.closeModal(id));

        return modal;
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },

    createFormField(type, name, label, options = {}) {
        const fieldHtml = `
            <div class="form-group">
                <label for="${name}">${label}:</label>
                ${this.createInput(type, name, options)}
                ${options.help ? `<small>${options.help}</small>` : ''}
            </div>
        `;
        return fieldHtml;
    },

    createInput(type, name, options = {}) {
        const baseStyle = 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;';
        
        switch (type) {
            case 'select':
                const optionsHtml = options.options ? 
                    options.options.map(opt => `<option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.text}</option>`).join('') : '';
                return `<select id="${name}" name="${name}" style="${baseStyle}" ${options.required ? 'required' : ''}>${optionsHtml}</select>`;
            
            case 'textarea':
                return `<textarea id="${name}" name="${name}" style="${baseStyle} height: 100px; resize: vertical;" placeholder="${options.placeholder || ''}" ${options.required ? 'required' : ''}>${options.value || ''}</textarea>`;
            
            default:
                return `<input type="${type}" id="${name}" name="${name}" style="${baseStyle}" value="${options.value || ''}" placeholder="${options.placeholder || ''}" ${options.required ? 'required' : ''}>`;
        }
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
