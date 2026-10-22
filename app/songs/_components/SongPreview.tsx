import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { SongSheet } from "./SongSheet";

type Props = {
  defaultCapoFret?: number;
  content: string;
  chordColor?: string;
  dialogTrigger?: ReactNode;
};

export function SongPreview({
  defaultCapoFret = 0,
  content,
  chordColor = "#22c55e",
  dialogTrigger,
}: Props) {
  const [showChords, setShowChords] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  const [capoFret, setCapoFret] = useState(defaultCapoFret);

  const transposedContent = useMemo(() => {
    const effectiveTranspose = transposeSemitones - capoFret;
    return effectiveTranspose === 0
      ? content
      : transposeContent(content, effectiveTranspose);
  }, [content, transposeSemitones, capoFret]);

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
          <SongControls
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

        <SongSheet
          capoFret={capoFret}
          content={transposedContent}
          fontSize={fontSize}
          showChords={showChords}
          chordColor={chordColor}
          className="max-h-[85dvh] max-w-2xl mx-auto"
        />
      </DialogContent>
    </Dialog>
  );
}

export type SongControlsProps = {
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
  extraActions?: ReactNode;
};

export function SongControls({
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
  extraActions,
}: SongControlsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
      <Button
        size="icon-xs"
        variant="outline"
        onClick={onToggleChords}
        title="Показати/приховати акорди"
      >
        <ListFilter />
      </Button>

      <Button
        size="icon-xs"
        variant="outline"
        onClick={onFontSizeUp}
        title="Збільшити шрифт"
      >
        <ImagePlus />
      </Button>
      <Button
        size="icon-xs"
        variant="outline"
        onClick={onFontSizeDown}
        title="Зменшити шрифт"
      >
        <ImageMinus />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon-xs"
            variant="outline"
            title="Налаштування тональності та каподастра"
          >
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
                      size="icon-xs"
                      variant="ghost"
                      onClick={onResetTranspose}
                    >
                      ×
                    </Button>
                  )}
                  <Button
                    size="icon-xs"
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
                    size="icon-xs"
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
                      size="icon-xs"
                      variant="ghost"
                      onClick={onResetCapo}
                    >
                      ×
                    </Button>
                  )}
                  <Button
                    size="icon-xs"
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
                    size="icon-xs"
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

      {extraActions}
    </div>
  );
}
