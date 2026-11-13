import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/header-audit";
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  
  // Mint fresh test user token
  const tokenPayload = {
    aud: "authenticated",
    role: "authenticated",
    email: "owner-demo-mobile@healthclues.botly.test",
    sub: "200ed8a3-1af7-4ec3-8c0c-8ab011912095",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { role: "admin", verified: true },
    exp: Math.floor(Date.now() / 1000) + 3600 * 24,
  };
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
  const dummyJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${token}.signature`;

  const viewports = [
    { name: "portrait_iphone14", width: 390, height: 844 },
    { name: "landscape_iphone14", width: 844, height: 390 },
    { name: "portrait_samsung_s21", width: 360, height: 800 },
    { name: "landscape_samsung_s21", width: 800, height: 360 },
    { name: "landscape_iphone_pro_max", width: 932, height: 430 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    
    // Set cookie
    await page.setCookie({
      name: "sb-kdhbglkefikjtyetomim-auth-token",
      value: JSON.stringify({
        access_token: dummyJwt,
        refresh_token: "refresh-token-test",
        user: { id: "200ed8a3-1af7-4ec3-8c0c-8ab011912095", email: "owner-demo-mobile@healthclues.botly.test" }
      }),
      domain: "localhost",
      path: "/",
    });

    await page.goto("http://localhost:3000/play#region=health-concern", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 1500));

    // Get element bounding boxes in the topbar
    const hudLayout = await page.evaluate(() => {
      const topbar = document.querySelector(".hc-rpg-topbar");
      const brand = document.querySelector(".hc-rpg-brand");
      const capsule = document.querySelector(".hc-rpg-exp-capsule");
      const avatar = document.querySelector(".hc-rpg-avatar-frame");
      const expBody = document.querySelector(".hc-rpg-exp-body");
      const labels = document.querySelector(".hc-rpg-exp-labels");
      const desktopTitle = document.querySelector(".hc-rpg-level-title.is-desktop-title");
      const mobileTitle = document.querySelector(".hc-rpg-level-title.is-mobile-title");
      const nextReward = document.querySelector(".hc-rpg-next-reward");
      const mysteryIcon = document.querySelector(".hc-rpg-mystery-icon");
      const actions = document.querySelector(".hc-rpg-top-actions");

      const getBox = el => el ? { ...el.getBoundingClientRect().toJSON(), display: window.getComputedStyle(el).display, position: window.getComputedStyle(el).position } : null;

      return {
        topbar: getBox(topbar),
        brand: getBox(brand),
        capsule: getBox(capsule),
        avatar: getBox(avatar),
        expBody: getBox(expBody),
        labels: getBox(labels),
        desktopTitle: getBox(desktopTitle),
        mobileTitle: getBox(mobileTitle),
        nextReward: getBox(nextReward),
        mysteryIcon: getBox(mysteryIcon),
        actions: getBox(actions),
      };
    });

    console.log(`\n=== Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    console.log("Capsule:", hudLayout.capsule ? `${hudLayout.capsule.width.toFixed(1)}px x ${hudLayout.capsule.height.toFixed(1)}px at x=${hudLayout.capsule.x.toFixed(1)}` : "missing");
    console.log("ExpBody:", hudLayout.expBody ? `${hudLayout.expBody.width.toFixed(1)}px at x=${hudLayout.expBody.x.toFixed(1)}` : "missing");
    console.log("MobileTitle:", hudLayout.mobileTitle ? `display=${hudLayout.mobileTitle.display}, ${hudLayout.mobileTitle.width.toFixed(1)}px at x=${hudLayout.mobileTitle.x.toFixed(1)}` : "missing");
    console.log("NextReward:", hudLayout.nextReward ? `display=${hudLayout.nextReward.display}, ${hudLayout.nextReward.width.toFixed(1)}px at x=${hudLayout.nextReward.x.toFixed(1)}` : "missing");
    console.log("MysteryIcon:", hudLayout.mysteryIcon ? `${hudLayout.mysteryIcon.width.toFixed(1)}px at x=${hudLayout.mysteryIcon.x.toFixed(1)}` : "missing");

    if (hudLayout.mobileTitle && hudLayout.mysteryIcon && hudLayout.mobileTitle.display !== "none") {
      const titleRight = hudLayout.mobileTitle.x + hudLayout.mobileTitle.width;
      const iconLeft = hudLayout.mysteryIcon.x;
      const overlap = titleRight - iconLeft;
      console.log(`Overlap check: Title ends at ${titleRight.toFixed(1)}px, MysteryIcon starts at ${iconLeft.toFixed(1)}px -> Overlap = ${overlap > 0 ? overlap.toFixed(1) + "px (COLLISION!)" : "None (" + (-overlap).toFixed(1) + "px gap)"}`);
    }

    // Capture screenshot of the top portion
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, `${vp.name}_topbar.png`),
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 150) },
    });
  }

  await browser.close();
  console.log("\nHeader audit complete! Screenshots saved to:", ARTIFACTS_DIR);
}

run().catch(console.error);
