import type { MessagePart } from "./helpers";

interface FilePartProps {
  part: MessagePart;
}

export function FilePart({ part }: FilePartProps) {
  return (
    <div className="bg-muted/50 my-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">
          File: {"name" in part ? String(part.name) : "Unknown"}
        </div>
        {("url" in part || "data" in part) && (
          <a
            href={
              "url" in part
                ? String(part.url)
                : `data:application/octet-stream;base64,${String(
                    (part as Record<string, unknown>).data || "",
                  )}`
            }
            download={"name" in part ? String(part.name) : "file"}
            className="text-primary text-sm hover:underline"
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
}
