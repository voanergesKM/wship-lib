import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { recordSongView } from "@/lib/activity/songView";
import { adminErrorResponse } from "@/lib/admin/errors";
export async function POST(request: Request) {
  try {
    const { user } = await getServerAuth();
    if (!user)
      return NextResponse.json(
        { error: "Необхідно авторизуватися" },
        { status: 401 },
      );
    if (Number(request.headers.get("content-length")) > 4096)
      return new Response(null, { status: 413 });
    const text = await request.text();
    if (text.length > 4096) return new Response(null, { status: 413 });
    await recordSongView(user.id, JSON.parse(text));
    return new Response(null, { status: 204 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
