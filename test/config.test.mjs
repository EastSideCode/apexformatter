import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { Config, formatPaths } from '../lib/formatter.js';

async function directory(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'apex-config-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('the supplied style guide reads only Apex settings and matches default values', async () => {
  const config = await Config.from_file(new URL('../style-guide.xml', import.meta.url).pathname);
  assert.deepEqual({ ...config }, { ...new Config() });
});

test('XML combines Apex-specific, common and indentation options while ignoring other languages', () => {
  const config = Config.from_xml(`<code_scheme>
    <ApexCodeStyleSettings><option name="QUERY_BRACKET_STYLE" value="1" /></ApexCodeStyleSettings>
    <codeStyleSettings language="JavaScript"><option name="RIGHT_MARGIN" value="500" /></codeStyleSettings>
    <codeStyleSettings language="Apex"><option name="RIGHT_MARGIN" value="40" />
      <option name="ELSE_ON_NEW_LINE" value="false" /><indentOptions>
      <option name="INDENT_SIZE" value="2" /><option name="CONTINUATION_INDENT_SIZE" value="6" />
      </indentOptions></codeStyleSettings></code_scheme>`);
  assert.equal(config.max_width, 40);
  assert.equal(config.indent_size, 2);
  assert.equal(config.continuation_indent_size, 6);
  assert.equal(config.else_on_new_line, false);
  assert.equal(config.query_bracket_next_line(), false);
  assert.equal(config.catch_on_new_line, true);
});

test('the original limited TOML dialect handles comments, booleans and ignored keys', () => {
  const config = Config.from_toml(`[formatter]\nmax_width = 50 # width\nindent_size=2\ncontinuation_indent_size=6\nelse_on_new_line=FALSE\nquery_bracket_style=1\nunknown=123\n`);
  assert.equal(config.max_width, 50);
  assert.equal(config.indent_size, 2);
  assert.equal(config.continuation_indent_size, 6);
  assert.equal(config.else_on_new_line, false);
  assert.equal(config.query_bracket_next_line(), false);
  assert.equal(config.while_on_new_line, true);
});

test('malformed XML and invalid recognized values fail with a configuration error', () => {
  for (const input of ['<code_scheme>', '<code_scheme><ApexCodeStyleSettings><option name="QUERY_BRACKET_STYLE" value="9" /></ApexCodeStyleSettings></code_scheme>', '<code_scheme><codeStyleSettings language="Apex"><option name="RIGHT_MARGIN" value="abc" /></codeStyleSettings></code_scheme>']) {
    assert.throws(() => Config.from_xml(input), { code: 'INVALID_CONFIG' });
  }
  assert.throws(() => Config.from_toml('max_width=0'), { code: 'INVALID_CONFIG' });
  assert.throws(() => Config.from_toml('indent_size=999999999'), { code: 'INVALID_CONFIG' });
});

test('discovery chooses the closest directory and XML takes priority over TOML in that directory', async (t) => {
  const root = await directory(t);
  const nested = path.join(root, 'src');
  await mkdir(nested);
  const file = path.join(nested, 'Sample.cls');
  await writeFile(file, 'class Sample{}');
  await writeFile(path.join(root, 'apexformatter.toml'), 'indent_size=6');
  await writeFile(path.join(nested, '.apexformatter.toml'), 'indent_size=2');
  assert.equal((await Config.discover(file)).indent_size, 2);
  await writeFile(path.join(nested, 'style-guide.xml'), '<code_scheme><codeStyleSettings language="Apex"><indentOptions><option name="INDENT_SIZE" value="3" /></indentOptions></codeStyleSettings></code_scheme>');
  assert.equal((await Config.discover(file)).indent_size, 3);
});

test('one configuration from the first selected file applies to the entire batch', async (t) => {
  const root = await directory(t);
  const a = path.join(root, 'a');
  const b = path.join(root, 'b');
  await Promise.all([mkdir(a), mkdir(b)]);
  await writeFile(path.join(a, '.apexformatter.toml'), 'indent_size=2');
  await writeFile(path.join(b, '.apexformatter.toml'), 'indent_size=6');
  const files = [path.join(a, 'A.cls'), path.join(b, 'B.cls')];
  await Promise.all(files.map((file) => writeFile(file, 'class Example{void run(){Integer x=1;}}')));
  const result = await formatPaths({ paths: files, mode: 'dry-run' });
  assert.deepEqual(result.errors, []);
  for (const file of result.files) assert.match(file.formatted, /\n {2}void run/u);
});

test('an explicit config overrides discovery and changes actual layout', async (t) => {
  const root = await directory(t);
  const file = path.join(root, 'Example.cls');
  await writeFile(file, 'class Example{void run(){if(true){run();}else{run();}}}');
  await writeFile(path.join(root, '.apexformatter.toml'), 'indent_size=2');
  const explicit = path.join(root, 'explicit.toml');
  await writeFile(explicit, 'indent_size=6\nelse_on_new_line=false');
  const result = await formatPaths({ paths: [file], mode: 'dry-run', configPath: explicit });
  assert.deepEqual(result.errors, []);
  assert.match(result.files[0].formatted, /\n {6}void run/u);
  assert.match(result.files[0].formatted, /\} else \{/u);
  assert.equal(await readFile(file, 'utf8'), 'class Example{void run(){if(true){run();}else{run();}}}');
});

test('a discovered malformed config prevents writes and an absent config produces a controlled error', async (t) => {
  const root = await directory(t);
  const file = path.join(root, 'Example.cls');
  const source = 'class Example{}';
  await writeFile(file, source);
  await writeFile(path.join(root, 'style-guide.xml'), '<code_scheme>');
  const result = await formatPaths({ paths: [file], mode: 'write' });
  assert.equal(result.errors[0].code, 'INVALID_CONFIG');
  assert.equal(result.writtenFiles, 0);
  assert.equal(await readFile(file, 'utf8'), source);
  const missing = await formatPaths({ paths: [file], mode: 'write', configPath: path.join(root, 'missing.xml') });
  assert.equal(missing.errors[0].code, 'CONFIG_READ_ERROR');
  assert.equal(missing.writtenFiles, 0);
});
