import { notification } from "antd";

export function reload(setDirectory: Function) {
    sessionStorage.clear();
    setDirectory([]);
    window.indexedDB.deleteDatabase("keyval-store");
    notification.success({
        message: "Refresh success"
    });
}

export function goHome(setDirectory: Function) {
    setDirectory([]);
}
