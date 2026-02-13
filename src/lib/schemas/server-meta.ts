import { z } from "zod/v4";
import type { V0ServerJson } from "@/generated/types.gen";

export const toolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const transportDataSchema = z
  .object({
    metadata: z
      .object({
        kubernetes: z
          .object({
            kind: z.string(),
          })
          .passthrough(),
      })
      .passthrough()
      .optional(),
    tool_definitions: z.array(toolDefinitionSchema).optional(),
  })
  .passthrough();

export const stacklokMetaSchema = z.record(z.string(), transportDataSchema);

export type ServerTool = z.infer<typeof toolDefinitionSchema>;

export function parseStacklokMeta(server: V0ServerJson) {
  const raw =
    server._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.[
      "io.github.stacklok"
    ];
  return stacklokMetaSchema.safeParse(raw);
}
