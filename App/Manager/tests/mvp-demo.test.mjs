import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { applyScopedPatch } from '../src/mvp-demo.mjs';

const hash = value => crypto.createHash('sha256').update(value).digest('hex');

test('controlled patch applies only an allowlisted path and rejects checksum drift', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'manager-mvp-patch-'));
  try {
    await fs.mkdir(path.join(root, 'src'));
    await fs.writeFile(path.join(root, 'src', 'greeting.mjs'), 'old\n');
    const base = { 'src/greeting.mjs': hash('old\n') };
    const applied = new Set();
    const result = await applyScopedPatch({ root, allowlist: ['src/greeting.mjs'], patches: [{ path: 'src/greeting.mjs', content: 'new\n' }], baselineHashes: base, applied });
    assert.equal(result[0].sha256, hash('new\n'));
    assert.equal(await fs.readFile(path.join(root, 'src', 'greeting.mjs'), 'utf8'), 'new\n');
    await assert.rejects(applyScopedPatch({ root, allowlist: ['src/greeting.mjs'], patches: [{ path: 'test/unauthorized.mjs', content: 'no\n' }], baselineHashes: base, applied }), /allowlist/);
    await assert.rejects(applyScopedPatch({ root, allowlist: ['src/greeting.mjs'], patches: [{ path: 'src/greeting.mjs', content: 'lost\n' }], baselineHashes: base, applied }), /checksum mismatch/);
    assert.equal(await fs.readFile(path.join(root, 'src', 'greeting.mjs'), 'utf8'), 'new\n');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
