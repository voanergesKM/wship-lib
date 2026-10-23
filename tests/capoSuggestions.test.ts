import assert from "node:assert/strict";
import { test } from "node:test";
import seed from "../scripts/chord-catalog.seed.json";
import { definitionSchema, voicingSchema } from "../app/lib/chords/validation";
import { suggestCapos } from "../app/utils/capoSuggestions";
import { transposeChord } from "../app/utils/chordTransposition";

const catalog = {
  chords: seed.chords.map(({ _id, ...definition }) => ({
    _id,
    ...definitionSchema.parse(definition),
  })),
  voicings: seed.voicings.map(({ _id, chordId, version, ...voicing }) => ({
    _id,
    chordId,
    version,
    ...voicingSchema.parse(voicing),
  })),
};

test("Bb progression offers open A and G families without changing sounding key", () => {
  const { options } = suggestCapos(["Bb", "Eb", "F"], 0, 0, catalog);
  assert.ok(
    options.some(
      (option) =>
        option.capo === 1 &&
        option.chords.map((c) => c.name).join() === "A,D,E",
    ),
  );
  assert.ok(
    options.some(
      (option) =>
        option.capo === 3 &&
        option.chords.map((c) => c.name).join() === "G,C,D",
    ),
  );
  for (const option of options) {
    assert.deepEqual(
      option.chords.map((c) => transposeChord(c.name, option.capo)),
      ["A#", "D#", "F"],
    );
  }
});

test("existing transposition and capo are respected, including slash bass and extensions", () => {
  const input = ["C", "F", "G", "C/E", "C6/9"];
  const result = suggestCapos(input, -2, 4, catalog);
  assert.deepEqual(
    result.current.chords.map((c) => c.name),
    input.map((c) => transposeChord(c, -6)),
  );
  for (const option of result.options) {
    assert.notEqual(option.capo, 4);
    assert.deepEqual(
      option.chords.map((c) => transposeChord(c.name, option.capo)),
      input.map((c) => transposeChord(c, -2)),
    );
  }
});

test("unknown chords and empty songs do not produce partial recommendations", () => {
  assert.deepEqual(suggestCapos([], 0, 0, catalog).options, []);
  const result = suggestCapos(["C", "Cunknown"], 0, 0, catalog);
  assert.deepEqual(result.options, []);
  assert.deepEqual(result.current.unsupported, ["Cunknown"]);
});

test("repeated chords do not distort score and recommended shapes keep all tones", () => {
  assert.deepEqual(
    suggestCapos(["Bb", "Eb", "F", "Bb"], 0, 0, catalog),
    suggestCapos(["Bb", "Eb", "F"], 0, 0, catalog),
  );
  const { current, options } = suggestCapos(["Bb", "Eb", "F"], 0, 0, catalog);
  assert.ok(options.length <= 3);
  for (const option of options) {
    assert.ok(option.score < current.score);
    assert.ok(option.capo >= 0 && option.capo <= 12);
    assert.ok(option.chords.every((c) => !c.voicing.omittedIntervals?.length));
  }
});
