import { writeFile } from 'node:fs/promises';

async function testCleanPlayer() {
  const version = await (await fetch('http://127.0.0.1:9222/json/version')).json();
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const call = (method, params = {}) => new Promise(resolve => {
    const requestId = ++id;
    pending.set(requestId, resolve);
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  await new Promise(resolve => { socket.onopen = resolve; });

  const target = await call('Target.createTarget', { url: 'about:blank' });
  const pages = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = pages.find(item => item.id === target.result.targetId);
  const pageSocket = new WebSocket(page.webSocketDebuggerUrl);
  let pageId = 0;
  const pagePending = new Map();
  pageSocket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pagePending.has(message.id)) {
      pagePending.get(message.id)(message);
      pagePending.delete(message.id);
    }
  };
  const pageCall = (method, params = {}) => new Promise(resolve => {
    const requestId = ++pageId;
    pagePending.set(requestId, resolve);
    pageSocket.send(JSON.stringify({ id: requestId, method, params }));
  });
  await new Promise(resolve => { pageSocket.onopen = resolve; });
  await pageCall('Runtime.enable');
  await pageCall('Page.enable');

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const evaluate = async expression => {
    const res = await pageCall('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value;
  };

  await pageCall('Page.navigate', { url: 'http://localhost:3000/night-companion' });
  await wait(1500);

  // Setup profile via API
  await evaluate(`fetch('/api/night-companion/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: {
        profile: {
          profile_id: 'pending',
          created_at: new Date().toISOString(),
          quiz_result: {
            primary_pattern: 'RACING_MIND',
            secondary_pattern: 'SLEEP_ANXIETY',
            factors: {},
            primary_goal: 'quiet_mind',
            source_intent: 'overthinking'
          },
          operational_setup: {
            desired_bedtime: '23:00',
            usual_wake_time: '07:00',
            last_hour_behaviors: ['unfinished_thoughts'],
            sleep_doesnt_come: 'thoughts_busier'
          }
        },
        tonight_state: {
          night_number: 1,
          current_state: 'MIND_WONT_STOP',
          selected_at: new Date().toISOString()
        },
        night_one_plan: {
          night_number: 1,
          modules: [
            {
              module_id: 'calming_audio',
              title: 'Quiet ocean sound',
              instruction: 'Play sound',
              action_label: 'Finish',
              kind: 'audio',
              duration_minutes: 6.4,
              opening: 'Opening',
              closing: 'Closing',
              skip_label: 'Skip',
              audio_asset_id: 'night1-ocean-waves-cc0'
            }
          ],
          created_at: new Date().toISOString(),
          source: 'deterministic_rule_engine',
          explanation: 'Plan explanation for MIND_WONT_STOP',
          explanation_vi: 'Giai thich'
        },
        module_feedback: [],
        resume_stage: 'plan',
        active_module_index: 0
      }
    })
  }).then(r => r.json()).then(d => {
    localStorage.setItem('mindful_haven_night_companion_token', d.access_token);
    return d.access_token;
  })`);

  await pageCall('Page.reload');
  await wait(1500);

  // Click through to player
  for (let i = 0; i < 20; i++) {
    const audioCount = await evaluate(`document.querySelectorAll('audio').length`);
    if (audioCount && audioCount >= 2) {
      console.log(`Player loaded with ${audioCount} audio elements!`);
      break;
    }
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => 
        b.innerText.includes('Continue Night 1') || 
        b.innerText.includes('Start Night 1') || 
        b.innerText.includes('Prepare for tonight')
      );
      if (btn) btn.click();
    })()`);
    await wait(400);
  }

  await wait(1000);

  const metrics = await evaluate(`(() => {
    return {
      bodyHeight: document.body.scrollHeight,
      windowHeight: window.innerHeight,
      sectionHeight: document.querySelector('section')?.offsetHeight,
      audioElements: document.querySelectorAll('audio').length,
      title: document.querySelector('h2')?.innerText
    };
  })()`);
  console.log('Player metrics:', metrics);

  const screenshot = await pageCall('Page.captureScreenshot', { format: 'png' });
  await writeFile('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/verified-player-final.png', Buffer.from(screenshot.result.data, 'base64'));
  console.log('Saved verified-player-final.png!');

  await call('Target.closeTarget', { targetId: target.result.targetId });
  process.exit(0);
}

testCleanPlayer();
