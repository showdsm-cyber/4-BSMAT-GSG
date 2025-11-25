import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export const initDB = async () => {
    if (!db) {
        try {
            console.log("Connecting to SQLite database: bsmat.db");
            db = await Database.load('sqlite:bsmat.db');
            console.log("Database initialized successfully");
        } catch (e) {
            console.error("Failed to load database", e);
            throw e;
        }
    }
    return db;
};

export const getDB = async () => {
    if (!db) await initDB();
    return db!;
};

export const saveItem = async (table: string, id: string, data: any, pkColumn: string = 'id') => {
    const db = await getDB();
    const json = JSON.stringify(data);
    // Upsert
    await db.execute(`INSERT INTO ${table} (${pkColumn}, data) VALUES ($1, $2) ON CONFLICT(${pkColumn}) DO UPDATE SET data = $2`, [id, json]);
};

export const getItem = async (table: string, id: string, pkColumn: string = 'id') => {
    const db = await getDB();
    const result = await db.select<any[]>(`SELECT data FROM ${table} WHERE ${pkColumn} = $1`, [id]);
    if (result.length > 0) {
        return JSON.parse(result[0].data);
    }
    return null;
};

export const getAllItems = async (table: string) => {
    const db = await getDB();
    const result = await db.select<any[]>(`SELECT data FROM ${table}`);
    return result.map(row => JSON.parse(row.data));
};

export const deleteItem = async (table: string, id: string, pkColumn: string = 'id') => {
    const db = await getDB();
    await db.execute(`DELETE FROM ${table} WHERE ${pkColumn} = $1`, [id]);
};

// Settings (Key-Value)
export const saveSetting = async (key: string, value: any) => {
    const db = await getDB();
    const json = JSON.stringify(value);
    await db.execute(`INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2`, [key, json]);
};

export const getSetting = async (key: string) => {
    const db = await getDB();
    const result = await db.select<any[]>(`SELECT value FROM settings WHERE key = $1`, [key]);
    if (result.length > 0) {
        return JSON.parse(result[0].value);
    }
    return null;
};
