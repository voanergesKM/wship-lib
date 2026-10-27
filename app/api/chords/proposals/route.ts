import { recordActivity, recordActivitySafely } from "@/lib/activity/server";
import { can } from "@/lib/permissions/catalog";
import mongoose from "mongoose";
import { applyChordChange } from "@/lib/chords/applyChange";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { ChordProposalModel } from "@/models/ChordCatalog";
import { proposalSchema } from "@/lib/chords/validation";
import { checkProposal, chordApiError } from "@/lib/chords/server";
export async function GET() {
  try {
    const { user } = await getServerAuth();
    if (!user)
      return NextResponse.json(
        { error: "Увійдіть у свій обліковий запис" },
        { status: 401 },
      );
    await connectDB();
    const proposals = await ChordProposalModel.find(
      can(user, "chords.proposals.review") ? {} : { userId: user.id },
    )
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ proposals });
  } catch (error) {
    return chordApiError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const { user } = await getServerAuth();
    if (!user)
      return NextResponse.json(
        { error: "Увійдіть, щоб запропонувати зміни" },
        { status: 401 },
      );
    const input = proposalSchema.parse(await request.json());
    await connectDB();
    const { definition, before } = await checkProposal(input);
    const record = {
      _id: randomUUID(),
      userId: user.id,
      authorName: user.firstName || user.username || "Користувач",
      status: "pending" as const,
      input,
      before,
      definitionSnapshot: definition,
    };
    if (can(user, "chords.manage")) {
      const session = await mongoose.startSession();
      try {
        const proposal = await session.withTransaction(async () => {
          const { chordId } = await applyChordChange(input, session);
          const [saved] = await ChordProposalModel.create(
            [
              {
                ...record,
                status: "approved",
                reviewedBy: user.id,
                reviewedAt: new Date(),
                reviewComment: "Пряма зміна адміністратора",
              },
            ],
            { session },
          );
          await recordActivity(
            {
              action: "chord.changed",
              actorId: user.id,
              targetId: chordId,
              targetLabel: definition.name.slice(0, 200),
              payload: {},
            },
            { session },
          );
          return saved;
        });
        return NextResponse.json(proposal, { status: 201 });
      } finally {
        await session.endSession();
      }
    }
    const proposal = await ChordProposalModel.create(record);
    await recordActivitySafely({
      action: "chord.proposal.submitted",
      actorId: user.id,
      targetId: proposal._id,
      targetLabel: definition.name.slice(0, 200),
      payload: input.chordId ? { chordId: input.chordId } : {},
    });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return chordApiError(error);
  }
}
