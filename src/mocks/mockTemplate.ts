/**
 * Renders a TypeScript module for a generated mock fixture.
 * When a response type name is provided, includes a type import
 * from '@api/types.gen' and a `satisfies` clause for type safety.
 */
export function buildMockModule(payload: unknown, opType?: string): string {
  const typeName = opType?.trim();
  const typeImport = typeName
    ? `import type { ${typeName} } from '@api/types.gen'\n\n`
    : "";
  const typeSatisfies = typeName ? ` satisfies ${typeName}` : "";
  return `${typeImport}export default ${JSON.stringify(payload, null, 2)}${typeSatisfies}\n`;
}
