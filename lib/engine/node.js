class SourceView {
    source;
    byteOffsets;
    nodes = new Map();
    constructor(source) {
        this.source = source;
        this.byteOffsets = new Uint32Array(source.length + 1);
        let bytes = 0;
        for (let index = 0; index < source.length;) {
            this.byteOffsets[index] = bytes;
            const codePoint = source.codePointAt(index);
            const units = codePoint > 0xffff ? 2 : 1;
            if (units === 2)
                this.byteOffsets[index + 1] = bytes;
            bytes += Buffer.byteLength(String.fromCodePoint(codePoint), 'utf8');
            index += units;
            this.byteOffsets[index] = bytes;
        }
    }
}
/** Snake-case wrapper preserves the Ruby model accessor contract. */
export class Node {
    raw;
    sourceView;
    constructor(raw, source) {
        this.raw = raw;
        this.sourceView = typeof source === 'string' ? new SourceView(source) : source;
        this.sourceView.nodes.set(raw.id, this);
    }
    get id() { return this.raw.id; }
    get kind() { return this.raw.type; }
    get is_named() { return this.raw.isNamed; }
    get is_extra() { return this.raw.isExtra; }
    get has_error() { return this.raw.hasError; }
    get start_byte() { return this.sourceView.byteOffsets[this.raw.startIndex]; }
    get end_byte() { return this.sourceView.byteOffsets[this.raw.endIndex]; }
    get start_row() { return this.raw.startPosition.row; }
    get end_row() { return this.raw.endPosition.row; }
    get child_count() { return this.raw.childCount; }
    get named_child_count() { return this.raw.namedChildCount; }
    get value() { return this.sourceView.source.slice(this.raw.startIndex, this.raw.endIndex); }
    get parent() { return this.wrap(this.raw.parent); }
    get next_sibling() { return this.wrap(this.raw.nextSibling); }
    get next_named_sibling() { return this.wrap(this.raw.nextNamedSibling); }
    get prev_named_sibling() { return this.wrap(this.raw.previousNamedSibling); }
    get children() { return this.raw.children.map((child) => this.wrap(child)); }
    get named_children() { return this.raw.namedChildren.map((child) => this.wrap(child)); }
    get children_vec() { return this.named_children.filter((child) => !child.is_extra); }
    get all_children_vec() { return this.named_children; }
    child(index) { return this.wrap(this.raw.child(index)); }
    named_child(index) { return this.wrap(this.raw.namedChild(index)); }
    child_by_field_name(name) { return this.wrap(this.raw.childForFieldName(name)); }
    field_name_for_child(index) { return this.raw.fieldNameForChild(index); }
    try_c_by_k(kind) { return this.named_children.find((child) => child.kind === kind) ?? null; }
    try_cs_by_k(kind) { return this.named_children.filter((child) => child.kind === kind); }
    try_c_by_n(name) { return this.child_by_field_name(name); }
    c_by_k(kind) {
        const child = this.try_c_by_k(kind);
        if (!child)
            throw new Error(`Node ${this.kind} is missing mandatory kind child: ${kind}`);
        return child;
    }
    get try_first_c() { return this.named_children.find((child) => !child.is_extra) ?? null; }
    get first_c() {
        const child = this.try_first_c;
        if (!child)
            throw new Error(`Node ${this.kind} is missing a mandatory first child.`);
        return child;
    }
    c_by_n(name) {
        const child = this.child_by_field_name(name);
        if (!child)
            throw new Error(`Node ${this.kind} is missing mandatory named child: ${name}`);
        return child;
    }
    cv_by_k(kind) { return this.c_by_k(kind).value; }
    cv_by_n(name) { return this.c_by_n(name).value; }
    cvalue_by_n(name) { return this.cv_by_n(name); }
    cvalue_by_k(kind) { return this.cv_by_k(kind); }
    cs_by_n(name) {
        const result = [];
        for (let index = 0; index < this.child_count; index++) {
            if (this.field_name_for_child(index) === name)
                result.push(this.child(index));
        }
        if (!result.length)
            throw new Error(`Node ${this.kind} is missing mandatory named children: ${name}`);
        return result;
    }
    cs_by_k(kind) {
        const result = this.try_cs_by_k(kind);
        if (!result.length)
            throw new Error(`Node ${this.kind} is missing mandatory kind children: ${kind}`);
        return result;
    }
    get next_named() {
        let sibling = this.next_named_sibling;
        while (sibling) {
            if (!sibling.is_extra)
                return sibling;
            sibling = sibling.next_named_sibling;
        }
        throw new Error(`Node ${this.kind} is missing the next named node.`);
    }
    wrap(raw) {
        if (!raw)
            return null;
        return this.sourceView.nodes.get(raw.id) ?? new Node(raw, this.sourceView);
    }
}
export class NodeInfo {
    id;
    constructor(id) {
        this.id = id;
    }
    static from(node) { return new NodeInfo(node.id); }
}
//# sourceMappingURL=node.js.map