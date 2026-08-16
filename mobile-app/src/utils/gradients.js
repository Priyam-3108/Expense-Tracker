/**
 * Gradient color configurations for premium UI
 */

/**
 * Stripe (DESIGN.md) Atmospheric Gradient Mesh and Signature Gradients
 */

export const gradients = {
    // Stripe Atmospheric Gradient Mesh (hero backdrop wash)
    mesh: {
        colors: ['#f5e9d4', '#f96bee', '#533afd', '#1c1e54'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Electric Indigo Primary
    primary: {
        colors: ['#533afd', '#4434d4'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    primaryLight: {
        colors: ['#665efd', '#533afd'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Income gradient
    income: {
        colors: ['#059669', '#10b981'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Expense / Ruby gradient
    expense: {
        colors: ['#ea2261', '#f96bee'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Balance card gradient (Stripe Gradient Mesh for Light, Deep Navy Mesh for Dark)
    balance: {
        colors: ['#f5e9d4', '#f96bee', '#533afd', '#1c1e54'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Dark balance gradient
    balanceDark: {
        colors: ['#1c1e54', '#533afd', '#0d253d'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Success gradient
    success: {
        colors: ['#059669', '#10b981'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Warning gradient
    warning: {
        colors: ['#9b6829', '#fbbf24'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Danger gradient
    danger: {
        colors: ['#ea2261', '#f96bee'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Info gradient
    info: {
        colors: ['#533afd', '#665efd'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Purple / Indigo gradient
    purple: {
        colors: ['#533afd', '#665efd'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Teal gradient
    teal: {
        colors: ['#059669', '#34d399'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Lemon / Orange gradient
    orange: {
        colors: ['#9b6829', '#f5e9d4'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },

    // Dark card gradient (Dark App Shell)
    darkCard: {
        colors: ['#1c1e54', '#0d253d'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },

    // Light card gradient (Clean Canvas)
    lightCard: {
        colors: ['#ffffff', '#f6f9fc'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
    },

    // Warm Cream Band card gradient
    creamCard: {
        colors: ['#f5e9d4', '#f6f9fc'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
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
