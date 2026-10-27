import "server-only";
import { isObjectIdOrHexString } from "mongoose";
import { User } from "@/models/User";
import { Group } from "@/models/Group";
import { SongList } from "@/models/SongList";
import { PermissionProfile } from "@/models/PermissionProfile";
import {
  legacyProfileId,
  type SystemPermission,
} from "@/lib/permissions/catalog";
import { requireAdminPermission } from "./access";
import { userTableSorting } from "./tableSorting";
import { AdminError } from "./errors";

export interface AdminProfile {
  _id: string;
  name: string;
  description: string;
  permissions: SystemPermission[];
  isSystem: boolean;
}
export interface AdminUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  isActive: boolean;
  permissionProfileId: string;
  permissionProfileName?: string;
  createdAt: string;
  lastLoginAt?: string;
  lastSeenAt?: string;
  groups: { _id: string; name: string; role: string }[];
}
interface UserRow extends Omit<AdminUser, "groups"> {
  role?: string;
}
interface MembershipRow {
  _id: string;
  name: string;
  members: { userId: string; role: string }[];
}
const fields =
  "firstName lastName username email isActive permissionProfileId role createdAt lastLoginAt lastSeenAt";
function json<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  await requireAdminPermission("permissionProfiles.read");
  return json<AdminProfile[]>(
    await PermissionProfile.find()
      .select("name description permissions isSystem")
      .sort({ name: 1 })
      .lean(),
  );
}

export async function getAdminUsers(search: {
  q?: string;
  page?: string;
  status?: string;
  profile?: string;
  sort?: string;
  direction?: string;
}) {
  await requireAdminPermission("users.read");
  const q = (search.q || "")
    .trim()
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = {
    ...(q
      ? {
          $or: ["firstName", "lastName", "username", "email"].map((field) => ({
            [field]: { $regex: q, $options: "i" },
          })),
        }
      : {}),
    ...(["active", "blocked"].includes(search.status ?? "")
      ? { isActive: search.status === "active" }
      : {}),
    ...(search.profile ? { permissionProfileId: search.profile } : {}),
  };
  const page = Math.min(
    100000,
    Math.max(1, Number.parseInt(search.page || "1", 10) || 1),
  );
  const limit = 25;
  const [documents, total] = await Promise.all([
    User.find(filter)
      .select(fields)
      .sort(userTableSorting(search).mongo)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  const users = json<UserRow[]>(documents);
  const [groupDocuments, profileDocuments] = await Promise.all([
    Group.find({ "members.userId": { $in: users.map((u) => u._id) } })
      .select("name members")
      .lean(),
    PermissionProfile.find({
      _id: {
        $in: users.map((u) => u.permissionProfileId || legacyProfileId(u.role)),
      },
    })
      .select("name")
      .lean(),
  ]);
  const groups = json<MembershipRow[]>(groupDocuments);
  const profileNames = new Map(profileDocuments.map((p) => [p._id, p.name]));
  return {
    users: users.map(
      (user): AdminUser => ({
        ...user,
        permissionProfileId:
          user.permissionProfileId || legacyProfileId(user.role),
        permissionProfileName:
          profileNames.get(
            user.permissionProfileId || legacyProfileId(user.role),
          ) ?? "Профіль відсутній",
        groups: groups.flatMap((group) => {
          const membership = group.members.find((m) => m.userId === user._id);
          return membership
            ? [{ _id: group._id, name: group.name, role: membership.role }]
            : [];
        }),
      }),
    ),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  await requireAdminPermission("users.read");
  if (!isObjectIdOrHexString(id))
    throw new AdminError("Користувача не знайдено", 404);
  const document = await User.findById(id).select(fields).lean();
  if (!document) throw new AdminError("Користувача не знайдено", 404);
  const user = json<UserRow>(document);
  const profile = await PermissionProfile.findById(
    user.permissionProfileId || legacyProfileId(user.role),
  )
    .select("name")
    .lean();
  const groups = json<MembershipRow[]>(
    await Group.find({ "members.userId": id }).select("name members").lean(),
  );
  return {
    ...user,
    permissionProfileId: user.permissionProfileId || legacyProfileId(user.role),
    permissionProfileName: profile?.name ?? "Профіль відсутній",
    groups: groups.map((g) => ({
      _id: g._id,
      name: g.name,
      role: g.members.find((m) => m.userId === id)?.role ?? "member",
    })),
  };
}

export interface AdminGroup {
  _id: string;
  name: string;
  createdAt: string;
  members: {
    role: string;
    userId: {
      _id: string;
      firstName?: string;
      username?: string;
      isActive: boolean;
    } | null;
  }[];
}
export async function getAdminGroups(search: { q?: string; page?: string }) {
  await requireAdminPermission("groups.read");
  const q = (search.q || "")
    .trim()
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = q ? { name: { $regex: q, $options: "i" } } : {};
  const page = Math.min(
    100000,
    Math.max(1, Number.parseInt(search.page || "1", 10) || 1),
  );
  const [groups, total] = await Promise.all([
    Group.find(filter)
      .select("name members createdAt")
      .populate("members.userId", "firstName username isActive")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * 25)
      .limit(25)
      .lean(),
    Group.countDocuments(filter),
  ]);
  return {
    groups: json<AdminGroup[]>(groups),
    page,
    pages: Math.ceil(total / 25),
    total,
  };
}
export async function getAdminGroup(id: string) {
  await requireAdminPermission("groups.read");
  if (!isObjectIdOrHexString(id))
    throw new AdminError("Групу не знайдено", 404);
  const group = await Group.findById(id)
    .select("name members createdAt")
    .populate("members.userId", "firstName username isActive")
    .lean();
  if (!group) throw new AdminError("Групу не знайдено", 404);
  const lists = await SongList.find({ groupId: id })
    .select("name songs updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  return {
    group: json<AdminGroup>(group),
    lists:
      json<{ _id: string; name: string; songs: string[]; updatedAt: string }[]>(
        lists,
      ),
  };
}
