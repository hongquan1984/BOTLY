import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipientEmail = "hongquan0508@gmail.com";
const recipientName = "Quân";

// Read .env.local for keys without logging sensitive secrets
let resendApiKey = "";
let emailFrom = "Lumi HealthClues <onboarding@resend.dev>";
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const resendMatch = envContent.match(/^RESEND_API_KEY=(.+)$/m);
  if (resendMatch) resendApiKey = resendMatch[1].trim();
  const fromMatch = envContent.match(/^EMAIL_FROM=(.+)$/m);
  if (fromMatch) emailFrom = fromMatch[1].trim();
}

const gameUrl = "http://localhost:3000/vi/wellness/healthclues/world?quest=health-concern&checkin=1";
const quickAutoPlayUrl = "http://localhost:3000/play-demo.html?checkin=1";

const subject = `[HealthClues] Chào buổi sáng ${recipientName} ☀️ Nhắc nhở thói quen & điểm danh`;

const text = `Chào ${recipientName} thân mến,

Một ngày mới tràn ngập năng lượng lại bắt đầu rồi! ☀️

Lumi ghé qua để nhắc bạn hoàn thành các thói quen sống khỏe hôm nay nè!
Hãy dành 1 phút ghé vào Vương Quốc HealthClues để ghi nhận tiến trình (Check-in), tích lũy điểm EXP và thăng hạng hôm nay nhé! 🌿✨

(Lưu ý: Thung lũng Giấc ngủ đang tạm khóa để bảo trì; game sẽ tự động vào thẳng Vương quốc HealthClues và mở ngay cửa sổ Điểm danh).

👉 Vào thẳng Game & Điểm danh ngay: ${gameUrl}
👉 Link nhanh kèm tự động đăng nhập (dành cho trình duyệt mới): ${quickAutoPlayUrl}

Chúc bạn một ngày tràn đầy năng lượng và bình an!
Thương mến,
Lumi 🦊✨
Bạn đồng hành của bạn tại HealthClues`;

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #061813; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(180deg, #0e2a20 0%, #081d16 100%); border: 1px solid #234e3a; border-radius: 20px; padding: 32px 24px; color: #f5f8f6; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
    
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; padding: 6px 16px; background: rgba(255, 216, 104, 0.12); border: 1px solid rgba(255, 216, 104, 0.35); border-radius: 999px; color: #ffd868; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">HEALTHCLUES · BẠN ĐỒNG HÀNH LUMI</span>
    </div>

    <h2 style="color: #ffd868; font-size: 22px; margin: 0 0 14px 0; text-align: center; font-weight: 900; line-height: 1.3;">Chào ${recipientName} thân mến, ngày mới tốt lành! ☀️</h2>

    <p style="color: #d1e2d9; font-size: 15px; line-height: 1.6; margin: 0 0 18px 0;">Một ngày mới tràn ngập năng lượng lại bắt đầu rồi. Lumi ghé qua để nhắc bạn hoàn thành các thói quen sống khỏe hôm nay nè!</p>

    <div style="background: rgba(23, 63, 44, 0.7); border: 1px solid #2d6b4f; border-radius: 14px; padding: 18px; margin: 20px 0;">
      <p style="color: #ffd868; margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">📋 Nhắc nhở từ bạn đồng hành Lumi:</p>
      <p style="color: #e2ede7; margin: 0; font-size: 14px; line-height: 1.55;">
        Hãy dành 1 phút ghé vào Vương Quốc HealthClues để ghi nhận tiến trình (Check-in), nhận điểm EXP và duy trì mạch sống khỏe nhé! 🌿✨
      </p>
      <p style="color: #a3c7b5; margin: 10px 0 0 0; font-size: 12px; font-style: italic; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px;">
        🔒 <em>Thông báo khu vực:</em> Thung lũng Giấc ngủ (Sleep Valley) đang được tạm khóa để nâng cấp; game sẽ tự động mở thẳng Vương Quốc HealthClues và bung ngay cửa sổ Điểm danh.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${gameUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); border: 1px solid #34d399;">
        ☀️ Vào Game &amp; Mở Điểm Danh Ngay
      </a>
    </div>

    <div style="background: rgba(0,0,0,0.25); border-radius: 10px; padding: 12px; margin-top: 20px; font-size: 12px; color: #a4c2b2;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #ffd868;">🔗 Các đường dẫn truy cập trực tiếp:</p>
      <p style="margin: 0 0 6px 0;">• Vào game trực tiếp: <a href="${gameUrl}" style="color: #6ee7b7; word-break: break-all;">${gameUrl}</a></p>
      <p style="margin: 0;">• Link một chạm (tự động đăng nhập session demo): <a href="${quickAutoPlayUrl}" style="color: #6ee7b7; word-break: break-all;">${quickAutoPlayUrl}</a></p>
    </div>

    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 24px 0 16px 0;" />

    <p style="color: #749683; font-size: 13px; margin: 0; text-align: center; line-height: 1.5;">
      <em>Thương mến,</em><br>
      <strong style="color: #ffd868; font-size: 14px;">Lumi 🦊✨</strong><br>
      Bạn đồng hành của bạn tại HealthClues
    </p>
  </div>
</body>
</html>`;

async function main() {
  console.log(`[DISPATCH] Preparing reminder email to: ${recipientEmail}`);

  // 1. Dispatch to Mailpit (Local SMTP / API)
  let mailpitSuccess = false;
  let mailpitMessageId = null;
  try {
    const res = await fetch("http://127.0.0.1:54324/api/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: "lumi@healthclues.vn", Name: "Lumi · HealthClues" },
        To: [{ Email: recipientEmail, Name: recipientName }],
        Subject: subject,
        Text: text,
        HTML: html,
        Headers: {
          "Message-ID": `<healthclues-reminder-${Date.now()}@localhost>`,
          "X-HealthClues-Reminder": "test-checkin",
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      mailpitSuccess = true;
      mailpitMessageId = data.ID;
      console.log(`[MAILPIT] SUCCESS: Message ID ${mailpitMessageId} captured in Mailpit at http://127.0.0.1:54324`);
    } else {
      console.warn(`[MAILPIT] Returned status ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.warn(`[MAILPIT] Failed to connect: ${err.message}`);
  }

  // 2. Dispatch to Resend (Real Gmail inbox)
  let resendSuccess = false;
  let resendId = null;
  if (resendApiKey) {
    try {
      console.log(`[RESEND] Sending real email via Resend API to ${recipientEmail}...`);
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom.includes("@") ? emailFrom : "HealthClues <onboarding@resend.dev>",
          to: [recipientEmail],
          subject: subject,
          text: text,
          html: html,
        }),
      });
      const resendData = await resendRes.json();
      if (resendRes.ok) {
        resendSuccess = true;
        resendId = resendData.id;
        console.log(`[RESEND] SUCCESS: Real email delivered to ${recipientEmail}! Resend ID: ${resendId}`);
      } else {
        console.warn(`[RESEND] API warning:`, resendData);
      }
    } catch (err) {
      console.warn(`[RESEND] Error: ${err.message}`);
    }
  } else {
    console.log("[RESEND] No RESEND_API_KEY configured in .env.local; skipping external dispatch.");
  }

  console.log("\n=== DISPATCH SUMMARY ===");
  console.log(`Recipient: ${recipientEmail}`);
  console.log(`Mailpit Local (127.0.0.1:54324): ${mailpitSuccess ? "DELIVERED (ID: " + mailpitMessageId + ")" : "FAILED"}`);
  console.log(`Resend Real Inbox: ${resendSuccess ? "DELIVERED (ID: " + resendId + ")" : (resendApiKey ? "FAILED" : "SKIPPED")}`);
  console.log(`Game Link: ${gameUrl}`);
  console.log(`One-Click Demo Link: ${quickAutoPlayUrl}`);
}

main().catch((err) => {
  console.error("Fatal dispatch error:", err);
  process.exit(1);
});
