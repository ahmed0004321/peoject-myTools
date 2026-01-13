import { openDB, DBSchema, IDBPDatabase } from 'idb';


interface ScannedPage {
    id: string;
    original: string;
    processed: string;
    text: string;
    filter: string;
}

interface OmniToolsDB extends DBSchema {
    scanned_docs: {
        key: string;
        value: {
            id: string;
            pages: ScannedPage[];
            extractedText: string;
            created_at: number;
        };
    };
}

const DB_NAME = 'omnitools-db';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase<OmniToolsDB>> => {
    return openDB<OmniToolsDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('scanned_docs')) {
                db.createObjectStore('scanned_docs', { keyPath: 'id' });
            }
        },
    });
};


export const saveScan = async (id: string, pages: ScannedPage[], extractedText: string) => {
    const db = await initDB();
    await db.put('scanned_docs', {
        id,
        pages,
        extractedText,
        created_at: Date.now()
    });
};

export const getScan = async (id: string) => {
    const db = await initDB();
    return db.get('scanned_docs', id);
};

export const getAllScans = async () => {
    const db = await initDB();
    return db.getAll('scanned_docs');
};
