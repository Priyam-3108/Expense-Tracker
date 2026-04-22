import * as SQLite from 'expo-sqlite';

let db;

export const initDB = async () => {
    try {
        db = await SQLite.openDatabaseAsync('expenses.db');

        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS local_expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                server_id TEXT,
                sync_status TEXT DEFAULT 'PENDING', -- PENDING, SYNCED, FAILED
                payload TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('SQLite DB initialized');
    } catch (error) {
        console.error('Failed to init local DB', error);
    }
};

export const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initDB first.');
    }
    return db;
};
