import { recordActivitySafely } from "@/lib/activity/server";
import { can } from "@/lib/permissions/catalog";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Song } from "@/models/Song";
import { SongProposal } from "@/models/SongProposal";
import "@/models/User";
import { notificationService } from "@/services/notification.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; proposalId: string }> },
) {
  const { slug, proposalId } = await params;
  await connectDB();

  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json(
      { error: "Необхідно авторизуватися" },
      { status: 401 },
    );
  }

  const song = await Song.findOne({ slug });
  if (!song) {
    return NextResponse.json({ error: "Пісню не знайдено" }, { status: 404 });
  }

  const isOwner = song.createdBy?.toString() === session.user.id;
  const isAdmin = can(session.user, "songs.proposals.review");

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      {
        error:
          "Тільки автор пісні або адміністратор можуть розглядати пропозиції",
      },
      { status: 403 },
    );
  }

  const proposal = await SongProposal.findById(proposalId);
  if (!proposal) {
    return NextResponse.json(
      { error: "Пропозицію не знайдено" },
      { status: 404 },
    );
  }

  if (proposal.status !== "pending") {
    return NextResponse.json(
      { error: "Ця пропозиція вже була розглянута раніше" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const action = body.action as "approve" | "reject";
    const comment = body.comment as string | undefined;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Некоректна дія. Очікується 'approve' або 'reject'" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      // Apply proposed data to song
      song.title = proposal.proposedData.title;
      song.tags = proposal.proposedData.tags;
      song.authors = proposal.proposedData.authors;
      song.key = proposal.proposedData.key;
      song.bpm = proposal.proposedData.bpm;
      song.youtube = proposal.proposedData.youtube;
      song.visibility = proposal.proposedData.visibility;
      song.document = proposal.proposedData.document;
      song.updatedBy = session.user.id;
      await song.save();

      // Update proposal status
      proposal.status = "approved";
      proposal.reviewedBy = session.user.id;
      proposal.reviewedAt = new Date();
      proposal.reviewComment = comment?.trim() || undefined;
      await proposal.save();
      await recordActivitySafely({
        action: "song.proposal.approved",
        actorId: session.user.id,
        targetId: String(proposal._id),
        targetLabel: String(song.title).slice(0, 200),
        payload: { songId: String(song._id) },
      });

      // Send Telegram notification
      notificationService
        .notifyProposalReviewed({
          proposalId: proposal._id.toString(),
          action: "approve",
        })
        .catch((err) =>
          console.error("Error triggering review notification:", err),
        );

      const populatedProposal = await SongProposal.findById(proposal._id)
        .populate("user", "firstName lastName username photoUrl")
        .populate("reviewedBy", "firstName lastName username");

      return NextResponse.json({
        ok: true,
        action: "approved",
        proposal: populatedProposal,
        song,
      });
    } else {
      // Reject proposal
      proposal.status = "rejected";
      proposal.reviewedBy = session.user.id;
      proposal.reviewedAt = new Date();
      proposal.reviewComment = comment?.trim() || undefined;
      await proposal.save();
      await recordActivitySafely({
        action: "song.proposal.rejected",
        actorId: session.user.id,
        targetId: String(proposal._id),
        targetLabel: String(song.title).slice(0, 200),
        payload: { songId: String(song._id) },
      });

      // Send Telegram notification
      notificationService
        .notifyProposalReviewed({
          proposalId: proposal._id.toString(),
          action: "reject",
          reason: comment?.trim() || undefined,
        })
        .catch((err) =>
          console.error("Error triggering review notification:", err),
        );

      const populatedProposal = await SongProposal.findById(proposal._id)
        .populate("user", "firstName lastName username photoUrl")
        .populate("reviewedBy", "firstName lastName username");

      return NextResponse.json({
        ok: true,
        action: "rejected",
        proposal: populatedProposal,
      });
    }
  } catch (error) {
    console.error("Error reviewing song proposal:", error);
    return NextResponse.json(
      { error: "Не вдалося зберегти рішення щодо пропозиції" },
      { status: 500 },
    );
  }
}
