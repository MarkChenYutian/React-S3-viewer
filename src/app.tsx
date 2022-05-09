import 'antd/lib/notification/style/index.css';

import { useState } from "react";

import { S3Client } from "@aws-sdk/client-s3";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

import { loadDirectory } from "./util/fs";
import { drawRows } from "./components/fileEntry";
import { dirBackRow } from "./components/returnEntry";
import { goHome, reload } from "./util/interface";
// import ProgressBar from './components/progress';
import { notification } from 'antd';
// import * as CacheCore from './util/cache';

const bucketName = 'yutian-public';
const region = 'us-east-1';
const client = new S3Client({
    region,
    credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region }),
        identityPoolId: "us-east-1:0d7c101f-bcad-4d42-9723-1c7a75792a69"
    })
});

function wechatWarning(): JSX.Element | undefined {
    const ua = navigator.userAgent.toLowerCase().match(/MicroMessenger/i);
    if (ua !== null && ua[0] === "micromessenger") {
        return (
            <div className="notification" style={{display: "none"}}>
                <h3>Do NOT use the WeChat Browser</h3>
                <p>Files can't be downloaded under wechat browser. Please use the default browser on your device instead.</p>
            </div>
        )
    }
}

function App() {
    const [files, setFiles] = useState<Directory>();
    const [directory, setDirectory] = useState<string[]>([]);

    const setErrMsg = (e: string) => {
        notification.warning(
            {
                message: "Warning",
                description: e + ""
            }
        );
    }
    const updateDirectory = (newdir: string[]) => {
        setDirectory(newdir);
        loadDirectory(client, bucketName, newdir, setErrMsg, setFiles);
    }
    const initializeFiles = (root: Directory) => {
        setFiles(root);
        // CacheCore.CheckCache(root);
    }

    if (files === undefined) {
        loadDirectory(client, bucketName, [], setErrMsg, initializeFiles);
        // CacheCore.initializeCache();
        return (<p>Loading ...</p>);
    } else {
        return (
            <div className="React-wrapper">
                {wechatWarning()}
                <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignContent: "center"}}>
                    <h2 id="app-path">Shared Files/{directory.join("/")}</h2>
                    <div>
                        <i  id="reload-btn"
                            className="fa fa-refresh"
                            style={{fontSize: "1.2rem", cursor: "pointer"}}
                            onClick={() => {reload(updateDirectory);}}/>
                        &nbsp;&nbsp;
                        <i  id="home-btn"
                            className="fa fa-home"
                            style={{fontSize: "1.2rem", cursor: "pointer"}}
                            onClick={() => {goHome(updateDirectory);}}/>
                    </div>
                </div>
                <div className="file-grid">
                    <div id="head" style={{display: "contents"}}>
                        <div></div>
                        <div className="file-name"><b>File Name</b></div>
                        <div className="file-name"><b>Last Modify</b></div>
                        <div className="file-size"><b>File Size</b></div>
                    </div>
                    <div style={{display: "contents"}}>
                        {dirBackRow(directory, updateDirectory)}
                        {drawRows(files, directory, client, bucketName, setErrMsg, updateDirectory)}
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
