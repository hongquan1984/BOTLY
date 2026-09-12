import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { articlePayloadSchema } from '../.next/botly-tests/article-publishing.mjs';

// Exact payload structure from D:\Autobot\Mindful Haven\MINDFUL-ARTICLE-PLAYBOOK.md Section 5
const mindfulPayload = {
  facebook_page_id: "687915954403752",
  facebook_post_id: "687915954403752_1001",
  facebook_url: "https://www.facebook.com/reel/1001/",
  facebook_published_at: "2026-09-08T10:00:00Z",
  cover_image_url: "/articles/why-2am-feels-like-your-only-free-time/cover.jpg",
  translations: [
    {
      locale: "en",
      slug: "why-2am-feels-like-your-only-free-time",
      title: "Why 2 AM Feels Like Your Only Free Time: The Neuroscience of Bedtime Revenge",
      description: "Evidence-based somatic grounding and cognitive validation for late-night overthinking and revenge bedtime procrastination.",
      eyebrow: "BEDTIME SOMATIC GROUNDING",
      takeaway: "You are not lazy or broken. Your brain is craving autonomy after a day of feeling controlled. Give it gentle space, not forceful sleep.",
      reading_minutes: 5,
      evidence: "supported",
      reviewed_at: "2026-09-12T00:00:00Z",
      tool: "stress-check",
      seo_title: "Why 2 AM Feels Like Your Only Free Time | Soulscape",
      seo_description: "Calm 2 AM racing thoughts and revenge bedtime procrastination with a 3-minute somatic reset.",
      status: "published",
      published_at: "2026-09-12T00:00:00Z",
      cover_image_alt: "Melancholic gray character sitting peacefully under soft bedroom moonlight",
      somatic_signals: {
        body_signals: ["Chest tightness", "Restless legs", "Shallow breathing", "Dry eyes"],
        triggers: ["Checking phone clock", "Replaying daytime stress", "Catastrophizing tomorrow"],
        transmutation: "Anxiety & Racing Energy ➔ Grounded Breath & Peaceful Solitude"
      },
      winddown_protocol: {
        badge: "3-MINUTE BEDTIME SOMATIC RESET",
        objective: "Downregulate sympathetic fight-or-flight without forcing sleep.",
        steps: [
          "Step 1: Hide all clocks and screens from direct line of sight.",
          "Step 2: Feel 5 pressure points sinking into your mattress (head, shoulders, lower back, heels, hands).",
          "Step 3: Exhale twice as long as you inhale (4-second inhale, 7-second soft exhale)."
        ],
        donts: [
          "Do not calculate remaining sleep hours.",
          "Do not turn on bright overhead lights or write long journals.",
          "Do not judge or shame yourself for still being awake."
        ]
      },
      mind_traps: [
        {
          trap: "If I do not fall asleep right now, tomorrow will be completely ruined.",
          reality: "Restful wakefulness in bed still provides 70-80% of physiological recovery. One sleepless night will not define you."
        }
      ],
      midnight_faqs: [
        {
          question: "Why do minor problems feel catastrophic at 2 AM?",
          answer: "At 2 AM, your rational prefrontal cortex has lower glucose reserves, while your emotional amygdala remains vigilant."
        }
      ],
      somatic_quiz: {
        title: "Check Your Midnight Sensation",
        subtitle: "Answer 3 gentle questions (15s) to find which Sprout companion is visiting you tonight.",
        recommended_sprout: "Worry Sprout",
        recommended_soundscape: "Gentle Midnight Rain & Soft Windchimes"
      },
      sections: [
        {
          title: "1. The Biological Paradox of Midnight Freedom",
          paragraphs: [
            "Paragraph 1 explaining why the brain delays sleep...",
            "Paragraph 2 exploring autonomy deprivation..."
          ]
        },
        {
          title: "2. Transforming Resistance into Soft Release",
          paragraphs: [
            "Paragraph guiding the reader to accept the moment..."
          ],
          bullets: [
            "Acknowledge the urge for freedom without anger.",
            "Offer the body rest instead of forced unconsciousness."
          ]
        }
      ],
      sources: [
        { label: "Sleep Foundation – Revenge Bedtime Procrastination", url: "https://www.sleepfoundation.org" },
        { label: "Harvard Medical School – Blue Light and Brain Alertness", url: "https://www.health.harvard.edu" }
      ]
    },
    {
      locale: "vi",
      slug: "tai-sao-2-gio-sang-la-khoang-thoi-gian-tu-do-duy-nhat",
      title: "Tại Sao 2 Giờ Sáng Lại Là Thời Gian Tự Do Duy Nhất: Giải Mã Tâm Lý Trì Hoãn Giấc Ngủ",
      description: "Thấu cảm và giao thức hạ cánh thể cảm cho những ai thao thức vì trì hoãn giấc ngủ để trả thù thời gian.",
      eyebrow: "HẠ CÁNH THỂ CẢM ĐÊM MUỘN",
      takeaway: "Bạn không hề vô kỷ luật. Tâm trí bạn chỉ đang khao khát tự do sau một ngày bị kiểm soát. Hãy dành cho nó sự dịu dàng, đừng ép buộc.",
      reading_minutes: 5,
      evidence: "supported",
      reviewed_at: "2026-09-12T00:00:00Z",
      tool: "stress-check",
      seo_title: "Tại Sao 2 Giờ Sáng Lại Là Thời Gian Tự Do Duy Nhất | Soulscape",
      seo_description: "Làm dịu tâm trí thao thức và tâm lý trì hoãn giấc ngủ với nghi thức hạ cánh trên nệm 3 phút.",
      status: "published",
      published_at: "2026-09-12T00:00:00Z",
      cover_image_alt: "Nhân vật người xám tĩnh lặng dưới ánh trăng phòng ngủ êm dịu",
      somatic_signals: {
        body_signals: ["Nặng ngực", "Bồn chồn chân", "Thở nông ngắn", "Mắt khô cay"],
        triggers: ["Nhìn đồng hồ tính giờ ngủ", "Tua lại áp lực ban ngày", "Bi kịch hóa ngày mai"],
        transmutation: "Lo âu & Kích động quá mức ➔ Hơi thở neo giữ & Tĩnh lặng bình an"
      },
      winddown_protocol: {
        badge: "NGHI THỨC HẠ CÁNH TRÊN NỆM (3 PHÚT)",
        objective: "Kích hoạt hệ thần kinh đối giao cảm làm dịu cơ thể mà không ép phải ngủ ngay.",
        steps: [
          "Bước 1: Giấu đồng hồ và úp màn hình điện thoại khỏi tầm nhìn.",
          "Bước 2: Cảm nhận 5 điểm áp lực chìm sâu vào nệm (gáy, bả vai, lưng dưới, gót chân, bàn tay).",
          "Bước 3: Kéo dài hơi thở ra gấp đôi hơi thở vào (hít 4 giây bằng mũi, thở ra 7 giây êm ái)."
        ],
        donts: [
          "Tuyệt đối không tính nhẩm số giờ ngủ còn lại.",
          "Không bật đèn sáng trưng hay mở sổ ghi chép phân tích dài dòng.",
          "Không tự phán xét hay trách móc bản thân vì vẫn còn thức."
        ]
      },
      mind_traps: [
        {
          trap: "Nếu bây giờ không ngủ được, ngày mai của mình coi như hỏng bét.",
          reality: "Nằm yên tĩnh lặng thả lỏng (Restful wakefulness) vẫn mang lại 70-80% giá trị phục hồi thể chất. Một đêm ngủ ít không phá hủy tương lai của bạn."
        }
      ],
      midnight_faqs: [
        {
          question: "Tại sao những chuyện nhỏ nhặt lại hóa bi kịch lúc 2 giờ sáng?",
          answer: "Lúc nửa đêm, vỏ não trước trán cạn kiệt glucose để tư duy lý trí, trong khi hạch hạnh nhân cảm xúc vẫn kích hoạt ở mức cao."
        }
      ],
      somatic_quiz: {
        title: "Nhận Diện Cảm Giác Đêm Nay",
        subtitle: "Trả lời 3 câu hỏi nhanh (15s) để nhận biết chú Mầm Cảm Xúc nào đang ghé thăm bạn.",
        recommended_sprout: "Mầm Lo Lắng (Worry Sprout)",
        recommended_soundscape: "Mưa Rơi Đêm Muộn & Chuông Gió Êm Đềm"
      },
      sections: [
        {
          title: "1. Nghịch Lý Sinh Học Của 'Sự Tự Do Nửa Đêm'",
          paragraphs: [
            "Đoạn văn phân tích cảm giác ban ngày bị đánh cắp thời gian...",
            "Đoạn văn giải thích nhu cầu tìm kiếm tự do giả tạo từ màn hình..."
          ]
        },
        {
          title: "2. Chuyển Hóa Kháng Cự Thành Sự Buông Xả",
          paragraphs: [
            "Đoạn văn hướng dẫn đón nhận trạng thái thức giấc như một người bạn..."
          ],
          bullets: [
            "Ghi nhận nhu cầu tự do mà không giận dữ với chính mình.",
            "Trao cho cơ thể sự nghỉ ngơi thuần túy thay vì ép vào giấc ngủ."
          ]
        }
      ],
      sources: [
        { label: "Sleep Foundation – Trì hoãn giờ ngủ để trả thù thời gian", url: "https://www.sleepfoundation.org" },
        { label: "Harvard Medical School – Tác động của ánh sáng xanh và sự tỉnh táo não bộ", url: "https://www.health.harvard.edu" }
      ]
    }
  ]
};

async function main() {
  console.log('1. Testing Zod Validation on Mindful Haven Payload...');
  const parseResult = articlePayloadSchema.safeParse(mindfulPayload);
  if (!parseResult.success) {
    console.error('Zod Validation Failed:', JSON.stringify(parseResult.error.issues, null, 2));
    process.exit(1);
  }
  console.log('✓ Zod Schema validation passed for all 5 somatic widgets!');

  console.log('2. Testing Database Publishing RPC with Mindful Haven Channel...');
  const client = new pg.Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.rswmadukvegraxfcdbcb',
    password: 'lA2ideE0GydDFPTn',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // Find token for Mindful Haven channel
  const chRes = await client.query("SELECT id FROM public.wellness_channels WHERE facebook_page_id = '687915954403752'");
  const channelId = chRes.rows[0]?.id;
  assert(channelId, 'Mindful Haven channel must exist in DB');

  const tokenRes = await client.query("SELECT token_hash FROM public.wellness_channel_tokens WHERE channel_id = $1 AND revoked_at IS NULL LIMIT 1", [channelId]);
  const tokenHash = tokenRes.rows[0]?.token_hash;
  assert(tokenHash, 'Mindful Haven must have a valid token');

  console.log('Calling publish_wellness_article stored procedure...');
  const rpcRes = await client.query(
    "SELECT public.publish_wellness_article($1, $2) AS result",
    [tokenHash, JSON.stringify(mindfulPayload)]
  );

  const result = rpcRes.rows[0]?.result;
  console.log('RPC result:', result);
  assert(result.ok === true, 'RPC must return ok: true');

  console.log('3. Verifying Saved Article and Somatic Columns in Supabase...');
  const checkRes = await client.query(`
    SELECT 
      article_id, locale, slug, title,
      somatic_signals, winddown_protocol, mind_traps, somatic_quiz, midnight_faqs, faqs
    FROM public.wellness_article_translations
    WHERE article_id = $1
    ORDER BY locale ASC
  `, [result.article_id]);

  for (const row of checkRes.rows) {
    console.log(`\n--- Translation [${row.locale}] (${row.slug}) ---`);
    console.log('Title:', row.title);
    console.log('somatic_signals:', row.somatic_signals?.transmutation);
    console.log('winddown_protocol badge:', row.winddown_protocol?.badge);
    console.log('winddown_protocol steps count:', row.winddown_protocol?.steps?.length);
    console.log('mind_traps count:', row.mind_traps?.length);
    console.log('somatic_quiz sprout:', row.somatic_quiz?.recommended_sprout);
    console.log('midnight_faqs count:', row.midnight_faqs?.length);
    console.log('faqs (auto-normalized):', row.faqs?.length);

    assert(row.somatic_signals?.body_signals?.length > 0, 'body_signals must be saved');
    assert(row.winddown_protocol?.steps?.length === 3, '3 steps must be saved');
    assert(row.winddown_protocol?.donts?.length === 3, '3 donts must be saved');
    assert(row.mind_traps?.length === 1, 'mind_traps must be saved');
    assert(row.somatic_quiz?.recommended_sprout, 'somatic_quiz must be saved');
    assert(row.midnight_faqs?.length === 1, 'midnight_faqs must be saved');
    assert(row.faqs?.length === 1, 'faqs must be populated from midnight_faqs');
  }

  console.log('\n✓ ALL TESTS PASSED! Mindful Haven somatic widgets are 100% supported!');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
