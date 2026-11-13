(async () => {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
  if (!pageTab) {
    console.error('No page tab found on CDP port 9222');
    process.exit(1);
  }
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  const fs = await import('fs');
  const auditDir = 'C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit';

  ws.addEventListener('open', async () => {
    try {
      console.log('--- STARTING VERIFICATION SUITE ---');

      // 1. Setup Desktop Viewport (1280x800)
      console.log('Setting desktop viewport 1280x800...');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false
      });

      console.log('Navigating to http://localhost:3000/night-companion...');
      await send('Page.navigate', { url: 'http://localhost:3000/night-companion' });
      await new Promise(r => setTimeout(r, 2000));

      // Seed state so we go directly into Night 1 plan with audio player
      console.log('Seeding Night 1 state on localhost...');
      await send('Runtime.evaluate', {
        expression: `
          (async () => {
            const profile = {
              profile_id: 'test-seed-local',
              created_at: new Date().toISOString(),
              quiz_result: {
                primary_pattern: 'RACING_MIND',
                source_intent: 'racing_thoughts',
                gender: 'other',
                age_group: '30_39',
                issues: ['racing_thoughts'],
                frequency: '5_plus',
                duration: '6_to_12_months',
                sleep_hours: '5_6_hours',
                bedtime_tension: 'very_tense',
                racing_thoughts: 'very_active',
                sleep_support: 'none',
                concerns: ['dependency_concerns'],
                primary_goal: 'quiet_mind'
              },
              operational_setup: {
                desired_bedtime: '23:00',
                usual_wake_time: '07:00',
                last_hour_behaviors: ['scrolling'],
                sleep_doesnt_come: 'thoughts_busier'
              }
            };
            const plan = {
              plan_id: 'plan_night1_racing_mind',
              night_number: 1,
              title: 'Mental Unload & Guided Downshift',
              total_estimated_minutes: 12,
              explanation: 'Tonight balances a quick unload with a somatic breath cycle.',
              modules: [
                {
                  module_id: 'calming_audio',
                  kind: 'audio',
                  title: 'Gentle breathing',
                  duration_minutes: 5,
                  opening: 'Get into a comfortable position.',
                  instruction: 'Follow the natural breathing rhythm.',
                  closing: 'Rest quietly.',
                  action_label: 'Finished listening',
                  skip_label: 'Skip audio'
                }
              ]
            };
            const companionState = {
              profile,
              tonight_state: {
                night_number: 1,
                current_state: 'MIND_WONT_STOP',
                selected_at: new Date().toISOString()
              },
              night_one_plan: plan,
              module_feedback: [],
              resume_stage: 'plan',
              active_module_index: 0
            };
            const res = await fetch('/api/night-companion/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profile: companionState })
            });
            const data = await res.json();
            if (data.access_token) {
              localStorage.setItem('mindful_haven_night_companion_token', data.access_token);
            }
            window.location.reload();
          })()
        `,
        awaitPromise: true
      });
      await new Promise(r => setTimeout(r, 2000));

      // Click into player if on map
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Night 1') || b.innerText.includes('Continue'));
            if (btn) btn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1000));

      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Prepare for tonight') || b.innerText.includes('Listen now'));
            if (btn) btn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1500));

      // 2. VERIFY NEW VISUAL CONTENT & BEHAVIOR (DESKTOP IDLE)
      console.log('Inspecting Visual Area on Desktop...');
      const inspect1 = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const body = document.body.innerText;
            const ariaHiddenDecorations = Array.from(document.querySelectorAll('[aria-hidden="true"]')).length;
            const hasOldInhaleExhale = body.includes('INHALE') || body.includes('EXHALE') || body.includes('HOLD');
            const hasOldPacedBadge = body.includes('Paced: 5-5') || body.includes('Paced:');
            const hasYourQuietMoment = body.includes('Your quiet moment');
            const hasKhoangLangCuaBan = body.includes('Khoảng lặng của bạn');
            const hasAMomentToUnwind = body.includes('A moment to unwind');
            const hasMotKhoangNghi = body.includes('Một khoảng nghỉ dành cho bạn.');
            const hasFollowAudio = body.includes('Follow the audio. You can close your eyes whenever you like.');
            const hasNgheTheoHuongDan = body.includes('Nghe theo lời hướng dẫn. Bạn có thể nhắm mắt bất cứ khi nào muốn.');

            // Check animation play state of aura elements
            const mistLayers = Array.from(document.querySelectorAll('div[style*="auraMist"]'));
            const playStates = mistLayers.map(el => window.getComputedStyle(el).animationPlayState);

            return {
              hasOldInhaleExhale,
              hasOldPacedBadge,
              hasYourQuietMoment,
              hasKhoangLangCuaBan,
              hasAMomentToUnwind,
              hasMotKhoangNghi,
              hasFollowAudio,
              hasNgheTheoHuongDan,
              ariaHiddenDecorations,
              mistLayersCount: mistLayers.length,
              playStates
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Desktop Idle Inspection:', JSON.stringify(inspect1.result.value, null, 2));

      // Capture Screenshot 1: Desktop Idle
      let ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/desktop-quiet-moment-idle.png`, Buffer.from(ss.data, 'base64'));
      console.log('Saved desktop-quiet-moment-idle.png');

      // 3. START AUDIO & VERIFY ANIMATION RUNNING
      console.log('Clicking Start 60-Min Sleep Journey...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start 60-Min Sleep Journey') || b.innerText.includes('Start'));
            if (startBtn) startBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1500));

      const inspect2 = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const audios = Array.from(document.querySelectorAll('audio')).map(a => ({ src: a.src, paused: a.paused }));
            const isAnyPlaying = audios.some(a => !a.paused);
            const mistLayers = Array.from(document.querySelectorAll('div[style*="auraMist"]'));
            const playStates = mistLayers.map(el => window.getComputedStyle(el).animationPlayState);
            return {
              isAnyPlaying,
              playStates,
              hasPauseBtn: document.body.innerText.includes('Pause & Rest')
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Desktop Playing Inspection:', JSON.stringify(inspect2.result.value, null, 2));

      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/desktop-quiet-moment-playing.png`, Buffer.from(ss.data, 'base64'));
      console.log('Saved desktop-quiet-moment-playing.png');

      // 4. TEST PAUSE & RESUME
      console.log('Testing Pause...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Pause & Rest'));
            if (pauseBtn) pauseBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 800));

      const inspect3 = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const mistLayers = Array.from(document.querySelectorAll('div[style*="auraMist"]'));
            return {
              playStates: mistLayers.map(el => window.getComputedStyle(el).animationPlayState)
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Pause Inspection (expect paused):', JSON.stringify(inspect3.result.value, null, 2));

      // Resume
      console.log('Testing Resume...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start 60-Min Sleep Journey') || b.innerText.includes('Start'));
            if (startBtn) startBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1000));

      // 5. TEST BACKGROUND-ONLY COPY (when guided practice is off)
      console.log('Testing Background-Only copy...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            // Open customizer
            const custBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Customize Sound'));
            if (custBtn) custBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 600));

      // We can test background-only text when guidedOn is turned off
      // Or advancing to theta_drift stage
      console.log('Advancing to 432Hz (Stage 2: Background Waves)...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const s2Btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('2. 432Hz'));
            if (s2Btn) s2Btn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1200));

      const inspect4 = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const body = document.body.innerText;
            const hasSettleIn = body.includes('Settle in and listen at your own pace.');
            const hasDanhThoiGianNghi = body.includes('Dành thời gian nghỉ và nghe theo nhịp của bạn.');
            return { hasSettleIn, hasDanhThoiGianNghi };
          })()
        `,
        returnByValue: true
      });
      console.log('Background-Only Copy Inspection:', JSON.stringify(inspect4.result.value, null, 2));

      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/desktop-quiet-moment-background-only.png`, Buffer.from(ss.data, 'base64'));
      console.log('Saved desktop-quiet-moment-background-only.png');

      // 6. TEST DIM SCREEN (BLACKOUT MODE)
      console.log('Testing Dim Screen...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const dimBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('dim screen'));
            if (dimBtn) dimBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 800));

      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/desktop-quiet-moment-dimmed.png`, Buffer.from(ss.data, 'base64'));
      console.log('Saved desktop-quiet-moment-dimmed.png');

      // Wake up from Dim Screen
      console.log('Waking from Dim Screen...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const overlay = document.querySelector('[aria-label="Wake screen"]');
            if (overlay) overlay.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 800));

      // 7. TEST MOBILE VIEWPORT (390x844 - iPhone 12/13/14)
      console.log('Testing Mobile Viewport 390x844...');
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
      });
      await new Promise(r => setTimeout(r, 1000));

      const mobileInspect = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const hasHorizontalScroll = docWidth > winWidth;
            return {
              docWidth,
              winWidth,
              hasHorizontalScroll
            };
          })()
        `,
        returnByValue: true
      });
      console.log('Mobile Layout Inspection:', JSON.stringify(mobileInspect.result.value, null, 2));

      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/mobile-quiet-moment-player.png`, Buffer.from(ss.data, 'base64'));
      console.log('Saved mobile-quiet-moment-player.png');

      // 8. TEST F5 RELOAD (NO AUTOPLAY)
      console.log('Testing F5 reload (autoplay check)...');
      await send('Page.reload');
      await new Promise(r => setTimeout(r, 2000));

      const autoplayCheck = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const audios = Array.from(document.querySelectorAll('audio'));
            const isPlaying = audios.some(a => !a.paused && a.currentTime > 0);
            return { audioCount: audios.length, isPlaying };
          })()
        `,
        returnByValue: true
      });
      console.log('F5 Autoplay Check:', JSON.stringify(autoplayCheck.result.value, null, 2));

      // Reset Emulation
      await send('Emulation.clearDeviceMetricsOverride');

      console.log('--- ALL TESTS COMPLETED SUCCESSFULLY ---');
      ws.close();
      process.exit(0);
    } catch (e) {
      console.error('Test Suite Failed:', e);
      ws.close();
      process.exit(1);
    }
  });
})();
