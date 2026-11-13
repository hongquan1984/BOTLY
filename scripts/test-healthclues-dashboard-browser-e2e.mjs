import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appUrl = process.env.HC_E2E_APP_URL;
const restUrl = process.env.HC_E2E_REST_URL;
const databaseName = process.env.HC_E2E_EXPECTED_DB;
const jwtSecret = process.env.HC_E2E_JWT_SECRET;
const reviewerToken = process.env.HC_E2E_REVIEWER_TOKEN;
const runnerPid = Number(process.env.HC_E2E_RUNNER_PID);
const markerPath = path.join(root, '.tmp', 'healthclues-e2e-app.json');
const dbContainerName = 'botly-healthclues-db-e2e';
const postgrestContainerName = 'botly-healthclues-postgrest-e2e';
const e2eNetwork = 'botly-healthclues-e2e-20261027';
const expectedApp = 'http://127.0.0.1:3207';
const expectedRest = 'http://127.0.0.1:3001';

assert.equal(appUrl, expectedApp, 'browser E2E requires exact loopback app allowlist');
assert.equal(restUrl, expectedRest, 'browser E2E requires exact loopback REST allowlist');
assert.equal(databaseName, 'botly_restore_verification', 'browser E2E requires the restored test database');
assert.ok(jwtSecret && jwtSecret.length >= 32, 'browser E2E requires the test-only JWT secret');
assert.ok(reviewerToken && reviewerToken.length >= 32, 'browser E2E requires the test-only HealthClues reviewer credential');
assert.ok(runnerPid > 0);
assert.ok(Object.keys(process.env).every(name => !name.startsWith('SUPABASE_') && !name.startsWith('NEXT_PUBLIC_SUPABASE_')),
  'browser E2E blocked: production Supabase environment was inherited');
const marker = JSON.parse(readFileSync(markerPath, 'utf8'));
assert.equal(marker.pid, runnerPid);
assert.equal(marker.appUrl, expectedApp);
assert.equal(marker.database, databaseName);
assert.equal(marker.externalSideEffectsDisabled, true);
assert.ok(Date.now() - marker.startedAt < 5 * 60_000);
try { process.kill(runnerPid, 0); } catch { throw new Error('browser E2E blocked: controlled app runner is not live'); }

function inspect(name) {
  return JSON.parse(execFileSync('docker', ['inspect', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))[0];
}

const dbContainer = inspect(dbContainerName);
const postgrest = inspect(postgrestContainerName);
assert.equal(dbContainer.Config.Image, 'supabase/postgres:17.6.1.068');
assert.equal(postgrest.Config.Image, 'postgrest/postgrest:v16.4');
assert.ok(dbContainer.State.Running && postgrest.State.Running);
assert.ok(dbContainer.NetworkSettings.Networks[e2eNetwork]);
assert.ok(postgrest.NetworkSettings.Networks[e2eNetwork]);
assert.equal(Object.keys(dbContainer.HostConfig.PortBindings ?? {}).length, 0, 'test DB must have no published port');
const postgrestPort = postgrest.HostConfig.PortBindings?.['3000/tcp'] ?? [];
assert.equal(postgrestPort.length, 1);
assert.equal(postgrestPort[0].HostIp, '127.0.0.1');
assert.equal(postgrestPort[0].HostPort, '3001');
const env = Object.fromEntries(postgrest.Config.Env.map(value => {
  const separator = value.indexOf('=');
  return [value.slice(0, separator), value.slice(separator + 1)];
}));
const dbUri = new URL(env.PGRST_DB_URI);
assert.equal(dbUri.hostname, 'botly-hc-db');
assert.equal(dbUri.pathname, `/${databaseName}`);
assert.equal(dbUri.username, 'authenticator');
assert.ok(env.PGRST_JWT_SECRET && env.PGRST_JWT_SECRET.length >= 32);

const chromePath = [
  path.join(process.env.PROGRAMFILES ?? 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
].find(existsSync);
assert.ok(chromePath, 'Chrome is required for the real browser E2E');

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function signedJwt(role, userId) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const claims = encode({ role, aud: role, iss: 'healthclues-e2e', ...(userId ? { sub: userId } : {}), iat: now, exp: now + 3600 });
  const input = `${header}.${claims}`;
  return `${input}.${createHmac('sha256', jwtSecret).update(input).digest('base64url')}`;
}

const userId = randomUUID();
const userEmail = `hc-browser-${randomUUID()}@example.invalid`;
const ebookEmail = `hc-ebook-${randomUUID()}@example.invalid`;
const tempDir = mkdtempSync(path.join(root, '.tmp', 'healthclues-dashboard-browser-'));
const browserDir = path.join(tempDir, 'chrome-profile');
mkdirSync(browserDir);
const createUserSql = path.join(tempDir, 'create-user.sql');
const cleanupSql = path.join(tempDir, 'cleanup.sql');
writeFileSync(createUserSql, `insert into auth.users (id,email,aud,role,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values ('${userId}'::uuid,'${userEmail}','authenticated','authenticated','{}'::jsonb,'{}'::jsonb,now(),now());\n`);
writeFileSync(cleanupSql, `delete from public.ebook_download_logs where lead_id in (select id from public.ebook_email_leads where email='${ebookEmail}');\ndelete from public.ebook_email_leads where email='${ebookEmail}';\ndelete from auth.users where id='${userId}'::uuid;\n`);

function runPsqlFile(file, containerPath) {
  execFileSync('docker', ['cp', file, `${dbContainerName}:${containerPath}`], { stdio: ['ignore', 'ignore', 'pipe'] });
  execFileSync('docker', ['exec', dbContainerName, 'sh', '-c', `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${containerPath}`], { stdio: ['ignore', 'ignore', 'pipe'] });
}

async function rest(table, query, { method = 'GET', body, token = userToken, headers = {} } = {}) {
  const response = await fetch(`${expectedRest}/${table}${query ? `?${query}` : ''}`, {
    method,
    headers: { apikey: anonToken, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(8000),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* Do not include arbitrary server bodies in output. */ }
  return { response, json };
}

const anonToken = signedJwt('anon');
const userToken = signedJwt('authenticated', userId);
const serviceToken = signedJwt('service_role');
const session = { access_token: userToken, refresh_token: 'test-only', expires_at: Date.now() + 3_600_000, user: { id: userId, email: userEmail } };
const profile = {
  topic: 'Sleep & rest', contentPreferences: ['Everyday habits'], presentation: 'Quick daily cards',
  comfortableActivityTime: '10–15 minutes', refreshFrequency: 'Three times a week', twoWeekGoal: 'Build a small routine',
  createdAt: new Date().toISOString(), safetyLevel: 'none', specificInterests: ['Relaxation'],
};

let chrome;
let cdp;
let screenshotPath;
let failure;
try {
  runPsqlFile(createUserSql, '/tmp/healthclues-dashboard-browser-user.sql');
  const publicResponse = await fetch(`${expectedApp}/api/healthclues/discoveries`, { signal: AbortSignal.timeout(8000) });
  assert.equal(publicResponse.status, 200, 'test app public discovery API responds');
  const activeContent = (await publicResponse.json()).items;
  const dashboardItem = activeContent.find(item => item.id === 'static-article-meditation-for-restless-beginners');
  assert.ok(dashboardItem && dashboardItem.reviewStatus === 'reviewed' && dashboardItem.status === 'published',
    'the dashboard test uses only the active reviewed Sleep item');
  const saved = await rest('healthclues_profiles', 'on_conflict=user_id', {
    method: 'POST', body: { user_id: userId, profile, consent_version: 'healthclues-profile-consent-v1', consented_at: new Date().toISOString() },
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
  });
  assert.equal(saved.response.status, 201, 'synthetic user profile must persist before browser flow');

  chrome = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*',
    '--remote-debugging-port=0', `--user-data-dir=${browserDir}`, 'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  const activePortPath = path.join(browserDir, 'DevToolsActivePort');
  const chromeDeadline = Date.now() + 20_000;
  while (!existsSync(activePortPath) && Date.now() < chromeDeadline) {
    if (chrome.exitCode !== null) throw new Error('Chrome exited before the test browser became ready.');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(existsSync(activePortPath), 'Chrome did not start its private DevTools endpoint');
  const port = Number(readFileSync(activePortPath, 'utf8').split(/\r?\n/)[0]);
  let target;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json()).catch(() => []);
    target = targets.find(item => item.type === 'page');
    if (target?.webSocketDebuggerUrl) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(target?.webSocketDebuggerUrl, 'Chrome page DevTools endpoint unavailable');
  cdp = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    cdp.addEventListener('open', resolve, { once: true });
    cdp.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const runtimeExceptions = [];
  cdp.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Runtime.exceptionThrown') runtimeExceptions.push(String(message.params?.exceptionDetails?.exception?.description ?? message.params?.exceptionDetails?.text ?? 'runtime exception').slice(0, 400));
    if (!message.id) return;
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
  });
  async function call(method, params = {}) {
    const id = ++nextId;
    const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    cdp.send(JSON.stringify({ id, method, params }));
    return result;
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(`Browser expression failed: ${result.exceptionDetails.text}`);
    return result.result.value;
  }
  async function waitForText(text, timeout = 30_000) {
    const deadline = Date.now() + timeout;
    let lastError = '';
    while (Date.now() < deadline) {
      try {
        const body = await evaluate('document.body.innerText');
        if (body?.includes(text)) return body;
      } catch (cause) { lastError = cause instanceof Error ? cause.message : 'browser evaluation failed'; }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    let body = '';
    try { body = await evaluate('document.body.innerText'); } catch { /* The timeout report includes the last evaluation failure. */ }
    const visibleText = String(body ?? '').replaceAll(userEmail, '[test email]').slice(0, 900);
    const sessionPresent = await evaluate("localStorage.getItem('botly-cloud-session') !== null").catch(() => false);
    const formDiagnostics = await evaluate("(() => { const form=document.querySelector('form'); const email=document.querySelector('input[type=email]'); const checks=[...document.querySelectorAll('input[type=checkbox]')]; return {formValid:form?.checkValidity() ?? null,emailPresent:!!email,emailValueLength:email?.value.length ?? null,emailValid:email?.validity.valid ?? null,deliveryChecked:checks[0]?.checked ?? null,submitDisabled:form?.querySelector('button[type=submit]')?.disabled ?? null,alert:document.querySelector('[role=alert]')?.textContent?.trim() ?? null}; })()").catch(() => null);
    const pageDiagnostics = await evaluate("({url:location.href,title:document.title,mainCount:document.querySelectorAll('main').length,mainText:document.querySelector('main')?.innerText?.slice(0,500)})").catch(() => null);
    throw new Error(`Timed out waiting for expected dashboard text: ${JSON.stringify(text)}; page=${JSON.stringify(pageDiagnostics)}; current page length=${body?.length ?? 0}; test session present=${sessionPresent}; form diagnostics=${JSON.stringify(formDiagnostics)}; visible text=${JSON.stringify(visibleText)}; runtime exceptions=${JSON.stringify(runtimeExceptions.slice(-5))}; ${lastError}`);
  }
  async function reloadAndWait() {
    const loaded = new Promise(resolve => {
      const listener = event => {
        const message = JSON.parse(String(event.data));
        if (message.method !== 'Page.loadEventFired') return;
        cdp.removeEventListener('message', listener);
        resolve();
      };
      cdp.addEventListener('message', listener);
    });
    await call('Page.reload', { ignoreCache: true });
    let timeout;
    try { await Promise.race([loaded, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Browser page reload timed out.')), 20_000); })]); }
    finally { clearTimeout(timeout); }
  }
  async function clickText(selector, text) {
    const clicked = await evaluate(`(() => { const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find(node => node.textContent.trim() === ${JSON.stringify(text)}); if (!element) return false; element.click(); return true; })()`);
    assert.equal(clicked, true, `Could not find ${selector} with expected label: ${text}`);
  }
  async function waitForPathname(pathname, timeout = 15_000) {
    const deadline = Date.now() + timeout;
    let current = '';
    while (current !== pathname && Date.now() < deadline) {
      try { current = await evaluate('location.pathname'); } catch { /* Navigation can destroy the old execution context. */ }
      if (current === pathname) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(current, pathname, `Browser did not navigate to ${pathname}`);
  }
  async function screenshot(file) {
    const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(file, Buffer.from(result.data, 'base64'));
  }

  await call('Page.enable');
  await call('Runtime.enable');
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: tempDir });
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `${expectedApp}/en/wellness/healthclues/dashboard` });
  await waitForText('Sign in to continue');
  await evaluate(`localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(session))})`);
  await reloadAndWait();
  let body = await waitForText('Your profile');
  assert.ok(body.includes('Sleep & rest'));
  assert.ok(body.includes(dashboardItem.title), `reviewed test item appears on dashboard; rendered test-page text: ${body.slice(0, 1800)}`);
  const initialCardTitles = await evaluate("[...document.querySelectorAll('main article h3')].map(node => node.textContent.trim())");
  assert.ok(initialCardTitles.includes(dashboardItem.title), 'reviewed content is rendered as a discovery card');
  const getWeeklySummary = () => evaluate(`(() => { const section=[...document.querySelectorAll('section')].find(node=>node.querySelector('h2')?.textContent.trim()==='This week'); if(!section) return null; return Object.fromEntries([...section.querySelectorAll('dl > div')].map(card=>[card.querySelector('dt').textContent.trim(),card.querySelector('dd').textContent.trim()])); })()`);
  const desktop = await evaluate('({width:innerWidth, documentWidth:document.documentElement.scrollWidth, height:innerHeight})');
  assert.ok(desktop.documentWidth <= desktop.width, 'desktop dashboard has no horizontal overflow');
  screenshotPath = path.join(tempDir, 'dashboard-desktop.png');
  await screenshot(screenshotPath);
  assert.ok(existsSync(screenshotPath), 'desktop dashboard screenshot was captured');

  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const mobile = await evaluate('({width:innerWidth, documentWidth:document.documentElement.scrollWidth, height:innerHeight})');
  assert.equal(mobile.width, 390);
  assert.ok(mobile.documentWidth <= mobile.width, 'authenticated mobile dashboard has no horizontal overflow');
  screenshotPath = path.join(tempDir, 'dashboard-mobile.png');
  await screenshot(screenshotPath);
  assert.ok(existsSync(screenshotPath), 'mobile dashboard screenshot was captured');

  await clickText('button', 'Not Interested');
  await waitForText('What made this a poor fit?');
  await clickText('button', 'Save check-in');
  await waitForText('We will suggest another reviewed resource.');
  let notInterested = await rest('healthclues_discovery_activity', `user_id=eq.${userId}&select=id,action,reason&order=occurred_at.desc,id.desc`);
  assert.equal(notInterested.response.status, 200);
  assert.equal(notInterested.json[0].action, 'not_interested', 'Not Interested action is persisted');
  assert.equal(notInterested.json[0].reason, 'not_interested', 'Not Interested reason is persisted');
  assert.ok(!await evaluate(`[...document.querySelectorAll('main article h3')].some(node => node.textContent.trim() === ${JSON.stringify(dashboardItem.title)})`), 'not-interested resource is suppressed from current recommendations');
  await evaluate('window.confirm = () => true');
  await clickText('button', 'Delete history');
  await waitForText('Your check-in history was deleted.');
  await reloadAndWait();
  body = await waitForText(dashboardItem.title);

  const articlePath = new URL(dashboardItem.url, expectedApp).pathname;
  await clickText('a', 'View');
  await waitForPathname(articlePath);
  await waitForText(dashboardItem.title);
  const articleH1 = await evaluate("document.querySelector('main h1')?.textContent.trim() || ''");
  assert.equal(articleH1, dashboardItem.title, 'View opens the real published static article content');
  const articleMetadata = await evaluate("({ title: document.title, vi: document.querySelector('link[rel=alternate][hreflang=vi]')?.getAttribute('href') || '' })");
  assert.ok(articleMetadata.title.includes(dashboardItem.title), 'static article metadata title is rendered');
  assert.ok(articleMetadata.vi.includes('thien-cho-nguoi-moi'), 'static article metadata uses its existing Vietnamese translation slug');
  await call('Page.navigate', { url: `${expectedApp}/en/wellness/healthclues/dashboard` });
  await waitForText('This week');
  let weekly = await getWeeklySummary();
  assert.equal(weekly['Discoveries explored'], '1', 'opening a discovery increments the real weekly explored count');
  assert.equal(weekly['Activities tried'], '0');
  assert.equal(weekly['Saved resources'], '0');
  assert.equal(weekly['Topics explored'], String(new Set(dashboardItem.topicTags).size));
  await clickText('button', "I've Tried It");
  await waitForText('Added to your activity history.');
  weekly = await getWeeklySummary();
  assert.equal(weekly['Activities tried'], '1', 'trying an activity increments the real weekly activity count');
  const triedRows = await rest('healthclues_discovery_activity', `user_id=eq.${userId}&select=id,action&order=occurred_at.desc,id.desc`);
  assert.equal(triedRows.json[0].action, 'tried');
  await evaluate('window.confirm = () => true');
  await clickText('button', 'Delete history');
  await waitForText('Your check-in history was deleted.');
  await reloadAndWait();
  body = await waitForText(dashboardItem.title);

  await clickText('button', 'Save for Later');
  await waitForText('Saved for later.');
  await clickText('button', 'Not Yet');
  await evaluate(`(() => { const select=document.querySelector('select'); if(!select) return false; const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; setter.call(select,'ingredients_unavailable'); select.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  await clickText('button', 'Save check-in');
  body = await waitForText('Reason: Ingredients unavailable');
  assert.ok(body.includes('not yet'));
  await clickText('button', 'Try Something Else');
  body = await waitForText('We will suggest another reviewed resource.');
  assert.ok(body.includes('There are no other reviewed resources matching this profile right now.'));
  await reloadAndWait();
  body = await waitForText('skipped');
  assert.ok(body.includes('skipped'), 'skip remains in history after a page reload');
  assert.ok(body.includes('Ingredients unavailable'), 'Not Yet reason remains in history after a page reload');
  const persisted = await rest('healthclues_discovery_activity', `user_id=eq.${userId}&select=id,action,reason&order=occurred_at.desc,id.desc`);
  assert.equal(persisted.response.status, 200);
  assert.deepEqual(new Set(persisted.json.map(row => row.action)), new Set(['saved', 'not_yet', 'skipped']));
  assert.equal(persisted.json[0].action, 'skipped', 'skip is the newest persisted action');
  const returnVisitCards = await evaluate("[...document.querySelectorAll('main article h3')].map(node => node.textContent.trim())");
  assert.ok(!returnVisitCards.includes(dashboardItem.title), `skipped recommendation stays suppressed after reload; cards=${JSON.stringify(returnVisitCards)}; events=${JSON.stringify(persisted.json)}`);
  weekly = await getWeeklySummary();
  assert.equal(weekly['Discoveries explored'], '0');
  assert.equal(weekly['Activities tried'], '0');
  assert.equal(weekly['Saved resources'], '1', 'weekly summary reflects one saved resource');
  assert.equal(weekly['Topics explored'], String(new Set(dashboardItem.topicTags).size));

  await evaluate('window.confirm = () => true');
  await clickText('button', 'Delete history');
  await waitForText('Your check-in history was deleted.');
  const deletedHistory = await rest('healthclues_discovery_activity', `user_id=eq.${userId}&select=id`);
  assert.deepEqual(deletedHistory.json, []);

  const updatedProfile = { ...profile, topic: 'Healthy weight', createdAt: new Date(Date.now() + 1000).toISOString() };
  const revised = await rest('healthclues_profiles', 'on_conflict=user_id', {
    method: 'POST', body: { user_id: userId, profile: updatedProfile, consent_version: 'healthclues-profile-consent-v1', consented_at: new Date(Date.now() + 1000).toISOString() },
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
  });
  assert.ok([200, 201].includes(revised.response.status), `synthetic profile edit creates a private prior revision; HTTP ${revised.response.status}`);
  await call('Page.navigate', { url: `${expectedApp}/en/wellness/account` });
  body = await waitForText('Delete saved profile');
  await waitForText('HealthClues profile history');
  await waitForText('Version 1');
  await waitForText('Sleep & rest');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const profileHistorySection = await evaluate("(() => { document.querySelector('#healthclues-profile-history')?.scrollIntoView({block:'center'}); return document.documentElement.scrollWidth <= innerWidth + 2; })()");
  assert.equal(profileHistorySection, true, 'saved profile history is visible without desktop overflow');
  const reportDir = path.join(root, 'App', 'reports');
  mkdirSync(reportDir, { recursive: true });
  await screenshot(path.join(reportDir, 'healthclues-profile-history-desktop.png'));
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), true, 'saved profile history fits the 390px mobile viewport');
  await evaluate("document.querySelector('#healthclues-profile-history')?.scrollIntoView({block:'center'})");
  await screenshot(path.join(reportDir, 'healthclues-profile-history-mobile.png'));
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await clickText('button', 'Restore saved profile');
  await waitForText('Your HealthClues profile is restored in this tab.');
  await clickText('button', 'Delete saved profile');
  await waitForText('Your HealthClues profile was deleted.');
  const deletedProfile = await rest('healthclues_profiles', `user_id=eq.${userId}&select=user_id`);
  assert.deepEqual(deletedProfile.json, []);
  const deletedProfileHistory = await rest('healthclues_profile_history', `user_id=eq.${userId}&select=version`);
  assert.deepEqual(deletedProfileHistory.json, [], 'profile deletion also purges prior revision history');

  await call('Page.navigate', { url: `${expectedApp}/admin/healthclues-discoveries` });
  await waitForText('Mã reviewer HealthClues');
  await new Promise(resolve => setTimeout(resolve, 1500));
  const adminLoginFocused = await evaluate("(() => { const input=document.querySelector('input[type=password]'); if(!input) return false; input.focus(); return document.activeElement===input; })()");
  assert.equal(adminLoginFocused, true, 'admin review login input exists');
  await call('Input.insertText', { text: reviewerToken });
  assert.ok(await evaluate("document.querySelector('input[type=password]')?.value.length > 0"), 'test admin credential entered through browser input');
  await clickText('button', 'Mở danh sách');
  await waitForText('Food & Gout: What the Evidence Actually Says');
  const sourceFocused = await evaluate(`(() => { const card=[...document.querySelectorAll('article')].find(node=>node.querySelector('h2')?.textContent.trim()==='Food & Gout: What the Evidence Actually Says'); const source=card?.querySelector('textarea[aria-label="Nguồn tham khảo (mỗi dòng: nhãn | URL HTTPS)"]'); if(!source) return false; source.focus(); return document.activeElement===source; })()`);
  assert.equal(sourceFocused, true, 'admin source editor is present');
  await call('Input.insertText', { text: 'E2E TEST fixture only | https://example.org/healthclues-ui-test' });
  const reasonFocused = await evaluate(`(() => { const card=[...document.querySelectorAll('article')].find(node=>node.querySelector('h2')?.textContent.trim()==='Food & Gout: What the Evidence Actually Says'); const reason=card?.querySelector('textarea[required]'); if(!reason) return false; reason.focus(); return document.activeElement===reason; })()`);
  assert.equal(reasonFocused, true, 'review reason editor is present');
  await call('Input.insertText', { text: 'E2E TEST source-editor persistence; no approval' });
  const saveDraft = await evaluate(`(() => { const card=[...document.querySelectorAll('article')].find(node=>node.querySelector('h2')?.textContent.trim()==='Food & Gout: What the Evidence Actually Says'); const save=[...card?.querySelectorAll('button') ?? []].find(button=>button.textContent.includes('Lưu / gửi bản nháp')); save?.click(); return Boolean(save); })()`);
  assert.equal(saveDraft, true, 'admin can save source edits as a draft');
  await waitForText('Lịch sử đã lưu bởi');
  let editedGout = null;
  const sourceDeadline = Date.now() + 10_000;
  while (Date.now() < sourceDeadline) {
    const result = await rest('healthclues_discovery_content', 'id=eq.ebook-gout-support&select=evidence,review_status,status', { token: serviceToken });
    editedGout = result.json?.[0];
    if (editedGout?.evidence?.sources?.some(source => source.url === 'https://example.org/healthclues-ui-test')) break;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  assert.equal(editedGout?.review_status, 'needs_review', 'editing a source does not approve the candidate');
  assert.equal(editedGout?.status, 'draft', 'editing a source does not activate the candidate');
  assert.ok(editedGout.evidence.sources.some(source => source.url === 'https://example.org/healthclues-ui-test'));

  await call('Page.navigate', { url: `${expectedApp}/admin/healthclues-quiz-preview` });
  await waitForText('Quiz question bank');
  await new Promise(resolve => setTimeout(resolve, 1200));
  assert.equal(await evaluate("(() => { const input=document.querySelector('input[type=password]'); input?.focus(); return Boolean(input); })()"), true, 'Quiz authoring reviewer form is rendered');
  await call('Input.insertText', { text: reviewerToken });
  await clickText('button', 'Open question bank');
  await waitForText('Quiz bank loaded. Question IDs, branches, and answer types are protected.');
  assert.equal(await evaluate("document.body.innerText.includes('Active player version: 1')"), true, 'admin displays the currently published Quiz version');
  await evaluate("document.querySelector('input[placeholder=\"Search by ID or question\"]')?.focus()");
  await call('Input.insertText', { text: 'C01' });
  assert.equal(await evaluate("(() => { const card=[...document.querySelectorAll('article')].find(node=>node.innerText.includes('C01')); const field=card?.querySelector('textarea'); if(!field) return false; field.focus(); return document.activeElement===field; })()"), true, 'reviewer can focus the C01 question wording editor');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'A', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'A', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65 });
  await call('Input.insertText', { text: 'E2E UI quiz draft wording' });
  await evaluate("document.querySelector('input[maxlength=\"1200\"]')?.focus()");
  await call('Input.insertText', { text: 'TEST: verify reviewer-managed quiz draft persistence' });
  await clickText('button', 'Save draft');
  await waitForText('Quiz draft version 2 saved.');
  const quizDraftResponse = await fetch(`${expectedApp}/api/admin/healthclues-quiz`, { headers: { Authorization: `Bearer ${reviewerToken}` } });
  const quizDraftPayload = await quizDraftResponse.json();
  assert.equal(quizDraftResponse.status, 200);
  assert.equal(quizDraftPayload.draft.version, 2);
  assert.equal(quizDraftPayload.draft.questions.find(question => question.id === 'C01').text, 'E2E UI quiz draft wording');
  const stillPublishedQuizResponse = await fetch(`${expectedApp}/api/healthclues/quiz-bank`);
  const stillPublishedQuiz = await stillPublishedQuizResponse.json();
  assert.equal(stillPublishedQuiz.version, 1, 'saving a reviewer draft does not replace the live Quiz version');
  assert.equal(stillPublishedQuiz.questions.find(question => question.id === 'C01').text, 'E2E TEST reviewer-managed adult eligibility wording');

  await call('Page.navigate', { url: `${expectedApp}/en/wellness/healthclues/quiz?source=ebook&entry=hero&ebook=everyday-food-wellness` });
  await waitForText('Create Your Wellness Journey');
  const activeQuizResponse = await fetch(`${expectedApp}/api/healthclues/quiz-bank`);
  assert.equal(activeQuizResponse.status, 200, 'player Quiz bank endpoint is available');
  const activeQuizBank = await activeQuizResponse.json();
  const adultGatePrompt = activeQuizBank.questions.find(question => question.id === 'C01')?.text;
  assert.ok(adultGatePrompt, 'active bank includes the protected age gate question');
  await new Promise(resolve => setTimeout(resolve, 1500));
  await clickText('button', 'Begin My Adventure');
  assert.equal(await evaluate("(() => { const button=[...document.querySelectorAll('button')].find(node=>node.textContent.includes('Sleep Better')); if(!button) return false; button.click(); return true; })()"), true, 'Sleep Better quest card is selectable');
  const answerAndNext = async (question, answer, nextQuestion) => {
    await waitForText(question);
    await clickText('button', answer);
    await clickText('button', 'Next');
    if (nextQuestion) await waitForText(nextQuestion);
  };
  await answerAndNext(adultGatePrompt, 'Yes', 'Which country do you currently live in?');
  await answerAndNext('Which country do you currently live in?', 'Prefer not to say', 'What language would you prefer for your daily discoveries?');
  await answerAndNext('What language would you prefer for your daily discoveries?', 'English', 'Which health or wellness topic interests you most right now?');
  await answerAndNext('Which health or wellness topic interests you most right now?', 'Sleep & rest', 'What best describes why you are exploring this topic?');
  await answerAndNext('What best describes why you are exploring this topic?', 'General curiosity', 'Which kinds of content would you like to discover?');
  await answerAndNext('Which kinds of content would you like to discover?', 'Everyday habits', 'How would you like the information presented?');
  await answerAndNext('How would you like the information presented?', 'Quick daily cards', 'How much time could you comfortably spend on a small daily activity?');
  await answerAndNext('How much time could you comfortably spend on a small daily activity?', '10–15 minutes', 'How often would you like your dashboard refreshed?');
  await answerAndNext('How often would you like your dashboard refreshed?', 'Three times a week', 'What would make the next two weeks most useful for you?');
  await answerAndNext('What would make the next two weeks most useful for you?', 'Build a small routine');
  await clickText('button', 'Skip and create my profile');
  body = await waitForText('YOUR PERSONAL DISCOVERY PROFILE');
  body = await waitForText(dashboardItem.title);
  assert.ok(body.includes(dashboardItem.title), `quiz results recommend the active reviewed Sleep resource; card title=${JSON.stringify(dashboardItem.title)}; cards=${JSON.stringify(await evaluate("[...document.querySelectorAll('article h3')].map(node => node.textContent.trim())"))}; profile excerpt=${JSON.stringify(body.slice(0, 1100))}`);
  assert.ok(body.includes('Sleep & rest') && body.includes('Quick daily cards') && body.includes('Build a small routine'));
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(node => node.textContent.includes('Save to my account'))?.disabled"), true, 'profile save stays disabled until the user gives explicit consent');
  const profileBeforeConsent = await rest('healthclues_profiles', `user_id=eq.${userId}&select=user_id`);
  assert.equal(profileBeforeConsent.json.length, 0, 'the completed quiz alone does not persist a profile');
  await evaluate("document.querySelector('input[type=checkbox]').click()");
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(node => node.textContent.includes('Save to my account'))?.disabled"), false, 'explicit profile consent enables account save');
  await clickText('button', 'Save to my account');
  await waitForText('Your profile was saved to your Botly account.');
  const savedProfile = await rest('healthclues_profiles', `user_id=eq.${userId}&select=profile,consent_version,consented_at`);
  assert.equal(savedProfile.response.status, 200);
  assert.equal(savedProfile.json.length, 1, 'quiz profile persists only after explicit consent');
  assert.equal(savedProfile.json[0].consent_version, 'healthclues-profile-consent-v1');
  assert.equal(savedProfile.json[0].profile.topic, 'Sleep & rest');
  assert.equal(savedProfile.json[0].profile.presentation, 'Quick daily cards');
  const profileConsentEmail = await rest('healthclues_email_preferences', `user_id=eq.${userId}&select=user_id,opted_in`);
  assert.deepEqual(profileConsentEmail.json, [], 'profile consent does not create or opt in to email reminders');
  const profileConsentCommunity = await rest('healthclues_public_journeys', `user_id=eq.${userId}&select=id,status`, { token: serviceToken });
  assert.equal(profileConsentCommunity.response.status, 200, 'isolated test database can inspect public-sharing state');
  assert.deepEqual(profileConsentCommunity.json, [], 'profile consent does not create public sharing consent');
  await clickText('button', 'Clear profile and start again');
  await waitForText('Create Your Wellness Journey');
  const removedQuizProfile = await rest('healthclues_profiles', `user_id=eq.${userId}&select=user_id`);
  assert.deepEqual(removedQuizProfile.json, [], 'quiz profile deletion removes the cloud record');

  const checkAdaptiveBranch = async ({ quest, topic, expectedQuestion }) => {
    await evaluate('sessionStorage.clear()');
    await call('Page.navigate', { url: `${expectedApp}/en/wellness/healthclues/quiz` });
    await waitForText('Create Your Wellness Journey');
    await clickText('button', 'Begin My Adventure');
    assert.equal(await evaluate(`(() => { const button=[...document.querySelectorAll('button')].find(node=>node.textContent.includes(${JSON.stringify(quest)})); if(!button) return false; button.click(); return true; })()`), true, `${quest} quest card is selectable for adaptive-branch coverage`);
    await waitForText(adultGatePrompt);
    await clickText('button', 'Yes'); await clickText('button', 'Next');
    await waitForText('Which country do you currently live in?'); await clickText('button', 'Skip');
    await waitForText('What language would you prefer for your daily discoveries?'); await clickText('button', 'Skip');
    await waitForText('Which health or wellness topic interests you most right now?'); await clickText('button', topic); await clickText('button', 'Next');
    const coreQuestions = ['What best describes why you are exploring this topic?', 'Which kinds of content would you like to discover?', 'How would you like the information presented?', 'How much time could you comfortably spend on a small daily activity?', 'How often would you like your dashboard refreshed?', 'What would make the next two weeks most useful for you?'];
    for (let index = 0; index < coreQuestions.length; index++) { await waitForText(coreQuestions[index]); await clickText('button', 'Skip'); if (index + 1 < coreQuestions.length) await waitForText(coreQuestions[index + 1]); }
    await waitForText('Would you like to personalize it further?'); await clickText('button', 'Continue with optional questions');
    for (let index = 0; index < 13; index++) { await waitForText(`Question ${index + 1} of 20`); await clickText('button', 'Skip'); }
    await waitForText(expectedQuestion);
  };
  await checkAdaptiveBranch({ quest: 'Sleep Better', topic: 'Sleep & rest', expectedQuestion: 'What part of sleep or rest interests you most?' });
  await checkAdaptiveBranch({ quest: 'Explore a Health Concern', topic: 'Gout & uric acid', expectedQuestion: 'Is gout a clinician-confirmed diagnosis for you, or a topic you want to understand?' });
  await checkAdaptiveBranch({ quest: 'Healthy Weight', topic: 'Healthy weight', expectedQuestion: 'What are you most interested in?' });
  await checkAdaptiveBranch({ quest: 'Feel Calmer', topic: 'Stress & relaxation', expectedQuestion: 'Which kind of calm-focused content would you like to explore first?' });
  await checkAdaptiveBranch({ quest: 'More Energy', topic: 'Other', expectedQuestion: 'Which everyday routine would you most like to explore?' });
  await checkAdaptiveBranch({ quest: 'Eat Healthier', topic: 'Balanced nutrition', expectedQuestion: 'Which food-related discovery interests you most?' });
  await checkAdaptiveBranch({ quest: 'Move More', topic: 'Other', expectedQuestion: 'Which kind of movement information interests you?' });
  await checkAdaptiveBranch({ quest: 'Explore Natural Wellness', topic: 'Other', expectedQuestion: 'Which natural-living topic would you like to explore?' });

  const submitEbookForm = async () => {
    await call('Page.navigate', { url: `${expectedApp}/en/wellness/ebooks/blood-sugar-pairings` });
    await waitForText('Unlock Everyday Food Pairings');
    await new Promise(resolve => setTimeout(resolve, 1500));
    const inputFocused = await evaluate("(() => { const input=document.querySelector('input[type=email]'); if(!input) return false; input.focus(); return document.activeElement === input; })()");
    assert.equal(inputFocused, true, 'ebook email field receives browser keyboard input');
    await call('Input.insertText', { text: ebookEmail });
    const consentFocused = await evaluate("(() => { const checkbox=document.querySelector('#download-form form input[type=checkbox]'); if(!checkbox) return false; checkbox.focus(); return document.activeElement === checkbox; })()");
    assert.equal(consentFocused, true, 'delivery consent checkbox receives browser keyboard input');
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    assert.equal(await evaluate("document.querySelector('input[type=email]')?.value"), ebookEmail);
    assert.equal(await evaluate("document.querySelector('#download-form form input[type=checkbox]')?.checked"), true);
    assert.equal(await evaluate("document.querySelector('#download-form form button[type=submit]')?.disabled"), false,
      'React accepts delivery consent and enables ebook submission');
    await clickText('button', 'Get Free Ebook');
    await waitForText('Unlocked. Your download is ready.');
    await waitForText('Want Wellness Ideas That Fit Your Lifestyle?');
  };
  await submitEbookForm();
  const maybeLaterVisible = await evaluate("[...document.querySelectorAll('button')].some(node => node.textContent.trim() === 'Maybe Later')");
  assert.equal(maybeLaterVisible, true, 'post-download flow offers Maybe Later');
  await clickText('button', 'Maybe Later');
  assert.equal(await evaluate("document.body.innerText.includes('Want Wellness Ideas That Fit Your Lifestyle?')"), false,
    'Maybe Later dismisses the post-download invitation');
  await submitEbookForm();
  const quizCta = await evaluate(`(() => { const link=[...document.querySelectorAll('a')].find(node => node.textContent.trim() === 'Create My Wellness Profile'); return link?.getAttribute('href') || ''; })()`);
  assert.ok(quizCta.startsWith('/en/wellness/healthclues/quiz?'), 'post-download CTA points to the real quiz route');
  const quizParams = new URLSearchParams(quizCta.split('?')[1]);
  assert.equal(quizParams.get('source'), 'ebook');
  assert.equal(quizParams.get('entry'), 'post_download');
  assert.equal(quizParams.get('ebook_id'), 'blood-sugar', 'ebook topic hint is carried into the quiz');
  await clickText('a', 'Create My Wellness Profile');
  await waitForText('Create Your Wellness Journey');
  assert.equal(new URL(await evaluate('location.href')).searchParams.get('ebook_id'), 'blood-sugar');
  console.log('HealthClues browser E2E passed: onboarding/profile/dashboard/history, responsive layouts, ebook lead submit, Maybe Later dismissal, and post-download quiz CTA with ebook topic hint.');
} catch (cause) {
  failure = cause;
} finally {
  if (cdp?.readyState === WebSocket.OPEN) {
    const socketClosed = new Promise(resolve => cdp.addEventListener('close', resolve, { once: true }));
    try { cdp.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); } catch { /* Process-tree cleanup below is the fallback. */ }
    await Promise.race([socketClosed, new Promise(resolve => setTimeout(resolve, 3000))]);
    if (cdp.readyState === WebSocket.OPEN) cdp.close();
  }
  if (chrome && chrome.exitCode === null) {
    const exited = new Promise(resolve => chrome.once('exit', () => resolve(true)));
    const stopped = await Promise.race([exited, new Promise(resolve => setTimeout(() => resolve(false), 4000))]);
    if (!stopped && chrome.exitCode === null) {
      try { execFileSync('taskkill.exe', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch { chrome.kill(); }
      await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 2000))]);
    }
  }
  try { runPsqlFile(cleanupSql, '/tmp/healthclues-dashboard-browser-cleanup.sql'); } catch (cause) { failure ??= cause; }
  const temporaryRoot = path.join(root, '.tmp');
  if (path.dirname(tempDir) !== temporaryRoot) failure ??= new Error('Refusing temporary browser cleanup outside workspace .tmp.');
  else {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try { rmSync(tempDir, { recursive: true, force: true }); break; }
      catch (cause) { if (attempt === 7) failure ??= cause; else await new Promise(resolve => setTimeout(resolve, 500)); }
    }
  }
}
if (failure) throw failure;
