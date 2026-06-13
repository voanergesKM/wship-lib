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
import {
  EyeIcon,
  ImageMinus,
  ImagePlus,
  ListFilter,
  ArrowUp,
  ArrowDown,
  Settings2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [capoFret, setCapoFret] = useState(0);

  const transposedContent = useMemo(() => {
    const effectiveTranspose = transposeSemitones - capoFret;
    return effectiveTranspose === 0
      ? content
      : transposeContent(content, effectiveTranspose);
  }, [content, transposeSemitones, capoFret]);

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

  const handleCapoUp = () => {
    setCapoFret((prev) => Math.min(12, prev + 1));
  };

  const handleCapoDown = () => {
    setCapoFret((prev) => Math.max(0, prev - 1));
  };

  const handleResetCapo = () => {
    setCapoFret(0);
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
            onCapoUp={handleCapoUp}
            onCapoDown={handleCapoDown}
            onResetCapo={handleResetCapo}
            capoFret={capoFret}
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
  onCapoUp,
  onCapoDown,
  onResetCapo,
  capoFret,
}: {
  onToggleChords: () => void;
  onFontSizeUp: () => void;
  onFontSizeDown: () => void;
  onTransposeUp: () => void;
  onTransposeDown: () => void;
  onResetTranspose: () => void;
  transposeSemitones: number;
  onCapoUp: () => void;
  onCapoDown: () => void;
  onResetCapo: () => void;
  capoFret: number;
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

      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon-xs" variant="outline" className="ml-2">
            <Settings2 />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Налаштування</h4>
              <p className="text-sm text-muted-foreground">
                Тональність та каподастр
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Тональність</span>
                <div className="flex items-center gap-2">
                  {transposeSemitones !== 0 && (
                    <Button
                      size={"icon-xs"}
                      variant="ghost"
                      onClick={onResetTranspose}
                    >
                      ×
                    </Button>
                  )}
                  <Button
                    size={"icon-xs"}
                    variant="outline"
                    onClick={onTransposeDown}
                  >
                    <ArrowDown />
                  </Button>
                  <span className="text-sm font-mono w-8 text-center">
                    {transposeSemitones > 0
                      ? `+${transposeSemitones}`
                      : transposeSemitones}
                  </span>
                  <Button
                    size={"icon-xs"}
                    variant="outline"
                    onClick={onTransposeUp}
                  >
                    <ArrowUp />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Каподастр</span>
                <div className="flex items-center gap-2">
                  {capoFret !== 0 && (
                    <Button
                      size={"icon-xs"}
                      variant="ghost"
                      onClick={onResetCapo}
                    >
                      ×
                    </Button>
                  )}
                  <Button
                    size={"icon-xs"}
                    variant="outline"
                    onClick={onCapoDown}
                    disabled={capoFret <= 0}
                  >
                    -
                  </Button>
                  <span className="text-sm font-mono w-8 text-center">
                    {capoFret}
                  </span>
                  <Button
                    size={"icon-xs"}
                    variant="outline"
                    onClick={onCapoUp}
                    disabled={capoFret >= 12}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
