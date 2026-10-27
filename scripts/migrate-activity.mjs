import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function domain(file) {
  const source = ts.transpileModule(
    fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", source)(
    require,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const { ACTIVITY_INDEXES } = domain("app/lib/activity/indexes.ts");
const { ACTIVITY_ACTIONS } = domain("app/lib/activity/catalog.ts");
let mongoose;
async function main() {
  if (!process.argv.includes("--apply")) {
    console.log(
      `Validated ${Object.keys(ACTIVITY_ACTIONS).length} activity actions and ${ACTIVITY_INDEXES.length} indexes. No database changes. Use --apply to prepare indexes and import existing administrative history.`,
    );
    return;
  }
  for (const file of [".env.local", ".env"])
    if (fs.existsSync(file)) process.loadEnvFile(file);
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  mongoose = (await import("mongoose")).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const events = db.collection("activityevents");
  for (const [keys, options] of ACTIVITY_INDEXES)
    await events.createIndex(keys, options);
  await db
    .collection("activityratelimits")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  let imported = 0;
  const actions = [
    "admin.user.updated",
    "admin.profile.created",
    "admin.profile.updated",
  ];
  for await (const audit of db
    .collection("adminaudits")
    .find({ action: { $in: actions } })) {
    const definition = ACTIVITY_ACTIONS[audit.action];
    if (!audit.occurredAt || !audit.actorId || !audit.targetId) continue;
    const eventId = `server:admin-audit:${audit._id}`;
    const result = await events.updateOne(
      { eventId },
      {
        $setOnInsert: {
          eventId,
          actorId: audit.actorId,
          action: audit.action,
          category: definition.category,
          targetKind: definition.targetKind,
          targetId: String(audit.targetId),
          groupId: null,
          source: "server",
          occurredAt: audit.occurredAt,
          payload: {},
        },
      },
      { upsert: true },
    );
    imported += result.upsertedCount;
  }
  console.log(
    `Activity indexes ready; ${imported} historical administrative events imported. Existing events were preserved.`,
  );
}
main()
  .catch((error) => {
    console.error("Activity migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose?.disconnect());
