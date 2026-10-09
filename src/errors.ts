export class FormatterError extends Error {
  public constructor(public readonly code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FormatterError';
  }
}

export function errorInfo(error: unknown, fallback = 'FORMAT_ERROR'): { code: string; message: string } {
  return {
    code: error instanceof FormatterError ? error.code : fallback,
    message: error instanceof Error ? error.message : String(error),
  };
}
