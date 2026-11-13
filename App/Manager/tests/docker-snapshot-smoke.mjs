import fs from 'node:fs/promises';
import path from 'node:path';
import { runSnapshotTests } from '../src/snapshot-workflow.mjs';

const root = path.resolve('reports/evidence/mvp002-docker-workspace');
await fs.mkdir(root, { recursive: false });
await fs.writeFile(path.join(root, 'probe.txt'), 'synthetic docker workspace\n');
await fs.writeFile(path.join(root, 'probe.mjs'), `
import fs from 'node:fs';
if (process.getuid?.() === 0) throw new Error('root user');
if (fs.readFileSync('/workspace/probe.txt', 'utf8').trim() !== 'synthetic docker workspace') throw new Error('snapshot read failed');
try { fs.writeFileSync('/workspace/escape-probe.txt', 'bad'); throw new Error('read-only workspace accepted write'); }
catch (error) { if (error.message === 'read-only workspace accepted write') throw error; }
console.log('SYNTHETIC_CONTAINER_TEST_PASS');
`);
const results = await runSnapshotTests({ snapshotRoot: root, tests: ['probe.mjs'], timeoutMs: 30000 });
console.log(JSON.stringify(results, null, 2));
if (results.length !== 1 || results[0].result !== 'PASS' || results[0].exitCode !== 0) process.exitCode = 1;
