import { NextResponse } from "next/server";
import { chain } from "@/lib/api/composeRoute";
import { requireAuth, requireGroupAccess } from "@/lib/api/routeGuards";
import { SongList } from "@/models/SongList";

type ListRouteParams = {
  groupId: string;
  listId: string;
};

export const GET = chain<ListRouteParams>()
  .use(requireAuth)
  .use(requireGroupAccess)
  .handler(async (_request, { params }) => {
    try {
      const { groupId, listId } = params;

      const list = await SongList.findOne({ _id: listId, groupId })
        .populate("songs")
        .populate("createdBy", "firstName username")
        .populate("updatedBy", "firstName username");

      if (!list) {
        return NextResponse.json(
          { message: "Список пісень не знайдено" },
          { status: 404 },
        );
      }

      return NextResponse.json(list);
    } catch (error) {
      console.error("Error fetching song list:", error);
      return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
  });

export const PATCH = chain<ListRouteParams>()
  .use(requireAuth)
  .use(requireGroupAccess)
  .handler(async (request, { params, session }) => {
    try {
      const { groupId, listId } = params;
      const { name, songs } = await request.json();
      const updateData: {
        updatedBy: string;
        name?: string;
        songs?: unknown[];
      } = { updatedBy: session.user.id };

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          return NextResponse.json(
            { message: "Назва списку не може бути порожньою" },
            { status: 400 },
          );
        }
        updateData.name = name.trim();
      }

      if (songs !== undefined) {
        if (!Array.isArray(songs)) {
          return NextResponse.json(
            { message: "Список пісень має бути масивом" },
            { status: 400 },
          );
        }
        updateData.songs = songs;
      }

      const list = await SongList.findOneAndUpdate(
        { _id: listId, groupId },
        { $set: updateData },
        { new: true },
      ).populate("songs");

      if (!list) {
        return NextResponse.json(
          { message: "Список пісень не знайдено" },
          { status: 404 },
        );
      }

      return NextResponse.json(list);
    } catch (error) {
      console.error("Error updating song list:", error);
      return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
  });

export const DELETE = chain<ListRouteParams>()
  .use(requireAuth)
  .use(requireGroupAccess)
  .handler(async (_request, { params }) => {
    try {
      const { groupId, listId } = params;

      const result = await SongList.findOneAndDelete({ _id: listId, groupId });
      if (!result) {
        return NextResponse.json(
          { message: "Список пісень не знайдено" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Список пісень видалено",
      });
    } catch (error) {
      console.error("Error deleting song list:", error);
      return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
    }
  });
