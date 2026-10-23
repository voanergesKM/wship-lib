"use client";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOTE_NAMES } from "@/utils/guitarChords";
export interface VoicingDraft { root: string; bass: string; frets: string; fingers: string; barres: string; mode: string; omitted: string }
export function VoicingFields({ draft, onChange }: { draft: VoicingDraft; onChange: (draft: VoicingDraft) => void }) {
  const set = (key: keyof VoicingDraft, value: string) => onChange({ ...draft, [key]: value });
  return (
    <FieldGroup>
      <Field><FieldLabel htmlFor="voicing-root">Тоніка вихідної форми</FieldLabel><Select value={draft.root} onValueChange={(value) => set("root", value)}><SelectTrigger id="voicing-root"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{NOTE_NAMES.map((note, i) => <SelectItem value={String(i)} key={note}>{note}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
      <Field><FieldLabel htmlFor="voicing-bass">Окремий бас (для акордів через /)</FieldLabel><Select value={draft.bass} onValueChange={(value) => set("bass", value)}><SelectTrigger id="voicing-bass"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="none">Не задано</SelectItem>{NOTE_NAMES.map((note, i) => <SelectItem value={String(i)} key={note}>{note}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
      <Field><FieldLabel htmlFor="voicing-frets">Лади: 6 E · 5 A · 4 D · 3 G · 2 B · 1 e</FieldLabel><Input id="voicing-frets" value={draft.frets} onChange={(e) => set("frets", e.target.value)} placeholder="5 7 6 6 5 5" /><p className="text-xs text-muted-foreground">-1 — не грати · 0 — відкрита · 1–24 — лад.</p></Field>
      <Field><FieldLabel htmlFor="voicing-fingers">Пальці в тому ж порядку (0 — не вказано)</FieldLabel><Input id="voicing-fingers" value={draft.fingers} onChange={(e) => set("fingers", e.target.value)} placeholder="1 4 2 3 1 1" /></Field>
      <Field><FieldLabel htmlFor="voicing-barres">Баре: лад · від струни · до струни · палець</FieldLabel><Textarea id="voicing-barres" value={draft.barres} onChange={(e) => set("barres", e.target.value)} placeholder="5 6 1 1" /><p className="text-xs text-muted-foreground">Кожне баре з нового рядка. Без баре — порожньо.</p></Field>
      <Field><FieldLabel htmlFor="voicing-mode">Використання форми</FieldLabel><Select value={draft.mode} onValueChange={(value) => set("mode", value)}><SelectTrigger id="voicing-mode"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="fixed">Лише ця тоніка</SelectItem><SelectItem value="movable">Переносна форма</SelectItem><SelectItem value="octaves">Переносна + октавні позиції</SelectItem></SelectGroup></SelectContent></Select></Field>
      <Field><FieldLabel htmlFor="voicing-omitted">Пропущені інтервали (за потреби)</FieldLabel><Input id="voicing-omitted" value={draft.omitted} onChange={(e) => set("omitted", e.target.value)} placeholder="7" /></Field>
    </FieldGroup>
  );
}
export function numbers(value: string): number[] { return value.trim() ? value.trim().split(/\s+/).map((token) => /^-?\d+$/.test(token) ? Number(token) : NaN) : []; }
export function parseVoicingDraft(draft: VoicingDraft) {
  return {
    root: Number(draft.root), bass: draft.bass === "none" ? null : Number(draft.bass),
    frets: numbers(draft.frets), fingers: numbers(draft.fingers), omittedIntervals: numbers(draft.omitted),
    movable: draft.mode !== "fixed", octaveVariants: draft.mode === "octaves",
    barres: draft.barres.trim() ? draft.barres.trim().split(/\n/).map((line) => { const values = numbers(line); return values.length === 4 ? { fret: values[0], fromString: values[1], toString: values[2], finger: values[3] } : {}; }) : [],
  };
}
