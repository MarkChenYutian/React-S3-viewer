export function dirBackRow(directory: string[], setDirectory: Function) {
    if (directory.length === 0) return undefined;
    return (
        <div className="file-row-container" onClick={() => {setDirectory(directory.slice(undefined,-1));}}>
            <div className="file-btn"><i className='fa fa-folder-open-o' aria-hidden='true' style={{color: "#FDB900"}}></i></div>
            <div className="file-name">..</div>
            <div className="file-name"></div>
            <div className="file-size"></div>
        </div>
    )
}