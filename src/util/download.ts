import { S3Client, GetObjectCommand, GetObjectCommandInput } from "@aws-sdk/client-s3";
import { isParsedFile } from './fs';
import { Buffer } from 'buffer';
// import * as CacheCore from '../util/cache';

import { notification } from 'antd';

async function initializeStream(client: S3Client, bucketName: string, key: string) {
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
                function push() {
                    reader.read().then(({done, value}) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        controller.enqueue(value);
                        push();
                    })
                }
                push();
            }
        }
    )
}

export async function downloadItem(client: S3Client, bucketName: string, file: ParsedFile | undefined | Directory, setErrMsg: Function) {
    if (!isParsedFile(file)) return;
    const cache_str = sessionStorage.getItem(file.Key);
    // const cache_str = await CacheCore.ReadCache(file.Key);
    let result: Uint8Array | undefined = undefined;
    if (cache_str === null) {
        notification.info({
            message: "Downloading ...",
            description: "Your file " + file.DisplayName +" is downloading in the background."
        });
        result = await initializeStream(client, bucketName, file.Key)
            .then(
                stream => {
                    return new Response(stream).arrayBuffer();
                }
            )
            .then(
                result => {
                    try {
                        // CacheCore.WriteCache({
                        //     fileKey: file.Key,
                        //     fileName: file.DisplayName,
                        //     data: Buffer.from(new Uint8Array(result)).toString("base64"),
                        //     version: file.LastModified === undefined ? new Date() : file.LastModified,
                        //     sequenceNum: 0
                        // });
                        sessionStorage.setItem(file.Key, Buffer.from(new Uint8Array(result)).toString("base64"));
                    } catch (error) {
                        // CacheCore.clearCache(setErrMsg);
                        // setErrMsg(error);
                        // setErrMsg("The file is too big to be cached in browser!");
                        console.warn(error);
                    }
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
