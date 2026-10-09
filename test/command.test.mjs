import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, mock, test } from 'node:test';
import { Config, ux } from '@oclif/core';
import { format } from 'node:util';
import ApexFormat from '../lib/commands/apex/format.js';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const config = await Config.load({ root: packageRoot });
const fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'apex-format-command-'));

function result(mode, overrides = {}) {
  return {
    mode,
    scannedFiles: 0,
    changedFiles: 0,
    unchangedFiles: 0,
    writtenFiles: 0,
    changedPaths: [],
    files: [],
    errors: [],
    ...overrides,
  };
}

class RecordingFormat extends ApexFormat {
  calls = [];
  outcome = result('write');

  async executeFormat(options) {
    this.calls.push(options);
    return this.outcome;
  }

  envelope(value) {
    return this.toSuccessJson(value);
  }
}

function cliTest(name, exercise) {
  return test(name, async () => {
    const originalExitCode = process.exitCode;
    const originalContentType = process.env.SF_CONTENT_TYPE;
    delete process.env.SF_CONTENT_TYPE;
    process.exitCode = undefined;
    try {
      await exercise();
    } finally {
      mock.restoreAll();
      process.exitCode = originalExitCode;
      if (originalContentType === undefined) delete process.env.SF_CONTENT_TYPE;
      else process.env.SF_CONTENT_TYPE = originalContentType;
    }
  });
}

function captureOutput() {
  const stdout = [];
  const stderr = [];
  mock.method(ux, 'stdout', (...args) => stdout.push(format(...args) + '\n'));
  mock.method(ux, 'stderr', (...args) => stderr.push(format(...args) + '\n'));
  return {
    stdout: () => stdout.join(''),
    stderr: () => stderr.join(''),
  };
}

after(async () => {
  await rm(fixtureDirectory, { recursive: true, force: true });
});

cliTest('real flag parsing preserves each repeated path and selects write mode', async () => {
  const command = new RecordingFormat(['--path', 'src/A.cls', '-p', 'src/shared classes'], config);
  captureOutput();

  const actual = await command.run();

  assert.deepEqual(command.calls, [{ paths: ['src/A.cls', 'src/shared classes'], mode: 'write' }]);
  assert.equal(actual, command.outcome);
  assert.equal(process.exitCode, undefined);
  assert.equal('ruby' in ApexFormat.flags, false);
  assert.equal('formatter-dir' in ApexFormat.flags, false);
  assert.equal('target-org' in ApexFormat.flags, false);
});

cliTest('an existing configuration and preview mode are passed to the engine', async () => {
  const configPath = path.join(fixtureDirectory, 'custom style.xml');
  await writeFile(configPath, '<code_scheme/>');
  const command = new RecordingFormat(['-p', 'source.cls', '-c', configPath, '-n'], config);
  command.outcome = result('dry-run');
  captureOutput();

  await command.run();

  assert.deepEqual(command.calls, [{ paths: ['source.cls'], configPath, mode: 'dry-run' }]);
});

cliTest('mutually exclusive check and preview modes fail before engine invocation', async () => {
  const command = new RecordingFormat(['--path', 'source.cls', '--check', '--dry-run'], config);

  await assert.rejects(command.run(), /check|dry-run/);
  assert.equal(command.calls.length, 0);
});

cliTest('a missing required path fails before engine invocation', async () => {
  const command = new RecordingFormat(['--check'], config);

  await assert.rejects(command.run(), /path/);
  assert.equal(command.calls.length, 0);
});

cliTest('a nonexistent configuration is rejected by the flag parser', async () => {
  const configPath = path.join(fixtureDirectory, 'missing.xml');
  const command = new RecordingFormat(['--path', 'source.cls', '--config', configPath], config);

  await assert.rejects(command.run(), /config|exist|file/i);
  assert.equal(command.calls.length, 0);
});

cliTest('unflagged extra paths and removed runtime flags are rejected', async () => {
  for (const extra of [['second.cls'], ['--ruby', 'ruby'], ['--formatter-dir', fixtureDirectory]]) {
    const command = new RecordingFormat(['--path', 'source.cls', ...extra], config);
    await assert.rejects(command.run());
    assert.equal(command.calls.length, 0);
  }
});

cliTest('check mode with changes exits one and retains the typed result', async () => {
  const command = new RecordingFormat(['--path', 'source.cls', '--check'], config);
  command.outcome = result('check', {
    scannedFiles: 1,
    changedFiles: 1,
    changedPaths: ['source.cls'],
    files: [{ path: 'source.cls', status: 'changed', written: false }],
  });
  const output = captureOutput();

  const actual = await command.run();
  const envelope = command.envelope(actual);

  assert.deepEqual(command.calls, [{ paths: ['source.cls'], mode: 'check' }]);
  assert.equal(process.exitCode, 1);
  assert.equal(envelope.status, 1);
  assert.equal(envelope.result, command.outcome);
  assert.match(output.stdout(), /Needs formatting: source\.cls/);
  assert.equal('formatted' in actual.files[0], false);
});

cliTest('clean check and changed write both succeed', async () => {
  for (const mode of ['check', 'write']) {
    const argv = ['--path', 'source.cls', ...(mode === 'check' ? ['--check'] : [])];
    const command = new RecordingFormat(argv, config);
    const isWrite = mode === 'write';
    command.outcome = result(mode, {
      scannedFiles: 1,
      changedFiles: isWrite ? 1 : 0,
      unchangedFiles: isWrite ? 0 : 1,
      writtenFiles: isWrite ? 1 : 0,
      changedPaths: isWrite ? ['source.cls'] : [],
      files: [{ path: 'source.cls', status: isWrite ? 'changed' : 'unchanged', written: isWrite }],
    });
    captureOutput();

    const actual = await command.run();

    assert.equal(command.envelope(actual).status, 0);
    assert.equal(process.exitCode, undefined);
  }
});

cliTest('human preview prints formatted content and never marks files written', async () => {
  const command = new RecordingFormat(['--path', 'source.cls', '--dry-run'], config);
  command.outcome = result('dry-run', {
    scannedFiles: 1,
    changedFiles: 1,
    changedPaths: ['source.cls'],
    files: [{ path: 'source.cls', status: 'changed', written: false, formatted: 'public class Source {\n}\n' }],
  });
  const output = captureOutput();

  const actual = await command.run();

  assert.match(output.stdout(), /===== source\.cls =====/);
  assert.match(output.stdout(), /public class Source \{/);
  assert.equal(actual.writtenFiles, 0);
  assert.equal(process.exitCode, undefined);
});

cliTest('JSON mode suppresses preview and warnings while retaining result and error details', async () => {
  const command = new RecordingFormat(['--path', 'source.cls', '--dry-run', '--json'], config);
  const error = { path: 'broken.cls', code: 'PARSE_ERROR', message: 'The source contains a syntax error.' };
  command.outcome = result('dry-run', {
    scannedFiles: 2,
    changedFiles: 1,
    changedPaths: ['source.cls'],
    files: [
      { path: 'source.cls', status: 'changed', written: false, formatted: 'public class Source {}\n' },
      { path: 'broken.cls', status: 'error', written: false, error },
    ],
    errors: [error],
  });
  const output = captureOutput();

  const actual = await command.run();
  const envelope = command.envelope(actual);

  assert.equal(output.stdout(), '');
  assert.equal(output.stderr(), '');
  assert.equal(envelope.status, 1);
  assert.equal(envelope.result, command.outcome);
  assert.deepEqual(envelope.result.errors, [error]);
  assert.equal(envelope.warnings.length, 1);
  assert.match(envelope.warnings[0], /broken\.cls.*PARSE_ERROR/);
});

cliTest('errors retain typed per-file diagnostics and fail every mode', async () => {
  for (const mode of ['write', 'check', 'dry-run']) {
    const extra = mode === 'check' ? ['--check'] : mode === 'dry-run' ? ['--dry-run'] : [];
    const command = new RecordingFormat(['--path', 'broken.cls', ...extra], config);
    const error = { code: 'PARSE_ERROR', message: 'The source cannot be parsed.' };
    command.outcome = result(mode, {
      scannedFiles: 1,
      files: [{ path: 'broken.cls', status: 'error', written: false, error }],
      errors: [error],
    });
    const output = captureOutput();

    const actual = await command.run();

    assert.equal(process.exitCode, 1);
    assert.equal(actual, command.outcome);
    assert.match(output.stderr(), /formatter.*PARSE_ERROR/);
  }
});

cliTest('the production adapter delegates to the TypeScript engine and writes the selected file', async () => {
  const file = path.join(fixtureDirectory, 'Live.cls');
  await writeFile(file, 'public class Live{public Integer count=1;}');
  const command = new ApexFormat(['--path', file, '--json'], config);
  captureOutput();

  const actual = await command.run();
  const saved = await readFile(file, 'utf8');

  assert.equal(actual.mode, 'write');
  assert.equal(actual.scannedFiles, 1);
  assert.equal(actual.changedFiles, 1);
  assert.equal(actual.writtenFiles, 1);
  assert.deepEqual(actual.errors, []);
  assert.equal(actual.files[0].written, true);
  assert.match(saved, /public Integer count = 1;/);
  assert.equal(process.exitCode, undefined);
});
