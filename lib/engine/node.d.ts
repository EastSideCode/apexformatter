/** Structural view of web-tree-sitter nodes, kept independent of parser initialization. */
export interface RawNode {
    id: number;
    type: string;
    isNamed: boolean;
    isExtra: boolean;
    hasError: boolean;
    startIndex: number;
    endIndex: number;
    startPosition: {
        row: number;
        column: number;
    };
    endPosition: {
        row: number;
        column: number;
    };
    childCount: number;
    namedChildCount: number;
    children: RawNode[];
    namedChildren: RawNode[];
    parent: RawNode | null;
    nextSibling: RawNode | null;
    nextNamedSibling: RawNode | null;
    previousNamedSibling: RawNode | null;
    child(index: number): RawNode | null;
    namedChild(index: number): RawNode | null;
    childForFieldName(name: string): RawNode | null;
    fieldNameForChild(index: number): string | null;
}
declare class SourceView {
    readonly source: string;
    readonly byteOffsets: Uint32Array;
    readonly nodes: Map<number, Node>;
    constructor(source: string);
}
/** Snake-case wrapper preserves the Ruby model accessor contract. */
export declare class Node {
    private readonly raw;
    private readonly sourceView;
    constructor(raw: RawNode, source: string | SourceView);
    get id(): number;
    get kind(): string;
    get is_named(): boolean;
    get is_extra(): boolean;
    get has_error(): boolean;
    get start_byte(): number;
    get end_byte(): number;
    get start_row(): number;
    get end_row(): number;
    get child_count(): number;
    get named_child_count(): number;
    get value(): string;
    get parent(): Node | null;
    get next_sibling(): Node | null;
    get next_named_sibling(): Node | null;
    get prev_named_sibling(): Node | null;
    get children(): Node[];
    get named_children(): Node[];
    get children_vec(): Node[];
    get all_children_vec(): Node[];
    child(index: number): Node | null;
    named_child(index: number): Node | null;
    child_by_field_name(name: string): Node | null;
    field_name_for_child(index: number): string | null;
    try_c_by_k(kind: string): Node | null;
    try_cs_by_k(kind: string): Node[];
    try_c_by_n(name: string): Node | null;
    c_by_k(kind: string): Node;
    get try_first_c(): Node | null;
    get first_c(): Node;
    c_by_n(name: string): Node;
    cv_by_k(kind: string): string;
    cv_by_n(name: string): string;
    cvalue_by_n(name: string): string;
    cvalue_by_k(kind: string): string;
    cs_by_n(name: string): Node[];
    cs_by_k(kind: string): Node[];
    get next_named(): Node;
    private wrap;
}
export declare class NodeInfo {
    readonly id: number;
    constructor(id: number);
    static from(node: Node): NodeInfo;
}
export {};
