import fs from "node:fs";
import ts from "typescript";
let mongoose;
const filename = new URL("../app/lib/permissions/catalog.ts", import.meta.url);
const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const loaded = { exports: {} };
new Function("module", "exports", source)(loaded, loaded.exports);
const { SYSTEM_PROFILES, legacyProfileId } = loaded.exports;
const args = process.argv.slice(2);
const option = args.indexOf("--superadmin-telegram-id");
const telegramId = option >= 0 ? args[option + 1] : undefined;
if (option >= 0 && (!telegramId || !/^\d+$/.test(telegramId)))
  throw new Error(
    "Provide an exact numeric Telegram ID after --superadmin-telegram-id",
  );
async function main() {
  if (!args.includes("--apply")) {
    console.log(
      `Validated ${SYSTEM_PROFILES.length} system profiles. No database changes. Use --apply and --superadmin-telegram-id <existing-active-account>.`,
    );
    return;
  }
  for (const file of [".env.local", ".env"])
    if (fs.existsSync(file)) process.loadEnvFile(file);
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  mongoose = (await import("mongoose")).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const profiles = db.collection("permissionprofiles");
  const users = db.collection("users");
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const rootUser = telegramId
        ? await users.findOne({ telegramId, isActive: true }, { session })
        : null;
      if (telegramId && !rootUser)
        throw new Error(
          "No active existing user with this Telegram ID. No changes applied.",
        );
      if (
        !rootUser &&
        !(await users.countDocuments(
          { permissionProfileId: "superadmin", isActive: true },
          { session },
        ))
      )
        throw new Error(
          "First run requires --superadmin-telegram-id for an existing active account",
        );
      for (const profile of SYSTEM_PROFILES)
        await profiles.updateOne(
          { _id: profile._id },
          {
            $setOnInsert: {
              ...profile,
              description: "",
              revision: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true, session },
        );
      const root = await profiles.findOne(
        { _id: "superadmin", isSystem: true },
        { session },
      );
      if (!root) throw new Error("Invalid root profile. Refusing migration.");
      for (const role of ["admin", "editor", "viewer"])
        await users.updateMany(
          {
            role,
            $or: [
              { permissionProfileId: { $exists: false } },
              { permissionProfileId: null },
              { permissionProfileId: "" },
            ],
          },
          { $set: { permissionProfileId: legacyProfileId(role) } },
          { session },
        );
      await users.updateMany(
        {
          $or: [
            { permissionProfileId: { $exists: false } },
            { permissionProfileId: null },
            { permissionProfileId: "" },
          ],
        },
        { $set: { permissionProfileId: "user" } },
        { session },
      );
      if (rootUser)
        await users.updateOne(
          { _id: rootUser._id },
          { $set: { permissionProfileId: "superadmin" } },
          { session },
        );
    });
    await users.createIndex({ permissionProfileId: 1 });
    await db
      .collection("adminaudits")
      .createIndex({ targetId: 1, occurredAt: -1 });
    console.log(
      "Permission migration complete. Existing profile settings and explicit user assignments were preserved (except the explicitly selected superadmin).",
    );
  } finally {
    await session.endSession();
  }
}
main()
  .catch((error) => {
    console.error("Permission migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose?.disconnect());
