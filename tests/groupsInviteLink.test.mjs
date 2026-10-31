import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const compiled = ts.transpileModule(
  readFileSync(
    new URL("../app/api/group-invite/route.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const token = "a".repeat(43);

function setup({ authenticated = true, updated = null, existing = null } = {}) {
  const calls = [];
  const deps = {
    "node:crypto": require("node:crypto"),
    "next/server": {
      NextResponse: {
        json: (body, options = {}) => ({ body, status: options.status || 200 }),
      },
    },
    "@/lib/serverAuth": {
      getServerAuth: async () => ({
        authenticated,
        user: authenticated ? { id: "user" } : null,
      }),
    },
    "@/lib/db": { connectDB: async () => {} },
    "@/lib/activity/server": {
      recordActivitySafely: async (entry) => calls.push(["activity", entry]),
    },
    "@/models/Group": {
      Group: {
        findOneAndUpdate: async (...args) => {
          calls.push(["update", ...args]);
          return updated;
        },
        findOne: (filter) => {
          calls.push(["find", filter]);
          return { select: async () => existing };
        },
      },
    },
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => {
      assert.ok(name in deps, name);
      return deps[name];
    },
    mod,
    mod.exports,
  );
  return { ...mod.exports, calls };
}
const request = (value) => ({ json: async () => ({ token: value }) });

test("joining requires authentication and a valid token", async () => {
  assert.equal(
    (await setup({ authenticated: false }).POST(request(token))).status,
    401,
  );
  const fixture = setup();
  assert.equal((await fixture.POST(request("bad"))).status, 400);
  assert.equal(fixture.calls.length, 0);
});

test("joining atomically checks the hash, expiry and existing membership and grants member role", async () => {
  const fixture = setup({ updated: { _id: "group" } });
  const response = await fixture.POST(request(token));
  assert.deepEqual(response.body, { groupId: "group", alreadyMember: false });
  const [, filter, update] = fixture.calls[0];
  assert.equal(
    filter["inviteLink.tokenHash"],
    require("node:crypto").createHash("sha256").update(token).digest("hex"),
  );
  assert.ok(filter["inviteLink.expiresAt"].$gt instanceof Date);
  assert.deepEqual(filter["members.userId"], { $ne: "user" });
  assert.deepEqual(update.$push.members, { userId: "user", role: "member" });
  assert.equal(fixture.calls[1][0], "activity");
});

test("already joined is idempotent, while expired or revoked links are rejected", async () => {
  const already = setup({ existing: { _id: "group" } });
  assert.deepEqual((await already.POST(request(token))).body, {
    groupId: "group",
    alreadyMember: true,
  });
  assert.equal(already.calls[1][1]["members.userId"], "user");
  assert.equal((await setup().POST(request(token))).status, 410);
});

const adminCompiled = ts.transpileModule(
  readFileSync(
    new URL(
      "../app/api/groups/[groupId]/invite-link/route.ts",
      import.meta.url,
    ),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function adminSetup({
  authenticated = true,
  group = {},
  matchedCount = 1,
} = {}) {
  const calls = [];
  const deps = {
    "node:crypto": require("node:crypto"),
    mongoose: { isValidObjectId: (value) => value === "group" },
    "next/server": {
      NextResponse: {
        json: (body, options = {}) => ({ body, status: options.status || 200 }),
      },
    },
    "@/lib/serverAuth": {
      getServerAuth: async () => ({
        authenticated,
        user: authenticated ? { id: "admin" } : null,
      }),
    },
    "@/lib/db": { connectDB: async () => {} },
    "@/models/Group": {
      Group: {
        findOne: (filter) => {
          calls.push(["find", filter]);
          return { select: async () => group };
        },
        updateOne: async (...args) => {
          calls.push(["update", ...args]);
          return { matchedCount };
        },
      },
    },
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", adminCompiled)(
    (name) => {
      assert.ok(name in deps, name);
      return deps[name];
    },
    mod,
    mod.exports,
  );
  return { ...mod.exports, calls };
}
const context = { params: Promise.resolve({ groupId: "group" }) };

test("only group owners and administrators can manage links", async () => {
  assert.equal(
    (await adminSetup({ authenticated: false }).POST({}, context)).status,
    401,
  );
  assert.equal(
    (await adminSetup({ group: null }).DELETE({}, context)).status,
    403,
  );
  const fixture = adminSetup({ matchedCount: 0 });
  assert.equal((await fixture.POST({}, context)).status, 403);
  for (const [, filter] of fixture.calls)
    assert.deepEqual(filter.members.$elemMatch, {
      userId: "admin",
      role: { $in: ["owner", "admin"] },
    });
});

test("creating replaces the previous link with a one-day hashed token and revocation removes it", async () => {
  const fixture = adminSetup();
  const before = Date.now();
  const response = await fixture.POST({}, context);
  const [, , update] = fixture.calls[1];
  assert.match(response.body.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(
    update.$set.inviteLink.tokenHash,
    require("node:crypto")
      .createHash("sha256")
      .update(response.body.token)
      .digest("hex"),
  );
  assert.ok(update.$set.inviteLink.expiresAt.getTime() >= before + 86_400_000);
  assert.ok(
    update.$set.inviteLink.expiresAt.getTime() <= Date.now() + 86_400_000,
  );
  await fixture.DELETE({}, context);
  assert.deepEqual(fixture.calls[3][2], { $unset: { inviteLink: 1 } });
});
