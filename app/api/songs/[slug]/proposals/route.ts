import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Song } from "@/models/Song";
import { SongProposal } from "@/models/SongProposal";
import "@/models/User";
import { notificationService } from "@/services/notification.service";
import { normalizeYouTubeLinks } from "@/utils/youtubeLinks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  await connectDB();

  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ proposals: [] });
  }

  const song = await Song.findOne({ slug });
  if (!song) {
    return NextResponse.json({ error: "Пісню не знайдено" }, { status: 404 });
  }

  const isOwnerOrAdmin =
    song.createdBy?.toString() === session.user.id ||
    session.user.role === "admin";

  // Owner/Admin sees all proposals; regular users see only their own proposals
  const query = isOwnerOrAdmin
    ? { song: song._id }
    : { song: song._id, user: session.user.id };

  const proposals = await SongProposal.find(query)
    .populate("user", "firstName lastName username photoUrl")
    .populate("reviewedBy", "firstName lastName username")
    .sort({ createdAt: -1 });

  return NextResponse.json({ proposals, isOwnerOrAdmin });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
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

  // Check if user already has an active pending proposal
  const existingPending = await SongProposal.findOne({
    song: song._id,
    user: session.user.id,
    status: "pending",
  });

  if (existingPending) {
    return NextResponse.json(
      {
        error:
          "У вас вже є активна пропозиція, яка очікує розгляду. Ви можете відредагувати її.",
        proposalId: existingPending._id.toString(),
      },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();

    if (!body.title || !body.document) {
      return NextResponse.json(
        { error: "Назва та текст пісні є обов'язковими" },
        { status: 400 },
      );
    }

    const proposal = await SongProposal.create({
      song: song._id,
      user: session.user.id,
      status: "pending",
      comment: body.comment?.trim() || undefined,
      proposedData: {
        title: body.title,
        tags: Array.isArray(body.tags) ? body.tags : [],
        authors: Array.isArray(body.authors) ? body.authors : [],
        key: body.key || undefined,
        bpm: body.bpm ? Number(body.bpm) : undefined,
        youtube: normalizeYouTubeLinks(body.youtube || []),
        visibility: body.visibility || "public",
        document: body.document,
      },
    });

    // Notify in background
    notificationService
      .notifyProposalCreatedOrUpdated({
        proposalId: proposal._id.toString(),
        isUpdate: false,
      })
      .catch((err) =>
        console.error("Error triggering proposal notification:", err),
      );

    const populatedProposal = await SongProposal.findById(proposal._id)
      .populate("user", "firstName lastName username photoUrl");

    return NextResponse.json(populatedProposal, { status: 201 });
  } catch (error) {
    console.error("Error creating song proposal:", error);
    return NextResponse.json(
      { error: "Не вдалося зберегти пропозицію" },
      { status: 500 },
    );
  }
}
