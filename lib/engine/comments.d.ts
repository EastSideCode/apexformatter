import type { Buildable, DocBuilder } from './builder.js';
import type { FormatContext } from './context.js';
import type { Doc } from './doc.js';
import type { Node } from './node.js';
export declare class CommentBucket {
    readonly pre_comments: Comment[];
    readonly post_comments: Comment[];
    readonly dangling_comments: Comment[];
}
type CommentType = 'line' | 'block';
export declare class Comment implements Buildable {
    readonly value: string;
    readonly comment_type: CommentType;
    readonly metadata: CommentMetadata;
    private printed;
    constructor(value: string, comment_type: CommentType, metadata: CommentMetadata);
    static from_node(node: Node, context: FormatContext): Comment;
    get has_leading_content(): boolean;
    get has_trailing_content(): boolean;
    get has_newline_above(): boolean;
    get is_followed_by_bracket_composite_node(): boolean;
    get has_newline_below(): boolean;
    get has_prev_node(): boolean;
    mark_as_printed(): void;
    is_printed(): boolean;
    build(builder: DocBuilder): Doc;
    build_inner(builder: DocBuilder, result: Doc[]): void;
}
type MetadataValues = {
    has_leading_content: boolean;
    has_trailing_content: boolean;
    has_newline_above: boolean;
    has_newline_below: boolean;
    has_prev_node: boolean;
    is_followed_by_bracket_composite_node: boolean;
    is_line_comment_and_need_newline: boolean;
};
export declare class CommentMetadata implements MetadataValues {
    readonly has_leading_content: boolean;
    readonly has_trailing_content: boolean;
    readonly has_newline_above: boolean;
    readonly has_newline_below: boolean;
    readonly has_prev_node: boolean;
    readonly is_followed_by_bracket_composite_node: boolean;
    readonly is_line_comment_and_need_newline: boolean;
    constructor(fields: MetadataValues);
    static from(node: Node, type: CommentType, context: FormatContext): CommentMetadata;
    static line_comment_and_need_newline(node: Node, type: CommentType, context: FormatContext): boolean;
}
export {};
