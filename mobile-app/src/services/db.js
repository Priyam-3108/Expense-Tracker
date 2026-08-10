import * as SQLite from 'expo-sqlite';

let dbInstance = null;
let initPromise = null;

export const initDB = async () => {
    if (dbInstance) return dbInstance;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            const db = await SQLite.openDatabaseAsync('expenses.db');
            if (!db) return null;

            try {
                await db.runAsync(`
                    CREATE TABLE IF NOT EXISTS local_expenses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        uuid TEXT UNIQUE NOT NULL,
                        server_id TEXT,
                        sync_status TEXT DEFAULT 'PENDING',
                        payload TEXT NOT NULL,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    );
                `);
            } catch (sqlErr) {
                console.log('RunAsync table creation notice:', sqlErr);
            }

            dbInstance = db;
            console.log('SQLite DB initialized');
            return db;
        } catch (error) {
            console.error('Failed to init local DB', error);
            initPromise = null;
            return null;
        }
    })();

    return initPromise;
};

export const getDB = async () => {
    if (dbInstance) return dbInstance;
    return await initDB();
};
