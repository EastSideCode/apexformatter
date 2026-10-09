import assert from 'node:assert/strict';
import test from 'node:test';
import { DocBuilder, Insertable } from '../lib/engine/builder.js';
import { Comment, CommentMetadata } from '../lib/engine/comments.js';
import { Config } from '../lib/engine/config.js';
import { FormatContext } from '../lib/engine/context.js';
import { prettyPrint } from '../lib/engine/doc.js';
import { formatApex } from '../lib/engine/engine.js';
import { parseSource } from '../lib/engine/parser.js';

const builder = (values = {}) => new DocBuilder(new Config(values), new FormatContext(''));

test('group fit uses UTF-8 byte width rather than JavaScript string length', () => {
  const b = builder();
  const document = b.group_concat([b.txt('prefix'), b.softline(), b.txt('café')]);
  assert.equal(prettyPrint(document, 11), 'prefix\ncafé');
  assert.equal(prettyPrint(document, 12), 'prefix café');
});

test('a choice accounts for following chunks on the same line', () => {
  const b = builder();
  const document = b.concat([
    b.choice(b.txt('AB'), b.concat([b.txt('A'), b.nl(), b.txt('B')])),
    b.txt('CD'),
  ]);
  assert.equal(prettyPrint(document, 3), 'A\nBCD');
  assert.equal(prettyPrint(document, 4), 'ABCD');
});

test('line comments force a grouped expression to end the line even with ample width', () => {
  const b = builder();
  const document = b.group_concat([
    b.txt('first // keep'), b.nl_when_in_flat(), b.softline(), b.txt('second'),
  ]);
  assert.equal(prettyPrint(document, 200), 'first // keep\nsecond');
});

test('block and continuation indentation are independent and dedent stops at zero', () => {
  const b = builder({ indent_size: 2, continuation_indent_size: 6 });
  const document = b.concat([
    b.txt('body'), b.indent(b.concat([b.nl(), b.txt('block')])),
    b.cont_indent(b.concat([b.nl(), b.txt('continuation')])),
    b.dedent(b.concat([b.nl(), b.txt('end')])),
  ]);
  assert.equal(prettyPrint(document, 80), 'body\n  block\n      continuation\nend');
});

test('surrounding an empty list retains delimiters and adjacent comment spaces do not double', () => {
  const b = builder();
  const empty = b.surround([], new Insertable(null, ',', b.softline()),
    new Insertable(null, '(', b.maybeline()), new Insertable(b.maybeline(), ')', null));
  const document = b.concat([empty, b.txt(' '), b.txt(' '), b.txt('value')]);
  assert.equal(prettyPrint(document, 80), '() value');
});

test('the Node adapter preserves Unicode source text and exposes Ruby-compatible byte offsets', async () => {
  const prefix = '// café 🌟\n';
  const source = prefix + "public class Example { String label = 'café 🌟'; }";
  const tree = await parseSource(source);
  try {
    assert.equal(tree.root.has_error, false);
    const declaration = tree.root.c_by_k('class_declaration');
    assert.equal(declaration.start_byte, Buffer.byteLength(prefix));
    assert.equal(declaration.value, source.slice(prefix.length));
    assert.equal(declaration.c_by_n('name').value, 'Example');
    assert.equal(declaration.parent.id, tree.root.id);
    assert.equal(tree.root.children_vec.length, 1, 'Comment extras stay outside model child vectors');
    assert.equal(tree.root.named_children[0].next_named.value, declaration.value);
  } finally {
    tree.delete();
  }
});

test('comment attachment fails closed until every collected comment is printed', async () => {
  const source = '// keep this comment\npublic class Example {}';
  const tree = await parseSource(source);
  try {
    const context = new FormatContext(source);
    context.collect_comments(tree.root);
    assert.throws(() => context.assert_no_missing_comments(), /did not print 1 comment node/);
    const declaration = tree.root.c_by_k('class_declaration');
    const b = new DocBuilder(new Config(), context);
    const docs = [];
    context.handle_pre_comments(b, context.get_comment_bucket(declaration.id), docs);
    docs.push(b.txt('public class Example {}'));
    assert.equal(prettyPrint(b.concat(docs), 80), source);
    assert.doesNotThrow(() => context.assert_no_missing_comments());
  } finally {
    tree.delete();
  }
});

test('block comment layout trims ASCII indentation without discarding Unicode nonbreaking spaces', () => {
  const b = builder();
  const metadata = new CommentMetadata({
    has_leading_content: false, has_trailing_content: false,
    has_newline_above: false, has_newline_below: false, has_prev_node: false,
    is_followed_by_bracket_composite_node: false, is_line_comment_and_need_newline: false,
  });
  const comment = new Comment('/*\n  \u00a0keep\u00a0  \n*/', 'block', metadata);
  assert.equal(prettyPrint(comment.build(b), 80), '/*\n\u00a0keep\u00a0\n*/');
});

test('simultaneous formats keep source and comment state isolated', async () => {
  const [first, second] = await Promise.all([
    formatApex('// first-only\npublic class First{String label=\'café\';}', new Config()),
    formatApex('// second-only\npublic class Second{String label=\'🌟\';}', new Config()),
  ]);
  assert.ok(first.includes('// first-only'));
  assert.ok(first.includes("'café'"));
  assert.ok(!first.includes('second-only'));
  assert.ok(second.includes('// second-only'));
  assert.ok(second.includes("'🌟'"));
  assert.ok(!second.includes('first-only'));
  assert.equal(await formatApex(first, new Config()), first);
  assert.equal(await formatApex(second, new Config()), second);
});

test('invalid Apex produces a controlled location error without echoing source', async () => {
  await assert.rejects(
    formatApex("public class Example{String password='PRIVATE_SOURCE';", new Config()),
    (error) => error.code === 'PARSE_ERROR' && !error.message.includes('PRIVATE_SOURCE'),
  );
});

test('SOSL quoted search terms retain their case and repeated spaces', async () => {
  const source = "public class Example{Object rows=[FIND 'KeepCase  Search' RETURNING Account(Id)];}";
  const formatted = await formatApex(source, new Config());
  assert.ok(formatted.includes("FIND 'KeepCase  Search'"));
  assert.equal(await formatApex(formatted, new Config()), formatted);
});

test('output validation rejects a change to SOSL quoted search term data', async (t) => {
  const original = DocBuilder.prototype.txt;
  let changedTerms = 0;
  const stub = t.mock.method(DocBuilder.prototype, 'txt', function (text) {
    if (text === "'KeepCase  Search'") {
      changedTerms++;
      return original.call(this, "'keepcase search'");
    }
    return original.call(this, text);
  });
  try {
    await assert.rejects(
      formatApex("public class Example{Object rows=[FIND 'KeepCase  Search' RETURNING Account(Id)];}", new Config()),
      (error) => error.code === 'UNSAFE_FORMAT' && /tokens/.test(error.message),
    );
    assert.equal(changedTerms, 1, 'Fixture must alter the actual SOSL term during document construction');
  } finally {
    stub.mock.restore();
  }
});

test('inherited omissions are rejected instead of silently deleting query tokens', async () => {
  for (const query of [
    'SELECT Id FROM Account USING SCOPE mine',
    'SELECT Id FROM Account UPDATE TRACKING',
    "FIND 'Acme' RETURNING Account(Id) OFFSET 2",
  ]) {
    const source = `public class Example{Object rows=[${query}];}`;
    const tree = await parseSource(source);
    try {
      assert.equal(tree.root.has_error, false, 'Fixture must exercise omitted tokens from valid input');
    } finally {
      tree.delete();
    }
    await assert.rejects(formatApex(source, new Config()),
      (error) => error.code === 'UNSAFE_FORMAT' && /tokens/.test(error.message));
  }
});
