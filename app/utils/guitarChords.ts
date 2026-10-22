export type GuitarFrets = readonly [number, number, number, number, number, number];
export interface GuitarVoicing {
  /** Frets from low E to high E. -1 = muted, 0 = open (relative to capo). */
  frets: GuitarFrets;
  omittedIntervals?: readonly number[];
}

export type GuitarChordQuality = "" | "m" | "7" | "maj7" | "m7" | "m7b5" | "sus4"
  | "6" | "m6" | "6/9" | "9" | "maj9" | "m9" | "add9" | "madd9"
  | "sus2" | "7sus4" | "7sus2" | "dim" | "dim7" | "aug"
  | "7b9" | "7#9" | "7#5" | "m11" | "13" | "5";
const ROOTS: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, Fb: 4,
  "E#": 5, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10, B: 11, Cb: 11, "B#": 0,
};
const ALIASES: Record<string, GuitarChordQuality> = {
  "": "", maj: "", M: "", m: "m", min: "m", "-": "m",
  "7": "7", maj7: "maj7", "7maj": "maj7", M7: "maj7", "Δ7": "maj7",
  m7: "m7", min7: "m7", "-7": "m7", m7b5: "m7b5", "ø": "m7b5", "ø7": "m7b5",
  sus4: "sus4", sus: "sus4",
  "6": "6", m6: "m6", "6/9": "6/9", "69": "6/9", "6add9": "6/9",
  "9": "9", maj9: "maj9", M9: "maj9", "Δ9": "maj9", m9: "m9", min9: "m9",
  add9: "add9", madd9: "madd9", minadd9: "madd9", sus2: "sus2",
  "7sus4": "7sus4", "7sus": "7sus4", "7sus2": "7sus2",
  dim: "dim", "°": "dim", dim7: "dim7", "°7": "dim7", aug: "aug", "+": "aug",
  "7b9": "7b9", "7#9": "7#9", "7#5": "7#5", "7+": "7#5",
  m11: "m11", "13": "13", "5": "5",
};
// Complete E- and A-root forms. Every sounding string, including open strings,
// is moved together; muted strings remain muted.
const FORMS: Partial<Record<GuitarChordQuality, readonly [GuitarFrets, GuitarFrets]>> = {
  "": [[0, 2, 2, 1, 0, 0], [-1, 0, 2, 2, 2, 0]],
  m: [[0, 2, 2, 0, 0, 0], [-1, 0, 2, 2, 1, 0]],
  "7": [[0, 2, 0, 1, 0, 0], [-1, 0, 2, 0, 2, 0]],
  maj7: [[0, 2, 1, 1, 0, 0], [-1, 0, 2, 1, 2, 0]],
  m7: [[0, 2, 0, 0, 0, 0], [-1, 0, 2, 0, 1, 0]],
  m7b5: [[0, 1, 0, 0, 3, -1], [-1, 0, 1, 0, 1, -1]],
  sus4: [[0, 2, 2, 2, 0, 0], [-1, 0, 2, 2, 3, 0]],
};
const OPEN: Record<string, GuitarFrets> = {
  F: [-1, -1, 3, 2, 1, 1],
  C: [-1, 3, 2, 0, 1, 0], D: [-1, -1, 0, 2, 3, 2],
  Dm: [-1, -1, 0, 2, 3, 1], G: [3, 2, 0, 0, 0, 3],
  Cmaj7: [-1, 3, 2, 0, 0, 0], Dmaj7: [-1, -1, 0, 2, 2, 2],
  D7: [-1, -1, 0, 2, 1, 2], G7: [3, 2, 0, 0, 0, 1],
  Dm7: [-1, -1, 0, 2, 1, 1], Dsus4: [-1, -1, 0, 2, 3, 3],
};

interface MovableForm extends GuitarVoicing {
  root: number;
}
// Shapes in standard tuning. Omitted intervals are explicit, never inferred.
const EXTRA_FORMS: Partial<Record<GuitarChordQuality, readonly MovableForm[]>> = {
  "": [{ root: 2, frets: [-1, -1, 0, 2, 3, 2] }, { root: 0, frets: [-1, -1, -1, 5, 5, 3] }],
  m: [{ root: 2, frets: [-1, -1, 0, 2, 3, 1] }],
  "6": [{ root: 0, frets: [-1, 3, 2, 2, 1, 3] }, { root: 9, frets: [-1, 0, 2, 2, 2, 2] }],
  m6: [{ root: 9, frets: [-1, 0, 2, 2, 1, 2] }],
  "6/9": [{ root: 0, frets: [-1, 3, 2, 2, 3, 3] }],
  "9": [{ root: 0, frets: [-1, 3, 2, 3, 3, 3] }, { root: 4, frets: [0, 2, 0, 1, 0, 2] }],
  maj9: [{ root: 0, frets: [-1, 3, 2, 4, 3, 3] }, { root: 0, frets: [-1, 3, 2, 4, 3, -1], omittedIntervals: [7] }],
  m9: [{ root: 9, frets: [-1, 0, 5, 5, 0, 0] }, { root: 0, frets: [-1, 3, 1, 3, 3, -1], omittedIntervals: [7] }],
  add9: [{ root: 0, frets: [-1, 3, 2, 0, 3, 3] }],
  madd9: [{ root: 9, frets: [-1, 0, 2, 4, 1, 0] }],
  sus2: [{ root: 9, frets: [-1, 0, 2, 2, 0, 0] }, { root: 2, frets: [-1, -1, 0, 2, 3, 0] }],
  "7sus4": [{ root: 9, frets: [-1, 0, 2, 0, 3, 0] }],
  "7sus2": [{ root: 9, frets: [-1, 0, 2, 0, 0, 0] }],
  dim: [{ root: 11, frets: [-1, 2, 3, 4, 3, -1] }],
  dim7: [{ root: 11, frets: [-1, 2, 3, 1, 3, -1] }, { root: 2, frets: [-1, -1, 0, 1, 0, 1] }],
  aug: [{ root: 0, frets: [-1, 3, 2, 1, 1, -1] }],
  "7b9": [{ root: 4, frets: [0, 2, 0, 1, 0, 1] }],
  "7#9": [{ root: 4, frets: [-1, 7, 6, 7, 8, -1], omittedIntervals: [7] }],
  "7#5": [{ root: 7, frets: [3, -1, 3, 4, 4, -1] }],
  m11: [{ root: 2, frets: [-1, 5, 3, 5, 5, 3], omittedIntervals: [7] }],
  "13": [{ root: 7, frets: [3, -1, 3, 4, 5, 5], omittedIntervals: [7] }],
  "5": [{ root: 4, frets: [0, 2, 2, -1, -1, -1] }, { root: 9, frets: [-1, 0, 2, 2, -1, -1] }, { root: 5, frets: [-1, -1, 3, 5, 6, -1] }],
};

// Absolute pitches are needed: string order alone does not guarantee the bass.
const TUNING = [40, 45, 50, 55, 59, 64] as const;
interface SlashForm {
  root: number;
  quality: GuitarChordQuality;
  bassInterval: number;
  frets: GuitarFrets;
}
// Curated, movable shapes; unsupported slash families intentionally return none.
const SLASH_FORMS: readonly SlashForm[] = [
  { root: 2, quality: "", bassInterval: 4, frets: [2, -1, 0, 2, 3, 2] }, // D/F#
  { root: 0, quality: "", bassInterval: 4, frets: [0, 3, 2, 0, 1, 0] }, // C/E
  { root: 7, quality: "", bassInterval: 4, frets: [-1, 2, 0, 0, 0, 3] }, // G/B
  { root: 0, quality: "", bassInterval: 7, frets: [3, 3, 2, 0, 1, 0] }, // C/G
  { root: 2, quality: "", bassInterval: 7, frets: [-1, 0, 0, 2, 3, 2] }, // D/A
  { root: 9, quality: "m", bassInterval: 10, frets: [3, 0, 2, 2, 1, 0] }, // Am/G
  { root: 9, quality: "m", bassInterval: 3, frets: [-1, 3, 2, 2, 1, 0] }, // Am/C
  { root: 9, quality: "m", bassInterval: 7, frets: [0, 0, 2, 2, 1, 0] }, // Am/E
  { root: 0, quality: "", bassInterval: 11, frets: [-1, 2, 2, 0, 1, 0] }, // C/B
  { root: 0, quality: "maj7", bassInterval: 4, frets: [0, 3, 2, 0, 0, 0] },
  { root: 9, quality: "m7", bassInterval: 10, frets: [3, 0, 2, 0, 1, 0] },
  { root: 2, quality: "7", bassInterval: 4, frets: [2, -1, 0, 2, 1, 2] },
];

function moveFrets(form: GuitarFrets, shift: number): GuitarFrets {
  const move = (fret: number) => fret < 0 ? -1 : fret + shift;
  return [move(form[0]), move(form[1]), move(form[2]), move(form[3]), move(form[4]), move(form[5])];
}

function bassPitch(frets: GuitarFrets): number {
  return Math.min(...frets.flatMap((fret, i) => fret < 0 ? [] : [TUNING[i] + fret])) % 12;
}

export function getGuitarVoicings(chord: string): GuitarVoicing[] {
  const normalized = chord.trim().replaceAll("♯", "#").replaceAll("♭", "b");
  const match = /^([A-G](?:#|b)?)(6\/9|[^/]*)(?:\/([A-G](?:#|b)?))?$/.exec(normalized);
  if (!match || !Object.hasOwn(ALIASES, match[2])) return [];
  const root = ROOTS[match[1]];
  if (root === undefined) return [];
  const quality = ALIASES[match[2]];
  if (match[3]) {
    const bass = ROOTS[match[3]];
    const candidates = getGuitarVoicings(`${match[1]}${quality}`);
    for (const form of SLASH_FORMS) {
      if (form.quality !== quality || (root + form.bassInterval) % 12 !== bass) continue;
      candidates.push({ frets: moveFrets(form.frets, (root - form.root + 12) % 12) });
    }
    const seen = new Set<string>();
    return candidates.filter(({ frets }) => {
      const key = frets.join(",");
      if (bassPitch(frets) !== bass || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => Math.max(...a.frets) - Math.max(...b.frets));
  }
  const open = OPEN[`${match[1]}${quality}`];
  const variants: GuitarVoicing[] = open ? [{ frets: open }] : [];
  if (root === 5 && quality === "") {
    variants.push({ frets: [-1, -1, 3, 5, 6, 5] });
  }
  FORMS[quality]?.forEach((form, index) => {
    const shift = (root - (index === 0 ? 4 : 9) + 12) % 12;
    const frets = moveFrets(form, shift);
    if (!variants.some((variant) => variant.frets.every((fret, i) => fret === frets[i]))) {
      variants.push({ frets });
    }
  });
  for (const form of EXTRA_FORMS[quality] ?? []) {
    const shift = (root - form.root + 12) % 12;
    // Include lower and higher positions only when all sounding frets fit.
    for (const offset of [shift - 12, shift, shift + 12]) {
      if (form.frets.some((fret) => fret >= 0 && (fret + offset < 0 || fret + offset > 17))) continue;
      const frets = moveFrets(form.frets, offset);
      const pressed = frets.filter((fret) => fret > 0);
      if (Math.max(...pressed) - Math.min(...pressed) > 4) continue;
      if (variants.some((variant) => variant.frets.every((fret, i) => fret === frets[i]))) continue;
      variants.push({ frets, ...(form.omittedIntervals ? { omittedIntervals: form.omittedIntervals } : {}) });
    }
  }
  return variants.sort((a, b) => Math.max(...a.frets) - Math.max(...b.frets));
}
