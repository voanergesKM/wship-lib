import { cn } from "@/lib/utils";
import { parseSong } from "@/utils/parseSong";
import { lineToWords } from "@/utils/chordWords";

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
      <div className="space-y-1">
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
                  "whitespace-pre pt-2 pb-1",
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

          const hasChords =
            showChords && block.parts.some((p) => Boolean(p.chord));

          if (!hasChords) {
            return (
              <div
                key={index}
                style={{
                  textAlign: block.align,
                }}
                className="font-mono whitespace-pre-wrap leading-normal"
              >
                {block.parts.map((part) => part.lyric).join("")}
              </div>
            );
          }

          const words = lineToWords(block.parts);

          return (
            <div
              key={index}
              style={{
                textAlign: block.align,
              }}
              className="font-mono leading-normal"
            >
              {words.map((word, wIdx) => (
                <span key={wIdx} className="inline-block align-top">
                  <span className="inline-flex">
                    {word.syllables.map((syl, sIdx) => (
                      <span key={sIdx} className="inline-flex flex-col">
                        <span
                          style={{ color: chordColor }}
                          className="font-bold whitespace-pre text-[0.85em] leading-tight min-h-[1.25em]"
                        >
                          {syl.chord || (
                            <span className="invisible select-none">&#8203;</span>
                          )}
                        </span>
                        <span className="whitespace-pre">
                          {syl.text ||
                            (syl.chord ? (
                              <span className="invisible select-none">
                                {" ".repeat(syl.chord.length)}
                              </span>
                            ) : (
                              ""
                            ))}
                        </span>
                      </span>
                    ))}
                  </span>
                  {word.trailingSpaces && (
                    <span className="whitespace-pre">{word.trailingSpaces}</span>
                  )}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
