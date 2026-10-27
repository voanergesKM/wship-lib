import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const compiled = ts.transpileModule(
  readFileSync(new URL("../app/lib/data/groups.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

const id = (value) => ({ toString: () => value, toJSON: () => value });
function memberGroup(userId = "member") {
  const group = {
    _id: id("group"),
    members: [{ userId: id(userId), role: "owner" }],
    invitations: [],
  };
  Object.defineProperty(group, "populate", { value: async function (paths) {
    this.populated = paths;
    return this;
  } });
  return group;
}

function fixture({ group = memberGroup(), list = null, groups = [], lists = [] } = {}) {
  const calls = [];
  const query = (result) => ({
    populate(...args) { calls.push(["populate", ...args]); return this; },
    sort(value) { calls.push(["sort", value]); return this; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  });
  const dependencies = {
    "server-only": {},
    react: { cache: (fn) => fn },
    "../db": { connectDB: async () => { calls.push(["connect"]); } },
    "@/models/Group": { Group: {
      findById: async (groupId) => { calls.push(["group", groupId]); return group; },
      find: (filter) => { calls.push(["groups", filter]); return query(groups); },
    } },
    "@/models/SongList": { SongList: {
      find: (filter) => { calls.push(["lists", filter]); return query(lists); },
      findOne: (filter) => { calls.push(["list", filter]); return query(list); },
    } },
    "@/models/Arrangement": {},
  };
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", compiled)((name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, loadedModule, loadedModule.exports);
  return { ...loadedModule.exports, calls, group };
}

test("non-members cannot read group details, playlists or songs", async () => {
  for (const read of [
    (data) => data.getGroupDetails("group", "outsider"),
    (data) => data.getSongLists("group", "outsider"),
    (data) => data.getSongListDetails("group", "list", "outsider"),
  ]) {
    const data = fixture();
    await assert.rejects(read(data), (error) => error.status === 403);
    assert.equal(data.group.populated, undefined);
    assert.ok(!data.calls.some(([name]) => ["list", "lists", "populate"].includes(name)));
  }
});

test("missing group returns 404 before looking up a playlist", async () => {
  const data = fixture({ group: null });
  await assert.rejects(data.getSongListDetails("missing", "list", "member"), (error) => error.status === 404);
  assert.ok(!data.calls.some(([name]) => name === "list"));
});

test("playlist lookup is scoped to its group and a missing playlist returns 404", async () => {
  const data = fixture();
  await assert.rejects(data.getSongListDetails("group", "other-list", "member"), (error) => error.status === 404);
  assert.deepEqual(data.calls.find(([name]) => name === "list"), ["list", { _id: "other-list", groupId: "group" }]);
});

test("member reads serialize ids/dates and retain populated songs and arrangements", async () => {
  const list = {
    _id: id("list"), groupId: id("group"),
    songs: [{ _id: id("song"), title: "Пісня", document: "[Am]Текст" }],
    songArrangements: [{ song: id("song"), arrangement: { _id: id("arrangement"), items: [] } }],
    updatedAt: new Date("2026-10-27T12:00:00Z"),
  };
  const data = fixture({ list });
  const result = await data.getSongListDetails("group", "list", "member");
  assert.deepEqual(result, JSON.parse(JSON.stringify(list)));
  assert.equal(result.updatedAt, "2026-10-27T12:00:00.000Z");
  assert.ok(data.calls.some(([name, field]) => name === "populate" && field === "songArrangements.arrangement"));
});

test("group detail population happens after checking membership", async () => {
  const data = fixture();
  const group = await data.getGroupDetails("group", "member");
  assert.equal(group._id, "group");
  assert.deepEqual(data.group.populated.map(({ path }) => path), ["members.userId", "invitations.invitedBy", "createdBy"]);
});

test("group membership accepts populated user references", async () => {
  const group = memberGroup();
  group.members[0].userId = { _id: id("member"), toString: () => "User document" };
  const data = fixture({ group });
  await data.getSongLists("group", "member");
  assert.ok(data.calls.some(([name]) => name === "lists"));
});

test("membership is rechecked for a different user", async () => {
  const data = fixture();
  await data.getSongLists("group", "member");
  await assert.rejects(data.getSongLists("group", "outsider"), (error) => error.status === 403);
  assert.equal(data.calls.filter(([name]) => name === "lists").length, 1);
});

test("my groups and playlists preserve filtering and newest-first order", async () => {
  const data = fixture();
  await data.getMyGroups("member");
  await data.getSongLists("group", "member");
  assert.deepEqual(data.calls.find(([name]) => name === "groups"), ["groups", { "members.userId": "member" }]);
  assert.deepEqual(data.calls.find(([name]) => name === "lists"), ["lists", { groupId: "group" }]);
  assert.deepEqual(data.calls.filter(([name]) => name === "sort"), [["sort", { createdAt: -1 }], ["sort", { createdAt: -1 }]]);
});

test("users without contact details have no invitations and trigger no query", async () => {
  const data = fixture();
  assert.deepEqual(await data.getPendingInvitations({}), []);
  assert.equal(data.calls.length, 0);
});

test("invitations select the matching user with normalized telegram/email values", async () => {
  for (const [user, invitation] of [
    [{ username: "@Member" }, { type: "telegram", value: "MEMBER", role: "admin" }],
    [{ email: "Member@Example.com" }, { type: "email", value: "member@example.com", role: "member" }],
  ]) {
    const group = { ...memberGroup(), name: "Команда", invitations: [
      { type: "telegram", value: "other", role: "member" },
      { ...invitation, invitedBy: { _id: id("owner"), firstName: "Автор" }, createdAt: new Date("2026-10-27") },
    ] };
    const data = fixture({ groups: [group] });
    const result = await data.getPendingInvitations(user);
    assert.equal(result[0].role, invitation.role);
    assert.equal(result[0].groupId, "group");
    assert.equal(result[0].invitedBy._id, "owner");
  }
});

async function renderPage(file, authenticated) {
  const reads = [];
  const entries = [];
  const user = authenticated ? { id: "member", username: "@Member" } : null;
  const serverData = Object.fromEntries([
    "getMyGroups", "getPendingInvitations", "getGroupDetails", "getSongLists", "getSongListDetails",
  ].map((name) => [name, async (...args) => { reads.push([name, ...args]); return { source: name }; }]));
  const queryOptionsSource = ts.transpileModule(
    readFileSync(new URL("../app/lib/queries/groupQueries.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const optionsModule = { exports: {} };
  new Function("require", "module", "exports", queryOptionsSource)((name) => {
    if (name === "@tanstack/react-query") return { queryOptions: (value) => value };
    assert.equal(name, "@/services/groups.service");
    return { groupsService: new Proxy({}, { get: () => () => { throw new Error("Server page used a client API fetcher"); } }) };
  }, optionsModule, optionsModule.exports);
  const dependencies = {
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "@tanstack/react-query": { HydrationBoundary: "HydrationBoundary", dehydrate: () => entries },
    "@/lib/queryClient": { getQueryClient: () => ({ prefetchQuery: async (options) => {
      assert.equal(options.retry, false);
      entries.push({ key: options.queryKey, data: await options.queryFn() });
    } }) },
    "@/lib/serverAuth": { getServerAuth: async () => ({ authenticated, user }) },
    "@/lib/data/groups": serverData,
    "@/lib/data/groupMetadata": {},
    "@/lib/metadata": {},
    "@/lib/queries/groupQueries": optionsModule.exports,
    "./GroupsPage": { GroupsPage: "GroupsPage" },
    "./GroupDetailsPage": { GroupDetailsPage: "GroupDetailsPage" },
    "./SongListPage": { SongListPage: "SongListPage" },
  };
  const pageModule = { exports: {} };
  const source = ts.transpileModule(
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText;
  new Function("require", "module", "exports", source)((name) => {
    assert.ok(name in dependencies, `Unexpected page dependency: ${name}`);
    return dependencies[name];
  }, pageModule, pageModule.exports);
  const element = await pageModule.exports.default({ params: Promise.resolve({ groupId: "group", listId: "list" }) });
  return { element, reads, entries };
}

for (const [file, expectedReads, expectedKeys] of [
  ["app/groups/page.tsx", ["getMyGroups", "getPendingInvitations"], [["groups"], ["invitations"]]],
  ["app/groups/[groupId]/page.tsx", ["getGroupDetails", "getSongLists"], [["group", "group"], ["groupLists", "group"]]],
  ["app/groups/[groupId]/lists/[listId]/page.tsx", ["getGroupDetails", "getSongListDetails"], [["group", "group"], ["songList", "group", "list"]]],
]) {
  test(`${file}: authorized server reads hydrate the shared client query keys`, async () => {
    const { element, reads, entries } = await renderPage(file, true);
    assert.deepEqual(reads.map(([name]) => name), expectedReads);
    assert.deepEqual(entries.map(({ key }) => key), expectedKeys);
    assert.equal(element.type, "HydrationBoundary");
    assert.equal(element.props.children.props.initialUserId, "member");
    assert.equal(element.props.state.length, 2);
  });

  test(`${file}: no authenticated session means no private data is read or hydrated`, async () => {
    const { element, reads, entries } = await renderPage(file, false);
    assert.deepEqual(reads, []);
    assert.deepEqual(entries, []);
    assert.equal(element.props.children.props.initialUserId, null);
  });
}
