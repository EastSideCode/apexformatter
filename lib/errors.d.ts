export declare class FormatterError extends Error {
    readonly code: string;
    constructor(code: string, message: string, options?: ErrorOptions);
}
export declare function errorInfo(error: unknown, fallback?: string): {
    code: string;
    message: string;
};
