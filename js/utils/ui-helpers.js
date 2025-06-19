// UI Helper Functions - Core utility functions for the AWS Partner Tracker
const UIHelpers = {
    /**
     * Show a modal by ID
     * @param {string} modalId - The ID of the modal to show
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Focus trap for accessibility
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        } else {
            console.warn(`Modal with ID '${modalId}' not found`);
        }
    },

    /**
     * Close a modal by ID
     * @param {string} modalId - The ID of the modal to close
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
            
            // Return focus to the body or previously focused element
            document.body.focus();
        } else {
            console.warn(`Modal with ID '${modalId}' not found`);
        }
    },

    /**
     * Show a notification toast message
     * @param {string} message - The message to display
     * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info'
     * @param {number} duration - How long to show the notification (milliseconds)
     */
    showNotification(message, type = 'success', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.1em;">
                    ${this.getNotificationIcon(type)}
                </span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2em; margin-left: auto;">
                    ×
                </button>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-hide after specified duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },

    /**
     * Get icon for notification type
     * @param {string} type - Notification type
     * @returns {string} Icon character
     */
    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    /**
     * Format a date string for display
     * @param {string} dateString - ISO date string or date-like string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return 'Not set';
        
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    },

    /**
     * Format a date with time for display
     * @param {string} dateString - ISO date string or date-like string
     * @returns {string} Formatted date and time
     */
    formatDateTime(dateString) {
        if (!dateString) return 'Not set';
        
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting datetime:', error);
            return 'Invalid date';
        }
    },

    /**
     * Format currency amount
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: USD)
     * @returns {string} Formatted currency
     */
    formatCurrency(amount, currency = 'USD') {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '$0';
        }
        
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return `$${amount.toLocaleString()}`;
        }
    },

    /**
     * Format large numbers with K, M, B suffixes
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) {
            return '0';
        }
        
        const absNum = Math.abs(num);
        
        if (absNum >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (absNum >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (absNum >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toString();
        }
    },

    /**
     * Format percentage
     * @param {number} value - Value to format as percentage
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted percentage
     */
    formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0%';
        }
        
        return value.toFixed(decimals) + '%';
    },

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) {
            return text || '';
        }
        
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email format
     */
    isValidEmail(email) {
        if (!email) return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone number format
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid phone format
     */
    isValidPhone(phone) {
        if (!phone) return false;
        
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '');
        
        // Check if it's 10 or 11 digits (with country code)
        return digits.length >= 10 && digits.length <= 11;
    },

    /**
     * Generate a random color for charts/avatars
     * @returns {string} Hex color code
     */
    getRandomColor() {
        const colors = [
            '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#e53935',
            '#00acc1', '#7cb342', '#f4511e', '#546e7a', '#d81b60'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * Get initials from a name
     * @param {string} name - Full name
     * @returns {string} Initials
     */
    getInitials(name) {
        if (!name) return '??';
        
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    /**
     * Calculate days between two dates
     * @param {string|Date} date1 - First date
     * @param {string|Date} date2 - Second date
     * @returns {number} Number of days between dates
     */
    daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Check if a date is in the past
     * @param {string|Date} date - Date to check
     * @returns {boolean} True if date is in the past
     */
    isPastDate(date) {
        const checkDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkDate < today;
    },

    /**
     * Get relative time string (e.g., "2 days ago", "in 3 weeks")
     * @param {string|Date} date - Date to compare
     * @returns {string} Relative time string
     */
    getRelativeTime(date) {
        const targetDate = new Date(date);
        const now = new Date();
        const diffMs = targetDate - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 1) return `In ${diffDays} days`;
        if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
        
        return 'Unknown';
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Generate a simple hash from a string
     * @param {string} str - String to hash
     * @returns {string} Simple hash
     */
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString();
    }
};

// Add global click handler for modal closing
document.addEventListener('click', function(event) {
    // Close modal if clicking outside of modal content
    if (event.target.classList.contains('modal')) {
        const modal = event.target;
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Add escape key handler for modal closing
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="block"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
});

console.log('✅ UIHelpers loaded successfully');
