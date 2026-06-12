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
import { EyeIcon, ImageMinus, ImagePlus, ListFilter } from "lucide-react";
import { ReactNode, useState } from "react";

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
  const blocks = parseSong(content);

  const [showChords, setShowChords] = useState(true);
  const [fontSize, setFontSize] = useState(14);

  const handleToggleChords = () => {
    setShowChords((prev) => !prev);
  };

  const handleFontSizeUp = () => {
    setFontSize((prev) => prev + 2);
  };

  const handleFontSizeDown = () => {
    setFontSize((prev) => prev - 2);
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
}: {
  onToggleChords: () => void;
  onFontSizeUp: () => void;
  onFontSizeDown: () => void;
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
    </div>
  );
}
