import type { Config } from './config.js';
import type { FormatContext } from './context.js';
import type { Doc } from './doc.js';
import type { Node } from './node.js';

export interface Buildable { build(builder: DocBuilder): Doc; }

const textValue = (text: unknown): string => text === null || text === undefined ? '' : String(text);

export class DocBuilder {
  public constructor(public readonly config: Config, public readonly context: FormatContext) {}
  public get indent_size(): number { return this.config.indent_size; }
  public get continuation_indent_size(): number { return this.config.continuation_indent_size ?? this.config.indent_size; }

  public group_surround(elems: Doc[], sep: Insertable, open: Insertable, close: Insertable): Doc {
    return this.group(this.surround(elems, sep, open, close));
  }

  public surround(elems: Doc[], sep: Insertable, open: Insertable, close: Insertable): Doc {
    if (!elems.length) return this.concat([this.txt(open.str), this.txt(close.str)]);
    const docs: Doc[] = [];
    if (open.pre) docs.push(open.pre);
    if (open.str !== null) docs.push(this.txt(open.str));
    if (open.suf) docs.push(this.cont_indent(open.suf));
    docs.push(this.cont_indent(this.intersperse(elems, sep)));
    if (close.pre) docs.push(close.pre);
    if (close.str !== null) docs.push(this.txt(close.str));
    if (close.suf) docs.push(close.suf);
    return this.concat(docs);
  }

  public intersperse2(items: Buildable[], sep: Insertable): Doc { return this.intersperse(this.to_docs(items), sep); }
  public intersperse(elems: Doc[], sep: Insertable): Doc {
    if (!elems.length) return this.nil_doc();
    const parts: Doc[] = [];
    elems.forEach((elem, index) => {
      if (index > 0) {
        if (sep.pre) parts.push(sep.pre);
        if (sep.str !== null) parts.push(this.txt(sep.str));
        if (sep.suf) parts.push(sep.suf);
      }
      parts.push(elem);
    });
    return this.concat(parts);
  }

  public surround_body_members(elems: BodyMember[], open: string, close: string): Doc {
    if (!elems.length) return this.concat([this.txt(open), this.nl(), this.txt(close)]);
    return this.concat([
      this.txt(open), this.indent(this.nl()), this.indent(this.intersperse_body_members(elems)), this.nl(), this.txt(close),
    ]);
  }

  public intersperse_body_members(members: BodyMember[]): Doc {
    if (!members.length) return this.nil_doc();
    const docs: Doc[] = [];
    members.forEach((member, index) => {
      docs.push(member.member.build(this));
      if (index < members.length - 1) {
        if (member.has_trailing_newline) docs.push(this.nl_with_no_indent());
        docs.push(this.nl());
      }
    });
    return this.concat(docs);
  }

  public to_docs(items: Buildable[]): Doc[] { return items.map((item) => item.build(this)); }
  public group_indent_concat(docs: Doc[]): Doc { return this.group_indent(this.concat(docs)); }
  public group_indent(doc: Doc): Doc { return this.group(this.cont_indent(doc)); }
  public group_concat(docs: Doc[]): Doc { return this.group(this.concat(docs)); }
  public nil_doc(): Doc { return this.txt(''); }
  public nl(): Doc { return 'newline'; }
  public force_break(): Doc { return 'force_break'; }
  public nl_when_in_flat(): Doc { return 'newline_when_in_flat'; }
  public softline(): Doc { return 'softline'; }
  public maybeline(): Doc { return 'maybeline'; }
  public nl_with_no_indent(): Doc { return 'newline_with_no_indent'; }
  public txt(text: unknown): Doc {
    const s = textValue(text);
    return { kind: 'text', s, width: Buffer.byteLength(s, 'utf8') };
  }
  public _txt(text: unknown): Doc { return this.txt(` ${textValue(text)}`); }
  public txt_(text: unknown): Doc { return this.txt(`${textValue(text)} `); }
  public _txt_(text: unknown): Doc { return this.txt(` ${textValue(text)} `); }
  public flat(doc: Doc): Doc { return { kind: 'flat', doc }; }
  public indent(doc: Doc): Doc { return { kind: 'indent', amount: this.indent_size, doc }; }
  public cont_indent(doc: Doc): Doc { return { kind: 'indent', amount: this.continuation_indent_size, doc }; }
  public dedent(doc: Doc): Doc { return { kind: 'dedent', amount: this.indent_size, doc }; }
  public concat(docs: Doc[]): Doc { return { kind: 'concat', docs }; }
  public choice(first: Doc, second: Doc): Doc { return { kind: 'choice', first, second }; }
  public group(doc: Doc): Doc { return this.choice(this.flat(doc), doc); }
}

export class Insertable implements Buildable {
  public readonly str: string | null;
  public constructor(public readonly pre: Doc | null, str: unknown, public readonly suf: Doc | null) {
    this.str = str === null || str === undefined ? null : String(str);
  }
  public build(builder: DocBuilder): Doc {
    const result: Doc[] = [];
    if (this.pre) result.push(this.pre);
    if (this.str !== null) result.push(builder.txt(this.str));
    if (this.suf) result.push(this.suf);
    return builder.concat(result);
  }
}

export class BodyMember {
  public readonly has_trailing_newline: boolean;
  public constructor(context: FormatContext, node: Node, public readonly member: Buildable) {
    this.has_trailing_newline = BodyMember.trailing_newline(context, node);
  }
  public static trailing_newline(context: FormatContext, node: Node): boolean {
    const comments = context.get_comment_bucket(node.id).post_comments;
    const lastComment = comments[comments.length - 1];
    if (lastComment) return lastComment.has_newline_below;
    const next = node.next_named_sibling;
    return next ? node.end_row < next.start_row - 1 : false;
  }
}
