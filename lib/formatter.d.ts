import { Config } from './engine/config.js';
export { FormatterError } from './errors.js';
export { Config } from './engine/config.js';
export { formatApex, formatOne } from './engine/engine.js';
export type FormatMode = 'write' | 'check' | 'dry-run';
export type FormatOptions = {
    paths: string[];
    configPath?: string;
    mode: FormatMode;
};
export type FormatError = {
    path?: string;
    code: string;
    message: string;
};
export type FileResult = {
    path: string;
    status: 'changed' | 'unchanged' | 'error';
    written: boolean;
    formatted?: string;
    error?: {
        code: string;
        message: string;
    };
};
export type FormatResult = {
    mode: FormatMode;
    scannedFiles: number;
    changedFiles: number;
    unchangedFiles: number;
    writtenFiles: number;
    changedPaths: string[];
    files: FileResult[];
    errors: FormatError[];
};
export type FormatterDependencies = {
    formatSource?: (source: string, config: Config) => Promise<string>;
};
/** Format a batch locally; any preflight/parse/format error prevents all writes. */
export declare function formatPaths(options: FormatOptions, dependencies?: FormatterDependencies): Promise<FormatResult>;
