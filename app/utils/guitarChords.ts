import type { ChordCatalogData, GuitarFrets, GuitarVoicing } from "../types/chords";
export type { GuitarFrets, GuitarVoicing } from "../types/chords";
export type GuitarChordQuality = string;
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const GUITAR_TUNING = [40, 45, 50, 55, 59, 64] as const;
const ROOTS: Record<string, number> = { C:0, "C#":1, Db:1, D:2, "D#":3, Eb:3, E:4, Fb:4, "E#":5, F:5, "F#":6, Gb:6, G:7, "G#":8, Ab:8, A:9, "A#":10, Bb:10, B:11, Cb:11, "B#":0 };
export const notePitch = (note: string): number | undefined => ROOTS[normalizeChordSymbol(note)];
export const normalizeChordSymbol = (value: string) => value.trim().replaceAll("♯", "#").replaceAll("♭", "b");
export function soundingNotes(frets: GuitarFrets) {
  return frets.flatMap((fret, i) => fret < 0 ? [] : [GUITAR_TUNING[i] + fret]);
}
export function getGuitarVoicings(chord: string, catalog: ChordCatalogData): GuitarVoicing[] {
  const normalized = normalizeChordSymbol(chord);
  // Only a note at the end is a slash bass. The slash in 6/9 belongs to the quality.
  const match = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(normalized);
  if (!match) return [];
  const root = ROOTS[match[1]];
  const bass = match[3] ? ROOTS[match[3]] : null;
  const definition = catalog.chords.find((entry) => entry.quality === match[2] || entry.aliases.includes(match[2]));
  if (root === undefined || !definition) return [];
  const variants: GuitarVoicing[] = [];
  const seen = new Set<string>();
  for (const template of catalog.voicings) {
    if (template.chordId !== definition._id || (!template.movable && template.root !== root)) continue;
    const shift = template.movable ? (root - template.root + 12) % 12 : 0;
    if (template.bass !== null && (bass === null || (template.bass + shift) % 12 !== bass)) continue;
    const offsets = template.movable && template.octaveVariants ? [shift - 12, shift, shift + 12] : [shift];
    for (const offset of offsets) {
      if (template.frets.some((fret) => fret >= 0 && (fret + offset < 0 || fret + offset > (template.octaveVariants ? 17 : 24)))) continue;
      const move = (fret: number) => fret < 0 ? -1 : fret + offset;
      const f = template.frets;
      const frets: GuitarFrets = [move(f[0]), move(f[1]), move(f[2]), move(f[3]), move(f[4]), move(f[5])];
      const pressed = frets.filter((fret) => fret > 0);
      if (pressed.length && Math.max(...pressed) - Math.min(...pressed) > 4) continue;
      if (bass !== null && Math.min(...soundingNotes(frets)) % 12 !== bass) continue;
      const key = frets.join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      // Finger numbers only apply to the authored position. Open strings shifted up
      // need a new fingering; do not invent one while transposing.
      const fingers = offset === 0 ? template.fingers : undefined;
      const barres = template.barres.map((barre) => ({ ...barre, fret: barre.fret + offset })).filter((barre) => barre.fret > 0);
      variants.push({ frets, fingers, barres, omittedIntervals: template.omittedIntervals, templateId: template._id });
    }
  }
  return variants.sort((a, b) => Math.max(...a.frets) - Math.max(...b.frets));
}
