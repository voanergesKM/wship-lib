import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/access";
import { getAdminGroup } from "@/lib/admin/data";
import { AdminError } from "@/lib/admin/errors";
import { can } from "@/lib/permissions/catalog";
import { adminDate } from "../../_components/AdminDate";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdminPage("groups.read");
  const { group, lists } = await getAdminGroup((await params).id).catch(
    (error: unknown) => {
      if (error instanceof AdminError && error.status === 404) notFound();
      throw error;
    },
  );
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{group.name}</h1>
      {can(actor, "activity.read") && (
        <Link
          className="text-sm underline underline-offset-4"
          href={`/admin/activity?group=${group._id}`}
        >
          Переглянути активність групи
        </Link>
      )}
      <p className="text-sm text-muted-foreground">
        Створено: {adminDate(group.createdAt)}
      </p>
      <h2 className="text-lg font-semibold">
        Учасники ({group.members.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {group.members.map((m, index) => (
          <li className="rounded-xl border p-3" key={m.userId?._id || index}>
            {m.userId && can(actor, "users.read") ? (
              <Link
                className="underline underline-offset-4"
                href={`/admin/users/${m.userId._id}`}
              >
                {m.userId.firstName || m.userId.username || "Користувач"}
              </Link>
            ) : (
              m.userId?.firstName || "Видалений користувач"
            )}
            <span className="text-sm text-muted-foreground">
              {" "}
              · {m.role} ·{" "}
              {m.userId?.isActive ? "Активний" : "Заблокований або видалений"}
            </span>
          </li>
        ))}
      </ul>
      <h2 className="text-lg font-semibold">Списки пісень ({lists.length})</h2>
      <ul className="flex flex-col gap-2">
        {lists.map((list) => (
          <li className="rounded-xl border p-3" key={list._id}>
            <p className="font-medium">{list.name}</p>
            <p className="text-sm text-muted-foreground">
              Пісень: {list.songs.length} · Оновлено:{" "}
              {adminDate(list.updatedAt)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
