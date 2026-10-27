export const SYSTEM_PERMISSIONS = {
  "admin.access": "Відкривати адмінку",
  "users.read": "Переглядати користувачів та їхні групи",
  "users.status.update": "Блокувати й розблоковувати користувачів",
  "users.permissionProfile.assign":
    "Призначати профілі доступу (лише суперадмін)",
  "activity.read": "Переглядати журнал активності всіх користувачів і груп",
  "groups.read": "Переглядати всі групи в адмінці",
  "permissionProfiles.read": "Переглядати профілі доступу",
  "permissionProfiles.create": "Створювати профілі (лише суперадмін)",
  "permissionProfiles.update": "Редагувати профілі (лише суперадмін)",
  "songs.manage": "Редагувати й видаляти будь-які пісні та структури",
  "songs.proposals.review": "Розглядати пропозиції до всіх пісень",
  "chords.manage": "Зберігати зміни каталогу акордів напряму",
  "chords.proposals.review": "Переглядати й розглядати всі пропозиції акордів",
} as const;

export type SystemPermission = keyof typeof SYSTEM_PERMISSIONS;
export const PERMISSION_KEYS = Object.keys(SYSTEM_PERMISSIONS) as [
  SystemPermission,
  ...SystemPermission[],
];
export const SUPERADMIN_PROFILE_ID = "superadmin";

export interface PermissionAccess {
  permissionProfileId?: string | null;
  permissions?: readonly SystemPermission[];
  isSuperadmin?: boolean;
}

export function can(
  user: PermissionAccess | null | undefined,
  permission: SystemPermission,
): boolean {
  return (
    !!user &&
    (user.isSuperadmin === true ||
      user.permissions?.includes(permission) === true)
  );
}

export const LEGACY_ADMIN_PERMISSIONS: SystemPermission[] = [
  "songs.manage",
  "songs.proposals.review",
  "chords.manage",
  "chords.proposals.review",
];

export const SYSTEM_PROFILES = [
  {
    _id: SUPERADMIN_PROFILE_ID,
    name: "Суперадмін",
    permissions: PERMISSION_KEYS,
    isSystem: true,
  },
  {
    _id: "admin",
    name: "Адмін",
    permissions: [
      "admin.access",
      "users.read",
      "users.status.update",
      "groups.read",
      "permissionProfiles.read",
    ] as SystemPermission[],
    isSystem: true,
  },
  {
    _id: "legacy-admin",
    name: "Модератор (попередні права адміністратора)",
    permissions: LEGACY_ADMIN_PERMISSIONS,
    isSystem: true,
  },
  {
    _id: "editor",
    name: "Редактор",
    permissions: [] as SystemPermission[],
    isSystem: true,
  },
  {
    _id: "viewer",
    name: "Користувач (попередній профіль)",
    permissions: [] as SystemPermission[],
    isSystem: true,
  },
  {
    _id: "user",
    name: "Користувач",
    permissions: [] as SystemPermission[],
    isSystem: true,
  },
];

export function legacyProfileId(role: string | undefined): string {
  if (role === "admin") return "legacy-admin";
  return role === "editor" || role === "viewer" ? role : "user";
}

// Only documents not yet migrated use legacy roles. An explicit assignment
// always takes precedence, including missing/deleted profiles (deny by default).
export function resolveAccess(
  user: { role?: string; permissionProfileId?: string | null },
  profile: {
    _id: string;
    permissions: readonly SystemPermission[];
    isSystem: boolean;
  } | null,
): Required<PermissionAccess> {
  const profileId = user.permissionProfileId || legacyProfileId(user.role);
  if (!profile)
    return {
      permissionProfileId: profileId,
      permissions:
        !user.permissionProfileId && user.role === "admin"
          ? LEGACY_ADMIN_PERMISSIONS
          : [],
      isSuperadmin: false,
    };
  if (profile._id !== profileId)
    return {
      permissionProfileId: profileId,
      permissions: [],
      isSuperadmin: false,
    };
  return {
    permissionProfileId: profileId,
    permissions: profile.permissions.filter((key) => key in SYSTEM_PERMISSIONS),
    isSuperadmin: profile._id === SUPERADMIN_PROFILE_ID && profile.isSystem,
  };
}
