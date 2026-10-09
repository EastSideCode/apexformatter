/** Remaining Apex, SOQL and SOSL models, ported from the Ruby formatter. */
import { Model, create, make, register } from './model.js';
import { NodeInfo } from './node.js';
import { Insertable } from './builder.js';
function optionalMap(value, convert) {
    return value == null ? null : convert(value);
}
// Ported from data_model_06.rb
class AccessorDeclaration extends Model {
    constructor(context, node) {
        super(context);
        let modifiers;
        this.context.assert_check(node, "accessor_declaration");
        modifiers = optionalMap(node.try_c_by_k("modifiers"), (n) => {
            return create("Modifiers", this.context, n);
        });
        this.modifiers = modifiers;
        this.accessor = node.cvalue_by_n("accessor");
        this.body = optionalMap(node.try_c_by_n("body"), (n) => {
            return create("Block", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let n;
            if ((n = this.modifiers)) {
                result.push(n.build(b));
            }
            result.push(b.txt(this.accessor));
            if ((n = this.body)) {
                result.push(b.txt(" "));
                result.push(n.build(b));
            }
            else {
                result.push(b.txt(";"));
            }
        });
    }
}
// Ported from data_model_06.rb
class CastExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "cast_expression");
        this.type_ = create("Type", this.context, node.c_by_n("type"));
        this.value = create("Expression", this.context, node.c_by_n("value"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("("));
            result.push(this.type_.build(b));
            result.push(b.txt_(")"));
            result.push(this.value.build(b));
        });
    }
}
// Ported from data_model_06.rb
class ThrowStatement extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "throw_statement");
        this.exp = create("Expression", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("throw "));
            result.push(this.exp.build(b));
            result.push(b.txt(";"));
        });
    }
}
// Ported from data_model_06.rb
class BreakStatement extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "break_statement");
        this.identifier = optionalMap(node.try_c_by_k("identifier"), (n) => {
            return create("ValueNode", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let n;
            result.push(b.txt("break"));
            if ((n = this.identifier)) {
                result.push(b.txt(" "));
                result.push(n.build(b));
            }
            result.push(b.txt(";"));
        });
    }
}
// Ported from data_model_06.rb
class ContinueStatement extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "continue_statement");
        this.identifier = optionalMap(node.try_c_by_k("identifier"), (n) => {
            return create("ValueNode", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let n;
            result.push(b.txt("continue"));
            if ((n = this.identifier)) {
                result.push(b.txt(" "));
                result.push(n.build(b));
            }
            result.push(b.txt(";"));
        });
    }
}
// Ported from data_model_06.rb
class SwitchExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "switch_expression");
        this.condition = create("Expression", this.context, node.c_by_n("condition"));
        this.body = create("SwitchBlock", this.context, node.c_by_n("body"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            docs = [b.txt("switch on"), b.softline(), this.condition.build(b)];
            doc = b.group_indent_concat(docs);
            result.push(doc);
            result.push(b.txt(" "));
            result.push(this.body.build(b));
        });
    }
}
// Ported from data_model_06.rb
class SwitchBlock extends Model {
    constructor(context, node) {
        super(context);
        let rules;
        this.context.assert_check(node, "switch_block");
        rules = node.cs_by_k("switch_rule").map((n) => {
            return create("SwitchRule", this.context, n);
        });
        this.rules = rules;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let close;
            let doc;
            let docs;
            let open;
            let sep;
            docs = b.to_docs(this.rules);
            sep = new Insertable(null, "", b.nl());
            open = new Insertable(null, "{", b.nl());
            close = new Insertable(b.nl(), "}", null);
            doc = b.surround(docs, sep, open, close);
            result.push(doc);
        });
    }
}
// Ported from data_model_06.rb
class SwitchRule extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "switch_rule");
        this.label = create("SwitchLabel", this.context, node.c_by_k("switch_label"));
        this.block = create("Block", this.context, node.c_by_k("block"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.label.build(b));
            result.push(b.txt(" "));
            result.push(this.block.build(b));
        });
    }
}
// Ported from data_model_06.rb
class SwitchLabel extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let expressions;
        let when_node;
        this.context.assert_check(node, "switch_label");
        if ((node.children_vec.length === 0)) {
            return make("SwitchLabel", this.context, "else");
        }
        else if ((when_node = node.try_c_by_k("when_sobject_type"))) {
            return make("SwitchLabel", this.context, "when_s_object", create("WhenSObjectType", this.context, when_node));
        }
        else {
            expressions = node.children_vec.map((n) => {
                return create("Expression", this.context, n);
            });
            return make("SwitchLabel", this.context, "expressions", expressions);
        }
    }
    build_inner(b, result) {
        let doc;
        let docs;
        let sep;
        result.push(b.txt_("when"));
        switch (this.variant) {
            case "when_s_object": {
                result.push(this.value.build(b));
                break;
            }
            case "expressions": {
                docs = b.to_docs(this.value);
                sep = new Insertable(null, ",", b.softline());
                doc = b.group(b.indent(b.intersperse(docs, sep)));
                result.push(doc);
                break;
            }
            case "else": {
                result.push(b.txt("else"));
                break;
            }
        }
    }
}
// Ported from data_model_06.rb
class WhenSObjectType extends Model {
    constructor(context, node) {
        super(context);
        let identifier;
        let unannotated_type;
        unannotated_type = null;
        identifier = null;
        node.children_vec.forEach((child) => {
            switch (child.kind) {
                case "identifier": {
                    identifier = child.value;
                    break;
                }
                default: {
                    unannotated_type = create("UnannotatedType", this.context, child);
                }
            }
        });
        if ((unannotated_type == null)) {
            throw new Error("Missing unannotated_type in WhenSObjectType");
        }
        this.unannotated_type = unannotated_type;
        if ((identifier == null)) {
            throw new Error("Missing identifier in WhenSObjectType");
        }
        this.identifier = identifier;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.unannotated_type.build(b));
            result.push(b.txt(" "));
            result.push(b.txt(this.identifier));
        });
    }
}
// Ported from data_model_06.rb
class InstanceOfExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "instanceof_expression");
        this.left = create("Expression", this.context, node.c_by_n("left"));
        this.right = create("Type", this.context, node.c_by_n("right"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.left.build(b));
            result.push(b._txt_("instanceof"));
            result.push(this.right.build(b));
        });
    }
}
// Ported from data_model_06.rb
class VersionExpression extends Model {
    constructor(context, node) {
        super(context);
        let version_number;
        this.context.assert_check(node, "version_expression");
        version_number = optionalMap(node.try_c_by_n("version_num"), (n) => {
            return create("ValueNode", this.context, n);
        });
        this.version_number = version_number;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let n;
            result.push(b.txt("Package.Version."));
            if ((n = this.version_number)) {
                result.push(n.build(b));
            }
            else {
                result.push(b.txt("Request"));
            }
        });
    }
}
// Ported from data_model_06.rb
class JavaFieldAccess extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "java_field_access");
        this.field_access = create("FieldAccess", this.context, node.c_by_k("field_access"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("java:"));
            result.push(this.field_access.build(b));
        });
    }
}
// Ported from data_model_06.rb
class JavaType extends Model {
    constructor(context, node) {
        super(context);
        let scoped_type_identifier;
        scoped_type_identifier = create("ScopedTypeIdentifier", this.context, node.c_by_k("scoped_type_identifier"));
        this.scoped_type_identifier = scoped_type_identifier;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("java:"));
            result.push(this.scoped_type_identifier.build(b));
        });
    }
}
// Ported from data_model_06.rb
class ArrayType extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "array_type");
        this.element = create("UnannotatedType", this.context, node.c_by_n("element"));
        this.dimensions = create("Dimensions", this.context, node.c_by_n("dimensions"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.element.build(b));
            result.push(this.dimensions.build(b));
        });
    }
}
// Ported from data_model_06.rb
class TriggerDeclaration extends Model {
    constructor(context, node) {
        super(context);
        let events;
        this.context.assert_check(node, "trigger_declaration");
        events = node.cs_by_k("trigger_event").map((n) => {
            return create("TriggerEvent", this.context, n);
        });
        this.name = create("ValueNode", this.context, node.c_by_n("name"));
        this.object = create("ValueNode", this.context, node.c_by_n("object"));
        this.events = events;
        this.body = create("TriggerBody", this.context, node.c_by_n("body"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let close;
            let doc;
            let docs;
            let open;
            let sep;
            result.push(b.txt_("trigger"));
            result.push(this.name.build(b));
            result.push(b._txt_("on"));
            result.push(this.object.build(b));
            docs = b.to_docs(this.events);
            sep = new Insertable(null, ",", b.softline());
            open = new Insertable(null, "(", b.maybeline());
            close = new Insertable(b.maybeline(), ")", null);
            doc = b.group_surround(docs, sep, open, close);
            result.push(doc);
            result.push(b.txt(" "));
            result.push(this.body.build(b));
        });
    }
}
// Ported from data_model_06.rb
class TriggerEvent extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "trigger_event");
        this.event = create("TriggerEventVariant", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.event.build(b));
        });
    }
}
// Ported from data_model_06.rb
class TriggerBody extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "trigger_body");
        this.block = create("Block", this.context, node.c_by_k("block"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.block.build(b));
        });
    }
}
// Ported from data_model_06.rb
class QueryExpression extends Model {
    constructor(context, node) {
        super(context);
        let query_body;
        let soql_node;
        this.context.assert_check(node, "query_expression");
        query_body = (() => {
            if ((soql_node = node.try_c_by_k("soql_query_body"))) {
                return make("QueryBody", this.context, "soql", create("SoqlQueryBody", this.context, soql_node));
            }
            else {
                return make("QueryBody", this.context, "sosl", create("SoslQueryBody", this.context, node.c_by_k("sosl_query_body")));
            }
        })();
        this.query_body = query_body;
        this.chain_context = this.context.build_chaining_context(node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let body;
            let close;
            let docs;
            let force_multiline;
            let open;
            let sep;
            force_multiline = ((typeof b.config.query_bracket_next_line === "function") && b.config.query_bracket_next_line());
            body = this.query_body.build(b);
            if (force_multiline) {
                result.push(b.concat([b.txt("["), b.force_break(), b.indent(b.maybeline()), b.indent(body), b.maybeline(), b.txt("]")]));
            }
            else if (this.chain_context) {
                docs = [];
                docs.push(b.txt("["));
                docs.push(b.maybeline());
                docs.push(body);
                docs.push(b.dedent(b.maybeline()));
                docs.push(b.txt("]"));
                result.push(b.group_concat(docs));
            }
            else {
                docs = [body];
                sep = new Insertable(null, null, b.softline());
                open = new Insertable(null, "[", b.maybeline());
                close = new Insertable(b.maybeline(), "]", null);
                result.push(b.group_surround(docs, sep, open, close));
            }
        });
    }
}
// Ported from data_model_07.rb
class QueryBody extends Model {
    constructor(context, variant, value) {
        super(context);
        this.variant = variant;
        this.value = value;
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "soql": {
                result.push(this.value.build(b));
                break;
            }
            case "sosl": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from data_model_07.rb
class SoslQueryBody extends Model {
    constructor(context, node) {
        super(context);
        let find_clause;
        let in_clause;
        let limit_clause;
        let returning_clause;
        let update_clause;
        let using_clause;
        let with_clauses;
        this.context.assert_check(node, "sosl_query_body");
        find_clause = create("FindClause", this.context, node.c_by_k("find_clause"));
        in_clause = optionalMap(node.try_c_by_k("in_clause"), (n) => {
            return create("InClause", this.context, n);
        });
        returning_clause = optionalMap(node.try_c_by_k("returning_clause"), (n) => {
            return create("ReturningClause", this.context, n);
        });
        with_clauses = node.try_cs_by_k("with_clause").map((n) => {
            return create("SoslWithClause", this.context, n);
        });
        using_clause = optionalMap(node.try_c_by_k("sosl_using_clause"), (n) => {
            return create("SoslUsingClause", this.context, n);
        });
        limit_clause = optionalMap(node.try_c_by_k("limit_clause"), (n) => {
            return create("LimitClause", this.context, n);
        });
        update_clause = optionalMap(node.try_c_by_k("update_clause"), (n) => {
            return create("UpdateClause", this.context, n);
        });
        this.find_clause = find_clause;
        this.in_clause = in_clause;
        this.returning_clause = returning_clause;
        this.with_clauses = with_clauses;
        this.using_clause = using_clause;
        this.limit_clause = limit_clause;
        this.update_clause = update_clause;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let n;
            let sep;
            let with_clauses_docs;
            docs = [];
            docs.push(this.find_clause.build(b));
            if ((n = this.in_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.returning_clause)) {
                docs.push(n.build(b));
            }
            if (!((this.with_clauses.length === 0))) {
                with_clauses_docs = b.to_docs(this.with_clauses);
                sep = new Insertable(null, null, b.softline());
                doc = b.intersperse(with_clauses_docs, sep);
                docs.push(doc);
            }
            if ((n = this.using_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.limit_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.update_clause)) {
                docs.push(n.build(b));
            }
            sep = new Insertable(null, null, b.softline());
            doc = b.intersperse(docs, sep);
            result.push(doc);
        });
    }
}
// Ported from data_model_07.rb
class FindClause extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let bound_node;
        this.context.assert_check(node, "find_clause");
        if ((bound_node = node.try_c_by_k("bound_apex_expression"))) {
            return make("FindClause", this.context, "bound", create("BoundApexExpression", this.context, bound_node));
        }
        else {
            return make("FindClause", this.context, "term", node.cvalue_by_k("term"));
        }
    }
    build_inner(b, result) {
        result.push(b.txt_("FIND"));
        switch (this.variant) {
            case "bound": {
                result.push(this.value.build(b));
                break;
            }
            case "term": {
                result.push(b.txt(`'${this.value}'`));
                break;
            }
        }
    }
}
// Ported from data_model_07.rb
class InClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "in_clause");
        this.in_type = create("ValueNode", this.context, node.c_by_k("in_type"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("IN"));
            result.push(this.in_type.build(b));
            result.push(b.txt(" "));
            result.push(b.txt("FIELDS"));
        });
    }
}
// Ported from data_model_07.rb
class ReturningClause extends Model {
    constructor(context, node) {
        super(context);
        this.sobject_returns = node.cs_by_k("sobject_return").map((n) => {
            return create("SObjectReturn", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let sep;
            result.push(b.txt("RETURNING"));
            docs = b.to_docs(this.sobject_returns);
            sep = new Insertable(null, ",", b.softline());
            doc = b.group_indent(b.concat([b.softline(), b.intersperse(docs, sep)]));
            result.push(doc);
        });
    }
}
// Ported from data_model_07.rb
class SObjectReturn extends Model {
    constructor(context, node) {
        super(context);
        let sobject_return_query;
        this.context.assert_check(node, "sobject_return");
        sobject_return_query = optionalMap(node.try_c_by_k("selected_fields"), (n) => {
            return create("SObjectReturnQuery", this.context, { selected_fields: n.children_vec.map((selectable_node) => {
                    return create("SelectableExpression", this.context, selectable_node);
                }), using_clause: optionalMap(node.try_c_by_k("using_clause"), (n) => {
                    return create("UsingClause", this.context, n);
                }), where_clause: optionalMap(node.try_c_by_k("where_clause"), (n) => {
                    return create("WhereClause", this.context, n);
                }), order_by_clause: optionalMap(node.try_c_by_k("order_by_clause"), (n) => {
                    return create("OrderByClause", this.context, n);
                }), limit_clause: optionalMap(node.try_c_by_k("limit_clause"), (n) => {
                    return create("LimitClause", this.context, n);
                }), offset_clause: optionalMap(node.try_c_by_k("offset_clause"), (n) => {
                    return create("OffsetClause", this.context, n);
                }), node_info: NodeInfo.from(n) });
        });
        this.identifier = create("ValueNode", this.context, node.c_by_k("identifier"));
        this.sobject_return_query = sobject_return_query;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let n;
            result.push(this.identifier.build(b));
            if ((n = this.sobject_return_query)) {
                result.push(n.build(b));
            }
        });
    }
}
// Ported from data_model_07.rb
class SObjectReturnQuery extends Model {
    constructor(context, { selected_fields, using_clause, where_clause, order_by_clause, limit_clause, offset_clause, node_info }) {
        super(context);
        this.selected_fields = selected_fields;
        this.using_clause = using_clause;
        this.where_clause = where_clause;
        this.order_by_clause = order_by_clause;
        this.limit_clause = limit_clause;
        this.offset_clause = offset_clause;
        this.node_info = node_info;
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let close;
            let doc;
            let docs;
            let n;
            let open;
            let selected_fields_docs;
            let sep;
            docs = [];
            selected_fields_docs = b.to_docs(this.selected_fields);
            sep = new Insertable(null, ",", b.softline());
            doc = b.intersperse(selected_fields_docs, sep);
            docs.push(doc);
            if ((n = this.using_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.where_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.order_by_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.limit_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.offset_clause)) {
                docs.push(n.build(b));
            }
            sep = new Insertable(null, null, b.softline());
            open = new Insertable(null, "(", b.maybeline());
            close = new Insertable(null, ")", null);
            doc = b.group_surround(docs, sep, open, close);
            result.push(doc);
        });
    }
}
// Ported from data_model_07.rb
class SoqlQueryBody extends Model {
    constructor(context, node) {
        super(context);
        let all_rows_clause;
        let for_clause;
        let group_by_clause;
        let limit_clause;
        let offset_clause;
        let order_by_clause;
        let where_clause;
        let with_clause;
        this.context.assert_check(node, "soql_query_body");
        where_clause = optionalMap(node.try_c_by_n("where_clause"), (n) => {
            return create("WhereClause", this.context, n);
        });
        with_clause = optionalMap(node.try_c_by_n("with_clause"), (n) => {
            return create("SoqlWithClause", this.context, n);
        });
        group_by_clause = optionalMap(node.try_c_by_n("group_by_clause"), (n) => {
            return create("GroupByClause", this.context, n);
        });
        order_by_clause = optionalMap(node.try_c_by_n("order_by_clause"), (n) => {
            return create("OrderByClause", this.context, n);
        });
        limit_clause = optionalMap(node.try_c_by_n("limit_clause"), (n) => {
            return create("LimitClause", this.context, n);
        });
        offset_clause = optionalMap(node.try_c_by_n("offset_clause"), (n) => {
            return create("OffsetClause", this.context, n);
        });
        all_rows_clause = optionalMap(node.try_c_by_n("all_rows_clause"), (n) => {
            return create("AllRowsClause", this.context, n);
        });
        for_clause = node.try_cs_by_k("for_clause").map((n) => {
            return create("ForClause", this.context, n);
        });
        this.select_clause = create("SelectClause", this.context, node.c_by_n("select_clause"));
        this.from_clause = create("FromClause", this.context, node.c_by_n("from_clause"));
        this.where_clause = where_clause;
        this.with_clause = with_clause;
        this.group_by_clause = group_by_clause;
        this.order_by_clause = order_by_clause;
        this.limit_clause = limit_clause;
        this.offset_clause = offset_clause;
        this.for_clause = for_clause;
        this.all_rows_clause = all_rows_clause;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let for_clause_doc;
            let for_types;
            let for_types_doc;
            let n;
            let sep;
            docs = [];
            docs.push(this.select_clause.build(b));
            docs.push(this.from_clause.build(b));
            if ((n = this.where_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.with_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.group_by_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.order_by_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.limit_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.offset_clause)) {
                docs.push(n.build(b));
            }
            if ((n = this.all_rows_clause)) {
                docs.push(n.build(b));
            }
            if (!((this.for_clause.length === 0))) {
                for_types = this.for_clause.map((n) => {
                    return n.build(b);
                });
                sep = new Insertable(null, ", ", null);
                for_types_doc = b.intersperse(for_types, sep);
                for_clause_doc = b.concat([b.txt_("FOR"), for_types_doc]);
                docs.push(for_clause_doc);
            }
            sep = new Insertable(null, null, b.softline());
            doc = b.intersperse(docs, sep);
            result.push(doc);
        });
    }
}
// Ported from data_model_07.rb
class FromClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "from_clause");
        this.content = create("StorageVariant", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("FROM"));
            result.push(this.content.build(b));
        });
    }
}
// Ported from data_model_07.rb
class StorageAlias extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "storage_alias");
        this.storage_identifier = create("StorageIdentifier", this.context, node.c_by_k("storage_identifier"));
        this.identifier = create("ValueNode", this.context, node.c_by_k("identifier"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.storage_identifier.build(b));
            result.push(b.txt(" "));
            result.push(this.identifier.build(b));
        });
    }
}
// Ported from data_model_07.rb
class LimitClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "limit_clause");
        this.limit_value = create("LimitValue", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("LIMIT"));
            result.push(this.limit_value.build(b));
        });
    }
}
// Ported from data_model_07.rb
class UpdateClause extends Model {
    constructor(context, node) {
        super(context);
        this.update_types = node.cs_by_k("update_type").map((n) => {
            return create("ValueNode", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let sep;
            result.push(b.txt_("UPDATE"));
            docs = this.update_types.map((n) => {
                return n.build(b);
            });
            sep = new Insertable(null, ", ", null);
            doc = b.intersperse(docs, sep);
            result.push(doc);
        });
    }
}
// Ported from data_model_07.rb
class BoundApexExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "bound_apex_expression");
        this.exp = create("Expression", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt(":"));
            result.push(this.exp.build(b));
        });
    }
}
// Ported from data_model_07.rb
class SoslUsingClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "sosl_using_clause");
        this.search = create("UsingSearch", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("USING"));
            result.push(this.search.build(b));
        });
    }
}
// Ported from data_model_07.rb
class UsingSearch extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "using_phrase_search": {
                return make("UsingSearch", this.context, "phrase");
            }
            case "using_advanced_search": {
                return make("UsingSearch", this.context, "advanced");
            }
            default: {
                return this.context.panic_unknown_node(node, "UsingSearch");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "phrase": {
                result.push(b.txt("PHRASE SEARCH"));
                break;
            }
            case "advanced": {
                result.push(b.txt("ADVANCED SEARCH"));
                break;
            }
        }
    }
}
// Ported from data_model_07.rb
class UsingClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "using_clause");
        this.option = create("UsingClauseOption", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("USING"));
            result.push(this.option.build(b));
        });
    }
}
// Ported from data_model_08.rb
class UsingClauseOption extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "using_scope_clause": {
                return make("UsingClauseOption", this.context, "scope", create("UsingScopeClause", this.context, node));
            }
            case "using_lookup_clause": {
                return make("UsingClauseOption", this.context, "lookup", create("UsingLookupClause", this.context, node));
            }
            case "using_listview_clause": {
                return make("UsingClauseOption", this.context, "listview", create("UsingListviewClause", this.context, node));
            }
            default: {
                return this.context.panic_unknown_node(node, "UsingClauseOption");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "scope": {
                result.push(this.value.build(b));
                break;
            }
            case "lookup": {
                result.push(this.value.build(b));
                break;
            }
            case "listview": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from data_model_08.rb
class UsingScopeClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "using_scope_clause");
        this.type_ = create("ValueNode", this.context, node.c_by_k("using_scope_type"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("SCOPE"));
            result.push(this.type_.build(b));
        });
    }
}
// Ported from data_model_08.rb
class UsingLookupClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "using_lookup_clause");
        this.lookup_field = create("DottedIdentifier", this.context, node.c_by_n("using_lookup_clause"));
        this.bind_clause = optionalMap(node.try_c_by_k("using_lookup_bind_clause"), (n) => {
            return create("UsingLookupBindClause", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let n;
            result.push(b.txt_("LOOKUP"));
            result.push(this.lookup_field.build(b));
            result.push(b.txt(" "));
            if ((n = this.bind_clause)) {
                result.push(n.build(b));
            }
        });
    }
}
// Ported from data_model_08.rb
class UsingListviewClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "using_listview_clause");
        this.identifier = create("ValueNode", this.context, node.c_by_k("identifier"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("ListView ="));
            result.push(this.identifier.build(b));
        });
    }
}
// Ported from data_model_08.rb
class UsingLookupBindClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "using_lookup_bind_clause");
        this.bind_exps = node.try_cs_by_k("using_lookup_bind_expression").map((n) => {
            return create("UsingLookupBindExpression", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let sep;
            result.push(b.txt_("BIND"));
            docs = b.to_docs(this.bind_exps);
            sep = new Insertable(null, ", ", null);
            doc = b.intersperse(docs, sep);
            result.push(doc);
        });
    }
}
// Ported from data_model_08.rb
class UsingLookupBindExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "using_lookup_bind_expression");
        this.field = create("ValueNode", this.context, node.c_by_k("field"));
        this.bound_value = create("SoqlLiteral", this.context, node.c_by_n("bound_value"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.field.build(b));
            result.push(b._txt_("="));
            result.push(this.bound_value.build(b));
        });
    }
}
// Ported from data_model_08.rb
class WhereClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "where_clause");
        this.boolean_exp = create("BooleanExpression", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let docs;
            docs = [b.txt("WHERE"), b.softline(), this.boolean_exp.build_with_parent(b, null)];
            result.push(b.group_indent_concat(docs));
        });
    }
}
// Ported from data_model_08.rb
class ComparisonExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "comparison_expression");
        this.value = create("ValueExpression", this.context, node.first_c);
        this.comparison = this.context.get_comparsion(node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.value.build(b));
            result.push(this.comparison.build(b));
        });
    }
}
// Ported from data_model_08.rb
class ValueComparison extends Model {
    constructor(context, operator, compared_with) {
        super(context);
        this.operator = operator;
        this.compared_with = compared_with;
    }
    build_inner(b, result) {
        result.push(b._txt_(this.operator));
        result.push(this.compared_with.build(b));
    }
}
// Ported from data_model_08.rb
class SetComparison extends Model {
    constructor(context, operator, set_value) {
        super(context);
        this.operator = operator;
        this.set_value = set_value;
    }
    build_inner(b, result) {
        result.push(b._txt_(this.operator));
        result.push(this.set_value.build(b));
    }
}
// Ported from data_model_08.rb
class ComparableList extends Model {
    constructor(context, node) {
        super(context);
        this.values = node.children_vec.map((n) => {
            return create("ComparableListValue", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let close;
            let doc;
            let docs;
            let open;
            let sep;
            docs = b.to_docs(this.values);
            sep = new Insertable(null, ",", b.softline());
            open = new Insertable(null, "(", b.maybeline());
            close = new Insertable(b.maybeline(), ")", null);
            doc = b.group_surround(docs, sep, open, close);
            result.push(doc);
        });
    }
}
// Ported from data_model_08.rb
class OrderByClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "order_by_clause");
        this.exps = node.cs_by_k("order_expression").map((n) => {
            return create("OrderExpression", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let sep;
            result.push(b.txt_("ORDER BY"));
            docs = b.to_docs(this.exps);
            sep = new Insertable(null, ", ", null);
            doc = b.intersperse(docs, sep);
            result.push(doc);
        });
    }
}
// Ported from data_model_08.rb
class OrderExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "order_expression");
        this.direction = optionalMap(node.try_c_by_k("order_direction"), (n) => {
            return create("ValueNode", this.context, n);
        });
        this.null_direction = optionalMap(node.try_c_by_k("order_null_direction"), (n) => {
            return create("ValueNode", this.context, n);
        });
        this.value_expression = create("ValueExpression", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let n;
            result.push(this.value_expression.build(b));
            if ((n = this.direction)) {
                result.push(b.txt(" "));
                result.push(n.build(b));
            }
            if ((n = this.null_direction)) {
                result.push(b.txt(" "));
                result.push(n.build(b));
            }
        });
    }
}
// Ported from data_model_08.rb
class SubQuery extends Model {
    constructor(context, node) {
        super(context);
        this.soql_query_body = create("SoqlQueryBody", this.context, node.c_by_k("soql_query_body"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let close;
            let doc;
            let docs;
            let open;
            let sep;
            docs = [this.soql_query_body.build(b)];
            sep = new Insertable(null, null, b.softline());
            open = new Insertable(null, "(", b.maybeline());
            close = new Insertable(b.maybeline(), ")", null);
            doc = b.group_surround(docs, sep, open, close);
            result.push(doc);
        });
    }
}
// Ported from data_model_08.rb
class MapCreationExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "map_creation_expression");
        this.type_ = create("SimpleType", this.context, node.c_by_n("type"));
        this.value = create("MapInitializer", this.context, node.c_by_n("value"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("new"));
            result.push(this.type_.build(b));
            result.push(this.value.build(b));
        });
    }
}
// Ported from data_model_08.rb
class MapInitializer extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "map_initializer");
        this.initializers = node.children_vec.map((n) => {
            return create("MapKeyInitializer", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let close;
            let doc;
            let docs;
            let open;
            let sep;
            docs = b.to_docs(this.initializers);
            sep = new Insertable(null, ",", b.softline());
            open = new Insertable(null, "{", b.softline());
            close = new Insertable(b.softline(), "}", null);
            doc = b.group_surround(docs, sep, open, close);
            result.push(doc);
        });
    }
}
// Ported from data_model_08.rb
class MapKeyInitializer extends Model {
    constructor(context, node) {
        super(context);
        let children;
        this.context.assert_check(node, "map_key_initializer");
        children = node.children_vec;
        if ((children.length !== 2)) {
            throw new Error("### must be exactly 2 child nodes in MapKeyInitializer");
        }
        this.exp1 = create("Expression", this.context, children[0]);
        this.exp2 = create("Expression", this.context, children[1]);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.exp1.build(b));
            result.push(b._txt_("=>"));
            result.push(this.exp2.build(b));
        });
    }
}
// Ported from data_model_08.rb
class GroupByClause extends Model {
    constructor(context, node) {
        super(context);
        let exps;
        let have_clause;
        this.context.assert_check(node, "group_by_clause");
        exps = [];
        have_clause = null;
        node.children_vec.forEach((child) => {
            switch (child.kind) {
                case "field_identifier": {
                    exps.push(make("GroupByExpression", this.context, "field", create("FieldIdentifier", this.context, child)));
                    break;
                }
                case "function_expression": {
                    exps.push(make("GroupByExpression", this.context, "func", create("FunctionExpression", this.context, child)));
                    break;
                }
                case "having_clause": {
                    have_clause = create("HavingClause", this.context, child);
                    break;
                }
                default: {
                    throw new Error(`## unknown node: ${child.kind} in GroupByClause`);
                }
            }
        });
        this.exps = exps;
        this.have_clause = have_clause;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let n;
            let sep;
            result.push(b.txt_("GROUP BY"));
            docs = b.to_docs(this.exps);
            sep = new Insertable(null, ", ", null);
            doc = b.intersperse(docs, sep);
            result.push(doc);
            if ((n = this.have_clause)) {
                result.push(b.softline());
                result.push(n.build(b));
            }
        });
    }
}
// Ported from data_model_08.rb
class GroupByExpression extends Model {
    constructor(context, variant, value) {
        super(context);
        this.variant = variant;
        this.value = value;
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "field": {
                result.push(this.value.build(b));
                break;
            }
            case "func": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from data_model_08.rb
class HavingClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "having_clause");
        this.boolean_exp = create("BooleanExpression", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let docs;
            docs = [b.txt("HAVING"), b.softline(), this.boolean_exp.build_with_parent(b, null)];
            result.push(b.group_indent_concat(docs));
        });
    }
}
// Ported from data_model_09.rb
class SoslWithClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "with_clause");
        this.with_type = create("SoslWithType", this.context, node.c_by_k("with_type"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let docs;
            docs = [b.txt_("WITH"), this.with_type.build(b)];
            result.push(b.group_concat(docs));
        });
    }
}
// Ported from data_model_09.rb
class SoqlWithClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "with_clause");
        this.with_type = create("SoqlWithType", this.context, node.c_by_k("with_type"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("WITH"));
            result.push(this.with_type.build(b));
        });
    }
}
// Ported from data_model_09.rb
class SoqlWithTypeVariant extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let child;
        let with_type;
        with_type = (() => {
            if ((node.named_child_count === 0)) {
                return make("SoqlWithTypeVariant", this.context, "simple_type", create("ValueNode", this.context, node));
            }
            else {
                child = node.first_c;
                switch (child.kind) {
                    case "with_user_id_type": {
                        return make("SoqlWithTypeVariant", this.context, "user_id", create("ValueNode", this.context, child.c_by_k("string_literal")));
                    }
                    default: {
                        return this.context.panic_unknown_node(node, "WithType");
                    }
                }
            }
        })();
        return with_type;
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "simple_type": {
                result.push(this.value.build(b));
                break;
            }
            case "user_id": {
                result.push(b.txt_("UserId ="));
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from data_model_09.rb
class SoslWithType extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let child;
        this.context.assert_check(node, "with_type");
        child = node.first_c;
        switch (child.kind) {
            case "with_data_cat_expression": {
                return make("SoslWithType", this.context, "data_cat", create("WithDataCatExpression", this.context, child));
            }
            case "with_division_expression": {
                return make("SoslWithType", this.context, "division", create("WithDivisionExpression", this.context, child));
            }
            case "with_snippet_expression": {
                return make("SoslWithType", this.context, "snippet", create("WithSnippetExpression", this.context, child));
            }
            case "with_network_expression": {
                return make("SoslWithType", this.context, "network", create("WithNetworkExpression", this.context, child));
            }
            case "with_metadata_expression": {
                return make("SoslWithType", this.context, "metadata", create("WithMetadataExpression", this.context, child));
            }
            case "with_spell_correction_expression": {
                return make("SoslWithType", this.context, "spell", create("WithSpellCorrectionExpression", this.context, child));
            }
            case "with_highlight": {
                return make("SoslWithType", this.context, "highlight");
            }
            case "with_pricebook_expression": {
                return make("SoslWithType", this.context, "price_book", create("WithPriceBookExpression", this.context, child));
            }
            default: {
                return this.context.panic_unknown_node(child, "SoslWithType");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "data_cat": {
                result.push(this.value.build(b));
                break;
            }
            case "division": {
                result.push(this.value.build(b));
                break;
            }
            case "snippet": {
                result.push(this.value.build(b));
                break;
            }
            case "network": {
                result.push(this.value.build(b));
                break;
            }
            case "metadata": {
                result.push(this.value.build(b));
                break;
            }
            case "highlight": {
                result.push(b.txt("HIGHLIGHT"));
                break;
            }
            case "spell": {
                result.push(this.value.build(b));
                break;
            }
            case "price_book": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from data_model_09.rb
class WithDataCatExpression extends Model {
    constructor(context, node) {
        super(context);
        let filters;
        this.context.assert_check(node, "with_data_cat_expression");
        filters = node.cs_by_k("with_data_cat_filter").map((n) => {
            return create("WithDataCatFilter", this.context, n);
        });
        this.filters = filters;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let sep;
            result.push(b.txt("DATA CATEGORY"));
            result.push(b.indent(b.softline()));
            docs = b.to_docs(this.filters);
            sep = new Insertable(b.softline(), "AND ", null);
            doc = b.indent(b.intersperse(docs, sep));
            result.push(doc);
        });
    }
}
// Ported from data_model_09.rb
class WithDataCatFilter extends Model {
    constructor(context, node) {
        super(context);
        let all_identififers;
        let identifier;
        let identifiers;
        this.context.assert_check(node, "with_data_cat_filter");
        all_identififers = node.cs_by_k("identifier");
        if ((all_identififers.length < 2)) {
            throw new Error("At least 2 identifier nodes should exist in WithDataCatFilter");
        }
        identifier = create("ValueNode", this.context, all_identififers[0]);
        identifiers = all_identififers.slice(1).map((n) => {
            return create("ValueNode", this.context, n);
        });
        this.identifier = identifier;
        this.filter_type = create("ValueNodeUpperCase", this.context, node.c_by_k("with_data_cat_filter_type"));
        this.identifiers = identifiers;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let close;
            let doc;
            let docs;
            let open;
            let sep;
            result.push(this.identifier.build(b));
            result.push(b.txt(" "));
            result.push(this.filter_type.build(b));
            result.push(b.txt(" "));
            if ((this.identifiers.length === 1)) {
                result.push(this.identifiers[0].build(b));
            }
            else {
                docs = b.to_docs(this.identifiers);
                sep = new Insertable(null, ",", b.softline());
                open = new Insertable(null, "(", b.maybeline());
                close = new Insertable(b.maybeline(), ")", null);
                doc = b.group_surround(docs, sep, open, close);
                result.push(doc);
            }
        });
    }
}
// Ported from data_model_09.rb
class WithDivisionExpression extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let child;
        this.context.assert_check(node, "with_division_expression");
        child = node.first_c;
        switch (child.kind) {
            case "bound_apex_expression": {
                return make("WithDivisionExpression", this.context, "bound", create("BoundApexExpression", this.context, child));
            }
            case "string_literal": {
                return make("WithDivisionExpression", this.context, "string_literal", child.value);
            }
            default: {
                return this.context.panic_unknown_node(node, "WithDivisionExpression");
            }
        }
    }
    build_inner(b, result) {
        result.push(b.txt("DIVISION = "));
        switch (this.variant) {
            case "bound": {
                result.push(this.value.build(b));
                break;
            }
            case "string_literal": {
                result.push(b.txt(this.value));
                break;
            }
        }
    }
}
// Ported from data_model_09.rb
class WithSnippetExpression extends Model {
    constructor(context, node) {
        super(context);
        let int;
        this.context.assert_check(node, "with_snippet_expression");
        int = optionalMap(node.try_c_by_k("int"), (n) => {
            return create("ValueNode", this.context, n);
        });
        this.int = int;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let n;
            result.push(b.txt("SNIPPET"));
            if ((n = this.int)) {
                result.push(b.txt("(TARGET_LENGTH = "));
                result.push(n.build(b));
                result.push(b.txt(")"));
            }
        });
    }
}
// Ported from data_model_09.rb
class WithNetworkExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "with_network_expression");
        this.comparison = this.context.get_comparsion(node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("NETWORK"));
            result.push(this.comparison.build(b));
        });
    }
}
// Ported from data_model_09.rb
class WithMetadataExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "with_metadata_expression");
        this.string_literal = create("ValueNode", this.context, node.c_by_k("string_literal"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("METADATA = "));
            result.push(this.string_literal.build(b));
        });
    }
}
// Ported from data_model_09.rb
class WithSpellCorrectionExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "with_spell_correction_expression");
        this.boolean = create("ValueNode", this.context, node.c_by_k("boolean"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("SPELL_CORRECTION = "));
            result.push(this.boolean.build(b));
        });
    }
}
// Ported from data_model_09.rb
class WithPriceBookExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "with_pricebook_expression");
        this.string_literal = create("ValueNode", this.context, node.c_by_k("string_literal"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt_("PriceBookId ="));
            result.push(this.string_literal.build(b));
        });
    }
}
// Ported from data_model_09.rb
class DottedIdentifier extends Model {
    constructor(context, node) {
        super(context);
        let identifiers;
        this.context.assert_check(node, "dotted_identifier");
        identifiers = node.cs_by_k("identifier").map((n) => {
            return create("ValueNode", this.context, n);
        });
        this.identifiers = identifiers;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let docs;
            let sep;
            docs = this.identifiers.map((n) => {
                return n.build(b);
            });
            sep = new Insertable(null, ".", null);
            doc = b.intersperse(docs, sep);
            result.push(doc);
        });
    }
}
// Ported from data_model_09.rb
class ValueNode extends Model {
    constructor(context, node) {
        super(context);
        this.value = node.value;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt(this.value));
        });
    }
}
// Ported from data_model_09.rb
class ValueNodeLowerCase extends Model {
    constructor(context, node) {
        super(context);
        this.value = node.value;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt(this.value.toLowerCase()));
        });
    }
}
// Ported from data_model_09.rb
class ValueNodeUpperCase extends Model {
    constructor(context, node) {
        super(context);
        this.value = node.value;
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt(this.value.toUpperCase()));
        });
    }
}
// Ported from data_model_09.rb
class ExpressionStatement extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "expression_statement");
        this.exp = create("Expression", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.exp.build(b));
            result.push(b.txt(";"));
        });
    }
}
// Ported from data_model_09.rb
class SafeNavigationOperator extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "safe_navigation_operator");
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("?."));
        });
    }
}
// Ported from data_model_09.rb
class CountExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "count_expression");
        this.function_name = create("ValueNode", this.context, node.c_by_n("function_name"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.function_name.build(b));
            result.push(b.txt("()"));
        });
    }
}
// Ported from data_model_09.rb
class FunctionExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "function_expression");
        this.variant = create("FunctionExpressionVariant", this.context, node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from data_model_10.rb
class FieldIdentifier extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "field_identifier");
        this.variant = create("FieldIdentifierVariant", this.context, node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from data_model_10.rb
class GeoLocationType extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "geo_location_type");
        this.variant = create("GeoLocationTypeVariant", this.context, node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from data_model_10.rb
class SelectClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "select_clause");
        this.variant = create("SelectClauseVariant", this.context, node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from data_model_10.rb
class StorageIdentifier extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "storage_identifier");
        this.variant = create("StorageIdentifierVariant", this.context, node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from data_model_10.rb
class AndExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "and_expression");
        this.condition_exps = node.children_vec.map((n) => {
            return create("ConditionExpression", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let docs;
            let sep;
            docs = this.condition_exps.map((expr) => {
                return expr.build_with_parent(b, "AND");
            });
            sep = new Insertable(b.softline(), "AND ", null);
            result.push(b.intersperse(docs, sep));
        });
    }
}
// Ported from data_model_10.rb
class OrExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "or_expression");
        this.condition_exps = node.children_vec.map((n) => {
            return create("ConditionExpression", this.context, n);
        });
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let docs;
            let sep;
            docs = this.condition_exps.map((expr) => {
                return expr.build_with_parent(b, "OR");
            });
            sep = new Insertable(b.softline(), "OR ", null);
            result.push(b.intersperse(docs, sep));
        });
    }
}
// Ported from data_model_10.rb
class NotExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "not_expression");
        this.condition_exp = create("ConditionExpression", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            let doc;
            let expr_doc;
            expr_doc = this.condition_exp.build_with_parent(b, "NOT");
            doc = b.concat([b.txt_("NOT"), expr_doc]);
            result.push(doc);
        });
    }
}
// Ported from data_model_10.rb
class SoqlWithType extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "with_type");
        this.variant = create("SoqlWithTypeVariant", this.context, node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from data_model_10.rb
class ForClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "for_clause");
        this.for_type = create("ValueNode", this.context, node.c_by_k("for_type"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.for_type.build(b));
        });
    }
}
// Ported from data_model_10.rb
class AllRowsClause extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "all_rows_clause");
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("ALL ROWS"));
        });
    }
}
// Ported from data_model_10.rb
class UpdateExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "update_expression");
        this.variant = create("UpdateExpressionVariant", this.context, node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from data_model_10.rb
class DmlExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "dml_expression");
        this.variant = create("DmlExpressionVariant", this.context, node);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from data_model_10.rb
class DmlType extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "dml_type");
        this.variant = create("DmlTypeVariant", this.context, node.first_c);
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.variant.build(b));
        });
    }
}
// Ported from enum_def_02.rb
class Statement extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(n) {
        switch (n.kind) {
            case "if_statement": {
                return make("Statement", this.context, "if", create("IfStatement", this.context, n));
            }
            case "expression_statement": {
                return make("Statement", this.context, "exp", create("ExpressionStatement", this.context, n));
            }
            case "local_variable_declaration": {
                return make("Statement", this.context, "local", create("LocalVariableDeclaration", this.context, n));
            }
            case "block": {
                return make("Statement", this.context, "block", create("Block", this.context, n));
            }
            case "for_statement": {
                return make("Statement", this.context, "for", create("ForStatement", this.context, n));
            }
            case "enhanced_for_statement": {
                return make("Statement", this.context, "enhanced_for", create("EnhancedForStatement", this.context, n));
            }
            case "run_as_statement": {
                return make("Statement", this.context, "run", create("RunAsStatement", this.context, n));
            }
            case "do_statement": {
                return make("Statement", this.context, "do", create("DoStatement", this.context, n));
            }
            case "while_statement": {
                return make("Statement", this.context, "while", create("WhileStatement", this.context, n));
            }
            case "return_statement": {
                return make("Statement", this.context, "return", create("ReturnStatement", this.context, n));
            }
            case "try_statement": {
                return make("Statement", this.context, "try", create("TryStatement", this.context, n));
            }
            case "throw_statement": {
                return make("Statement", this.context, "throw", create("ThrowStatement", this.context, n));
            }
            case "break_statement": {
                return make("Statement", this.context, "break", create("BreakStatement", this.context, n));
            }
            case "continue_statement": {
                return make("Statement", this.context, "continue", create("ContinueStatement", this.context, n));
            }
            case "switch_expression": {
                return make("Statement", this.context, "switch", create("SwitchExpression", this.context, n));
            }
            case ";": {
                return make("Statement", this.context, "semi_column");
            }
            default: {
                return this.context.panic_unknown_node(n, "Statement");
            }
        }
    }
    get is_block() {
        return (this.variant === "block");
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "if": {
                result.push(this.value.build(b));
                break;
            }
            case "exp": {
                result.push(this.value.build(b));
                break;
            }
            case "local": {
                result.push(this.value.build(b));
                break;
            }
            case "block": {
                result.push(this.value.build(b));
                break;
            }
            case "for": {
                result.push(this.value.build(b));
                break;
            }
            case "enhanced_for": {
                result.push(this.value.build(b));
                break;
            }
            case "run": {
                result.push(this.value.build(b));
                break;
            }
            case "do": {
                result.push(this.value.build(b));
                break;
            }
            case "while": {
                result.push(this.value.build(b));
                break;
            }
            case "return": {
                result.push(this.value.build(b));
                break;
            }
            case "try": {
                result.push(this.value.build(b));
                break;
            }
            case "throw": {
                result.push(this.value.build(b));
                break;
            }
            case "break": {
                result.push(this.value.build(b));
                break;
            }
            case "continue": {
                result.push(this.value.build(b));
                break;
            }
            case "switch": {
                result.push(this.value.build(b));
                break;
            }
            case "semi_column": {
                result.push(b.txt(";"));
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class Type extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(n) {
        switch (n.kind) {
            case "type_identifier":
            case "void_type":
            case "boolean_type":
            case "generic_type":
            case "scoped_type_identifier":
            case "java_type": {
                return make("Type", this.context, "unannotated", make("UnannotatedType", this.context, "simple", create("SimpleType", this.context, n)));
            }
            case "array_type": {
                return make("Type", this.context, "unannotated", make("UnannotatedType", this.context, "array", create("ArrayType", this.context, n)));
            }
            default: {
                return this.context.panic_unknown_node(n, "Type");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "unannotated": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class PropertyNavigation extends Model {
    constructor(context, variant, value) {
        super(context);
        this.variant = variant;
        this.value = value;
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "safe": {
                result.push(this.value.build(b));
                break;
            }
            case "dot": {
                result.push(b.txt("."));
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class AnnotationArgumentList extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(n) {
        let key_values;
        if ((n.named_child_count === 0)) {
            return make("AnnotationArgumentList", this.context, "nil");
        }
        key_values = n.try_cs_by_k("annotation_key_value");
        if ((key_values.length === 0)) {
            return make("AnnotationArgumentList", this.context, "value", create("ValueNode", this.context, n.c_by_n("value")));
        }
        else {
            key_values = key_values.map((kv) => {
                return create("AnnotationKeyValue", this.context, kv);
            });
            return make("AnnotationArgumentList", this.context, "key_values", key_values);
        }
    }
    build_inner(b, result) {
        let close;
        let doc;
        let docs;
        let open;
        let sep;
        let vec;
        switch (this.variant) {
            case "nil": {
                break;
            }
            case "value": {
                result.push(b.txt("("));
                result.push(this.value.build(b));
                result.push(b.txt(")"));
                break;
            }
            case "key_values": {
                vec = this.value;
                if ((!(vec.length === 0))) {
                    docs = b.to_docs(vec);
                    sep = new Insertable(null, null, b.softline());
                    open = new Insertable(null, "(", b.maybeline());
                    close = new Insertable(b.maybeline(), ")", null);
                    doc = b.group_surround(docs, sep, open, close);
                    result.push(doc);
                }
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class TriggerEventVariant extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(n) {
        switch (n.kind) {
            case "before_insert": {
                return make("TriggerEventVariant", this.context, "before_insert");
            }
            case "before_update": {
                return make("TriggerEventVariant", this.context, "before_update");
            }
            case "before_delete": {
                return make("TriggerEventVariant", this.context, "before_delete");
            }
            case "after_insert": {
                return make("TriggerEventVariant", this.context, "after_insert");
            }
            case "after_update": {
                return make("TriggerEventVariant", this.context, "after_update");
            }
            case "after_delete": {
                return make("TriggerEventVariant", this.context, "after_delete");
            }
            case "after_undelete": {
                return make("TriggerEventVariant", this.context, "after_undelete");
            }
            default: {
                return this.context.panic_unknown_node(n, "TriggerEvent");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "before_insert": {
                result.push(b.txt("before insert"));
                break;
            }
            case "before_update": {
                result.push(b.txt("before update"));
                break;
            }
            case "before_delete": {
                result.push(b.txt("before delete"));
                break;
            }
            case "after_insert": {
                result.push(b.txt("after insert"));
                break;
            }
            case "after_update": {
                result.push(b.txt("after update"));
                break;
            }
            case "after_delete": {
                result.push(b.txt("after delete"));
                break;
            }
            case "after_undelete": {
                result.push(b.txt("after undelete"));
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class SelectClauseVariant extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let count_node;
        this.context.assert_check(node, "select_clause");
        if ((count_node = node.try_c_by_k("count_expression"))) {
            return make("SelectClauseVariant", this.context, "count", create("CountExpression", this.context, count_node));
        }
        else {
            return make("SelectClauseVariant", this.context, "selectable", node.children_vec.map((n) => {
                return create("SelectableExpression", this.context, n);
            }));
        }
    }
    build_inner(b, result) {
        let doc;
        let doc_vec;
        let docs;
        let indented_join;
        let sep;
        doc_vec = [];
        doc_vec.push(b.txt("SELECT"));
        doc_vec.push(b.indent(b.softline()));
        switch (this.variant) {
            case "count": {
                doc_vec.push(this.value.build(b));
                break;
            }
            case "selectable": {
                docs = b.to_docs(this.value);
                sep = new Insertable(null, ",", b.softline());
                doc = b.intersperse(docs, sep);
                indented_join = b.indent(doc);
                doc_vec.push(indented_join);
                break;
            }
        }
        result.push(b.group_concat(doc_vec));
    }
}
// Ported from enum_def_02.rb
class SelectableExpression extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "field_identifier": {
                return make("SelectableExpression", this.context, "value", make("ValueExpression", this.context, "field", create("FieldIdentifier", this.context, node)));
            }
            case "function_expression": {
                return make("SelectableExpression", this.context, "value", make("ValueExpression", this.context, "function", create("FunctionExpression", this.context, node)));
            }
            case "alias_expression": {
                return make("SelectableExpression", this.context, "alias", create("AliasExpression", this.context, node));
            }
            case "fields_expression": {
                return make("SelectableExpression", this.context, "fields", create("FieldsExpression", this.context, node));
            }
            case "subquery": {
                return make("SelectableExpression", this.context, "sub", create("SubQuery", this.context, node));
            }
            default: {
                return this.context.panic_unknown_node(node, "SelectableExpression");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "value": {
                result.push(this.value.build(b));
                break;
            }
            case "alias": {
                result.push(this.value.build(b));
                break;
            }
            case "fields": {
                result.push(this.value.build(b));
                break;
            }
            case "sub": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class FieldsExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "fields_expression");
        this.fields_type = create("ValueNodeUpperCase", this.context, node.c_by_k("fields_type"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt("FIELDS("));
            result.push(this.fields_type.build(b));
            result.push(b.txt(")"));
        });
    }
}
// Ported from enum_def_02.rb
class AliasExpression extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "alias_expression");
        this.value_exp = create("ValueExpression", this.context, node.first_c);
        this.identifier = create("ValueNode", this.context, node.c_by_k("identifier"));
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(this.value_exp.build(b));
            result.push(b.txt(" "));
            result.push(this.identifier.build(b));
        });
    }
}
// Ported from enum_def_02.rb
class FieldIdentifierVariant extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let c;
        this.context.assert_check(node, "field_identifier");
        c = node.first_c;
        switch (c.kind) {
            case "identifier": {
                return make("FieldIdentifierVariant", this.context, "identifier", create("ValueNode", this.context, c));
            }
            case "dotted_identifier": {
                return make("FieldIdentifierVariant", this.context, "dotted", create("DottedIdentifier", this.context, c));
            }
            default: {
                return this.context.panic_unknown_node(c, "FieldIdentifier");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "identifier": {
                result.push(this.value.build(b));
                break;
            }
            case "dotted": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class StorageVariant extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "storage_alias": {
                return make("StorageVariant", this.context, "alias", create("StorageAlias", this.context, node));
            }
            case "storage_identifier": {
                return make("StorageVariant", this.context, "identifier", create("StorageIdentifier", this.context, node));
            }
            default: {
                return this.context.panic_unknown_node(node, "StorageVariant");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "identifier": {
                result.push(this.value.build(b));
                break;
            }
            case "alias": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class StorageIdentifierVariant extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let c;
        this.context.assert_check(node, "storage_identifier");
        c = node.first_c;
        switch (c.kind) {
            case "identifier": {
                return make("StorageIdentifierVariant", this.context, "identifier", create("ValueNode", this.context, c));
            }
            case "dotted_identifier": {
                return make("StorageIdentifierVariant", this.context, "dotted", c.cs_by_k("identifier").map((n) => {
                    return create("ValueNode", this.context, n);
                }));
            }
            default: {
                return this.context.panic_unknown_node(c, "StorageIdentifier");
            }
        }
    }
    build_inner(b, result) {
        let doc;
        let docs;
        let sep;
        switch (this.variant) {
            case "identifier": {
                result.push(this.value.build(b));
                break;
            }
            case "dotted": {
                docs = this.value.map((n) => {
                    return n.build(b);
                });
                sep = new Insertable(null, ".", null);
                doc = b.intersperse(docs, sep);
                result.push(doc);
                break;
            }
        }
    }
}
// Ported from enum_def_02.rb
class LimitValue extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(n) {
        switch (n.kind) {
            case "int": {
                return make("LimitValue", this.context, "int", create("ValueNode", this.context, n));
            }
            case "bound_apex_expression": {
                return make("LimitValue", this.context, "bound", create("BoundApexExpression", this.context, n));
            }
            default: {
                return this.context.panic_unknown_node(n, "LimitValue");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "int": {
                result.push(this.value.build(b));
                break;
            }
            case "bound": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_03.rb
class BooleanExpression extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "and_expression": {
                return make("BooleanExpression", this.context, "and", create("AndExpression", this.context, node));
            }
            case "or_expression": {
                return make("BooleanExpression", this.context, "or", create("OrExpression", this.context, node));
            }
            case "not_expression": {
                return make("BooleanExpression", this.context, "not", create("NotExpression", this.context, node));
            }
            default: {
                return make("BooleanExpression", this.context, "condition", create("ConditionExpression", this.context, node));
            }
        }
    }
    get operator() {
        switch (this.variant) {
            case "and": {
                return "AND";
            }
            case "or": {
                return "OR";
            }
            case "not": {
                return "NOT";
            }
            case "condition": {
                return null;
            }
        }
    }
    build_with_parent(b, parent_op) {
        switch (this.variant) {
            case "and": {
                return this.value.build(b);
            }
            case "or": {
                return this.value.build(b);
            }
            case "not": {
                return this.value.build(b);
            }
            case "condition": {
                return this.value.build_with_parent(b, parent_op);
            }
        }
    }
    build_inner(b, result) {
        let doc;
        doc = this.build_with_parent(b, null);
        result.push(doc);
    }
}
// Ported from enum_def_03.rb
class ConditionExpression extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "comparison_expression": {
                return make("ConditionExpression", this.context, "comparison", create("ComparisonExpression", this.context, node));
            }
            default: {
                return make("ConditionExpression", this.context, "bool", create("BooleanExpression", this.context, node));
            }
        }
    }
    build_with_parent(b, parent_op) {
        let child_op;
        let doc;
        switch (this.variant) {
            case "comparison": {
                return this.value.build(b);
            }
            case "bool": {
                child_op = this.value.operator;
                doc = this.value.build_with_parent(b, child_op);
                if (ConditionExpression.should_parenthesize(parent_op, child_op)) {
                    return b.concat([b.txt("("), doc, b.txt(")")]);
                }
                else {
                    return doc;
                }
            }
        }
    }
    static should_parenthesize(parent_op, child_op) {
        return (!(((parent_op && child_op) && (parent_op === child_op))));
    }
    build_inner(b, result) {
        let doc;
        doc = this.build_with_parent(b, null);
        result.push(doc);
    }
}
// Ported from enum_def_03.rb
class ValueExpression extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(n) {
        switch (n.kind) {
            case "field_identifier": {
                return make("ValueExpression", this.context, "field", create("FieldIdentifier", this.context, n));
            }
            case "function_expression": {
                return make("ValueExpression", this.context, "function", create("FunctionExpression", this.context, n));
            }
            default: {
                return this.context.panic_unknown_node(n, "ValueExpression");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "field": {
                result.push(this.value.build(b));
                break;
            }
            case "function": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_03.rb
class GeoLocationTypeVariant extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let child;
        let decimals;
        child = node.first_c;
        switch (child.kind) {
            case "field_identifier": {
                return make("GeoLocationTypeVariant", this.context, "field", create("FieldIdentifier", this.context, child));
            }
            case "bound_apex_expression": {
                return make("GeoLocationTypeVariant", this.context, "bound", create("BoundApexExpression", this.context, child));
            }
            case "identifier": {
                decimals = node.cs_by_k("decimal");
                if ((decimals.length !== 2)) {
                    throw new Error(`expect 2 decimal nodes, found ${decimals.length} in GeoLocationType`);
                }
                return make("GeoLocationTypeVariant", this.context, "func", { function_name: create("ValueNode", this.context, child), decimal1: create("ValueNode", this.context, decimals[0]), decimal2: create("ValueNode", this.context, decimals[1]) });
            }
            default: {
                return this.context.panic_unknown_node(child, "GeoLocationType");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "field": {
                result.push(this.value.build(b));
                break;
            }
            case "bound": {
                result.push(this.value.build(b));
                break;
            }
            case "func": {
                result.push(this.value["function_name"].build(b));
                result.push(b.txt("("));
                result.push(this.value["decimal1"].build(b));
                result.push(b.txt_(","));
                result.push(this.value["decimal2"].build(b));
                result.push(b.txt(")"));
                break;
            }
        }
    }
}
// Ported from enum_def_03.rb
class Comparison extends Model {
    constructor(context, variant, value) {
        super(context);
        this.variant = variant;
        this.value = value;
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "value": {
                result.push(this.value.build(b));
                break;
            }
            case "set": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_03.rb
class ValueComparedWith extends Model {
    constructor(context, variant, value) {
        super(context);
        this.variant = variant;
        this.value = value;
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "literal": {
                result.push(this.value.build(b));
                break;
            }
            case "bound": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_03.rb
class SoqlLiteral extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "decimal": {
                return make("SoqlLiteral", this.context, "decimal", node.value);
            }
            case "int": {
                return make("SoqlLiteral", this.context, "int", node.value);
            }
            case "string_literal": {
                return make("SoqlLiteral", this.context, "string_literal", node.value);
            }
            case "boolean": {
                return make("SoqlLiteral", this.context, "boolean", node.value);
            }
            case "date": {
                return make("SoqlLiteral", this.context, "boolean", node.value);
            }
            case "date_literal": {
                return make("SoqlLiteral", this.context, "date_literal", node.value);
            }
            case "date_literal_with_param": {
                return make("SoqlLiteral", this.context, "d_with_param", create("DateLiteralWithParam", this.context, node));
            }
            case "null_literal": {
                return make("SoqlLiteral", this.context, "null_literal", node.value);
            }
            default: {
                return this.context.panic_unknown_node(node, "SoqlLiteral");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "decimal": {
                result.push(b.txt(this.value));
                break;
            }
            case "int": {
                result.push(b.txt(this.value));
                break;
            }
            case "string_literal": {
                result.push(b.txt(this.value));
                break;
            }
            case "date": {
                result.push(b.txt(this.value));
                break;
            }
            case "boolean": {
                result.push(b.txt(this.value));
                break;
            }
            case "date_literal": {
                result.push(b.txt(this.value));
                break;
            }
            case "d_with_param": {
                result.push(this.value.build(b));
                break;
            }
            case "null_literal": {
                result.push(b.txt(this.value));
                break;
            }
            default: {
                throw new Error("unimplemented");
            }
        }
    }
}
// Ported from enum_def_03.rb
class DateLiteralWithParam extends Model {
    constructor(context, node) {
        super(context);
        this.context.assert_check(node, "date_literal_with_param");
        this.date_literal = node.cvalue_by_k("date_literal").toUpperCase();
        this.param = node.cvalue_by_k("int");
        this.node_info = NodeInfo.from(node);
    }
    build_inner(b, result) {
        this.context.build_with_comments(b, this.node_info.id, result, (b, result) => {
            result.push(b.txt(`${this.date_literal}:${this.param}`));
        });
    }
}
// Ported from enum_def_03.rb
class SetValue extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "subquery": {
                return make("SetValue", this.context, "sub", create("SubQuery", this.context, node));
            }
            case "comparable_list": {
                return make("SetValue", this.context, "list", create("ComparableList", this.context, node));
            }
            case "bound_apex_expression": {
                return make("SetValue", this.context, "bound", create("BoundApexExpression", this.context, node));
            }
            default: {
                return this.context.panic_unknown_node(node, "SetValue");
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "sub": {
                result.push(this.value.build(b));
                break;
            }
            case "list": {
                result.push(this.value.build(b));
                break;
            }
            case "bound": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_03.rb
class ComparableListValue extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        switch (node.kind) {
            case "bound_apex_expression": {
                return make("ComparableListValue", this.context, "bound", create("BoundApexExpression", this.context, node));
            }
            default: {
                return make("ComparableListValue", this.context, "literal", create("SoqlLiteral", this.context, node));
            }
        }
    }
    build_inner(b, result) {
        switch (this.variant) {
            case "bound": {
                result.push(this.value.build(b));
                break;
            }
            case "literal": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_03.rb
class OffsetClause extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let first_c;
        this.context.assert_check(node, "offset_clause");
        first_c = node.first_c;
        switch (first_c.kind) {
            case "int": {
                return make("OffsetClause", this.context, "int", create("ValueNode", this.context, first_c));
            }
            case "bound_apex_expression": {
                return make("OffsetClause", this.context, "bound", create("BoundApexExpression", this.context, first_c));
            }
            default: {
                return this.context.panic_unknown_node(first_c, "OffsetClause");
            }
        }
    }
    build_inner(b, result) {
        result.push(b.txt_("OFFSET"));
        switch (this.variant) {
            case "int": {
                result.push(this.value.build(b));
                break;
            }
            case "bound": {
                result.push(this.value.build(b));
                break;
            }
        }
    }
}
// Ported from enum_def_03.rb
class FunctionExpressionVariant extends Model {
    constructor(context, nodeOrVariant, value) {
        super(context);
        if (typeof nodeOrVariant === "string") {
            this.variant = nodeOrVariant;
            this.value = value;
        }
        else {
            const selection = this.from_node(nodeOrVariant);
            this.variant = selection.variant;
            this.value = selection.value;
        }
    }
    from_node(node) {
        let function_expression;
        this.context.assert_check(node, "function_expression");
        function_expression = (() => {
            if (node.try_c_by_k("geo_location_type")) {
                return make("FunctionExpressionVariant", this.context, "with_geo", { function_name: create("ValueNode", this.context, node.c_by_n("function_name")), field: optionalMap(node.try_c_by_k("field_identifier"), (n) => {
                        return create("FieldIdentifier", this.context, n);
                    }), bound: optionalMap(node.try_c_by_k("bound_apex_expression"), (n) => {
                        return create("BoundApexExpression", this.context, n);
                    }), geo: create("GeoLocationType", this.context, node.c_by_k("geo_location_type")), string_literal: create("ValueNode", this.context, node.c_by_k("string_literal")) });
            }
            else {
                return make("FunctionExpressionVariant", this.context, "without_geo", { function_name: create("ValueNode", this.context, node.c_by_n("function_name")), value_exps: node.children_vec.slice(1).map((n) => {
                        return create("ValueExpression", this.context, n);
                    }) });
            }
        })();
        return function_expression;
    }
    build_inner(b, result) {
        let close;
        let doc;
        let n;
        let open;
        let sep;
        switch (this.variant) {
            case "with_geo": {
                result.push(this.value["function_name"].build(b));
                result.push(b.txt("("));
                if ((n = this.value["field"])) {
                    result.push(n.build(b));
                }
                if ((n = this.value["bound"])) {
                    result.push(n.build(b));
                }
                result.push(b.txt_(","));
                result.push(this.value["geo"].build(b));
                result.push(b.txt_(","));
                result.push(this.value["string_literal"].build(b));
                result.push(b.txt(")"));
                break;
            }
            case "without_geo": {
                result.push(this.value["function_name"].build(b));
                doc = b.to_docs(this.value["value_exps"]);
                sep = new Insertable(null, ",", b.softline());
                open = new Insertable(null, "(", b.maybeline());
                close = new Insertable(b.maybeline(), ")", null);
                doc = b.group_surround(doc, sep, open, close);
                result.push(doc);
                break;
            }
        }
    }
}
export function registerModelsPart2() {
    register("AccessorDeclaration", AccessorDeclaration);
    register("CastExpression", CastExpression);
    register("ThrowStatement", ThrowStatement);
    register("BreakStatement", BreakStatement);
    register("ContinueStatement", ContinueStatement);
    register("SwitchExpression", SwitchExpression);
    register("SwitchBlock", SwitchBlock);
    register("SwitchRule", SwitchRule);
    register("SwitchLabel", SwitchLabel);
    register("WhenSObjectType", WhenSObjectType);
    register("InstanceOfExpression", InstanceOfExpression);
    register("VersionExpression", VersionExpression);
    register("JavaFieldAccess", JavaFieldAccess);
    register("JavaType", JavaType);
    register("ArrayType", ArrayType);
    register("TriggerDeclaration", TriggerDeclaration);
    register("TriggerEvent", TriggerEvent);
    register("TriggerBody", TriggerBody);
    register("QueryExpression", QueryExpression);
    register("QueryBody", QueryBody);
    register("SoslQueryBody", SoslQueryBody);
    register("FindClause", FindClause);
    register("InClause", InClause);
    register("ReturningClause", ReturningClause);
    register("SObjectReturn", SObjectReturn);
    register("SObjectReturnQuery", SObjectReturnQuery);
    register("SoqlQueryBody", SoqlQueryBody);
    register("FromClause", FromClause);
    register("StorageAlias", StorageAlias);
    register("LimitClause", LimitClause);
    register("UpdateClause", UpdateClause);
    register("BoundApexExpression", BoundApexExpression);
    register("SoslUsingClause", SoslUsingClause);
    register("UsingSearch", UsingSearch);
    register("UsingClause", UsingClause);
    register("UsingClauseOption", UsingClauseOption);
    register("UsingScopeClause", UsingScopeClause);
    register("UsingLookupClause", UsingLookupClause);
    register("UsingListviewClause", UsingListviewClause);
    register("UsingLookupBindClause", UsingLookupBindClause);
    register("UsingLookupBindExpression", UsingLookupBindExpression);
    register("WhereClause", WhereClause);
    register("ComparisonExpression", ComparisonExpression);
    register("ValueComparison", ValueComparison);
    register("SetComparison", SetComparison);
    register("ComparableList", ComparableList);
    register("OrderByClause", OrderByClause);
    register("OrderExpression", OrderExpression);
    register("SubQuery", SubQuery);
    register("MapCreationExpression", MapCreationExpression);
    register("MapInitializer", MapInitializer);
    register("MapKeyInitializer", MapKeyInitializer);
    register("GroupByClause", GroupByClause);
    register("GroupByExpression", GroupByExpression);
    register("HavingClause", HavingClause);
    register("SoslWithClause", SoslWithClause);
    register("SoqlWithClause", SoqlWithClause);
    register("SoqlWithTypeVariant", SoqlWithTypeVariant);
    register("SoslWithType", SoslWithType);
    register("WithDataCatExpression", WithDataCatExpression);
    register("WithDataCatFilter", WithDataCatFilter);
    register("WithDivisionExpression", WithDivisionExpression);
    register("WithSnippetExpression", WithSnippetExpression);
    register("WithNetworkExpression", WithNetworkExpression);
    register("WithMetadataExpression", WithMetadataExpression);
    register("WithSpellCorrectionExpression", WithSpellCorrectionExpression);
    register("WithPriceBookExpression", WithPriceBookExpression);
    register("DottedIdentifier", DottedIdentifier);
    register("ValueNode", ValueNode);
    register("ValueNodeLowerCase", ValueNodeLowerCase);
    register("ValueNodeUpperCase", ValueNodeUpperCase);
    register("ExpressionStatement", ExpressionStatement);
    register("SafeNavigationOperator", SafeNavigationOperator);
    register("CountExpression", CountExpression);
    register("FunctionExpression", FunctionExpression);
    register("FieldIdentifier", FieldIdentifier);
    register("GeoLocationType", GeoLocationType);
    register("SelectClause", SelectClause);
    register("StorageIdentifier", StorageIdentifier);
    register("AndExpression", AndExpression);
    register("OrExpression", OrExpression);
    register("NotExpression", NotExpression);
    register("SoqlWithType", SoqlWithType);
    register("ForClause", ForClause);
    register("AllRowsClause", AllRowsClause);
    register("UpdateExpression", UpdateExpression);
    register("DmlExpression", DmlExpression);
    register("DmlType", DmlType);
    register("Statement", Statement);
    register("Type", Type);
    register("PropertyNavigation", PropertyNavigation);
    register("AnnotationArgumentList", AnnotationArgumentList);
    register("TriggerEventVariant", TriggerEventVariant);
    register("SelectClauseVariant", SelectClauseVariant);
    register("SelectableExpression", SelectableExpression);
    register("FieldsExpression", FieldsExpression);
    register("AliasExpression", AliasExpression);
    register("FieldIdentifierVariant", FieldIdentifierVariant);
    register("StorageVariant", StorageVariant);
    register("StorageIdentifierVariant", StorageIdentifierVariant);
    register("LimitValue", LimitValue);
    register("BooleanExpression", BooleanExpression);
    register("ConditionExpression", ConditionExpression);
    register("ValueExpression", ValueExpression);
    register("GeoLocationTypeVariant", GeoLocationTypeVariant);
    register("Comparison", Comparison);
    register("ValueComparedWith", ValueComparedWith);
    register("SoqlLiteral", SoqlLiteral);
    register("DateLiteralWithParam", DateLiteralWithParam);
    register("SetValue", SetValue);
    register("ComparableListValue", ComparableListValue);
    register("OffsetClause", OffsetClause);
    register("FunctionExpressionVariant", FunctionExpressionVariant);
}
//# sourceMappingURL=models-part2.js.map