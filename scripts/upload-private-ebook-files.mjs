import { readFile } from 'node:fs/promises';
import path from 'node:path';

const base = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error('Supabase admin storage credentials are not configured');
const headers = { apikey: key, ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }) };
const bucketUrl = `${base}/storage/v1/bucket/ebook-downloads`;
let bucket = await fetch(bucketUrl, { headers });
let bucketBody = await bucket.json().catch(() => ({}));
if (bucket.status === 404 || bucketBody.code === 'NoSuchBucket') {
  const created = await fetch(`${base}/storage/v1/bucket`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'ebook-downloads', name: 'ebook-downloads', public: false, file_size_limit: 50_000_000, allowed_mime_types: ['application/epub+zip', 'application/pdf'] }),
  });
  if (!created.ok) throw new Error(`Private bucket setup failed (${created.status}): ${await created.text()}`);
  bucket = await fetch(bucketUrl, { headers });
  bucketBody = await bucket.json().catch(() => ({}));
}
if (!bucket.ok) throw new Error(`Private bucket setup failed (${bucket.status}): ${JSON.stringify(bucketBody)}`);
if (bucketBody.public !== false) throw new Error('Refusing to upload: ebook-downloads bucket is not private');

const files = [
  ['pg-18487.epub', 'application/epub+zip'], ['pg-78781.epub', 'application/epub+zip'],
  ['pg-53951.epub', 'application/epub+zip'],
  ['pg-49513.epub', 'application/epub+zip'], ['wellcome-b21528433.pdf', 'application/pdf'],
  ['food-remedies-pdf.pdf', 'application/pdf'], ['healthy-life-beverage-book-pdf.pdf', 'application/pdf'],
  ['a-book-of-simples-pdf.pdf', 'application/pdf'], ['complete-herbal-pdf.pdf', 'application/pdf'],
  ['wellcome-b21908679-part-1.pdf', 'application/pdf'], ['wellcome-b21908679-part-2.pdf', 'application/pdf'],
];
const refreshFiles = new Set([
  'food-remedies-pdf.pdf', 'healthy-life-beverage-book-pdf.pdf',
  'a-book-of-simples-pdf.pdf', 'complete-herbal-pdf.pdf',
]);
for (const [filename, mime] of files) {
  const existing = await fetch(`${base}/storage/v1/object/authenticated/ebook-downloads/${filename}`, { headers });
  if (existing.ok && !refreshFiles.has(filename)) {
    await existing.body?.cancel();
    console.log(`Already in private storage: ${filename}`);
    continue;
  }
  const bytes = await readFile(path.resolve('data/private-ebooks', filename));
  const response = await fetch(`${base}/storage/v1/object/ebook-downloads/${filename}`, {
    method: 'POST', headers: { ...headers, 'Content-Type': mime, 'x-upsert': 'true' }, body: bytes,
  });
  if (!response.ok) throw new Error(`Upload failed for ${filename} (${response.status}): ${await response.text()}`);
  console.log(`Uploaded ${filename}: ${bytes.length} bytes`);
}
