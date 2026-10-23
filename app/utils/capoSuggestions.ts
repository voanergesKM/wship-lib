import type { ChordCatalogData, GuitarVoicing } from "../types/chords";
import { getGuitarVoicings, normalizeChordSymbol } from "./guitarChords";
import { transposeChord } from "./chordTransposition";

export interface CapoOption {
  capo: number;
  score: number;
  openShapes: number;
  chords: { name: string; voicing: GuitarVoicing }[];
  unsupported: string[];
}

// A heuristic for individual shapes, not a guarantee of comfortable transitions.
function difficulty(voicing: GuitarVoicing) {
  const pressed = voicing.frets.filter((fret) => fret > 0);
  const lowest = pressed.length ? Math.min(...pressed) : 0;
  const span = pressed.length ? Math.max(...pressed) - lowest : 0;
  const open = voicing.frets.includes(0);
  // Shifted templates may lack authored finger/barre data. Penalize likely barres too.
  const barre = !!voicing.barres?.length || pressed.length > 4;
  return (
    voicing.frets.filter((fret) => fret < 0).length * 0.7 +
    pressed.length +
    span * 1.5 +
    Math.max(0, lowest - 1) * 0.6 +
    (barre ? 5 : 0) -
    (open ? 2 : 0)
  );
}

export function suggestCapos(
  chords: readonly string[],
  transpose: number,
  currentCapo: number,
  catalog: ChordCatalogData,
) {
  const unique = [...new Set(chords.map(normalizeChordSymbol).filter(Boolean))];
  const assess = (capo: number): CapoOption => {
    const result: CapoOption = {
      capo,
      score: capo * 0.8,
      openShapes: 0,
      chords: [],
      unsupported: [],
    };
    for (const chord of unique) {
      const name = transposeChord(chord, transpose - capo);
      // Do not simplify chord qualities, slash basses or silently omit chord tones.
      const candidates = getGuitarVoicings(name, catalog).filter(
        (voicing) => !voicing.omittedIntervals?.length,
      );
      const best = candidates.reduce<GuitarVoicing | undefined>(
        (best, candidate) =>
          !best || difficulty(candidate) < difficulty(best) ? candidate : best,
        undefined,
      );
      if (!best) {
        result.unsupported.push(name);
        continue;
      }
      result.chords.push({ name, voicing: best });
      result.score += difficulty(best);
      if (best.frets.includes(0) && Math.max(...best.frets) <= 4)
        result.openShapes++;
    }
    return result;
  };
  const current = assess(currentCapo);
  // Unknown chords prevent reliable ranking; do not call a partial result "easier".
  const options =
    unique.length && !current.unsupported.length
      ? Array.from({ length: 13 }, (_, capo) => assess(capo))
          .filter(
            (option) =>
              option.capo !== currentCapo &&
              !option.unsupported.length &&
              option.score < current.score - 0.5,
          )
          .sort((a, b) => a.score - b.score || a.capo - b.capo)
          .slice(0, 3)
      : [];
  return { current, options };
}
