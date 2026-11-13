(async () => {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
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

  ws.addEventListener('open', async () => {
    try {
      console.log('Navigating to live production: https://www.botly.vn/night-companion...');
      await send('Page.navigate', { url: 'https://www.botly.vn/night-companion' });
      await new Promise(r => setTimeout(r, 2000));

      // Seed state on production
      await send('Runtime.evaluate', {
        expression: `
          (async () => {
            const profile = {
              profile_id: 'test-seed-profile-prod',
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

      // After reload, click Night 1 to open player
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button, .group")).find(el => el.innerText.includes("Night 1") || el.innerText.includes("Continue") || el.innerText.includes("Resume"))?.click()'
      });
      await new Promise(r => setTimeout(r, 1500));

      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Prepare for tonight") || b.innerText.includes("Listen now"))?.click()'
      });
      await new Promise(r => setTimeout(r, 1500));

      // Capture screenshot of live production player
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/player-live-production-cloned.png', Buffer.from(ss.data, 'base64'));
      console.log('Saved player-live-production-cloned.png!');

      ws.close();
      process.exit(0);
    } catch (e) {
      console.error(e);
      ws.close();
      process.exit(1);
    }
  });
})();
