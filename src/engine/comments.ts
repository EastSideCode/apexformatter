import type { Buildable, DocBuilder } from './builder.js';
import type { FormatContext } from './context.js';
import type { Doc } from './doc.js';
import type { Node } from './node.js';

export class CommentBucket {
  public readonly pre_comments: Comment[] = [];
  public readonly post_comments: Comment[] = [];
  public readonly dangling_comments: Comment[] = [];
}

type CommentType = 'line' | 'block';

export class Comment implements Buildable {
  private printed = false;
  public constructor(
    public readonly value: string,
    public readonly comment_type: CommentType,
    public readonly metadata: CommentMetadata,
  ) {}

  public static from_node(node: Node, context: FormatContext): Comment {
    const value = node.value.replace(/[\u0000\t\n\v\f\r ]+$/u, '');
    if (node.kind === 'line_comment') return new Comment(value, 'line', CommentMetadata.from(node, 'line', context));
    if (node.kind === 'block_comment') return new Comment(value, 'block', CommentMetadata.from(node, 'block', context));
    return context.panic_unknown_node(node, 'Comment');
  }

  public get has_leading_content(): boolean { return this.metadata.has_leading_content; }
  public get has_trailing_content(): boolean { return this.metadata.has_trailing_content; }
  public get has_newline_above(): boolean { return this.metadata.has_newline_above; }
  public get is_followed_by_bracket_composite_node(): boolean { return this.metadata.is_followed_by_bracket_composite_node; }
  public get has_newline_below(): boolean { return this.metadata.has_newline_below; }
  public get has_prev_node(): boolean { return this.metadata.has_prev_node; }
  public mark_as_printed(): void { this.printed = true; }
  public is_printed(): boolean { return this.printed; }

  public build(builder: DocBuilder): Doc {
    const result: Doc[] = [];
    this.build_inner(builder, result);
    return builder.concat(result);
  }

  public build_inner(builder: DocBuilder, result: Doc[]): void {
    if (this.comment_type === 'line') {
      result.push(builder.txt(this.value));
      return;
    }
    const lines = this.value.split('\n');
    lines.forEach((line, index) => {
      result.push(builder.txt(line.replace(/^[\u0000\t\n\v\f\r ]+|[\u0000\t\n\v\f\r ]+$/gu, '')));
      if (index < lines.length - 1) result.push(builder.nl());
    });
  }
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

export class CommentMetadata implements MetadataValues {
  public readonly has_leading_content: boolean;
  public readonly has_trailing_content: boolean;
  public readonly has_newline_above: boolean;
  public readonly has_newline_below: boolean;
  public readonly has_prev_node: boolean;
  public readonly is_followed_by_bracket_composite_node: boolean;
  public readonly is_line_comment_and_need_newline: boolean;

  public constructor(fields: MetadataValues) {
    this.has_leading_content = fields.has_leading_content;
    this.has_trailing_content = fields.has_trailing_content;
    this.has_newline_above = fields.has_newline_above;
    this.has_newline_below = fields.has_newline_below;
    this.has_prev_node = fields.has_prev_node;
    this.is_followed_by_bracket_composite_node = fields.is_followed_by_bracket_composite_node;
    this.is_line_comment_and_need_newline = fields.is_line_comment_and_need_newline;
  }

  public static from(node: Node, type: CommentType, context: FormatContext): CommentMetadata {
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

  public static line_comment_and_need_newline(node: Node, type: CommentType, context: FormatContext): boolean {
    if (type !== 'line') return false;
    const parent = node.parent;
    if (!parent || context.is_bracket_composite_node(parent) || parent.kind === 'parser_output') return false;
    if (node.prev_named_sibling?.kind === 'annotation') return false;
    return node.next_sibling !== null;
  }
}
