import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.rswmadukvegraxfcdbcb',
  password: 'lA2ideE0GydDFPTn',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();

  const countRes = await client.query('SELECT count(*) FROM public.analytics_events');
  if (parseInt(countRes.rows[0].count) > 50) {
    console.log('Analytics events already seeded:', countRes.rows[0].count);
    await client.end();
    return;
  }

  const articlesRes = await client.query(`
    SELECT slug, locale, title FROM public.wellness_article_translations
    WHERE status = 'published' LIMIT 20
  `);
  const articles = articlesRes.rows;

  console.log(`Seeding analytics for ${articles.length} articles over the past 7 days...`);

  const events = [];
  const now = Date.now();
  const dayMs = 86400000;

  const referrers = [
    'https://www.facebook.com/',
    'https://m.facebook.com/',
    'https://l.facebook.com/l.php',
    'https://www.google.com/',
    'https://botly.vn/',
    ''
  ];
  const devices = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet'];

  // Seed 7 days of realistic traffic
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const dayTimestamp = now - dayOffset * dayMs;
    // Views per day: between 180 and 420
    const viewsCount = Math.floor(180 + Math.random() * 240);

    for (let i = 0; i < viewsCount; i++) {
      const art = articles[Math.floor(Math.random() * articles.length)];
      const eventTime = new Date(dayTimestamp + Math.random() * dayMs * 0.9).toISOString();
      const ref = referrers[Math.floor(Math.random() * referrers.length)];
      const dev = devices[Math.floor(Math.random() * devices.length)];
      const path = art.locale === 'vi' ? `/vi/song-khoe/huong-dan/${art.slug}` : `/en/wellness/guides/${art.slug}`;

      events.push({
        event_type: 'page_view',
        path,
        article_slug: art.slug,
        locale: art.locale,
        referrer: ref,
        device_type: dev,
        session_id: `sess_${dayOffset}_${Math.floor(Math.random() * 10000)}`,
        metadata: JSON.stringify({ page: 'article_guide' }),
        created_at: eventTime
      });

      // 20-30% of readers interact and complete the quiz
      if (Math.random() < 0.28) {
        const isSafe = Math.random() > 0.3;
        events.push({
          event_type: 'quiz_completed',
          path,
          article_slug: art.slug,
          locale: art.locale,
          referrer: ref,
          device_type: dev,
          session_id: `sess_${dayOffset}_${Math.floor(Math.random() * 10000)}`,
          metadata: JSON.stringify({
            verdict: isSafe ? 'safe' : 'contraindicated',
            completion_seconds: Math.floor(15 + Math.random() * 25)
          }),
          created_at: new Date(new Date(eventTime).getTime() + 45000).toISOString()
        });
      }
    }
  }

  console.log(`Generated ${events.length} events. Inserting into database...`);

  // Insert in batches of 100
  for (let i = 0; i < events.length; i += 100) {
    const batch = events.slice(i, i + 100);
    const valuePlaceholders = [];
    const values = [];
    let paramIdx = 1;

    for (const e of batch) {
      valuePlaceholders.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8})`);
      values.push(e.event_type, e.path, e.article_slug, e.locale, e.referrer, e.device_type, e.session_id, e.metadata, e.created_at);
      paramIdx += 9;
    }

    const query = `
      INSERT INTO public.analytics_events
      (event_type, path, article_slug, locale, referrer, device_type, session_id, metadata, created_at)
      VALUES ${valuePlaceholders.join(', ')}
    `;
    await client.query(query, values);
  }

  console.log('Seeding completed successfully!');
  await client.end();
}

main().catch(console.error);
