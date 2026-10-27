import "server-only";

import { cache } from "react";
import { Group, type GroupDocument } from "@/models/Group";
import { SongList } from "@/models/SongList";
import "@/models/Arrangement";
import type {
  GroupData,
  SongListDetails,
  UserInvitationInfo,
} from "@/services/groups.service";
import { connectDB } from "../db";

export class GroupReadError extends Error {
  constructor(message: string, readonly status: 403 | 404) {
    super(message);
    this.name = "GroupReadError";
  }
}

function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// React.cache only deduplicates reads within the current server render.
// Membership is checked before any private group/list data can be returned.
const getAuthorizedGroup = cache(async (groupId: string, userId: string) => {
  await connectDB();
  const group: GroupDocument | null = await Group.findById(groupId);
  if (!group) throw new GroupReadError("Групу не знайдено", 404);

  const isMember = group.members.some((member) => {
    const reference = member.userId as {
      toString(): string;
      _id?: { toString(): string };
    } | null;
    return reference?.toString() === userId || reference?._id?.toString() === userId;
  });
  if (!isMember) throw new GroupReadError("Немає доступу до цієї групи", 403);
  return group;
});

export async function getMyGroups(userId: string): Promise<GroupData[]> {
  await connectDB();
  const groups = await Group.find({ "members.userId": userId })
    .populate("members.userId", "firstName username email photoUrl")
    .populate("createdBy", "firstName username")
    .sort({ createdAt: -1 });
  return serialize<GroupData[]>(groups);
}

export async function getGroupDetails(
  groupId: string,
  userId: string,
): Promise<GroupData> {
  const group = await getAuthorizedGroup(groupId, userId);
  await group.populate([
    { path: "members.userId", select: "firstName username email photoUrl" },
    { path: "invitations.invitedBy", select: "firstName username" },
    { path: "createdBy", select: "firstName username" },
  ]);
  return serialize<GroupData>(group);
}

export async function getSongLists(
  groupId: string,
  userId: string,
): Promise<SongListDetails[]> {
  await getAuthorizedGroup(groupId, userId);
  const lists = await SongList.find({ groupId })
    .populate("createdBy", "firstName username")
    .sort({ createdAt: -1 });
  return serialize<SongListDetails[]>(lists);
}

export async function getSongListDetails(
  groupId: string,
  listId: string,
  userId: string,
): Promise<SongListDetails> {
  await getAuthorizedGroup(groupId, userId);
  const list = await SongList.findOne({ _id: listId, groupId })
    .populate("songs")
    .populate("songArrangements.arrangement")
    .populate("createdBy", "firstName username")
    .populate("updatedBy", "firstName username");
  if (!list) throw new GroupReadError("Список пісень не знайдено", 404);
  return serialize<SongListDetails>(list);
}

export async function getPendingInvitations(user: {
  username?: string | null;
  email?: string | null;
}): Promise<UserInvitationInfo[]> {
  const { username, email } = user;
  const conditions = [];
  if (username) {
    const normalizedTg = username.replace(/^@/, "").toLowerCase();
    conditions.push({
      "invitations.type": "telegram",
      "invitations.value": { $regex: new RegExp(`^@?${normalizedTg}$`, "i") },
    });
  }
  if (email) {
    conditions.push({
      "invitations.type": "email",
      "invitations.value": email.toLowerCase(),
    });
  }
  if (conditions.length === 0) return [];

  await connectDB();
  const groups: GroupDocument[] = await Group.find({ $or: conditions })
    .populate("createdBy", "firstName username")
    .populate("invitations.invitedBy", "firstName username");
  return serialize<UserInvitationInfo[]>(groups.map((group) => {
    const invite = group.invitations.find((invitation) => {
      if (invitation.type === "telegram" && username) {
        return invitation.value.replace(/^@/, "").toLowerCase() ===
          username.replace(/^@/, "").toLowerCase();
      }
      return invitation.type === "email" && !!email &&
        invitation.value.toLowerCase() === email.toLowerCase();
    });
    return {
      groupId: group._id,
      groupName: group.name,
      createdBy: group.createdBy,
      role: invite?.role || "member",
      invitedBy: invite?.invitedBy,
      createdAt: invite?.createdAt,
    };
  }));
}
