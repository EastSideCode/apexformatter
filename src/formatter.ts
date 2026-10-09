import { isUtf8 } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { lstat, open, readFile, readdir, realpath, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Config } from './engine/config.js';
import { formatApex } from './engine/engine.js';
import { errorInfo, FormatterError } from './errors.js';

export { FormatterError } from './errors.js';
export { Config } from './engine/config.js';
export { formatApex, formatOne } from './engine/engine.js';

export type FormatMode = 'write' | 'check' | 'dry-run';
export type FormatOptions = { paths: string[]; configPath?: string; mode: FormatMode };
export type FormatError = { path?: string; code: string; message: string };
export type FileResult = {
  path: string;
  status: 'changed' | 'unchanged' | 'error';
  written: boolean;
  formatted?: string;
  error?: { code: string; message: string };
};
export type FormatResult = {
  mode: FormatMode;
  scannedFiles: number;
  changedFiles: number;
  unchangedFiles: number;
  writtenFiles: number;
  changedPaths: string[];
  files: FileResult[];
  errors: FormatError[];
};
export type FormatterDependencies = { formatSource?: (source: string, config: Config) => Promise<string> };

type SourceFile = { path: string; original: Buffer; mode: number; formatted: string; result: FileResult };
const isApex = (file: string): boolean => /\.(?:cls|trigger)$/iu.test(file);
const ignoredDirectories = new Set(['.git', 'node_modules']);

async function collectFiles(inputs: string[], errors: FormatError[]): Promise<string[]> {
  const files: string[] = [];
  const seenFiles = new Set<string>();
  const seenDirectories = new Set<string>();
  const add = (file: string): void => {
    if (seenFiles.has(file)) return;
    seenFiles.add(file);
    files.push(file);
  };
  const walk = async (directory: string): Promise<void> => {
    if (seenDirectories.has(directory)) return;
    seenDirectories.add(directory);
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      // Never follow links encountered while expanding a selected directory.
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) await walk(file);
      else if (entry.isFile() && isApex(file)) add(file);
    }
  };
  for (const input of inputs) {
    const absolute = path.resolve(input);
    try {
      const stats = await lstat(absolute);
      if (stats.isSymbolicLink()) throw new FormatterError('SYMLINK_INPUT', 'Select the original file or directory instead of a symbolic link.');
      const canonical = await realpath(absolute);
      if (stats.isDirectory()) await walk(canonical);
      else if (stats.isFile() && isApex(canonical)) add(canonical);
      else throw new FormatterError('NOT_APEX_SOURCE', 'Select a directory or an Apex .cls/.trigger file.');
    } catch (error) {
      errors.push({ path: absolute, ...errorInfo(error, 'PATH_ERROR') });
    }
  }
  return files;
}

async function assertUnchanged(file: SourceFile): Promise<void> {
  try {
    const stats = await lstat(file.path);
    if (!stats.isFile() || stats.isSymbolicLink() || await realpath(file.path) !== file.path ||
        !file.original.equals(await readFile(file.path))) {
      throw new FormatterError('CONCURRENT_MODIFICATION', 'The file changed during formatting; no replacement was made for this file.');
    }
  } catch (error) {
    if (error instanceof FormatterError) throw error;
    throw new FormatterError('CONCURRENT_MODIFICATION', `Unable to verify the original file: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

async function writeAtomic(file: SourceFile): Promise<void> {
  const temporary = path.join(path.dirname(file.path), `.${path.basename(file.path)}.${randomUUID()}.tmp`);
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    await assertUnchanged(file);
    handle = await open(temporary, 'wx', file.mode);
    await handle.writeFile(file.formatted, 'utf8');
    await handle.chmod(file.mode);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await assertUnchanged(file);
    await rename(temporary, file.path);
  } finally {
    await handle?.close();
    try { await unlink(temporary); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

/** Format a batch locally; any preflight/parse/format error prevents all writes. */
export async function formatPaths(options: FormatOptions, dependencies: FormatterDependencies = {}): Promise<FormatResult> {
  const result: FormatResult = {
    mode: options.mode, scannedFiles: 0, changedFiles: 0, unchangedFiles: 0,
    writtenFiles: 0, changedPaths: [], files: [], errors: [],
  };
  if (!['write', 'check', 'dry-run'].includes(options.mode) || options.paths.length === 0) {
    result.errors.push({ code: 'INVALID_OPTIONS', message: 'Supply at least one path and a valid write, check, or dry-run mode.' });
    return result;
  }
  const paths = await collectFiles(options.paths, result.errors);
  result.scannedFiles = paths.length;
  if (!paths.length && !result.errors.length) {
    result.errors.push({ code: 'NO_APEX_FILES', message: 'No Apex .cls/.trigger files were found in the selected paths.' });
  }
  if (result.errors.length) return result;

  let config: Config;
  try {
    // The Ruby command chooses one configuration from the first selected file.
    config = options.configPath ? await Config.from_file(path.resolve(options.configPath)) : await Config.discover(paths[0]);
  } catch (error) {
    result.errors.push({ ...(options.configPath ? { path: path.resolve(options.configPath) } : {}), ...errorInfo(error, 'CONFIG_ERROR') });
    return result;
  }
  const ready: SourceFile[] = [];
  const format = dependencies.formatSource ?? formatApex;
  for (const file of paths) {
    const entry: FileResult = { path: file, status: 'unchanged', written: false };
    result.files.push(entry);
    try {
      const stats = await lstat(file);
      if (!stats.isFile() || stats.isSymbolicLink() || await realpath(file) !== file) {
        throw new FormatterError('CONCURRENT_MODIFICATION', 'The source path changed while inputs were being collected.');
      }
      const original = await readFile(file);
      if (!isUtf8(original)) throw new FormatterError('INVALID_UTF8', 'Apex source is not valid UTF-8.');
      const source = original.toString('utf8');
      const formatted = await format(source, config);
      const changed = formatted !== source;
      entry.status = changed ? 'changed' : 'unchanged';
      if (options.mode === 'dry-run') entry.formatted = formatted;
      if (changed) { result.changedFiles++; result.changedPaths.push(file); }
      else result.unchangedFiles++;
      ready.push({ path: file, original, formatted, mode: stats.mode & 0o777, result: entry });
    } catch (error) {
      entry.status = 'error';
      entry.error = errorInfo(error);
      result.errors.push({ path: file, ...entry.error });
    }
  }
  if (options.mode !== 'write' || result.errors.length) return result;

  // Validate the whole batch before the first write; recheck each replacement.
  for (const file of ready) {
    try { await assertUnchanged(file); } catch (error) {
      result.errors.push({ path: file.path, ...errorInfo(error) });
    }
  }
  if (result.errors.length) return result;
  for (const file of ready.filter((item) => item.result.status === 'changed')) {
    try {
      await writeAtomic(file);
      file.result.written = true;
      result.writtenFiles++;
    } catch (error) {
      file.result.error = errorInfo(error, 'WRITE_ERROR');
      result.errors.push({ path: file.path, ...file.result.error });
      break;
    }
  }
  return result;
}
