/**
 * Renders a TypeScript module for a generated mock fixture.
 * When a response type name is provided, includes a type import
 * from '@api/types.gen' and a `satisfies` clause for type safety.
 * The fixture is wrapped in AutoAPIMock for test-scoped overrides.
 */
export function buildMockModule(payload: unknown, opType?: string): string {
  const typeName = opType?.trim();

  // Type imports first, then value imports (biome import order)
  const imports = [
    ...(typeName ? [`import type { ${typeName} } from "@api/types.gen";`] : []),
    `import { AutoAPIMock } from "@mocks";`,
  ].join("\n");

  const typeParam = typeName ? `<${typeName}>` : "";

  return `${imports}\n\nexport default AutoAPIMock${typeParam}(${JSON.stringify(payload, null, 2)})\n`;
}
