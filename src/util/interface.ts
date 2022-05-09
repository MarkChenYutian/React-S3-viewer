import { notification } from "antd";
// import * as CacheCore from '../util/cache';

export function reload(setDirectory: Function) {
    sessionStorage.clear();
    setDirectory([]);
    // CacheCore.clearCache((e: any) => {console.error(e);});
    notification.success({
        message: "Refresh success"
    });
}

export function goHome(setDirectory: Function) {
    setDirectory([]);
}
