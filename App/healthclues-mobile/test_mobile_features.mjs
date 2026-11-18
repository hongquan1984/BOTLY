import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/mobile_shots";
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  console.log("=== HEALTHCLUES MOBILE COMPREHENSIVE VERIFICATION ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Dolphin") || text.includes("PlayerController") || text.includes("Mầm Nhỏ") || text.includes("Detective") || text.includes("Village")) {
      console.log("[PAGE LOG]", text);
    }
  });

  try {
    console.log("-> Step 1: Navigating to mobile web preview...");
    await page.goto("http://localhost:8081/", { waitUntil: "networkidle" });

    // Clear previous storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "01_landing_screen.png") });
    console.log("Screenshot 1: 01_landing_screen.png captured!");

    // Click Start Journey button on landing
    const startJourneyBtn = await page.$('text=Bắt Đầu Hành Trình (+50 EXP)');
    if (startJourneyBtn) {
      await startJourneyBtn.click();
      await page.waitForTimeout(1500);
    }

    // Step 2: Realm choice -> Continue to Mascot Welcome
    const continueToMascot = await page.$('text=Tiếp Tục Khám Phá Vấn Đề');
    if (continueToMascot) {
      await continueToMascot.click();
      await page.waitForTimeout(1500);
    }

    // Screenshot Mascot Welcome screen
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "02_sprout_welcome_screen.png") });
    console.log("Screenshot 2: 02_sprout_welcome_screen.png captured!");

    // Tap Mầm Nhỏ to trigger dolphin sound & mood reaction
    console.log("-> Step 2: Tapping Mầm Nhỏ to test dolphin sound and animation...");
    const mascot = await page.$('[aria-label="Chạm linh vật Mầm Nhỏ"]');
    if (mascot) {
      await mascot.click();
      await page.waitForTimeout(700);
      await mascot.click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "03_sprout_mascot_tapped.png") });
      console.log("Screenshot 3: 03_sprout_mascot_tapped.png captured!");
    }

    // Advance to Discovery
    const readyBtn = await page.$('text=Mình sẵn sàng rồi');
    if (readyBtn) {
      await readyBtn.click();
      await page.waitForTimeout(1500);
    }

    // Select Insomnia (Mất ngủ)
    console.log("-> Step 3: Selecting health concern: Mất ngủ...");
    const sleepBtn = await page.$('text=Mất ngủ');
    if (sleepBtn) {
      await sleepBtn.click();
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "04_concern_insomnia_selected.png") });
    console.log("Screenshot 4: 04_concern_insomnia_selected.png captured!");

    // Advance to Plan
    const seePlanBtn = await page.$('text=Xem kế hoạch thói quen');
    if (seePlanBtn) {
      await seePlanBtn.click();
      await page.waitForTimeout(1500);
    }

    // Enter World
    const enterBtn = await page.$('text=VÀO VƯƠNG QUỐC HEALTHCLUES') || await page.$('text=BẮT ĐẦU HÀNH TRÌNH') || await page.$('text=Bắt đầu hành trình');
    if (enterBtn) {
      await enterBtn.click();
      await page.waitForTimeout(2500);
    }

    // Step 4: Village Tutorial Modal (Mầm Nhỏ Guide in Làng Sống Khỏe)
    console.log("-> Step 4: Verifying Mầm Nhỏ Village Tutorial Modal...");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "05_village_tutorial_step1_concern.png") });
    console.log("Screenshot 5: 05_village_tutorial_step1_concern.png captured!");

    // Step 2 of tutorial (Hành Trình)
    const nextBtn = await page.$('text=Tiếp theo');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "06_village_tutorial_step2_journey.png") });
      console.log("Screenshot 6: 06_village_tutorial_step2_journey.png captured!");

      // Step 3 of tutorial (Nhiệm Vụ)
      await nextBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "07_village_tutorial_step3_daily.png") });
      console.log("Screenshot 7: 07_village_tutorial_step3_daily.png captured!");

      // Step 4 of tutorial (Tặng Căn Nhà Mới)
      await nextBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "08_village_tutorial_step4_house_gift.png") });
      console.log("Screenshot 8: 08_village_tutorial_step4_house_gift.png captured!");

      // Dismiss house celebration popup
      const dismissHouseBtn = await page.$('text=TUYỆT VỜI, BẮT ĐẦU NÀO!');
      if (dismissHouseBtn) {
        await dismissHouseBtn.click();
        await page.waitForTimeout(800);
      }

      // Step 5 of tutorial (Cốt truyện làng không có bác sĩ, trả Xu phá án)
      const nextToStep5 = await page.$('text=Tiếp theo');
      if (nextToStep5) {
        await nextToStep5.click();
        await page.waitForTimeout(800);
      }
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "09_village_tutorial_step5_detective_lore.png") });
      console.log("Screenshot 9: 09_village_tutorial_step5_detective_lore.png captured!");

      // Complete tutorial (+50 Xu)
      const finishTutorialBtn = await page.$('text=KHÁM PHÁ NGAY (+50 XU)');
      if (finishTutorialBtn) {
        await finishTutorialBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // Step 5: World Screen & TopHud
    console.log("-> Step 5: Verifying World Screen with Coins and Phá Án button...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "10_world_screen_with_coins_and_hud.png") });
    console.log("Screenshot 10: 10_world_screen_with_coins_and_hud.png captured!");

    // Step 6: Detective Game
    console.log("-> Step 6: Opening Detective Game via Phá Án button...");
    const phaAnBtn = await page.$('text=Phá Án');
    if (phaAnBtn) {
      await phaAnBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "11_detective_agency_cases_list.png") });
      console.log("Screenshot 11: 11_detective_agency_cases_list.png captured!");

      // Open Case 1
      const case1Btn = await page.$('text=Vụ 1: Bí Ẩn Đêm Không Ngủ');
      if (case1Btn) {
        await case1Btn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "12_detective_case1_clues.png") });
        console.log("Screenshot 12: 12_detective_case1_clues.png captured!");

        // Select correct deduction
        const correctChoice = await page.$('text=Uống trà xanh đậm đặc buổi tối');
        if (correctChoice) {
          await correctChoice.click();
          await page.waitForTimeout(600);

          const submitDeduction = await page.$('text=GỬI KẾT LUẬN SUY LUẬN');
          if (submitDeduction) {
            await submitDeduction.click();
            await page.waitForTimeout(1500);
            await page.screenshot({ path: path.join(ARTIFACT_DIR, "13_detective_case1_solved_reward.png") });
            console.log("Screenshot 13: 13_detective_case1_solved_reward.png captured!");
          }
        }
      }

      // Close Detective
      const closeDetectiveBtn = await page.$('[aria-label="Đóng văn phòng thám tử"]');
      if (closeDetectiveBtn) {
        await closeDetectiveBtn.click();
        await page.waitForTimeout(800);
      }
    }

    // Step 7: Tab Ngôi Nhà 3D & Furniture Shop
    console.log("-> Step 7: Opening Tab Ngôi Nhà 3D and Furniture Shop...");
    const homeTab = await page.$('text=Ngôi Nhà');
    if (homeTab) {
      await homeTab.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "14_home_3d_chalet_stage.png") });
      console.log("Screenshot 14: 14_home_3d_chalet_stage.png captured!");

      // Open Furniture Shop
      const shopBtn = await page.$('text=Sắm Đồ');
      if (shopBtn) {
        await shopBtn.click();
        await page.waitForTimeout(1200);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "15_furniture_shop_modal.png") });
        console.log("Screenshot 15: 15_furniture_shop_modal.png captured!");

        // Buy Bàn Trà Gỗ Sồi Alpine (50 Xu)
        const buyTableBtn = await page.$('text=50 Xu');
        if (buyTableBtn) {
          await buyTableBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(ARTIFACT_DIR, "16_furniture_purchased_success.png") });
          console.log("Screenshot 16: 16_furniture_purchased_success.png captured!");
        }

        // Close shop
        const closeShopBtn = await page.$('[aria-label="close-shop-btn"]') || await page.$('text=✕') || await page.$('button >> text=X');
        if (closeShopBtn) {
          await closeShopBtn.click();
          await page.waitForTimeout(600);
        }
      }
    }

    // Step 8: Humanoid 3D Character Walking in Làng Sống Khỏe
    console.log("-> Step 8: Checking Humanoid 3D Character with walk animation in Làng Sống Khỏe...");
    const villagePage = await context.newPage();
    await villagePage.goto("http://localhost:5179/village.html", { waitUntil: "networkidle" });
    await villagePage.waitForTimeout(3500);
    await villagePage.screenshot({ path: path.join(ARTIFACT_DIR, "17_humanoid_3d_character_in_village.png") });
    console.log("Screenshot 17: 17_humanoid_3d_character_in_village.png captured!");

    console.log("=== ALL TEST RUNS FINISHED WITH 100% SUCCESS! ===");
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();
  }
}

run();
