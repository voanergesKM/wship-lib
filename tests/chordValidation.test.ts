import assert from "node:assert/strict";
import { test } from "node:test";
import { definitionSchema, proposalSchema, validateVoicingNotes, voicingSchema, chordSymbols, intervalSignature, voicingIdentity } from "../app/lib/chords/validation";
import seed from "../scripts/chord-catalog.seed.json";

const major = { intervals: [0, 4, 7], optionalIntervals: [7] };
const shape = { root: 0, bass: null, frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 0, 0, 0, 0, 0], barres: [], movable: false, octaveVariants: false, omittedIntervals: [] };

test("all migration templates satisfy the same API validation and note rules", () => {
  for (const { _id, chordId, version, ...data } of seed.voicings) {
    assert.equal(version, 1);
    const definition = seed.chords.find((entry) => entry._id === chordId)!;
    assert.equal(validateVoicingNotes(definition, voicingSchema.parse(data)), null, _id);
  }
});

test("invalid fret arrays, fractions, all-muted shapes and impossible spans are rejected", () => {
  for (const frets of [[0], [0, 0, 0, 0, 0, 25], [0, 1.5, 0, 0, 0, 0], [-1,-1,-1,-1,-1,-1], [1, 8, -1, -1, -1, -1]]) assert.equal(voicingSchema.safeParse({ ...shape, frets }).success, false);
  assert.equal(voicingSchema.safeParse({ ...shape, octaveVariants: true }).success, false);
});

test("barres and fingers agree and can be previewed without inventing fingering", () => {
  const valid = { ...shape, root: 9, frets: [5,7,6,6,5,5], fingers: [1,4,2,3,1,1], movable: true, barres: [{ fret: 5, fromString: 6, toString: 1, finger: 1 }] };
  assert.equal(voicingSchema.safeParse(valid).success, true);
  assert.equal(voicingSchema.safeParse({ ...valid, barres: [] }).success, false);
  assert.equal(voicingSchema.safeParse({ ...valid, frets: [0,7,6,6,5,5] }).success, false);
  assert.equal(voicingSchema.safeParse({ ...valid, barres: [{ fret: 5, fromString: 1, toString: 6, finger: 1 }] }).success, false);
});

test("wrong notes, undeclared omissions and incorrect lowest bass are rejected", () => {
  assert.equal(validateVoicingNotes(major, voicingSchema.parse(shape)), null);
  assert.ok(validateVoicingNotes(major, voicingSchema.parse({ ...shape, frets: [-1,3,2,0,2,0] })));
  assert.ok(validateVoicingNotes(major, voicingSchema.parse({ ...shape, bass: 4 })));
  assert.ok(validateVoicingNotes(major, voicingSchema.parse({ ...shape, omittedIntervals: [4] })));
});

test("aliases normalize unicode, preserve case, and equivalent interval sets share an identity", () => {
  assert.deepEqual(chordSymbols({ quality: " 7♯9 ", aliases: ["7#9"] }), ["7#9"]);
  assert.notDeepEqual(chordSymbols({ quality: "M", aliases: [] }), chordSymbols({ quality: "m", aliases: [] }));
  assert.equal(intervalSignature([0,7,4]), intervalSignature([4,0,7]));
  const valid = voicingSchema.parse(shape);
  assert.equal(voicingIdentity("major", valid), voicingIdentity("major", { ...valid, fingers: [0,3,2,0,1,0] }));
});

test("definition intervals and proposal operation boundaries are validated", () => {
  const definition = { quality: "maj9", name: "Мажорний нонакорд", category: "jazz", aliases: ["M9"], intervals: [0,2,4,7,11], optionalIntervals: [7] };
  assert.ok(definitionSchema.safeParse(definition).success);
  assert.equal(definitionSchema.safeParse({ ...definition, quality: "Cmaj9" }).success, false);
  assert.equal(definitionSchema.safeParse({ ...definition, intervals: [0,4,4] }).success, false);
  assert.equal(definitionSchema.safeParse({ ...definition, optionalIntervals: [4] }).success, false);
  const proposal = { kind: "edit-voicing", chordId: "major", targetId: "shape", baseVersion: 1, voicing: shape, comment: "Зручніше баре" };
  assert.ok(proposalSchema.safeParse(proposal).success);
  assert.equal(proposalSchema.safeParse({ ...proposal, baseVersion: undefined }).success, false);
  assert.equal(proposalSchema.safeParse({ ...proposal, kind: "add-voicing" }).success, false);
  assert.equal(proposalSchema.safeParse({ ...proposal, userId: "admin" }).success, false);
});

test("open Aadd9 reports the extra B for A and suggests its exact catalog type", () => {
  const voicing = voicingSchema.parse({ ...shape, root: 9, frets: [5,7,7,6,0,0] });
  const error = validateVoicingNotes(major, voicing, seed.chords);
  assert.match(error!, /Зайві ноти: B\./);
  assert.match(error!, /Можливо, ви мали на увазі: Aadd9\./);
  assert.equal(validateVoicingNotes(seed.chords.find((chord) => chord.quality === "add9")!, voicing, seed.chords), null);
  assert.equal(validateVoicingNotes(major, voicing), "Зайві ноти: B.");
});

test("diagnostics list missing and extra notes without suggesting inexact matches", () => {
  const powerChord = voicingSchema.parse({ ...shape, root: 9, frets: [5,7,7,-1,-1,-1] });
  assert.match(validateVoicingNotes(major, powerChord, seed.chords)!, /Бракує нот: C#\./);
  const minor = voicingSchema.parse({ ...shape, root: 9, frets: [-1,0,2,2,1,0] });
  const error = validateVoicingNotes(major, minor, [{ ...major, quality: "" }]);
  assert.equal(error, "Зайві ноти: C. Бракує нот: C#.");
});

test("suggestions honor explicit bass and declared omissions", () => {
  const voicing = voicingSchema.parse({ ...shape, root: 9, bass: 4, frets: [5,7,7,6,0,0] });
  const error = validateVoicingNotes(major, voicing, seed.chords);
  assert.match(error!, /Найнижча звучна нота — A, але задано бас E\./);
  assert.doesNotMatch(error!, /Можливо/);
  const noFifth = voicingSchema.parse({ ...shape, root: 9, frets: [-1,0,-1,6,0,-1], omittedIntervals: [7] });
  assert.match(validateVoicingNotes(major, noFifth, [{ quality: "add9", intervals: [0,2,4,7], optionalIntervals: [7] }])!, /Aadd9/);
  assert.doesNotMatch(validateVoicingNotes(major, noFifth, [{ quality: "add9", intervals: [0,2,4,7], optionalIntervals: [] }])!, /Можливо/);
  assert.equal(validateVoicingNotes(major, { ...noFifth, omittedIntervals: [4] }, seed.chords), "Цей тип акорду не дозволяє зазначений пропуск нот");
});
