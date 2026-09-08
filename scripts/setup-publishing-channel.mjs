import { randomBytes, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [pageId, category, name = category] = process.argv.slice(2);
if (!/^\d+$/.test(pageId ?? '') || !['health-tips', 'weight', 'healing'].includes(category)) {
  throw new Error('Usage: node --env-file=.env.local scripts/setup-publishing-channel.mjs PAGE_ID health-tips|weight|healing [NAME]');
}
const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Configure Supabase in .env.local first');
async function api(resource, method = 'GET', body) {
  const response = await fetch(`${url}/rest/v1/${resource}`, {
    method, headers: { apikey: key, ...(!key.startsWith('sb_') ? { Authorization: `Bearer ${key}` } : {}),
      'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}); check migrations and configuration`);
  return response.json();
}
const existing = await api(`wellness_channels?facebook_page_id=eq.${pageId}&select=*`);
let channel = existing[0];
if (channel && (channel.category_id !== category || !channel.enabled))
  throw new Error('Existing channel has a different category or is disabled; review in Supabase first');
if (!channel) [channel] = await api('wellness_channels', 'POST', {
  name, facebook_page_id: pageId, category_id: category,
});
const token = `botly_${randomBytes(32).toString('base64url')}`;
const tokenHash = createHash('sha256').update(token).digest('hex');
await mkdir('secrets', { recursive: true });
const secretFile = path.resolve('secrets', `${category}-${pageId}-${Date.now()}.env`);
await writeFile(secretFile, `BOTLY_BASE_URL=${process.env.NEXT_PUBLIC_SITE_URL ?? ''}\nBOTLY_CHANNEL_TOKEN=${token}\nFACEBOOK_PAGE_ID=${pageId}\n`, { flag: 'wx', mode: 0o600 });
try {
  const [record] = await api('wellness_channel_tokens', 'POST', { channel_id: channel.id,
    token_hash: tokenHash, label: `${category} publisher` });
  console.log(`Channel ready. Token ID: ${record.id}. Credentials saved to ${secretFile}`);
  console.log('Share this file privately with the channel operator. Revoke by setting revoked_at on the token row.');
} catch (error) {
  console.error(`Registration not confirmed. Credentials remain at ${secretFile}; verify in Supabase before retrying.`);
  throw error;
}
