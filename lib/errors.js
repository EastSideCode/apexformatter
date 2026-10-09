export class FormatterError extends Error {
    code;
    constructor(code, message, options) {
        super(message, options);
        this.code = code;
        this.name = 'FormatterError';
    }
}
export function errorInfo(error, fallback = 'FORMAT_ERROR') {
    return {
        code: error instanceof FormatterError ? error.code : fallback,
        message: error instanceof Error ? error.message : String(error),
    };
}
//# sourceMappingURL=errors.js.map