
import fs from 'node:fs';
if (process.getuid?.() === 0) throw new Error('root user');
if (fs.readFileSync('/workspace/probe.txt', 'utf8').trim() !== 'synthetic docker workspace') throw new Error('snapshot read failed');
try { fs.writeFileSync('/workspace/escape-probe.txt', 'bad'); throw new Error('read-only workspace accepted write'); }
catch (error) { if (error.message === 'read-only workspace accepted write') throw error; }
console.log('SYNTHETIC_CONTAINER_TEST_PASS');
