import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error('Supabase service configuration is missing');

const bucket = 'night-companion-audio';
const sourceDir = path.resolve('Music_Voice', 'voice');
const musicDir = path.resolve('Music_Voice', 'music');
const specs = [
  { match: 'Coherent Breathing 5-5', objectPath: 'night1/guided-coherent-5-5.mp3' },
  { match: '4-7-8 Breathing', objectPath: 'night1/guided-4-7-8.mp3' },
  { match: 'Box Breathing', objectPath: 'night1/guided-box-4-4-4-4.mp3' },
  { match: 'Panic Out of Nowhere', objectPath: 'night1/guided-4-2-6.mp3' },
];
const musicSpecs = [
  { match: 'liecio-calming-rain-257596', objectPath: 'music/calming-rain-liecio-257596.mp3' },
  { match: 'rmultimediaeu-ocean-waves-250310 (1)', objectPath: 'music/ocean-waves-rmultimediaeu-250310-copy.mp3' },
  { match: 'rmultimediaeu-ocean-waves-250310.mp3', objectPath: 'music/ocean-waves-rmultimediaeu-250310.mp3' },
  { match: 'soundreality-nature-forest-sound-537925', objectPath: 'music/nature-forest-soundreality-537925.mp3' },
  { match: 'freesound_community-birds-19624', objectPath: 'music/birds-freesound-community-19624.mp3' },
  { match: 'boons_freak-rain-sound-188158', objectPath: 'music/rain-boons-freak-188158.mp3' },
  { match: 'u_q2hb2391vb-thunder-clap-521194', objectPath: 'music/thunder-clap-521194.mp3' },
];

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
const bucketResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, { headers });
if (!bucketResponse.ok) throw new Error(`Could not list storage buckets: ${bucketResponse.status} ${await bucketResponse.text()}`);
const buckets = await bucketResponse.json();
if (!buckets.some(item => item.id === bucket)) {
  const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: bucket, name: bucket, public: true, file_size_limit: 50 * 1024 * 1024, allowed_mime_types: ['audio/mpeg'] }),
  });
  if (!createResponse.ok) throw new Error(`Could not create audio bucket: ${createResponse.status} ${await createResponse.text()}`);
}

const files = await readdir(sourceDir);
const musicFiles = await readdir(musicDir);
for (const spec of [...specs, ...musicSpecs]) {
  const isMusic = musicSpecs.includes(spec);
  const fileName = (isMusic ? musicFiles : files).find(name => name.endsWith('.mp3') && name.includes(spec.match));
  if (!fileName) throw new Error(`Missing voice file matching ${spec.match}`);
  const bytes = await readFile(path.join(isMusic ? musicDir : sourceDir, fileName));
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${spec.objectPath}`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000', 'x-upsert': 'true' }, body: bytes,
  });
  if (!response.ok) throw new Error(`Could not upload ${fileName}: ${response.status} ${await response.text()}`);
  console.log(JSON.stringify({ fileName, objectPath: spec.objectPath, bytes: bytes.byteLength }));
}
