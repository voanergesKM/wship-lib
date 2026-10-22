import { ChordPopover } from "@/components/chords/ChordPopover";
import { cn } from "@/lib/utils";
import { parseSong } from "@/utils/parseSong";
import { lineToWords } from "@/utils/chordWords";
import { Block } from "@/types/parse-song.types";

export type SongSheetProps = {
  content: string;
  capoFret?: number;
  fontSize: number;
  showChords?: boolean;
  chordColor?: string;
  className?: string;
  layoutMode?: "list" | "grid";
  activeSectionId?: string | null;
};

export function SongSheet({
  content,
  capoFret = 0,
  fontSize,
  showChords = true,
  chordColor = "#22c55e",
  className,
  layoutMode = "list",
  activeSectionId = null,
}: SongSheetProps) {
  const blocks = parseSong(content);
  const hasSections = blocks.some((b) => b.type === "section");
  const isGrid = layoutMode === "grid" && hasSections;

  const renderSingleBlock = (block: Block, index: number) => {
    if (block.type === "empty") {
      return <div key={index} className="h-4" />;
    }

    if (block.type === "heading") {
      const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";

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

    if (block.type === "lyrics") {
      const hasChords = showChords && block.parts.some((p) => Boolean(p.chord));

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
                      {syl.chord ? (
                        <ChordPopover chord={syl.chord} capoFret={capoFret} />
                      ) : (
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
    }

    if (block.type === "section") {
      const isActive =
        activeSectionId &&
        activeSectionId.toLowerCase() === block.id.toLowerCase();

      return (
        <div
          key={index}
          id={`section-${encodeURIComponent(block.id)}`}
          data-section-id={block.id}
          className={cn(
            "song-section rounded-xl border bg-card/60 transition-all duration-300",
            isGrid ? "p-2 md:p-3 lg:p-4 shadow-xs" : "p-4 my-3",
            isActive &&
              "ring-1 ring-primary border-primary bg-primary/10 shadow-lg",
          )}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b">
            <span
              className={cn(
                "font-semibold text-xs tracking-wider uppercase px-2 py-0.5 rounded-full transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {block.id}
            </span>
          </div>

          <div className="space-y-1">
            {block.blocks.map((childBlock, cIdx) =>
              renderSingleBlock(childBlock, cIdx),
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn("overflow-auto", className)} style={{ fontSize }}>
      <div
        className={cn(
          isGrid
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 items-start"
            : "space-y-1",
        )}
      >
        {blocks.map((block, index) => renderSingleBlock(block, index))}
      </div>
    </div>
  );
}
