import assert from "node:assert/strict";
import { test } from "node:test";
import { chordFrequencies } from "../app/utils/chordAudio";

test("audio preserves voicing octaves, open strings and muted strings", () => {
  const frequencies = chordFrequencies([5,7,7,6,0,0]);
  const midi = frequencies.map((hz) => Math.round(69 + 12 * Math.log2(hz / 440)));
  assert.deepEqual(midi, [45,52,57,61,59,64]);
  assert.deepEqual(chordFrequencies([-1,-1,-1,-1,-1,-1]), []);
  assert.equal(chordFrequencies([-1,-1,-1,-1,-1,5])[0], 440);
});

test("capo raises all sounding strings including open strings", () => {
  const frets = [-1,0,2,2,2,0] as const;
  const open = chordFrequencies(frets);
  const capo = chordFrequencies(frets, 2);
  capo.forEach((hz, index) => assert.ok(Math.abs(hz / open[index] - 2 ** (2 / 12)) < 1e-10));
});
