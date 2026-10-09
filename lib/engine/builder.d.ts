import type { Config } from './config.js';
import type { FormatContext } from './context.js';
import type { Doc } from './doc.js';
import type { Node } from './node.js';
export interface Buildable {
    build(builder: DocBuilder): Doc;
}
export declare class DocBuilder {
    readonly config: Config;
    readonly context: FormatContext;
    constructor(config: Config, context: FormatContext);
    get indent_size(): number;
    get continuation_indent_size(): number;
    group_surround(elems: Doc[], sep: Insertable, open: Insertable, close: Insertable): Doc;
    surround(elems: Doc[], sep: Insertable, open: Insertable, close: Insertable): Doc;
    intersperse2(items: Buildable[], sep: Insertable): Doc;
    intersperse(elems: Doc[], sep: Insertable): Doc;
    surround_body_members(elems: BodyMember[], open: string, close: string): Doc;
    intersperse_body_members(members: BodyMember[]): Doc;
    to_docs(items: Buildable[]): Doc[];
    group_indent_concat(docs: Doc[]): Doc;
    group_indent(doc: Doc): Doc;
    group_concat(docs: Doc[]): Doc;
    nil_doc(): Doc;
    nl(): Doc;
    force_break(): Doc;
    nl_when_in_flat(): Doc;
    softline(): Doc;
    maybeline(): Doc;
    nl_with_no_indent(): Doc;
    txt(text: unknown): Doc;
    _txt(text: unknown): Doc;
    txt_(text: unknown): Doc;
    _txt_(text: unknown): Doc;
    flat(doc: Doc): Doc;
    indent(doc: Doc): Doc;
    cont_indent(doc: Doc): Doc;
    dedent(doc: Doc): Doc;
    concat(docs: Doc[]): Doc;
    choice(first: Doc, second: Doc): Doc;
    group(doc: Doc): Doc;
}
export declare class Insertable implements Buildable {
    readonly pre: Doc | null;
    readonly suf: Doc | null;
    readonly str: string | null;
    constructor(pre: Doc | null, str: unknown, suf: Doc | null);
    build(builder: DocBuilder): Doc;
}
export declare class BodyMember {
    readonly member: Buildable;
    readonly has_trailing_newline: boolean;
    constructor(context: FormatContext, node: Node, member: Buildable);
    static trailing_newline(context: FormatContext, node: Node): boolean;
}
