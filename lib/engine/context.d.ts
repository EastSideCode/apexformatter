import { CommentBucket } from './comments.js';
import { type Model } from './model.js';
import { Node } from './node.js';
import type { DocBuilder } from './builder.js';
import type { Doc } from './doc.js';
export type ChainingContext = {
    is_top_most_in_a_chain: boolean;
    is_parent_a_chaining_node: boolean;
};
/** Source and comment state belongs to exactly one format operation. */
export declare class FormatContext {
    source_code: string;
    comment_map: Map<number, CommentBucket>;
    constructor(source_code: string);
    set_source_code(source: string): void;
    set_comment_map(map: Map<number, CommentBucket>): void;
    get_comment_bucket(id: number): CommentBucket;
    assert_no_missing_comments(): void;
    collect_comments(node: Node, map?: Map<number, CommentBucket>): void;
    build_with_comments(builder: DocBuilder, id: number, result: Doc[], build: (b: DocBuilder, result: Doc[]) => unknown): void;
    handle_dangling_comments_in_bracket_surround(builder: DocBuilder, bucket: CommentBucket, result: Doc[]): void;
    handle_dangling_comments(builder: DocBuilder, bucket: CommentBucket): Doc[];
    handle_pre_comments(builder: DocBuilder, bucket: CommentBucket, result: Doc[]): void;
    handle_post_comments(builder: DocBuilder, bucket: CommentBucket, result: Doc[]): void;
    enrich(tree: {
        root: Node;
    } | Node): Model;
    assert_check(node: Node, expectedKind: string): void;
    get_precedence(operator: string): number;
    is_binary_exp(node: Node): boolean;
    is_query_expression(node: Node): boolean;
    binary_exp(node: Node): boolean;
    query_expression(node: Node): boolean;
    get_comparsion(node: Node): Model;
    build_chaining_context(node: Node): ChainingContext | null;
    is_chaining_node(node: Node): boolean;
    chaining_node(node: Node): boolean;
    panic_unknown_node(node: Node, name: string): never;
    is_bracket_composite_node(node: Node): boolean;
    bracket_composite_node(node: Node): boolean;
}
