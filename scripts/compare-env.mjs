import fs from 'fs';

function parseSimpleEnv(content) {
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      result[key] = val;
    }
  }
  return result;
}

const vercelEnv = parseSimpleEnv(fs.readFileSync('d:\\botly\\.env.vercel-check.tmp', 'utf-8'));
const localEnv = parseSimpleEnv(fs.readFileSync('d:\\botly\\.env.local', 'utf-8'));

console.log('Vercel SUPABASE_URL:', vercelEnv.SUPABASE_URL);
console.log('Local SUPABASE_URL:', localEnv.SUPABASE_URL);

console.log('Vercel SUPABASE_SECRET_KEY match Local?', vercelEnv.SUPABASE_SECRET_KEY === localEnv.SUPABASE_SECRET_KEY);
console.log('Vercel SUPABASE_SECRET_KEY len:', vercelEnv.SUPABASE_SECRET_KEY ? vercelEnv.SUPABASE_SECRET_KEY.length : 0);
console.log('Local SUPABASE_SECRET_KEY len:', localEnv.SUPABASE_SECRET_KEY ? localEnv.SUPABASE_SECRET_KEY.length : 0);

console.log('Vercel SUPABASE_PUBLISHABLE_KEY match Local?', vercelEnv.SUPABASE_PUBLISHABLE_KEY === localEnv.SUPABASE_PUBLISHABLE_KEY);
console.log('Vercel NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY match Local?', vercelEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
