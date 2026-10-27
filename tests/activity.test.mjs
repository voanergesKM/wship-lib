import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url);
const ts = require("typescript");
function load(file, dependencies = {}) {
  const code = ts.transpileModule(
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => (name in dependencies ? dependencies[name] : require(name)),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const catalog = load("app/lib/activity/catalog.ts");
const filters = load("app/lib/activity/filters.ts", { "./catalog": catalog });
const actorId = "111111111111111111111111";
const groupId = "222222222222222222222222";
const songId = "333333333333333333333333";
const listId = "444444444444444444444444";
const view = {
  action: "song.view",
  eventId: "8f98ef2a-654e-4fc4-91af-e187e32d13de",
  slug: "song",
};
const input = {
  action: "song.view",
  actorId,
  targetId: songId,
  payload: { slug: "song" },
};
class AdminError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

test("public activity accepts only song views, not server/admin actions or claimed identity/time", () => {
  assert.equal(catalog.songViewSchema.parse(view).action, "song.view");
  for (const extra of [
    { action: "admin.user.updated" },
    { action: "song.created" },
    { actorId },
    { occurredAt: new Date().toISOString() },
    { source: "server" },
    { payload: {} },
  ]) {
    assert.throws(() => catalog.songViewSchema.parse({ ...view, ...extra }));
  }
});
test("view contexts and IDs are validated", () => {
  assert.throws(() => catalog.songViewSchema.parse({ ...view, listId }));
  assert.throws(() =>
    catalog.songViewSchema.parse({ ...view, groupId: "invalid" }),
  );
  assert.throws(() =>
    catalog.songViewSchema.parse({ ...view, eventId: "bad" }),
  );
  assert.ok(catalog.songViewSchema.parse({ ...view, groupId, listId }));
});
test("per-action payloads reject raw bodies, secrets and wrong payload shapes", () => {
  assert.throws(() =>
    catalog.validateActivity({
      ...input,
      payload: { slug: "song", token: "secret" },
    }),
  );
  assert.throws(() =>
    catalog.validateActivity({
      ...input,
      action: "auth.login",
      payload: { slug: "song" },
    }),
  );
  assert.throws(() => catalog.validateActivity({ ...input, actorId: "bad" }));
  assert.throws(() =>
    catalog.validateActivity({ ...input, action: "unknown" }),
  );
  assert.equal(catalog.validateActivity(input).targetKind, "song");
});
test("filter input rejects invalid actions, dates and reversed intervals", () => {
  for (const value of [
    { action: "unknown" },
    { from: "2026-02-30" },
    { from: "2026-10-28", to: "2026-10-27" },
  ])
    assert.equal(filters.activitySearchSchema.safeParse(value).success, false);
  assert.equal(
    filters.activitySearchSchema.parse({ action: "", source: "", page: "bad" })
      .page,
    1,
  );
});
test("Kyiv calendar filters are inclusive and account for DST", () => {
  const winter = filters.activityDateRange("2026-10-27", "2026-10-27");
  assert.equal(winter.$gte.toISOString(), "2026-10-26T22:00:00.000Z");
  assert.equal(winter.$lt.toISOString(), "2026-10-27T22:00:00.000Z");
  const autumn = filters.activityDateRange("2026-10-25", "2026-10-25");
  assert.equal(autumn.$lt - autumn.$gte, 25 * 3600000);
  const spring = filters.activityDateRange("2026-03-29", "2026-03-29");
  assert.equal(spring.$lt - spring.$gte, 23 * 3600000);
});

function writerFixture({ error, upsertedCount } = {}) {
  const events = new Map();
  const touches = [];
  const writes = [];
  const model = {
    exists: async ({ eventId }) => events.has(eventId),
    updateOne: async (filter, update, options) => {
      writes.push({ filter, update, options });
      if (error) throw error;
      if (events.has(filter.eventId) || upsertedCount === 0)
        return { upsertedCount: 0 };
      events.set(filter.eventId, update.$setOnInsert);
      return { upsertedCount: 1 };
    },
  };
  const server = load("app/lib/activity/server.ts", {
    "server-only": {},
    "@/models/ActivityEvent": { ActivityEvent: model },
    "@/models/User": {
      User: {
        updateOne: async (...args) => {
          touches.push(args);
        },
      },
    },
    "@/lib/db": { connectDB: async () => {} },
    "./catalog": catalog,
  });
  return { ...server, events, touches, writes, model };
}
test("server events get their own namespace and a server timestamp", async () => {
  const data = writerFixture();
  await data.recordActivity({
    action: "auth.logout",
    actorId,
    targetId: actorId,
    payload: {},
  });
  const [id, event] = [...data.events][0];
  assert.ok(id.startsWith("server:"));
  assert.equal(event.source, "server");
  assert.ok(event.occurredAt instanceof Date);
  assert.equal(event.expiresAt, undefined);
});
test("only views expire after 90 days", async () => {
  const data = writerFixture();
  await data.recordActivity(input);
  const event = [...data.events.values()][0];
  assert.equal(event.expiresAt - event.occurredAt, 90 * 86400000);
});
test("idempotent writes do not duplicate events or refresh lastSeenAt", async () => {
  const data = writerFixture();
  assert.equal(await data.recordActivity(input, { eventId: "same" }), true);
  assert.equal(await data.recordActivity(input, { eventId: "same" }), false);
  assert.equal(data.events.size, 1);
  assert.equal(data.touches.length, 1);
  assert.ok(data.touches[0][1].$max.lastSeenAt instanceof Date);
  assert.ok(data.touches[0][0].$or[1].lastSeenAt.$lt instanceof Date);
});
test("nontransactional duplicate-key races are idempotent", async () => {
  assert.equal(
    await writerFixture({ error: { code: 11000 } }).recordActivity(input),
    false,
  );
});
test("transactional recording never swallows an aborted write", async () => {
  const data = writerFixture({ error: { code: 11000 } });
  await assert.rejects(data.recordActivity(input, { session: {} }));
});
test("ordinary recording failures do not fail an already completed operation", async () => {
  const data = writerFixture({ error: new Error("offline") });
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal(await data.recordActivitySafely(input), false);
  } finally {
    console.error = original;
  }
});
test("audit mirroring uses a deterministic key and the same transaction", async () => {
  const data = writerFixture();
  const session = {};
  await data.recordAdminAuditActivity(
    {
      _id: "audit-id",
      actorId,
      action: "admin.user.updated",
      targetId: songId,
    },
    session,
  );
  assert.ok(data.events.has("server:admin-audit:audit-id"));
  assert.equal(data.writes[0].options.session, session);
  assert.equal(data.touches[0][2].session, session);
});

function viewFixture({
  song = true,
  member = true,
  inList = true,
  limit = false,
} = {}) {
  const writer = writerFixture();
  const quotas = [];
  const service = load("app/lib/activity/songView.ts", {
    "server-only": {},
    "@/models/ActivityEvent": {
      ActivityEvent: writer.model,
      ActivityRateLimit: {
        findOneAndUpdate: async (...args) => {
          quotas.push(args);
          if (limit) throw { code: 11000 };
        },
      },
    },
    "@/models/Song": {
      Song: {
        findOne: () => ({
          select() {
            return this;
          },
          lean: async () =>
            song
              ? { _id: songId, slug: "canonical", title: "Назва пісні" }
              : null,
        }),
      },
    },
    "@/models/Group": {
      Group: {
        exists: async (filter) => {
          assert.equal(filter["members.userId"], actorId);
          return member;
        },
      },
    },
    "@/models/SongList": {
      SongList: {
        exists: async (filter) => {
          assert.equal(filter.groupId, groupId);
          assert.equal(filter.songs, songId);
          return inList;
        },
      },
    },
    "@/lib/db": { connectDB: async () => {} },
    "@/lib/admin/errors": { AdminError },
    "./catalog": catalog,
    "./server": writer,
  });
  return { ...service, ...writer, quotas };
}
test("views store canonical song identity, scoped actor IDs and client source", async () => {
  const data = viewFixture();
  await data.recordSongView(actorId, view);
  const [key, event] = [...data.events][0];
  assert.equal(key, `client:${actorId}:${view.eventId}`);
  assert.equal(event.actorId, actorId);
  assert.equal(event.targetId, songId);
  assert.equal(event.targetLabel, "Назва пісні");
  assert.equal(event.payload.slug, "canonical");
  assert.equal(event.source, "client");
});
test("duplicate client retries bypass quota and writes", async () => {
  const data = viewFixture();
  await data.recordSongView(actorId, view);
  await data.recordSongView(actorId, view);
  assert.equal(data.events.size, 1);
  assert.equal(data.quotas.length, 1);
  assert.equal(data.touches.length, 1);
});
test("client contexts cannot fabricate membership or playlist song ownership", async () => {
  for (const [options, status] of [
    [{ member: false }, 403],
    [{ inList: false }, 404],
    [{ song: false }, 404],
  ]) {
    const data = viewFixture(options);
    await assert.rejects(
      data.recordSongView(actorId, { ...view, groupId, listId }),
      (error) => error.status === status,
    );
    assert.equal(data.events.size, 0);
    assert.equal(data.quotas.length, 0);
  }
});
test("view quota is a database conditional increment and refuses exhausted buckets", async () => {
  const data = viewFixture({ limit: true });
  await assert.rejects(
    data.recordSongView(actorId, view),
    (error) => error.status === 429,
  );
  assert.equal(data.quotas[0][0].count.$lt, 30);
  assert.equal(data.quotas[0][1].$inc.count, 1);
  assert.equal(data.quotas[0][2].upsert, true);
  assert.equal(data.events.size, 0);
});
test("the public endpoint rejects anonymous requests before recording", async () => {
  let called = false;
  const route = load("app/api/activity/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/serverAuth": { getServerAuth: async () => ({ user: null }) },
    "@/lib/activity/songView": {
      recordSongView: async () => {
        called = true;
      },
    },
    "@/lib/admin/errors": {
      adminErrorResponse: () => new Response(null, { status: 500 }),
    },
  });
  const response = await route.POST(
    new Request("http://localhost/api/activity", {
      method: "POST",
      body: JSON.stringify(view),
    }),
  );
  assert.equal(response.status, 401);
  assert.equal(called, false);
});
test("the public endpoint derives the actor from the authenticated session", async () => {
  let received;
  const route = load("app/api/activity/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/serverAuth": {
      getServerAuth: async () => ({ user: { id: actorId } }),
    },
    "@/lib/activity/songView": {
      recordSongView: async (...args) => {
        received = args;
      },
    },
    "@/lib/admin/errors": {
      adminErrorResponse: () => new Response(null, { status: 500 }),
    },
  });
  assert.equal(
    (
      await route.POST(
        new Request("http://localhost/api/activity", {
          method: "POST",
          body: JSON.stringify(view),
        }),
      )
    ).status,
    204,
  );
  assert.equal(received[0], actorId);
  assert.deepEqual(received[1], view);
});

test("activity reads enforce permissions before querying records", async () => {
  let queried = false;
  const data = load("app/lib/activity/data.ts", {
    "server-only": {},
    "@/models/ActivityEvent": {
      ActivityEvent: {
        find: () => {
          queried = true;
        },
      },
    },
    "@/models/User": {},
    "@/models/Group": {},
    "@/models/Song": {},
    "@/models/SongList": {},
    "@/models/PermissionProfile": {},
    "./filters": filters,
    "@/lib/admin/access": {
      requireAdminPermission: async (permission) => {
        assert.equal(permission, "activity.read");
        throw new AdminError("Forbidden", 403);
      },
    },
  });
  await assert.rejects(
    data.getActivityEvents({}),
    (error) => error.status === 403,
  );
  assert.equal(queried, false);
});
test("invalid journal filters return a useful error without a DB read", async () => {
  const data = load("app/lib/activity/data.ts", {
    "server-only": {},
    "@/models/ActivityEvent": {},
    "@/models/User": {},
    "@/models/Group": {},
    "@/models/Song": {},
    "@/models/SongList": {},
    "@/models/PermissionProfile": {},
    "./filters": filters,
    "@/lib/admin/access": { requireAdminPermission: async () => {} },
  });
  assert.ok((await data.getActivityEvents({ action: "invalid" })).error);
});

function hookFixture(visible = true) {
  let current = null;
  let effect;
  const listeners = new Set();
  const requests = [];
  const oldDocument = globalThis.document;
  const oldFetch = globalThis.fetch;
  globalThis.document = {
    visibilityState: visible ? "visible" : "hidden",
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  };
  globalThis.fetch = async (_, options) => {
    requests.push(JSON.parse(options.body));
    return new Response(null, { status: 204 });
  };
  const hook = load("app/hooks/useSongViewActivity.ts", {
    react: {
      useRef: () => (current ||= { current: null }),
      useEffect: (fn) => {
        effect = fn;
      },
    },
  }).useSongViewActivity;
  return {
    requests,
    render: (props) => {
      hook(props);
      return effect();
    },
    show: () => {
      document.visibilityState = "visible";
      for (const fn of listeners) fn();
    },
    restore: () => {
      globalThis.document = oldDocument;
      globalThis.fetch = oldFetch;
    },
  };
}
test("hidden song pages wait for visibility; Strict Mode effect replay does not double count", () => {
  const hook = hookFixture(false);
  try {
    const props = {
      slug: "song",
      userId: actorId,
      groupId: null,
      listId: null,
    };
    const cleanup = hook.render(props);
    assert.equal(hook.requests.length, 0);
    cleanup();
    hook.render(props);
    hook.show();
    hook.show();
    assert.equal(hook.requests.length, 1);
    assert.equal(hook.requests[0].actorId, undefined);
  } finally {
    hook.restore();
  }
});
test("navigation creates a new view ID, while guest/unloaded views are not tracked", () => {
  const hook = hookFixture();
  try {
    hook.render({
      slug: undefined,
      userId: actorId,
      groupId: null,
      listId: null,
    });
    hook.render({
      slug: "song",
      userId: undefined,
      groupId: null,
      listId: null,
    });
    assert.equal(hook.requests.length, 0);
    hook.render({ slug: "song", userId: actorId, groupId: null, listId: null });
    hook.render({
      slug: "other",
      userId: actorId,
      groupId: null,
      listId: null,
    });
    hook.render({ slug: "song", userId: actorId, groupId: null, listId: null });
    assert.equal(new Set(hook.requests.map((event) => event.eventId)).size, 3);
  } finally {
    hook.restore();
  }
});

test("server mutations record the authenticated actor only after a successful write", async () => {
  for (const fail of [false, true]) {
    const events = [];
    const route = load("app/api/songs/route.ts", {
      "next/server": { NextResponse: Response },
      "@/lib/serverAuth": {
        getServerAuth: async () => ({ user: { id: actorId } }),
      },
      "@/models/Song": {
        Song: {
          create: async () => {
            if (fail) throw new Error("write failed");
            return { _id: songId, title: "Збережена пісня", slug: "saved" };
          },
        },
      },
      "@/utils/youtubeLinks": { normalizeYouTubeLinks: () => [] },
      "@/lib/db": { connectDB: async () => {} },
      "@/lib/data/songs": {},
      "next/cache": { revalidatePath: () => {} },
      "@/lib/activity/server": {
        recordActivitySafely: async (input) => {
          events.push(input);
          return true;
        },
      },
    });
    const original = console.error;
    console.error = () => {};
    try {
      const response = await route.POST(
        new Request("http://localhost/api/songs", {
          method: "POST",
          body: JSON.stringify({
            title: "Пісня",
            actorId: "forged",
            occurredAt: "old",
          }),
        }),
      );
      assert.equal(response.status, fail ? 500 : 201);
      assert.equal(events.length, fail ? 0 : 1);
      if (!fail) {
        assert.equal(events[0].actorId, actorId);
        assert.equal(events[0].targetLabel, "Збережена пісня");
      }
    } finally {
      console.error = original;
    }
  }
});
test("browsers without randomUUID skip telemetry rather than breaking the viewer", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const hook = hookFixture();
  try {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {},
    });
    assert.doesNotThrow(() =>
      hook.render({
        slug: "song",
        userId: actorId,
        groupId: null,
        listId: null,
      }),
    );
    assert.equal(hook.requests.length, 0);
  } finally {
    hook.restore();
    Object.defineProperty(globalThis, "crypto", descriptor);
  }
});

test("journal rows resolve human-readable object/context names in batches and preserve snapshots", async () => {
  const query = (value) => ({
    select() {
      return this;
    },
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    lean: async () => value,
  });
  const rows = [
    {
      _id: "event1",
      targetKind: "song",
      targetId: songId,
      payload: { listId },
    },
    {
      _id: "event2",
      targetKind: "song",
      targetId: songId,
      targetLabel: "Стара назва",
      payload: {},
    },
    { _id: "event3", targetKind: "user", targetId: actorId, payload: {} },
  ];
  const data = load("app/lib/activity/data.ts", {
    "server-only": {},
    "./filters": filters,
    "@/lib/admin/access": { requireAdminPermission: async () => {} },
    "@/models/ActivityEvent": {
      ActivityEvent: {
        find: () => query(rows),
        countDocuments: async () => rows.length,
      },
    },
    "@/models/User": {
      User: { find: () => query([{ _id: actorId, firstName: "Іван" }]) },
    },
    "@/models/Song": {
      Song: { find: () => query([{ _id: songId, title: "Поточна назва" }]) },
    },
    "@/models/SongList": {
      SongList: { find: () => query([{ _id: listId, name: "Неділя" }]) },
    },
    "@/models/Group": {},
    "@/models/PermissionProfile": {},
  });
  const result = await data.getActivityEvents({});
  assert.equal(result.events[0].targetLabel, "Поточна назва");
  assert.equal(result.events[0].contextLabel, "Список: Неділя");
  assert.equal(result.events[1].targetLabel, "Стара назва");
  assert.equal(result.events[2].targetLabel, "Іван");
});
