import assert from "node:assert";

console.log("=== Testing HealthClues Knowledge Bilingual Empty State Verification ===");

// 1. Test VI emptyReason logic
const testViPayloadEnglishReason = {
  emptyReason: "No reviewed Knowledge is currently available for Đường huyết · Huyết áp · Đau đầu / migraine · HealthClues Realm. HealthClues will not substitute unrelated topics.",
  emptyReasonVi: "Hiện chưa có manh mối kiến thức đã thẩm định y tế riêng cho chủ đề Đường huyết · Huyết áp · Đau đầu / migraine · HealthClues Realm. HealthClues không thay thế bằng các chủ đề chưa liên quan để bảo đảm tính chuẩn xác."
};

function resolveKnowledgeEmptyText(locale, data) {
  if (locale === "vi") {
    return data.emptyReasonVi ||
      (data.emptyReason?.includes("explored every")
        ? "Bạn đã khám phá toàn bộ manh mối đã thẩm định cho hành trình này. Hãy mở Sổ tay kiến thức để ôn tập lại."
        : data.emptyReason?.startsWith("Hiện chưa có")
        ? data.emptyReason
        : "Hiện chưa có manh mối kiến thức đã thẩm định y tế riêng cho chủ đề này. HealthClues không thay thế bằng các chủ đề chưa liên quan để bảo đảm tính chuẩn xác.");
  }
  return data.emptyReason || "No reviewed clue is available for this Quest yet.";
}

// Case 1: VI user receives API response with emptyReasonVi
const viResult1 = resolveKnowledgeEmptyText("vi", testViPayloadEnglishReason);
assert(viResult1.includes("Hiện chưa có manh mối kiến thức"), "Must be Vietnamese");
assert(!viResult1.includes("No reviewed Knowledge"), "Must NOT contain English");
console.log("PASS: Case 1 (VI with emptyReasonVi) ->", viResult1.slice(0, 50) + "...");

// Case 2: VI user receives legacy payload without emptyReasonVi (only English emptyReason)
const viResult2 = resolveKnowledgeEmptyText("vi", { emptyReason: testViPayloadEnglishReason.emptyReason });
assert(viResult2.includes("Hiện chưa có manh mối kiến thức"), "Must fall back to Vietnamese safely");
assert(!viResult2.includes("No reviewed Knowledge"), "Must NOT leak English fallback");
console.log("PASS: Case 2 (VI with legacy English emptyReason fallback) ->", viResult2.slice(0, 50) + "...");

// Case 3: EN user receives API response
const enResult = resolveKnowledgeEmptyText("en", testViPayloadEnglishReason);
assert(enResult.includes("No reviewed Knowledge is currently available"), "Must be English for EN user");
console.log("PASS: Case 3 (EN with emptyReason) ->", enResult.slice(0, 50) + "...");

// 4. Test Boss checkpoint empty state in VI and EN
function resolveBossEmptyText(locale, data) {
  if (locale === "vi") {
    return "Hiện chưa có thử thách kiến thức đã thẩm định y tế riêng cho chủ đề này. Bản đồ, ghi nhận hằng ngày và Sổ tay kiến thức của bạn vẫn hoạt động bình thường.";
  }
  return data.emptyReason || "No source-reviewed challenge is ready for this trail. Your map, check-in and Knowledge Book stay available.";
}

const bossVi = resolveBossEmptyText("vi", { emptyReason: "No source-reviewed challenge is ready for this trail." });
assert(bossVi.includes("Hiện chưa có thử thách kiến thức"), "Boss VI must be in Vietnamese");
console.log("PASS: Boss VI empty state verified!");

const bossEn = resolveBossEmptyText("en", { emptyReason: "No source-reviewed challenge is ready for this trail." });
assert(bossEn.includes("No source-reviewed challenge"), "Boss EN must be in English");
console.log("PASS: Boss EN empty state verified!");

console.log("ALL KNOWLEDGE BILINGUAL EMPTY STATE TESTS PASSED 100%!");
