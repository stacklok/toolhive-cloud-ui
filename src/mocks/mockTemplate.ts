/**
 * Renders a TypeScript module for a generated mock fixture.
 * If a response type name is provided and your project exposes
 * OpenAPI types under the "@api/types.gen" alias, you can set
 * `USE_TYPES_FOR_FIXTURES = true` in mocker.ts to include a
 * type-only import and a `satisfies` clause to enforce types.
 */
export function buildMockModule(
  payload: unknown,
  options?: { opType?: string; useTypes?: boolean },
): string {
  const opType = options?.opType?.trim();
  const useTypes = Boolean(options?.useTypes && opType);
  const typeImport = useTypes
    ? `import type { ${opType} } from '@api/types.gen'\n\n`
    : "";
  const typeSatisfies = useTypes ? ` satisfies ${opType}` : "";
  return `${typeImport}export default ${JSON.stringify(payload, null, 2)}${typeSatisfies}\n`;
}
