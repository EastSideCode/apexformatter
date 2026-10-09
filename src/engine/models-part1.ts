// Faithful model/layout port of data_model_01..05.rb and enum_def_01.rb.
import { Model, create, make, register } from './model.js';
import { NodeInfo } from './node.js';
import type { FormatContext } from './context.js';
import type { Doc } from './doc.js';
import { DocBuilder, Insertable, BodyMember } from './builder.js';

function fail(message: string): never { throw new Error(message); }
function optional(value: any, convert: (value: any) => any): any { return value == null ? null : convert(value); }

class Root extends Model {
  public members: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "parser_output");
    this.members = node.children_vec.map((n: any) => {
      return new BodyMember(this.context, n, create("RootMember", this.context, n));
    });
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let bucket: any, doc: any, docs: any;
    bucket = this.context.get_comment_bucket(this.node_info.id);
    if (!((bucket.dangling_comments.length === 0))) {
      docs = bucket.dangling_comments.map((n: any) => {
        return n.build(b);
      });
      return result.push(b.concat(docs));
    }
    doc = b.intersperse_body_members(this.members);
    result.push(doc);
    result.push(b.nl());
  }
}

class ClassDeclaration extends Model {
  public modifiers: any;
  public name: any;
  public type_parameters: any;
  public superclass: any;
  public interface: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "class_declaration");
    this.modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.type_parameters = optional(node.try_c_by_k("type_parameters"), (n: any) => {
      return create("TypeParameters", this.context, n);
    });
    this.superclass = optional(node.try_c_by_k("superclass"), (n: any) => {
      return create("SuperClass", this.context, n);
    });
    this.interface = optional(node.try_c_by_k("interfaces"), (n: any) => {
      return create("Interface", this.context, n);
    });
    this.body = create("ClassBody", this.context, node.c_by_n("body"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let docs: any, n: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      docs = [];
      docs.push(b.txt_("class"));
      docs.push(this.name.build(b));
      if ((n = this.type_parameters)) {
        docs.push(n.build(b));
      }
      if ((this.superclass || this.interface)) {
        docs.push(b.softline());
      }
      if ((n = this.superclass)) {
        docs.push(n.build(b));
        if (this.interface) {
          docs.push(b.txt(" "));
        }
      }
      if ((n = this.interface)) {
        docs.push(n.build(b));
      }
      docs.push(b.txt(" "));
      result.push(b.group_indent_concat(docs));
      result.push(this.body.build(b));
    });
  }
}

class MethodDeclaration extends Model {
  public modifiers: any;
  public type_: any;
  public name: any;
  public formal_parameters: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "method_declaration");
    this.modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    this.type_ = create("UnannotatedType", this.context, node.c_by_n("type"));
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.formal_parameters = create("FormalParameters", this.context, node.c_by_n("parameters"));
    this.body = optional(node.try_c_by_n("body"), (n: any) => {
      return create("Block", this.context, n);
    });
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let body_doc: any, n: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      result.push(this.type_.build(b));
      result.push(b.txt(" "));
      result.push(this.name.build(b));
      result.push(this.formal_parameters.build(b));
      if ((n = this.body)) {
        result.push(b.txt(" "));
        body_doc = n.build(b);
        result.push(body_doc);
      } else {
        result.push(b.txt(";"));
      }
    });
  }
}

class FormalParameters extends Model {
  public formal_parameters: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "formal_parameters");
    this.formal_parameters = node.try_cs_by_k("formal_parameter").map((n: any) => {
      return create("FormalParameter", this.context, n);
    });
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let close: any, doc: any, open: any, parameters_doc: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      parameters_doc = b.to_docs(this.formal_parameters);
      sep = new Insertable(null, ",", b.softline());
      open = new Insertable(null, "(", b.maybeline());
      close = new Insertable(b.maybeline(), ")", null);
      doc = b.group_surround(parameters_doc, sep, open, close);
      result.push(doc);
    });
  }
}

class FormalParameter extends Model {
  public modifiers: any;
  public type_: any;
  public name: any;
  public dimensions: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "formal_parameter");
    this.modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    this.type_ = create("UnannotatedType", this.context, node.c_by_n("type"));
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.dimensions = optional(node.try_c_by_k("dimensions"), (n: any) => {
      return create("Dimensions", this.context, n);
    });
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let d: any, n: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      result.push(this.type_.build(b));
      result.push(b.txt(" "));
      result.push(this.name.build(b));
      if ((d = this.dimensions)) {
        result.push(b.txt(" "));
        result.push(d.build(b));
      }
    });
  }
}

class SuperClass extends Model {
  public type_: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "superclass");
    this.type_ = create("Type", this.context, node.first_c);
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt_("extends"));
      result.push(this.type_.build(b));
    });
  }
}

class Modifiers extends Model {
  public annotation: any;
  public modifiers: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "modifiers");
    this.modifiers = node.try_cs_by_k("modifier").map((n: any) => {
      return create("Modifier", this.context, n);
    });
    this.annotation = optional(node.try_c_by_k("annotation"), (n: any) => {
      return create("Annotation", this.context, n);
    });
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let docs: any, n: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.annotation)) {
        result.push(n.build(b));
      }
      if (!((this.modifiers.length === 0))) {
        docs = b.to_docs(this.modifiers);
        sep = new Insertable(null, " ", null);
        result.push(b.intersperse(docs, sep));
        result.push(b.txt(" "));
      }
    });
  }
}

class Modifier extends Model {
  public kind: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "modifier");
    this.kind = create("ModifierKind", this.context, node.first_c);
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(this.kind.build(b));
    });
  }
}

class Annotation extends Model {
  public name: any;
  public arguments: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "annotation");
    this.arguments = optional(node.try_c_by_n("arguments"), (n: any) => {
      return create("AnnotationArgumentList", this.context, n);
    });
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let a: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("@"));
      result.push(this.name.build(b));
      if ((a = this.arguments)) {
        result.push(a.build(b));
      }
    });
    result.push(b.nl());
  }
}

class AnnotationKeyValue extends Model {
  public key: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "annotation_key_value");
    this.key = create("ValueNode", this.context, node.c_by_n("key"));
    this.value = create("ValueNode", this.context, node.c_by_n("value"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(this.key.build(b));
      result.push(b.txt("="));
      result.push(this.value.build(b));
    });
  }
}

class ClassBody extends Model {
  public class_members: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "class_body");
    this.class_members = node.children_vec.map((n: any) => {
      return new BodyMember(this.context, n, create("ClassMember", this.context, n));
    });
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let bucket: any;
    bucket = this.context.get_comment_bucket(this.node_info.id);
    this.context.handle_pre_comments(b, bucket, result);
    if ((bucket.dangling_comments.length === 0)) {
      result.push(b.surround_body_members(this.class_members, "{", "}"));
      this.context.handle_post_comments(b, bucket, result);
    } else {
      this.context.handle_dangling_comments_in_bracket_surround(b, bucket, result);
    }
  }
}

class FieldDeclaration extends Model {
  public modifiers: any;
  public type_: any;
  public declarators: any;
  public accessor_list: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "field_declaration");
    this.modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    this.declarators = node.cs_by_n("declarator").map((n: any) => {
      return create("VariableDeclarator", this.context, n);
    });
    this.accessor_list = optional(node.try_c_by_k("accessor_list"), (n: any) => {
      return create("AccessorList", this.context, n);
    });
    this.type_ = create("UnannotatedType", this.context, node.c_by_n("type"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let doc: any, docs: any, n: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      result.push(this.type_.build(b));
      result.push(b.txt(" "));
      docs = b.to_docs(this.declarators);
      doc = (() => {
        if ((docs.length === 1)) {
          return docs[0];
        } else {
          sep = new Insertable(null, ",", b.softline());
          return b.group(b.indent(b.intersperse(docs, sep)));
        }
      })();
      result.push(doc);
      if ((n = this.accessor_list)) {
        result.push(b.txt(" "));
        result.push(n.build(b));
      } else {
        result.push(b.txt(";"));
      }
    });
  }
}

class ArrayInitializer extends Model {
  public initializers: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "array_initializer");
    this.initializers = node.children_vec.map((n: any) => {
      return create("VariableInitializer", this.context, n);
    });
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let close: any, doc: any, docs: any, open: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = b.to_docs(this.initializers);
      sep = new Insertable(null, ",", b.softline());
      open = new Insertable(null, "{", b.softline());
      close = new Insertable(b.softline(), "}", null);
      doc = b.group_surround(docs, sep, open, close);
      result.push(doc);
    });
  }
}

class AssignmentExpression extends Model {
  public left: any;
  public op: any;
  public right: any;
  public is_right_child_a_query_node: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let right_child: any;
    this.context.assert_check(node, "assignment_expression");
    right_child = node.c_by_n("right");
    this.left = create("AssignmentLeft", this.context, node.c_by_n("left"));
    this.op = create("ValueNode", this.context, node.c_by_n("operator"));
    this.right = create("Expression", this.context, right_child);
    this.is_right_child_a_query_node = this.context.query_expression(right_child);
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let docs: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = [this.left.build(b), b.txt(" "), this.op.build(b)];
      if (this.is_right_child_a_query_node) {
        if (((b.config["query_bracket_next_line"] !== undefined) && b.config.query_bracket_next_line())) {
          docs.push(b.force_break());
          docs.push(b.maybeline());
          docs.push(this.right.build(b));
          result.push(b.concat(docs));
        } else {
          docs.push(b.txt(" "));
          docs.push(this.right.build(b));
          result.push(b.concat(docs));
        }
      } else {
        docs.push(b.softline());
        docs.push(this.right.build(b));
        result.push(b.group_indent_concat(docs));
      }
    });
  }
}

class AssignmentLeft extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (node.kind) {
        case "identifier":
        {
          return { variant: "identifier", value: create("ValueNode", this.context, node) };
          break;
        }
        case "field_access":
        {
          return { variant: "field", value: create("FieldAccess", this.context, node) };
          break;
        }
        case "array_access":
        {
          return { variant: "array", value: create("ArrayAccess", this.context, node) };
          break;
        }
        default: {
          return this.context.panic_unknown_node(node, "AssignmentLeft");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "identifier":
      {
        result.push(this.value.build(b));
        break;
      }
      case "field":
      {
        result.push(this.value.build(b));
        break;
      }
      case "array":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class BoolType extends Model {
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "boolean_type");
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("boolean"));
    });
  }
}

class Block extends Model {
  public statements: any;
  public node_info: NodeInfo;
  public static readonly COMPOUND_STATEMENT_VARIANTS = ["if", "for", "enhanced_for", "do", "while", "try", "switch", "block", "run"];
  public static readonly DECLARATION_BODY_PARENTS = ["method_declaration", "constructor_declaration", "static_initializer"];
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let node_info: any, statements: any;
    this.context.assert_check(node, "block");
    statements = node.children_vec.map((n: any) => {
      return new BodyMember(this.context, n, create("Statement", this.context, n));
    });
    node_info = NodeInfo.from(node);
    this.statements = statements;
    this.node_info = node_info;
    this.declaration_body = Block.DECLARATION_BODY_PARENTS.includes(node.parent?.kind);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let bucket: any, docs: any;
    bucket = this.context.get_comment_bucket(this.node_info.id);
    this.context.handle_pre_comments(b, bucket, result);
    if ((bucket.dangling_comments.length === 0)) {
      if (this.keep_simple_one_line(b)) {
        result.push(this.simple_one_line_block(b));
      } else {
        docs = b.surround_body_members(this.statements, "{", "}");
        result.push(docs);
      }
    } else {
      this.context.handle_dangling_comments_in_bracket_surround(b, bucket, result);
      return;
    }
    this.context.handle_post_comments(b, bucket, result);
  }
  public keep_simple_one_line(b: DocBuilder): any {
    let member: any, stmt: any;
    if (this.declaration_body) { return false; }
    if (!((b.config["keep_simple_blocks_in_one_line"] !== undefined))) { return false; }
    if (!(b.config.keep_simple_blocks_in_one_line)) { return false; }
    if ((this.statements.length === 0)) { return true; }
    if (!((this.statements.length === 1))) { return false; }
    member = this.statements[0];
    if (member.has_trailing_newline) { return false; }
    stmt = member.member;
    return (!Block.COMPOUND_STATEMENT_VARIANTS.includes(stmt.variant));
  }
  public simple_one_line_block(b: DocBuilder): any {
    let multi_line: any, one_line: any, stmt_doc: any;
    if ((this.statements.length === 0)) {
      return b.concat([b.txt("{"), b.txt("}")]);
    }
    stmt_doc = this.statements[0].member.build(b);
    one_line = b.concat([b.txt("{ "), stmt_doc, b.txt(" }")]);
    multi_line = b.surround_body_members(this.statements, "{", "}");
    return b.choice(b.flat(one_line), multi_line);
  }
}

class Interface extends Model {
  public type_list: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "interfaces");
    this.type_list = create("TypeList", this.context, node.c_by_k("type_list"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let doc: any, impl_group: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      doc = this.type_list.build(b);
      impl_group = b.concat([b.txt_("implements"), doc]);
      result.push(impl_group);
    });
  }
}

class TypeList extends Model {
  public types: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let types: any;
    this.context.assert_check(node, "type_list");
    types = node.children_vec.map((n: any) => {
      return create("Type", this.context, n);
    });
    this.types = types;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let doc: any, docs: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = b.to_docs(this.types);
      sep = new Insertable(null, ", ", null);
      doc = b.intersperse(docs, sep);
      result.push(doc);
    });
  }
}

class ObjectExpression extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (node.kind) {
        case "super":
        {
          return { variant: "super", value: create("Super", this.context, node) };
          break;
        }
        default: {
          return { variant: "primary", value: create("PrimaryExpression", this.context, node) };
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "primary":
      {
        result.push(this.value.build(b));
        break;
      }
      case "super":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class MethodInvocationKind extends Model {
  constructor(formatContext: FormatContext, variant: string, value: any = null) {
    super(formatContext);
    this.variant = variant;
    this.value = value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let arguments_: any, context: any, docs: any, n: any, name: any, object: any, property_navigation: any, type_arguments: any;
    switch (this.variant) {
      case "simple":
      {
        result.push(this.value["name"].build(b));
        result.push(this.value["arguments"].build(b));
        break;
      }
      case "complex":
      {
        object = this.value["object"];
        property_navigation = this.value["property_navigation"];
        type_arguments = this.value["type_arguments"];
        name = this.value["name"];
        arguments_ = this.value["arguments"];
        context = this.value["context"];
        docs = [];
        docs.push(object.build(b));
        if (context) {
          if ((context.is_parent_a_chaining_node || context.is_top_most_in_a_chain)) {
            docs.push(b.maybeline());
          }
          docs.push(property_navigation.build(b));
          if ((n = type_arguments)) {
            docs.push(n.build(b));
          }
          docs.push(name.build(b));
          docs.push(arguments_.build(b));
          if (context.is_top_most_in_a_chain) {
            return result.push(b.group_indent_concat(docs));
          }
          result.push(b.concat(docs));
        } else {
          docs.push(property_navigation.build(b));
          if ((n = type_arguments)) {
            docs.push(n.build(b));
          }
          docs.push(name.build(b));
          docs.push(arguments_.build(b));
          result.push(b.concat(docs));
        }
        break;
      }
    }
  }
}

class MethodInvocation extends Model {
  public kind: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let arguments_: any, context: any, kind: any, name: any, next_named: any, obj: any, object: any, property_navigation: any, type_arguments: any;
    this.context.assert_check(node, "method_invocation");
    name = create("ValueNode", this.context, node.c_by_n("name"));
    arguments_ = create("ArgumentList", this.context, node.c_by_n("arguments"));
    kind = (() => {
      if ((obj = node.try_c_by_n("object"))) {
        object = create("ObjectExpression", this.context, obj);
        next_named = obj.next_named;
        property_navigation = (() => {
          if ((next_named.kind === "safe_navigation_operator")) {
            return make("PropertyNavigation", this.context, "safe", create("SafeNavigationOperator", this.context, next_named));
          } else {
            return make("PropertyNavigation", this.context, "dot");
          }
        })();
        type_arguments = optional(node.try_c_by_k("type_arguments"), (n: any) => {
          return create("TypeArguments", this.context, n);
        });
        context = this.context.build_chaining_context(node);
        return make("MethodInvocationKind", this.context, "complex", { "object": object, "property_navigation": property_navigation, "type_arguments": type_arguments, "name": name, "arguments": arguments_, "context": context });
      } else {
        return make("MethodInvocationKind", this.context, "simple", { "name": name, "arguments": arguments_ });
      }
    })();
    this.kind = kind;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(this.kind.build(b));
    });
  }
}

class MethodObject extends Model {
  constructor(formatContext: FormatContext, variant: string, value: any = null) {
    super(formatContext);
    this.variant = variant;
    this.value = value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "super":
      {
        result.push(this.value.build(b));
        break;
      }
      case "primary":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class TypeArguments extends Model {
  public types: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let types: any;
    types = node.children_vec.map((n: any) => {
      return create("Type", this.context, n);
    });
    this.types = types;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let close: any, doc: any, docs: any, open: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = b.to_docs(this.types);
      sep = new Insertable(null, ", ", null);
      open = new Insertable(null, "<", null);
      close = new Insertable(null, ">", null);
      doc = b.surround(docs, sep, open, close);
      result.push(doc);
    });
  }
}

class ArgumentList extends Model {
  public expressions: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let expressions: any;
    expressions = node.children_vec.map((n: any) => {
      return create("Expression", this.context, n);
    });
    this.expressions = expressions;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let close: any, doc: any, docs: any, open: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = b.to_docs(this.expressions);
      sep = new Insertable(null, ",", b.softline());
      open = new Insertable(null, "(", b.maybeline());
      close = new Insertable(b.maybeline(), ")", null);
      doc = b.group_surround(docs, sep, open, close);
      result.push(doc);
    });
  }
}

class Super extends Model {
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "super");
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("super"));
    });
  }
}

class This extends Model {
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "this");
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("this"));
    });
  }
}

class BinaryExpressionContext extends Model {
  public is_a_chaining_inner_node: any;
  public has_parent_same_precedence: any;
  public is_parent_return_statement: any;
  constructor(formatContext: FormatContext, values: any) {
    super(formatContext);
    let is_parent_return_statement: any;
    let has_parent_same_precedence: any;
    let is_a_chaining_inner_node: any;
    is_a_chaining_inner_node = values["is_a_chaining_inner_node"];
    has_parent_same_precedence = values["has_parent_same_precedence"];
    is_parent_return_statement = values["is_parent_return_statement"];
    this.is_a_chaining_inner_node = is_a_chaining_inner_node;
    this.has_parent_same_precedence = has_parent_same_precedence;
    this.is_parent_return_statement = is_parent_return_statement;
  }
}

class BinaryExpression extends Model {
  public left: any;
  public op: any;
  public right: any;
  public chain_context: any;
  public node_info: NodeInfo;
  public static build_context(formatContext: FormatContext, node: any): any {
    let has_parent_same_precedence: any, is_a_chaining_inner_node: any, op: any, parent: any, precedence: any;
    op = node.c_by_n("operator").kind;
    precedence = formatContext.get_precedence(op);
    (parent = node.parent || fail("BinaryExpression node should always have a parent"));
    is_a_chaining_inner_node = formatContext.binary_exp(parent);
    has_parent_same_precedence = (formatContext.binary_exp(parent) && (precedence === formatContext.get_precedence(parent.c_by_n("operator").kind)));
    return create("BinaryExpressionContext", formatContext, { "has_parent_same_precedence": has_parent_same_precedence, "is_a_chaining_inner_node": is_a_chaining_inner_node, "is_parent_return_statement": (parent.kind === "return_statement") });
  }
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "binary_expression");
    this.left = create("Expression", this.context, node.c_by_n("left"));
    this.op = node.c_by_n("operator").kind;
    this.right = create("Expression", this.context, node.c_by_n("right"));
    this.chain_context = BinaryExpression.build_context(this.context, node);
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let context: any, left_doc: any, op_doc: any, right_doc: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      left_doc = this.left.build(b);
      op_doc = b.txt(this.op);
      right_doc = this.right.build(b);
      context = this.chain_context;
      if (context.has_parent_same_precedence) {
        return result.push(b.concat([left_doc, b.softline(), op_doc, b.txt(" "), right_doc]));
      }
      if (((!context.is_a_chaining_inner_node) && (!context.is_parent_return_statement))) {
        return result.push(b.group_concat([left_doc, b.softline(), op_doc, b.txt(" "), right_doc]));
      }
      result.push(b.group_indent_concat([left_doc, b.softline(), op_doc, b.txt(" "), right_doc]));
    });
  }
}

class LocalVariableDeclaration extends Model {
  public modifiers: any;
  public type_: any;
  public declarators: any;
  public is_parent_for_statement: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let declarators: any, modifiers: any;
    this.context.assert_check(node, "local_variable_declaration");
    modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    declarators = node.cs_by_n("declarator").map((n: any) => {
      return create("VariableDeclarator", this.context, n);
    });
    this.modifiers = modifiers;
    this.type_ = create("UnannotatedType", this.context, node.c_by_n("type"));
    this.declarators = declarators;
    this.is_parent_for_statement = (node.parent?.kind === "for_statement");
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let doc: any, docs: any, n: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      result.push(this.type_.build(b));
      result.push(b.txt(" "));
      docs = b.to_docs(this.declarators);
      doc = (() => {
        if ((docs.length === 1)) {
          return docs[0];
        } else {
          sep = new Insertable(null, ",", b.softline());
          return b.group(b.indent(b.intersperse(docs, sep)));
        }
      })();
      if (this.is_parent_for_statement) {
        result.push(doc);
      } else {
        result.push(b.concat([doc, b.txt(";")]));
      }
    });
  }
}

class VariableDeclarator extends Model {
  public name: any;
  public op: any;
  public is_value_child_a_query_node: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let is_value_child_a_query_node: any, op: any, value: any;
    this.context.assert_check(node, "variable_declarator");
    is_value_child_a_query_node = false;
    op = optional(node.try_c_by_k("assignment_operator"), (n: any) => {
      return create("ValueNode", this.context, n);
    });
    value = optional(node.try_c_by_n("value"), (n: any) => {
      is_value_child_a_query_node = this.context.query_expression(n);
      return make("VariableInitializer", this.context, "exp", create("Expression", this.context, n));
    });
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.op = op;
    this.value = value;
    this.is_value_child_a_query_node = is_value_child_a_query_node;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let docs: any, n: any, value: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = [this.name.build(b)];
      if ((this.value == null)) {
        result.push(b.concat(docs));
        return ;
      }
      value = this.value;
      docs.push(b.txt(" "));
      if ((n = this.op)) {
        docs.push(n.build(b));
      }
      if (this.is_value_child_a_query_node) {
        if (((b.config["query_bracket_next_line"] !== undefined) && b.config.query_bracket_next_line())) {
          docs.push(b.force_break());
          docs.push(b.maybeline());
          docs.push(value.build(b));
          result.push(b.concat(docs));
        } else {
          docs.push(b.txt(" "));
          docs.push(value.build(b));
          result.push(b.concat(docs));
        }
      } else {
        docs.push(b.softline());
        docs.push(value.build(b));
        result.push(b.group_indent_concat(docs));
      }
    });
  }
}

class GenericType extends Model {
  public generic_identifier: any;
  public type_arguments: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let generic_identifier: any, s: any, t: any;
    this.context.assert_check(node, "generic_type");
    generic_identifier = (() => {
      if ((t = node.try_c_by_k("type_identifier"))) {
        return make("GenericIdentifier", this.context, "type", t.value);
      } else if ((s = node.try_c_by_k("scoped_type_identifier"))) {
        return make("GenericIdentifier", this.context, "scoped", create("ScopedTypeIdentifier", this.context, s));
      } else {
        return fail("## can't build generic_identifier node in GenericType");
      }
    })();
    this.generic_identifier = generic_identifier;
    this.type_arguments = create("TypeArguments", this.context, node.c_by_k("type_arguments"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(this.generic_identifier.build(b));
      result.push(this.type_arguments.build(b));
    });
  }
}

class GenericIdentifier extends Model {
  constructor(formatContext: FormatContext, variant: string, value: any = null) {
    super(formatContext);
    this.variant = variant;
    this.value = value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "type":
      {
        result.push(b.txt(this.value));
        break;
      }
      case "scoped":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class IfStatement extends Model {
  public condition: any;
  public consequence: any;
  public alternative: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let alternative: any;
    this.context.assert_check(node, "if_statement");
    alternative = optional(node.try_c_by_n("alternative"), (a: any) => {
      return create("Statement", this.context, a);
    });
    this.condition = create("ParenthesizedExpression", this.context, node.c_by_n("condition"));
    this.consequence = create("Statement", this.context, node.c_by_n("consequence"));
    this.alternative = alternative;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let a: any, else_on_new_line: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("if "));
      result.push(this.condition.build(b));
      if (this.consequence.is_block) {
        result.push(b.txt(" "));
        result.push(this.consequence.build(b));
      } else {
        result.push(b.indent(b.nl()));
        result.push(b.indent(this.consequence.build(b)));
      }
      if ((a = this.alternative)) {
        else_on_new_line = ((b.config["else_on_new_line"] !== undefined) && b.config.else_on_new_line);
        switch (a.variant) {
          case "if":
          {
            if ((else_on_new_line || (!this.consequence.is_block))) {
              result.push(b.nl());
              result.push(b.txt("else "));
            } else {
              result.push(b.txt(" else "));
            }
            result.push(a.build(b));
            break;
          }
          case "block":
          {
            if ((else_on_new_line || (!this.consequence.is_block))) {
              result.push(b.nl());
              result.push(b.txt("else "));
            } else {
              result.push(b.txt(" else "));
            }
            result.push(a.build(b));
            break;
          }
          default: {
            if ((else_on_new_line || (!this.consequence.is_block))) {
              result.push(b.nl());
              if (a.is_block) {
                result.push(b.txt("else "));
              } else {
                result.push(b.txt("else"));
                result.push(b.indent(b.nl()));
              }
            } else {
              result.push(b.txt(" else "));
            }
            result.push(a.build(b));
            break;
          }
        }
      }
    });
  }
}

class ParenthesizedExpression extends Model {
  public exp: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.exp = create("Expression", this.context, node.first_c);
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let doc: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("("));
      doc = b.concat([b.indent(b.maybeline()), b.indent(this.exp.build(b)), b.maybeline()]);
      result.push(b.group(doc));
      result.push(b.txt(")"));
    });
  }
}

class ForInitOption extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      let parent: any;
      switch (node.kind) {
        case "local_variable_declaration":
        {
          return { variant: "declaration", value: create("LocalVariableDeclaration", this.context, node) };
          break;
        }
        default: {
          parent = node.parent;
          if ((parent == null)) { fail("node must have parent in ForInitOption"); }
          return { variant: "exps", value: parent.cs_by_n("init").map((n: any) => {
            return create("Expression", this.context, n);
          }) };
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let doc: any, docs: any, sep: any;
    switch (this.variant) {
      case "declaration":
      {
        result.push(this.value.build(b));
        break;
      }
      case "exps":
      {
        docs = b.to_docs(this.value);
        sep = new Insertable(null, ",", b.softline());
        doc = b.group(b.intersperse(docs, sep));
        result.push(doc);
        break;
      }
    }
  }
}

class ForStatement extends Model {
  public init: any;
  public condition: any;
  public update: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let condition: any, init: any, update: any;
    this.context.assert_check(node, "for_statement");
    init = optional(node.try_c_by_n("init"), (n: any) => {
      return create("ForInitOption", this.context, n);
    });
    condition = optional(node.try_c_by_n("condition"), (n: any) => {
      return create("Expression", this.context, n);
    });
    update = optional(node.try_c_by_n("update"), (n: any) => {
      return create("Expression", this.context, n);
    });
    this.init = init;
    this.condition = condition;
    this.update = update;
    this.body = create("Statement", this.context, node.c_by_n("body"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let c: any, close: any, condition: any, doc: any, docs: any, i: any, init: any, open: any, sep: any, u: any, update: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("for "));
      init = (() => {
        if ((i = this.init)) {
          return i.build(b);
        } else {
          return b.nil_doc();
        }
      })();
      condition = (() => {
        if ((c = this.condition)) {
          return b.concat([b.txt(" "), c.build(b)]);
        } else {
          return b.nil_doc();
        }
      })();
      update = (() => {
        if ((u = this.update)) {
          return b.concat([b.txt(" "), u.build(b)]);
        } else {
          return b.nil_doc();
        }
      })();
      docs = [init, condition, update];
      sep = new Insertable(null, ";", b.maybeline());
      open = new Insertable(null, "(", b.maybeline());
      close = new Insertable(b.maybeline(), ")", null);
      doc = b.group_surround(docs, sep, open, close);
      result.push(doc);
      switch (this.body.variant) {
        case "semi_column":
        {
          result.push(b.txt(";"));
          break;
        }
        default: {
          result.push(b.txt(" "));
          result.push(this.body.build(b));
          break;
        }
      }
    });
  }
}

class EnhancedForStatement extends Model {
  public modifiers: any;
  public type_: any;
  public name: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let modifiers: any;
    this.context.assert_check(node, "enhanced_for_statement");
    modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    this.modifiers = modifiers;
    this.type_ = create("UnannotatedType", this.context, node.c_by_n("type"));
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.value = create("Expression", this.context, node.c_by_n("value"));
    this.body = create("Statement", this.context, node.c_by_n("body"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("for ("));
      result.push(this.type_.build(b));
      result.push(b.txt(" "));
      result.push(this.name.build(b));
      result.push(b._txt_(":"));
      result.push(this.value.build(b));
      result.push(b.txt(")"));
      switch (this.body.variant) {
        case "semi_column":
        {
          result.push(b.txt(";"));
          break;
        }
        default: {
          result.push(b.txt(" "));
          result.push(this.body.build(b));
          break;
        }
      }
    });
  }
}

class UpdateExpressionVariant extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      let operand_node: any, operator_node: any;
      this.context.assert_check(node, "update_expression");
      operator_node = node.c_by_n("operator");
      operand_node = node.c_by_n("operand");
      if ((operator_node.start_byte < operand_node.start_byte)) {
        return { variant: "pre", value: { "operator": operator_node.value, "operand": create("Expression", this.context, operand_node) } };
      } else {
        return { variant: "post", value: { "operand": create("Expression", this.context, operand_node), "operator": operator_node.value } };
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "pre":
      {
        result.push(b.txt(this.value["operator"]));
        result.push(this.value["operand"].build(b));
        break;
      }
      case "post":
      {
        result.push(this.value["operand"].build(b));
        result.push(b.txt(this.value["operator"]));
        break;
      }
    }
  }
}

class ScopedTypeIdentifier extends Model {
  public scoped_choice: any;
  public annotations: any;
  public type_identifier: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let annotations: any, prefix_node: any, scoped_choice: any, type_identifier_node: any;
    this.context.assert_check(node, "scoped_type_identifier");
    prefix_node = node.first_c;
    scoped_choice = (() => {
      switch (prefix_node.kind) {
        case "type_identifier":
        {
          return make("ScopedChoice", this.context, "type_identifier", prefix_node.value);
          break;
        }
        case "scoped_type_identifier":
        {
          return make("ScopedChoice", this.context, "scoped", create("ScopedTypeIdentifier", this.context, prefix_node));
          break;
        }
        case "generic_type":
        {
          return make("ScopedChoice", this.context, "generic", create("GenericType", this.context, prefix_node));
          break;
        }
        default: {
          return this.context.panic_unknown_node(prefix_node, "ScopedTypeIdentifier");
          break;
        }
      }
    })();
    annotations = node.try_cs_by_k("annotation").map((n: any) => {
      return create("Annotation", this.context, n);
    });
    type_identifier_node = node.cs_by_k("type_identifier").pop();
    if ((type_identifier_node == null)) { fail("## mandatory node type_identifier missing in ScopedTypeIdentifier"); }
    this.scoped_choice = scoped_choice;
    this.annotations = annotations;
    this.type_identifier = type_identifier_node.value;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let docs: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(this.scoped_choice.build(b));
      result.push(b.txt("."));
      if ((!(this.annotations.length === 0))) {
        docs = b.to_docs(this.annotations);
        sep = new Insertable(null, " ", null);
        result.push(b.intersperse(docs, sep));
        result.push(b.txt(" "));
      }
      result.push(b.txt(this.type_identifier));
    });
  }
}

class ScopedChoice extends Model {
  constructor(formatContext: FormatContext, variant: string, value: any = null) {
    super(formatContext);
    this.variant = variant;
    this.value = value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "type_identifier":
      {
        result.push(b.txt(this.value));
        break;
      }
      case "scoped":
      {
        result.push(this.value.build(b));
        break;
      }
      case "generic":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class ConstructorDeclaration extends Model {
  public modifiers: any;
  public type_parameters: any;
  public name: any;
  public parameters: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let modifiers: any, type_parameters: any;
    modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    type_parameters = optional(node.try_c_by_k("type_parameters"), (n: any) => {
      return create("TypeParameters", this.context, n);
    });
    this.modifiers = modifiers;
    this.type_parameters = type_parameters;
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.parameters = create("FormalParameters", this.context, node.c_by_n("parameters"));
    this.body = create("ConstructorBody", this.context, node.c_by_n("body"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let n: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      if ((n = this.type_parameters)) {
        result.push(n.build(b));
      }
      result.push(this.name.build(b));
      result.push(this.parameters.build(b));
      result.push(b.txt(" "));
      result.push(this.body.build(b));
    });
  }
}

class ConstructorBody extends Model {
  public constructor_invocation: any;
  public statements: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let constructor_invocation: any, statements: any;
    constructor_invocation = null;
    statements = [];
    node.children_vec.forEach((c: any, i: any) => {
      if (((i === 0) && (c.kind === "explicit_constructor_invocation"))) {
        constructor_invocation = new BodyMember(this.context, c, create("ConstructInvocation", this.context, c));
      } else {
        statements.push(new BodyMember(this.context, c, create("Statement", this.context, c)));
      }
    });
    this.constructor_invocation = constructor_invocation;
    this.statements = statements;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let bucket: any, c: any;
    bucket = this.context.get_comment_bucket(this.node_info.id);
    this.context.handle_pre_comments(b, bucket, result);
    if ((bucket.dangling_comments.length === 0)) {
      if (((this.constructor_invocation == null) && (this.statements.length === 0))) {
        return result.push(b.concat([b.txt("{"), b.nl(), b.txt("}")]));
      }
      result.push(b.txt("{"));
      if ((c = this.constructor_invocation)) {
        result.push(b.indent(b.concat([b.nl(), c.member.build(b), b.txt(";")])));
        if ((!(this.statements.length === 0))) {
          if (c.has_trailing_newline) {
            result.push(b.nl_with_no_indent());
          }
          result.push(b.nl());
        }
      } else {
        result.push(b.indent(b.nl()));
      }
      result.push(b.indent(b.intersperse_body_members(this.statements)));
      result.push(b.nl());
      result.push(b.txt("}"));
    } else {
      this.context.handle_dangling_comments_in_bracket_surround(b, bucket, result);
    }
  }
}

class ConstructInvocation extends Model {
  public object: any;
  public type_arguments: any;
  public constructor_kind: any;
  public arguments: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let constructor: any, object: any, type_arguments: any;
    object = optional(node.try_c_by_n("object"), (n: any) => {
      return create("PrimaryExpression", this.context, n);
    });
    type_arguments = optional(node.try_c_by_k("type_arguments"), (n: any) => {
      return create("TypeArguments", this.context, n);
    });
    constructor = optional(node.try_c_by_n("constructor"), (n: any) => {
      switch (n.kind) {
        case "this":
        {
          return make("Constructor", this.context, "this");
          break;
        }
        case "super":
        {
          return make("Constructor", this.context, "super");
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "Constructor");
          break;
        }
      }
    });
    this.object = object;
    this.type_arguments = type_arguments;
    this.constructor_kind = constructor;
    this.arguments = create("ArgumentList", this.context, node.c_by_n("arguments"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let c: any, o: any, t: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((o = this.object)) {
        result.push(o.build(b));
      }
      if ((t = this.type_arguments)) {
        result.push(t.build(b));
      }
      if ((c = this.constructor_kind)) {
        result.push(c.build(b));
      }
      result.push(this.arguments.build(b));
    });
  }
}

class Constructor extends Model {
  constructor(formatContext: FormatContext, variant: string, value: any = null) {
    super(formatContext);
    this.variant = variant;
    this.value = value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "this":
      {
        result.push(b.txt("this"));
        break;
      }
      case "super":
      {
        result.push(b.txt("super"));
        break;
      }
    }
  }
}

class TypeParameters extends Model {
  public type_parameters: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let type_parameters: any;
    this.context.assert_check(node, "type_parameters");
    type_parameters = node.cs_by_k("type_parameter").map((n: any) => {
      return create("TypeParameter", this.context, n);
    });
    this.type_parameters = type_parameters;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let close: any, doc: any, docs: any, open: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = b.to_docs(this.type_parameters);
      sep = new Insertable(null, ",", b.softline());
      open = new Insertable(null, "<", b.maybeline());
      close = new Insertable(b.maybeline(), ">", null);
      doc = b.group_surround(docs, sep, open, close);
      result.push(doc);
    });
  }
}

class TypeParameter extends Model {
  public annotations: any;
  public type_identifier: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let annotations: any;
    annotations = node.try_cs_by_k("annotation").map((n: any) => {
      return create("Annotation", this.context, n);
    });
    this.annotations = annotations;
    this.type_identifier = node.cvalue_by_k("type_identifier");
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let docs: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if (!((this.annotations.length === 0))) {
        docs = b.to_docs(this.annotations);
        sep = new Insertable(null, " ", null);
        result.push(b.intersperse(docs, sep));
        result.push(b.txt(" "));
      }
      result.push(b.txt(this.type_identifier));
    });
  }
}

class ObjectCreationExpression extends Model {
  public type_arguments: any;
  public type_: any;
  public arguments: any;
  public class_body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let class_body: any, type_arguments: any;
    this.context.assert_check(node, "object_creation_expression");
    type_arguments = optional(node.try_c_by_k("type_arguments"), (n: any) => {
      return create("TypeArguments", this.context, n);
    });
    class_body = optional(node.try_c_by_k("class_body"), (n: any) => {
      return create("ClassBody", this.context, n);
    });
    this.type_arguments = type_arguments;
    this.type_ = create("UnannotatedType", this.context, node.c_by_n("type"));
    this.arguments = create("ArgumentList", this.context, node.c_by_n("arguments"));
    this.class_body = class_body;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let c: any, t: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("new"));
      if ((t = this.type_arguments)) {
        result.push(t.build(b));
      }
      result.push(b.txt(" "));
      result.push(this.type_.build(b));
      result.push(this.arguments.build(b));
      if ((c = this.class_body)) {
        result.push(c.build(b));
      }
    });
  }
}

class RunAsStatement extends Model {
  public user: any;
  public block: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "run_as_statement");
    this.user = create("ParenthesizedExpression", this.context, node.c_by_n("user"));
    this.block = create("Block", this.context, node.c_by_k("block"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("System.runAs"));
      result.push(this.user.build(b));
      result.push(b.txt(" "));
      result.push(this.block.build(b));
    });
  }
}

class DoStatement extends Model {
  public body: any;
  public condition: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "do_statement");
    this.body = create("Block", this.context, node.c_by_n("body"));
    this.condition = create("ParenthesizedExpression", this.context, node.c_by_n("condition"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt_("do"));
      result.push(this.body.build(b));
      if (((b.config["while_on_new_line"] !== undefined) && b.config.while_on_new_line)) {
        result.push(b.nl());
        result.push(b.txt_("while"));
      } else {
        result.push(b._txt_("while"));
      }
      result.push(this.condition.build(b));
      result.push(b.txt(";"));
    });
  }
}

class WhileStatement extends Model {
  public condition: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "while_statement");
    this.condition = create("ParenthesizedExpression", this.context, node.c_by_n("condition"));
    this.body = create("Statement", this.context, node.c_by_n("body"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt_("while"));
      result.push(this.condition.build(b));
      switch (this.body.variant) {
        case "semi_column":
        {
          result.push(b.txt(";"));
          break;
        }
        default: {
          result.push(b.txt(" "));
          result.push(this.body.build(b));
          break;
        }
      }
    });
  }
}

class UnaryExpression extends Model {
  public operator: any;
  public operand: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let operator: any;
    this.context.assert_check(node, "unary_expression");
    operator = node.cvalue_by_n("operator");
    this.operator = operator;
    this.operand = create("Expression", this.context, node.c_by_n("operand"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt(this.operator));
      result.push(this.operand.build(b));
    });
  }
}

class FieldAccess extends Model {
  public object: any;
  public property_navigation: any;
  public field: any;
  public chain_context: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let obj_node: any, object: any;
    this.context.assert_check(node, "field_access");
    obj_node = node.c_by_n("object");
    object = (() => {
      if ((obj_node.kind === "super")) {
        return make("MethodObject", this.context, "super", create("Super", this.context, obj_node));
      } else {
        return make("MethodObject", this.context, "primary", create("PrimaryExpression", this.context, obj_node));
      }
    })();
    this.object = object;
    this.property_navigation = FieldAccess.get_property_navigation(this.context, node);
    this.field = create("FieldOption", this.context, node.c_by_n("field"));
    this.chain_context = this.context.build_chaining_context(node);
    this.node_info = NodeInfo.from(node);
  }
  public static get_property_navigation(formatContext: FormatContext, parent_node: any): any {
    let n: any, property_navigation: any;
    property_navigation = (() => {
      if ((n = parent_node.try_c_by_k("safe_navigation_operator"))) {
        return make("PropertyNavigation", formatContext, "safe", create("SafeNavigationOperator", formatContext, n));
      } else {
        return make("PropertyNavigation", formatContext, "dot");
      }
    })();
    return property_navigation;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let context: any, docs: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = [];
      docs.push(this.object.build(b));
      if ((context = this.chain_context)) {
        if ((context.is_parent_a_chaining_node || context.is_top_most_in_a_chain)) {
          docs.push(b.maybeline());
        }
      }
      docs.push(this.property_navigation.build(b));
      docs.push(this.field.build(b));
      if ((this.chain_context && this.chain_context.is_top_most_in_a_chain)) {
        result.push(b.group_indent_concat(docs));
      } else {
        result.push(b.concat(docs));
      }
    });
  }
}

class FieldOption extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (node.kind) {
        case "this":
        {
          return { variant: "this", value: create("This", this.context, node) };
          break;
        }
        default: {
          return { variant: "identifier", value: create("ValueNode", this.context, node) };
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "this":
      {
        result.push(this.value.build(b));
        break;
      }
      case "identifier":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class EnumDeclaration extends Model {
  public modifiers: any;
  public name: any;
  public interface: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let interface_: any, modifiers: any;
    modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    interface_ = optional(node.try_c_by_k("interfaces"), (n: any) => {
      return create("Interface", this.context, n);
    });
    this.modifiers = modifiers;
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.interface = interface_;
    this.body = create("EnumBody", this.context, node.c_by_n("body"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let n: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      result.push(b.txt_("enum"));
      result.push(this.name.build(b));
      result.push(b.txt(" "));
      if ((n = this.interface)) {
        result.push(n.build(b));
      }
      result.push(this.body.build(b));
    });
  }
}

class EnumBody extends Model {
  public enum_constants: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let enum_constants: any;
    this.context.assert_check(node, "enum_body");
    enum_constants = node.try_cs_by_k("enum_constant").map((n: any) => {
      return create("EnumConstant", this.context, n);
    });
    this.enum_constants = enum_constants;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let bucket: any, close: any, doc: any, docs: any, open: any, sep: any;
    bucket = this.context.get_comment_bucket(this.node_info.id);
    this.context.handle_pre_comments(b, bucket, result);
    if ((bucket.dangling_comments.length === 0)) {
      docs = b.to_docs(this.enum_constants);
      if ((docs.length === 0)) {
        return result.push(b.concat([b.txt("{"), b.nl(), b.txt("}")]));
      }
      sep = new Insertable(null, ",", b.nl());
      open = new Insertable(null, "{", b.nl());
      close = new Insertable(b.nl(), "}", null);
      doc = b.group_surround(docs, sep, open, close);
      result.push(doc);
      this.context.handle_post_comments(b, bucket, result);
    } else {
      this.context.handle_dangling_comments_in_bracket_surround(b, bucket, result);
    }
  }
}

class EnumConstant extends Model {
  public modifiers: any;
  public name: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let modifiers: any;
    modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    this.modifiers = modifiers;
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let n: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      result.push(this.name.build(b));
    });
  }
}

class DmlExpressionVariant extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      let dml_type: any, security_mode: any, target: any, unannotated: any;
      security_mode = optional(node.try_c_by_k("dml_security_mode"), (n: any) => {
        return create("DmlSecurityMode", this.context, n);
      });
      target = create("Expression", this.context, node.c_by_n("target"));
      dml_type = create("DmlType", this.context, node.c_by_k("dml_type"));
      switch (dml_type.variant.variant) {
        case "merge":
        {
          return { variant: "merge", value: { "dml_type": dml_type, "security_mode": security_mode, "target": target, "merge_with": create("Expression", this.context, node.c_by_n("merge_with")) } };
          break;
        }
        case "upsert":
        {
          unannotated = optional(node.try_c_by_n("upsert_key"), (n: any) => {
            return create("UnannotatedType", this.context, n);
          });
          return { variant: "upsert", value: { "dml_type": dml_type, "security_mode": security_mode, "target": target, "unannotated": unannotated } };
          break;
        }
        default: {
          return { variant: "basic", value: { "dml_type": dml_type, "security_mode": security_mode, "target": target } };
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let dml_type: any, doc: any, docs: any, exp: any, exp_extra: any, s: any, security_mode: any, sep: any, u: any, unannotated: any;
    switch (this.variant) {
      case "basic":
      {
        dml_type = this.value["dml_type"];
        security_mode = this.value["security_mode"];
        exp = this.value["target"];
        result.push(dml_type.build(b));
        result.push(b.txt(" "));
        if ((s = security_mode)) {
          result.push(s.build(b));
          result.push(b.txt(" "));
        }
        result.push(exp.build(b));
        break;
      }
      case "merge":
      {
        dml_type = this.value["dml_type"];
        security_mode = this.value["security_mode"];
        exp = this.value["target"];
        exp_extra = this.value["merge_with"];
        result.push(dml_type.build(b));
        result.push(b.txt(" "));
        if ((s = security_mode)) {
          result.push(s.build(b));
          result.push(b.txt(" "));
        }
        docs = b.to_docs([exp, exp_extra]);
        sep = new Insertable(null, null, b.softline());
        doc = b.group(b.indent(b.intersperse(docs, sep)));
        result.push(doc);
        break;
      }
      case "upsert":
      {
        dml_type = this.value["dml_type"];
        security_mode = this.value["security_mode"];
        exp = this.value["target"];
        unannotated = this.value["unannotated"];
        result.push(dml_type.build(b));
        result.push(b.txt(" "));
        docs = [];
        if ((s = security_mode)) {
          docs.push(s.build(b));
        }
        docs.push(exp.build(b));
        if ((u = unannotated)) {
          docs.push(u.build(b));
        }
        sep = new Insertable(null, null, b.softline());
        doc = b.group(b.indent(b.intersperse(docs, sep)));
        result.push(doc);
        break;
      }
    }
    result.push(b.nil_doc());
  }
}

class DmlSecurityMode extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      let child: any;
      child = n.first_c;
      switch (child.kind) {
        case "user":
        {
          return { variant: "user", value: child.value };
          break;
        }
        case "system":
        {
          return { variant: "system", value: child.value };
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "DmlSecurityMode");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    result.push(b.txt_("as"));
    switch (this.variant) {
      case "user":
      {
        result.push(b.txt(this.value));
        break;
      }
      case "system":
      {
        result.push(b.txt(this.value));
        break;
      }
    }
  }
}

class DmlTypeVariant extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      let k: any;
      k = node.kind;
      switch (k) {
        case "insert":
        {
          return { variant: "insert", value: null };
          break;
        }
        case "update":
        {
          return { variant: "update", value: null };
          break;
        }
        case "delete":
        {
          return { variant: "delete", value: null };
          break;
        }
        case "undelete":
        {
          return { variant: "undelete", value: null };
          break;
        }
        case "merge":
        {
          return { variant: "merge", value: null };
          break;
        }
        case "upsert":
        {
          return { variant: "upsert", value: null };
          break;
        }
        default: {
          return fail(("## unknown node: " + String(k) + " in DmlTypeVariant "));
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let txt: any;
    txt = (() => {
      switch (this.variant) {
        case "insert":
        {
          return "insert";
          break;
        }
        case "update":
        {
          return "update";
          break;
        }
        case "delete":
        {
          return "delete";
          break;
        }
        case "undelete":
        {
          return "undelete";
          break;
        }
        case "merge":
        {
          return "merge";
          break;
        }
        case "upsert":
        {
          return "upsert";
          break;
        }
      }
    })();
    result.push(b.txt(txt));
  }
}

class ArrayAccess extends Model {
  public array: any;
  public index: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "array_access");
    this.array = create("PrimaryExpression", this.context, node.c_by_n("array"));
    this.index = create("Expression", this.context, node.c_by_n("index"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(this.array.build(b));
      result.push(b.txt("["));
      result.push(this.index.build(b));
      result.push(b.txt("]"));
    });
  }
}

class ArrayCreationExpression extends Model {
  public type_: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let dimensions: any, dimensions_exprs: any, dimensions_node: any, value: any, value_node: any, variant: any;
    this.context.assert_check(node, "array_creation_expression");
    value_node = node.try_c_by_n("value");
    dimensions_node = node.try_c_by_n("dimensions");
    variant = (() => {
      if ((value_node == null)) {
        dimensions_exprs = node.cs_by_k("dimensions_expr").map((n: any) => {
          return create("DimensionsExpr", this.context, n);
        });
        dimensions = optional(node.try_c_by_k("dimensions"), (n: any) => {
          return create("Dimensions", this.context, n);
        });
        return make("ArrayCreationVariant", this.context, "dd", { "dimensions_exprs": dimensions_exprs, "dimensions": dimensions });
      } else if ((dimensions_node == null)) {
        value = create("ArrayInitializer", this.context, node.c_by_n("value"));
        return make("ArrayCreationVariant", this.context, "only_v", { "value": value });
      } else {
        return make("ArrayCreationVariant", this.context, "dv", { "value": create("ArrayInitializer", this.context, value_node), "dimensions": create("Dimensions", this.context, dimensions_node) });
      }
    })();
    this.type_ = create("SimpleType", this.context, node.c_by_n("type"));
    this.variant = variant;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt_("new"));
      result.push(this.type_.build(b));
      result.push(this.variant.build(b));
    });
  }
}

class ArrayCreationVariant extends Model {
  constructor(formatContext: FormatContext, variant: string, value: any = null) {
    super(formatContext);
    this.variant = variant;
    this.value = value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let n: any;
    switch (this.variant) {
      case "only_v":
      {
        result.push(this.value["value"].build(b));
        break;
      }
      case "dd":
      {
        this.value["dimensions_exprs"].forEach((n: any) => {
          result.push(n.build(b));
        });
        if ((n = this.value["dimensions"])) {
          result.push(b.txt(" "));
          result.push(n.build(b));
        }
        break;
      }
      case "dv":
      {
        result.push(this.value["dimensions"].build(b));
        result.push(this.value["value"].build(b));
        break;
      }
    }
  }
}

class Dimensions extends Model {
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "dimensions");
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("[]"));
    });
  }
}

class DimensionsExpr extends Model {
  public exp: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "dimensions_expr");
    this.exp = create("Expression", this.context, node.first_c);
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("["));
      result.push(this.exp.build(b));
      result.push(b.txt("]"));
    });
  }
}

class ReturnStatement extends Model {
  public exp: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "return_statement");
    this.exp = optional(node.try_first_c, (n: any) => {
      return create("Expression", this.context, n);
    });
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let exp: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt("return"));
      if ((exp = this.exp)) {
        result.push(b.txt(" "));
        result.push(exp.build(b));
      }
      result.push(b.txt(";"));
    });
  }
}

class TernaryExpression extends Model {
  public condition: any;
  public consequence: any;
  public alternative: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "ternary_expression");
    this.condition = create("Expression", this.context, node.c_by_n("condition"));
    this.consequence = create("Expression", this.context, node.c_by_n("consequence"));
    this.alternative = create("Expression", this.context, node.c_by_n("alternative"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let docs: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      docs = [this.condition.build(b), b.softline(), b.txt_("?"), this.consequence.build(b), b.softline(), b.txt_(":"), this.alternative.build(b)];
      result.push(b.group_concat(docs));
    });
  }
}

class TryStatement extends Model {
  public body: any;
  public tail: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let tail: any;
    this.context.assert_check(node, "try_statement");
    tail = (() => {
      if (node.try_c_by_k("finally_clause")) {
        return make("TryStatementTail", this.context, "catches_finally", [node.try_cs_by_k("catch_clause").map((n: any) => {
          return create("CatchClause", this.context, n);
        }), create("FinallyClause", this.context, node.c_by_k("finally_clause"))]);
      } else {
        return make("TryStatementTail", this.context, "catches", node.cs_by_k("catch_clause").map((n: any) => {
          return create("CatchClause", this.context, n);
        }));
      }
    })();
    this.body = create("Block", this.context, node.c_by_n("body"));
    this.tail = tail;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt_("try"));
      result.push(this.body.build(b));
      result.push(this.tail.build(b));
    });
  }
}

class TryStatementTail extends Model {
  constructor(formatContext: FormatContext, variant: string, value: any = null) {
    super(formatContext);
    this.variant = variant;
    this.value = value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let catches_doc: any, docs: any, f: any, v: any;
    switch (this.variant) {
      case "catches":
      {
        v = this.value;
        docs = b.to_docs(v);
        catches_doc = b.concat(docs);
        result.push(catches_doc);
        break;
      }
      case "catches_finally":
      {
        [v, f] = this.value;
        docs = b.to_docs(v);
        catches_doc = b.concat(docs);
        result.push(catches_doc);
        result.push(f.build(b));
        break;
      }
    }
  }
}

class CatchClause extends Model {
  public formal_parameter: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "catch_clause");
    this.formal_parameter = create("FormalParameter", this.context, node.c_by_k("formal_parameter"));
    this.body = create("Block", this.context, node.c_by_n("body"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if (((b.config["catch_on_new_line"] !== undefined) && b.config.catch_on_new_line)) {
        result.push(b.nl());
        result.push(b.txt_("catch"));
      } else {
        result.push(b._txt_("catch"));
      }
      result.push(b.txt("("));
      result.push(this.formal_parameter.build(b));
      result.push(b.txt_(")"));
      result.push(this.body.build(b));
    });
  }
}

class FinallyClause extends Model {
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "finally_clause");
    this.body = create("Block", this.context, node.c_by_k("block"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if (((b.config["finally_on_new_line"] !== undefined) && b.config.finally_on_new_line)) {
        result.push(b.nl());
        result.push(b.txt_("finally"));
      } else {
        result.push(b._txt_("finally"));
      }
      result.push(this.body.build(b));
    });
  }
}

class StaticInitializer extends Model {
  public block: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.block = create("Block", this.context, node.c_by_k("block"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(b.txt_("static"));
      result.push(this.block.build(b));
    });
  }
}

class InterfaceDeclaration extends Model {
  public modifiers: any;
  public name: any;
  public type_parameters: any;
  public extends: any;
  public body: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let extends_: any, modifiers: any, type_parameters: any;
    this.context.assert_check(node, "interface_declaration");
    modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    type_parameters = optional(node.try_c_by_k("type_parameters"), (n: any) => {
      return create("TypeParameters", this.context, n);
    });
    extends_ = optional(node.try_c_by_k("extends_interfaces"), (n: any) => {
      return create("ExtendsInterface", this.context, n);
    });
    this.modifiers = modifiers;
    this.name = create("ValueNode", this.context, node.c_by_n("name"));
    this.type_parameters = type_parameters;
    this.extends = extends_;
    this.body = create("InterfaceBody", this.context, node.c_by_n("body"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let n: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      result.push(b.txt_("interface"));
      result.push(this.name.build(b));
      if ((n = this.type_parameters)) {
        result.push(n.build(b));
      }
      if ((n = this.extends)) {
        result.push(n.build(b));
      }
      result.push(b.txt(" "));
      result.push(this.body.build(b));
    });
  }
}

class ExtendsInterface extends Model {
  public type_list: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.type_list = create("TypeList", this.context, node.c_by_k("type_list"));
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let doc: any, extends_group: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      doc = this.type_list.build(b);
      extends_group = b.concat([b._txt_("extends"), doc]);
      result.push(extends_group);
    });
  }
}

class InterfaceBody extends Model {
  public members: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let member: any, members: any;
    this.context.assert_check(node, "interface_body");
    members = node.children_vec.map((n: any) => {
      member = (() => {
        switch (n.kind) {
          case "constant_declaration":
          {
            return make("InterfaceMember", this.context, "constant", create("ConstantDeclaration", this.context, n));
            break;
          }
          case "enum_declaration":
          {
            return make("InterfaceMember", this.context, "enum_d", create("EnumDeclaration", this.context, n));
            break;
          }
          case "method_declaration":
          {
            return make("InterfaceMember", this.context, "method", create("MethodDeclaration", this.context, n));
            break;
          }
          case "class_declaration":
          {
            return make("InterfaceMember", this.context, "class", create("ClassDeclaration", this.context, n));
            break;
          }
          case "interface_declaration":
          {
            return make("InterfaceMember", this.context, "interface", create("InterfaceDeclaration", this.context, n));
            break;
          }
          default: {
            return this.context.panic_unknown_node(n, "InterfaceBody");
            break;
          }
        }
      })();
      return new BodyMember(this.context, n, member);
    });
    this.members = members;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let bucket: any;
    bucket = this.context.get_comment_bucket(this.node_info.id);
    this.context.handle_pre_comments(b, bucket, result);
    if ((bucket.dangling_comments.length === 0)) {
      result.push(b.surround_body_members(this.members, "{", "}"));
      this.context.handle_post_comments(b, bucket, result);
    } else {
      this.context.handle_dangling_comments_in_bracket_surround(b, bucket, result);
    }
  }
}

class InterfaceMember extends Model {
  constructor(formatContext: FormatContext, variant: string, value: any = null) {
    super(formatContext);
    this.variant = variant;
    this.value = value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "constant":
      {
        result.push(this.value.build(b));
        break;
      }
      case "enum_d":
      {
        result.push(this.value.build(b));
        break;
      }
      case "method":
      {
        result.push(this.value.build(b));
        break;
      }
      case "class":
      {
        result.push(this.value.build(b));
        break;
      }
      case "interface":
      {
        result.push(this.value.build(b));
        break;
      }
      default: {
        fail("unimplemented");
        break;
      }
    }
  }
}

class ConstantDeclaration extends Model {
  public modifiers: any;
  public type_: any;
  public declarators: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let declarators: any, modifiers: any;
    modifiers = optional(node.try_c_by_k("modifiers"), (n: any) => {
      return create("Modifiers", this.context, n);
    });
    declarators = node.cs_by_n("declarator").map((n: any) => {
      return create("VariableDeclarator", this.context, n);
    });
    this.modifiers = modifiers;
    this.type_ = create("UnannotatedType", this.context, node.c_by_n("type"));
    this.declarators = declarators;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let doc: any, docs: any, n: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if ((n = this.modifiers)) {
        result.push(n.build(b));
      }
      result.push(this.type_.build(b));
      result.push(b.txt(" "));
      docs = b.to_docs(this.declarators);
      sep = new Insertable(null, ",", b.softline());
      doc = b.group(b.intersperse(docs, sep));
      result.push(doc);
      result.push(b.txt(";"));
    });
  }
}

class AccessorList extends Model {
  public accessor_declarations: any;
  public child_has_body_section: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    let accessor_declarations: any, child_has_body_section: any;
    this.context.assert_check(node, "accessor_list");
    accessor_declarations = node.cs_by_k("accessor_declaration").map((n: any) => {
      return create("AccessorDeclaration", this.context, n);
    });
    child_has_body_section = accessor_declarations.some((n: any) => {
      return (!(n.body == null));
    });
    this.accessor_declarations = accessor_declarations;
    this.child_has_body_section = child_has_body_section;
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    let close: any, doc: any, docs: any, joined: any, open: any, sep: any;
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      if (this.child_has_body_section) {
        docs = b.to_docs(this.accessor_declarations);
        sep = new Insertable(null, null, b.nl());
        joined = [b.txt("{"), b.indent(b.nl()), b.indent(b.intersperse(docs, sep)), b.nl(), b.txt("}")];
        result.push(b.concat(joined));
      } else {
        docs = b.to_docs(this.accessor_declarations);
        sep = new Insertable(null, null, b.softline());
        open = new Insertable(null, "{", b.softline());
        close = new Insertable(b.softline(), "}", null);
        doc = b.group_surround(docs, sep, open, close);
        result.push(doc);
      }
    });
  }
}

class RootMember extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (n.kind) {
        case "class_declaration":
        {
          return { variant: "class", value: create("ClassDeclaration", this.context, n) };
          break;
        }
        case "enum_declaration":
        {
          return { variant: "enum", value: create("EnumDeclaration", this.context, n) };
          break;
        }
        case "trigger_declaration":
        {
          return { variant: "trigger", value: create("TriggerDeclaration", this.context, n) };
          break;
        }
        case "interface_declaration":
        {
          return { variant: "interface", value: create("InterfaceDeclaration", this.context, n) };
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "Root");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "class":
      {
        result.push(this.value.build(b));
        break;
      }
      case "enum":
      {
        result.push(this.value.build(b));
        break;
      }
      case "interface":
      {
        result.push(this.value.build(b));
        break;
      }
      case "trigger":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class ClassMember extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (n.kind) {
        case "field_declaration":
        {
          return { variant: "field", value: create("FieldDeclaration", this.context, n) };
          break;
        }
        case "class_declaration":
        {
          return { variant: "nested_class", value: create("ClassDeclaration", this.context, n) };
          break;
        }
        case "method_declaration":
        {
          return { variant: "method", value: create("MethodDeclaration", this.context, n) };
          break;
        }
        case "interface_declaration":
        {
          return { variant: "interface", value: create("InterfaceDeclaration", this.context, n) };
          break;
        }
        case "block":
        {
          return { variant: "block", value: create("Block", this.context, n) };
          break;
        }
        case "constructor_declaration":
        {
          return { variant: "constructor", value: create("ConstructorDeclaration", this.context, n) };
          break;
        }
        case "enum_declaration":
        {
          return { variant: "enum", value: create("EnumDeclaration", this.context, n) };
          break;
        }
        case "static_initializer":
        {
          return { variant: "static", value: create("StaticInitializer", this.context, n) };
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "ClassMember");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "field":
      {
        result.push(this.value.build(b));
        break;
      }
      case "nested_class":
      {
        result.push(this.value.build(b));
        break;
      }
      case "method":
      {
        result.push(this.value.build(b));
        break;
      }
      case "interface":
      {
        result.push(this.value.build(b));
        break;
      }
      case "block":
      {
        result.push(this.value.build(b));
        break;
      }
      case "constructor":
      {
        result.push(this.value.build(b));
        break;
      }
      case "enum":
      {
        result.push(this.value.build(b));
        break;
      }
      case "static":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class UnannotatedType extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (n.kind) {
        case "type_identifier":
        case "void_type":
        case "boolean_type":
        case "generic_type":
        case "java_type":
        case "scoped_type_identifier":
        {
          return { variant: "simple", value: create("SimpleType", this.context, n) };
          break;
        }
        case "array_type":
        {
          return { variant: "array", value: create("ArrayType", this.context, n) };
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "UnnanotatedType");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "simple":
      {
        result.push(this.value.build(b));
        break;
      }
      case "array":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class SimpleType extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (n.kind) {
        case "type_identifier":
        {
          return { variant: "identifier", value: create("ValueNode", this.context, n) };
          break;
        }
        case "void_type":
        {
          return { variant: "void", value: create("ValueNode", this.context, n) };
          break;
        }
        case "boolean_type":
        {
          return { variant: "bool", value: create("BoolType", this.context, n) };
          break;
        }
        case "java_type":
        {
          return { variant: "java", value: create("JavaType", this.context, n) };
          break;
        }
        case "generic_type":
        {
          return { variant: "generic", value: create("GenericType", this.context, n) };
          break;
        }
        case "scoped_type_identifier":
        {
          return { variant: "scoped", value: create("ScopedTypeIdentifier", this.context, n) };
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "SimpleType");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "identifier":
      {
        result.push(this.value.build(b));
        break;
      }
      case "java":
      {
        result.push(this.value.build(b));
        break;
      }
      case "void":
      {
        result.push(this.value.build(b));
        break;
      }
      case "bool":
      {
        result.push(this.value.build(b));
        break;
      }
      case "generic":
      {
        result.push(this.value.build(b));
        break;
      }
      case "scoped":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class VariableInitializer extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (n.kind) {
        case "array_initializer":
        {
          return { variant: "array", value: create("ArrayInitializer", this.context, n) };
          break;
        }
        default: {
          return { variant: "exp", value: create("Expression", this.context, n) };
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "exp":
      {
        result.push(this.value.build(b));
        break;
      }
      case "array":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class Expression extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (n.kind) {
        case "assignment_expression":
        {
          return { variant: "assignment", value: create("AssignmentExpression", this.context, n) };
          break;
        }
        case "binary_expression":
        {
          return { variant: "binary", value: create("BinaryExpression", this.context, n) };
          break;
        }
        case "int":
        case "decimal_floating_point_literal":
        case "query_expression":
        case "boolean":
        case "identifier":
        case "null_literal":
        case "class_literal":
        case "method_invocation":
        case "parenthesized_expression":
        case "object_creation_expression":
        case "map_creation_expression":
        case "array_access":
        case "field_access":
        case "string_literal":
        case "version_expression":
        case "java_field_access":
        case "this":
        case "array_creation_expression":
        {
          return { variant: "primary", value: create("PrimaryExpression", this.context, n) };
          break;
        }
        case "update_expression":
        {
          return { variant: "update", value: create("UpdateExpression", this.context, n) };
          break;
        }
        case "unary_expression":
        {
          return { variant: "unary", value: create("UnaryExpression", this.context, n) };
          break;
        }
        case "dml_expression":
        {
          return { variant: "dml", value: create("DmlExpression", this.context, n) };
          break;
        }
        case "ternary_expression":
        {
          return { variant: "te", value: create("TernaryExpression", this.context, n) };
          break;
        }
        case "cast_expression":
        {
          return { variant: "cast", value: create("CastExpression", this.context, n) };
          break;
        }
        case "instanceof_expression":
        {
          return { variant: "instance", value: create("InstanceOfExpression", this.context, n) };
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "Expression");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "assignment":
      {
        result.push(this.value.build(b));
        break;
      }
      case "binary":
      {
        result.push(this.value.build(b));
        break;
      }
      case "primary":
      {
        result.push(this.value.build(b));
        break;
      }
      case "update":
      {
        result.push(this.value.build(b));
        break;
      }
      case "unary":
      {
        result.push(this.value.build(b));
        break;
      }
      case "dml":
      {
        result.push(this.value.build(b));
        break;
      }
      case "te":
      {
        result.push(this.value.build(b));
        break;
      }
      case "cast":
      {
        result.push(this.value.build(b));
        break;
      }
      case "instance":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class PrimaryExpression extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (n.kind) {
        case "int":
        case "decimal_floating_point_literal":
        case "boolean":
        case "null_literal":
        case "string_literal":
        {
          return { variant: "literal", value: create("Literal_", this.context, n) };
          break;
        }
        case "identifier":
        {
          return { variant: "identifier", value: create("ValueNode", this.context, n) };
          break;
        }
        case "class_literal":
        {
          return { variant: "class", value: create("ClassLiteral", this.context, n) };
          break;
        }
        case "method_invocation":
        {
          return { variant: "method", value: create("MethodInvocation", this.context, n) };
          break;
        }
        case "parenthesized_expression":
        {
          return { variant: "parenth", value: create("ParenthesizedExpression", this.context, n) };
          break;
        }
        case "object_creation_expression":
        {
          return { variant: "obj", value: create("ObjectCreationExpression", this.context, n) };
          break;
        }
        case "map_creation_expression":
        {
          return { variant: "map", value: create("MapCreationExpression", this.context, n) };
          break;
        }
        case "field_access":
        {
          return { variant: "field", value: create("FieldAccess", this.context, n) };
          break;
        }
        case "array_access":
        {
          return { variant: "array", value: create("ArrayAccess", this.context, n) };
          break;
        }
        case "array_creation_expression":
        {
          return { variant: "array_creation", value: create("ArrayCreationExpression", this.context, n) };
          break;
        }
        case "version_expression":
        {
          return { variant: "version", value: create("VersionExpression", this.context, n) };
          break;
        }
        case "query_expression":
        {
          return { variant: "query", value: create("QueryExpression", this.context, n) };
          break;
        }
        case "java_field_access":
        {
          return { variant: "java", value: create("JavaFieldAccess", this.context, n) };
          break;
        }
        case "this":
        {
          return { variant: "this", value: create("This", this.context, n) };
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "PrimaryExpression");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "literal":
      {
        result.push(this.value.build(b));
        break;
      }
      case "identifier":
      {
        result.push(this.value.build(b));
        break;
      }
      case "class":
      {
        result.push(this.value.build(b));
        break;
      }
      case "method":
      {
        result.push(this.value.build(b));
        break;
      }
      case "parenth":
      {
        result.push(this.value.build(b));
        break;
      }
      case "obj":
      {
        result.push(this.value.build(b));
        break;
      }
      case "map":
      {
        result.push(this.value.build(b));
        break;
      }
      case "field":
      {
        result.push(this.value.build(b));
        break;
      }
      case "array":
      {
        result.push(this.value.build(b));
        break;
      }
      case "array_creation":
      {
        result.push(this.value.build(b));
        break;
      }
      case "version":
      {
        result.push(this.value.build(b));
        break;
      }
      case "query":
      {
        result.push(this.value.build(b));
        break;
      }
      case "java":
      {
        result.push(this.value.build(b));
        break;
      }
      case "this":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class ClassLiteral extends Model {
  public type_: any;
  public node_info: NodeInfo;
  constructor(formatContext: FormatContext, node: any) {
    super(formatContext);
    this.context.assert_check(node, "class_literal");
    this.type_ = create("UnannotatedType", this.context, node.first_c);
    this.node_info = NodeInfo.from(node);
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    this.context.build_with_comments(b, this.node_info.id, result, (b: any, result: any) => {
      result.push(this.type_.build(b));
      result.push(b.txt("class"));
    });
  }
}

class Literal_ extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      switch (node.kind) {
        case "boolean":
        {
          return { variant: "bool", value: create("ValueNodeLowerCase", this.context, node) };
          break;
        }
        case "null_literal":
        {
          return { variant: "null", value: create("ValueNodeLowerCase", this.context, node) };
          break;
        }
        case "int":
        {
          return { variant: "int", value: create("ValueNode", this.context, node) };
          break;
        }
        case "string_literal":
        {
          return { variant: "str", value: create("ValueNode", this.context, node) };
          break;
        }
        case "decimal_floating_point_literal":
        {
          return { variant: "decimal", value: create("ValueNodeLowerCase", this.context, node) };
          break;
        }
        default: {
          return this.context.panic_unknown_node(node, "Literal_");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "bool":
      {
        result.push(this.value.build(b));
        break;
      }
      case "null":
      {
        result.push(this.value.build(b));
        break;
      }
      case "int":
      {
        result.push(this.value.build(b));
        break;
      }
      case "decimal":
      {
        result.push(this.value.build(b));
        break;
      }
      case "str":
      {
        result.push(this.value.build(b));
        break;
      }
    }
  }
}

class ModifierKind extends Model {
  constructor(formatContext: FormatContext, node: any, value: any = null) {
    super(formatContext);
    const n = node;
    if (typeof node === "string") {
      this.variant = node;
      this.value = value;
      return;
    }
    const selected = (() => {
      let kind: any;
      kind = n.kind;
      switch (kind) {
        case "global":
        {
          return { variant: "global", value: null };
          break;
        }
        case "public":
        {
          return { variant: "public", value: null };
          break;
        }
        case "with_sharing":
        {
          return { variant: "with_sharing", value: null };
          break;
        }
        case "without_sharing":
        {
          return { variant: "without_sharing", value: null };
          break;
        }
        case "private":
        {
          return { variant: "private", value: null };
          break;
        }
        case "override":
        {
          return { variant: "override", value: null };
          break;
        }
        case "static":
        {
          return { variant: "static", value: null };
          break;
        }
        case "final":
        {
          return { variant: "final", value: null };
          break;
        }
        case "virtual":
        {
          return { variant: "virtual", value: null };
          break;
        }
        case "abstract":
        {
          return { variant: "abstract", value: null };
          break;
        }
        case "inherited_sharing":
        {
          return { variant: "inherited_sharing", value: null };
          break;
        }
        case "protected":
        {
          return { variant: "protected", value: null };
          break;
        }
        case "testMethod":
        {
          return { variant: "test_method", value: null };
          break;
        }
        case "transient":
        {
          return { variant: "transient", value: null };
          break;
        }
        case "webservice":
        {
          return { variant: "webservice", value: null };
          break;
        }
        default: {
          return this.context.panic_unknown_node(n, "Modifier");
          break;
        }
      }
    })();
    this.variant = selected.variant;
    this.value = selected.value;
  }
  public build_inner(b: DocBuilder, result: Doc[]): any {
    switch (this.variant) {
      case "abstract":
      {
        result.push(b.txt("abstract"));
        break;
      }
      case "final":
      {
        result.push(b.txt("final"));
        break;
      }
      case "global":
      {
        result.push(b.txt("global"));
        break;
      }
      case "inherited_sharing":
      {
        result.push(b.txt("inherited sharing"));
        break;
      }
      case "override":
      {
        result.push(b.txt("override"));
        break;
      }
      case "private":
      {
        result.push(b.txt("private"));
        break;
      }
      case "protected":
      {
        result.push(b.txt("protected"));
        break;
      }
      case "public":
      {
        result.push(b.txt("public"));
        break;
      }
      case "static":
      {
        result.push(b.txt("static"));
        break;
      }
      case "test_method":
      {
        result.push(b.txt("testMethod"));
        break;
      }
      case "transient":
      {
        result.push(b.txt("transient"));
        break;
      }
      case "virtual":
      {
        result.push(b.txt("virtual"));
        break;
      }
      case "webservice":
      {
        result.push(b.txt("webService"));
        break;
      }
      case "with_sharing":
      {
        result.push(b.txt("with sharing"));
        break;
      }
      case "without_sharing":
      {
        result.push(b.txt("without sharing"));
        break;
      }
    }
  }
}

export function registerModelsPart1(): void {
  register("Root", Root);
  register("ClassDeclaration", ClassDeclaration);
  register("MethodDeclaration", MethodDeclaration);
  register("FormalParameters", FormalParameters);
  register("FormalParameter", FormalParameter);
  register("SuperClass", SuperClass);
  register("Modifiers", Modifiers);
  register("Modifier", Modifier);
  register("Annotation", Annotation);
  register("AnnotationKeyValue", AnnotationKeyValue);
  register("ClassBody", ClassBody);
  register("FieldDeclaration", FieldDeclaration);
  register("ArrayInitializer", ArrayInitializer);
  register("AssignmentExpression", AssignmentExpression);
  register("AssignmentLeft", AssignmentLeft);
  register("BoolType", BoolType);
  register("Block", Block);
  register("Interface", Interface);
  register("TypeList", TypeList);
  register("ObjectExpression", ObjectExpression);
  register("MethodInvocationKind", MethodInvocationKind);
  register("MethodInvocation", MethodInvocation);
  register("MethodObject", MethodObject);
  register("TypeArguments", TypeArguments);
  register("ArgumentList", ArgumentList);
  register("Super", Super);
  register("This", This);
  register("BinaryExpressionContext", BinaryExpressionContext);
  register("BinaryExpression", BinaryExpression);
  register("LocalVariableDeclaration", LocalVariableDeclaration);
  register("VariableDeclarator", VariableDeclarator);
  register("GenericType", GenericType);
  register("GenericIdentifier", GenericIdentifier);
  register("IfStatement", IfStatement);
  register("ParenthesizedExpression", ParenthesizedExpression);
  register("ForInitOption", ForInitOption);
  register("ForStatement", ForStatement);
  register("EnhancedForStatement", EnhancedForStatement);
  register("UpdateExpressionVariant", UpdateExpressionVariant);
  register("ScopedTypeIdentifier", ScopedTypeIdentifier);
  register("ScopedChoice", ScopedChoice);
  register("ConstructorDeclaration", ConstructorDeclaration);
  register("ConstructorBody", ConstructorBody);
  register("ConstructInvocation", ConstructInvocation);
  register("Constructor", Constructor);
  register("TypeParameters", TypeParameters);
  register("TypeParameter", TypeParameter);
  register("ObjectCreationExpression", ObjectCreationExpression);
  register("RunAsStatement", RunAsStatement);
  register("DoStatement", DoStatement);
  register("WhileStatement", WhileStatement);
  register("UnaryExpression", UnaryExpression);
  register("FieldAccess", FieldAccess);
  register("FieldOption", FieldOption);
  register("EnumDeclaration", EnumDeclaration);
  register("EnumBody", EnumBody);
  register("EnumConstant", EnumConstant);
  register("DmlExpressionVariant", DmlExpressionVariant);
  register("DmlSecurityMode", DmlSecurityMode);
  register("DmlTypeVariant", DmlTypeVariant);
  register("ArrayAccess", ArrayAccess);
  register("ArrayCreationExpression", ArrayCreationExpression);
  register("ArrayCreationVariant", ArrayCreationVariant);
  register("Dimensions", Dimensions);
  register("DimensionsExpr", DimensionsExpr);
  register("ReturnStatement", ReturnStatement);
  register("TernaryExpression", TernaryExpression);
  register("TryStatement", TryStatement);
  register("TryStatementTail", TryStatementTail);
  register("CatchClause", CatchClause);
  register("FinallyClause", FinallyClause);
  register("StaticInitializer", StaticInitializer);
  register("InterfaceDeclaration", InterfaceDeclaration);
  register("ExtendsInterface", ExtendsInterface);
  register("InterfaceBody", InterfaceBody);
  register("InterfaceMember", InterfaceMember);
  register("ConstantDeclaration", ConstantDeclaration);
  register("AccessorList", AccessorList);
  register("RootMember", RootMember);
  register("ClassMember", ClassMember);
  register("UnannotatedType", UnannotatedType);
  register("SimpleType", SimpleType);
  register("VariableInitializer", VariableInitializer);
  register("Expression", Expression);
  register("PrimaryExpression", PrimaryExpression);
  register("ClassLiteral", ClassLiteral);
  register("Literal_", Literal_);
  register("ModifierKind", ModifierKind);
}
