import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { SongList } from "@/models/SongList";

export async function GET(
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

    const list = await SongList.findOne({ _id: listId, groupId })
      .populate("songs")
      .populate("createdBy", "firstName username")
      .populate("updatedBy", "firstName username");

    if (!list) {
      return NextResponse.json({ message: "Список пісень не знайдено" }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching song list:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

export async function PATCH(
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

    const { name, songs } = await request.json();
    const updateData: any = { updatedBy: session.user.id };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ message: "Назва списку не може бути порожньою" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (songs !== undefined) {
      if (!Array.isArray(songs)) {
        return NextResponse.json({ message: "Список пісень має бути масивом" }, { status: 400 });
      }
      updateData.songs = songs;
    }

    const list = await SongList.findOneAndUpdate(
      { _id: listId, groupId },
      { $set: updateData },
      { new: true }
    ).populate("songs");

    if (!list) {
      return NextResponse.json({ message: "Список пісень не знайдено" }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error updating song list:", error);
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

    const result = await SongList.findOneAndDelete({ _id: listId, groupId });
    if (!result) {
      return NextResponse.json({ message: "Список пісень не знайдено" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Список пісень видалено" });
  } catch (error) {
    console.error("Error deleting song list:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
