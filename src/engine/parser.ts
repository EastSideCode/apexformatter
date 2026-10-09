import { readFile } from 'node:fs/promises';
import { Language, Parser, type Tree as RawTree } from 'web-tree-sitter';
import { FormatterError } from '../errors.js';
import { Node } from './node.js';

let languagePromise: Promise<Language> | undefined;

async function language(): Promise<Language> {
  languagePromise ??= (async () => {
    await Parser.init();
    // The grammar package's JS helper uses the old tree-sitter default export.
    // Load its bundled grammar with the pinned runtime's current named API.
    const entry = import.meta.resolve('web-tree-sitter-sfapex');
    const bytes = await readFile(new URL('./tree-sitter-apex.wasm', entry));
    return Language.load(bytes);
  })();
  try {
    return await languagePromise;
  } catch (error) {
    languagePromise = undefined;
    throw new FormatterError('PARSER_INIT_ERROR', `Unable to initialize the Apex parser: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

export class Tree {
  public readonly root: Node;
  private deleted = false;

  public constructor(private readonly raw: RawTree, private readonly parser: Parser, source: string) {
    this.root = new Node(raw.rootNode, source);
  }

  public delete(): void {
    if (this.deleted) return;
    this.raw.delete();
    this.parser.delete();
    this.deleted = true;
  }
}

/** Each parse owns its tree/parser; only the immutable WASM language is shared. */
export async function parseSource(source: string): Promise<Tree> {
  const apexLanguage = await language();
  const parser = new Parser();
  try {
    parser.setLanguage(apexLanguage);
    const raw = parser.parse(source);
    if (!raw) throw new FormatterError('PARSE_ERROR', 'The Apex parser returned no syntax tree.');
    return new Tree(raw, parser, source);
  } catch (error) {
    parser.delete();
    throw error;
  }
}
