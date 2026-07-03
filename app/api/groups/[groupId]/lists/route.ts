import { NextResponse } from "next/server";
import { chain } from "@/lib/api/composeRoute";
import { requireAuth, requireGroupAccess } from "@/lib/api/routeGuards";
import { SongList } from "@/models/SongList";

type GroupListsRouteParams = {
  groupId: string;
};

export const GET = chain<GroupListsRouteParams>()
  .use(requireAuth)
  .use(requireGroupAccess)
  .handler(async (_request, { params }) => {
    try {
      const { groupId } = params;

      const lists = await SongList.find({ groupId })
        .populate("createdBy", "firstName username")
        .sort({ createdAt: -1 });

      return NextResponse.json(lists);
    } catch (error) {
      console.error("Error fetching song lists:", error);
      return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
  });

export const POST = chain<GroupListsRouteParams>()
  .use(requireAuth)
  .use(requireGroupAccess)
  .handler(async (request, { params, session }) => {
    try {
      const { groupId } = params;
      const { name, songId } = await request.json();

      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { message: "Назва списку обов'язкова" },
          { status: 400 },
        );
      }

      const songs = songId ? [songId] : [];

      const list = await SongList.create({
        name: name.trim(),
        groupId,
        songs,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      });

      return NextResponse.json(list, { status: 201 });
    } catch (error) {
      console.error("Error creating song list:", error);
      return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
  });
