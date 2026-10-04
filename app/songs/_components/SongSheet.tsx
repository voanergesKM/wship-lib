import { cn } from "@/lib/utils";
import { parseSong } from "@/utils/parseSong";

type SongSheetProps = {
  content: string;
  fontSize: number;
  showChords?: boolean;
  chordColor?: string;
  className?: string;
};

export function SongSheet({
  content,
  fontSize,
  showChords = true,
  chordColor = "#22c55e",
  className,
}: SongSheetProps) {
  const blocks = parseSong(content);

  return (
    <div className={cn("overflow-auto", className)} style={{ fontSize }}>
      <div>
        {blocks.map((block, index) => {
          if (block.type === "empty") {
            return <div key={index} className="h-6" />;
          }

          if (block.type === "heading") {
            const Tag =
              block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";

            return (
              <Tag
                key={index}
                style={{
                  textAlign: block.align,
                }}
                className={cn(
                  "whitespace-pre",
                  block.level === 1
                    ? "text-lg font-bold"
                    : block.level === 2
                      ? "font-bold"
                      : "text-sm italic",
                )}
              >
                {block.text}
              </Tag>
            );
          }

          return (
            <div
              key={index}
              style={{
                textAlign: block.align,
              }}
              className="font-mono relative leading-5"
            >
              {showChords && (
                <div className="flex whitespace-pre">
                  {block.parts.map((part, i) => (
                    <span
                      key={i}
                      style={{
                        color: chordColor,
                      }}
                      className="font-bold"
                    >
                      {part.chord || ""}
                      {" ".repeat(part.lyric.length)}
                    </span>
                  ))}
                </div>
              )}

              <div className="whitespace-pre-wrap">
                {block.parts.map((part) => part.lyric).join("")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
