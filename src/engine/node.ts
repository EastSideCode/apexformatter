/** Structural view of web-tree-sitter nodes, kept independent of parser initialization. */
export interface RawNode {
  id: number;
  type: string;
  isNamed: boolean;
  isExtra: boolean;
  hasError: boolean;
  startIndex: number;
  endIndex: number;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  childCount: number;
  namedChildCount: number;
  children: RawNode[];
  namedChildren: RawNode[];
  parent: RawNode | null;
  nextSibling: RawNode | null;
  nextNamedSibling: RawNode | null;
  previousNamedSibling: RawNode | null;
  child(index: number): RawNode | null;
  namedChild(index: number): RawNode | null;
  childForFieldName(name: string): RawNode | null;
  fieldNameForChild(index: number): string | null;
}

class SourceView {
  public readonly byteOffsets: Uint32Array;
  public readonly nodes = new Map<number, Node>();

  public constructor(public readonly source: string) {
    this.byteOffsets = new Uint32Array(source.length + 1);
    let bytes = 0;
    for (let index = 0; index < source.length;) {
      this.byteOffsets[index] = bytes;
      const codePoint = source.codePointAt(index)!;
      const units = codePoint > 0xffff ? 2 : 1;
      if (units === 2) this.byteOffsets[index + 1] = bytes;
      bytes += Buffer.byteLength(String.fromCodePoint(codePoint), 'utf8');
      index += units;
      this.byteOffsets[index] = bytes;
    }
  }
}

/** Snake-case wrapper preserves the Ruby model accessor contract. */
export class Node {
  private readonly sourceView: SourceView;

  public constructor(private readonly raw: RawNode, source: string | SourceView) {
    this.sourceView = typeof source === 'string' ? new SourceView(source) : source;
    this.sourceView.nodes.set(raw.id, this);
  }

  public get id(): number { return this.raw.id; }
  public get kind(): string { return this.raw.type; }
  public get is_named(): boolean { return this.raw.isNamed; }
  public get is_extra(): boolean { return this.raw.isExtra; }
  public get has_error(): boolean { return this.raw.hasError; }
  public get start_byte(): number { return this.sourceView.byteOffsets[this.raw.startIndex]; }
  public get end_byte(): number { return this.sourceView.byteOffsets[this.raw.endIndex]; }
  public get start_row(): number { return this.raw.startPosition.row; }
  public get end_row(): number { return this.raw.endPosition.row; }
  public get child_count(): number { return this.raw.childCount; }
  public get named_child_count(): number { return this.raw.namedChildCount; }
  public get value(): string { return this.sourceView.source.slice(this.raw.startIndex, this.raw.endIndex); }
  public get parent(): Node | null { return this.wrap(this.raw.parent); }
  public get next_sibling(): Node | null { return this.wrap(this.raw.nextSibling); }
  public get next_named_sibling(): Node | null { return this.wrap(this.raw.nextNamedSibling); }
  public get prev_named_sibling(): Node | null { return this.wrap(this.raw.previousNamedSibling); }
  public get children(): Node[] { return this.raw.children.map((child) => this.wrap(child)!); }
  public get named_children(): Node[] { return this.raw.namedChildren.map((child) => this.wrap(child)!); }
  public get children_vec(): Node[] { return this.named_children.filter((child) => !child.is_extra); }
  public get all_children_vec(): Node[] { return this.named_children; }

  public child(index: number): Node | null { return this.wrap(this.raw.child(index)); }
  public named_child(index: number): Node | null { return this.wrap(this.raw.namedChild(index)); }
  public child_by_field_name(name: string): Node | null { return this.wrap(this.raw.childForFieldName(name)); }
  public field_name_for_child(index: number): string | null { return this.raw.fieldNameForChild(index); }
  public try_c_by_k(kind: string): Node | null { return this.named_children.find((child) => child.kind === kind) ?? null; }
  public try_cs_by_k(kind: string): Node[] { return this.named_children.filter((child) => child.kind === kind); }
  public try_c_by_n(name: string): Node | null { return this.child_by_field_name(name); }

  public c_by_k(kind: string): Node {
    const child = this.try_c_by_k(kind);
    if (!child) throw new Error(`Node ${this.kind} is missing mandatory kind child: ${kind}`);
    return child;
  }

  public get try_first_c(): Node | null { return this.named_children.find((child) => !child.is_extra) ?? null; }
  public get first_c(): Node {
    const child = this.try_first_c;
    if (!child) throw new Error(`Node ${this.kind} is missing a mandatory first child.`);
    return child;
  }

  public c_by_n(name: string): Node {
    const child = this.child_by_field_name(name);
    if (!child) throw new Error(`Node ${this.kind} is missing mandatory named child: ${name}`);
    return child;
  }

  public cv_by_k(kind: string): string { return this.c_by_k(kind).value; }
  public cv_by_n(name: string): string { return this.c_by_n(name).value; }
  public cvalue_by_n(name: string): string { return this.cv_by_n(name); }
  public cvalue_by_k(kind: string): string { return this.cv_by_k(kind); }

  public cs_by_n(name: string): Node[] {
    const result: Node[] = [];
    for (let index = 0; index < this.child_count; index++) {
      if (this.field_name_for_child(index) === name) result.push(this.child(index)!);
    }
    if (!result.length) throw new Error(`Node ${this.kind} is missing mandatory named children: ${name}`);
    return result;
  }

  public cs_by_k(kind: string): Node[] {
    const result = this.try_cs_by_k(kind);
    if (!result.length) throw new Error(`Node ${this.kind} is missing mandatory kind children: ${kind}`);
    return result;
  }

  public get next_named(): Node {
    let sibling = this.next_named_sibling;
    while (sibling) {
      if (!sibling.is_extra) return sibling;
      sibling = sibling.next_named_sibling;
    }
    throw new Error(`Node ${this.kind} is missing the next named node.`);
  }

  private wrap(raw: RawNode | null): Node | null {
    if (!raw) return null;
    return this.sourceView.nodes.get(raw.id) ?? new Node(raw, this.sourceView);
  }
}

export class NodeInfo {
  public constructor(public readonly id: number) {}
  public static from(node: Node): NodeInfo { return new NodeInfo(node.id); }
}
