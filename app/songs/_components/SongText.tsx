"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Maximize2, Rows } from "lucide-react";

import { Button } from "@/components/ui/button";
import { transposeContent } from "@/utils/chordTransposition";
import { SongControls, SongPreview } from "./SongPreview";
import { SongSheet } from "./SongSheet";

type SongTextProps = {
  content: string;
  chordColor?: string;
  activeSectionId?: string | null;
};

export function SongText({
  content,
  chordColor = "#22c55e",
  activeSectionId = null,
}: SongTextProps) {
  const [showChords, setShowChords] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  const [capoFret, setCapoFret] = useState(0);
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");

  const hasSections = useMemo(
    () => /<section\s+(?:id|name)=/i.test(content),
    [content],
  );

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
    setFontSize((prev) => Math.max(10, prev - 2));
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
    <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b pb-4 flex-wrap">
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
          extraActions={
            <div className="flex items-center gap-2">
              {hasSections && (
                <Button
                  size="icon-xs"
                  variant={layoutMode === "grid" ? "secondary" : "outline"}
                  onClick={() =>
                    setLayoutMode((m) => (m === "list" ? "grid" : "list"))
                  }
                  title={
                    layoutMode === "grid"
                      ? "Перемкнути на звичайний список"
                      : "Перемкнути на грід-сітку (колонки)"
                  }
                >
                  {layoutMode === "grid" ? (
                    <Rows className="size-4" />
                  ) : (
                    <LayoutGrid className="size-4" />
                  )}
                </Button>
              )}

              <SongPreview
                content={transposedContent}
                chordColor={chordColor}
                dialogTrigger={
                  <Button
                    size="icon-xs"
                    variant="outline"
                    title="Відкрити у модальному вікні"
                  >
                    <Maximize2 className="size-4" />
                  </Button>
                }
              />
            </div>
          }
        />
      </div>

      <SongSheet
        content={transposedContent}
        fontSize={fontSize}
        showChords={showChords}
        chordColor={chordColor}
        layoutMode={layoutMode}
        activeSectionId={activeSectionId}
      />
    </section>
  );
}
