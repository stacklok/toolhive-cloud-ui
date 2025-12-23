"use client";

import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import type {
  Artifact,
  VMCPBuilderArtifact as VMCPBuilderArtifactType,
} from "../types";

// Lazy load artifact components to reduce initial bundle size
const VMCPBuilderArtifact = lazy(() =>
  import("./vmcp-builder-artifact").then((m) => ({
    default: m.VMCPBuilderArtifact,
  })),
);

interface ArtifactRendererProps {
  artifact: Artifact;
  onClose?: () => void;
}

/**
 * Renders the appropriate artifact component based on the artifact type.
 * Handles lazy loading and fallback states.
 */
export function ArtifactRenderer({ artifact, onClose }: ArtifactRendererProps) {
  return (
    <Suspense fallback={<ArtifactLoadingFallback />}>
      <ArtifactContent artifact={artifact} onClose={onClose} />
    </Suspense>
  );
}

function ArtifactContent({ artifact, onClose }: ArtifactRendererProps) {
  switch (artifact.type) {
    case "vmcp-builder":
      return (
        <VMCPBuilderArtifact
          artifact={artifact as VMCPBuilderArtifactType}
          onClose={onClose}
        />
      );

    case "code":
      // TODO: Implement CodeArtifact component
      return (
        <div className="p-4 border rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">
            Code artifact rendering not yet implemented
          </p>
        </div>
      );

    case "yaml-preview":
      // TODO: Implement YAMLPreviewArtifact component
      return (
        <div className="p-4 border rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">
            YAML preview artifact rendering not yet implemented
          </p>
        </div>
      );

    default:
      return (
        <div className="p-4 border rounded-lg bg-destructive/10">
          <p className="text-sm text-destructive">
            Unknown artifact type: {(artifact as Artifact).type}
          </p>
        </div>
      );
  }
}

function ArtifactLoadingFallback() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border bg-card">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
