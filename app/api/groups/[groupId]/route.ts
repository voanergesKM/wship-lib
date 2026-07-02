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

    const group = await Group.findById(groupId)
      .populate("members.userId", "firstName username email photoUrl")
      .populate("invitations.invitedBy", "firstName username")
      .populate("createdBy", "firstName username");

    if (!group) {
      return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
    }

    // Check membership
    const isMember = group.members.some(
      (m: any) => m.userId?._id?.toString() === session.user.id
    );

    if (!isMember) {
      return NextResponse.json({ message: "Немає доступу до цієї групи" }, { status: 403 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Only owner can delete the group
    const ownerMember = group.members.find((m: any) => m.role === "owner");
    if (!ownerMember || ownerMember.userId.toString() !== session.user.id) {
      return NextResponse.json({ message: "Тільки власник може видалити групу" }, { status: 403 });
    }

    // Delete group and all of its lists
    await Promise.all([
      Group.findByIdAndDelete(groupId),
      SongList.deleteMany({ groupId }),
    ]);

    return NextResponse.json({ success: true, message: "Групу та її списки успішно видалено" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
