import { recordActivitySafely } from "@/lib/activity/server";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Song } from "@/models/Song";
import { Arrangement } from "@/models/Arrangement";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  await connectDB();

  const song = await Song.findOne({ slug });
  if (!song) {
    return NextResponse.json({ error: "Пісню не знайдено" }, { status: 404 });
  }

  const arrangements = await Arrangement.find({ song: song._id })
    .populate("createdBy", "firstName lastName username")
    .sort({ createdAt: 1 });

  return NextResponse.json({ arrangements });
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

  try {
    const body = await request.json();
    const { name, items } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Назва структури обов'язкова" },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Структура має містити хоча б один блок" },
        { status: 400 },
      );
    }

    const sanitizedItems = items.map(
      (item: { section: string; repeat?: number }) => ({
        section: String(item.section).trim(),
        repeat:
          typeof item.repeat === "number" && item.repeat > 0 ? item.repeat : 1,
      }),
    );

    const arrangement = await Arrangement.create({
      song: song._id,
      name: name.trim(),
      items: sanitizedItems,
      createdBy: session.user.id,
    });

    await recordActivitySafely({
      action: "arrangement.created",
      actorId: session.user.id,
      targetId: String(arrangement._id),
      targetLabel: String(arrangement.name).slice(0, 200),
      payload: { songId: String(song._id) },
    });
    return NextResponse.json(arrangement, { status: 201 });
  } catch (error) {
    console.error("Error creating song arrangement:", error);
    return NextResponse.json(
      { error: "Не вдалося зберегти структуру пісні" },
      { status: 500 },
    );
  }
}
