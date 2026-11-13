import fs from "node:fs";

const filePath = "d:/botly/src/features/healthclues/WellnessWorldGame.tsx";
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split(/\r?\n/);

const startIdx = lines.findIndex(l => l.includes("onboardingBackpack ? \"fixed inset-0 z-[55]"));
if (startIdx === -1) {
  console.log("Could not find start index, searching alternative...");
} else {
  // Find matching end of this section (line ending with </section>})
  let endIdx = -1;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].trim() === "</section>}") {
      endIdx = i;
      break;
    }
  }

  console.log(`Found legacy block from line ${startIdx + 1} to line ${endIdx + 1}`);

  const replacement = [
    '      </section> : !loading && <section className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center" role="status">',
    '        <HealthCluesAdventurer pose="welcoming" width={110} alt="Lumi" />',
    '        <h2 className="mt-6 text-2xl font-black text-emerald-950">',
    '          {locale === "vi" ? "✨ Đang mở Cõi Sống Khỏe của bạn..." : "✨ Opening your Wellness World..."}',
    '        </h2>',
    '        <p className="mt-2 text-sm text-[#5a7167]">',
    '          {locale === "vi" ? "Đang khởi tạo lộ trình 30 ngày và chuẩn bị bạn đồng hành Lumi..." : "Initializing your 30-day trail and companion Lumi..."}',
    '        </p>',
    '        <button',
    '          type="button"',
    '          disabled={busy}',
    '          onClick={() => void enterWorld()}',
    '          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#173f36] px-6 py-3 text-sm font-extrabold text-white shadow-lg hover:bg-[#255245]"',
    '        >',
    '          {locale === "vi" ? "Vào ngay Cõi Sống Khỏe" : "Enter Wellness World"} <ArrowRight className="h-4 w-4"/>',
    '        </button>',
    '      </section>}',
  ];

  lines.splice(startIdx, endIdx - startIdx + 1, ...replacement);
  fs.writeFileSync(filePath, lines.join("\r\n"), "utf8");
  console.log("Successfully replaced legacy backpack block in WellnessWorldGame.tsx!");
}
