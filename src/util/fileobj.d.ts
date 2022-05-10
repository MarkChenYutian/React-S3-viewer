interface AWSFileObject {
    LastModified?: Date | undefined;
    Key?: string | undefined;
    Size?: int | undefined;
    ETag?: string | undefined;
    StorageClass?: string | undefined;
};

interface ParsedFile {
    DisplayName: string;
    Key: string;
    Size: int;
    LastModified: Date | undefined;
    ETag: string | undefined;
    Type: "pdf" | "code" | "file";
}

interface ParsingDir {
    [Key: string]: ParsedFile[];
}

interface Directory {
    [Key: string]: Directory | ParsedFile ;
}

interface DownloadProgress {
    currSize: number,
    allSize: number
}

interface ProgressController {
    incr: (value: number, p: DownloadProgress) => void;
    init: (fileSize: number, p: DownloadProgress) => void;
    finish: (fileSize: number, p: DownloadProgress) => void;
}
