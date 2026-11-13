import fs from 'fs';
import path from 'path';

const baseDir = 'D:/botly/App/prototypes/wellness-home';
const appJsPath = path.join(baseDir, 'app.js');

let appJs = fs.readFileSync(appJsPath, 'utf8');

// The new progressive gameplay engine code to append to app.js
const engineCode = `
// ========================================================
// PROGRESSIVE GAMEPLAY ENGINE (Master Blueprint & Multi-Player Progression)
// ========================================================

let activePlayerId = 'player_1';
let masterBlueprint = null;
let currentPlayerProfile = null;
let currentRewardChoiceA = null;
let currentRewardChoiceB = null;
let isAutoDayNightEnabled = true;

// 1. Load Master Blueprint from server
async function loadMasterBlueprint() {
  try {
    const res = await fetch('/api/master-blueprint');
    if (res.ok) {
      masterBlueprint = await res.json();
      console.log('Loaded Master Blueprint:', masterBlueprint.name, masterBlueprint.items.length, 'items');
    }
  } catch (err) {
    console.error('Error loading master blueprint:', err);
  }
}

// 2. Load Active Player Profile
async function loadPlayerProfile(playerId) {
  activePlayerId = playerId || 'player_1';
  try {
    const res = await fetch(\`/api/player-state?playerId=\${activePlayerId}\`);
    if (res.ok) {
      currentPlayerProfile = await res.json();
    } else {
      currentPlayerProfile = {
        player_id: activePlayerId,
        created_at: new Date().toISOString(),
        unlocked_items: [],
        active_scene: 'scene_interior_wide',
        day_night_override: null
      };
    }
  } catch (err) {
    console.error('Error loading player profile:', err);
    currentPlayerProfile = {
      player_id: activePlayerId,
      unlocked_items: [],
      active_scene: 'scene_interior_wide'
    };
  }

  updatePlayerGameplayUI();
  syncRoomItemsWithMasterAndPlayer();
}

// 3. Update Header Buttons based on Player State
function updatePlayerGameplayUI() {
  const selectElem = document.getElementById('select-player-profile');
  if (selectElem) selectElem.value = activePlayerId;

  const btnWelcome = document.getElementById('btn-open-welcome-gift');
  const btnDaily = document.getElementById('btn-open-daily-reward');
  const adminTools = document.getElementById('admin-tools-group');

  if (activePlayerId === 'player_master') {
    // Admin Master Mode
    if (btnWelcome) btnWelcome.style.display = 'none';
    if (btnDaily) btnDaily.style.display = 'none';
    if (adminTools) adminTools.style.display = 'inline-flex';
    document.body.classList.add('is-admin-mode');
  } else {
    // Player Mode
    if (adminTools) adminTools.style.display = 'none';
    document.body.classList.remove('is-admin-mode');

    const unlocked = currentPlayerProfile?.unlocked_items || [];
    if (unlocked.length === 0) {
      // Day 0: Show Welcome Starter Gift
      if (btnWelcome) btnWelcome.style.display = 'inline-flex';
      if (btnDaily) btnDaily.style.display = 'none';
    } else {
      // Day 1+: Show Daily 1-of-2 Reward
      if (btnWelcome) btnWelcome.style.display = 'none';
      if (btnDaily) btnDaily.style.display = 'inline-flex';
    }
  }
}

// 4. Sync Items on Stage: Master Blueprint + Player Unlocked Items
function syncRoomItemsWithMasterAndPlayer() {
  if (!masterBlueprint || !masterBlueprint.items) return;

  if (activePlayerId === 'player_master') {
    // Admin Mode: load all 10 master items so Admin can view/edit them
    inventoryState.custom_items = masterBlueprint.items.map(it => ({
      id: it.id,
      name: it.name,
      img_src: it.img_src,
      scene_id: it.room,
      natural_width: it.natural_width,
      natural_height: it.natural_height,
      corners: { ...it.corners },
      user_scale: it.user_scale,
      z_index: it.z_index,
      displayed: true,
      visible: true
    }));
  } else {
    // Player Mode: ONLY load items this player has unlocked!
    const unlockedIds = currentPlayerProfile?.unlocked_items || [];
    inventoryState.custom_items = masterBlueprint.items
      .filter(it => unlockedIds.includes(it.id))
      .map(it => ({
        id: it.id,
        name: it.name,
        img_src: it.img_src,
        scene_id: it.room,
        natural_width: it.natural_width,
        natural_height: it.natural_height,
        corners: { ...it.corners },
        user_scale: it.user_scale,
        z_index: it.z_index,
        displayed: true,
        visible: true
      }));
  }

  renderCustomItems();
}

// 5. Switch Player Profile
async function switchPlayerProfile(newPlayerId) {
  console.log('Switching to profile:', newPlayerId);
  await loadPlayerProfile(newPlayerId);
  showToast(\`👤 Đã chuyển sang: \${newPlayerId === 'player_master' ? '👑 Admin (Master Blueprint)' : newPlayerId === 'player_1' ? 'Người Chơi 1' : 'Người Chơi 2'}\`);
}

// 6. Real-time Clock & Auto Day/Night
function updateRealTimeClockAndLighting() {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, '0');
  const timeStr = \`\${hours}:\${mins}\`;

  const clockTimeElem = document.getElementById('clock-time-display');
  const clockTagElem = document.getElementById('clock-status-tag');

  if (clockTimeElem) clockTimeElem.textContent = timeStr;

  const isNight = hours >= 18 || hours < 6;

  if (isAutoDayNightEnabled) {
    currentDayNight = isNight ? 'night' : 'day';
    if (clockTagElem) {
      clockTagElem.textContent = isNight ? '🌙 Đêm (Tự động)' : '☀️ Ngày (Tự động)';
      clockTagElem.style.color = isNight ? '#818cf8' : '#fbbf24';
    }
  } else {
    if (clockTagElem) {
      clockTagElem.textContent = currentDayNight === 'night' ? '🌙 Đêm (Thủ công)' : '☀️ Ngày (Thủ công)';
      clockTagElem.style.color = '#38bdf8';
    }
  }

  // Update button label
  const btn = document.getElementById('btn-toggle-day-night');
  const icon = document.getElementById('day-night-icon');
  const label = document.getElementById('day-night-label');
  if (btn) btn.classList.toggle('is-night', currentDayNight === 'night');
  if (icon) icon.textContent = currentDayNight === 'night' ? '☀️' : '🌙';
  if (label) label.textContent = currentDayNight === 'night' ? 'Ban Ngày' : 'Ban Đêm';

  applySceneBackgrounds();
}

// Override toggle to allow temporary manual testing
function toggleDayNightMode() {
  isAutoDayNightEnabled = false;
  currentDayNight = currentDayNight === 'day' ? 'night' : 'day';
  updateRealTimeClockAndLighting();
  showToast(currentDayNight === 'night' 
    ? '🌙 Đã chuyển sang Ban Đêm (Chế độ xem thử)' 
    : '☀️ Đã chuyển sang Ban Ngày (Chế độ xem thử)');
}

// 7. Welcome Gift Modal (Ngày 1 Starter Gift)
function openWelcomeGiftModal() {
  const modal = document.getElementById('modal-welcome-gift');
  if (modal) modal.style.display = 'flex';
}

function closeWelcomeGiftModal() {
  const modal = document.getElementById('modal-welcome-gift');
  if (modal) modal.style.display = 'none';
}

async function claimWelcomeGift() {
  if (!currentPlayerProfile) return;
  if (!currentPlayerProfile.unlocked_items.includes('sofa_luxury')) {
    currentPlayerProfile.unlocked_items.push('sofa_luxury');
  }

  // Save to server
  try {
    await fetch('/api/player-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentPlayerProfile)
    });
  } catch (_) {}

  closeWelcomeGiftModal();
  updatePlayerGameplayUI();
  switchScene('scene_interior_wide');
  syncRoomItemsWithMasterAndPlayer();

  showToast('🎉 CHÚC MỪNG TÂN GIA! Bộ Sofa Thụy Sĩ sang trọng đã được đặt vào phòng khách của bạn!');
}

// 8. Daily Reward Modal (Pick 1 of 2 Choices)
function openDailyRewardModal() {
  if (!masterBlueprint || !currentPlayerProfile) return;

  const unlocked = currentPlayerProfile.unlocked_items || [];
  const livingUnowned = masterBlueprint.items.filter(it => it.room === 'scene_interior_wide' && !unlocked.includes(it.id));
  const bedroomUnowned = masterBlueprint.items.filter(it => it.room === 'scene_bedroom' && !unlocked.includes(it.id));

  if (livingUnowned.length === 0 && bedroomUnowned.length === 0) {
    showToast('🏆 Chúc mừng! Bạn đã hoàn thành trọn bộ 10/10 món nội thất cho cả 2 phòng!');
    return;
  }

  // Pick choices:
  if (livingUnowned.length > 0 && bedroomUnowned.length > 0) {
    currentRewardChoiceA = livingUnowned[Math.floor(Math.random() * livingUnowned.length)];
    currentRewardChoiceB = bedroomUnowned[Math.floor(Math.random() * bedroomUnowned.length)];
  } else if (livingUnowned.length > 0) {
    // Bedroom full -> pick 2 from living
    currentRewardChoiceA = livingUnowned[0];
    currentRewardChoiceB = livingUnowned[1] || livingUnowned[0];
  } else {
    // Living room full -> pick 2 from bedroom
    currentRewardChoiceA = bedroomUnowned[0];
    currentRewardChoiceB = bedroomUnowned[1] || bedroomUnowned[0];
  }

  // Populate Card A
  document.getElementById('card-img-a').src = currentRewardChoiceA.img_src;
  document.getElementById('card-title-a').textContent = currentRewardChoiceA.name;
  document.getElementById('card-desc-a').textContent = currentRewardChoiceA.desc;
  document.getElementById('btn-choose-a').innerHTML = \`<span>✨</span> Chọn Món Này (\${currentRewardChoiceA.tag})\`;

  // Populate Card B
  document.getElementById('card-img-b').src = currentRewardChoiceB.img_src;
  document.getElementById('card-title-b').textContent = currentRewardChoiceB.name;
  document.getElementById('card-desc-b').textContent = currentRewardChoiceB.desc;
  document.getElementById('btn-choose-b').innerHTML = \`<span>✨</span> Chọn Món Này (\${currentRewardChoiceB.tag})\`;

  const modal = document.getElementById('modal-daily-reward');
  if (modal) modal.style.display = 'flex';
}

function closeDailyRewardModal() {
  const modal = document.getElementById('modal-daily-reward');
  if (modal) modal.style.display = 'none';
}

async function claimDailyReward(choice) {
  const chosenItem = choice === 'a' ? currentRewardChoiceA : currentRewardChoiceB;
  if (!chosenItem || !currentPlayerProfile) return;

  if (!currentPlayerProfile.unlocked_items.includes(chosenItem.id)) {
    currentPlayerProfile.unlocked_items.push(chosenItem.id);
  }

  // Save to server
  try {
    await fetch('/api/player-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentPlayerProfile)
    });
  } catch (_) {}

  closeDailyRewardModal();
  updatePlayerGameplayUI();

  // Switch to target room and render
  switchScene(chosenItem.room);
  syncRoomItemsWithMasterAndPlayer();

  const roomName = chosenItem.room === 'scene_interior_wide' ? 'Phòng Khách' : 'Phòng Ngủ';
  showToast(\`✨ Tuyệt vời! Bạn vừa mở khóa "\${chosenItem.name}" và đặt ngay ngắn vào \${roomName}!\`);
}

// 9. Reset Active Player to Day 0 (Empty House)
async function resetCurrentPlayer() {
  if (activePlayerId === 'player_master') {
    showToast('⚠️ Không thể reset chế độ Admin Master. Hãy chọn Player 1 hoặc Player 2.');
    return;
  }

  try {
    const res = await fetch('/api/player-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: activePlayerId })
    });
    if (res.ok) {
      const data = await res.json();
      currentPlayerProfile = data.state;
      updatePlayerGameplayUI();
      syncRoomItemsWithMasterAndPlayer();
      showToast(\`↺ Đã reset tài khoản \${activePlayerId} về Ngày 0 (Cả 2 phòng trống hoàn toàn)!\`);
    }
  } catch (err) {
    console.error('Reset error:', err);
  }
}

// 10. Admin Save Master Blueprint
async function saveMasterBlueprintFromAdmin() {
  if (activePlayerId !== 'player_master') return;
  // Update master blueprint item coordinates from current custom_items
  if (inventoryState && inventoryState.custom_items) {
    inventoryState.custom_items.forEach(cItem => {
      const bpItem = masterBlueprint.items.find(it => it.id === cItem.id);
      if (bpItem) {
        bpItem.corners = { ...cItem.corners };
        bpItem.user_scale = cItem.user_scale;
        bpItem.z_index = cItem.z_index;
      }
    });
  }

  try {
    const res = await fetch('/api/master-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(masterBlueprint)
    });
    if (res.ok) {
      showToast('💾 Đã lưu Master Blueprint thành công cho toàn bộ hệ thống!');
    }
  } catch (err) {
    console.error('Error saving blueprint:', err);
  }
}

// Initialize Progressive Gameplay Engine on DOM Load
window.addEventListener('DOMContentLoaded', async () => {
  await loadMasterBlueprint();
  await loadPlayerProfile('player_1');
  updateRealTimeClockAndLighting();
  setInterval(updateRealTimeClockAndLighting, 30000);
});
`;

// Append engineCode to app.js
if (!appJs.includes('PROGRESSIVE GAMEPLAY ENGINE')) {
  appJs += '\n\n' + engineCode;
  fs.writeFileSync(appJsPath, appJs, 'utf8');
  console.log('Appended Progressive Gameplay Engine to app.js');
} else {
  console.log('Engine already present in app.js');
}
