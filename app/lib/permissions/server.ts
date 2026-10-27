import "server-only";
import { PermissionProfile } from "@/models/PermissionProfile";
import { legacyProfileId, resolveAccess } from "./catalog";
import type { SystemPermission } from "./catalog";

export async function getUserAccess(user: {
  role?: string;
  permissionProfileId?: string | null;
}) {
  const profile = await PermissionProfile.findById(
    user.permissionProfileId || legacyProfileId(user.role),
  ).lean();
  return resolveAccess(
    user,
    profile
      ? { ...profile, permissions: profile.permissions as SystemPermission[] }
      : null,
  );
}
