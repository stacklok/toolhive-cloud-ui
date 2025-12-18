import Image from "next/image";
import type { MessagePart } from "./helpers";

interface ImagePartProps {
  part: MessagePart;
}

export function ImagePart({ part }: ImagePartProps) {
  const typedPart = part as Record<string, unknown>;
  const alt = "alt" in typedPart ? String(typedPart.alt) : "Generated image";
  const mimeType =
    "mimeType" in typedPart ? String(typedPart.mimeType) : "image/png";
  const data = "data" in typedPart ? String(typedPart.data) : "";

  if (!data) return null;

  return (
    <div className="my-3">
      <div className="bg-card rounded-lg border p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-foreground text-sm font-medium">{alt}</span>
        </div>
        <Image
          src={`data:${mimeType};base64,${data}`}
          alt={alt}
          width={512}
          height={512}
          className="h-auto max-w-full rounded-lg border"
          unoptimized
        />
      </div>
    </div>
  );
}
