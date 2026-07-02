import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";

export async function GET() {
  await connectDB();
  try {
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const userId = session.user.id;

    // Find all groups where the user is a member
    const groups = await Group.find({
      "members.userId": userId,
    })
      .populate("members.userId", "firstName username email photoUrl")
      .populate("createdBy", "firstName username")
      .sort({ createdAt: -1 });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await connectDB();
  try {
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ message: "Назва групи обов'язкова" }, { status: 400 });
    }

    const group = await Group.create({
      name: name.trim(),
      createdBy: session.user.id,
      members: [
        {
          userId: session.user.id,
          role: "owner",
        },
      ],
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
