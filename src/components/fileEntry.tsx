import { S3Client } from "@aws-sdk/client-s3";
import { downloadItem } from "../util/download";
import { isParsedFile } from "../util/fs";

export function fileSizeConvert(fileSize: number): string {
    fileSize /= 1024;
    const postfix = ["KB", "MB", "GB"]
    let ptr = 0;
    while (ptr < 3) {
        if (fileSize / 1024 < 1) { break; }
        fileSize = fileSize / 1024;
        ptr += 1;
    }
    const fileSizeStr = parseFloat(fileSize + "").toFixed(2);
    return fileSizeStr + " " + postfix[ptr];
}

function fileIconConvert(file: ParsedFile | Directory): JSX.Element {
    if (!isParsedFile(file)) return <i className='fa fa-folder-open-o' aria-hidden='true' style={{color: "#FDB900"}}></i>;
    switch (file.Type) {
        case "code": return <i className='fa fa-file-code-o' aria-hidden='true' style={{color: "#0078D7"}}></i>
        case "file": return <i className='fa fa-file-text-o' aria-hidden='true'></i>
        case "pdf": return <i className='fa fa-file-pdf-o' aria-hidden='true' style={{color: "#F40F02"}}></i>
    }
}

function fileDateConvert(file: ParsedFile | Directory) {
    if (!isParsedFile(file) || file.LastModified === undefined) return "";
    return new Date(file.LastModified).toISOString().split('T')[0].replaceAll('-','/');
}

export function drawRows(dir: Directory, path: string[], client: S3Client, bucketName: string, 
                         setErrMsg: Function, setDirectory: Function, setProgress: Function, stateRef: React.MutableRefObject<DownloadProgress>):JSX.Element[] {
    let result = [];
    for (let k in Object.keys(dir)) {
        const obj = dir[Object.keys(dir)[k]];
        let newPath: string[] = path;
        if (!isParsedFile(obj)) {
            newPath = [...path]; newPath.push(Object.keys(dir)[k]);
        }
        result.push(
            <div className="file-row-container" key={k} onClick={() => {
                if (isParsedFile(obj)) {downloadItem(client, bucketName, obj, setErrMsg, setProgress, stateRef)}
                else {
                    setDirectory(newPath);
                }
                }}>
                <div className="file-btn">{fileIconConvert(obj)}</div>
                <div className="file-name">{Object.keys(dir)[k]}</div>
                <div className="file-name">{fileDateConvert(obj)}</div>
                <div className="file-size">{isParsedFile(obj) ? fileSizeConvert(obj.Size) : ""}</div>
            </div>
        )
    }
    return result;    
}
