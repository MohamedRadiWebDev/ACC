declare module 'uuid' {
  export function v4(options?: { random?: Uint8Array; rng?: () => Uint8Array; } | string): string;
}

declare module 'papaparse' {
  export type ParseResult<T = any> = {
    data: T[];
    errors: { type: string; code: string; message: string; row?: number }[];
    meta: Record<string, unknown>;
  };

  export interface ParseConfig {
    header?: boolean;
    delimiter?: string;
    skipEmptyLines?: boolean | 'greedy';
    dynamicTyping?: boolean | Record<string, boolean>;
    complete?: (results: ParseResult) => void;
    error?: (error: Error) => void;
  }

  export interface UnparseConfig {
    quotes?: boolean | boolean[];
    quoteChar?: string;
    escapeChar?: string;
    delimiter?: string;
    header?: boolean;
    newline?: string;
  }

  export function parse<T = any>(input: string | File | Blob, config?: ParseConfig): ParseResult<T>;
  export function unparse(data: unknown, config?: UnparseConfig): string;
  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
  };
  export default Papa;
}
