export declare class ArgumentJsonError {
    clientJson: any;
    httpCode: number;
    constructor(clientJson: any, httpCode?: number);
}
export declare class ArgumentError extends ArgumentJsonError {
    message: string;
    constructor(message: string, httpCode?: number);
}
export declare class AccessDeniedError extends ArgumentError {
    constructor(message: string);
}
