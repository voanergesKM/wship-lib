import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ChordDefinitionModel, ChordVoicingModel } from "@/models/ChordCatalog";
import { chordSymbols, intervalSignature, validateVoicingNotes, voicingIdentity } from "./validation";
import type { ChordDefinition, ChordProposalInput, VoicingTemplate } from "@/types/chords";
export class ChordRequestError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function checkProposal(input: ChordProposalInput) {
  let definition: ChordDefinition;
  let before: VoicingTemplate | undefined;
  if (input.kind === "add-chord" && input.definition) {
    definition = { ...input.definition, _id: "new" };
    if (await ChordDefinitionModel.exists({ $or: [{ symbols: { $in: chordSymbols(definition) } }, { intervalSignature: intervalSignature(definition.intervals) }] })) throw new ChordRequestError("Такий тип або альтернативне позначення вже існує", 409);
  } else {
    const existing = await ChordDefinitionModel.findById(input.chordId).lean();
    if (!existing) throw new ChordRequestError("Тип акорду не знайдено", 404);
    definition = existing;
  }
  const error = validateVoicingNotes(definition, input.voicing);
  if (error) {
    const catalog = await ChordDefinitionModel.find().select("quality intervals optionalIntervals").lean();
    throw new ChordRequestError(validateVoicingNotes(definition, input.voicing, catalog) ?? error);
  }
  if (input.kind === "edit-voicing") {
    const existing = await ChordVoicingModel.findById(input.targetId).lean();
    if (!existing || existing.chordId !== input.chordId) throw new ChordRequestError("Аплікатуру не знайдено", 404);
    if (existing.version !== input.baseVersion) throw new ChordRequestError("Аплікатура вже змінилася. Відкрийте актуальну версію та створіть нову пропозицію", 409);
    before = existing;
  }
  if (input.kind !== "add-chord" && await ChordVoicingModel.exists({ identity: voicingIdentity(definition._id, input.voicing), ...(input.targetId ? { _id: { $ne: input.targetId } } : {}) })) throw new ChordRequestError("Така аплікатура вже існує; запропонуйте редагування наявної", 409);
  return { definition, before };
}
export function chordApiError(error: unknown) {
  if (error instanceof ChordRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(". ") }, { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Некоректний JSON" }, { status: 400 });
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) return NextResponse.json({ error: "Такий тип, альтернативне позначення або аплікатура вже існує" }, { status: 409 });
  console.error("Chord catalog request failed", error);
  return NextResponse.json({ error: "Не вдалося виконати дію. Спробуйте ще раз" }, { status: 500 });
}
