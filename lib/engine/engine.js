import { DocBuilder } from './builder.js';
import { FormatContext } from './context.js';
import { prettyPrint } from './doc.js';
import { registerModelsPart1 } from './models-part1.js';
import { registerModelsPart2 } from './models-part2.js';
import { parseSource } from './parser.js';
import { FormatterError } from '../errors.js';
let registered = false;
function registerModels() {
    if (registered)
        return;
    registerModelsPart1();
    registerModelsPart2();
    registered = true;
}
function lastErrorNode(node) {
    if (!node.has_error)
        return null;
    let last = node;
    for (const child of node.children)
        if (child.has_error)
            last = lastErrorNode(child) ?? last;
    return last;
}
function tokenSignature(node, tokens = []) {
    if (node.is_extra || node.kind === 'line_comment' || node.kind === 'block_comment')
        return tokens;
    // Quoted Apex strings and SOSL terms retain their exact case, spacing and escapes.
    if (node.kind === 'string_literal' || node.kind === 'term') {
        tokens.push(`${node.kind}:${node.value}`);
        return tokens;
    }
    const children = node.children;
    if (children.length) {
        for (const child of children)
            tokenSignature(child, tokens);
    }
    else if (node.value.trim()) {
        const value = node.kind === 'int' ? node.value : node.value.toLowerCase().replace(/\s+/gu, ' ').trim();
        tokens.push(`${node.kind === 'int' ? 'int' : 'token'}:${value}`);
    }
    return tokens;
}
async function assertSafeOutput(sourceTokens, output) {
    const formattedTree = await parseSource(output);
    try {
        if (formattedTree.root.has_error) {
            throw new FormatterError('UNSAFE_FORMAT', 'Formatted output did not parse as Apex. The source file was not changed.');
        }
        const outputTokens = tokenSignature(formattedTree.root);
        if (sourceTokens.length !== outputTokens.length || sourceTokens.some((token, index) => token !== outputTokens[index])) {
            throw new FormatterError('UNSAFE_FORMAT', 'Formatting would change or omit Apex tokens. The source file was not changed.');
        }
    }
    finally {
        formattedTree.delete();
    }
}
/** Parses and formats one source with per-file state and guaranteed tree cleanup. */
export async function formatApex(source, config) {
    registerModels();
    const tree = await parseSource(source);
    try {
        if (tree.root.has_error) {
            const errorNode = lastErrorNode(tree.root) ?? tree.root;
            throw new FormatterError('PARSE_ERROR', `Apex syntax could not be parsed at line ${errorNode.start_row + 1}, bytes ${errorNode.start_byte}-${errorNode.end_byte}.`);
        }
        const context = new FormatContext(source);
        const sourceTokens = tokenSignature(tree.root);
        context.collect_comments(tree.root);
        const root = context.enrich(tree);
        const builder = new DocBuilder(config, context);
        const result = prettyPrint(root.build(builder), config.max_width);
        context.assert_no_missing_comments();
        await assertSafeOutput(sourceTokens, result);
        return result;
    }
    finally {
        tree.delete();
    }
}
export const formatOne = formatApex;
//# sourceMappingURL=engine.js.map