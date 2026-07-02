import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";
import { User } from "@/models/User";

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

    const { type, value, role } = await request.json();
    if (!type || !value || !role) {
      return NextResponse.json(
        { message: "Тип, значення та роль обов'язкові" },
        { status: 400 }
      );
    }

    if (!["telegram", "email"].includes(type)) {
      return NextResponse.json({ message: "Недійсний тип запрошення" }, { status: 400 });
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ message: "Недійсна роль" }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
    }

    // Check if current user is owner or admin of the group
    const currentUserMember = group.members.find(
      (m: any) => m.userId.toString() === session.user.id
    );
    if (!currentUserMember || !["owner", "admin"].includes(currentUserMember.role)) {
      return NextResponse.json(
        { message: "У вас немає дозволу на надсилання запрошень у цій групі" },
        { status: 403 }
      );
    }

    const normalizedValue = value.trim().toLowerCase();

    // Check if the user is already a member
    let existingUser = null;
    if (type === "telegram") {
      const tgUsername = normalizedValue.replace(/^@/, "");
      existingUser = await User.findOne({ username: { $regex: new RegExp(`^${tgUsername}$`, "i") } });
    } else {
      existingUser = await User.findOne({ email: normalizedValue });
    }

    if (existingUser) {
      const isAlreadyMember = group.members.some(
        (m: any) => m.userId.toString() === existingUser._id.toString()
      );
      if (isAlreadyMember) {
        return NextResponse.json(
          { message: "Цей користувач вже є учасником групи" },
          { status: 400 }
        );
      }
    }

    // Check if invitation already exists
    const isAlreadyInvited = group.invitations.some((inv: any) => {
      if (inv.type !== type) return false;
      const invVal = inv.value.replace(/^@/, "").toLowerCase();
      const checkVal = normalizedValue.replace(/^@/, "").toLowerCase();
      return invVal === checkVal;
    });

    if (isAlreadyInvited) {
      return NextResponse.json(
        { message: "Цого користувача вже запрошено" },
        { status: 400 }
      );
    }

    // Add invitation
    group.invitations.push({
      type,
      value: type === "telegram" && !normalizedValue.startsWith("@") ? `@${normalizedValue}` : normalizedValue,
      role,
      invitedBy: session.user.id,
      createdAt: new Date(),
    });

    await group.save();

    return NextResponse.json({ success: true, message: "Запрошення надіслано" });
  } catch (error) {
    console.error("Error creating invitation:", error);
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

    const { type, value } = await request.json();
    if (!type || !value) {
      return NextResponse.json(
        { message: "Тип та значення запрошення обов'язкові" },
        { status: 400 }
      );
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ message: "Групу не знайдено" }, { status: 404 });
    }

    // Check permissions
    const currentUserMember = group.members.find(
      (m: any) => m.userId.toString() === session.user.id
    );
    if (!currentUserMember || !["owner", "admin"].includes(currentUserMember.role)) {
      return NextResponse.json({ message: "У вас немає дозволу на скасування запрошень" }, { status: 403 });
    }

    const valToCompare = value.trim().toLowerCase();

    group.invitations = group.invitations.filter((inv: any) => {
      const invVal = inv.value.toLowerCase();
      return !(inv.type === type && invVal === valToCompare);
    });

    await group.save();
    return NextResponse.json({ success: true, message: "Запрошення скасовано" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
