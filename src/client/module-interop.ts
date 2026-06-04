export function getDefaultExport<T = unknown>(module: unknown): T {
  let value = module as { default?: unknown };

  while (
    value &&
    typeof value === 'object' &&
    'default' in value &&
    value.default
  ) {
    value = value.default as { default?: unknown };
  }

  return value as T;
}
