/** Document IR and byte-width pretty printer, ported from the Ruby formatter. */
export type DocToken = 'newline' | 'newline_with_no_indent' | 'newline_when_in_flat' | 'force_break' | 'softline' | 'maybeline';
export type Doc = DocToken | {
    kind: 'text';
    s: string;
    width: number;
} | {
    kind: 'flat';
    doc: Doc;
} | {
    kind: 'indent' | 'dedent';
    amount: number;
    doc: Doc;
} | {
    kind: 'concat';
    docs: Doc[];
} | {
    kind: 'choice';
    first: Doc;
    second: Doc;
};
export declare class PrettyPrinter {
    private readonly maxWidth;
    private col;
    private readonly chunks;
    constructor(doc: Doc, maxWidth: number);
    print(): string;
    private newline;
    private fits;
}
export declare function prettyPrint(doc: Doc, maxWidth: number): string;
export declare const pretty_print: typeof prettyPrint;
