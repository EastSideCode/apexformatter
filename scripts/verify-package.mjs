import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const execute = promisify(execFile);
// npm provides its JS entry point during lifecycle scripts, avoiding a shell
// and the platform-specific npm.cmd launcher on Windows.
const npmEntry = process.env.npm_execpath;
assert.ok(npmEntry, 'Run this check with npm run verify:package.');
const { stdout } = await execute(process.execPath, [
  npmEntry, 'pack', '--dry-run', '--json', '--ignore-scripts',
], { cwd: packageRoot, maxBuffer: 4 * 1024 * 1024 });
const packages = JSON.parse(stdout);
assert.equal(packages.length, 1, 'Expected exactly one npm package.');
const files = packages[0].files.map((file) => file.path);
const required = [
  'package.json', 'README.md', 'LICENSE', 'style-guide.xml', 'bin/run.js',
  'lib/formatter.js', 'lib/formatter.d.ts', 'lib/engine/engine.js',
  'lib/engine/parser.js', 'lib/commands/apex/format.js', 'messages/apex.format.md',
];
for (const file of required) assert.ok(files.includes(file), `Required package asset is missing: ${file}`);
const roots = ['bin/', 'lib/', 'messages/'];
const standalone = new Set(['package.json', 'README.md', 'LICENSE', 'style-guide.xml']);
for (const file of files) {
  assert.ok(standalone.has(file) || roots.some((root) => file.startsWith(root)), `Development file entered the npm package: ${file}`);
  assert.ok(!/\.(?:rb|gemspec|so|dll|dylib)$/iu.test(file), `Ruby/native parser asset entered the npm package: ${file}`);
}
process.stdout.write(`Verified ${files.length} npm package files: runtime assets present; tests, fixtures, Ruby source, and native parser libraries excluded.\n`);
