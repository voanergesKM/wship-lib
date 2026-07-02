import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { SongList } from "@/models/SongList";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  await connectDB();
  try {
    const { groupId } = await params;
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

    const lists = await SongList.find({ groupId })
      .populate("createdBy", "firstName username")
      .sort({ createdAt: -1 });

    return NextResponse.json(lists);
  } catch (error) {
    console.error("Error fetching song lists:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  await connectDB();
  try {
    const { groupId } = await params;
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

    const { name, songId } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ message: "Назва списку обов'язкова" }, { status: 400 });
    }

    const songs = songId ? [songId] : [];

    const list = await SongList.create({
      name: name.trim(),
      groupId,
      songs,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error("Error creating song list:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
