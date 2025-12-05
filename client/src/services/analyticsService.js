import api from './api'

export const analyticsService = {
    // Enable sharing and get token
    enableSharing: () => {
        return api.post('/analytics/share')
    },

    // Disable sharing
    disableSharing: () => {
        return api.delete('/analytics/share')
    },

    // Get shared profile
    getSharedProfile: (token) => {
        return api.get(`/analytics/shared/${token}/profile`)
    },

    // Get shared categories
    getSharedCategories: (token) => {
        return api.get(`/analytics/shared/${token}/categories`)
    },

    // Get shared detailed analytics
    getSharedDetailedAnalytics: (token, filters = {}) => {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value)
            }
        })
        return api.get(`/analytics/shared/${token}/detailed?${params.toString()}`)
    },

    // Get shared trends
    getSharedTrends: (token, year) => {
        const params = new URLSearchParams()
        if (year) params.append('year', year)
        return api.get(`/analytics/shared/${token}/trends?${params.toString()}`)
    },

    // Get shared stats
    getSharedStats: (token, dateRange = {}) => {
        const params = new URLSearchParams()
        if (dateRange.startDate) params.append('startDate', dateRange.startDate)
        if (dateRange.endDate) params.append('endDate', dateRange.endDate)
        return api.get(`/analytics/shared/${token}/stats?${params.toString()}`)
    },

    // Get shared expenses (for calculating derived stats if needed)
    getSharedExpenses: (token, filters = {}) => {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value)
            }
        })
        return api.get(`/analytics/shared/${token}/expenses?${params.toString()}`)
    }
}
