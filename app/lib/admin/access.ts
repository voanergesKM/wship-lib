import "server-only";
import { getServerAuth } from "@/lib/serverAuth";
import { can, type SystemPermission } from "@/lib/permissions/catalog";
import { AdminError } from "./errors";

export async function requireAdminPermission(permission: SystemPermission) {
  const { user } = await getServerAuth();
  if (!user) throw new AdminError("Необхідно авторизуватися", 401);
  if (!can(user, "admin.access") || !can(user, permission))
    throw new AdminError("Недостатньо прав", 403);
  return user;
}

export async function requireSuperadmin(permission: SystemPermission) {
  const user = await requireAdminPermission(permission);
  if (!user.isSuperadmin)
    throw new AdminError("Дія доступна лише суперадміну", 403);
  return user;
}

export async function requireAdminPage(permission: SystemPermission) {
  const { notFound } = await import("next/navigation");
  try {
    return await requireAdminPermission(permission);
  } catch (error) {
    if (error instanceof AdminError && [401, 403, 404].includes(error.status))
      notFound();
    throw error;
  }
}
