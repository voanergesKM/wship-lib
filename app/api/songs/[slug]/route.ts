import { recordActivitySafely } from "@/lib/activity/server";
import { can } from "@/lib/permissions/catalog";
import { getSongBySlug } from "@/lib/data/songs";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Song } from "@/models/Song";
import { SongList } from "@/models/SongList";
import { Arrangement } from "@/models/Arrangement";
import { SongProposal } from "@/models/SongProposal";
import { normalizeYouTubeLinks } from "@/utils/youtubeLinks";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const song = await getSongBySlug(slug);

  if (!song) {
    return NextResponse.json({ error: " пісню не знайдено" }, { status: 404 });
  }

  return NextResponse.json(song);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  await connectDB();

  try {
    const session = await getServerAuth();
    if (!session.user)
      return NextResponse.json(
        { error: "Необхідно авторизуватися" },
        { status: 401 },
      );
    const body = await request.json();
    const song = await Song.findOne({ slug });

    if (!song) {
      return NextResponse.json(
        { error: " пісню не знайдено" },
        { status: 404 },
      );
    }

    if (
      song.createdBy?.toString() !== session.user.id &&
      !can(session.user, "songs.manage")
    ) {
      return NextResponse.json(
        { error: "Недостатньо прав для редагування пісні" },
        { status: 403 },
      );
    }

    song.title = body.title;
    song.tags = body.tags;
    song.authors = body.authors;
    song.document = body.document;
    song.youtube = normalizeYouTubeLinks(body.youtube);
    song.visibility = body.visibility;
    song.updatedBy = session?.user?.id ?? null;
    song.key = body.key || undefined;
    song.bpm = body.bpm || undefined;

    await song.save();
    await recordActivitySafely({
      action: "song.updated",
      actorId: session.user.id,
      targetId: String(song._id),
      targetLabel: String(song.title).slice(0, 200),
      payload: { slug: song.slug },
    });

    return NextResponse.json(song);
  } catch (error) {
    console.error("Error updating song:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  await connectDB();

  try {
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json(
        { message: "Необхідно авторизуватися" },
        { status: 401 },
      );
    }

    if (!can(session.user, "songs.manage")) {
      return NextResponse.json(
        { message: "Тільки адміністратор може видаляти пісні" },
        { status: 403 },
      );
    }

    const song = await Song.findOne({ slug });

    if (!song) {
      return NextResponse.json(
        { message: "Пісню не знайдено" },
        { status: 404 },
      );
    }

    // 1. Remove song and its arrangements from all SongLists
    await SongList.updateMany(
      { $or: [{ songs: song._id }, { "songArrangements.song": song._id }] },
      {
        $pull: {
          songs: song._id,
          songArrangements: { song: song._id },
        },
      },
    );

    // 2. Delete arrangements associated with this song
    await Arrangement.deleteMany({ song: song._id });

    // 3. Delete edit proposals associated with this song
    await SongProposal.deleteMany({ song: song._id });

    // 4. Delete the song itself
    await Song.deleteOne({ _id: song._id });
    await recordActivitySafely({
      action: "song.deleted",
      actorId: session.user.id,
      targetId: String(song._id),
      targetLabel: String(song.title).slice(0, 200),
      payload: { slug: song.slug },
    });

    try {
      revalidatePath("/");
      revalidatePath("/songs");
    } catch (err) {
      console.warn("revalidatePath error:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Пісню та посилання на неї успішно видалено",
    });
  } catch (error) {
    console.error("Error deleting song:", error);

    return NextResponse.json(
      { message: "Помилка сервера при видаленні пісні" },
      { status: 500 },
    );
  }
}
