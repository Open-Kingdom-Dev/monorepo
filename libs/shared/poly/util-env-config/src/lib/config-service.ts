// Adapter interface for reading environment variables
export type EnvAdapter = {
  get(key: string): string | undefined;
};

// Node.js adapter - reads from process.env
export const nodeEnvAdapter: EnvAdapter = {
  get: (key) => process.env[key],
};

// Vite's import.meta.env type
interface ViteImportMeta {
  env: Record<string, string | undefined>;
}

// Browser adapter factory - pass import.meta from your Vite app
export function createBrowserEnvAdapter(
  importMeta: ViteImportMeta
): EnvAdapter {
  return {
    get: (key) => importMeta.env[key],
  };
}

// Configuration service for type-safe environment variable access
export class ConfigService<TKeys extends string = string> {
  constructor(private readonly adapter: EnvAdapter) {}

  // Get value with optional default
  get(key: TKeys): string | undefined;
  get(key: TKeys, defaultValue: string): string;
  get(key: TKeys, defaultValue?: string): string | undefined {
    return this.adapter.get(key) ?? defaultValue;
  }

  // Get value or throw if not set
  getOrThrow(key: TKeys): string {
    const value = this.adapter.get(key);

    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not set`);
    }

    return value;
  }

  // Check if variable is set
  has(key: TKeys): boolean {
    return this.adapter.get(key) !== undefined;
  }
}

// Factory to create a typed ConfigService
export function createConfigService<TKeys extends readonly string[]>(
  _keys: TKeys,
  adapter: EnvAdapter
): ConfigService<TKeys[number]> {
  return new ConfigService<TKeys[number]>(adapter);
}
