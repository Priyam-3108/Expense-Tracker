import api from './api';

/**
 * Pings the backend health endpoint to wake up cold/sleeping server instances
 * when the mobile app opens or resumes from background.
 */
export const pingHealth = async () => {
    try {
        const response = await api.get('/health', { timeout: 15000 });
        if (response.data?.success) {
            console.log('⚡ Backend server awake & healthy:', response.data.message);
            return true;
        }
    } catch (error) {
        console.log('⏳ Waking backend server from sleep... Notice:', error?.message || 'Server waking');
    }
    return false;
};
