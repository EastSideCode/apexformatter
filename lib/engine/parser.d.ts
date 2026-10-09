import { Parser, type Tree as RawTree } from 'web-tree-sitter';
import { Node } from './node.js';
export declare class Tree {
    private readonly raw;
    private readonly parser;
    readonly root: Node;
    private deleted;
    constructor(raw: RawTree, parser: Parser, source: string);
    delete(): void;
}
/** Each parse owns its tree/parser; only the immutable WASM language is shared. */
export declare function parseSource(source: string): Promise<Tree>;
