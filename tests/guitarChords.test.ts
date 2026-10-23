import assert from "node:assert/strict";
import { test } from "node:test";
import { getGuitarVoicings as resolveVoicings } from "../app/utils/guitarChords";
import { transposeContent } from "../app/utils/chordTransposition";

import seed from "../scripts/chord-catalog.seed.json";
import type { ChordCatalogData } from "../app/types/chords";
import { definitionSchema, voicingSchema } from "../app/lib/chords/validation";
const catalog: ChordCatalogData = {
  chords: seed.chords.map(({ _id, ...entry }) => ({ _id, ...definitionSchema.parse(entry) })),
  voicings: seed.voicings.map(({ _id, chordId, version, ...entry }) => ({ _id, chordId, version, ...voicingSchema.parse(entry) })),
};
const getGuitarVoicings = (name: string) => resolveVoicings(name, catalog);

const roots = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const tuning = [4, 9, 2, 7, 11, 4];
const intervals: Record<string, number[]> = {
  "": [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m7b5: [0, 3, 6, 10], sus4: [0, 5, 7],
};

test("every supported root and quality contains exactly its chord tones", () => {
  roots.forEach((root, pitch) => {
    Object.entries(intervals).forEach(([quality, tones]) => {
      const name = root + quality;
      const variants = getGuitarVoicings(name);
      assert.ok(variants.length >= 2, name);
      for (const { frets } of variants) {
        const actual = frets.flatMap((fret, string) => fret < 0 ? [] : [(tuning[string] + fret - pitch + 12) % 12]);
        assert.deepEqual([...new Set(actual)].sort(), [...tones].sort(), `${name}: ${frets}`);
        const pressed = frets.filter((fret) => fret > 0);
        assert.ok(Math.max(...pressed) - Math.min(...pressed) <= 4);
      }
    });
  });
});

test("aliases and flats preserve chord identity", () => {
  assert.deepEqual(getGuitarVoicings("A7maj"), getGuitarVoicings("Amaj7"));
  assert.deepEqual(getGuitarVoicings("Bbmaj7"), getGuitarVoicings("A#maj7"));
  assert.deepEqual(getGuitarVoicings("F♯m7"), getGuitarVoicings("F#m7"));
  assert.notDeepEqual(getGuitarVoicings("A7"), getGuitarVoicings("Amaj7"));
});

test("unsupported names never silently fall back to a different chord", () => {
  for (const chord of ["", "H", "C/H", "D/F#/A", "D/", "A14", "Cconstructor", "CtoString", "Cmaj7foo"]) {
    assert.deepEqual(getGuitarVoicings(chord), [], chord);
  }
});

test("existing transposition and capo choose the displayed chord shape", () => {
  const content = transposeContent("[Gmaj7]", 4 - 2);
  assert.equal(content, "[Amaj7]");
  const shape = getGuitarVoicings(content.slice(1, -1))[0];
  // With capo 2, the Amaj7 shape sounds Bmaj7 (the original Gmaj7 + 4).
  const sounding = shape.frets.flatMap((fret, string) => fret < 0 ? [] : [(tuning[string] + fret + 2) % 12]);
  assert.deepEqual([...new Set(sounding)].sort(), [11, 3, 6, 10].sort());
});


test("slash chords include familiar shapes and preserve their actual lowest note", () => {
  assert.ok(getGuitarVoicings("D/F#").some(({ frets }) => frets.join(",") === "2,-1,0,2,3,2"));
  for (const [quality, bassInterval] of [["", 4], ["", 7], ["", 11], ["m", 3], ["m", 7], ["m", 10], ["maj7", 4], ["m7", 10], ["7", 4]] as const) {
    roots.forEach((root, pitch) => {
      const bass = (pitch + bassInterval) % 12;
      const name = `${root}${quality}/${roots[bass]}`;
      const variants = getGuitarVoicings(name);
      assert.ok(variants.length > 0, name);
      for (const { frets } of variants) {
        const notes = frets.flatMap((fret, i) => fret < 0 ? [] : [[40, 45, 50, 55, 59, 64][i] + fret]);
        assert.equal(Math.min(...notes) % 12, bass, name);
        const expected = [...new Set([...intervals[quality].map((interval) => (pitch + interval) % 12), bass])].sort();
        assert.deepEqual([...new Set(notes.map((note) => note % 12))].sort(), expected, name);
      }
    });
  }
});

test("slash aliases, explicit root bass, and unsupported basses", () => {
  assert.deepEqual(getGuitarVoicings("D/Gb"), getGuitarVoicings("D/F#"));
  assert.deepEqual(getGuitarVoicings("D/F♯"), getGuitarVoicings("D/F#"));
  assert.deepEqual(getGuitarVoicings("C/C"), getGuitarVoicings("C"));
  assert.deepEqual(getGuitarVoicings("C/F#"), []);
  const transposed = transposeContent("[D/F#]", 2);
  assert.equal(transposed, "[E/G#]");
  assert.ok(getGuitarVoicings(transposed.slice(1, -1)).length > 0);
});

test("F shapes include the third, including the higher D-string-root voicing", () => {
  assert.ok(getGuitarVoicings("F").some(({ frets }) => frets.join(",") === "-1,-1,3,5,6,5"));
  assert.ok(!getGuitarVoicings("F").some(({ frets }) => frets.join(",") === "-1,-1,3,5,6,-1"));
});


const extendedIntervals: Record<string, number[]> = {
  "6": [0, 4, 7, 9], m6: [0, 3, 7, 9], "6/9": [0, 4, 7, 9, 2],
  "9": [0, 4, 7, 10, 2], maj9: [0, 4, 7, 11, 2], m9: [0, 3, 7, 10, 2],
  add9: [0, 4, 7, 2], madd9: [0, 3, 7, 2], sus2: [0, 2, 7],
  "7sus4": [0, 5, 7, 10], "7sus2": [0, 2, 7, 10],
  dim: [0, 3, 6], dim7: [0, 3, 6, 9], aug: [0, 4, 8],
  "7b9": [0, 4, 7, 10, 1], "7#9": [0, 4, 7, 10, 3], "7#5": [0, 4, 8, 10],
  m11: [0, 3, 7, 10, 2, 5], "13": [0, 4, 7, 10, 2, 9], "5": [0, 7],
};

test("all extended chord types work in 12 keys with only declared omissions", () => {
  roots.forEach((root, pitch) => {
    Object.entries(extendedIntervals).forEach(([quality, tones]) => {
      const name = root + quality;
      const variants = getGuitarVoicings(name);
      assert.ok(variants.length > 0, name);
      for (const { frets, omittedIntervals = [] } of variants) {
        // Only the perfect fifth may be omitted in these jazz forms.
        assert.ok(omittedIntervals.every((interval) => interval === 7));
        const expected = tones.filter((tone) => !omittedIntervals.some((interval) => interval === tone));
        const actual = frets.flatMap((fret, i) => fret < 0 ? [] : [(tuning[i] + fret - pitch + 24) % 12]);
        assert.deepEqual([...new Set(actual)].sort(), [...expected].sort(), `${name}: ${frets}`);
        const pressed = frets.filter((fret) => fret > 0);
        assert.ok(Math.max(...pressed) - Math.min(...pressed) <= 4, name);
        assert.ok(frets.every((fret) => fret >= -1 && fret <= 17));
      }
    });
  });
});

test("6/9 quality is not mistaken for a slash bass during parsing or transposition", () => {
  assert.deepEqual(getGuitarVoicings("C69"), getGuitarVoicings("C6/9"));
  assert.equal(transposeContent("[C6/9] [C6/9/E]", 2), "[D6/9] [D6/9/F#]");
  assert.ok(getGuitarVoicings("C6/9").length > 0);
  assert.deepEqual(getGuitarVoicings("C6/9/H"), []);
});

test("requested inversions and compact alternatives are available", () => {
  for (const name of ["Cmaj7/E", "Dm/F", "G7/B"]) {
    assert.ok(getGuitarVoicings(name).length > 0, name);
  }
  assert.ok(getGuitarVoicings("F5").some(({ frets }) => frets.join(",") === "-1,-1,3,5,6,-1"));
  assert.ok(getGuitarVoicings("G").some(({ frets }) => frets.filter((fret) => fret >= 0).length === 3));
  assert.ok(getGuitarVoicings("C").some(({ frets }) => frets.filter((fret) => fret >= 0).length === 4));
});
