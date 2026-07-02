// Файл: app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 },
      );
    }

    const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, jwtSecret);

    await connectDB();

    const dbUser = await User.findById(payload.userId).select("-password");

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          error: "The user is not found or disabled",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser._id,
        telegramId: dbUser.telegramId,
        firstName: dbUser.firstName,
        username: dbUser.username,
        role: dbUser.role,
        photoUrl: dbUser.photoUrl,
        email: dbUser.email || null,
      },
    });
  } catch (err: any) {
    console.error("❌ [API /auth/me Error]:", err.message || err);
    return NextResponse.json(
      { authenticated: false, error: "Session expired or invalid" },
      { status: 401 },
    );
  }
}
