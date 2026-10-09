import { Comment, CommentBucket } from './comments.js';
import { create, make, type Model } from './model.js';
import { Node } from './node.js';
import type { DocBuilder } from './builder.js';
import type { Doc } from './doc.js';

export type ChainingContext = { is_top_most_in_a_chain: boolean; is_parent_a_chaining_node: boolean };

const precedence = new Map<string, number>();
for (const operator of ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=']) precedence.set(operator, 1);
for (const operator of ['?', ':']) precedence.set(operator, 2);
for (const operator of ['||', '??']) precedence.set(operator, 3);
precedence.set('&&', 5);
precedence.set('|', 6);
precedence.set('^', 7);
precedence.set('&', 8);
for (const operator of ['==', '!=', '===', '!==', '<>']) precedence.set(operator, 9);
for (const operator of ['>', '<', '>=', '<=', 'instanceof']) precedence.set(operator, 10);
for (const operator of ['<<', '>>', '>>>']) precedence.set(operator, 11);
for (const operator of ['+', '-']) precedence.set(operator, 12);
for (const operator of ['*', '/', '%']) precedence.set(operator, 13);
for (const operator of ['!', '~', '++', '--']) precedence.set(operator, 14);

/** Source and comment state belongs to exactly one format operation. */
export class FormatContext {
  public comment_map = new Map<number, CommentBucket>();
  public constructor(public source_code: string) {}

  public set_source_code(source: string): void { this.source_code = source; }
  public set_comment_map(map: Map<number, CommentBucket>): void { this.comment_map = map; }
  public get_comment_bucket(id: number): CommentBucket {
    const bucket = this.comment_map.get(id);
    if (!bucket) throw new Error(`Comment bucket is missing for node ${id}.`);
    return bucket;
  }

  public assert_no_missing_comments(): void {
    let missing = 0;
    for (const bucket of this.comment_map.values()) {
      for (const comment of [...bucket.pre_comments, ...bucket.post_comments, ...bucket.dangling_comments]) {
        if (!comment.is_printed()) missing += 1;
      }
    }
    if (missing) throw new Error(`Formatter did not print ${missing} comment node(s).`);
  }

  public collect_comments(node: Node, map = this.comment_map): void {
    if (!node.is_named || node.is_extra) return;
    if (!map.has(node.id)) map.set(node.id, new CommentBucket());
    const children = node.children;
    if (!children.length) return;
    let pending: Comment[] = [];
    let lastCode: { id: number; endRow: number } | null = null;
    const bucketFor = (id: number): CommentBucket => {
      let bucket = map.get(id);
      if (!bucket) {
        bucket = new CommentBucket();
        map.set(id, bucket);
      }
      return bucket;
    };
    for (const child of children) {
      if (!child.is_named) continue;
      if (child.is_extra) {
        const comment = Comment.from_node(child, this);
        if (lastCode && child.end_row === lastCode.endRow) bucketFor(lastCode.id).post_comments.push(comment);
        else pending.push(comment);
      } else {
        if (pending.length) {
          bucketFor(child.id).pre_comments.push(...pending);
          pending = [];
        }
        this.collect_comments(child, map);
        lastCode = { id: child.id, endRow: child.end_row };
      }
    }
    if (lastCode) bucketFor(lastCode.id).post_comments.push(...pending);
    else bucketFor(node.id).dangling_comments.push(...pending);
  }

  public build_with_comments(builder: DocBuilder, id: number, result: Doc[], build: (b: DocBuilder, result: Doc[]) => unknown): void {
    const bucket = this.get_comment_bucket(id);
    this.handle_pre_comments(builder, bucket, result);
    if (bucket.dangling_comments.length) {
      result.push(builder.concat(this.handle_dangling_comments(builder, bucket)));
      return;
    }
    build(builder, result);
    this.handle_post_comments(builder, bucket, result);
  }

  public handle_dangling_comments_in_bracket_surround(builder: DocBuilder, bucket: CommentBucket, result: Doc[]): void {
    result.push(builder.txt('{'), builder.indent(builder.nl()),
      builder.indent(builder.concat(this.handle_dangling_comments(builder, bucket))), builder.nl(), builder.txt('}'));
  }

  public handle_dangling_comments(builder: DocBuilder, bucket: CommentBucket): Doc[] {
    if (!bucket.dangling_comments.length) throw new Error('Dangling-comment handling requires at least one comment.');
    const docs: Doc[] = [];
    for (const comment of bucket.dangling_comments) {
      if (comment.has_leading_content) docs.push(builder.txt(' '));
      else if (comment.has_newline_above) docs.push(builder.nl_with_no_indent(), builder.nl());
      else if (comment.has_prev_node) docs.push(builder.nl());
      docs.push(comment.build(builder));
      comment.mark_as_printed();
    }
    return docs;
  }

  public handle_pre_comments(builder: DocBuilder, bucket: CommentBucket, result: Doc[]): void {
    if (!bucket.pre_comments.length) return;
    const docs: Doc[] = [];
    bucket.pre_comments.forEach((comment, index) => {
      if (comment.has_leading_content) docs.push(builder.txt(' '));
      else {
        docs.push(builder.force_break());
        if (index !== 0) {
          if (comment.has_newline_above) docs.push(builder.nl_with_no_indent());
          docs.push(builder.nl());
        }
      }
      docs.push(comment.build(builder));
      if (comment.has_trailing_content) docs.push(builder.txt(' '));
      else if (index === bucket.pre_comments.length - 1) {
        if (comment.has_newline_below) docs.push(builder.nl_with_no_indent());
        docs.push(builder.nl());
      }
      comment.mark_as_printed();
    });
    result.push(builder.concat(docs));
  }

  public handle_post_comments(builder: DocBuilder, bucket: CommentBucket, result: Doc[]): void {
    if (!bucket.post_comments.length) return;
    const docs: Doc[] = [];
    for (const comment of bucket.post_comments) {
      if (comment.has_leading_content) docs.push(builder.txt(' '));
      else if (comment.has_newline_above) docs.push(builder.nl_with_no_indent(), builder.nl());
      else docs.push(builder.nl());
      docs.push(comment.build(builder));
      if (comment.has_trailing_content && !comment.is_followed_by_bracket_composite_node) docs.push(builder.txt(' '));
      if (comment.metadata.is_line_comment_and_need_newline) docs.push(builder.nl_when_in_flat());
      comment.mark_as_printed();
    }
    result.push(builder.concat(docs));
  }

  public enrich(tree: { root: Node } | Node): Model { return create('Root', this, tree instanceof Node ? tree : tree.root); }
  public assert_check(node: Node, expectedKind: string): void {
    if (node.kind !== expectedKind) throw new Error(`Expected node kind ${expectedKind}; found ${node.kind} at byte ${node.start_byte}.`);
  }
  public get_precedence(operator: string): number {
    const value = precedence.get(operator);
    if (value === undefined) throw new Error(`Unsupported operator: ${operator}`);
    return value;
  }
  public is_binary_exp(node: Node): boolean { return node.kind === 'binary_expression'; }
  public is_query_expression(node: Node): boolean { return node.kind === 'query_expression'; }
  public binary_exp(node: Node): boolean { return this.is_binary_exp(node); }
  public query_expression(node: Node): boolean { return this.is_query_expression(node); }

  public get_comparsion(node: Node): Model {
    const valueOperator = node.try_c_by_k('value_comparison_operator');
    if (valueOperator) {
      const next = valueOperator.next_named;
      const comparedWith = next.kind === 'bound_apex_expression'
        ? make('ValueComparedWith', this, 'bound', create('BoundApexExpression', this, next))
        : make('ValueComparedWith', this, 'literal', create('SoqlLiteral', this, next));
      return make('Comparison', this, 'value', create('ValueComparison', this, valueOperator.value, comparedWith));
    }
    const setOperator = node.try_c_by_k('set_comparison_operator');
    if (setOperator) return make('Comparison', this, 'set',
      create('SetComparison', this, setOperator.value, create('SetValue', this, setOperator.next_named)));
    throw new Error('A comparison node has no supported comparison operator.');
  }

  public build_chaining_context(node: Node): ChainingContext | null {
    const parent = node.parent;
    if (!parent) throw new Error('Chaining-context construction requires a parent node.');
    const parentChains = this.is_chaining_node(parent);
    const object = node.try_c_by_n('object');
    const childChains = object ? this.is_chaining_node(object) : false;
    if (!parentChains && !childChains) return null;
    return { is_top_most_in_a_chain: childChains && !parentChains, is_parent_a_chaining_node: parentChains };
  }

  public is_chaining_node(node: Node): boolean {
    return ['method_invocation', 'array_access', 'field_access', 'query_expression'].includes(node.kind);
  }
  public chaining_node(node: Node): boolean { return this.is_chaining_node(node); }
  public panic_unknown_node(node: Node, name: string): never {
    throw new Error(`Unsupported node ${node.kind} in ${name} at byte ${node.start_byte}.`);
  }
  public is_bracket_composite_node(node: Node): boolean {
    return ['trigger_body', 'class_body', 'block', 'enum_body'].includes(node.kind);
  }
  public bracket_composite_node(node: Node): boolean { return this.is_bracket_composite_node(node); }
}
