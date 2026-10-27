import { can } from "@/lib/permissions/catalog";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { Arrangement } from "@/models/Arrangement";
import { SongList } from "@/models/SongList";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; arrangementId: string }> },
) {
  const { arrangementId } = await params;
  await connectDB();

  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json(
      { error: "Необхідно авторизуватися" },
      { status: 401 },
    );
  }

  const arrangement = await Arrangement.findById(arrangementId);
  if (!arrangement) {
    return NextResponse.json(
      { error: "Структуру не знайдено" },
      { status: 404 },
    );
  }

  const isCreator =
    arrangement.createdBy &&
    arrangement.createdBy.toString() === session.user.id;
  const isAdmin = can(session.user, "songs.manage");

  if (!isCreator && !isAdmin) {
    return NextResponse.json(
      { error: "Недостатньо прав для редагування цієї структури" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { name, items } = body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Назва структури обов'язкова" },
          { status: 400 },
        );
      }
      arrangement.name = name.trim();
    }

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: "Структура має містити хоча б один блок" },
          { status: 400 },
        );
      }
      arrangement.items = items.map(
        (item: { section: string; repeat?: number }) => ({
          section: String(item.section).trim(),
          repeat:
            typeof item.repeat === "number" && item.repeat > 0
              ? item.repeat
              : 1,
        }),
      );
    }

    await arrangement.save();
    await arrangement.populate("createdBy", "firstName lastName username");

    return NextResponse.json(arrangement);
  } catch (error) {
    console.error("Error updating song arrangement:", error);
    return NextResponse.json(
      { error: "Не вдалося оновити структуру пісні" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; arrangementId: string }> },
) {
  const { arrangementId } = await params;
  await connectDB();

  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json(
      { error: "Необхідно авторизуватися" },
      { status: 401 },
    );
  }

  const arrangement = await Arrangement.findById(arrangementId);
  if (!arrangement) {
    return NextResponse.json(
      { error: "Структуру не знайдено" },
      { status: 404 },
    );
  }

  const isCreator =
    arrangement.createdBy &&
    arrangement.createdBy.toString() === session.user.id;
  const isAdmin = can(session.user, "songs.manage");

  if (!isCreator && !isAdmin) {
    return NextResponse.json(
      { error: "Недостатньо прав для видалення цієї структури" },
      { status: 403 },
    );
  }

  // Remove arrangement from any playlists that reference it
  await SongList.updateMany(
    { "songArrangements.arrangement": arrangementId },
    { $pull: { songArrangements: { arrangement: arrangementId } } },
  );

  await Arrangement.findByIdAndDelete(arrangementId);

  return NextResponse.json({ ok: true, message: "Структуру видалено" });
}
