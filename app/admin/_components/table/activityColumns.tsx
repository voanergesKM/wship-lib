"use client";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import type { ActivityRow } from "@/lib/activity/data";
import { adminDate } from "../AdminDate";
import type { AdminTableFeatures } from "./features";

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
const helper = createColumnHelper<AdminTableFeatures, ActivityRow>();
export function activityColumns(readUsers: boolean, readGroups: boolean) {
  return helper.columns([
    helper.accessor("occurredAt", {
      header: "Коли (Київ)",
      enableSorting: true,
      sortDescFirst: true,
      cell: (context) => (
        <span className="whitespace-nowrap">
          {adminDate(context.getValue())}
        </span>
      ),
    }),
    helper.display({
      id: "actor",
      header: "Хто",
      cell: ({ row }) => (
        <ActivityActor actor={row.original.actorId} canRead={readUsers} />
      ),
    }),
    helper.display({
      id: "action",
      header: "Дія",
      cell: ({ row }) => row.original.actionLabel || row.original.action,
    }),
    helper.display({
      id: "target",
      header: "Об’єкт",
      cell: ({ row }) => {
        const event = row.original;
        const label = event.targetLabel || event.targetId;
        return (
          <div className="max-w-72 break-words">
            {event.targetHref ? (
              <Link
                href={event.targetHref}
                prefetch={false}
                className="underline underline-offset-4"
              >
                {label}
              </Link>
            ) : (
              <span>{label}</span>
            )}
            {event.contextLabel && (
              <span className="block text-xs text-muted-foreground">
                {event.contextHref ? (
                  <Link
                    href={event.contextHref}
                    prefetch={false}
                    className="underline underline-offset-4"
                  >
                    {event.contextLabel}
                  </Link>
                ) : (
                  event.contextLabel
                )}
              </span>
            )}
          </div>
        );
      },
    }),
    helper.display({
      id: "group",
      header: "Група",
      cell: ({ row }) => {
        const group = row.original.groupId;
        return group ? (
          readGroups ? (
            <Link
              className="underline underline-offset-4"
              href={`/admin/groups/${group._id}`}
            >
              {group.name}
            </Link>
          ) : (
            group.name
          )
        ) : (
          "—"
        );
      },
    }),
    helper.accessor("source", {
      header: "Джерело",
      cell: (context) => (
        <span className="text-muted-foreground">
          {context.getValue() === "server" ? "Сервер" : "Інтерфейс"}
        </span>
      ),
    }),
  ]);
}
