import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberUserId: string }> }
) {
  await connectDB();
  try {
    const { groupId, memberUserId } = await params;
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
    }

    const currentUserId = session.user.id;

    // Check if the current user is a member
    const currentUserMember = group.members.find(
      (m: any) => m.userId.toString() === currentUserId
    );
    if (!currentUserMember) {
      return NextResponse.json({ message: "Ви не є учасником цієї групи" }, { status: 403 });
    }

    const targetUserMember = group.members.find(
      (m: any) => m.userId.toString() === memberUserId
    );
    if (!targetUserMember) {
      return NextResponse.json({ message: "Учасника не знайдено в групі" }, { status: 404 });
    }

    const isLeaving = currentUserId === memberUserId;

    if (isLeaving) {
      // User is leaving the group
      if (currentUserMember.role === "owner") {
        return NextResponse.json(
          { message: "Власник не може вийти з групи. Ви можете видалити її." },
          { status: 400 }
        );
      }
    } else {
      // Admin/Owner is removing another member
      if (!["owner", "admin"].includes(currentUserMember.role)) {
        return NextResponse.json(
          { message: "У вас немає дозволу на видалення учасників" },
          { status: 403 }
        );
      }

      if (targetUserMember.role === "owner") {
        return NextResponse.json(
          { message: "Не можна видалити власника групи" },
          { status: 403 }
        );
      }

      if (currentUserMember.role === "admin" && targetUserMember.role === "admin") {
        return NextResponse.json(
          { message: "Адміністратор не може видалити іншого адміністратора" },
          { status: 403 }
        );
      }
    }

    // Perform removal
    group.members = group.members.filter(
      (m: any) => m.userId.toString() !== memberUserId
    );

    await group.save();

    return NextResponse.json({
      success: true,
      message: isLeaving ? "Ви вийшли з групи" : "Учасника видалено",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
