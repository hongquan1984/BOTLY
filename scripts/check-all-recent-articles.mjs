import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.rswmadukvegraxfcdbcb',
  password: 'lA2ideE0GydDFPTn',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkUrl(url) {
  if (!url) return { ok: false, reason: 'empty' };
  if (url.startsWith('/')) {
    const localPath = path.join('d:\\botly\\public', url.replace(/^\//, '').replace(/\//g, '\\'));
    const exists = fs.existsSync(localPath);
    return { ok: exists, local: true, path: localPath, size: exists ? fs.statSync(localPath).size : 0 };
  }
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { ok: res.ok, status: res.status, local: false };
  } catch (e) {
    return { ok: false, error: e.message, local: false };
  }
}

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT
      a.id,
      a.category_id,
      a.cover_image_url,
      a.created_at,
      t.slug,
      t.locale,
      t.title,
      t.sections
    FROM public.wellness_articles a
    JOIN public.wellness_article_translations t ON t.article_id = a.id
    ORDER BY a.created_at DESC;
  `);

  console.log(`Checking ${res.rows.length} article translations:`);
  let brokenCount = 0;

  for (const row of res.rows) {
    const coverStatus = await checkUrl(row.cover_image_url);
    const sections = typeof row.sections === 'string' ? JSON.parse(row.sections) : row.sections;
    const sectionIssues = [];

    for (let i = 0; i < (sections || []).length; i++) {
      const s = sections[i];
      if (s.image_url) {
        const sStatus = await checkUrl(s.image_url);
        if (!sStatus.ok) {
          sectionIssues.push({ index: i, title: s.title, url: s.image_url, status: sStatus });
        }
      }
    }

    const hasIssue = !coverStatus.ok || sectionIssues.length > 0;
    if (hasIssue) {
      brokenCount++;
      console.log(`\n❌ [BROKEN IMAGE] Slug: ${row.slug} (${row.locale})`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Cover: ${row.cover_image_url} ->`, coverStatus);
      if (sectionIssues.length > 0) {
        console.log(`   Section Issues:`, JSON.stringify(sectionIssues, null, 2));
      }
    } else {
      console.log(`✅ Slug: ${row.slug} (${row.locale}) | Cover: OK (${row.cover_image_url?.slice(0, 40)}...) | Sections: ${(sections || []).filter(s => s.image_url).length} images OK`);
    }
  }

  console.log(`\n--- Summary: ${brokenCount} / ${res.rows.length} have broken image URLs ---`);
  await client.end();
}

main().catch(console.error);
