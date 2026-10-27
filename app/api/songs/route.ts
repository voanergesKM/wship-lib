import { recordActivitySafely } from "@/lib/activity/server";
import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { Song } from "@/models/Song";
import { normalizeYouTubeLinks } from "@/utils/youtubeLinks";
import { connectDB } from "@/lib/db";
import { getSongsList } from "@/lib/data/songs";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search")?.trim() || "";

    const result = await getSongsList({ page, limit, search });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching songs:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  await connectDB();

  try {
    const session = await getServerAuth();

    // if (!session?.user) {
    //   return NextResponse.json(
    //     { message: "Unauthorized: No session found" },
    //     { status: 401 },
    //   );
    // }

    const body = await request.json();

    const result = await Song.create({
      ...body,
      youtube: normalizeYouTubeLinks(body.youtube),
      createdBy: session?.user?.id ?? null,
    });

    try {
      revalidatePath("/");
      revalidatePath("/songs");
    } catch (err) {
      console.warn("revalidatePath error:", err);
    }

    await recordActivitySafely({
      action: "song.created",
      actorId: session.user?.id ?? null,
      targetId: String(result._id),
      targetLabel: String(result.title).slice(0, 200),
      payload: { slug: result.slug },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating song:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
