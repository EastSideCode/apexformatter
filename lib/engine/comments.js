export class CommentBucket {
    pre_comments = [];
    post_comments = [];
    dangling_comments = [];
}
export class Comment {
    value;
    comment_type;
    metadata;
    printed = false;
    constructor(value, comment_type, metadata) {
        this.value = value;
        this.comment_type = comment_type;
        this.metadata = metadata;
    }
    static from_node(node, context) {
        const value = node.value.replace(/[\u0000\t\n\v\f\r ]+$/u, '');
        if (node.kind === 'line_comment')
            return new Comment(value, 'line', CommentMetadata.from(node, 'line', context));
        if (node.kind === 'block_comment')
            return new Comment(value, 'block', CommentMetadata.from(node, 'block', context));
        return context.panic_unknown_node(node, 'Comment');
    }
    get has_leading_content() { return this.metadata.has_leading_content; }
    get has_trailing_content() { return this.metadata.has_trailing_content; }
    get has_newline_above() { return this.metadata.has_newline_above; }
    get is_followed_by_bracket_composite_node() { return this.metadata.is_followed_by_bracket_composite_node; }
    get has_newline_below() { return this.metadata.has_newline_below; }
    get has_prev_node() { return this.metadata.has_prev_node; }
    mark_as_printed() { this.printed = true; }
    is_printed() { return this.printed; }
    build(builder) {
        const result = [];
        this.build_inner(builder, result);
        return builder.concat(result);
    }
    build_inner(builder, result) {
        if (this.comment_type === 'line') {
            result.push(builder.txt(this.value));
            return;
        }
        const lines = this.value.split('\n');
        lines.forEach((line, index) => {
            result.push(builder.txt(line.replace(/^[\u0000\t\n\v\f\r ]+|[\u0000\t\n\v\f\r ]+$/gu, '')));
            if (index < lines.length - 1)
                result.push(builder.nl());
        });
    }
}
export class CommentMetadata {
    has_leading_content;
    has_trailing_content;
    has_newline_above;
    has_newline_below;
    has_prev_node;
    is_followed_by_bracket_composite_node;
    is_line_comment_and_need_newline;
    constructor(fields) {
        this.has_leading_content = fields.has_leading_content;
        this.has_trailing_content = fields.has_trailing_content;
        this.has_newline_above = fields.has_newline_above;
        this.has_newline_below = fields.has_newline_below;
        this.has_prev_node = fields.has_prev_node;
        this.is_followed_by_bracket_composite_node = fields.is_followed_by_bracket_composite_node;
        this.is_line_comment_and_need_newline = fields.is_line_comment_and_need_newline;
    }
    static from(node, type, context) {
        const previous = node.prev_named_sibling;
        const next = node.next_named_sibling;
        return new CommentMetadata({
            has_prev_node: previous !== null,
            has_leading_content: previous ? node.start_row === previous.end_row : false,
            has_trailing_content: type === 'block' && next ? node.end_row === next.start_row : false,
            has_newline_above: previous ? node.start_row > previous.end_row + 1 : false,
            has_newline_below: next ? node.end_row < (next.start_row === 0 ? 0 : next.start_row - 1) : false,
            is_followed_by_bracket_composite_node: next ? context.is_bracket_composite_node(next) : false,
            is_line_comment_and_need_newline: CommentMetadata.line_comment_and_need_newline(node, type, context),
        });
    }
    static line_comment_and_need_newline(node, type, context) {
        if (type !== 'line')
            return false;
        const parent = node.parent;
        if (!parent || context.is_bracket_composite_node(parent) || parent.kind === 'parser_output')
            return false;
        if (node.prev_named_sibling?.kind === 'annotation')
            return false;
        return node.next_sibling !== null;
    }
}
//# sourceMappingURL=comments.js.map