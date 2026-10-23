/* One-time data import. Default is validation only; --apply writes to MongoDB. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requireDependency = createRequire(import.meta.url);
import ts from 'typescript';
import mongoose from 'mongoose';
// Compile only the shared, dependency-free domain modules. This keeps migration
// validation identical to the API without requiring a separate TS runtime.
function loadDomain(relativePath) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  const localRequire = (name) => name.startsWith('.') ? loadDomain(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), name + '.ts'))) : requireDependency(name);
  new Function('exports', 'module', 'require', source)(compiledModule.exports, compiledModule, localRequire);
  return compiledModule.exports;
}
const { definitionSchema, voicingSchema, validateVoicingNotes, chordSymbols, intervalSignature, voicingIdentity } = loadDomain('app/lib/chords/validation.ts');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'chord-catalog.seed.json'), 'utf8'));
const definitions = seed.chords.map(({ _id, ...data }) => {
  const definition = definitionSchema.parse(data);
  return { _id, ...definition, symbols: chordSymbols(definition), intervalSignature: intervalSignature(definition.intervals) };
});
const shapes = new Map();
for (const { _id, chordId, version, ...data } of seed.voicings) {
  const voicing = voicingSchema.parse(data);
  const definition = definitions.find((entry) => entry._id === chordId);
  if (!definition) throw new Error(`Unknown chordId ${chordId}`);
  const error = validateVoicingNotes(definition, voicing);
  if (error) throw new Error(`${_id}: ${error}`);
  const identity = voicingIdentity(chordId, voicing);
  const previous = shapes.get(identity);
  if (previous) {
    previous.movable ||= voicing.movable;
    previous.octaveVariants ||= voicing.octaveVariants;
  } else shapes.set(identity, { _id, chordId, version, ...voicing, identity });
}
async function main() {
  console.log(`Validated ${definitions.length} chord types and ${shapes.size} distinct voicing templates.`);
  if (!process.argv.includes('--apply')) { console.log('No database changes. Use npm run migrate:chords -- --apply to import.'); return; }
  for (const file of ['.env.local', '.env']) if (fs.existsSync(file)) process.loadEnvFile(file);
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const types = db.collection('chorddefinitions');
  const voicings = db.collection('chordvoicings');
  await types.createIndex({ symbols: 1 }, { unique: true });
  await types.createIndex({ intervalSignature: 1 }, { unique: true });
  await voicings.createIndex({ identity: 1 }, { unique: true });
  await voicings.createIndex({ chordId: 1 });
  const proposals = db.collection('chordproposals');
  await proposals.createIndex({ userId: 1 });
  await proposals.createIndex({ status: 1 });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const document of definitions) await types.updateOne({ _id: document._id }, { $setOnInsert: { ...document, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true, session });
      for (const document of shapes.values()) await voicings.updateOne({ _id: document._id }, { $setOnInsert: { ...document, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true, session });
    });
    console.log('Import complete. Existing records were not overwritten.');
  } finally { await session.endSession(); }
}
main().catch((error) => { console.error('Chord migration failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
