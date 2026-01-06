import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface Flashcard {
    front: string;
    back: string;
    tag: string;
    learned?: boolean;
}

interface ScannedPage {
    id: string;
    original: string;
    processed: string;
    text: string;
    filter: string;
}

interface OmniToolsDB extends DBSchema {
    flashcards: {
        key: string;
        value: {
            id: string;
            cards: Flashcard[];
            created_at: number;
        };
    };
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
            if (!db.objectStoreNames.contains('flashcards')) {
                db.createObjectStore('flashcards', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('scanned_docs')) {
                db.createObjectStore('scanned_docs', { keyPath: 'id' });
            }
        },
    });
};

export const saveFlashcards = async (cards: Flashcard[]) => {
    const db = await initDB();
    await db.put('flashcards', {
        id: 'current_session',
        cards,
        created_at: Date.now(),
    });
};

export const getFlashcards = async (): Promise<Flashcard[] | undefined> => {
    const db = await initDB();
    const result = await db.get('flashcards', 'current_session');
    return result?.cards;
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
