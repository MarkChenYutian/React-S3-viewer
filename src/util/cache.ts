import { get, set } from "idb-keyval";

export function setCache(Key: string, ETag: string | undefined, Data: string) {
    set(Key, {ETag: ETag, Data: Data});
}

export async function getCache(Key: string, ETag: string | undefined): Promise<string|undefined> {
    const result = await get(Key);
    if (result === undefined || result.ETag !== ETag) return undefined;
    return result.Data;
}
