const textValue = (text) => text === null || text === undefined ? '' : String(text);
export class DocBuilder {
    config;
    context;
    constructor(config, context) {
        this.config = config;
        this.context = context;
    }
    get indent_size() { return this.config.indent_size; }
    get continuation_indent_size() { return this.config.continuation_indent_size ?? this.config.indent_size; }
    group_surround(elems, sep, open, close) {
        return this.group(this.surround(elems, sep, open, close));
    }
    surround(elems, sep, open, close) {
        if (!elems.length)
            return this.concat([this.txt(open.str), this.txt(close.str)]);
        const docs = [];
        if (open.pre)
            docs.push(open.pre);
        if (open.str !== null)
            docs.push(this.txt(open.str));
        if (open.suf)
            docs.push(this.cont_indent(open.suf));
        docs.push(this.cont_indent(this.intersperse(elems, sep)));
        if (close.pre)
            docs.push(close.pre);
        if (close.str !== null)
            docs.push(this.txt(close.str));
        if (close.suf)
            docs.push(close.suf);
        return this.concat(docs);
    }
    intersperse2(items, sep) { return this.intersperse(this.to_docs(items), sep); }
    intersperse(elems, sep) {
        if (!elems.length)
            return this.nil_doc();
        const parts = [];
        elems.forEach((elem, index) => {
            if (index > 0) {
                if (sep.pre)
                    parts.push(sep.pre);
                if (sep.str !== null)
                    parts.push(this.txt(sep.str));
                if (sep.suf)
                    parts.push(sep.suf);
            }
            parts.push(elem);
        });
        return this.concat(parts);
    }
    surround_body_members(elems, open, close) {
        if (!elems.length)
            return this.concat([this.txt(open), this.nl(), this.txt(close)]);
        return this.concat([
            this.txt(open), this.indent(this.nl()), this.indent(this.intersperse_body_members(elems)), this.nl(), this.txt(close),
        ]);
    }
    intersperse_body_members(members) {
        if (!members.length)
            return this.nil_doc();
        const docs = [];
        members.forEach((member, index) => {
            docs.push(member.member.build(this));
            if (index < members.length - 1) {
                if (member.has_trailing_newline)
                    docs.push(this.nl_with_no_indent());
                docs.push(this.nl());
            }
        });
        return this.concat(docs);
    }
    to_docs(items) { return items.map((item) => item.build(this)); }
    group_indent_concat(docs) { return this.group_indent(this.concat(docs)); }
    group_indent(doc) { return this.group(this.cont_indent(doc)); }
    group_concat(docs) { return this.group(this.concat(docs)); }
    nil_doc() { return this.txt(''); }
    nl() { return 'newline'; }
    force_break() { return 'force_break'; }
    nl_when_in_flat() { return 'newline_when_in_flat'; }
    softline() { return 'softline'; }
    maybeline() { return 'maybeline'; }
    nl_with_no_indent() { return 'newline_with_no_indent'; }
    txt(text) {
        const s = textValue(text);
        return { kind: 'text', s, width: Buffer.byteLength(s, 'utf8') };
    }
    _txt(text) { return this.txt(` ${textValue(text)}`); }
    txt_(text) { return this.txt(`${textValue(text)} `); }
    _txt_(text) { return this.txt(` ${textValue(text)} `); }
    flat(doc) { return { kind: 'flat', doc }; }
    indent(doc) { return { kind: 'indent', amount: this.indent_size, doc }; }
    cont_indent(doc) { return { kind: 'indent', amount: this.continuation_indent_size, doc }; }
    dedent(doc) { return { kind: 'dedent', amount: this.indent_size, doc }; }
    concat(docs) { return { kind: 'concat', docs }; }
    choice(first, second) { return { kind: 'choice', first, second }; }
    group(doc) { return this.choice(this.flat(doc), doc); }
}
export class Insertable {
    pre;
    suf;
    str;
    constructor(pre, str, suf) {
        this.pre = pre;
        this.suf = suf;
        this.str = str === null || str === undefined ? null : String(str);
    }
    build(builder) {
        const result = [];
        if (this.pre)
            result.push(this.pre);
        if (this.str !== null)
            result.push(builder.txt(this.str));
        if (this.suf)
            result.push(this.suf);
        return builder.concat(result);
    }
}
export class BodyMember {
    member;
    has_trailing_newline;
    constructor(context, node, member) {
        this.member = member;
        this.has_trailing_newline = BodyMember.trailing_newline(context, node);
    }
    static trailing_newline(context, node) {
        const comments = context.get_comment_bucket(node.id).post_comments;
        const lastComment = comments[comments.length - 1];
        if (lastComment)
            return lastComment.has_newline_below;
        const next = node.next_named_sibling;
        return next ? node.end_row < next.start_row - 1 : false;
    }
}
//# sourceMappingURL=builder.js.map