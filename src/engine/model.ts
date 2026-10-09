import type { Doc } from './doc.js';
import type { DocBuilder } from './builder.js';
import type { FormatContext } from './context.js';

/** Model names are registered once; mutable format state belongs to the context. */
export class Model {
  [key: string]: any;

  public constructor(public readonly context: FormatContext) {}

  public build(builder: DocBuilder): Doc {
    const result: Doc[] = [];
    this.build_inner(builder, result);
    return builder.concat(result);
  }

  public build_inner(_builder: DocBuilder, _result: Doc[]): void {
    throw new Error('A formatter model has no build implementation.');
  }
}

type ModelConstructor = new (context: FormatContext, ...args: any[]) => Model;
const constructors = new Map<string, ModelConstructor>();

export function register(name: string, constructor: ModelConstructor): void {
  const previous = constructors.get(name);
  if (previous && previous !== constructor) throw new Error(`Duplicate formatter model: ${name}`);
  constructors.set(name, constructor);
}

export function create(name: string, context: FormatContext, ...args: any[]): Model {
  const constructor = constructors.get(name);
  if (!constructor) throw new Error(`Unknown formatter model: ${name}`);
  return new constructor(context, ...args);
}

export function make(name: string, context: FormatContext, variant: string, value?: any): Model {
  return create(name, context, variant, value);
}
