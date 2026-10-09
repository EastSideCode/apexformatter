import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, readdir, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { Config, formatApex, formatPaths } from '../lib/formatter.js';

async function fixture(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'apex-files-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'Example.cls');
  const source = 'public class Example{public void run(){Integer x=1;}}';
  await writeFile(file, source);
  return { root, file, source };
}

test('recursive inputs are deterministic, deduplicate overlaps and ignore unrelated/generated files', async (t) => {
  const { root, file } = await fixture(t);
  const nested = path.join(root, 'nested');
  await Promise.all([mkdir(nested), mkdir(path.join(root, 'node_modules')), mkdir(path.join(root, '.git'))]);
  const trigger = path.join(nested, 'Handler.trigger');
  await writeFile(trigger, 'trigger Handler on Account(before insert){for(Account a:Trigger.new){a.Name=\'x\';}}');
  await writeFile(path.join(root, 'notes.txt'), 'leave this alone');
  await writeFile(path.join(root, 'node_modules', 'Ignored.cls'), 'not Apex');
  await writeFile(path.join(root, '.git', 'Ignored.cls'), 'not Apex');
  const result = await formatPaths({ paths: [root, file, nested], mode: 'write' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.scannedFiles, 2);
  assert.equal(result.writtenFiles, 2);
  assert.deepEqual(result.files.map((item) => item.path), [file, trigger]);
  assert.equal(await readFile(path.join(root, 'notes.txt'), 'utf8'), 'leave this alone');
  assert.equal(await readFile(path.join(root, 'node_modules', 'Ignored.cls'), 'utf8'), 'not Apex');
});

test('check and preview leave bytes and modification times unchanged; only preview includes text', async (t) => {
  const { file, source } = await fixture(t);
  const before = await stat(file);
  for (const mode of ['check', 'dry-run']) {
    const result = await formatPaths({ paths: [file], mode });
    assert.deepEqual(result.errors, []);
    assert.equal(result.changedFiles, 1);
    assert.equal(result.writtenFiles, 0);
    assert.equal(await readFile(file, 'utf8'), source);
    assert.equal((await stat(file)).mtimeMs, before.mtimeMs);
    if (mode === 'dry-run') assert.match(result.files[0].formatted, /Integer x = 1;/u);
    else assert.equal('formatted' in result.files[0], false);
  }
});

test('writing an already formatted file leaves its modification time unchanged', async (t) => {
  const { file } = await fixture(t);
  const first = await formatPaths({ paths: [file], mode: 'write' });
  assert.equal(first.writtenFiles, 1);
  const before = await stat(file);
  const second = await formatPaths({ paths: [file], mode: 'write' });
  assert.deepEqual(second.errors, []);
  assert.equal(second.changedFiles, 0);
  assert.equal(second.unchangedFiles, 1);
  assert.equal(second.writtenFiles, 0);
  assert.equal((await stat(file)).mtimeMs, before.mtimeMs);
});

test('one invalid Apex file prevents every replacement in the batch', async (t) => {
  const { root, file, source } = await fixture(t);
  const bad = path.join(root, 'Broken.cls');
  const invalid = 'class Broken{void run( {';
  await writeFile(bad, invalid);
  const result = await formatPaths({ paths: [file, bad], mode: 'write' });
  assert.equal(result.errors[0].code, 'PARSE_ERROR');
  assert.equal(result.changedFiles, 1);
  assert.equal(result.writtenFiles, 0);
  assert.equal(await readFile(file, 'utf8'), source);
  assert.equal(await readFile(bad, 'utf8'), invalid);
});

test('a valid query whose legacy model omits a clause prevents all batch writes', async (t) => {
  const { root, file, source } = await fixture(t);
  const query = path.join(root, 'Query.cls');
  const input = 'class Query{void run(){Object a=[SELECT Id FROM Account USING SCOPE mine];}}';
  await writeFile(query, input);
  const result = await formatPaths({ paths: [file, query], mode: 'write' });
  assert.equal(result.errors[0].code, 'UNSAFE_FORMAT');
  assert.equal(result.writtenFiles, 0);
  assert.equal(await readFile(file, 'utf8'), source);
  assert.equal(await readFile(query, 'utf8'), input);
});

test('invalid UTF-8 is rejected and preserves every source byte', async (t) => {
  const { root, file, source } = await fixture(t);
  const invalid = path.join(root, 'Encoding.cls');
  const bytes = Buffer.from([0xc3, 0x28]);
  await writeFile(invalid, bytes);
  const result = await formatPaths({ paths: [file, invalid], mode: 'write' });
  assert.equal(result.errors[0].code, 'INVALID_UTF8');
  assert.equal(result.writtenFiles, 0);
  assert.equal(await readFile(file, 'utf8'), source);
  assert.deepEqual(await readFile(invalid), bytes);
});

test('a missing input blocks valid siblings and empty/non-Apex selections have useful errors', async (t) => {
  const { root, file, source } = await fixture(t);
  const missing = await formatPaths({ paths: [file, path.join(root, 'Missing.cls')], mode: 'write' });
  assert.equal(missing.errors[0].code, 'PATH_ERROR');
  assert.equal(missing.writtenFiles, 0);
  assert.equal(await readFile(file, 'utf8'), source);
  const empty = path.join(root, 'empty');
  await mkdir(empty);
  assert.equal((await formatPaths({ paths: [empty], mode: 'write' })).errors[0].code, 'NO_APEX_FILES');
  const text = path.join(root, 'readme.md');
  await writeFile(text, '# readme');
  assert.equal((await formatPaths({ paths: [text], mode: 'write' })).errors[0].code, 'NOT_APEX_SOURCE');
  assert.equal((await formatPaths({ paths: [], mode: 'write' })).errors[0].code, 'INVALID_OPTIONS');
});

test('paths with spaces and Unicode literal bytes survive formatting', async (t) => {
  const { root } = await fixture(t);
  const file = path.join(root, 'Shared Class.cls');
  const source = `class Shared{String text='café 😀 $HOME \\'quoted\\'';}`;
  await writeFile(file, source);
  const result = await formatPaths({ paths: [file], mode: 'write' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.writtenFiles, 1);
  assert.match(await readFile(file, 'utf8'), /'café 😀 \$HOME \\'quoted\\''/u);
});

test('explicit symbolic links are rejected and descendant links are skipped', async (t) => {
  const { root, file, source } = await fixture(t);
  const child = path.join(root, 'Linked.cls');
  await symlink(file, child);
  const explicit = await formatPaths({ paths: [child], mode: 'write' });
  assert.equal(explicit.errors[0].code, 'SYMLINK_INPUT');
  assert.equal(await readFile(file, 'utf8'), source);
  const directory = await formatPaths({ paths: [root], mode: 'check' });
  assert.deepEqual(directory.errors, []);
  assert.equal(directory.scannedFiles, 1);
});

test('atomic replacement preserves permission bits and leaves no temporary artifacts', async (t) => {
  const { root, file } = await fixture(t);
  await chmod(file, 0o640);
  const result = await formatPaths({ paths: [file], mode: 'write' });
  assert.deepEqual(result.errors, []);
  assert.equal((await stat(file)).mode & 0o777, 0o640);
  assert.deepEqual(await readdir(root), ['Example.cls']);
});

test('a concurrent edit detected after formatting prevents all replacements', async (t) => {
  const { root, file, source } = await fixture(t);
  const other = path.join(root, 'Other.cls');
  await writeFile(other, source);
  let count = 0;
  const userEdit = 'class UserEdit{}';
  const result = await formatPaths({ paths: [file, other], mode: 'write' }, {
    formatSource: async (input, config) => {
      const formatted = await formatApex(input, config);
      if (++count === 2) await writeFile(file, userEdit);
      return formatted;
    },
  });
  assert.equal(result.errors[0].code, 'CONCURRENT_MODIFICATION');
  assert.equal(result.writtenFiles, 0);
  assert.equal(await readFile(file, 'utf8'), userEdit);
  assert.equal(await readFile(other, 'utf8'), source);
  assert.equal((await formatApex(source, new Config())).includes('Integer x = 1;'), true);
});
