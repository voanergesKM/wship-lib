import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/access";
import { AdminError } from "@/lib/admin/errors";
import { getAdminUser, getAdminProfiles } from "@/lib/admin/data";
import { can } from "@/lib/permissions/catalog";
import { UserAccessForm } from "../../_components/UserAccessForm";
import { adminDate } from "../../_components/AdminDate";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdminPage("users.read");
  const { id } = await params;
  const user = await getAdminUser(id).catch((error: unknown) => {
    if (error instanceof AdminError && error.status === 404) notFound();
    throw error;
  });
  const profiles = actor.isSuperadmin ? await getAdminProfiles() : [];
  return (
    <section className="flex flex-col gap-5">
      {can(actor, "activity.read") && (
        <Link
          className="text-sm underline underline-offset-4"
          href={`/admin/activity?actor=${user._id}`}
        >
          Переглянути активність користувача
        </Link>
      )}
      <div>
        <h1 className="text-2xl font-semibold">
          {user.firstName || user.username || "Користувач"} {user.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user.username ? `@${user.username}` : ""} {user.email}
        </p>
      </div>
      <dl className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        {[
          ["Статус", user.isActive ? "Активний" : "Заблокований"],
          ["Профіль", user.permissionProfileName || user.permissionProfileId],
          ["Зареєстровано", adminDate(user.createdAt)],
          ["Останній вхід", adminDate(user.lastLoginAt)],
          ["Остання зафіксована активність", adminDate(user.lastSeenAt)],
        ].map(([key, value]) => (
          <div key={key}>
            <dt className="text-sm text-muted-foreground">{key}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <UserAccessForm
        user={user}
        profiles={profiles}
        canUpdateStatus={
          can(actor, "users.status.update") &&
          (user.permissionProfileId !== "superadmin" || actor.isSuperadmin)
        }
        canAssignProfile={actor.isSuperadmin}
      />
      <h2 className="text-lg font-semibold">Групи ({user.groups.length})</h2>
      <ul className="flex flex-col gap-2">
        {user.groups.map((g) => (
          <li key={g._id} className="rounded-xl border p-3">
            {can(actor, "groups.read") ? (
              <Link
                className="underline underline-offset-4"
                href={`/admin/groups/${g._id}`}
              >
                {g.name}
              </Link>
            ) : (
              g.name
            )}{" "}
            <span className="text-sm text-muted-foreground">· {g.role}</span>
          </li>
        ))}
      </ul>
      {user.groups.length === 0 && (
        <p className="text-muted-foreground">Не входить до жодної групи.</p>
      )}
    </section>
  );
}
