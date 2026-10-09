import { Comment, CommentBucket } from './comments.js';
import { create, make } from './model.js';
import { Node } from './node.js';
const precedence = new Map();
for (const operator of ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>='])
    precedence.set(operator, 1);
for (const operator of ['?', ':'])
    precedence.set(operator, 2);
for (const operator of ['||', '??'])
    precedence.set(operator, 3);
precedence.set('&&', 5);
precedence.set('|', 6);
precedence.set('^', 7);
precedence.set('&', 8);
for (const operator of ['==', '!=', '===', '!==', '<>'])
    precedence.set(operator, 9);
for (const operator of ['>', '<', '>=', '<=', 'instanceof'])
    precedence.set(operator, 10);
for (const operator of ['<<', '>>', '>>>'])
    precedence.set(operator, 11);
for (const operator of ['+', '-'])
    precedence.set(operator, 12);
for (const operator of ['*', '/', '%'])
    precedence.set(operator, 13);
for (const operator of ['!', '~', '++', '--'])
    precedence.set(operator, 14);
/** Source and comment state belongs to exactly one format operation. */
export class FormatContext {
    source_code;
    comment_map = new Map();
    constructor(source_code) {
        this.source_code = source_code;
    }
    set_source_code(source) { this.source_code = source; }
    set_comment_map(map) { this.comment_map = map; }
    get_comment_bucket(id) {
        const bucket = this.comment_map.get(id);
        if (!bucket)
            throw new Error(`Comment bucket is missing for node ${id}.`);
        return bucket;
    }
    assert_no_missing_comments() {
        let missing = 0;
        for (const bucket of this.comment_map.values()) {
            for (const comment of [...bucket.pre_comments, ...bucket.post_comments, ...bucket.dangling_comments]) {
                if (!comment.is_printed())
                    missing += 1;
            }
        }
        if (missing)
            throw new Error(`Formatter did not print ${missing} comment node(s).`);
    }
    collect_comments(node, map = this.comment_map) {
        if (!node.is_named || node.is_extra)
            return;
        if (!map.has(node.id))
            map.set(node.id, new CommentBucket());
        const children = node.children;
        if (!children.length)
            return;
        let pending = [];
        let lastCode = null;
        const bucketFor = (id) => {
            let bucket = map.get(id);
            if (!bucket) {
                bucket = new CommentBucket();
                map.set(id, bucket);
            }
            return bucket;
        };
        for (const child of children) {
            if (!child.is_named)
                continue;
            if (child.is_extra) {
                const comment = Comment.from_node(child, this);
                if (lastCode && child.end_row === lastCode.endRow)
                    bucketFor(lastCode.id).post_comments.push(comment);
                else
                    pending.push(comment);
            }
            else {
                if (pending.length) {
                    bucketFor(child.id).pre_comments.push(...pending);
                    pending = [];
                }
                this.collect_comments(child, map);
                lastCode = { id: child.id, endRow: child.end_row };
            }
        }
        if (lastCode)
            bucketFor(lastCode.id).post_comments.push(...pending);
        else
            bucketFor(node.id).dangling_comments.push(...pending);
    }
    build_with_comments(builder, id, result, build) {
        const bucket = this.get_comment_bucket(id);
        this.handle_pre_comments(builder, bucket, result);
        if (bucket.dangling_comments.length) {
            result.push(builder.concat(this.handle_dangling_comments(builder, bucket)));
            return;
        }
        build(builder, result);
        this.handle_post_comments(builder, bucket, result);
    }
    handle_dangling_comments_in_bracket_surround(builder, bucket, result) {
        result.push(builder.txt('{'), builder.indent(builder.nl()), builder.indent(builder.concat(this.handle_dangling_comments(builder, bucket))), builder.nl(), builder.txt('}'));
    }
    handle_dangling_comments(builder, bucket) {
        if (!bucket.dangling_comments.length)
            throw new Error('Dangling-comment handling requires at least one comment.');
        const docs = [];
        for (const comment of bucket.dangling_comments) {
            if (comment.has_leading_content)
                docs.push(builder.txt(' '));
            else if (comment.has_newline_above)
                docs.push(builder.nl_with_no_indent(), builder.nl());
            else if (comment.has_prev_node)
                docs.push(builder.nl());
            docs.push(comment.build(builder));
            comment.mark_as_printed();
        }
        return docs;
    }
    handle_pre_comments(builder, bucket, result) {
        if (!bucket.pre_comments.length)
            return;
        const docs = [];
        bucket.pre_comments.forEach((comment, index) => {
            if (comment.has_leading_content)
                docs.push(builder.txt(' '));
            else {
                docs.push(builder.force_break());
                if (index !== 0) {
                    if (comment.has_newline_above)
                        docs.push(builder.nl_with_no_indent());
                    docs.push(builder.nl());
                }
            }
            docs.push(comment.build(builder));
            if (comment.has_trailing_content)
                docs.push(builder.txt(' '));
            else if (index === bucket.pre_comments.length - 1) {
                if (comment.has_newline_below)
                    docs.push(builder.nl_with_no_indent());
                docs.push(builder.nl());
            }
            comment.mark_as_printed();
        });
        result.push(builder.concat(docs));
    }
    handle_post_comments(builder, bucket, result) {
        if (!bucket.post_comments.length)
            return;
        const docs = [];
        for (const comment of bucket.post_comments) {
            if (comment.has_leading_content)
                docs.push(builder.txt(' '));
            else if (comment.has_newline_above)
                docs.push(builder.nl_with_no_indent(), builder.nl());
            else
                docs.push(builder.nl());
            docs.push(comment.build(builder));
            if (comment.has_trailing_content && !comment.is_followed_by_bracket_composite_node)
                docs.push(builder.txt(' '));
            if (comment.metadata.is_line_comment_and_need_newline)
                docs.push(builder.nl_when_in_flat());
            comment.mark_as_printed();
        }
        result.push(builder.concat(docs));
    }
    enrich(tree) { return create('Root', this, tree instanceof Node ? tree : tree.root); }
    assert_check(node, expectedKind) {
        if (node.kind !== expectedKind)
            throw new Error(`Expected node kind ${expectedKind}; found ${node.kind} at byte ${node.start_byte}.`);
    }
    get_precedence(operator) {
        const value = precedence.get(operator);
        if (value === undefined)
            throw new Error(`Unsupported operator: ${operator}`);
        return value;
    }
    is_binary_exp(node) { return node.kind === 'binary_expression'; }
    is_query_expression(node) { return node.kind === 'query_expression'; }
    binary_exp(node) { return this.is_binary_exp(node); }
    query_expression(node) { return this.is_query_expression(node); }
    get_comparsion(node) {
        const valueOperator = node.try_c_by_k('value_comparison_operator');
        if (valueOperator) {
            const next = valueOperator.next_named;
            const comparedWith = next.kind === 'bound_apex_expression'
                ? make('ValueComparedWith', this, 'bound', create('BoundApexExpression', this, next))
                : make('ValueComparedWith', this, 'literal', create('SoqlLiteral', this, next));
            return make('Comparison', this, 'value', create('ValueComparison', this, valueOperator.value, comparedWith));
        }
        const setOperator = node.try_c_by_k('set_comparison_operator');
        if (setOperator)
            return make('Comparison', this, 'set', create('SetComparison', this, setOperator.value, create('SetValue', this, setOperator.next_named)));
        throw new Error('A comparison node has no supported comparison operator.');
    }
    build_chaining_context(node) {
        const parent = node.parent;
        if (!parent)
            throw new Error('Chaining-context construction requires a parent node.');
        const parentChains = this.is_chaining_node(parent);
        const object = node.try_c_by_n('object');
        const childChains = object ? this.is_chaining_node(object) : false;
        if (!parentChains && !childChains)
            return null;
        return { is_top_most_in_a_chain: childChains && !parentChains, is_parent_a_chaining_node: parentChains };
    }
    is_chaining_node(node) {
        return ['method_invocation', 'array_access', 'field_access', 'query_expression'].includes(node.kind);
    }
    chaining_node(node) { return this.is_chaining_node(node); }
    panic_unknown_node(node, name) {
        throw new Error(`Unsupported node ${node.kind} in ${name} at byte ${node.start_byte}.`);
    }
    is_bracket_composite_node(node) {
        return ['trigger_body', 'class_body', 'block', 'enum_body'].includes(node.kind);
    }
    bracket_composite_node(node) { return this.is_bracket_composite_node(node); }
}
//# sourceMappingURL=context.js.map