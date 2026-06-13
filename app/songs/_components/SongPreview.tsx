import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { parseSong } from "@/utils/parseSong";
import { transposeContent } from "@/utils/chordTransposition";
import { EyeIcon, ImageMinus, ImagePlus, ListFilter, ArrowUp, ArrowDown } from "lucide-react";
import { ReactNode, useState, useMemo } from "react";

type Props = {
  content: string;
  chordColor?: string;
  dialogTrigger?: ReactNode;
};

export function SongPreview({
  content,
  chordColor = "#22c55e",
  dialogTrigger,
}: Props) {
  const [showChords, setShowChords] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [transposeSemitones, setTransposeSemitones] = useState(0);

  const transposedContent = useMemo(() => {
    return transposeSemitones === 0 ? content : transposeContent(content, transposeSemitones);
  }, [content, transposeSemitones]);

  const blocks = parseSong(transposedContent);

  const handleToggleChords = () => {
    setShowChords((prev) => !prev);
  };

  const handleFontSizeUp = () => {
    setFontSize((prev) => prev + 2);
  };

  const handleFontSizeDown = () => {
    setFontSize((prev) => prev - 2);
  };

  const handleTransposeUp = () => {
    setTransposeSemitones((prev) => prev + 1);
  };

  const handleTransposeDown = () => {
    setTransposeSemitones((prev) => prev - 1);
  };

  const handleResetTranspose = () => {
    setTransposeSemitones(0);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {dialogTrigger || (
          <Button size="icon">
            <EyeIcon />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl w-full md:w-fit">
        <DialogHeader>
          <Controls
            onToggleChords={handleToggleChords}
            onFontSizeUp={handleFontSizeUp}
            onFontSizeDown={handleFontSizeDown}
            onTransposeUp={handleTransposeUp}
            onTransposeDown={handleTransposeDown}
            onResetTranspose={handleResetTranspose}
            transposeSemitones={transposeSemitones}
          />
          <DialogTitle hidden>Перегляд пісні</DialogTitle>
          <DialogDescription hidden>Перегляд пісні</DialogDescription>
        </DialogHeader>

        <div
          className="max-h-[85dvh] max-w-2xl overflow-auto mx-auto"
          style={{ fontSize }}
        >
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

                  <div className="whitespace-pre-wrap ">
                    {block.parts.map((part) => part.lyric).join("")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Controls({
  onToggleChords,
  onFontSizeUp,
  onFontSizeDown,
  onTransposeUp,
  onTransposeDown,
  onResetTranspose,
  transposeSemitones,
}: {
  onToggleChords: () => void;
  onFontSizeUp: () => void;
  onFontSizeDown: () => void;
  onTransposeUp: () => void;
  onTransposeDown: () => void;
  onResetTranspose: () => void;
  transposeSemitones: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <Button size={"icon-xs"} onClick={onToggleChords}>
        <ListFilter />
      </Button>

      <Button size={"icon-xs"} onClick={onFontSizeUp}>
        <ImagePlus />
      </Button>
      <Button size={"icon-xs"} onClick={onFontSizeDown}>
        <ImageMinus />
      </Button>

      <div className="flex items-center gap-2 border-l pl-4">
        <Button size={"icon-xs"} onClick={onTransposeDown}>
          <ArrowDown />
        </Button>
        <span className="text-sm font-mono w-8 text-center">
          {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones}
        </span>
        <Button size={"icon-xs"} onClick={onTransposeUp}>
          <ArrowUp />
        </Button>
        {transposeSemitones !== 0 && (
          <Button size={"icon-xs"} variant="ghost" onClick={onResetTranspose}>
            ×
          </Button>
        )}
      </div>
    </div>
  );
}
