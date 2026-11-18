import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function testQuiz() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 440, height: 900 },
    deviceScaleFactor: 2,
  });

  await page.goto("http://localhost:8081/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      quest: "sleep",
      twoWeekGoal: "Ngủ sâu giấc trước 23h mỗi đêm"
    }));
    localStorage.setItem("healthclues-village-cinematic-tour-v1", "true");
    localStorage.setItem("healthclues-village-tutorial-completed-v1", "true");
    localStorage.setItem("healthclues-interactive-spotlight-tour-v4", "true");
    localStorage.removeItem("hc_mobile_body_science_quiz_date");
  });

  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // Open Bookshop / Body Science
  await page.evaluate(() => {
    window.postMessage({
      type: "INTERACT_BUILDING",
      actionId: "OPEN_KNOWLEDGE_LIBRARY",
      landmarkId: "knowledge_library",
      buildingInstanceId: "bld_bookshop"
    }, "*");
  });
  await page.waitForTimeout(1000);

  // Scroll down to the quiz section
  const quizElem = await page.$("text=Câu Đố Manh Mối Sinh Học Hôm Nay");
  if (quizElem) {
    await quizElem.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  // Click on "Adenosine"
  const optB = await page.$("text=Adenosine");
  if (optB) {
    await optB.click();
    await page.waitForTimeout(500);
  }

  // Click Submit
  const submitBtn = await page.$("text=Xác nhận câu trả lời");
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForTimeout(800);
  }

  const shotQuizSolved = path.join(ARTIFACT_DIR, "audit_08_quiz_solved_clue_reward.png");
  await page.screenshot({ path: shotQuizSolved });
  console.log("Saved screenshot 8:", shotQuizSolved);

  await browser.close();
}

testQuiz().catch(console.error);
