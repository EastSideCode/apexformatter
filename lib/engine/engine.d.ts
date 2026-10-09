import type { Config } from './config.js';
/** Parses and formats one source with per-file state and guaranteed tree cleanup. */
export declare function formatApex(source: string, config: Config): Promise<string>;
export declare const formatOne: typeof formatApex;
