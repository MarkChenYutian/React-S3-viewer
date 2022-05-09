import { openDB, DBSchema, deleteDB } from "idb";

interface FileCacheDB extends DBSchema {
    FileCache: {
        value: {
          data: string;
          version: Date;
          fileKey: string;
          fileName: string;
          sequenceNum: number;
        };
        key: string;
        indexes: { 'by-sequenceNum': number, 'by-version': number };
    };
}

interface CacheEntry {
    data: string;
    version: Date;
    fileKey: string;
    fileName: string;
    sequenceNum: number;
}

export async function ReadCache(fileKey: string){
    return openDB<FileCacheDB>('cache')
            .then(
                (db) => {
                    const val = db.get("FileCache", fileKey);
                    db.close();
                    return val;
                }
            )
            .then(
                (entry) => {
                    return entry === undefined ? undefined : entry.data;
                }
            );
}

export async function CheckCache(root: Directory) {
    const db = await openDB<FileCacheDB>('cache');
    let cursor = await db.transaction("FileCache").store.openCursor();
    while (cursor) {
        const currVersion = (root[cursor.key] as ParsedFile).LastModified;
        if (currVersion !== undefined && cursor.value.version.getTime() < currVersion.getTime()){
            const prevKey = cursor.key;
            cursor = await cursor.continue();
            db.delete("FileCache", prevKey);
        } else {
            cursor = await cursor.continue();
        }        
    }
    db.close();
}

export async function WriteCache(value: CacheEntry) {
    const db = await openDB<FileCacheDB>('cache');
    db.put("FileCache", value);
    db.close();
}

export function initializeCache() {
    console.debug("Initializing cache database...");
    return openDB<FileCacheDB>('cache', 1, {
        upgrade(db) {
            db.createObjectStore("FileCache", {keyPath: 'fileKey'});
        }
    })
}

export function clearCache(setErr: Function) {
    deleteDB('cache', {
        blocked() {
            console.warn("There are existing db connection, the db will be cleared after all transaction is finished.");
        }
    }).then(
        () => {
            console.log("Restarting cache service...");
            initializeCache();
        }
    ).catch(
        (e) => { setErr(e); }
    )
}
