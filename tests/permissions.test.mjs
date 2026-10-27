import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
const require = createRequire(import.meta.url);
const ts = require("typescript");
function load(file, dependencies = {}) {
  const source = ts.transpileModule(
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => (name in dependencies ? dependencies[name] : require(name)),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const catalog = load("app/lib/permissions/catalog.ts");
const { can, resolveAccess, SYSTEM_PROFILES, PERMISSION_KEYS } = catalog;
const validation = load("app/lib/admin/validation.ts", {
  "@/lib/permissions/catalog": catalog,
});
class AdminError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

test("permissions deny anonymous and empty access; exact names only", () => {
  assert.equal(can(null, "users.read"), false);
  assert.equal(can({}, "users.read"), false);
  assert.equal(
    can({ permissions: ["users.read"] }, "users.status.update"),
    false,
  );
  assert.equal(can({ permissions: ["users.read"] }, "users.read"), true);
});
test("legacy admin retains privileges without becoming a superadmin", () => {
  const access = resolveAccess({ role: "admin" }, null);
  assert.equal(can(access, "songs.manage"), true);
  assert.equal(can(access, "chords.proposals.review"), true);
  assert.equal(access.isSuperadmin, false);
  assert.equal(can(access, "users.read"), false);
  assert.equal(can(access, "admin.access"), false);
  assert.equal(can(access, "permissionProfiles.update"), false);
});
test("assigned profiles override legacy admin and missing profiles fail closed", () => {
  const user = { role: "admin", permissionProfileId: "observer" };
  assert.equal(can(resolveAccess(user, null), "songs.manage"), false);
  const access = resolveAccess(user, {
    _id: "observer",
    permissions: ["admin.access", "users.read"],
    isSystem: false,
  });
  assert.equal(can(access, "users.read"), true);
  assert.equal(can(access, "users.status.update"), false);
  assert.equal(
    can(
      resolveAccess(user, {
        _id: "admin",
        permissions: ["songs.manage"],
        isSystem: true,
      }),
      "songs.manage",
    ),
    false,
  );
});
test("only the assigned system root profile grants all permissions", () => {
  const user = { permissionProfileId: "superadmin" };
  assert.equal(resolveAccess(user, null).isSuperadmin, false);
  assert.equal(
    resolveAccess(user, { _id: "superadmin", permissions: [], isSystem: false })
      .isSuperadmin,
    false,
  );
  const root = resolveAccess(user, {
    _id: "superadmin",
    permissions: [],
    isSystem: true,
  });
  for (const key of PERMISSION_KEYS) assert.equal(can(root, key), true);
});
test("viewer and editor keep their original lack of global overrides", () => {
  for (const role of ["viewer", "editor"]) {
    const profile = SYSTEM_PROFILES.find((p) => p._id === role);
    assert.deepEqual(resolveAccess({ role }, profile).permissions, []);
  }
});
test("profile/user inputs reject unknown permissions and mass assignment", () => {
  assert.throws(() =>
    validation.profileInputSchema.parse({
      name: "Профіль",
      permissions: ["users.*"],
    }),
  );
  assert.throws(() =>
    validation.profileInputSchema.parse({
      name: "Профіль",
      permissions: [],
      isSystem: true,
    }),
  );
  assert.throws(() =>
    validation.profileInputSchema.parse({
      name: "Профіль",
      permissions: ["users.read", "users.read"],
    }),
  );
  assert.throws(() => validation.userUpdateSchema.parse({ role: "admin" }));
  assert.throws(() => validation.userUpdateSchema.parse({}));
  assert.throws(() => validation.userUpdateSchema.parse({ isActive: "false" }));
});

const actorId = "111111111111111111111111";
const targetId = "222222222222222222222222";
function fixture({
  rootActor = false,
  permissions = ["admin.access", "users.status.update"],
  rootTarget = false,
  activeRoots = 1,
  profileExists = true,
  actorActive = true,
  rootExists = true,
} = {}) {
  const calls = [];
  const actorProfile = {
    _id: rootActor ? "superadmin" : "custom",
    permissions,
    isSystem: rootActor,
  };
  const actor = {
    _id: actorId,
    isActive: actorActive,
    permissionProfileId: actorProfile._id,
  };
  const target = {
    _id: targetId,
    isActive: true,
    permissionProfileId: rootTarget ? "superadmin" : "user",
  };
  const query = (value) => ({
    session() {
      return this;
    },
    lean: async () => value,
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  });
  const session = {
    withTransaction: async (fn) => fn(),
    endSession: async () => {
      calls.push("ended");
    },
  };
  const mutations = load("app/lib/admin/mutations.ts", {
    "server-only": {},
    mongoose: {
      isObjectIdOrHexString: (value) => /^[a-f0-9]{24}$/i.test(value),
    },
    "@/lib/db": {
      connectDB: async () => ({ startSession: async () => session }),
    },
    "@/models/User": {
      User: {
        findById: (id) => query(id === actorId ? actor : target),
        countDocuments: () => {
          calls.push("count-roots");
          return query(activeRoots);
        },
        updateOne: async (...args) => {
          calls.push(["update-user", ...args]);
        },
        exists: () => query(rootActor && actorActive ? actor : null),
      },
    },
    "@/models/PermissionProfile": {
      PermissionProfile: {
        findOneAndUpdate: async (...args) => {
          calls.push(["lock-root", ...args]);
          return rootExists ? { _id: "superadmin", isSystem: true } : null;
        },
        findById: (id) =>
          query(
            id === actorProfile._id
              ? actorProfile
              : profileExists
                ? { _id: id, permissions: [], isSystem: false }
                : null,
          ),
        exists: () => query(profileExists),
        findByIdAndUpdate: async (id) => ({ _id: id }),
        create: async () => [{ _id: "new-profile" }],
      },
    },
    "@/models/AdminAudit": {
      AdminAudit: {
        create: async (entries, options) => {
          calls.push(["audit", entries, options]);
        },
      },
    },
    "@/lib/permissions/catalog": catalog,
    "@/lib/permissions/server": {
      getUserAccess: async () => {
        throw Error("Unexpected legacy fallback");
      },
    },
    "./errors": { AdminError },
    "./validation": validation,
  });
  return {
    ...mutations,
    calls,
    actor: { id: actorId, isSuperadmin: rootActor },
  };
}

test("status changes need fresh server permissions, not supplied actor flags", async () => {
  const data = fixture({ permissions: ["admin.access"] });
  await assert.rejects(
    data.updateAdminUser({ ...data.actor, isSuperadmin: true }, targetId, {
      isActive: false,
    }),
    (e) => e.status === 403,
  );
  assert.ok(
    !data.calls.some((c) => Array.isArray(c) && c[0] === "update-user"),
  );
});
test("blocked actors and missing bootstrap cannot mutate users", async () => {
  for (const options of [{ actorActive: false }, { rootExists: false }]) {
    const data = fixture(options);
    await assert.rejects(
      data.updateAdminUser(data.actor, targetId, { isActive: false }),
    );
    assert.ok(
      !data.calls.some((c) => Array.isArray(c) && c[0] === "update-user"),
    );
    assert.equal(data.calls.at(-1), "ended");
  }
});
test("non-root cannot assign profiles or modify root accounts", async () => {
  for (const [options, changes] of [
    [{}, { permissionProfileId: "superadmin" }],
    [{ rootTarget: true }, { isActive: false }],
  ]) {
    const data = fixture(options);
    await assert.rejects(
      data.updateAdminUser(data.actor, targetId, changes),
      (e) => e.status === 403,
    );
  }
});
test("the final active root cannot be disabled or demoted", async () => {
  for (const changes of [
    { isActive: false },
    { permissionProfileId: "user" },
  ]) {
    const data = fixture({ rootActor: true, rootTarget: true, activeRoots: 1 });
    await assert.rejects(
      data.updateAdminUser(data.actor, targetId, changes),
      (e) => e.status === 409,
    );
    assert.equal(data.calls[0][0], "lock-root");
    assert.ok(data.calls.includes("count-roots"));
    assert.ok(
      !data.calls.some((c) => Array.isArray(c) && c[0] === "update-user"),
    );
  }
});
test("allowed status changes and audits share the transaction", async () => {
  const data = fixture();
  await data.updateAdminUser(data.actor, targetId, { isActive: false });
  const update = data.calls.find(
    (c) => Array.isArray(c) && c[0] === "update-user",
  );
  const audit = data.calls.find((c) => Array.isArray(c) && c[0] === "audit");
  assert.deepEqual(update[2], { $set: { isActive: false } });
  assert.equal(update[3].session, audit[2].session);
  assert.equal(audit[1][0].before.isActive, true);
  assert.equal(audit[1][0].after.isActive, false);
});
test("root can demote another root when an active root remains", async () => {
  const data = fixture({ rootActor: true, rootTarget: true, activeRoots: 2 });
  await data.updateAdminUser(data.actor, targetId, {
    permissionProfileId: "user",
  });
  assert.ok(data.calls.some((c) => Array.isArray(c) && c[0] === "audit"));
});
test("assigning a missing profile is rejected", async () => {
  const data = fixture({ rootActor: true, profileExists: false });
  await assert.rejects(
    data.updateAdminUser(data.actor, targetId, {
      permissionProfileId: "missing",
    }),
    (e) => e.status === 404,
  );
});
test("root profile cannot be changed and non-root cannot create profiles", async () => {
  const input = { name: "Профіль", permissions: [] };
  const data = fixture();
  await assert.rejects(
    data.saveAdminProfile(data.actor, input, "superadmin"),
    (e) => e.status === 403,
  );
  await assert.rejects(
    data.saveAdminProfile(data.actor, input),
    (e) => e.status === 403,
  );
});
test("root creates custom profiles with an audit entry", async () => {
  const data = fixture({ rootActor: true });
  assert.equal(
    await data.saveAdminProfile(data.actor, {
      name: "Спостерігач",
      permissions: ["admin.access", "users.read"],
    }),
    "new-profile",
  );
  assert.equal(
    data.calls.find((c) => Array.isArray(c) && c[0] === "audit")[1][0].action,
    "admin.profile.created",
  );
});

function authFixture({
  cookie = true,
  active = true,
  profileId = "observer",
  role = "admin",
} = {}) {
  const calls = [];
  const getUserAccess = load("app/lib/permissions/server.ts", {
    "server-only": {},
    "@/models/PermissionProfile": {
      PermissionProfile: {
        findById: () => ({
          lean: async () => ({
            _id: "observer",
            isSystem: false,
            permissions: ["admin.access", "users.read"],
          }),
        }),
      },
    },
    "./catalog": catalog,
  }).getUserAccess;
  const server = load("app/lib/serverAuth.ts", {
    react: { cache: (fn) => fn },
    "next/headers": {
      cookies: async () => ({
        get: () => (cookie ? { value: "session" } : undefined),
      }),
    },
    jose: { jwtVerify: async () => ({ payload: { userId: actorId } }) },
    "@/lib/db": { connectDB: async () => {} },
    "@/models/User": {
      User: {
        findById: () => {
          calls.push("read-user");
          return {
            select: async () => ({
              _id: { toString: () => actorId },
              isActive: active,
              role,
              permissionProfileId: profileId,
            }),
          };
        },
      },
    },
    "@/lib/permissions/server": { getUserAccess },
  });
  return { ...server, calls };
}

test("authentication without a cookie does not look up or grant a user", async () => {
  const auth = authFixture({ cookie: false });
  assert.deepEqual(await auth.getServerAuth(), {
    authenticated: false,
    user: null,
  });
  assert.deepEqual(auth.calls, []);
});
test("blocked accounts cannot authenticate even with a valid JWT", async () => {
  const auth = authFixture({ active: false });
  assert.equal((await auth.getServerAuth()).authenticated, false);
});
test("server session resolves current profile permissions instead of trusting legacy role", async () => {
  const { user } = await authFixture().getServerAuth();
  assert.equal(user.role, "admin");
  assert.equal(can(user, "users.read"), true);
  assert.equal(can(user, "songs.manage"), false);
  assert.equal(user.isSuperadmin, false);
});
test("server sessions with a missing explicit profile fail closed", async () => {
  const { user } = await authFixture({ profileId: "missing" }).getServerAuth();
  assert.equal(can(user, "admin.access"), false);
});
test("admin APIs require both section access and specific permissions; delegation stays root-only", async () => {
  for (const [user, requested] of [
    [null, "users.read"],
    [{ id: actorId, permissions: ["users.read"] }, "users.read"],
    [{ id: actorId, permissions: ["admin.access"] }, "users.read"],
  ]) {
    const access = load("app/lib/admin/access.ts", {
      "server-only": {},
      "@/lib/serverAuth": { getServerAuth: async () => ({ user }) },
      "@/lib/permissions/catalog": catalog,
      "./errors": { AdminError },
    });
    await assert.rejects(access.requireAdminPermission(requested), (error) =>
      [401, 403].includes(error.status),
    );
  }
  const access = load("app/lib/admin/access.ts", {
    "server-only": {},
    "@/lib/serverAuth": {
      getServerAuth: async () => ({
        user: {
          id: actorId,
          permissions: ["admin.access", "permissionProfiles.create"],
        },
      }),
    },
    "@/lib/permissions/catalog": catalog,
    "./errors": { AdminError },
  });
  await assert.rejects(
    access.requireSuperadmin("permissionProfiles.create"),
    (error) => error.status === 403,
  );
});
