/**
 * Gradient color configurations for premium UI
 */

export const gradients = {
    // Primary gradients
    primary: {
        colors: ['#667eea', '#764ba2'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    primaryLight: {
        colors: ['#a8b5ff', '#9b8cff'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Income gradient (green)
    income: {
        colors: ['#11998e', '#38ef7d'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Expense gradient (red/orange)
    expense: {
        colors: ['#eb3349', '#f45c43'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Balance card gradient
    balance: {
        colors: ['#4F46E5', '#7C3AED', '#EC4899'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Dark balance gradient
    balanceDark: {
        colors: ['#312e81', '#581c87', '#831843'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Success gradient
    success: {
        colors: ['#56ab2f', '#a8e063'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Warning gradient
    warning: {
        colors: ['#f2994a', '#f2c94c'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Danger gradient
    danger: {
        colors: ['#eb3349', '#f45c43'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Info gradient
    info: {
        colors: ['#2193b0', '#6dd5ed'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Purple gradient
    purple: {
        colors: ['#8E2DE2', '#4A00E0'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Teal gradient
    teal: {
        colors: ['#06beb6', '#48b1bf'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Orange gradient
    orange: {
        colors: ['#f46b45', '#eea849'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Blue gradient
    blue: {
        colors: ['#2E3192', '#1BFFFF'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Sunset gradient
    sunset: {
        colors: ['#ff6b6b', '#feca57', '#ee5a6f'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Ocean gradient
    ocean: {
        colors: ['#2E3192', '#1BFFFF'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Dark card gradient
    darkCard: {
        colors: ['#1f2937', '#111827'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },

    // Light card gradient
    lightCard: {
        colors: ['#ffffff', '#f9fafb'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },
};

/**
 * Get gradient configuration by name
 * @param {string} name - Gradient name
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {object} Gradient configuration
 */
export const getGradient = (name, isDark = false) => {
    if (name === 'balance') {
        return isDark ? gradients.balanceDark : gradients.balance;
    }
    if (name === 'card') {
        return isDark ? gradients.darkCard : gradients.lightCard;
    }
    return gradients[name] || gradients.primary;
};

export default gradients;
