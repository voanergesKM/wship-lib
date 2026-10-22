"use client";

import { useState } from "react";
import { ChordVoicingViewer } from "@/components/chords/ChordVoicingViewer";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { CHORD_CATALOG } from "./catalog";

const ROOTS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
const CATEGORIES = [
  { value: "all", label: "Усі акорди" },
  { value: "jazz", label: "Джазові" },
  { value: "basic", label: "Базові" },
  { value: "suspended", label: "Sus та add" },
];

export function ChordCatalog() {
  const [root, setRoot] = useState("C");
  const [category, setCategory] = useState("jazz");
  const entries = CHORD_CATALOG.filter((entry) => category === "all" || entry.category === category);

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="chord-root">Тоніка</FieldLabel>
          <Select value={root} onValueChange={setRoot}>
            <SelectTrigger id="chord-root" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              {ROOTS.map((note) => <SelectItem key={note} value={note}>{note}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="chord-category">Типи акордів</FieldLabel>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="chord-category" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              {CATEGORIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectGroup></SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <p className="text-sm text-muted-foreground" role="status">Акордів: {entries.length}. Перемикайте варіанти під схемою, щоб знайти зручну позицію.</p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Аплікатури акордів із тонікою {root}</caption>
          <thead className="bg-muted">
            <tr><th scope="col" className="p-3 sm:p-4">Акорд</th><th scope="col" className="p-3 sm:p-4">Аплікатура</th></tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const chord = `${root}${entry.quality}`;
              return (
                <tr key={chord} className="border-t">
                  <th scope="row" className="p-3 align-top sm:p-4">
                    <div className="font-mono text-lg font-semibold">{chord}</div>
                    <p className="mt-2 max-w-64 font-normal text-muted-foreground">{entry.name}</p>
                  </th>
                  <td className="w-56 p-3 sm:w-72 sm:p-4">
                    <ChordVoicingViewer chord={chord} />
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
