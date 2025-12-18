import Image from "next/image";
import remarkGfm from "remark-gfm";
import { Streamdown } from "streamdown";

interface ToolOutputItemProps {
  item: unknown;
  index: number;
}

function ToolOutputItem({ item, index }: ToolOutputItemProps) {
  if (!item || typeof item !== "object" || !("type" in item)) {
    return null;
  }

  const typedItem = item as {
    type: string;
    text?: string;
    url?: string;
    mimeType?: string;
    data?: string;
    alt?: string;
  };

  if (typedItem.type === "text") {
    const textKey = `text-${typedItem.text?.slice(0, 20) || index}`;
    return (
      <div key={textKey} className="bg-background rounded border p-2 text-sm">
        <Streamdown isAnimating={false} remarkPlugins={[remarkGfm]}>
          {String(typedItem.text || "")}
        </Streamdown>
      </div>
    );
  }

  if (typedItem.type === "image") {
    const imageSrc = typedItem.url
      ? typedItem.url
      : `data:${typedItem.mimeType || "image/png"};base64,${
          typedItem.data || ""
        }`;
    const imageKey = `image-${
      typedItem.url?.slice(-20) || typedItem.data?.slice(0, 20) || index
    }`;
    return (
      <div key={imageKey} className="bg-background rounded border p-2">
        <div className="text-muted-foreground mb-2 text-xs">
          Generated Image:
        </div>
        <Image
          src={imageSrc}
          alt={typedItem.alt || "Tool generated image"}
          className="h-auto max-w-full rounded border"
          width={512}
          height={512}
          unoptimized
        />
      </div>
    );
  }

  // Other types - show as JSON
  const otherKey = `other-${typedItem.type}-${index}`;
  return (
    <div key={otherKey} className="bg-background rounded border p-2 text-xs">
      <div className="text-muted-foreground mb-1">
        Type: {String(typedItem.type)}
      </div>
      <pre className="whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
    </div>
  );
}

interface ToolOutputContentProps {
  output: unknown;
}

export function ToolOutputContent({ output }: ToolOutputContentProps) {
  // Handle MCP server response format with content array
  if (
    output &&
    typeof output === "object" &&
    "content" in output &&
    Array.isArray((output as { content: unknown[] }).content)
  ) {
    const content = (output as { content: unknown[] }).content;
    return (
      <div className="space-y-3">
        {content.map((item, idx) => {
          const itemKey =
            item && typeof item === "object" && "type" in item
              ? `${(item as { type: string }).type}-${
                  "text" in item
                    ? String((item as { text?: string }).text).slice(0, 20)
                    : "url" in item
                      ? String((item as { url?: string }).url).slice(-20)
                      : idx
                }`
              : `item-${idx}`;
          return <ToolOutputItem key={itemKey} item={item} index={idx} />;
        })}
      </div>
    );
  }

  // Fallback to JSON display
  return (
    <pre className="bg-background max-h-60 overflow-x-auto rounded border p-2 text-xs">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}
