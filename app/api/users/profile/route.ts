import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function PATCH(request: NextRequest) {
  await connectDB();

  try {
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email } = await request.json();
    if (typeof email !== "string") {
      return NextResponse.json(
        { message: "Invalid email" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedEmail) {
      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { message: "Невірний формат пошти" },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: session.user.id }
      });
      if (existingUser) {
        return NextResponse.json(
          { message: "Ця пошта вже прив'язана до іншого акаунту" },
          { status: 400 }
        );
      }
    }

    await User.findByIdAndUpdate(session.user.id, {
      email: trimmedEmail || null
    });

    return NextResponse.json({ success: true, email: trimmedEmail });
  } catch (error: any) {
    console.error("Error updating profile email:", error);
    return NextResponse.json(
      { message: "Помилка сервера" },
      { status: 500 }
    );
  }
}
