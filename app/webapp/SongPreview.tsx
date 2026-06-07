import { parseSong } from "@/utils/parseSong";

type Props = {
  content: string;
  showChords?: boolean;
  fontSize?: number;
  chordColor?: string;
};

export function SongPreview({
  content,
  showChords = true,
  fontSize = 16,
  chordColor = "#22c55e",
}: Props) {
  const blocks = parseSong(content);

  return (
    <div className="space-y-4 rounded-xl border p-6" style={{ fontSize }}>
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
              className={`
                ${
                  block.level === 1
                    ? "text-4xl font-bold"
                    : block.level === 2
                      ? "text-3xl font-semibold"
                      : "text-2xl italic"
                }
              `}
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
            className="font-mono relative"
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
  );
}
