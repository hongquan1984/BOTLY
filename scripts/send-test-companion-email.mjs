import fs from "node:fs";

function loadEnv() {
  try {
    const raw = fs.readFileSync("d:\\botly\\.env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch (err) {
    console.warn("Could not read .env.local", err);
  }
}

loadEnv();

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Mindful Haven <night@botly.vn>";
  console.log("Sending companion email via Resend to hongquan0508@gmail.com...");
  console.log("From:", from);

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const html = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lumi ghé thăm bạn nè 🌿</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #081a13; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e6f4ec;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #081a13; padding: 30px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background: linear-gradient(160deg, #102e22 0%, #0c2017 100%); border-radius: 20px; border: 1.5px solid #3d6e52; box-shadow: 0 16px 40px rgba(0,0,0,0.5); overflow: hidden;">
            
            <!-- Header Bar with Pet Avatar -->
            <tr>
              <td style="background: linear-gradient(90deg, #13392d 0%, #1e4a3c 50%, #113328 100%); padding: 24px 28px; border-bottom: 1.5px solid #3d6e52; text-align: center;">
                <div style="display: inline-block; background: rgba(255,216,104,0.15); border: 2px solid #ffd868; border-radius: 50%; padding: 10px 12px; margin-bottom: 8px;">
                  <span style="font-size: 32px;">🦊✨</span>
                </div>
                <div style="color: #ffd868; font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase;">
                  HEALTHCLUES · DAILY COMPANION
                </div>
                <h1 style="color: #fff9e6; font-size: 20px; margin: 6px 0 0; font-weight: 800;">
                  Lumi ghé thăm bạn nè 🌿
                </h1>
              </td>
            </tr>

            <!-- Body Message -->
            <tr>
              <td style="padding: 28px 30px;">
                <p style="color: #ffd868; font-size: 16px; font-weight: 700; margin: 0 0 14px;">
                  Chào Quân thân mến,
                </p>
                <p style="color: #d1e8db; font-size: 14.5px; line-height: 1.65; margin: 0 0 14px;">
                  Một ngày bận rộn lại vừa khép lại rồi. Hôm nay trong người bạn thế nào, công việc có khiến bạn mỏi mệt nhiều không?
                </p>
                <p style="color: #d1e8db; font-size: 14.5px; line-height: 1.65; margin: 0 0 20px;">
                  Lumi đang ngồi dưới tán cây cổ thụ ở Cõi HealthClues, thấy trời đã bắt đầu về đêm nên ghé qua để gửi chút ấm áp tới bạn đây. Dù ngày hôm nay của bạn thuận lợi hay còn nhiều bộn bề, bạn đã cố gắng hết mình rồi nhé!
                </p>

                <!-- Active Goals Box -->
                <div style="background: rgba(8, 22, 16, 0.75); border: 1.5px solid #2d5a42; border-radius: 14px; padding: 18px 20px; margin: 0 0 22px;">
                  <div style="color: #ffd868; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                    🌱 Hành trình thói quen hôm nay của bạn:
                  </div>
                  
                  <div style="margin-bottom: 12px; padding: 10px 12px; background: rgba(22, 54, 40, 0.6); border-radius: 10px; border-left: 3px solid #ffd868;">
                    <strong style="color: #ffffff; font-size: 13.5px; display: block; margin-bottom: 3px;">
                      1. Đặt đũa hoặc thìa xuống giữa các lần nhai trong bữa chính để nhai kỹ và kéo dài bữa ăn lên khoảng 20 phút
                    </strong>
                    <span style="color: #a4ceb7; font-size: 12px;">⏱ Khoảng 20 phút · Bữa ăn chính</span>
                  </div>

                  <div style="padding: 10px 12px; background: rgba(22, 54, 40, 0.6); border-radius: 10px; border-left: 3px solid #4ade80;">
                    <strong style="color: #ffffff; font-size: 13.5px; display: block; margin-bottom: 3px;">
                      2. Đi bộ thong thả từ 5 đến 10 phút sau bữa ăn chính trong ngày
                    </strong>
                    <span style="color: #a4ceb7; font-size: 12px;">⏱ 5–10 phút · Vận động nhẹ</span>
                  </div>
                </div>

                <!-- Gentle No-Pressure Note -->
                <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.6; margin: 0 0 18px; font-style: italic;">
                  "Nếu tối nay bạn thấy mệt, đừng ngần ngại cho phép bản thân nghỉ ngơi thong thả nhé. HealthClues không hề có phạt hay trừ điểm ngày bỏ lỡ đâu — sức khỏe là hành trình dài, sự tử tế với cơ thể mình mới là quan trọng nhất."
                </p>

                <!-- Wellness Tip Box -->
                <div style="background: linear-gradient(135deg, rgba(255, 216, 104, 0.08) 0%, rgba(74, 222, 128, 0.08) 100%); border: 1px solid rgba(255, 216, 104, 0.35); border-radius: 12px; padding: 14px 16px; margin: 0 0 24px;">
                  <div style="color: #ffd868; font-size: 13px; font-weight: 800; margin-bottom: 4px;">
                    💡 Một mẹo nhỏ tối nay từ Lumi:
                  </div>
                  <div style="color: #e2f0e8; font-size: 13px; line-height: 1.55;">
                    Nhai kỹ và ăn chậm giúp dạ dày tiêu hóa nhẹ nhàng hơn, giảm đáng kể cảm giác đầy tức và giúp cơ thể hấp thu trọn vẹn dinh dưỡng trước khi bước vào trạng thái nghỉ ngơi.
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 26px 0 16px;">
                  <a href="http://127.0.0.1:3329/vi/wellness/healthclues/world" style="display: inline-block; background: linear-gradient(180deg, #ffe59b 0%, #dcae4e 100%); color: #221c08; text-decoration: none; padding: 13px 30px; border-radius: 9999px; font-weight: 900; font-size: 14.5px; box-shadow: 0 4px 14px rgba(220,174,78,0.4); border: 1px solid #fff2c3;">
                    Quay lại thế giới của tôi 🌿
                  </a>
                </div>

                <!-- Sign off -->
                <div style="border-top: 1px solid rgba(61, 110, 82, 0.5); padding-top: 18px; margin-top: 24px;">
                  <p style="color: #d1e8db; font-size: 14px; margin: 0 0 4px;">
                    Chúc bạn có một buổi tối thật dịu êm và thảnh thơi nhé!
                  </p>
                  <p style="color: #a4ceb7; font-size: 13.5px; margin: 0;">
                    <em>Thương mến,</em><br>
                    <strong style="color: #ffd868; font-size: 15px;">Lumi 🦊✨</strong><br>
                    <span style="color: #749683; font-size: 12px;">Người bạn đồng hành của bạn tại HealthClues</span>
                  </p>
                </div>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: #081610; padding: 16px 20px; text-align: center; border-top: 1px solid rgba(61, 110, 82, 0.3);">
                <p style="color: #648574; font-size: 11.5px; margin: 0; line-height: 1.5;">
                  Email này được gửi lúc 20:00 theo múi giờ bạn đã chọn (GMT+7 · Việt Nam).<br>
                  Bạn có thể đổi giờ hoặc dừng nhận bất kỳ lúc nào trong mục Hành trình của tôi.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from,
      to: ["hongquan0508@gmail.com"],
      subject: "[HealthClues] Lumi ghé thăm bạn nè 🌿 Hôm nay bạn thấy thế nào rồi?",
      html: html,
      text: `Chào Quân thân mến,\n\nMột ngày bận rộn lại vừa khép lại rồi. Hôm nay trong người bạn thế nào rồi?\n\nLumi ghé qua để gửi chút ấm áp tới bạn đây. Tối nay đừng tạo áp lực cho mình nhé, chỉ cần một thói quen nhỏ xíu thôi:\n- Đặt đũa hoặc thìa xuống giữa các lần nhai trong bữa chính để nhai kỹ và kéo dài bữa ăn lên khoảng 20 phút\n- Đi bộ thong thả từ 5 đến 10 phút sau bữa ăn chính trong ngày\n\nChúc Quân một buổi tối thật dịu êm và thảnh thơi nhé!\n\nThương mến,\nLumi 🦊✨`,
    }),
  });

  const data = await res.json();
  console.log("Resend Status Code:", res.status);
  console.log("Resend Result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
