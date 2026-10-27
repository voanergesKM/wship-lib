import "server-only";
import { ActivityEvent } from "@/models/ActivityEvent";
import { User } from "@/models/User";
import { Song } from "@/models/Song";
import { SongList } from "@/models/SongList";
import { PermissionProfile } from "@/models/PermissionProfile";
import { Group } from "@/models/Group";
import { requireAdminPermission } from "@/lib/admin/access";
import { activitySearchSchema, activityDateRange } from "./filters";
import {
  ACTIVITY_ACTIONS,
  type ActivityAction,
  type ActivityTarget,
} from "./catalog";
import { activityTableSorting } from "../admin/tableSorting";

export interface ActivityRow {
  _id: string;
  action: ActivityAction;
  occurredAt: string;
  source: "server" | "client";
  actorId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  } | null;
  groupId: { _id: string; name: string } | null;
  targetId: string;
  targetLabel?: string;
  targetHref?: string;
  contextHref?: string;
  actionLabel?: string;
  targetKind: ActivityTarget;
  contextLabel?: string;
  payload: { slug?: string; listId?: string; songId?: string };
}
export type ActivitySearch = {
  actor?: string;
  group?: string;
  action?: string;
  source?: string;
  from?: string;
  to?: string;
  page?: string;
  sort?: string;
  direction?: string;
};
const isId = (value: string) => /^[a-f0-9]{24}$/i.test(value);
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function enrichLabels(events: ActivityRow[]) {
  const uniqueIds = (values: (string | undefined)[]) => [
    ...new Set(values.filter((id): id is string => !!id && isId(id))),
  ];
  const songIds = uniqueIds(
    events.flatMap((e) => [
      e.targetKind === "song" ? e.targetId : undefined,
      e.payload.songId,
    ]),
  );
  const userIds = uniqueIds(
    events
      .filter((e) => e.targetKind === "user" && !e.targetLabel)
      .map((e) => e.targetId),
  );
  const listIds = uniqueIds(
    events.flatMap((e) => [
      e.targetKind === "playlist" && !e.targetLabel ? e.targetId : undefined,
      e.payload.listId,
    ]),
  );
  const profileIds = [
    ...new Set(
      events
        .filter((e) => e.targetKind === "permissionProfile" && !e.targetLabel)
        .map((e) => e.targetId),
    ),
  ];
  const [songs, users, lists, profiles] = await Promise.all([
    songIds.length
      ? Song.find({ _id: { $in: songIds } })
          .select("title slug")
          .lean()
      : [],
    userIds.length
      ? User.find({ _id: { $in: userIds } })
          .select("firstName username")
          .lean()
      : [],
    listIds.length
      ? SongList.find({ _id: { $in: listIds } })
          .select("name")
          .lean()
      : [],
    profileIds.length
      ? PermissionProfile.find({ _id: { $in: profileIds } })
          .select("name")
          .lean()
      : [],
  ]);
  const songNames = new Map(
    (songs as { _id: unknown; title: string; slug?: string }[]).map((s) => [
      String(s._id),
      s.title,
    ]),
  );
  const songHrefs = new Map(
    (songs as { _id: unknown; slug?: string }[])
      .filter((song) => !!song.slug)
      .map((song) => [
        String(song._id),
        `/songs/${encodeURIComponent(song.slug!)}`,
      ]),
  );
  const userNames = new Map(
    (users as { _id: unknown; firstName?: string; username?: string }[]).map(
      (u) => [String(u._id), u.firstName || u.username || "Користувач"],
    ),
  );
  const listNames = new Map(
    (lists as { _id: unknown; name: string }[]).map((l) => [
      String(l._id),
      l.name,
    ]),
  );
  const profileNames = new Map(profiles.map((p) => [p._id, p.name]));
  return events.map((event) => ({
    ...event,
    actionLabel: ACTIVITY_ACTIONS[event.action]?.label || event.action,
    targetHref:
      event.targetKind === "song" && event.action !== "song.deleted"
        ? songHrefs.get(event.targetId)
        : undefined,
    contextHref:
      !event.payload.listId && event.payload.songId
        ? songHrefs.get(event.payload.songId)
        : undefined,
    targetLabel:
      event.targetLabel ||
      (event.targetKind === "song"
        ? songNames.get(event.targetId)
        : event.targetKind === "user"
          ? userNames.get(event.targetId)
          : event.targetKind === "playlist"
            ? listNames.get(event.targetId)
            : event.targetKind === "permissionProfile"
              ? profileNames.get(event.targetId)
              : undefined),
    contextLabel:
      event.payload.listId && listNames.has(event.payload.listId)
        ? `Список: ${listNames.get(event.payload.listId)}`
        : event.payload.songId && songNames.has(event.payload.songId)
          ? `Пісня: ${songNames.get(event.payload.songId)}`
          : undefined,
  }));
}
export async function getActivityEvents(raw: ActivitySearch) {
  await requireAdminPermission("activity.read");
  const parsed = activitySearchSchema.safeParse(raw);
  if (!parsed.success)
    return {
      events: [] as ActivityRow[],
      page: 1,
      pages: 0,
      total: 0,
      error: "Некоректні фільтри або діапазон дат",
    };
  const search = parsed.data;
  const [actors, groups] = await Promise.all([
    search.actor && !isId(search.actor)
      ? User.find({
          username: {
            $regex: escape(search.actor.replace(/^@/, "")),
            $options: "i",
          },
        })
          .select("_id")
          .limit(100)
          .lean()
      : Promise.resolve([]),
    search.group && !isId(search.group)
      ? Group.find({ name: { $regex: escape(search.group), $options: "i" } })
          .select("_id")
          .limit(100)
          .lean()
      : Promise.resolve([]),
  ]);
  const filter = {
    ...(search.actor
      ? {
          actorId: isId(search.actor)
            ? search.actor
            : { $in: actors.map((row: { _id: unknown }) => String(row._id)) },
        }
      : {}),
    ...(search.group
      ? {
          groupId: isId(search.group)
            ? search.group
            : { $in: groups.map((row: { _id: unknown }) => String(row._id)) },
        }
      : {}),
    ...(search.action ? { action: search.action } : {}),
    ...(search.source ? { source: search.source } : {}),
    ...(search.from || search.to
      ? { occurredAt: activityDateRange(search.from, search.to) }
      : {}),
  };
  const [events, total] = await Promise.all([
    ActivityEvent.find(filter)
      .select(
        "action actorId groupId targetId targetLabel targetKind payload source occurredAt",
      )
      .populate("actorId", "firstName lastName username")
      .populate("groupId", "name")
      .sort(activityTableSorting(search).mongo)
      .skip((search.page - 1) * 50)
      .limit(50)
      .lean(),
    ActivityEvent.countDocuments(filter),
  ]);
  return {
    events: await enrichLabels(
      JSON.parse(JSON.stringify(events)) as ActivityRow[],
    ),
    page: search.page,
    pages: Math.ceil(total / 50),
    total,
    error: undefined,
  };
}
