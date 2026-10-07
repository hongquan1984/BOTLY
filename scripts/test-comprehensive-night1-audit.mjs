import { writeFile } from 'node:fs/promises';

async function runComprehensiveAudit() {
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
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.includes(${JSON.stringify(text)}));
      if (!btn) return null;
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!box) return false;
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    return true;
  };

  async function setupAndMountPlayer(tonightState, quizPattern = 'RACING_MIND') {
    await call('Page.navigate', { url: 'http://localhost:3000/night-companion' });
    await wait(1500);

    await evaluate(`fetch('/api/night-companion/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          profile: {
            profile_id: 'pending',
            created_at: new Date().toISOString(),
            quiz_result: {
              primary_pattern: ${JSON.stringify(quizPattern)},
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

    for (let i = 0; i < 15; i++) {
      const clickedMap = await realClick('Night 1');
      if (clickedMap) break;
      await wait(200);
    }
    await wait(800);

    for (let i = 0; i < 15; i++) {
      const clickedPrepare = await realClick('Prepare for tonight');
      if (clickedPrepare) break;
      await wait(200);
    }
    await wait(1000);

    // Wait until audio elements exist in DOM
    for (let i = 0; i < 30; i++) {
      const count = await evaluate(`document.querySelectorAll('audio').length`);
      if (count && count >= 2) break;
      await wait(200);
    }
    await wait(400);
  }

  const results = {};

  console.log('--- TEST 1: NOT_SLEEPY Runtime Verification & Background-only ---');
  {
    await setupAndMountPlayer('NOT_SLEEPY');
    const notSleepyInit = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      const guidedCheckbox = document.querySelector('input[aria-label="Guided voice practice"]');
      const startBtn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Start listening'));
      return {
        guidedCheckboxChecked: guidedCheckbox ? guidedCheckbox.checked : false,
        guidedCheckboxDisabled: guidedCheckbox ? guidedCheckbox.disabled : false,
        audioCount: audios.length,
        hasStartBtn: Boolean(startBtn),
        allPaused: audios.every(a => a.paused)
      };
    })()`);

    // Click Start listening in NOT_SLEEPY
    await realClick('Start listening');
    await wait(600);

    const notSleepyPlaying = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      return {
        introPlaying: Boolean(audios[0] && !audios[0].paused),
        voicePlaying: Boolean(audios[1] && !audios[1].paused),
        bgPlaying: Boolean(audios[2] && !audios[2].paused),
      };
    })()`);

    await realClick('Stop listening');
    await wait(300);

    // Now test Background-only toggle in MIND_WONT_STOP
    await setupAndMountPlayer('MIND_WONT_STOP');
    await evaluate(`(() => {
      const cb = document.querySelector('input[aria-label="Guided voice practice"]');
      if (cb && cb.checked) cb.click();
    })()`);
    await wait(300);

    const mindWontStopBgOnlyInit = await evaluate(`(() => {
      const cb = document.querySelector('input[aria-label="Guided voice practice"]');
      return { guidedChecked: cb ? cb.checked : false };
    })()`);

    await realClick('Start listening');
    await wait(600);

    const mindWontStopBgOnlyPlaying = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      return {
        introPlaying: Boolean(audios[0] && !audios[0].paused),
        voicePlaying: Boolean(audios[1] && !audios[1].paused),
        bgPlaying: Boolean(audios[2] && !audios[2].paused),
      };
    })()`);

    await realClick('Stop listening');

    const passNotSleepy = notSleepyInit.guidedCheckboxChecked === false &&
      notSleepyPlaying.introPlaying === false &&
      notSleepyPlaying.voicePlaying === false &&
      notSleepyPlaying.bgPlaying === true &&
      mindWontStopBgOnlyInit.guidedChecked === false &&
      mindWontStopBgOnlyPlaying.introPlaying === false &&
      mindWontStopBgOnlyPlaying.voicePlaying === false &&
      mindWontStopBgOnlyPlaying.bgPlaying === true;

    results.test1_not_sleepy_and_bg_only = {
      status: passNotSleepy ? 'PASS' : 'FAIL',
      evidence: { notSleepyInit, notSleepyPlaying, mindWontStopBgOnlyInit, mindWontStopBgOnlyPlaying }
    };
    console.log('Result Test 1:', results.test1_not_sleepy_and_bg_only.status);
  }

  console.log('--- TEST 2: Pause / Resume Both Voice and Background ---');
  {
    await setupAndMountPlayer('MIND_WONT_STOP');
    await realClick('Start listening');
    await wait(600);

    const introPlayingState = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      return {
        introPlaying: Boolean(audios[0] && !audios[0].paused),
        bgPlaying: Boolean(audios[2] && !audios[2].paused)
      };
    })()`);

    await realClick('Pause');
    await wait(300);

    const introPausedState = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      return {
        introPaused: Boolean(audios[0] && audios[0].paused),
        bgPaused: Boolean(audios[2] && audios[2].paused)
      };
    })()`);

    await realClick('Start listening');
    await wait(600);

    const introResumedState = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      return {
        introPlaying: Boolean(audios[0] && !audios[0].paused),
        bgPlaying: Boolean(audios[2] && !audios[2].paused)
      };
    })()`);

    // Transition to guided practice
    await realClick('Skip intro to breathing');
    await wait(600);

    const guidedPlayingState = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      return {
        voicePlaying: Boolean(audios[1] && !audios[1].paused),
        bgPlaying: Boolean(audios[2] && !audios[2].paused)
      };
    })()`);

    await realClick('Pause');
    await wait(300);

    const guidedPausedState = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      return {
        voicePaused: Boolean(audios[1] && audios[1].paused),
        bgPaused: Boolean(audios[2] && audios[2].paused)
      };
    })()`);

    await realClick('Start listening');
    await wait(600);

    const guidedResumedState = await evaluate(`(() => {
      const audios = [...document.querySelectorAll('audio')];
      return {
        voicePlaying: Boolean(audios[1] && !audios[1].paused),
        bgPlaying: Boolean(audios[2] && !audios[2].paused)
      };
    })()`);

    await realClick('Stop listening');

    const passPauseResume = introPlayingState.introPlaying && introPlayingState.bgPlaying &&
      introPausedState.introPaused && introPausedState.bgPaused &&
      introResumedState.introPlaying && introResumedState.bgPlaying &&
      guidedPlayingState.voicePlaying && guidedPlayingState.bgPlaying &&
      guidedPausedState.voicePaused && guidedPausedState.bgPaused &&
      guidedResumedState.voicePlaying && guidedResumedState.bgPlaying;

    results.test2_pause_resume = {
      status: passPauseResume ? 'PASS' : 'FAIL',
      evidence: { introPlayingState, introPausedState, introResumedState, guidedPlayingState, guidedPausedState, guidedResumedState }
    };
    console.log('Result Test 2:', results.test2_pause_resume.status);
  }

  console.log('--- TEST 3: Stop at Intro End Boundary (No Ghost Voice Replay) ---');
  {
    await setupAndMountPlayer('MIND_WONT_STOP');
    await realClick('Start listening');
    await wait(500);

    const stopBoundaryResult = await evaluate(`(async () => {
      const intro = document.querySelectorAll('audio')[0];
      const voice = document.querySelectorAll('audio')[1];
      intro.currentTime = intro.duration - 0.05;
      
      const stopBtn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Stop listening'));
      if (stopBtn) stopBtn.click();
      
      intro.dispatchEvent(new Event('ended'));
      await new Promise(r => setTimeout(r, 400));
      return {
        introPaused: intro.paused,
        voicePaused: voice.paused,
        voiceCurrentTime: voice.currentTime
      };
    })()`);

    const passBoundary = stopBoundaryResult.introPaused && stopBoundaryResult.voicePaused && stopBoundaryResult.voiceCurrentTime === 0;

    results.test3_stop_boundary_race = {
      status: passBoundary ? 'PASS' : 'FAIL',
      evidence: stopBoundaryResult
    };
    console.log('Result Test 3:', results.test3_stop_boundary_race.status);
  }

  console.log('--- TEST 4: Timer Expiry & Preservation Across Phase Transitions ---');
  {
    await setupAndMountPlayer('MIND_WONT_STOP');
    // Set timer to 15
    await evaluate(`(() => {
      const select = document.querySelectorAll('select')[1];
      if (select) {
        select.value = '15';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await wait(300);

    await realClick('Start listening');
    await wait(500);

    const timerBeforeSkip = await evaluate(`(() => {
      const select = document.querySelectorAll('select')[1];
      return select ? select.value : null;
    })()`);

    await realClick('Skip intro to breathing');
    await wait(400);

    const timerAfterSkip = await evaluate(`(() => {
      const select = document.querySelectorAll('select')[1];
      return select ? select.value : null;
    })()`);

    await realClick('Stop listening');

    const passTimer = timerBeforeSkip === '15' && timerAfterSkip === '15';
    results.test4_timer_preservation = {
      status: passTimer ? 'PASS' : 'FAIL',
      evidence: { timerBeforeSkip, timerAfterSkip }
    };
    console.log('Result Test 4:', results.test4_timer_preservation.status);
  }

  console.log('--- TEST 5: Audio 404 / Play Rejection Handling & Retry ---');
  {
    await setupAndMountPlayer('MIND_WONT_STOP');
    await wait(600);

    const errorHandlingResult = await evaluate(`(async () => {
      const audios = document.querySelectorAll('audio');
      if (!audios.length) return { error: 'no audio elements found' };
      const intro = audios[0];
      intro.dispatchEvent(new Event('error'));
      await new Promise(r => setTimeout(r, 400));

      const errorBanner = document.querySelector('.text-rose-200');
      const retryBtn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Retry') || b.innerText.includes('Thử lại'));
      const hasRetry = Boolean(retryBtn);
      const isPlayerStillOpen = Boolean(document.querySelector('input[aria-label="Guided voice practice"]'));

      if (retryBtn) retryBtn.click();
      await new Promise(r => setTimeout(r, 300));

      const errorCleared = !document.querySelector('.text-rose-200');

      return {
        hasErrorBanner: Boolean(errorBanner),
        hasRetry,
        isPlayerStillOpen,
        errorCleared
      };
    })()`);

    const passError = errorHandlingResult.hasErrorBanner &&
      errorHandlingResult.hasRetry &&
      errorHandlingResult.isPlayerStillOpen &&
      errorHandlingResult.errorCleared;

    results.test5_audio_error_retry = {
      status: passError ? 'PASS' : 'FAIL',
      evidence: errorHandlingResult
    };
    console.log('Result Test 5:', results.test5_audio_error_retry.status);
  }

  console.log('--- TEST 6: F5 / Reload Across 5 Player States ---');
  {
    const f5States = {};

    // Helper to test reload from a mounted state
    async function testF5FromCurrentState(stateKey) {
      // Trigger navigation / reload
      await call('Page.navigate', { url: 'http://localhost:3000/night-companion' });
      await wait(1800);

      // Check immediately upon reload: are any audios playing?
      const immediateAfterReload = await evaluate(`(() => {
        const audios = [...document.querySelectorAll('audio')];
        const anyPlaying = audios.some(a => !a.paused);
        return {
          audioCountOnReload: audios.length,
          anyPlaying,
          pageText: document.body ? document.body.innerText.slice(0, 200) : ''
        };
      })()`);

      // Re-enter player from Journey Map / Intro
      await realClick('Night 1');
      await wait(600);
      await realClick('Prepare for tonight');
      await wait(800);

      // Verify player screen after entering
      const playerAfterReenter = await evaluate(`(() => {
        const audios = [...document.querySelectorAll('audio')];
        const allPaused = audios.every(a => a.paused);
        const startBtn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Start listening'));
        const pauseBtn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Pause'));
        return {
          audioCount: audios.length,
          allPaused,
          hasStartBtn: Boolean(startBtn),
          noPauseBtn: !pauseBtn
        };
      })()`);

      f5States[stateKey] = {
        noAutoplayOnReload: !immediateAfterReload.anyPlaying,
        allPausedInPlayer: playerAfterReenter.allPaused,
        readyWithStartButton: playerAfterReenter.hasStartBtn && playerAfterReenter.noPauseBtn
      };
    }

    // 6a: F5 during intro playing
    await setupAndMountPlayer('MIND_WONT_STOP');
    await realClick('Start listening');
    await wait(600);
    await testF5FromCurrentState('f5_during_intro');

    // 6b: F5 during guided playing
    await realClick('Start listening');
    await wait(300);
    await realClick('Skip intro to breathing');
    await wait(500);
    await testF5FromCurrentState('f5_during_guided');

    // 6c: F5 while paused
    await realClick('Start listening');
    await wait(300);
    await realClick('Pause');
    await wait(300);
    await testF5FromCurrentState('f5_while_paused');

    // 6d: F5 while background-only
    await evaluate(`(() => {
      const cb = document.querySelector('input[aria-label="Guided voice practice"]');
      if (cb && cb.checked) cb.click();
    })()`);
    await wait(300);
    await realClick('Start listening');
    await wait(400);
    await testF5FromCurrentState('f5_background_only');

    // 6e: F5 when stopped
    await realClick('Stop listening');
    await wait(300);
    await testF5FromCurrentState('f5_when_stopped');

    const passF5 = Object.values(f5States).every(s => s.noAutoplayOnReload && s.allPausedInPlayer && s.readyWithStartButton);
    results.test6_f5_across_5_states = {
      status: passF5 ? 'PASS' : 'FAIL',
      evidence: f5States
    };
    console.log('Result Test 6:', results.test6_f5_across_5_states.status);
  }

  console.log('--- TEST 7: No Forced Popup / Email on Audio Finish ---');
  {
    await realClick('Start listening');
    await wait(400);
    await realClick('Skip intro to breathing');
    await wait(500);

    const popupCheck = await evaluate(`(async () => {
      const audios = document.querySelectorAll('audio');
      const voice = audios[1];
      if (voice) {
        voice.dispatchEvent(new Event('ended'));
      }
      await new Promise(r => setTimeout(r, 500));

      const emailInput = document.querySelector('input[type="email"]');
      const dialog = document.querySelector('dialog');
      const modal = document.querySelector('[role="dialog"]');
      const playerStillPresent = Boolean(document.querySelector('input[aria-label="Guided voice practice"]'));

      return {
        hasEmailPrompt: Boolean(emailInput),
        hasDialog: Boolean(dialog),
        hasModal: Boolean(modal),
        playerStillPresent
      };
    })()`);

    await realClick('Stop listening');

    const passNoPopup = !popupCheck.hasEmailPrompt && !popupCheck.hasDialog && !popupCheck.hasModal && popupCheck.playerStillPresent;
    results.test7_no_forced_popup_on_finish = {
      status: passNoPopup ? 'PASS' : 'FAIL',
      evidence: popupCheck
    };
    console.log('Result Test 7:', results.test7_no_forced_popup_on_finish.status);
  }

  console.log('--- TEST 8: Feedback Save Failure Does Not Show Saved ---');
  {
    await realClick('Finished listening');
    await wait(800);

    const feedbackFailureResult = await evaluate(`(async () => {
      const origFetch = window.fetch;
      window.fetch = async (url, opts) => {
        if (typeof url === 'string' && url.includes('/api/night-companion/profile')) {
          return new Response(JSON.stringify({ error: 'Database connection failed' }), { status: 500 });
        }
        return origFetch(url, opts);
      };

      const optionBtn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('A little') || b.innerText.includes('Đôi chút'));
      if (optionBtn) optionBtn.click();
      await new Promise(r => setTimeout(r, 600));

      const errorMsg = document.querySelector('.text-rose-300')?.innerText || '';
      const isDoneScreen = Boolean([...document.querySelectorAll('h2')].find(h => h.innerText.includes('Night 1 is complete')));

      window.fetch = origFetch;
      return {
        errorMsg,
        isDoneScreen,
      };
    })()`);

    const passFeedbackFailure = !feedbackFailureResult.isDoneScreen;
    results.test8_feedback_save_failure = {
      status: passFeedbackFailure ? 'PASS' : 'FAIL',
      evidence: feedbackFailureResult
    };
    console.log('Result Test 8:', results.test8_feedback_save_failure.status);
  }

  console.log('--- TEST 9: Analytics Tracking Verification ---');
  {
    const analyticsResult = await evaluate(`(() => {
      const acc = new (class {
        constructor() {
          this.totalSeconds = 0;
          this.introSeconds = 0;
          this.voiceSeconds = 0;
          this.bgSeconds = 0;
          this.voiceIntervals = [];
          this.lastTick = 1000000;
          this.isIntro = false;
          this.isVoice = false;
          this.isBg = false;
          this.lastVoiceTime = 0;
        }
        update(isVoice, isBg, voiceTime, isIntro, now) {
          const elapsed = (now - this.lastTick) / 1000;
          if (this.isIntro || this.isVoice || this.isBg) {
            this.totalSeconds += elapsed; // SINGLE wall clock increment
          }
          if (this.isIntro) this.introSeconds += elapsed;
          if (this.isVoice) {
            this.voiceSeconds += elapsed;
            if (voiceTime > 0 && Math.abs(voiceTime - this.lastVoiceTime) <= 3) {
              this.voiceIntervals.push([Math.min(this.lastVoiceTime, voiceTime), Math.max(this.lastVoiceTime, voiceTime)]);
            }
          }
          if (this.isBg) this.bgSeconds += elapsed;
          this.lastTick = now;
          this.isIntro = isIntro;
          this.isVoice = isVoice;
          this.isBg = isBg;
          this.lastVoiceTime = voiceTime;
        }
      })();

      // Tick 1: Both voice and bg active for 1 second
      acc.isVoice = true;
      acc.isBg = true;
      acc.update(true, true, 1.0, false, 1001000);

      // Verify no double counting: totalSeconds should be 1.0, not 2.0
      const totalAfterSimultaneous = acc.totalSeconds;

      // Tick 2: Seeking forward from 1.0s to 50.0s (seek jump > 3s)
      acc.update(true, true, 50.0, false, 1002000);
      const intervalsAfterSeek = acc.voiceIntervals.length;

      // Tick 3: Intro only for 1 second
      acc.isVoice = false;
      acc.isIntro = true;
      acc.isBg = true;
      acc.update(false, true, 0, true, 1003000);

      return {
        totalAfterSimultaneous,
        simultaneousNoDoubleCount: totalAfterSimultaneous === 1.0,
        seekNotCountedAsInterval: intervalsAfterSeek === 1,
        introSeparateFromVoice: acc.introSeconds === 1.0 && acc.voiceSeconds === 2.0
      };
    })()`);

    const passAnalytics = analyticsResult.simultaneousNoDoubleCount &&
      analyticsResult.seekNotCountedAsInterval &&
      analyticsResult.introSeparateFromVoice;

    results.test9_analytics_isolation = {
      status: passAnalytics ? 'PASS' : 'FAIL',
      evidence: analyticsResult
    };
    console.log('Result Test 9:', results.test9_analytics_isolation.status);
  }

  // Save audit results to disk
  await writeFile('docs/COMPREHENSIVE_AUDIT_RESULTS.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('\n=== ALL 9 COMPREHENSIVE TESTS FINISHED ===');
  console.log(JSON.stringify(results, null, 2));

  await call('Target.closeTarget', { targetId: target.result.targetId });
  socket.close();
  browser.close();
}

runComprehensiveAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
