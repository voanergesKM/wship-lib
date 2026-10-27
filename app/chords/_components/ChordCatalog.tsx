"use client";

import { can } from "@/lib/permissions/catalog";

import { useState } from "react";
import { ChordVoicingViewer } from "@/components/chords/ChordVoicingViewer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useChordCatalog } from "@/hooks/useChordCatalog";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/shared/LoginDialog";
import { ChordFormatGuideDialog } from "./ChordFormatGuideDialog";
import { VoicingEditorDialog } from "./VoicingEditorDialog";
import { ChordProposalsPanel } from "./ChordProposalsPanel";

const ROOTS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
];
const CATEGORIES = [
  { value: "all", label: "Усі акорди" },
  { value: "jazz", label: "Джазові" },
  { value: "basic", label: "Базові" },
  { value: "suspended", label: "Sus та add" },
];

export function ChordCatalog() {
  const [root, setRoot] = useState("C");
  const [category, setCategory] = useState("jazz");
  const catalog = useChordCatalog();
  const { user, refreshUser } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const entries = (catalog.data?.chords ?? []).filter(
    (entry) => category === "all" || entry.category === category,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <ChordFormatGuideDialog />
        {user ? (
          <Button onClick={() => setIsEditorOpen(true)}>
            {can(user, "chords.manage")
              ? "Додати новий тип"
              : "Запропонувати новий тип"}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
            Увійти, щоб запропонувати зміни
          </Button>
        )}
      </div>
      {isLoginOpen && (
        <LoginDialog
          open
          onOpenChange={setIsLoginOpen}
          description="Увійдіть, щоб додавати та редагувати аплікатури через пропозиції."
          onAuth={async () => {
            setIsLoginOpen(false);
            await refreshUser();
          }}
        />
      )}
      {isEditorOpen && (
        <VoicingEditorDialog
          mode={{ kind: "add-chord" }}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
      {user && (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-medium">
            {can(user, "chords.proposals.review")
              ? "Розгляд пропозицій"
              : "Мої пропозиції"}
          </summary>
          <div className="mt-4">
            <ChordProposalsPanel />
          </div>
        </details>
      )}
      {catalog.isPending && <p role="status">Завантаження каталогу…</p>}
      {catalog.error && (
        <div role="alert">
          <p>{catalog.error.message}</p>
          <Button variant="outline" onClick={() => catalog.refetch()}>
            Повторити
          </Button>
        </div>
      )}
      {catalog.data?.chords.length === 0 && (
        <p className="text-muted-foreground">
          Каталог поки порожній. Адміністратор має імпортувати початкові
          аплікатури.
        </p>
      )}
      <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="chord-root">Тоніка</FieldLabel>
          <Select value={root} onValueChange={setRoot}>
            <SelectTrigger id="chord-root" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ROOTS.map((note) => (
                  <SelectItem key={note} value={note}>
                    {note}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="chord-category">Типи акордів</FieldLabel>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="chord-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <p className="text-sm text-muted-foreground" role="status">
        Акордів: {entries.length}. Перемикайте варіанти під схемою, щоб знайти
        зручну позицію.
      </p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Аплікатури акордів із тонікою {root}
          </caption>
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="p-3 sm:p-4">
                Акорд
              </th>
              <th scope="col" className="p-3 sm:p-4">
                Аплікатура
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const chord = `${root}${entry.quality}`;
              return (
                <tr key={chord} className="border-t">
                  <th scope="row" className="p-3 align-top sm:p-4">
                    <div className="font-mono text-lg font-semibold">
                      {chord}
                    </div>
                    <p className="mt-2 max-w-64 font-normal text-muted-foreground">
                      {entry.name}
                    </p>
                  </th>
                  <td className="w-56 p-3 sm:w-72 sm:p-4">
                    <ChordVoicingViewer chord={chord} editable />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
