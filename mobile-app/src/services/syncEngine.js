import { offlineService } from './offlineService';
import api from './api';
import NetInfo from '@react-native-community/netinfo';

export const syncEngine = {
    async syncNow() {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            console.log('No internet connection, skipping sync');
            return;
        }

        const pending = await offlineService.getPendingExpenses();
        if (pending.length === 0) {
            console.log('No pending expenses to sync');
            return;
        }

        console.log(`Syncing ${pending.length} expenses...`);

        // Prepare payload
        // We only send the payload part which contains the expense data
        // server expects an array of expenses
        const expensesToSync = pending.map(p => {
            const data = { ...p.payload };
            if (data.category && typeof data.category === 'object') {
                data.category = data.category._id || data.category.id;
            }
            return {
                ...data,
                client_uuid: p.uuid
            };
        });

        try {
            const response = await api.post('/expenses/sync', { expenses: expensesToSync });

            if (response.data.success && response.data.results) {
                // Process results
                for (const result of response.data.results) {
                    // Find local record with this uuid
                    const localRecord = pending.find(p => p.uuid === result.client_uuid);
                    if (localRecord) {
                        if (result.status === 'SYNCED') {
                            await offlineService.markAsSynced(localRecord.id, result.server_id);
                        } else {
                            await offlineService.markAsFailed(localRecord.id);
                        }
                    }
                }
                console.log('Sync completed successfully');
            }
        } catch (error) {
            console.error('Sync failed:', error);
            // Mark all tried as failed (or leave as pending? Better to leave as pending/failed to retry)
            // But if we marked them as failed, they are still picked up next time (query selects PENDING or FAILED)
        }
    }
};
