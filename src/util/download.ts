import { S3Client, GetObjectCommand, GetObjectCommandInput } from "@aws-sdk/client-s3";
import { isParsedFile } from './fs';
import { Buffer } from 'buffer';

import { notification } from 'antd';
import { getCache, setCache } from './cache';

async function initializeStream(client: S3Client, bucketName: string, key: string, size: number, setProgress: Function) {
    const queryCommand: GetObjectCommandInput = {
        Key: key, Bucket: bucketName
    };
    const command = new GetObjectCommand(queryCommand);
    const response = await client.send(command);
    const data = response.Body

    if (data === undefined) throw new Error("No response from AWS S3 Service");
    const reader = (data as ReadableStream).getReader();
    return new ReadableStream(
        {
            start(controller) {
                let downloaded = 0;
                function push() {
                    reader.read().then(({done, value}) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        downloaded += (value as Uint8Array).length;
                        setProgress({ currSize: downloaded, allSize: size });
                        controller.enqueue(value);
                        push();
                    })
                }
                push();
            }
        }
    )
}

export async function downloadItem(client: S3Client, bucketName: string, file: ParsedFile | undefined | Directory,
                                   setErrMsg: Function, setProgress: Function) {
    if (!isParsedFile(file)) return;
    let cache_str = undefined;
    try {
        cache_str = await getCache(file.Key, file.ETag);
    } catch(e) { console.error(e); }
    
    let result: Uint8Array | undefined = undefined;
    if (cache_str === undefined) {
        setProgress({currSize: 0, allSize: file.Size});
        notification.info({
            message: "Downloading ...",
            description: "Your file " + file.DisplayName +" is downloading in the background."
        });
        result = await initializeStream(client, bucketName, file.Key, file.Size, setProgress)
            .then(
                stream => {
                    return new Response(stream).arrayBuffer();
                }
            )
            .then(
                result => {
                    try {
                        setCache(file.Key, file.ETag, Buffer.from(new Uint8Array(result)).toString("base64"))
                    } catch (error) {
                        setErrMsg(error);
                        console.warn(error);
                    }
                    setProgress({currSize: 0, allSize: 0});
                    notification.success({
                        message: "Downloaded",
                        description: "The file " + file.DisplayName + " is downloaded! Please save it on the pop-up window."
                    });
                    return new Uint8Array(result);
                }
            ).catch(
                (e) => {
                    console.debug(e);
                    notification.error({
                        message: "Failed to download",
                        description: e + ""
                    });
                    throw new Error("Failed to download file!");
                }
            )
    } else {
        notification.success({
            message: "File Loaded",
            description: "The file " + file.DisplayName + " is loaded from local cache."
        });
        result = new Uint8Array(Buffer.from(cache_str, "base64"));
    }
    

    if (result === undefined) throw new Error("Unable to load file!");
    
    const blob = new Blob([result]);
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = file.DisplayName;
    link.click();
}
