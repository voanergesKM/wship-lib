import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = fileURLToPath(new URL("..", import.meta.url));
const cache = new Map();
const overrides = {
  "next/link": {
    __esModule: true,
    default: ({ children, href, ...props }) => {
      delete props.prefetch;
      return React.createElement("a", { ...props, href }, children);
    },
  },
  "next/navigation": {
    useRouter: () => ({ replace: () => {} }),
    usePathname: () => "/admin/users",
    useSearchParams: () => new URLSearchParams(),
  },
};
function load(file) {
  const filename = [file, `${file}.ts`, `${file}.tsx`].find((entry) =>
    existsSync(entry),
  );
  assert.ok(filename, `Module not found: ${file}`);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loaded = { exports: {} };
  cache.set(filename, loaded);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name in overrides) return overrides[name];
      if (name.startsWith("@/"))
        return load(path.join(root, "app", name.slice(2)));
      if (name.startsWith("."))
        return load(path.resolve(path.dirname(filename), name));
      return require(name);
    },
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const sorting = load(path.join(root, "app/lib/admin/tableSorting.ts"));

test("server sorting whitelists supported fields and keeps deterministic tie-breaking", () => {
  assert.deepEqual(
    sorting.userTableSorting({ sort: "lastSeenAt", direction: "desc" }).mongo,
    { lastSeenAt: -1, _id: -1 },
  );
  assert.deepEqual(
    sorting.userTableSorting({ sort: "firstName", direction: "asc" }).mongo,
    { firstName: 1, _id: -1 },
  );
  assert.deepEqual(
    sorting.userTableSorting({ sort: "password", direction: "asc" }).mongo,
    { createdAt: -1, _id: -1 },
  );
  assert.deepEqual(
    sorting.activityTableSorting({ sort: "occurredAt", direction: "asc" })
      .mongo,
    { occurredAt: 1, _id: -1 },
  );
  assert.deepEqual(sorting.activityTableSorting({}).sorting, [
    { id: "occurredAt", desc: true },
  ]);
});
test("sorting navigation keeps filters, resets pagination and can restore defaults", () => {
  const href = sorting.tableSortHref(
    "/admin/activity",
    "actor=person&group=team&action=song.view&from=2026-10-27&page=4",
    [{ id: "occurredAt", desc: false }],
  );
  const params = new URL(href, "http://localhost").searchParams;
  assert.equal(params.get("actor"), "person");
  assert.equal(params.get("group"), "team");
  assert.equal(params.get("from"), "2026-10-27");
  assert.equal(params.get("page"), null);
  assert.equal(params.get("direction"), "asc");
  assert.equal(
    sorting.tableSortHref(
      "/admin/users",
      "q=person&sort=lastSeenAt&direction=asc&page=3",
      [],
    ),
    "/admin/users?q=person",
  );
});
const user = (index) => ({
  _id: `user-${index}`,
  firstName: `User ${index}`,
  isActive: true,
  permissionProfileId: "user",
  createdAt: "2026-10-27T10:00:00Z",
  groups: [],
  lastLoginAt: "2026-10-27T11:00:00Z",
  ...(index ? { lastSeenAt: "2026-10-27T12:00:00Z" } : {}),
});
test("TanStack users table renders the whole server page and distinct last-activity dates", () => {
  const { UsersTable } = load(
    path.join(root, "app/admin/_components/UsersTable.tsx"),
  );
  const html = renderToStaticMarkup(
    React.createElement(UsersTable, {
      users: Array.from({ length: 25 }, (_, index) => user(index)),
      sorting: [],
    }),
  );
  assert.equal((html.match(/<tr\b/g) || []).length, 26);
  assert.ok(html.includes("Остання активність"));
  assert.ok(html.includes("14:00"));
  assert.ok(html.includes("13:00"));
  assert.ok(html.includes("Немає даних"));
  assert.ok(html.includes('href="/admin/users/user-24"'));
});
test("manual sorting preserves the server row order instead of sorting only one page", () => {
  const { UsersTable } = load(
    path.join(root, "app/admin/_components/UsersTable.tsx"),
  );
  const html = renderToStaticMarkup(
    React.createElement(UsersTable, {
      users: [
        { ...user(1), firstName: "Zulu" },
        { ...user(2), firstName: "Alpha" },
      ],
      sorting: [{ id: "firstName", desc: false }],
    }),
  );
  assert.ok(html.indexOf("Zulu") < html.indexOf("Alpha"));
  assert.ok(html.includes('aria-sort="ascending"'));
});
test("empty tables retain column semantics and show an empty state", () => {
  const { UsersTable } = load(
    path.join(root, "app/admin/_components/UsersTable.tsx"),
  );
  const html = renderToStaticMarkup(
    React.createElement(UsersTable, { users: [], sorting: [] }),
  );
  assert.ok(html.includes("Користувачів не знайдено."));
  assert.ok(html.includes('colSpan="6"') || html.includes('colspan="6"'));
});
const event = (index) => ({
  _id: `event-${index}`,
  action: "song.view",
  actionLabel: "Відкрив пісню",
  targetKind: "song",
  targetId: "song-id",
  targetLabel: `Назва ${index}`,
  targetHref: "/songs/current-slug",
  occurredAt: "2026-10-27T12:00:00Z",
  source: "client",
  actorId: { _id: "actor-id", firstName: "Іван", username: "ivan" },
  groupId: { _id: "group-id", name: "Команда" },
  payload: {},
});
test("activity links point to songs while admin links respect read permissions", () => {
  const { ActivityTable } = load(
    path.join(root, "app/admin/_components/ActivityTable.tsx"),
  );
  const html = renderToStaticMarkup(
    React.createElement(ActivityTable, {
      events: Array.from({ length: 50 }, (_, index) => event(index)),
      sorting: [{ id: "occurredAt", desc: true }],
      readUsers: false,
      readGroups: false,
    }),
  );
  assert.equal((html.match(/<tr\b/g) || []).length, 51);
  assert.ok(html.includes('href="/songs/current-slug"'));
  assert.ok(!html.includes('href="/admin/users/'));
  assert.ok(!html.includes('href="/admin/groups/'));
  assert.ok(html.includes("Відкрив пісню"));
  assert.ok(html.includes('aria-sort="descending"'));
});
test("activity rows without a live target remain plain text", () => {
  const { ActivityTable } = load(
    path.join(root, "app/admin/_components/ActivityTable.tsx"),
  );
  const html = renderToStaticMarkup(
    React.createElement(ActivityTable, {
      events: [
        { ...event(1), targetHref: undefined, payload: { slug: "old-slug" } },
      ],
      sorting: [],
      readUsers: true,
      readGroups: true,
    }),
  );
  assert.ok(!html.includes('href="/songs/'));
  assert.ok(html.includes('href="/admin/users/actor-id"'));
  assert.ok(html.includes('href="/admin/groups/group-id"'));
});

test("the users reader applies last-activity sorting before server pagination", async () => {
  const seen = {};
  const rows = [user(1)];
  const query = (value) => ({
    select() {
      return this;
    },
    sort(value) {
      seen.sort = value;
      return this;
    },
    skip(value) {
      seen.skip = value;
      return this;
    },
    limit(value) {
      seen.limit = value;
      return this;
    },
    lean: async () => value,
  });
  const dependencies = {
    "server-only": {},
    mongoose: { isObjectIdOrHexString: () => true },
    "@/lib/admin/access": {
      requireAdminPermission: async (permission) =>
        assert.equal(permission, "users.read"),
    },
    "@/models/User": {
      User: { find: () => query(rows), countDocuments: async () => 26 },
    },
    "@/models/Group": { Group: { find: () => query([]) } },
    "@/models/SongList": {},
    "@/models/PermissionProfile": {
      PermissionProfile: {
        find: () => query([{ _id: "user", name: "Користувач" }]),
      },
    },
    "./access": {
      requireAdminPermission: async (permission) =>
        assert.equal(permission, "users.read"),
    },
  };
  Object.assign(overrides, dependencies);
  try {
    const { getAdminUsers } = load(path.join(root, "app/lib/admin/data.ts"));
    const result = await getAdminUsers({
      sort: "lastSeenAt",
      direction: "desc",
      page: "2",
    });
    assert.deepEqual(seen.sort, { lastSeenAt: -1, _id: -1 });
    assert.equal(seen.skip, 25);
    assert.equal(seen.limit, 25);
    assert.equal(result.users[0].lastSeenAt, "2026-10-27T12:00:00Z");
  } finally {
    for (const key of Object.keys(dependencies)) delete overrides[key];
  }
});
