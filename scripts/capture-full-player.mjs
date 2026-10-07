import { writeFile } from 'node:fs/promises';

async function capture() {
  const version = await (await fetch('http://127.0.0.1:9222/json/version')).json();
  const browser = new WebSocket(version.webSocketDebuggerUrl);
  let bId = 0; const bMap = new Map();
  browser.onmessage = e => { const m = JSON.parse(e.data); if (m.id && bMap.has(m.id)) { bMap.get(m.id)(m); bMap.delete(m.id); } };
  const bCall = (m, p = {}) => new Promise(r => { const id = ++bId; bMap.set(id, r); browser.send(JSON.stringify({ id, method: m, params: p })); });
  await new Promise(r => browser.onopen = r);
  const target = await bCall('Target.createTarget', { url: 'about:blank' });
  const pages = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = pages.find(p => p.id === target.result.targetId);
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  socket.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const call = (m, p = {}) => new Promise(r => { const req = ++id; pending.set(req, r); socket.send(JSON.stringify({ id: req, method: m, params: p })); });
  await new Promise(r => socket.onopen = r);
  await call('Runtime.enable');
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1800, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'http://localhost:3000/night-companion' });
  await new Promise(r => setTimeout(r, 1200));

  await call('Runtime.evaluate', { expression: `fetch('/api/night-companion/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: {
        profile: { profile_id: 'pending', created_at: new Date().toISOString(), quiz_result: { primary_pattern: 'RACING_MIND', secondary_pattern: 'SLEEP_ANXIETY', factors: {}, primary_goal: 'quiet_mind', source_intent: 'overthinking' }, operational_setup: { desired_bedtime: '23:00', usual_wake_time: '07:00', last_hour_behaviors: ['unfinished_thoughts'], sleep_doesnt_come: 'thoughts_busier' } },
        tonight_state: { night_number: 1, current_state: 'MIND_WONT_STOP', selected_at: new Date().toISOString() },
        night_one_plan: { night_number: 1, modules: [{ module_id: 'calming_audio', title: 'Quiet ocean sound', instruction: 'Play sound', action_label: 'Finish', kind: 'audio', duration_minutes: 6.4, opening: 'Opening', closing: 'Closing', skip_label: 'Skip', audio_asset_id: 'night1-ocean-waves-cc0' }], created_at: new Date().toISOString(), source: 'deterministic_rule_engine', explanation: 'Plan explanation for MIND_WONT_STOP', explanation_vi: 'Giai thich cho MIND_WONT_STOP' },
        module_feedback: [], resume_stage: 'plan', active_module_index: 0
      }
    })
  }).then(r => r.json()).then(d => { localStorage.setItem('mindful_haven_night_companion_token', d.access_token); })`, awaitPromise: true });

  await call('Page.reload');
  await new Promise(r => setTimeout(r, 1500));
  await call('Runtime.evaluate', { expression: `(() => {
    const btn1 = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Continue Night 1') || b.innerText.includes('Start Night 1'));
    if (btn1) btn1.click();
  })()` });
  await new Promise(r => setTimeout(r, 800));
  await call('Runtime.evaluate', { expression: `(() => {
    const btn2 = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Prepare for tonight'));
    if (btn2) btn2.click();
  })()` });
  await new Promise(r => setTimeout(r, 1200));

  const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/audit-option-b-full-player.png', Buffer.from(shot.result.data, 'base64'));
  console.log('Saved full player screenshot!');
  await bCall('Target.closeTarget', { targetId: target.result.targetId });
  socket.close(); browser.close();
}

capture().catch(console.error);
