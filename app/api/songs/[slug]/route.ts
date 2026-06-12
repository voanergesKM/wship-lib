import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Song } from "@/models/Song";
import { normalizeYouTubeLinks } from "@/utils/youtubeLinks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  await connectDB();

  const song = await Song.findOne({ slug });

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
    const body = await request.json();
    const song = await Song.findOne({ slug });

    if (!song) {
      return NextResponse.json(
        { error: " пісню не знайдено" },
        { status: 404 },
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

    return NextResponse.json(song);
  } catch (error) {
    console.error("Error updating song:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
