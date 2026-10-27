import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const groupId = "123456789012345678901234";
const listId = "abcdefabcdefabcdefabcdef";

function load(file, dependencies) {
  const source = ts.transpileModule(
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText;
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", source)((name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

function readers({ group = { name: "Команда", members: ["private"] }, list = { name: "Неділя", songs: ["private"] } } = {}) {
  const calls = [];
  const query = (document) => ({
    select(fields) { assert.equal(fields, "name -_id"); return this; },
    lean: async () => document ? { name: document.name } : null,
  });
  const data = load("app/lib/data/groupMetadata.ts", {
    "server-only": {},
    react: { cache: (fn) => fn },
    mongoose: { isObjectIdOrHexString: (value) => /^[0-9a-f]{24}$/i.test(value) },
    "../db": { connectDB: async () => {} },
    "@/models/Group": { Group: { findById: (value) => { calls.push(["group", value]); return query(group); } } },
    "@/models/SongList": { SongList: { findOne: (filter) => { calls.push(["list", filter]); return query(list); } } },
  });
  return { ...data, calls };
}

test("public share readers select only names, without members or songs", async () => {
  const data = readers();
  assert.deepEqual(await data.getGroupShareInfo(groupId), { name: "Команда" });
  assert.deepEqual(await data.getSongListShareInfo(groupId, listId), { name: "Неділя", groupName: "Команда" });
  assert.deepEqual(data.calls.find(([name]) => name === "list"), ["list", { _id: listId, groupId }]);
});

test("invalid link ids return no metadata and trigger no database query", async () => {
  const data = readers();
  assert.equal(await data.getGroupShareInfo("invalid"), null);
  assert.equal(await data.getSongListShareInfo(groupId, "invalid"), null);
  assert.equal(await data.getSongListShareInfo("invalid", listId), null);
  assert.deepEqual(data.calls, []);
});

test("a missing group or a playlist outside the group returns no share details", async () => {
  assert.equal(await readers({ group: null }).getSongListShareInfo(groupId, listId), null);
  assert.equal(await readers({ list: null }).getSongListShareInfo(groupId, listId), null);
});

const metadataHelper = load("app/lib/metadata.ts", {});
const images = [{ url: "/opengraph-image.webp", width: 1200, height: 630 }];
function page(list, missing = false) {
  return load(list ? "app/groups/[groupId]/lists/[listId]/page.tsx" : "app/groups/[groupId]/page.tsx", {
    "react/jsx-runtime": {},
    "@tanstack/react-query": {},
    "@/lib/queryClient": {},
    "@/lib/serverAuth": {},
    "@/lib/data/groups": {},
    "@/lib/queries/groupQueries": {},
    "./SongListPage": {},
    "./GroupDetailsPage": {},
    "@/lib/data/groupMetadata": {
      getGroupShareInfo: async () => missing ? null : { name: "Команда" },
      getSongListShareInfo: async () => missing ? null : { name: "Неділя", groupName: "Команда" },
    },
    "@/lib/metadata": metadataHelper,
  });
}

for (const isList of [false, true]) {
  test(`${isList ? "playlist" : "group"} metadata contains names, correct URL and inherited preview image`, async () => {
    const metadata = await page(isList).generateMetadata(
      { params: Promise.resolve({ groupId, listId }) },
      Promise.resolve({ openGraph: { images } }),
    );
    const title = isList ? "Неділя • Команда" : "Команда";
    assert.equal(metadata.title, title);
    assert.equal(metadata.openGraph.title, title);
    assert.equal(metadata.twitter.title, title);
    assert.deepEqual(metadata.openGraph.images, images);
    assert.deepEqual(metadata.twitter.images, images);
    assert.equal(metadata.openGraph.url, `/groups/${groupId}${isList ? `/lists/${listId}` : ""}`);
    assert.ok(metadata.description.includes("Команда"));
    if (isList) assert.ok(metadata.description.includes("Неділя"));
  });
}

test("missing entities get fallback titles instead of unrelated preview names", async () => {
  for (const isList of [false, true]) {
    const metadata = await page(isList, true).generateMetadata(
      { params: Promise.resolve({ groupId, listId }) }, Promise.resolve({}),
    );
    assert.equal(metadata.title, isList ? "Список пісень не знайдено" : "Групу не знайдено");
    assert.equal(metadata.openGraph.title, metadata.title);
    assert.deepEqual(metadata.openGraph.images, []);
  }
});
