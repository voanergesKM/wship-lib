import "server-only";

import { cache } from "react";
import { createHash } from "node:crypto";
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

export const getSongListShareInfo = cache(
  async (groupId: string, listId: string) => {
    if (!isObjectIdOrHexString(groupId) || !isObjectIdOrHexString(listId))
      return null;
    await connectDB();
    const [group, list]: [{ name: string } | null, { name: string } | null] =
      await Promise.all([
        getGroupShareInfo(groupId),
        SongList.findOne({ _id: listId, groupId }).select("name -_id").lean(),
      ]);
    if (!group || !list) return null;
    return { name: list.name, groupName: group.name };
  },
);

// A link preview is public: expose only the group name for a valid invitation.
export const getGroupInviteShareInfo = cache(async (token: string) => {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  await connectDB();
  const group: { name: string } | null = await Group.findOne({
    "inviteLink.tokenHash": createHash("sha256").update(token).digest("hex"),
    "inviteLink.expiresAt": { $gt: new Date() },
  })
    .select("name -_id")
    .lean();
  return group;
});
