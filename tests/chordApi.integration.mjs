// Run against an isolated replica set and a Next dev server configured for it.
// Never accepts an application URI or production host implicitly.
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { SignJWT } from 'jose';
import { execFileSync } from 'node:child_process';
const uri = process.env.CHORD_TEST_MONGODB_URI;
const base = process.env.CHORD_TEST_BASE_URL;
const secret = process.env.CHORD_TEST_JWT_SECRET;
if (!uri?.startsWith('mongodb://127.0.0.1:') || !uri.includes('/wship_chords_integration') || !base?.startsWith('http://localhost:') || !secret) throw new Error('Explicit isolated CHORD_TEST_* settings are required');
await mongoose.connect(uri);
const db = mongoose.connection.db;
const id = () => new mongoose.Types.ObjectId();
const admin = id(), author = id(), stranger = id();
await db.collection('users').insertMany([
  { _id: admin, telegramId: admin.toString(), firstName: 'Test admin', role: 'admin', isActive: true },
  { _id: author, telegramId: author.toString(), firstName: 'Test author', role: 'viewer', isActive: true },
  { _id: stranger, telegramId: stranger.toString(), firstName: 'Other author', role: 'viewer', isActive: true },
]);
async function token(user) { return new SignJWT({ userId: user.toString() }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('10m').sign(new TextEncoder().encode(secret)); }
const cookies = { admin: await token(admin), author: await token(author), stranger: await token(stranger) };
async function api(path, method = 'GET', body, role) {
  const response = await fetch(`${base}/api/chords${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(role ? { Cookie: `session_token=${cookies[role]}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const json = await response.json();
  return { status: response.status, body: json };
}
function expect(result, status) { assert.equal(result.status, status, JSON.stringify(result.body)); return result.body; }
try {
  const catalog = expect(await api(''), 200);
  assert.equal(catalog.chords.length, 27);
  assert.equal(catalog.voicings.length, 67);
  const major = catalog.chords.find((entry) => entry.quality === '');
  const voicing = { root: 0, bass: null, frets: [-1,3,5,5,5,3], fingers: [0,0,0,0,0,0], barres: [], movable: false, octaveVariants: false, omittedIntervals: [] };
  const input = { kind: 'add-voicing', chordId: major._id, voicing, comment: 'Integration test addition' };
  expect(await api('/proposals', 'POST', input), 401);
  const proposal = expect(await api('/proposals', 'POST', input, 'author'), 201);
  expect(await api(`/proposals/${proposal._id}`, 'PATCH', { action: 'approve' }, 'author'), 403);
  expect(await api(`/proposals/${proposal._id}`, 'PATCH', { action: 'cancel' }, 'stranger'), 403);
  assert.equal(expect(await api('/proposals', 'GET', undefined, 'stranger'), 200).proposals.length, 0);
  assert.equal(expect(await api(''), 200).voicings.length, 67);
  expect(await api(`/proposals/${proposal._id}`, 'PATCH', { action: 'approve' }, 'admin'), 200);
  expect(await api(`/proposals/${proposal._id}`, 'PATCH', { action: 'approve' }, 'admin'), 409);
  const added = expect(await api(''), 200).voicings.find((entry) => entry.frets.join(',') === voicing.frets.join(',') && entry.root === 0);
  assert.ok(added);
  const edit = { kind: 'edit-voicing', chordId: major._id, targetId: added._id, baseVersion: added.version, voicing: { ...voicing, fingers: [0,1,0,0,0,0] }, comment: 'Add explicit finger' };
  const first = expect(await api('/proposals', 'POST', edit, 'author'), 201);
  const second = expect(await api('/proposals', 'POST', { ...edit, voicing: { ...voicing, fingers: [0,2,0,0,0,0] } }, 'stranger'), 201);
  expect(await api(`/proposals/${first._id}`, 'PATCH', { action: 'approve' }, 'admin'), 200);
  expect(await api(`/proposals/${second._id}`, 'PATCH', { action: 'approve' }, 'admin'), 409);
  const changed = await db.collection('chordvoicings').findOne({ _id: added._id });
  assert.equal(changed.version, 2);
  assert.deepEqual(changed.fingers, [0,1,0,0,0,0]);
  assert.equal((await db.collection('chordproposals').findOne({ _id: second._id })).status, 'pending');
  expect(await api(`/proposals/${second._id}`, 'PATCH', { action: 'cancel' }, 'stranger'), 200);

  const newType = { kind: 'add-chord', definition: { quality: 'maj7#11', aliases: ['M7#11'], name: 'Мажорний септакорд з #11', category: 'jazz', intervals: [0,4,6,7,11], optionalIntervals: [7] }, voicing: { ...voicing, frets: [-1,3,2,0,0,2] }, comment: 'New unique chord type' };
  const newA = expect(await api('/proposals', 'POST', newType, 'author'), 201);
  const newB = expect(await api('/proposals', 'POST', newType, 'stranger'), 201);
  const approvals = await Promise.all([api(`/proposals/${newA._id}`, 'PATCH', { action: 'approve' }, 'admin'), api(`/proposals/${newB._id}`, 'PATCH', { action: 'approve' }, 'admin')]);
  assert.deepEqual(approvals.map((result) => result.status).sort(), [200,409], JSON.stringify(approvals));
  assert.equal(await db.collection('chorddefinitions').countDocuments({ quality: 'maj7#11' }), 1);
  const loser = approvals[0].status === 409 ? newA : newB;
  assert.equal((await db.collection('chordproposals').findOne({ _id: loser._id })).status, 'pending');
  expect(await api(`/proposals/${loser._id}`, 'PATCH', { action: 'reject', comment: 'Already approved equivalent proposal' }, 'admin'), 200);
  expect(await api('/proposals', 'POST', { ...newType, definition: { ...newType.definition, quality: 'otherName', aliases: [] } }, 'author'), 409);
  expect(await api('/proposals', 'POST', { ...input, voicing: { ...voicing, frets: [-1,3,5,5,6,3] } }, 'author'), 400);
  expect(await api('/proposals', 'POST', { ...input, userId: admin.toString() }, 'author'), 400);

  // Admin submissions publish immediately, with audit history and the same safeguards.
  const directInput = { ...input, voicing: { ...voicing, root: 2, frets: [-1,5,7,7,7,5] } };
  const direct = expect(await api('/proposals', 'POST', directInput, 'admin'), 201);
  assert.equal(direct.status, 'approved');
  assert.equal(direct.reviewedBy, admin.toString());
  assert.ok(direct.reviewedAt);
  const directShape = expect(await api(''), 200).voicings.find((entry) => entry.root === 2 && entry.frets.join(',') === directInput.voicing.frets.join(','));
  assert.ok(directShape);
  expect(await api('/proposals', 'POST', directInput, 'admin'), 409);
  const directEdit = { ...directInput, kind: 'edit-voicing', targetId: directShape._id, baseVersion: directShape.version, voicing: { ...directInput.voicing, fingers: [0,1,0,0,0,0] } };
  assert.equal(expect(await api('/proposals', 'POST', directEdit, 'admin'), 201).status, 'approved');
  assert.equal((await db.collection('chordvoicings').findOne({ _id: directShape._id })).version, 2);
  expect(await api('/proposals', 'POST', directEdit, 'admin'), 409);
  expect(await api('/proposals', 'POST', { ...directInput, status: 'approved' }, 'author'), 400);
  expect(await api('/proposals', 'POST', { ...directInput, voicing: { ...directInput.voicing, frets: [-1,5,7,7,8,5] } }, 'admin'), 400);
  const directType = { ...newType, definition: { ...newType.definition, quality: 'maj7b5', aliases: [], intervals: [0,4,6,11], optionalIntervals: [] }, voicing: { ...voicing, frets: [-1,3,4,4,5,-1] } };
  const directNew = expect(await api('/proposals', 'POST', directType, 'admin'), 201);
  assert.equal(directNew.status, 'approved');
  assert.ok(expect(await api(''), 200).chords.some((entry) => entry.quality === 'maj7b5'));
  const beforeFailed = await db.collection('chordproposals').countDocuments();
  expect(await api('/proposals', 'POST', directType, 'admin'), 409);
  assert.equal(await db.collection('chordproposals').countDocuments(), beforeFailed);

  // A later seed rerun must not reset moderator changes.
  const seeded = catalog.voicings[0];
  await db.collection('chordvoicings').updateOne({ _id: seeded._id }, { $set: { version: 9 } });
  execFileSync(process.execPath, ['scripts/migrate-chords.mjs', '--apply'], { env: { ...process.env, MONGODB_URI: uri }, stdio: 'pipe' });
  assert.equal((await db.collection('chordvoicings').findOne({ _id: seeded._id })).version, 9);
  const page = await fetch(`${base}/chords`);
  assert.equal(page.status, 200);
  console.log('PASS: migration reruns, public catalog, authentication, role/ownership checks, proposal isolation, approval, stale edits, concurrent uniqueness/rollback, rejection, cancellation, validation, /chords rendering.');
} finally { await mongoose.disconnect(); }
