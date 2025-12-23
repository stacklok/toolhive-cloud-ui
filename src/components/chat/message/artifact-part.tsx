"use client";

import {
  type Artifact,
  ArtifactRenderer,
  isArtifact,
} from "@/features/artifacts";

interface ArtifactPartProps {
  artifact: Artifact;
  onClose?: () => void;
}

/**
 * Renders an artifact inline in a chat message.
 */
export function ArtifactPart({ artifact, onClose }: ArtifactPartProps) {
  return (
    <div className="my-4">
      <ArtifactRenderer artifact={artifact} onClose={onClose} />
    </div>
  );
}

/**
 * Extracts artifact from a tool output if present.
 * Returns the artifact if found, null otherwise.
 */
export function extractArtifactFromOutput(output: unknown): Artifact | null {
  // DEBUG: Log what we receive
  console.log("[extractArtifactFromOutput] Received output:", output);

  if (!output) return null;

  // Check if output is directly an artifact
  if (isArtifact(output)) {
    console.log("[extractArtifactFromOutput] Output is directly an artifact");
    return output;
  }

  // Check if output contains an artifact field
  if (typeof output === "object" && output !== null && "artifact" in output) {
    const maybeArtifact = (output as { artifact: unknown }).artifact;
    console.log("[extractArtifactFromOutput] Found artifact field:", maybeArtifact);
    if (isArtifact(maybeArtifact)) {
      console.log("[extractArtifactFromOutput] Artifact is valid!");
      return maybeArtifact;
    }
    console.log("[extractArtifactFromOutput] Artifact field is NOT a valid artifact");
  }

  // Check if output is a string that might be JSON containing an artifact
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output);
      if (isArtifact(parsed)) {
        return parsed;
      }
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "artifact" in parsed
      ) {
        const maybeArtifact = parsed.artifact;
        if (isArtifact(maybeArtifact)) {
          return maybeArtifact;
        }
      }
    } catch {
      // Not valid JSON, ignore
    }
  }

  return null;
}
