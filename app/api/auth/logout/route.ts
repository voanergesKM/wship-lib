import { recordActivitySafely } from "@/lib/activity/server";
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const { user } = await getServerAuth();
    const cookieStore = await cookies();

    cookieStore.delete("session_token");
    if (user) {
      await recordActivitySafely({
        action: "auth.logout",
        actorId: user.id,
        targetId: String(user.id),
        payload: {},
      });
    }

    return NextResponse.json({
      success: true,
      message: "Session logged out successfully",
    });
  } catch (err: any) {
    console.error("❌ [API /auth/logout Error]:", err.message || err);
    return NextResponse.json({ error: "Unable to log out" }, { status: 500 });
  }
}
