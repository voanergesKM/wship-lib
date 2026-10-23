"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChordDiagram } from "@/components/chords/ChordDiagram";
import { ChordAudioButton } from "@/components/chords/ChordAudioButton";
import { useChordCatalog } from "@/hooks/useChordCatalog";
import { parseSong } from "@/utils/parseSong";
import { suggestCapos } from "@/utils/capoSuggestions";
import { transposeChord } from "@/utils/chordTransposition";
import type { Block } from "@/types/parse-song.types";

interface Props {
  content: string;
  transpose: number;
  capo: number;
  songKey?: string;
  onApply: (capo: number) => void;
}

export function CapoSuggestions(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Зручні акорди
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Підібрати зручні акорди</DialogTitle>
          <DialogDescription>
            Порівнюємо аплікатури всіх акордів. Змінюється каподастр і форми для
            гри; поточна тональність звучання зберігається.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <Suggestions
            {...props}
            onApply={(capo) => {
              props.onApply(capo);
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Suggestions({ content, transpose, capo, songKey, onApply }: Props) {
  const catalog = useChordCatalog();
  const chords = useMemo(() => {
    const result: string[] = [];
    const visit = (blocks: Block[]) =>
      blocks.forEach((block) => {
        if (block.type === "section") visit(block.blocks);
        if (block.type === "lyrics")
          block.parts.forEach((part) => {
            if (part.chord) result.push(part.chord);
          });
      });
    visit(parseSong(content));
    return result;
  }, [content]);
  const result = useMemo(
    () =>
      catalog.data ? suggestCapos(chords, transpose, capo, catalog.data) : null,
    [catalog.data, chords, transpose, capo],
  );
  if (catalog.isPending) return <p role="status">Завантаження аплікатур…</p>;
  if (catalog.error)
    return (
      <div role="alert">
        <p>Не вдалося завантажити каталог.</p>
        <Button variant="outline" onClick={() => catalog.refetch()}>
          Повторити
        </Button>
      </div>
    );
  if (!result || !chords.length)
    return <p>У тексті немає акордів для підбору.</p>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        Зараз: каподастр {capo === 0 ? "відсутній" : `на ${capo}-му ладу`}.
        Транспозиція: {transpose > 0 ? "+" : ""}
        {transpose} півтонів.
        {songKey
          ? ` Тональність звучання: ${transposeChord(songKey, transpose)}.`
          : ""}
      </p>
      <p className="text-sm">
        Форми зараз:{" "}
        {result.current.chords
          .map((chord) => chord.name)
          .concat(result.current.unsupported)
          .join(" · ")}
      </p>
      {result.current.unsupported.length > 0 ? (
        <p role="status">
          Недостатньо повних аплікатур у каталозі для:{" "}
          {result.current.unsupported.join(", ")}. Надійно порівняти складність
          усієї пісні поки неможливо.
        </p>
      ) : !result.options.length ? (
        <p role="status">
          Поточний варіант уже серед найзручніших за нашою оцінкою. Простіших
          варіантів у межах 0–12 ладів не знайдено.
        </p>
      ) : (
        result.options.map((option) => (
          <section
            key={option.capo}
            className="flex flex-col gap-3 rounded-lg border p-3"
          >
            <h3 className="font-semibold">
              {option.capo === 0
                ? "Без каподастра"
                : `Каподастр: ${option.capo}-й лад`}
            </h3>
            <p className="font-medium">
              {option.chords.map((chord) => chord.name).join(" · ")}
            </p>
            <p className="text-sm text-muted-foreground">
              Відкриті форми: {option.openShapes} із {option.chords.length}.
              Звучання в тій самій тональності.
            </p>
            <details>
              <summary className="cursor-pointer text-sm">
                Аплікатури та звук
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {option.chords.map(({ name, voicing }) => (
                  <div key={name} className="min-w-0">
                    <p className="text-center font-medium">{name}</p>
                    <ChordDiagram name={name} voicing={voicing} />
                    <ChordAudioButton
                      name={name}
                      frets={voicing.frets}
                      capoFret={option.capo}
                    />
                  </div>
                ))}
              </div>
            </details>
            <Button type="button" onClick={() => onApply(option.capo)}>
              Застосувати
            </Button>
          </section>
        ))
      )}
      <p className="text-xs text-muted-foreground">
        Оцінка приблизна: враховує баре, розтяжку, затиснуті струни й висоту
        позиції. Зручність переходів залежить від вашої техніки. Високі
        положення каподастра змінюють тембр і регістр гітари.
      </p>
    </div>
  );
}
