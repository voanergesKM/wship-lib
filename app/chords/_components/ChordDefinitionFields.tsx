"use client";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export interface DefinitionDraft { quality: string; name: string; category: string; aliases: string; intervals: string; optional: string }
export function ChordDefinitionFields({ draft, onChange }: { draft: DefinitionDraft; onChange: (draft: DefinitionDraft) => void }) {
  const set = (key: keyof DefinitionDraft, value: string) => onChange({ ...draft, [key]: value });
  return <FieldGroup>
    {([
      ["quality", "Суфікс типу без тоніки", "maj9"], ["name", "Назва типу", "Мажорний нонакорд"], ["aliases", "Альтернативні суфікси через кому", "M9, Δ9"], ["intervals", "Інтервали у півтонах від тоніки", "0 2 4 7 11"], ["optional", "Дозволені пропуски інтервалів", "7"],
    ] as const).map(([key, label, placeholder]) => <Field key={key}><FieldLabel htmlFor={`definition-${key}`}>{label}</FieldLabel><Input id={`definition-${key}`} value={draft[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} /></Field>)}
    <Field><FieldLabel htmlFor="definition-category">Категорія</FieldLabel><Select value={draft.category} onValueChange={(value) => set("category", value)}><SelectTrigger id="definition-category"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="basic">Базові</SelectItem><SelectItem value="jazz">Джазові</SelectItem><SelectItem value="suspended">Sus та add</SelectItem></SelectGroup></SelectContent></Select></Field>
  </FieldGroup>;
}
