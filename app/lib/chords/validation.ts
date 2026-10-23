import { z } from "zod";
import type { ChordDefinition, VoicingData } from "../../types/chords";
import { normalizeChordSymbol, NOTE_NAMES, soundingNotes } from "../../utils/guitarChords";

const symbol = z.string().max(30).transform(normalizeChordSymbol).refine((value) => /^[A-Za-z0-9+#°øΔ()/-]*$/.test(value) && !/^[A-G]/.test(value) && !/\/[A-G][#b]?$/.test(value), "Введіть суфікс типу без тоніки й баса, наприклад maj9");
const intervals = z.array(z.number().int().min(0).max(11)).max(12).refine((values) => new Set(values).size === values.length, "Інтервали не повинні повторюватися");
export const definitionSchema = z.object({
  quality: symbol,
  name: z.string().trim().min(2).max(100),
  category: z.enum(["basic", "jazz", "suspended"]),
  aliases: z.array(symbol).max(20),
  intervals: intervals.refine((values) => values.length >= 2 && values.includes(0), "Потрібно щонайменше два інтервали, включно з 0 (тонікою)"),
  optionalIntervals: intervals.refine((values) => values.every((value) => value === 0 || value === 7), "Пропускати можна лише тоніку (0) або чисту квінту (7)"),
}).strict().superRefine((data, ctx) => {
  if (data.optionalIntervals.some((value) => !data.intervals.includes(value))) ctx.addIssue({ code: "custom", message: "Необов’язкова нота має входити до складу акорду" });
});
const fret = z.number().int().min(-1).max(24);
const finger = z.number().int().min(0).max(4);
export const voicingSchema = z.object({
  root: z.number().int().min(0).max(11),
  bass: z.number().int().min(0).max(11).nullable(),
  frets: z.tuple([fret, fret, fret, fret, fret, fret]),
  fingers: z.tuple([finger, finger, finger, finger, finger, finger]),
  barres: z.array(z.object({ fret: z.number().int().min(1).max(24), fromString: z.number().int().min(1).max(6), toString: z.number().int().min(1).max(6), finger: z.number().int().min(1).max(4) }).strict()).max(4),
  movable: z.boolean(),
  octaveVariants: z.boolean(),
  omittedIntervals: intervals,
}).strict().superRefine((data, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  if (data.frets.filter((value) => value >= 0).length < 2) issue("Потрібно щонайменше дві звучні струни");
  const pressed = data.frets.filter((value) => value > 0);
  if (pressed.length && Math.max(...pressed) - Math.min(...pressed) > 4) issue("Затиснуті ноти мають вміщуватися у п’ять сусідніх ладів");
  if (data.octaveVariants && !data.movable) issue("Октавні варіанти доступні лише для переносної форми");
  if (data.octaveVariants && Math.max(...data.frets) > 17) issue("Для октавних варіантів вихідна форма має бути в межах 17 ладів");
  data.fingers.forEach((value, i) => { if (data.frets[i] <= 0 && value !== 0) issue("На відкритій або приглушеній струні палець має бути 0"); });
  for (const barre of data.barres) {
    if (barre.fromString <= barre.toString) { issue("Баре задається від товстішої струни до тоншої, наприклад 6 → 1"); continue; }
    const covered = data.frets.slice(6 - barre.fromString, 7 - barre.toString);
    if (covered.some((value) => value < barre.fret) || covered.filter((value) => value === barre.fret).length < 2) issue("Баре має затискати мінімум дві струни на своєму ладу; під ним не може бути відкритих або приглушених струн");
    data.fingers.forEach((value, i) => {
      const string = 6 - i;
      if (string <= barre.fromString && string >= barre.toString && data.frets[i] === barre.fret && value !== 0 && value !== barre.finger) issue("Номер пальця на ладу баре має збігатися з пальцем баре");
    });
  }
  for (let fingerNumber = 1; fingerNumber <= 4; fingerNumber++) {
    const positions = data.fingers.flatMap((value, i) => value === fingerNumber ? [i] : []);
    if (positions.length > 1 && !data.barres.some((barre) => barre.finger === fingerNumber && positions.every((i) => data.frets[i] === barre.fret && 6 - i <= barre.fromString && 6 - i >= barre.toString))) issue("Один палець на кількох струнах потребує відповідного баре");
  }
});
export const proposalSchema = z.object({
  kind: z.enum(["add-voicing", "edit-voicing", "add-chord"]),
  chordId: z.string().min(1).max(80).optional(),
  targetId: z.string().min(1).max(80).optional(),
  baseVersion: z.number().int().min(1).optional(),
  definition: definitionSchema.optional(),
  voicing: voicingSchema,
  comment: z.string().trim().min(3, "Поясніть запропоновану зміну").max(1000),
}).strict().superRefine((data, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  if (data.kind === "add-chord" ? !data.definition || !!data.chordId || !!data.targetId || data.baseVersion !== undefined : !data.chordId || !!data.definition) fail("Некоректні поля для обраного типу пропозиції");
  if (data.kind === "edit-voicing" ? !data.targetId || !data.baseVersion : !!data.targetId || data.baseVersion !== undefined) fail("Для редагування потрібні ID аплікатури та її версія");
});

type NoteDefinition = Pick<ChordDefinition, "intervals" | "optionalIntervals">;

function expectedIntervals(definition: NoteDefinition, voicing: VoicingData) {
  const expected = new Set(definition.intervals.filter((interval) => !voicing.omittedIntervals.includes(interval)));
  if (voicing.bass !== null) expected.add((voicing.bass - voicing.root + 12) % 12);
  return expected;
}

export function validateVoicingNotes(
  definition: NoteDefinition,
  voicing: VoicingData,
  catalog: readonly (NoteDefinition & Pick<ChordDefinition, "quality">)[] = [],
): string | null {
  if (voicing.omittedIntervals.some((interval) => !definition.optionalIntervals.includes(interval))) return "Цей тип акорду не дозволяє зазначений пропуск нот";
  const notes = soundingNotes(voicing.frets);
  const actual = new Set(notes.map((note) => (note - voicing.root + 12) % 12));
  const expected = expectedIntervals(definition, voicing);
  const extra = [...actual].filter((interval) => !expected.has(interval));
  const missing = [...expected].filter((interval) => !actual.has(interval));
  const bassMatches = voicing.bass === null || Math.min(...notes) % 12 === voicing.bass;
  const errors: string[] = [];
  const noteNames = (intervals: number[]) => intervals.map((interval) => NOTE_NAMES[(voicing.root + interval) % 12]).join(", ");
  if (extra.length) errors.push(`Зайві ноти: ${noteNames(extra)}.`);
  if (missing.length) errors.push(`Бракує нот: ${noteNames(missing)}.`);
  if (!bassMatches) errors.push(`Найнижча звучна нота — ${NOTE_NAMES[Math.min(...notes) % 12]}, але задано бас ${NOTE_NAMES[voicing.bass!]}.`);
  if (errors.length && bassMatches) {
    const suggestions = catalog.filter((candidate) => {
      if (voicing.omittedIntervals.some((interval) => !candidate.optionalIntervals.includes(interval))) return false;
      const candidateNotes = expectedIntervals(candidate, voicing);
      return candidateNotes.size === actual.size && [...candidateNotes].every((interval) => actual.has(interval));
    }).map((candidate) => `${NOTE_NAMES[voicing.root]}${candidate.quality}${voicing.bass === null ? "" : `/${NOTE_NAMES[voicing.bass]}`}`);
    const unique = [...new Set(suggestions)].slice(0, 3);
    if (unique.length) errors.push(`Можливо, ви мали на увазі: ${unique.join(", ")}. Оберіть відповідний тип акорду в каталозі.`);
  }
  return errors.length ? errors.join(" ") : null;
}
export function chordSymbols(definition: Pick<ChordDefinition, "quality" | "aliases">) {
  return [...new Set([definition.quality, ...definition.aliases].map(normalizeChordSymbol))];
}
export const intervalSignature = (intervals: number[]) => [...intervals].sort((a, b) => a - b).join(",");
export const voicingIdentity = (chordId: string, data: VoicingData) => JSON.stringify([chordId, data.root, data.bass, data.frets]);
