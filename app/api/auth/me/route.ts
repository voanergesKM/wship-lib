// Файл: app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { UserPreference } from "@/models/UserPreference";
import { DEFAULT_SONG_DISPLAY_PREFERENCES } from "@/types/user-preferences";

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

    const preference = await UserPreference.findOne({ userId: dbUser._id }).lean();

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
        preferences: {
          version: 1,
          songDisplay: {
            ...DEFAULT_SONG_DISPLAY_PREFERENCES,
            ...preference?.songDisplay,
          },
        },
      },
    });
  } catch (err: unknown) {
    console.error("❌ [API /auth/me Error]:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { authenticated: false, error: "Session expired or invalid" },
      { status: 401 },
    );
  }
}
