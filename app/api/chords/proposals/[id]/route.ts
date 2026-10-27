import { can } from "@/lib/permissions/catalog";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { ChordProposalModel } from "@/models/ChordCatalog";
import { chordApiError, ChordRequestError } from "@/lib/chords/server";
import { applyChordChange } from "@/lib/chords/applyChange";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getServerAuth();
    if (!user) throw new ChordRequestError("Необхідно авторизуватися", 401);
    const { action, comment } = z
      .object({
        action: z.enum(["approve", "reject", "cancel"]),
        comment: z.string().trim().max(1000).default(""),
      })
      .strict()
      .parse(await request.json());
    if (action !== "cancel" && !can(user, "chords.proposals.review"))
      throw new ChordRequestError(
        "Розглядати пропозиції може лише адміністратор",
        403,
      );
    await connectDB();
    const { id } = await params;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const proposal = await ChordProposalModel.findById(id).session(session);
        if (!proposal)
          throw new ChordRequestError("Пропозицію не знайдено", 404);
        if (action === "cancel" && proposal.userId !== user.id)
          throw new ChordRequestError(
            "Можна скасувати лише власну пропозицію",
            403,
          );
        if (proposal.status !== "pending")
          throw new ChordRequestError(
            "Пропозицію вже розглянуто або скасовано",
            409,
          );
        if (action === "approve") {
          await applyChordChange(proposal.input, session);
        }
        proposal.status =
          action === "approve"
            ? "approved"
            : action === "reject"
              ? "rejected"
              : "cancelled";
        proposal.reviewedBy = user.id;
        proposal.reviewedAt = new Date();
        proposal.reviewComment = comment;
        await proposal.save({ session });
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return chordApiError(error);
  }
}
