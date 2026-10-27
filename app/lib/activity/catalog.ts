import { z } from "zod";

const id = z.string().min(1).max(200);
const empty = z.object({}).strict();
const song = z.object({ slug: z.string().min(1).max(200) }).strict();
const listSong = z.object({ listId: id }).strict();
const proposal = z.object({ songId: id }).strict();
const chord = z.object({ chordId: id.optional() }).strict();
export type ActivityTarget =
  | "user"
  | "song"
  | "group"
  | "playlist"
  | "arrangement"
  | "proposal"
  | "chord"
  | "permissionProfile";
export type ActivityCategory =
  | "auth"
  | "songs"
  | "groups"
  | "playlists"
  | "proposals"
  | "chords"
  | "admin";
function action<T extends z.ZodType>(
  label: string,
  category: ActivityCategory,
  targetKind: ActivityTarget,
  payload: T,
) {
  return { label, category, targetKind, payload };
}

// These are recorded facts, not authorization permissions.
export const ACTIVITY_ACTIONS = {
  "auth.login": action(
    "Увійшов в акаунт",
    "auth",
    "user",
    z.object({ method: z.enum(["telegram", "desktop"]) }).strict(),
  ),
  "auth.logout": action("Вийшов з акаунта", "auth", "user", empty),
  "song.view": action(
    "Відкрив пісню",
    "songs",
    "song",
    z
      .object({ slug: z.string().min(1).max(200), listId: id.optional() })
      .strict(),
  ),
  "song.created": action("Додав пісню", "songs", "song", song),
  "song.updated": action("Відредагував пісню", "songs", "song", song),
  "song.deleted": action("Видалив пісню", "songs", "song", song),
  "arrangement.created": action(
    "Створив структуру пісні",
    "songs",
    "arrangement",
    proposal,
  ),
  "arrangement.updated": action(
    "Змінив структуру пісні",
    "songs",
    "arrangement",
    proposal,
  ),
  "arrangement.deleted": action(
    "Видалив структуру пісні",
    "songs",
    "arrangement",
    proposal,
  ),
  "group.created": action("Створив групу", "groups", "group", empty),
  "group.deleted": action("Видалив групу", "groups", "group", empty),
  "group.member.joined": action("Приєднався до групи", "groups", "user", empty),
  "group.member.removed": action(
    "Видалив учасника / вийшов із групи",
    "groups",
    "user",
    empty,
  ),
  "group.invitation.sent": action(
    "Надіслав запрошення до групи",
    "groups",
    "group",
    empty,
  ),
  "group.invitation.cancelled": action(
    "Скасував запрошення до групи",
    "groups",
    "group",
    empty,
  ),
  "group.invitation.rejected": action(
    "Відхилив запрошення до групи",
    "groups",
    "group",
    empty,
  ),
  "playlist.created": action(
    "Створив список пісень",
    "playlists",
    "playlist",
    empty,
  ),
  "playlist.updated": action(
    "Змінив список / порядок пісень",
    "playlists",
    "playlist",
    empty,
  ),
  "playlist.deleted": action(
    "Видалив список пісень",
    "playlists",
    "playlist",
    empty,
  ),
  "playlist.song.added": action(
    "Додав пісню до списку",
    "playlists",
    "song",
    listSong,
  ),
  "playlist.song.removed": action(
    "Видалив пісню зі списку",
    "playlists",
    "song",
    listSong,
  ),
  "playlist.arrangement.updated": action(
    "Змінив структуру пісні у списку",
    "playlists",
    "playlist",
    z.object({ songId: id, arrangementId: id.nullable() }).strict(),
  ),
  "song.proposal.created": action(
    "Запропонував зміни до пісні",
    "proposals",
    "proposal",
    proposal,
  ),
  "song.proposal.updated": action(
    "Оновив пропозицію до пісні",
    "proposals",
    "proposal",
    proposal,
  ),
  "song.proposal.cancelled": action(
    "Скасував пропозицію до пісні",
    "proposals",
    "proposal",
    proposal,
  ),
  "song.proposal.approved": action(
    "Прийняв зміни до пісні",
    "proposals",
    "proposal",
    proposal,
  ),
  "song.proposal.rejected": action(
    "Відхилив зміни до пісні",
    "proposals",
    "proposal",
    proposal,
  ),
  "chord.proposal.submitted": action(
    "Запропонував зміни до акордів",
    "chords",
    "proposal",
    chord,
  ),
  "chord.proposal.approved": action(
    "Схвалив зміни до акордів",
    "chords",
    "proposal",
    chord,
  ),
  "chord.proposal.rejected": action(
    "Відхилив зміни до акордів",
    "chords",
    "proposal",
    chord,
  ),
  "chord.proposal.cancelled": action(
    "Скасував пропозицію акордів",
    "chords",
    "proposal",
    chord,
  ),
  "chord.changed": action(
    "Зберіг зміни каталогу акордів",
    "chords",
    "chord",
    empty,
  ),
  "admin.user.updated": action(
    "Змінив статус / профіль користувача",
    "admin",
    "user",
    empty,
  ),
  "admin.profile.created": action(
    "Створив профіль доступу",
    "admin",
    "permissionProfile",
    empty,
  ),
  "admin.profile.updated": action(
    "Змінив профіль доступу",
    "admin",
    "permissionProfile",
    empty,
  ),
} as const;
export type ActivityAction = keyof typeof ACTIVITY_ACTIONS;
export const ACTIVITY_KEYS = Object.keys(ACTIVITY_ACTIONS) as [
  ActivityAction,
  ...ActivityAction[],
];
export type ActivityInput = {
  [A in ActivityAction]: {
    action: A;
    actorId: string | null;
    targetId: string;
    targetLabel?: string;
    groupId?: string | null;
    payload: z.input<(typeof ACTIVITY_ACTIONS)[A]["payload"]>;
  };
}[ActivityAction];

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
export const songViewSchema = z
  .object({
    action: z.literal("song.view"),
    eventId: z.uuid(),
    slug: z.string().min(1).max(200),
    groupId: objectId.optional(),
    listId: objectId.optional(),
  })
  .strict()
  .refine(
    (value) => !value.listId || !!value.groupId,
    "Список потребує контексту групи",
  );

export function validateActivity(input: ActivityInput) {
  const base = z
    .object({
      action: z.enum(ACTIVITY_KEYS),
      actorId: objectId.nullable(),
      targetId: id,
      targetLabel: z.string().max(200).optional(),
      groupId: objectId.nullable().optional(),
      payload: z.unknown(),
    })
    .strict()
    .parse(input);
  const definition = ACTIVITY_ACTIONS[base.action];
  return {
    ...base,
    payload: definition.payload.parse(base.payload),
    category: definition.category,
    targetKind: definition.targetKind,
  };
}
