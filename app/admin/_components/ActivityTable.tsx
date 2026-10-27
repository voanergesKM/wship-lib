import Link from "next/link";
import { can, type PermissionAccess } from "@/lib/permissions/catalog";
import { ACTIVITY_ACTIONS } from "@/lib/activity/catalog";
import type { ActivityRow } from "@/lib/activity/data";
import { adminDate } from "./AdminDate";

function ActivityActor({
  actor,
  canRead,
}: {
  actor: ActivityRow["actorId"];
  canRead: boolean;
}) {
  if (!actor) return <span>Гість / видалений акаунт</span>;
  const name =
    [actor.firstName, actor.lastName].filter(Boolean).join(" ") ||
    actor.username ||
    "Користувач";
  return (
    <>
      {canRead ? (
        <Link
          className="underline underline-offset-4"
          href={`/admin/users/${actor._id}`}
        >
          {name}
        </Link>
      ) : (
        <span>{name}</span>
      )}
      {actor.username && (
        <span className="block text-xs text-muted-foreground">
          @{actor.username}
        </span>
      )}
    </>
  );
}

export function ActivityTable({
  events,
  viewer,
}: {
  events: ActivityRow[];
  viewer: PermissionAccess;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted">
          <tr>
            {["Коли (Київ)", "Хто", "Дія", "Об’єкт", "Група", "Джерело"].map(
              (label) => (
                <th key={label} className="p-3 font-medium">
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event._id} className="border-t align-top">
              <td className="whitespace-nowrap p-3">
                {adminDate(event.occurredAt)}
              </td>
              <td className="p-3">
                <ActivityActor
                  actor={event.actorId}
                  canRead={can(viewer, "users.read")}
                />
              </td>
              <td className="p-3">
                {ACTIVITY_ACTIONS[event.action]?.label || event.action}
              </td>
              <td className="p-3">
                <span className="block max-w-72 break-words">
                  {event.targetLabel || event.targetId}
                </span>
                {event.contextLabel && (
                  <span className="block text-xs text-muted-foreground">
                    {event.contextLabel}
                  </span>
                )}
              </td>
              <td className="p-3">
                {event.groupId ? (
                  can(viewer, "groups.read") ? (
                    <Link
                      className="underline underline-offset-4"
                      href={`/admin/groups/${event.groupId._id}`}
                    >
                      {event.groupId.name}
                    </Link>
                  ) : (
                    event.groupId.name
                  )
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3 text-muted-foreground">
                {event.source === "server" ? "Сервер" : "Інтерфейс"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
