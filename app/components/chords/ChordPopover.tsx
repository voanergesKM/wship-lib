"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChordVoicingViewer } from "./ChordVoicingViewer";

export function ChordPopover({ chord, capoFret = 0 }: { chord: string; capoFret?: number }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer rounded-sm underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring" aria-label={`Аплікатура ${chord}`}>
          {chord}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-w-[calc(100vw-2rem)]" aria-label={`Гітарний акорд ${chord}`}>
        <ChordVoicingViewer key={`${chord}:${capoFret}`} chord={chord} capoFret={capoFret} />
      </PopoverContent>
    </Popover>
  );
}
