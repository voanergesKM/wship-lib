import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { SongProposal } from "@/models/SongProposal";
import "@/models/User";
import { notificationService } from "@/services/notification.service";
import { normalizeYouTubeLinks } from "@/utils/youtubeLinks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; proposalId: string }> },
) {
  const { proposalId } = await params;
  await connectDB();

  const proposal = await SongProposal.findById(proposalId)
    .populate("user", "firstName lastName username photoUrl")
    .populate("reviewedBy", "firstName lastName username");

  if (!proposal) {
    return NextResponse.json(
      { error: "Пропозицію не знайдено" },
      { status: 404 },
    );
  }

  return NextResponse.json(proposal);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; proposalId: string }> },
) {
  const { proposalId } = await params;
  await connectDB();

  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json(
      { error: "Необхідно авторизуватися" },
      { status: 401 },
    );
  }

  const proposal = await SongProposal.findById(proposalId);
  if (!proposal) {
    return NextResponse.json(
      { error: "Пропозицію не знайдено" },
      { status: 404 },
    );
  }

  // Only the author can edit their proposal
  if (proposal.user.toString() !== session.user.id) {
    return NextResponse.json(
      { error: "Недостатньо прав для редагування цієї пропозиції" },
      { status: 403 },
    );
  }

  if (proposal.status !== "pending") {
    return NextResponse.json(
      { error: "Можна редагувати лише активні пропозиції у статусі очікування" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();

    if (body.title) proposal.proposedData.title = body.title;
    if (body.document) proposal.proposedData.document = body.document;
    if (Array.isArray(body.tags)) proposal.proposedData.tags = body.tags;
    if (Array.isArray(body.authors)) proposal.proposedData.authors = body.authors;
    proposal.proposedData.key = body.key || undefined;
    proposal.proposedData.bpm = body.bpm ? Number(body.bpm) : undefined;
    if (body.youtube) {
      proposal.proposedData.youtube = normalizeYouTubeLinks(body.youtube);
    }
    if (body.visibility) proposal.proposedData.visibility = body.visibility;
    if (body.comment !== undefined) proposal.comment = body.comment.trim();

    await proposal.save();

    // Notify author/admins about the update
    notificationService
      .notifyProposalCreatedOrUpdated({
        proposalId: proposal._id.toString(),
        isUpdate: true,
      })
      .catch((err) =>
        console.error("Error triggering proposal update notification:", err),
      );

    const populatedProposal = await SongProposal.findById(proposal._id)
      .populate("user", "firstName lastName username photoUrl");

    return NextResponse.json(populatedProposal);
  } catch (error) {
    console.error("Error updating song proposal:", error);
    return NextResponse.json(
      { error: "Не вдалося оновити пропозицію" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; proposalId: string }> },
) {
  const { proposalId } = await params;
  await connectDB();

  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json(
      { error: "Необхідно авторизуватися" },
      { status: 401 },
    );
  }

  const proposal = await SongProposal.findById(proposalId);
  if (!proposal) {
    return NextResponse.json(
      { error: "Пропозицію не знайдено" },
      { status: 404 },
    );
  }

  const isAuthor = proposal.user.toString() === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { error: "Недостатньо прав для видалення цієї пропозиції" },
      { status: 403 },
    );
  }

  await SongProposal.findByIdAndDelete(proposalId);

  return NextResponse.json({ ok: true, message: "Пропозицію скасовано" });
}
