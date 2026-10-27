import { randomUUID } from "node:crypto";
import type { ClientSession } from "mongoose";
import { ChordDefinitionModel, ChordVoicingModel } from "@/models/ChordCatalog";
import { ChordRequestError } from "./server";
import {
  chordSymbols,
  intervalSignature,
  proposalSchema,
  validateVoicingNotes,
  voicingIdentity,
} from "./validation";
import type { ChordProposalInput } from "@/types/chords";

// Both direct admin saves and approvals use the same transactional write rules.
export async function applyChordChange(
  payload: ChordProposalInput,
  session: ClientSession,
) {
  const input = proposalSchema.parse(payload);
  let chordId = input.chordId;
  const definition =
    input.kind === "add-chord"
      ? input.definition
      : await ChordDefinitionModel.findById(chordId).session(session).lean();
  if (!definition)
    throw new ChordRequestError("Тип акорду більше не існує", 409);
  const error = validateVoicingNotes(definition, input.voicing);
  if (error) throw new ChordRequestError(error);
  if (input.kind === "add-chord") {
    chordId = randomUUID();
    await ChordDefinitionModel.create(
      [
        {
          ...definition,
          _id: chordId,
          symbols: chordSymbols(definition),
          intervalSignature: intervalSignature(definition.intervals),
        },
      ],
      { session },
    );
  }
  if (!chordId) throw new ChordRequestError("Не вказано тип акорду");
  const identity = voicingIdentity(chordId, input.voicing);
  if (input.kind === "edit-voicing") {
    const result = await ChordVoicingModel.updateOne(
      { _id: input.targetId, chordId, version: input.baseVersion },
      { $set: { ...input.voicing, identity }, $inc: { version: 1 } },
      { session },
    );
    if (result.modifiedCount !== 1)
      throw new ChordRequestError(
        "Аплікатура вже змінилася. Відкрийте актуальну версію та повторіть зміни",
        409,
      );
  } else {
    await ChordVoicingModel.create(
      [{ ...input.voicing, _id: randomUUID(), chordId, version: 1, identity }],
      { session },
    );
  }
  return { chordId };
}
