import { requireAdminPage } from "@/lib/admin/access";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions/catalog";
export default async function Page() {
  const user = await requireAdminPage("admin.access");
  if (can(user, "users.read")) redirect("/admin/users");
  if (can(user, "groups.read")) redirect("/admin/groups");
  if (can(user, "activity.read")) redirect("/admin/activity");
  if (can(user, "permissionProfiles.read")) redirect("/admin/profiles");
  return (
    <p className="text-muted-foreground">
      У вашому профілі ще немає доступних розділів адмінки.
    </p>
  );
}
