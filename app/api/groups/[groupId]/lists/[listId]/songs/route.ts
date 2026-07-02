import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { SongList } from "@/models/SongList";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; listId: string }> }
) {
  await connectDB();
  try {
    const { groupId, listId } = await params;
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
    }

    const isMember = group.members.some(
      (m: any) => m.userId.toString() === session.user.id
    );
    if (!isMember) {
      return NextResponse.json({ message: "Немає доступу до цієї групи" }, { status: 403 });
    }

    const { songId } = await request.json();
    if (!songId) {
      return NextResponse.json({ message: "ID пісні обов'язковий" }, { status: 400 });
    }

    const list = await SongList.findOne({ _id: listId, groupId });
    if (!list) {
      return NextResponse.json({ message: "Список пісень не знайдено" }, { status: 404 });
    }

    // Check if song already exists in the list to avoid duplicate
    const exists = list.songs.some((s: any) => s.toString() === songId);
    if (exists) {
      return NextResponse.json({ message: "Пісня вже є у списку" }, { status: 400 });
    }

    list.songs.push(songId);
    list.updatedBy = session.user.id;
    await list.save();

    return NextResponse.json({ success: true, message: "Пісню додано до списку" });
  } catch (error) {
    console.error("Error adding song to list:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; listId: string }> }
) {
  await connectDB();
  try {
    const { groupId, listId } = await params;
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
    }

    const isMember = group.members.some(
      (m: any) => m.userId.toString() === session.user.id
    );
    if (!isMember) {
      return NextResponse.json({ message: "Немає доступу до цієї групи" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const songId = searchParams.get("songId");
    if (!songId) {
      return NextResponse.json({ message: "ID пісні обов'язковий" }, { status: 400 });
    }

    const list = await SongList.findOne({ _id: listId, groupId });
    if (!list) {
      return NextResponse.json({ message: "Список пісень не знайдено" }, { status: 404 });
    }

    const initialLength = list.songs.length;
    list.songs = list.songs.filter((s: any) => s.toString() !== songId);

    if (list.songs.length === initialLength) {
      return NextResponse.json({ message: "Пісню не знайдено у списку" }, { status: 404 });
    }

    list.updatedBy = session.user.id;
    await list.save();

    return NextResponse.json({ success: true, message: "Пісню видалено зі списку" });
  } catch (error) {
    console.error("Error removing song from list:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
