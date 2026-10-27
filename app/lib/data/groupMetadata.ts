import "server-only";

import { cache } from "react";
import { isObjectIdOrHexString } from "mongoose";
import { Group } from "@/models/Group";
import { SongList } from "@/models/SongList";
import { connectDB } from "../db";

// Link previews are public. Read only names here; membership, invitations and
// playlist contents remain behind the authorized readers in groups.ts.
export const getGroupShareInfo = cache(async (groupId: string) => {
  if (!isObjectIdOrHexString(groupId)) return null;
  await connectDB();
  const group: { name: string } | null = await Group.findById(groupId)
    .select("name -_id")
    .lean();
  return group;
});

export const getSongListShareInfo = cache(async (groupId: string, listId: string) => {
  if (!isObjectIdOrHexString(groupId) || !isObjectIdOrHexString(listId)) return null;
  await connectDB();
  const [group, list]: [{ name: string } | null, { name: string } | null] =
    await Promise.all([
      getGroupShareInfo(groupId),
      SongList.findOne({ _id: listId, groupId }).select("name -_id").lean(),
    ]);
  if (!group || !list) return null;
  return { name: list.name, groupName: group.name };
});
