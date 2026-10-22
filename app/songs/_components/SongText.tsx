"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Maximize2, Rows } from "lucide-react";

import { Button } from "@/components/ui/button";
import { transposeContent } from "@/utils/chordTransposition";
import { SongControls, SongPreview } from "./SongPreview";
import { SongSheet } from "./SongSheet";
import { useSongDisplayPreferences } from "@/hooks/useSongDisplayPreferences";

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
  const { songDisplayPreferences, updateSongDisplayPreferences } =
    useSongDisplayPreferences();
  const { fontSize, showChords } = songDisplayPreferences;
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
    updateSongDisplayPreferences({ showChords: !showChords });
  };

  const handleFontSizeUp = () => {
    updateSongDisplayPreferences({ fontSize: Math.min(24, fontSize + 2) });
  };

  const handleFontSizeDown = () => {
    updateSongDisplayPreferences({ fontSize: Math.max(10, fontSize - 2) });
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
    <section className="space-y-2 md:space-y-3 lg:space-y-4 rounded-lg border bg-card p-2 sm:p-4 md:p-6">
      <div className="flex items-center justify-between gap-4 border-b pb-2 flex-wrap">
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
