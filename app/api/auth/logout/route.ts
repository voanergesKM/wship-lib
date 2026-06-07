import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("session_token");

    return NextResponse.json({
      success: true,
      message: "Session logged out successfully",
    });
  } catch (err: any) {
    console.error("❌ [API /auth/logout Error]:", err.message || err);
    return NextResponse.json({ error: "Unable to log out" }, { status: 500 });
  }
}
