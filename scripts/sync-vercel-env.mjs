import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';
import path from 'node:path';

const config = parseEnv(await readFile('.env.local', 'utf8'));
const cli = path.join(process.env.APPDATA, 'npm/node_modules/vercel/dist/index.js');
const names = ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY', 'SUPABASE_JWKS_URL'];
for (const name of names) {
  if (!config[name]) throw new Error(`Missing ${name}`);
  await new Promise((resolve, reject) => {
    const args = [cli, 'env', 'add', name, 'production', '--force', '--yes'];
    if (name === 'SUPABASE_SECRET_KEY') args.push('--sensitive');
    const child = spawn(process.execPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) { console.log(`${name}: production configured`); resolve(); }
      else {
        for (const value of Object.values(config)) if (value) output = output.split(value).join('[redacted]');
        reject(new Error(`Failed ${name}: ${output}`));
      }
    });
    child.stdin.end(config[name]);
  });
}
