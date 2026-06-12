import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { Song } from "@/models/Song";
import { normalizeYouTubeLinks } from "@/utils/youtubeLinks";
import { connectDB } from "@/lib/db";

type SongSearchQuery = {
  $or?: Array<
    | { title: { $regex: string; $options: string } }
    | { tags: { $in: RegExp[] } }
    | { authors: { $in: RegExp[] } }
    | { searchText: { $regex: string; $options: string } }
  >;
};

export async function GET(request: NextRequest) {
  await connectDB();

  try {
    const searchParams = request.nextUrl.searchParams;

    const page = Number(searchParams.get("page")) || 1;

    const limit = Number(searchParams.get("limit")) || 10;

    const search = searchParams.get("search")?.trim() || "";

    const query: SongSearchQuery = {};

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },

        {
          tags: {
            $in: [new RegExp(search, "i")],
          },
        },

        {
          authors: {
            $in: [new RegExp(search, "i")],
          },
        },

        {
          searchText: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [songs, total] = await Promise.all([
      Song.find(query)
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Song.countDocuments(query),
    ]);

    return NextResponse.json({
      data: songs,

      pagination: {
        page,
        limit,
        total,

        pages: Math.ceil(total / limit),
      },
    });
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating song:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
