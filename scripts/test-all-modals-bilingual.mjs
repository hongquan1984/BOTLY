import assert from "node:assert/strict";
import fs from "node:fs";

console.log("=== RUNNING BILINGUAL MODAL & PANEL VERIFICATION ===");

// 1. Verify WorldAdventureScene has no hardcoded Vietnamese in modals
const worldScene = fs.readFileSync("d:/botly/src/features/healthclues/WorldAdventureScene.tsx", "utf8");

// Assert DailyReminderPanel is bilingual
assert.ok(worldScene.includes('locale === "vi" ? "🔔 Đang bật nhắc nhở hằng ngày" : "🔔 Daily reminder is ON"'), "Toggle button bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Giờ gửi hằng ngày" : "Daily send time"'), "Daily send time label bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Múi giờ của bạn" : "Your timezone"'), "Timezone label bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Xem trước thư mẫu bạn đồng hành" : "Preview companion email sample"'), "Preview action bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Xong & Đóng cửa sổ" : "Done & Close window"'), "Done action bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "✨ 1 email/ngày · Kết hợp mục tiêu & kiến thức · Tự do bật tắt bất kỳ lúc nào" : "✨ 1 email/day · Goals & knowledge · Turn on/off anytime"'), "Footer badge bilingual");

// Assert DailyReminderPanel Dropdowns are bilingual
assert.ok(worldScene.includes('locale === "vi" ? "07:30 - Buổi sáng (Khuyên dùng: Nhắc thói quen & check-in hôm qua) ⭐" : "07:30 - Morning (Recommended: Habits & yesterday\'s check-in) ⭐"'), "7:30 option bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Asia/Ho_Chi_Minh (Việt Nam UTC+7)" : "Asia/Ho_Chi_Minh (Vietnam UTC+7)"'), "Timezone option bilingual");

// Assert showEmailPreview is bilingual
assert.ok(worldScene.includes('locale === "vi" ? "Xem trước email Daily Companion" : "Preview Daily Companion Email"'), "Preview dialog title bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Tiêu đề:" : "Subject:"'), "Preview subject meta label bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Người gửi:" : "From:"'), "Preview from meta label bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "HEALTHCLUES · BẠN ĐỒNG HÀNH SỨC KHỎE" : "HEALTHCLUES · WELLNESS COMPANION"'), "Email brand tag bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Một món quà nhỏ gửi tặng bạn tối nay 💡" : "A little wellness gift for you 💡"'), "Email knowledge gift bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Thương mến," : "Warm regards,"'), "Email sign-off bilingual");

// Assert CompanionAddHabitModal is bilingual
assert.ok(worldScene.includes('locale === "vi" ? "Thêm thói quen cùng Trợ lý" : "Add habit with Companion"'), "Companion modal aria-label bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Thở sâu thư giãn 3 phút" : "3-minute deep breathing"'), "Quick pill breathing bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Uống 1 cốc nước ấm" : "Drink a warm glass of water"'), "Quick pill water bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Tắt màn hình trước khi ngủ" : "Screens off before bed"'), "Quick pill screens bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Đi bộ nhẹ 15 phút" : "15-minute gentle walk"'), "Quick pill walk bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Đã kích hoạt trong mục tiêu hằng ngày của bạn" : "Activated in your daily wellness goals"'), "Activated in daily goals bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "👍 Xong & Về hành trình" : "👍 Done & Back to Journey"'), "Add habit done button bilingual");

// Assert userName fallback
assert.ok(worldScene.includes('nickname?.trim() || (locale === "vi" ? "anh Quân" : "Wayfinder")'), "userName fallback bilingual");

// Assert Day detail popover
assert.ok(worldScene.includes('locale === "vi" ? "Hôm nay là ngày thực hiện hành trình của bạn. Hãy ghi nhận trạng thái thói quen của hôm nay." : "Today is your active journey day. Record your habit progress for today."'), "Day detail today note bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Lý do chưa hoàn thành:" : "Reason not completed:"'), "Day detail reasons header bilingual");
assert.ok(worldScene.includes('locale === "vi" ? "Bạn đã ghi nhận ngày này thành công trong hành trình sức khỏe." : "You successfully recorded this day in your wellness journey."'), "Day detail recorded note bilingual");

// 2. Verify AmbientVillageVisitors has English translation pool
const ambient = fs.readFileSync("d:/botly/src/features/healthclues/AmbientVillageVisitors.tsx", "utf8");
assert.ok(ambient.includes("CHIBI_GREETINGS_EN"), "CHIBI_GREETINGS_EN defined");
assert.ok(ambient.includes("getVisitorQuotes(cfg, \"meetPeer\", locale)"), "meetPeer uses getVisitorQuotes with locale");
assert.ok(ambient.includes("getVisitorQuotes(cfg, \"playerClick\", locale)"), "playerClick uses getVisitorQuotes with locale");

// 3. Verify OnlineAdventurers
const online = fs.readFileSync("d:/botly/src/features/healthclues/OnlineAdventurers.tsx", "utf8");
assert.ok(online.includes('aria-label={locale === "vi" ? "Đóng" : "Close"}'), "OnlineAdventurers close button bilingual");

// 4. Verify ReminderPreferencesPanel
const reminderPref = fs.readFileSync("d:/botly/src/features/healthclues/ReminderPreferencesPanel.tsx", "utf8");
assert.ok(reminderPref.includes('isVi ? "Asia/Ho_Chi_Minh (Việt Nam UTC+7)" : "Asia/Ho_Chi_Minh (Vietnam UTC+7)"'), "ReminderPreferencesPanel options bilingual");

console.log("✅ ALL BILINGUAL ASSERTIONS PASSED!");
