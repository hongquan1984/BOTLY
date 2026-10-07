import { writeFile } from 'node:fs/promises';

async function runOptionBVerification() {
  console.log('Connecting to Chrome DevTools Protocol at http://127.0.0.1:9222...');
  const version = await (await fetch('http://127.0.0.1:9222/json/version')).json();
  const browser = new WebSocket(version.webSocketDebuggerUrl);
  let browserId = 0;
  const browserPending = new Map();
  browser.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && browserPending.has(message.id)) {
      browserPending.get(message.id)(message);
      browserPending.delete(message.id);
    }
  };
  const browserCall = (method, params = {}) => new Promise(resolve => {
    const id = ++browserId;
    browserPending.set(id, resolve);
    browser.send(JSON.stringify({ id, method, params }));
  });
  await new Promise(resolve => { browser.onopen = resolve; });

  const target = await browserCall('Target.createTarget', { url: 'about:blank' });
  const pages = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = pages.find(item => item.id === target.result.targetId);
  const socket = new WebSocket(page.webSocketDebuggerUrl);
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
  await call('Runtime.enable');
  await call('Page.enable');
  await call('Input.enable');

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const evaluate = async expression => {
    const res = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.result?.exceptionDetails) {
      console.error('Eval exception:', res.result.exceptionDetails.exception?.description || res.result.exceptionDetails);
    }
    return res.result?.result?.value;
  };

  const realClick = async (text) => {
    const box = await evaluate(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText && b.innerText.includes(${JSON.stringify(text)}));
      if (!btn) return null;
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!box) return false;
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await wait(80);
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText && b.innerText.includes(${JSON.stringify(text)}));
      if (btn) btn.click();
    })()`);
    return true;
  };

  const captureScreenshot = async (filePath) => {
    const res = await call('Page.captureScreenshot', { format: 'png' });
    if (res.result?.data) {
      await writeFile(filePath, Buffer.from(res.result.data, 'base64'));
      console.log(`Saved screenshot: ${filePath}`);
    }
  };

  async function setupAndMountPlayer(tonightState = 'MIND_WONT_STOP') {
    await call('Page.navigate', { url: 'http://localhost:3000/night-companion' });
    await wait(1500);

    console.log(`Setting up profile via API with state ${tonightState}...`);
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
            current_state: ${JSON.stringify(tonightState)},
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
            explanation: 'Plan explanation for ' + ${JSON.stringify(tonightState)},
            explanation_vi: 'Giai thich cho ' + ${JSON.stringify(tonightState)}
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

    await call('Page.reload');

    for (let i = 0; i < 30; i++) {
      const txt = (await evaluate(`document.body ? document.body.innerText : ''`)) || '';
      if (!txt.includes('Loading your Night Profile') && txt.length > 50) break;
      await wait(300);
    }

    console.log('Navigating through flow to Player...');
    for (let i = 0; i < 20; i++) {
      const audioCount = await evaluate(`document.querySelectorAll('audio').length`);
      if (audioCount && audioCount >= 2) {
        console.log(`Player loaded with ${audioCount} audio elements!`);
        break;
      }

      await realClick('Continue Night 1');
      await realClick('Start Night 1');
      await realClick('Prepare for tonight');
      await wait(400);
    }

    await wait(800);
  }

  await setupAndMountPlayer('MIND_WONT_STOP');

  const results = {};

  // Check 1: Audio player rendered with 3-stage UI
  console.log('Checking Audio Player DOM and 3-stage structure...');
  const playerInfo = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')].map(a => ({
      src: a.src,
      loop: a.loop,
      preload: a.preload,
      paused: a.paused
    }));
    const voiceSelect = document.querySelector('select');
    const voiceOptions = voiceSelect ? [...voiceSelect.querySelectorAll('option')].map(o => ({ value: o.value, text: o.text })) : [];
    const stage1Text = document.body.innerText.includes('Stage 1: State Intro');
    const stage2Text = document.body.innerText.includes('Stage 2: Voice Guidance');
    const stage3Text = document.body.innerText.includes('Stage 3: Sleep Frequency');
    return {
      audios,
      voiceOptions,
      stage1Text,
      stage2Text,
      stage3Text
    };
  })()`);

  console.log('Player info:', JSON.stringify(playerInfo, null, 2));
  results.dom_3stage_presence = {
    pass: Boolean(playerInfo.stage1Text && playerInfo.stage2Text && playerInfo.stage3Text),
    stage1Text: playerInfo.stage1Text,
    stage2Text: playerInfo.stage2Text,
    stage3Text: playerInfo.stage3Text,
    voiceOptionCount: playerInfo.voiceOptions.length
  };

  // Check 2: All 4 breathing options available in select
  const expectedVoiceIds = [
    'night1-guided-coherent-5-5',
    'night1-guided-4-7-8',
    'night1-guided-box-4-4-4-4',
    'night1-guided-4-2-6'
  ];
  const foundVoiceIds = playerInfo.voiceOptions.map(o => o.value);
  const all4Present = expectedVoiceIds.every(id => foundVoiceIds.includes(id));
  results.all_4_breathing_options_present = {
    pass: all4Present,
    expectedVoiceIds,
    foundVoiceIds
  };
  console.log('All 4 breathing options present:', all4Present);

  // Check 3: Audio element initial properties (voice loop MUST be false)
  const initialAudios = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')];
    return audios.map(a => {
      const src = a.getAttribute('src') || a.src;
      return {
        src,
        loop: a.loop,
        hasLoopAttr: a.hasAttribute('loop')
      };
    });
  })()`);
  console.log('Initial audio elements:', JSON.stringify(initialAudios, null, 2));

  const voiceAudio = initialAudios.find(a => a.src.includes('guided-coherent-5-5'));
  const pacerAudio = initialAudios.find(a => a.src.includes('pacer-chime-coherent-5-5'));
  const introAudio = initialAudios.find(a => a.src.includes('night1_intro_mind_wont_stop'));

  results.initial_audio_loop_properties = {
    pass: Boolean(voiceAudio && voiceAudio.loop === false && pacerAudio && pacerAudio.loop === true),
    voiceLoop: voiceAudio ? voiceAudio.loop : null,
    pacerLoop: pacerAudio ? pacerAudio.loop : null,
    introFound: Boolean(introAudio)
  };
  console.log('Voice loop is false & Pacer loop is true:', results.initial_audio_loop_properties.pass);

  // Check 4: Start listening -> Intro starts playing
  console.log('Testing Start Listening...');
  await realClick('Start listening');
  await wait(1000);

  const afterStart = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')].map(a => ({
      src: a.src,
      paused: a.paused,
      currentTime: a.currentTime
    }));
    return audios;
  })()`);
  results.start_listening_playback = {
    pass: afterStart.some(a => a.src.includes('intro') && !a.paused),
    audios: afterStart
  };
  console.log('Intro playing after start:', results.start_listening_playback.pass);

  // Check 5: Skip intro to voice -> Voice starts playing, Intro stops
  console.log('Testing Skip Intro to voice...');
  await realClick('Skip intro to voice');
  await wait(1000);

  const afterSkipIntro = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')].map(a => ({
      src: a.src,
      paused: a.paused,
      currentTime: a.currentTime
    }));
    return audios;
  })()`);
  results.skip_intro_to_voice = {
    pass: afterSkipIntro.some(a => a.src.includes('guided') && !a.paused),
    audios: afterSkipIntro
  };
  console.log('Voice playing after skip intro:', results.skip_intro_to_voice.pass);

  // Check 6: Skip voice to sleep frequency -> Pacer starts playing and looping, Voice stops
  console.log('Testing Skip Voice to sleep frequency...');
  await realClick('Skip voice to sleep frequency');
  await wait(1000);

  const afterSkipVoice = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')].map(a => ({
      src: a.src,
      paused: a.paused,
      loop: a.loop,
      currentTime: a.currentTime
    }));
    const stage3Status = document.body.innerText.includes('Active (Looping)');
    return { audios, stage3Status };
  })()`);
  results.skip_voice_to_pacer = {
    pass: afterSkipVoice.audios.some(a => a.src.includes('pacer-chime-coherent-5-5') && !a.paused && a.loop === true),
    stage3Active: afterSkipVoice.stage3Status,
    audios: afterSkipVoice.audios
  };
  console.log('Pacer playing and looping after skip voice:', results.skip_voice_to_pacer.pass);

  // Check 7: Pacer mapping for all 4 exercises
  console.log('Testing Pacer track switching for all 4 breathing exercises...');
  const switchResults = {};
  for (const voiceOption of playerInfo.voiceOptions) {
    await evaluate(`((targetId) => {
      const select = document.querySelector('select');
      if (select) {
        select.value = targetId;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })(${JSON.stringify(voiceOption.value)})`);
    await wait(600);

    const checkPacerSrc = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      const pacer = audios.find(a => (a.getAttribute('src') || a.src).includes('/pacer/'));
      return pacer ? (pacer.getAttribute('src') || pacer.src) : null;
    })()`);
    switchResults[voiceOption.value] = checkPacerSrc;
  }

  const expectedPacerMap = {
    'night1-guided-coherent-5-5': 'pacer-chime-coherent-5-5.mp3',
    'night1-guided-4-7-8': 'pacer-chime-4-7-8.mp3',
    'night1-guided-box-4-4-4-4': 'pacer-chime-box-4-4-4-4.mp3',
    'night1-guided-4-2-6': 'pacer-chime-4-2-6.mp3'
  };

  let allPacerCorrect = true;
  for (const [vId, pFileName] of Object.entries(expectedPacerMap)) {
    if (!switchResults[vId] || !switchResults[vId].includes(pFileName)) {
      allPacerCorrect = false;
      console.error(`Mismatch for ${vId}: expected ${pFileName}, got ${switchResults[vId]}`);
    }
  }

  results.pacer_switch_mapping = {
    pass: allPacerCorrect,
    switchResults
  };
  console.log('All 4 pacer audio sources correctly mapped:', allPacerCorrect);

  // Switch back to 5-5
  await evaluate(`(() => {
    const select = document.querySelector('select');
    if (select) {
      select.value = 'night1-guided-coherent-5-5';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await wait(500);

  // Check 8: Natural end of voice guidance transitions to Pacer without looping voice
  console.log('Testing natural voice completion transition...');
  // Click Stop to reset
  await realClick('Stop listening');
  await wait(500);
  // Click Start listening
  await realClick('Start listening');
  await wait(500);
  // Skip intro to guided
  await realClick('Skip intro to voice');
  await wait(500);

  // Dispatch ended on voice audio
  const naturalTransition = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')];
    const voiceAudio = audios.find(a => (a.getAttribute('src') || a.src).includes('guided-coherent-5-5'));
    if (voiceAudio) {
      voiceAudio.dispatchEvent(new Event('ended'));
    }
    return {
      voiceLoop: voiceAudio ? voiceAudio.loop : null
    };
  })()`);
  await wait(1200);

  const afterNaturalEnd = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')].map(a => ({
      src: a.src,
      paused: a.paused,
      loop: a.loop
    }));
    const isPacerPlaying = audios.some(a => a.src.includes('pacer-chime') && !a.paused);
    const isVoicePaused = audios.every(a => !a.src.includes('guided') || a.paused);
    return {
      isPacerPlaying,
      isVoicePaused,
      audios
    };
  })()`);

  results.natural_voice_transition = {
    pass: Boolean(afterNaturalEnd.isPacerPlaying && afterNaturalEnd.isVoicePaused && naturalTransition.voiceLoop === false),
    voiceLoop: naturalTransition.voiceLoop,
    isPacerPlaying: afterNaturalEnd.isPacerPlaying,
    isVoicePaused: afterNaturalEnd.isVoicePaused,
    audios: afterNaturalEnd.audios
  };
  console.log('Natural voice ended transitions automatically to looping pacer:', results.natural_voice_transition.pass);

  // Check 9: Pause and Resume in Stage 3 (Pacer)
  console.log('Testing Pause and Resume during Chime Pacer...');
  // Pause
  await realClick('Pause');
  await wait(600);

  const afterPause = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')].map(a => ({
      src: a.src,
      paused: a.paused
    }));
    return audios.every(a => a.paused);
  })()`);

  // Resume
  await realClick('Start listening');
  await wait(1200);

  const afterResume = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')].map(a => ({
      src: a.src,
      paused: a.paused,
      currentTime: a.currentTime
    }));
    const isPacerPlaying = audios.some(a => a.src.includes('pacer-chime') && !a.paused);
    const isBgPlaying = audios.some(a => (a.src.includes('music-') || a.src.includes('ocean')) && !a.paused);
    return { isPacerPlaying, isBgPlaying, audios };
  })()`);

  results.pause_resume_pacer = {
    pass: Boolean(afterPause && afterResume.isPacerPlaying && afterResume.isBgPlaying),
    afterPauseAllPaused: afterPause,
    afterResumePacerPlaying: afterResume.isPacerPlaying,
    afterResumeBgPlaying: afterResume.isBgPlaying,
    resumeAudios: afterResume.audios
  };
  console.log('Pause and Resume in Chime Pacer stage work properly:', results.pause_resume_pacer.pass);

  // Capture screenshot of Stage 3
  const screenshotPath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\ea2d8329-b86f-4322-b31d-14baa377dafb\\night-companion-audit\\audit-option-b-chime-pacer.png';
  await captureScreenshot(screenshotPath);

  // Check 10: Timer until_voice stops playback without looping chimes
  console.log('Testing timer "until_voice" mode...');
  // Stop all first
  await realClick('Stop listening');
  await wait(500);

  // Set timer to until_voice
  await evaluate(`(() => {
    const selects = [...document.querySelectorAll('select')];
    const timerSelect = selects.find(s => [...s.options].some(o => o.value === 'until_voice'));
    if (timerSelect) {
      timerSelect.value = 'until_voice';
      timerSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await wait(500);

  // Start listening
  await realClick('Start listening');
  await wait(500);

  // Skip intro to voice
  await realClick('Skip intro to voice');
  await wait(500);

  // Fire ended on voice audio
  await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')];
    const voiceAudio = audios.find(a => (a.getAttribute('src') || a.src).includes('guided-coherent-5-5'));
    if (voiceAudio) {
      voiceAudio.dispatchEvent(new Event('ended'));
    }
  })()`);
  await wait(1000);

  const afterUntilVoiceEnded = await evaluate(`(() => {
    const audios = [...document.querySelectorAll('audio')].map(a => ({
      src: a.src,
      paused: a.paused
    }));
    const allPaused = audios.every(a => a.paused);
    const hasPacerPlaying = audios.some(a => a.src.includes('pacer-chime') && !a.paused);
    return { allPaused, hasPacerPlaying };
  })()`);

  results.until_voice_timer_stops = {
    pass: Boolean(afterUntilVoiceEnded.allPaused && !afterUntilVoiceEnded.hasPacerPlaying),
    allPaused: afterUntilVoiceEnded.allPaused,
    hasPacerPlaying: afterUntilVoiceEnded.hasPacerPlaying
  };
  console.log('Timer until_voice stops playback without chimes:', results.until_voice_timer_stops.pass);

  // Summary
  const allTestsPass = Object.values(results).every(r => r.pass === true);
  console.log('\n========================================');
  console.log(`OPTION B VERIFICATION SUMMARY: ${allTestsPass ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('========================================');
  console.log(JSON.stringify(results, null, 2));

  await writeFile(
    'docs/OPTION_B_CHIME_PACER_RESULTS.json',
    JSON.stringify({ timestamp: new Date().toISOString(), allTestsPass, results }, null, 2)
  );

  await browserCall('Target.closeTarget', { targetId: target.result.targetId });
  socket.close();
  browser.close();
}

runOptionBVerification().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
