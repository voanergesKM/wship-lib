"use client";

import { can } from "@/lib/permissions/catalog";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGuitarVoicings, notePitch } from "@/utils/guitarChords";
import { ChordAudioButton } from "./ChordAudioButton";
import { ChordDiagram } from "./ChordDiagram";
import { useChordCatalog } from "@/hooks/useChordCatalog";
import { useAuth } from "@/components/providers/AuthContext";
import {
  VoicingEditorDialog,
  type EditorMode,
} from "@/chords/_components/VoicingEditorDialog";

export function ChordVoicingViewer({
  chord,
  capoFret = 0,
  editable = false,
}: {
  chord: string;
  capoFret?: number;
  editable?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const catalog = useChordCatalog();
  const { user } = useAuth();
  const [editor, setEditor] = useState<EditorMode | null>(null);
  const voicings = catalog.data ? getGuitarVoicings(chord, catalog.data) : [];
  const currentIndex = Math.min(index, Math.max(0, voicings.length - 1));
  const voicing = voicings[currentIndex];
  const template = catalog.data?.voicings.find(
    (entry) => entry._id === voicing?.templateId,
  );
  const definition = catalog.data?.chords.find(
    (entry) =>
      entry._id === template?.chordId ||
      `${chord.match(/^[A-G][#b]?/)?.[0]}${entry.quality}` === chord,
  );
  if (catalog.isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Завантаження аплікатур…
      </p>
    );
  if (catalog.error)
    return (
      <div role="alert">
        <p className="text-sm">Не вдалося завантажити аплікатури.</p>
        <Button variant="outline" onClick={() => catalog.refetch()}>
          Повторити
        </Button>
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      <div className="font-semibold text-center">{chord}</div>
      <p className="text-xs text-muted-foreground text-center">
        Гітара · E A D G B E
      </p>
      {voicing ? (
        <>
          <ChordDiagram voicing={voicing} name={chord} />
          <ChordAudioButton
            frets={voicing.frets}
            name={chord}
            capoFret={capoFret}
          />
          {!!voicing.omittedIntervals?.length && (
            <p className="text-xs text-muted-foreground text-center">
              Пропущені інтервали: {voicing.omittedIntervals?.join(", ")}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Попередня аплікатура"
              disabled={currentIndex === 0}
              onClick={() => setIndex(currentIndex - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="text-xs" aria-live="polite">
              Варіант {currentIndex + 1} / {voicings.length}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Наступна аплікатура"
              disabled={currentIndex === voicings.length - 1}
              onClick={() => setIndex(currentIndex + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            × — не грати · ○ — відкрита струна. Цифри в точках — пальці, якщо їх
            зазначено. Лінія між точками — баре.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Для цього акорду аплікатури ще немає. Спробуйте інше позначення.
          Каталог підтримує базові, джазові, sus, add9 та поширені акорди з
          басом через /, але не всі їхні комбінації.
        </p>
      )}
      {editable && user && definition && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setEditor({
                kind: "add-voicing",
                definition,
                root: notePitch(chord.match(/^[A-G][#b]?/)?.[0] ?? "C") ?? 0,
              })
            }
          >
            Додати варіант
          </Button>
          {template && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setEditor({ kind: "edit-voicing", definition, template })
              }
            >
              {can(user, "chords.manage")
                ? "Редагувати"
                : "Запропонувати зміну"}
            </Button>
          )}
        </div>
      )}
      {editor && (
        <VoicingEditorDialog mode={editor} onClose={() => setEditor(null)} />
      )}
      {capoFret > 0 && (
        <p className="text-xs text-muted-foreground">
          Каподастр: {capoFret}-й лад. Усі лади на схемі рахуються від
          каподастра; ○ — струна, затиснута лише ним.
        </p>
      )}
    </div>
  );
}
