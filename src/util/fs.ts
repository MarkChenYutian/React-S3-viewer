import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const pdfPostfix = new Set(["pdf", "xdv"]);
const codePostfix = new Set(["py", "js", "tex", "rs", "java", "c", "h", "ts"]);

export function isParsedFile(object: any): object is ParsedFile {
    if (object === undefined || object === null) return false;
    return 'DisplayName' in object && 'Key' in object && 'Size' in object && 'LastModified' in object && 'Type' in object;
}

function typeMapper(fileName: string) {
    const tok = fileName.split(".");
    if (pdfPostfix.has(tok[tok.length - 1].toLowerCase())) return "pdf";
    if (codePostfix.has(tok[tok.length - 1].toLowerCase())) return "code";
    return "file";
}

function preprocessFiles(files: AWSFileObject[]): ParsedFile[] {
    return files.map(
        (file: AWSFileObject): ParsedFile => {return {
                DisplayName: file.Key === undefined ? "" : file.Key,
                Key: file.Key === undefined ? "" : file.Key,
                Size: file.Size === undefined ? 0 : file.Size,
                LastModified: file.LastModified,
                ETag: file.ETag,
                Type: typeMapper(file.Key === undefined ? "" : file.Key)
            };
        });
}

function parseFileStructure(files: ParsedFile[]) {
    return Object.values(
        files.reduce(
        (previousValue: ParsingDir, currentValue: ParsedFile): ParsingDir => {
            if (currentValue.DisplayName === "") { return previousValue; }
            previousValue[currentValue.DisplayName.split("/")[0]] === undefined ?
                previousValue[currentValue.DisplayName.split("/")[0]] = [currentValue] : 
                previousValue[currentValue.DisplayName.split("/")[0]].push(currentValue);
            return previousValue;
        }, {})
        )
        .reduce(
        (previousValue: Directory, currentValue: ParsedFile[]): Directory => {
            if (currentValue.length === 0) return previousValue;
            if (currentValue[0].DisplayName.split("/").length === 1) {
                previousValue[currentValue[0].DisplayName] = currentValue[0]
            } else {
                previousValue[currentValue[0].DisplayName.split("/")[0]] = parseFileStructure(currentValue.map(
                    (value: ParsedFile): ParsedFile => {
                        return {
                            DisplayName: value.DisplayName.split("/").slice(1,).join("/"),
                            Key: value.Key,
                            Size: value.Size,
                            LastModified: value.LastModified,
                            ETag: value.ETag,
                            Type: value.Type
                        }
                    }
                ))
            }
            return previousValue;
        }, {})
}

function isValidDirectory(dir: string[], file: Directory) {
    for (let i = 0; i < dir.length; i ++) {
        const next = file[dir[i]];
        if (next === undefined) return false;
        if (isParsedFile(next)) return false;
        file = next;
    }
    return true;
}

function getDirectory(dir: string[], file: Directory): Directory {
    if (!isValidDirectory(dir, file)) return file;
    for (let i = 0; i < dir.length; i ++) {
        const next = file[dir[i]];
        if (next === undefined) return file;
        if (isParsedFile(next)) return file;
        file = next;
    }
    return file;
}

function fetchAndLoad( 
                    client: S3Client,
                    bucketName: string,
                    directory: string[],
                    setErrMsg: Function,
                    setFiles: Function ){
    const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "",
    });
    client.send(listCommand)
        .then((output) => {
            sessionStorage.setItem("rawFile", 
                JSON.stringify(
                    preprocessFiles(output.Contents === undefined ? [] : output.Contents)
                )
            );

            const fileStruct = parseFileStructure(
                preprocessFiles(output.Contents === undefined ? [] : output.Contents)
            );
            sessionStorage.setItem("files", JSON.stringify(fileStruct));
            setFiles(getDirectory(directory, fileStruct));
        })
        .catch((e) => { setErrMsg("" + e); });
}

export function loadDirectory(client: S3Client, bucketName: string, directory: string[], setErrMsg: Function, setFiles: Function) {
    const cache = sessionStorage.getItem("files");
    if (cache === null) {
        fetchAndLoad(client, bucketName, directory, setErrMsg, setFiles);
    } else {
        // console.log("getDirectory", directory, getDirectory(directory, JSON.parse(cache)));
        setFiles(
            getDirectory(directory, JSON.parse(cache))
        );
    }
}
