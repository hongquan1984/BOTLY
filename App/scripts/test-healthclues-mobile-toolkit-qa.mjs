import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "../word3d/node_modules/playwright-core/index.mjs";

const runtime = JSON.parse(fs.readFileSync(new URL("../.tmp/healthclues-owner-demo/owner-demo-runtime.json", import.meta.url), "utf8"));
const appUrl = (process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3329").replace(/\/$/, "");
const mobileUrl = process.env.HEALTHCLUES_MOBILE_URL || "http://127.0.0.1:8081";
const headers = { "Content-Type": "application/json" };

async function jsonOk(response, label) {
  const body = await response.json().catch(() => ({}));
  assert.ok(response.ok, `${label}: HTTP ${response.status}`);
  return body;
}

async function createAccount() {
  const email = `hc-toolkit-ui-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.invalid`;
  const password = `HC-local-${crypto.randomUUID()}-Aa9!`;
  const admin = await fetch(`${runtime.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: runtime.secretKey, Authorization: `Bearer ${runtime.secretKey}`, ...headers },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { test_only: true, suite: "mobile-toolkit-ui-qa" } }),
  });
  const user = await jsonOk(admin, "local account creation");
  const login = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: runtime.publishableKey, ...headers },
    body: JSON.stringify({ email, password }),
  });
  const session = await jsonOk(login, "local sign-in");
  return { user, session };
}

async function toolkit(token, init = {}) {
  return fetch(`${appUrl}/api/healthclues/mobile-toolkit`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
}

async function state(token, label = "Toolkit state") {
  return jsonOk(await toolkit(token, { cache: "no-store" }), label);
}

async function waitForState(token, expected) {
  let latest = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    latest = await state(token, "Toolkit state while waiting");
    if (
      latest.herbs.length === expected.herbs &&
      latest.sounds.length === expected.sounds &&
      latest.breaths.length === expected.breaths
    ) return latest;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return latest;
}

async function tapAndWaitForToolkitPost(page, locator) {
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes("/api/healthclues/mobile-toolkit") &&
      response.request().method() === "POST" &&
      response.ok()
    ),
    locator.tap(),
  ]);
}

async function openStation(page, globalName, heading) {
  await page.goto(`${mobileUrl}/(game)/world`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.evaluate((name) => window[name]?.(), globalName);
  await page.getByText(heading, { exact: false }).first().waitFor({ state: "visible", timeout: 5000 });
}

async function main() {
  const { user, session } = await createAccount();
  const token = session.access_token;
  const sessionJson = JSON.stringify({ access_token: token, refresh_token: session.refresh_token || "", expires_at: Date.now() + 3600000, user: { id: user.id, email: user.email } });
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await mobile.newPage();
  page.on("response", async (response) => {
    if (response.url().includes("/api/healthclues/mobile-toolkit")) {
      const body = response.request().method() === "POST" ? response.request().postData() : "";
      console.log("toolkit-response", response.request().method(), response.status(), body || "", response.url());
    }
  });
  await page.addInitScript((value) => {
    localStorage.setItem("healthclues-mobile-session", value);
    localStorage.setItem("healthclues-onboarding-completed", "true");
  }, sessionJson);

  // Empty state, touch viewport, and retryable loading failure.
  await page.goto(`${mobileUrl}/(game)/inventory`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const initialText = await page.locator("body").innerText();
  console.log("initial-state", initialText.slice(0, 1200));
  assert.match(initialText, /Thảo Mộc \(0\)/, "fresh authenticated Bag shows empty herb count");
  await page.route("**/api/healthclues/mobile-toolkit", async (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "temporary QA outage" }) }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const failureText = await page.locator("body").innerText();
  console.log("failure-state", failureText.slice(0, 1800));
  assert.match(failureText, /Không thể tải Túi Đồ/, "Bag exposes API failure");
  assert.match(failureText, /Thử lại/, "Bag exposes retry control");
  await page.unroute("**/api/healthclues/mobile-toolkit");
  await page.getByText("Thử lại", { exact: true }).click();
  await page.waitForTimeout(900);

  // Save one item through each actual player-facing station, using touch clicks.
  await openStation(page, "__OPEN_SOUND_GARDEN__", "Nhà Âm Thanh");
  await tapAndWaitForToolkitPost(page, page.getByLabel("Lưu vào túi đồ").first());
  console.log("sound-state-after-touch", JSON.stringify(await state(token, "sound state after touch")));
  await page.getByLabel("Đóng Nhà Âm Thanh").tap();
  await openStation(page, "__OPEN_ZEN_BREATH__", "Thiền Đường");
  await tapAndWaitForToolkitPost(page, page.getByLabel("Lưu vào túi đồ").first());
  await page.getByLabel("Đóng Thiền Đường").tap();
  await openStation(page, "__OPEN_HERBAL_GARDEN__", "Nhà Thảo Mộc");
  await tapAndWaitForToolkitPost(page, page.getByText("Cất vào Túi", { exact: true }).first());
  await page.getByLabel("Đóng Nhà Thảo Mộc").tap();

  const saved = await waitForState(token, { herbs: 1, sounds: 1, breaths: 1 });
  assert.equal(saved.herbs.length, 1, "herb saved through station UI");
  assert.equal(saved.sounds.length, 1, "sound saved through station UI");
  assert.equal(saved.breaths.length, 1, "breath saved through station UI");

  // Reload on mobile and compare the same authenticated state on desktop.
  await page.goto(`${mobileUrl}/(game)/inventory`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.getByText(/Thảo Mộc \(1\)/).first().waitFor({ state: "visible", timeout: 5000 });
  assert.match(await page.locator("body").innerText(), /Thảo Mộc \(1\)/, "mobile reload rehydrates herbs");
  assert.match(await page.locator("body").innerText(), /Âm Thanh \(1\)/, "mobile reload rehydrates sounds");
  assert.match(await page.locator("body").innerText(), /Hơi Thở \(1\)/, "mobile reload rehydrates breaths");

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await desktop.addInitScript((value) => {
    localStorage.setItem("healthclues-mobile-session", value);
    localStorage.setItem("healthclues-onboarding-completed", "true");
  }, sessionJson);
  const desktopPage = await desktop.newPage();
  await desktopPage.goto(`${mobileUrl}/(game)/inventory`, { waitUntil: "domcontentloaded" });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.getByText(/Thảo Mộc \(1\)/).first().waitFor({ state: "visible", timeout: 5000 });
  const desktopText = await desktopPage.locator("body").innerText();
  console.log("desktop-state", desktopText.slice(0, 1400));
  assert.match(desktopText, /Thảo Mộc \(1\)/, "desktop shows same herb count");
  assert.match(desktopText, /Âm Thanh \(1\)/, "desktop shows same sound count");
  assert.match(desktopText, /Hơi Thở \(1\)/, "desktop shows same breath count");

  // Remove all three through the Bag UI and verify API/Postgres emptiness.
  const buttons = page.getByRole("button", { name: "__unused_cleanup_locator__" });
  async function removeVisibleBagItems() {
    const removeButtons = page.getByRole("button", { name: /B.*T.*i/i });
    while (await removeButtons.count()) {
      await removeButtons.first().tap();
      await page.waitForTimeout(350);
    }
  }
  for (const label of ["Bỏ khỏi Túi đồ"]) {
    const buttons = page.getByRole("button", { name: "__unused_cleanup_locator__" });
    while (await buttons.count()) {
      await buttons.first().tap();
      await page.waitForTimeout(300);
    }
  }
  await page.goto(`${mobileUrl}/(game)/inventory?tab=sounds`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  console.log("sound-cleanup", await page.getByRole("button", { name: /B.*T.*i/i }).count(), (await page.locator("body").innerText()).slice(0, 900));
  await removeVisibleBagItems();
  while (await buttons.count()) {
    await buttons.first().tap();
    await page.waitForTimeout(300);
  }
  await page.goto(`${mobileUrl}/(game)/inventory?tab=breath`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  console.log("breath-cleanup", await page.getByRole("button", { name: /B.*T.*i/i }).count(), (await page.locator("body").innerText()).slice(0, 900));
  while (await buttons.count()) {
    await buttons.first().tap();
    await page.waitForTimeout(300);
  }
  await removeVisibleBagItems();
  const cleared = await state(token, "cleared Toolkit state");
  assert.deepEqual(cleared, { herbs: [], sounds: [], breaths: [] }, "remove UI clears all three API-backed types");
  const rows = await jsonOk(await fetch(`${runtime.apiUrl}/rest/v1/healthclues_mobile_toolkit_items?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,item_type,item_id`, { headers: { apikey: runtime.secretKey, Authorization: `Bearer ${runtime.secretKey}` } }), "database readback after remove");
  assert.deepEqual(rows, [], "Postgres has no remaining Toolkit rows");

  await page.screenshot({ path: "App/reports/previews/round22-mobile-toolkit-cleared.png", fullPage: true });
  await desktopPage.screenshot({ path: "App/reports/previews/round22-desktop-toolkit-parity.png", fullPage: true });
  await browser.close();
  console.log(JSON.stringify({ result: "PASS", account: user.id, checks: ["390x844 touch", "loading/error/retry", "herb station save", "sound station save", "breath station save", "mobile reload", "desktop parity", "API reload", "Postgres readback", "UI remove"], appUrl, mobileUrl }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
