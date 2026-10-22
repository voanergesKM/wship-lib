"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getGuitarVoicings } from "@/utils/guitarChords";
import { ChordDiagram } from "./ChordDiagram";

export function ChordPopover({ chord, capoFret = 0 }: { chord: string; capoFret?: number }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer rounded-sm underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring" aria-label={`Аплікатура ${chord}`}>
          {chord}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-w-[calc(100vw-2rem)]" aria-label={`Гітарний акорд ${chord}`}>
        <ChordDetails key={`${chord}:${capoFret}`} chord={chord} capoFret={capoFret} />
      </PopoverContent>
    </Popover>
  );
}

function ChordDetails({ chord, capoFret }: { chord: string; capoFret: number }) {
  const [index, setIndex] = useState(0);
  const voicings = getGuitarVoicings(chord);
  const voicing = voicings[index];
  return (
    <div className="flex flex-col gap-2">
      <div className="font-semibold text-center">{chord}</div>
      <p className="text-xs text-muted-foreground text-center">Гітара · E A D G B E</p>
      {voicing ? (
        <>
          <ChordDiagram voicing={voicing} name={chord} />
          {voicing.omittedIntervals?.includes(7) && (
            <p className="text-xs text-muted-foreground text-center">Джазова форма без квінти</p>
          )}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon-sm" aria-label="Попередня аплікатура" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft /></Button>
            <span className="text-xs" aria-live="polite">Варіант {index + 1} / {voicings.length}</span>
            <Button variant="outline" size="icon-sm" aria-label="Наступна аплікатура" disabled={index === voicings.length - 1} onClick={() => setIndex(index + 1)}><ChevronRight /></Button>
          </div>
          <p className="text-xs text-muted-foreground">× — не грати · ○ — відкрита струна. Точки показують місця затискання, без нумерації пальців.</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Для цього акорду аплікатури ще немає. Спробуйте інше позначення. Каталог підтримує базові, джазові, sus, add9 та поширені акорди з басом через /, але не всі їхні комбінації.</p>
      )}
      {capoFret > 0 && <p className="text-xs text-muted-foreground">Каподастр: {capoFret}-й лад. Усі лади на схемі рахуються від каподастра; ○ — струна, затиснута лише ним.</p>}
    </div>
  );
}
