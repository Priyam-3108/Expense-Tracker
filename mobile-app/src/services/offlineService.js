import { getDB } from './db';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

export const offlineService = {
    async saveExpenseLocally(expenseData) {
        const db = await getDB();
        if (!db) return { success: false };
        const uuid = uuidv4();

        const payload = {
            ...expenseData,
            client_uuid: uuid,
        };

        try {
            await db.runAsync(
                'INSERT INTO local_expenses (uuid, sync_status, payload, created_at) VALUES (?, ?, ?, ?)',
                [uuid, 'PENDING', JSON.stringify(payload), new Date().toISOString()]
            );
            return { success: true, uuid, ...payload };
        } catch (error) {
            console.error('Error saving locally:', error);
            throw error;
        }
    },

    async getPendingExpenses() {
        const db = await getDB();
        if (!db) return [];
        try {
            const results = await db.getAllAsync('SELECT * FROM local_expenses WHERE sync_status IN (?, ?)', ['PENDING', 'FAILED']);
            return results.map(row => ({
                ...row,
                payload: JSON.parse(row.payload)
            }));
        } catch (error) {
            console.error('Error fetching pending:', error);
            return [];
        }
    },

    async getAllLocalExpenses() {
        const db = await getDB();
        if (!db) return [];
        try {
            const results = await db.getAllAsync('SELECT * FROM local_expenses ORDER BY created_at DESC');
            return results.map(row => {
                const data = JSON.parse(row.payload);
                return {
                    ...data,
                    _id: row.server_id || row.uuid,
                    isLocal: row.sync_status !== 'SYNCED',
                    syncStatus: row.sync_status
                };
            });
        } catch (error) {
            console.error('Error fetching all local:', error);
            return [];
        }
    },

    async markAsSynced(localRowId, serverId) {
        const db = await getDB();
        if (!db) return;
        try {
            await db.runAsync(
                'UPDATE local_expenses SET sync_status = ?, server_id = ? WHERE id = ?',
                ['SYNCED', serverId, localRowId]
            );
        } catch (error) {
            console.error('Error marking synced:', error);
        }
    },

    async markAsFailed(localRowId) {
        const db = await getDB();
        if (!db) return;
        try {
            await db.runAsync(
                'UPDATE local_expenses SET sync_status = ? WHERE id = ?',
                ['FAILED', localRowId]
            );
        } catch (error) {
            console.error('Error marking failed:', error);
        }
    },

    async clearLocalExpenses() {
        const db = await getDB();
        if (!db) return;
        try {
            await db.runAsync('DELETE FROM local_expenses');
        } catch (error) {
            console.error('Error clearing local expenses:', error);
        }
    }
};
