import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";

export async function POST(request: NextRequest) {
  await connectDB();
  try {
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ message: "ID групи обов'язковий" }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
    }

    const { username, email } = session.user;

    // Find invitation index
    const inviteIndex = group.invitations.findIndex((inv: any) => {
      if (inv.type === "telegram" && username) {
        const normalizedVal = inv.value.replace(/^@/, "").toLowerCase();
        const normalizedUser = username.replace(/^@/, "").toLowerCase();
        return normalizedVal === normalizedUser;
      }
      if (inv.type === "email" && email) {
        return inv.value.toLowerCase() === email.toLowerCase();
      }
      return false;
    });

    if (inviteIndex === -1) {
      return NextResponse.json({ message: "Запрошення не знайдено" }, { status: 404 });
    }

    // Remove invitation
    group.invitations.splice(inviteIndex, 1);

    await group.save();

    return NextResponse.json({ success: true, message: "Запрошення відхилено" });
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
