import fs from 'node:fs';
if (process.getuid?.() === 0) throw new Error('container must not run as root');
const text = fs.readFileSync('/workspace/input.txt', 'utf8');
if (text.trim() !== 'synthetic-only') throw new Error('fixture content mismatch');
try { fs.writeFileSync('/workspace/should-not-write.txt', 'bad'); throw new Error('read-only mount was writable'); }
catch (error) { if (error.message === 'read-only mount was writable') throw error; }
console.log(JSON.stringify({ status: 'PASS', uid: process.getuid(), source: 'synthetic-only', workspaceWriteDenied: true }));
