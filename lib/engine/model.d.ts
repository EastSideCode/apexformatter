import type { Doc } from './doc.js';
import type { DocBuilder } from './builder.js';
import type { FormatContext } from './context.js';
/** Model names are registered once; mutable format state belongs to the context. */
export declare class Model {
    readonly context: FormatContext;
    [key: string]: any;
    constructor(context: FormatContext);
    build(builder: DocBuilder): Doc;
    build_inner(_builder: DocBuilder, _result: Doc[]): void;
}
type ModelConstructor = new (context: FormatContext, ...args: any[]) => Model;
export declare function register(name: string, constructor: ModelConstructor): void;
export declare function create(name: string, context: FormatContext, ...args: any[]): Model;
export declare function make(name: string, context: FormatContext, variant: string, value?: any): Model;
export {};
