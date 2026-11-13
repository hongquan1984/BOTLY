import fs from 'fs';
import path from 'path';

const baseDir = 'D:/botly/App/prototypes/wellness-home';

// =========================================================================
// 1. Update index.html
// =========================================================================
function updateIndexHtml() {
  console.log('Updating index.html with Player Progression & Modals...');
  let html = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');

  // Replace header with clean, organized header
  const headerStart = html.indexOf('<header class="app-header">');
  const headerEnd = html.indexOf('</header>') + '</header>'.length;

  if (headerStart === -1 || headerEnd === -1) {
    throw new Error('Could not find <header> in index.html');
  }

  const newHeader = `<header class="app-header">
      <!-- Left: Logo & Room Switcher -->
      <div class="header-left">
        <div class="brand">
          <span class="brand-icon">🏡</span>
          <div class="brand-info">
            <h1 class="brand-title">My Wellness Home</h1>
            <span class="brand-sub">Biệt Thự Sức Khỏe Thụy Sĩ • Hệ Thống Mở Quà Hàng Ngày</span>
          </div>
        </div>

        <!-- Room Switcher Nav -->
        <div class="room-switcher-nav">
          <button id="btn-scene-living" class="room-nav-btn active" onclick="switchScene('scene_interior_wide')" title="Chuyển sang Phòng Khách Góc Rộng">
            <span>🏔️</span> Phòng Khách
          </button>
          <button id="btn-scene-bedroom" class="room-nav-btn" onclick="switchScene('scene_bedroom')" title="Chuyển sang Phòng Ngủ Tĩnh Dưỡng">
            <span>🛏️</span> Phòng Ngủ
          </button>
        </div>

        <!-- Real-time Clock & Auto Day/Night Badge -->
        <div class="auto-clock-badge" id="auto-clock-badge" title="Tự động đồng bộ ánh sáng Ngày / Đêm theo giờ thực tế của bạn">
          <span class="clock-icon">⏰</span>
          <span id="clock-time-display">22:00</span>
          <span class="clock-dot">•</span>
          <span id="clock-status-tag">🌙 Đêm</span>
        </div>

        <button id="btn-toggle-day-night" class="btn-day-night" onclick="toggleDayNightMode()" title="Chuyển đổi thử nghiệm Ban Ngày / Ban Đêm">
          <span id="day-night-icon">🌙</span> <span id="day-night-label">Ban Đêm</span>
        </button>
      </div>

      <!-- Right: Player Profile Switcher & Gameplay Actions -->
      <div class="header-right">
        <!-- Player Switcher Dropdown (Mỗi người chơi có căn nhà riêng) -->
        <div class="player-select-wrap" title="Chọn tài khoản người chơi để kiểm tra tính độc lập dữ liệu">
          <span class="player-select-label">👤 Tài khoản:</span>
          <select id="select-player-profile" class="player-select" onchange="switchPlayerProfile(this.value)">
            <option value="player_1">Người Chơi 1 (Mới - Ngày 1)</option>
            <option value="player_2">Người Chơi 2 (Đã có quà)</option>
            <option value="player_master">👑 Admin (Master Blueprint)</option>
          </select>
        </div>

        <!-- Primary Gameplay Buttons -->
        <button id="btn-open-welcome-gift" class="btn-welcome-gift" onclick="openWelcomeGiftModal()" style="display: none;" title="Mở hộp quà tân gia ngày đầu tiên">
          <span>🎁</span> Mở Quà Tân Gia
        </button>

        <button id="btn-open-daily-reward" class="btn-daily-gift" onclick="openDailyRewardModal()" title="Mở hộp quà nhiệm vụ hôm nay (Chọn 1 trong 2 phòng)">
          <span>✨</span> Nhận Quà Hôm Nay (1/2)
        </button>

        <button id="btn-reset-player" class="btn-reset-player" onclick="resetCurrentPlayer()" title="Reset về Ngày 0 (phòng trống) để trải nghiệm lại từ đầu">
          <span>↺</span> Reset Chơi Lại
        </button>

        <!-- Admin Specific Tools (Shown only in Admin Master mode) -->
        <div id="admin-tools-group" class="admin-tools-group" style="display: none;">
          <button id="btn-save-room-state" class="btn-save-room" onclick="saveMasterBlueprintFromAdmin()" title="Lưu Master Blueprint cho toàn bộ người chơi">
            <span>💾</span> Lưu Blueprint
          </button>
          <button id="btn-upload-furniture" class="btn-upload-furniture" onclick="document.getElementById('input-upload-furniture').click()" title="Tải ảnh đồ nội thất mới">
            <span>📤</span> Tải Đồ
          </button>
        </div>

        <button id="btn-toggle-drawer" class="btn-hdr-action" onclick="toggleDecorDrawer()" title="Thu gọn / Mở rộng bảng đồ đạc">
          <span id="icon-toggle-drawer">🎁</span> <span id="label-toggle-drawer">Đồ Đạc</span>
        </button>
      </div>
    </header>`;

  html = html.substring(0, headerStart) + newHeader + html.substring(headerEnd);

  // Add the two game modals right before </body> if not present
  if (!html.includes('id="modal-daily-reward"')) {
    const modalsHtml = `
    <!-- Modal 1: Hộp Quà Tân Gia (Ngày 1) -->
    <div id="modal-welcome-gift" class="game-modal-backdrop" style="display: none;">
      <div class="game-modal welcome-modal-box">
        <div class="modal-decor-sparkles">✨ 🎉 🏡 🎉 ✨</div>
        <h2 class="modal-title">CHÀO MỪNG ĐẾN VỚI NGÔI NHÀ SỨC KHỎE!</h2>
        <p class="modal-sub">Bạn vừa dọn vào căn biệt thự nghỉ dưỡng Thụy Sĩ. Để chào mừng bạn bắt đầu hành trình sống khỏe, ban quản trị trân trọng gửi tặng bạn <strong>Hộp Quà Tân Gia</strong> đặc biệt!</p>
        
        <div class="welcome-gift-card">
          <div class="gift-preview-img-wrap">
            <img src="assets/uploads/furniture/1794146054057_1qbf6w.png" alt="Bộ Sofa Thụy Sĩ" class="gift-preview-img">
          </div>
          <div class="gift-details">
            <span class="gift-room-tag">🏔️ Dành cho: Phòng Khách</span>
            <h3 class="gift-name">Bộ Ghế Sofa Thụy Sĩ Sang Trọng</h3>
            <p class="gift-desc">Bộ sofa nỉ êm ái cao cấp đặt tại trung tâm phòng khách, nơi bạn thư giãn ngắm tuyết trắng sau mỗi ngày rèn luyện sức khỏe.</p>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-claim-gift" onclick="claimWelcomeGift()">
            <span>🎁</span> Nhận & Đặt Vào Phòng Khách
          </button>
        </div>
      </div>
    </div>

    <!-- Modal 2: Hộp Quà Nhiệm Vụ Hàng Ngày (Pick 1 of 2 Choices) -->
    <div id="modal-daily-reward" class="game-modal-backdrop" style="display: none;">
      <div class="game-modal daily-modal-box">
        <button class="btn-close-modal" onclick="closeDailyRewardModal()">✕</button>
        <div class="modal-decor-sparkles">✨ 🏆 HOÀN THÀNH MỤC TIÊU SỨC KHỎE 🏆 ✨</div>
        <h2 class="modal-title">CHỌN PHẦN THƯỞNG HÔM NAY</h2>
        <p class="modal-sub">Chúc mừng bạn đã hoàn thành nhiệm vụ sức khỏe! Hôm nay bạn muốn chọn món quà nào để trang hoàng không gian nghỉ dưỡng?</p>
        
        <div class="reward-cards-container" id="reward-cards-container">
          <!-- Card A: Living Room Item -->
          <div class="reward-card card-living" id="card-choice-a">
            <div class="card-room-badge">🏔️ Phòng Khách</div>
            <div class="card-img-wrap">
              <img id="card-img-a" src="" alt="Quà A" class="card-img">
            </div>
            <h3 class="card-title" id="card-title-a">Tên món A</h3>
            <p class="card-desc" id="card-desc-a">Mô tả tác dụng của món đồ</p>
            <button class="btn-choose-reward" id="btn-choose-a" onclick="claimDailyReward('a')">
              <span>✨</span> Chọn Cho Phòng Khách
            </button>
          </div>

          <!-- Card B: Bedroom Item -->
          <div class="reward-card card-bedroom" id="card-choice-b">
            <div class="card-room-badge">🛏️ Phòng Ngủ</div>
            <div class="card-img-wrap">
              <img id="card-img-b" src="" alt="Quà B" class="card-img">
            </div>
            <h3 class="card-title" id="card-title-b">Tên món B</h3>
            <p class="card-desc" id="card-desc-b">Mô tả tác dụng của món đồ</p>
            <button class="btn-choose-reward" id="btn-choose-b" onclick="claimDailyReward('b')">
              <span>✨</span> Chọn Cho Phòng Ngủ
            </button>
          </div>
        </div>

        <div class="modal-footer-note">
          <span>💡 Mẹo: Món đồ bạn chưa chọn hôm nay vẫn được lưu trong kho quà để mở trong các ngày tiếp theo!</span>
        </div>
      </div>
    </div>
    `;

    html = html.replace('</body>', `${modalsHtml}\n</body>`);
  }

  fs.writeFileSync(path.join(baseDir, 'index.html'), html, 'utf8');
  console.log('index.html updated successfully.');
}

// =========================================================================
// 2. Update style.css
// =========================================================================
function updateStyleCss() {
  console.log('Updating style.css with Progression & Modal styles...');
  let css = fs.readFileSync(path.join(baseDir, 'style.css'), 'utf8');

  if (!css.includes('.auto-clock-badge')) {
    const extraCss = `
/* ========================================================
   Auto Real-time Clock & Day/Night Badge
======================================================== */
.auto-clock-badge {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: rgba(15, 23, 42, 0.85) !important;
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  border-radius: 6px !important;
  padding: 0 10px !important;
  height: 32px !important;
  font-size: 0.74rem !important;
  font-weight: 700 !important;
  color: #38bdf8 !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.clock-dot {
  color: #64748b !important;
}

#clock-status-tag {
  color: #fbbf24 !important;
}

/* ========================================================
   Player Switcher Dropdown
======================================================== */
.player-select-wrap {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: rgba(30, 41, 59, 0.85) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  border-radius: 6px !important;
  padding: 0 8px !important;
  height: 32px !important;
  flex-shrink: 0 !important;
}

.player-select-label {
  font-size: 0.74rem !important;
  font-weight: 700 !important;
  color: #94a3b8 !important;
  white-space: nowrap !important;
}

.player-select {
  background: transparent !important;
  color: #f8fafc !important;
  border: none !important;
  font-size: 0.76rem !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  outline: none !important;
}

.player-select option {
  background: #0f172a !important;
  color: #f8fafc !important;
}

/* ========================================================
   Gameplay Buttons (Welcome Gift, Daily Gift, Reset)
======================================================== */
.btn-welcome-gift {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: #ffffff !important;
  border: 1px solid #fbbf24 !important;
  border-radius: 6px !important;
  padding: 0 12px !important;
  height: 32px !important;
  font-size: 0.76rem !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.5) !important;
  animation: pulse-glow 2s infinite !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); transform: scale(1); }
  50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); transform: scale(1.02); }
}

.btn-daily-gift {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: linear-gradient(135deg, #0284c7, #0369a1) !important;
  color: #ffffff !important;
  border: 1px solid #38bdf8 !important;
  border-radius: 6px !important;
  padding: 0 12px !important;
  height: 32px !important;
  font-size: 0.76rem !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.35) !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  transition: all 0.2s ease !important;
}

.btn-daily-gift:hover {
  background: linear-gradient(135deg, #0369a1, #075985) !important;
  box-shadow: 0 0 18px rgba(56, 189, 248, 0.6) !important;
  transform: translateY(-1px);
}

.btn-reset-player {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: rgba(30, 41, 59, 0.8) !important;
  color: #94a3b8 !important;
  border: 1px solid rgba(148, 163, 184, 0.3) !important;
  border-radius: 6px !important;
  padding: 0 10px !important;
  height: 32px !important;
  font-size: 0.74rem !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.btn-reset-player:hover {
  color: #ef4444 !important;
  border-color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.1) !important;
}

.admin-tools-group {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
}

/* ========================================================
   Game Modals (Welcome Gift & Pick 1 of 2 Daily Reward)
======================================================== */
.game-modal-backdrop {
  position: fixed !important;
  inset: 0 !important;
  background: rgba(10, 15, 30, 0.85) !important;
  backdrop-filter: blur(10px) !important;
  z-index: 99999 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  animation: modal-fade-in 0.25s ease !important;
}

@keyframes modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.game-modal {
  background: linear-gradient(180deg, #1e293b, #0f172a) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  border-radius: 16px !important;
  padding: 30px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.2) !important;
  max-width: 720px !important;
  width: 90% !important;
  text-align: center !important;
  position: relative !important;
  animation: modal-pop-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

@keyframes modal-pop-up {
  from { transform: scale(0.9) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.btn-close-modal {
  position: absolute !important;
  top: 15px !important;
  right: 15px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: none !important;
  color: #94a3b8 !important;
  font-size: 1.1rem !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
}

.btn-close-modal:hover {
  background: rgba(239, 68, 68, 0.2) !important;
  color: #ef4444 !important;
}

.modal-decor-sparkles {
  font-size: 1.2rem !important;
  color: #fbbf24 !important;
  margin-bottom: 8px !important;
  letter-spacing: 2px !important;
}

.modal-title {
  color: #ffffff !important;
  font-size: 1.45rem !important;
  font-weight: 800 !important;
  margin: 0 0 10px 0 !important;
  background: linear-gradient(135deg, #ffffff, #93c5fd) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

.modal-sub {
  color: #94a3b8 !important;
  font-size: 0.88rem !important;
  line-height: 1.5 !important;
  margin: 0 0 25px 0 !important;
}

/* Welcome Gift Box Card */
.welcome-gift-card {
  background: rgba(15, 23, 42, 0.7) !important;
  border: 1px solid rgba(245, 158, 11, 0.3) !important;
  border-radius: 12px !important;
  padding: 20px !important;
  display: flex !important;
  align-items: center !important;
  gap: 20px !important;
  margin-bottom: 25px !important;
  text-align: left !important;
}

.gift-preview-img-wrap {
  width: 140px !important;
  height: 100px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 8px !important;
  flex-shrink: 0 !important;
  overflow: hidden !important;
}

.gift-preview-img {
  max-width: 90% !important;
  max-height: 90% !important;
  object-fit: contain !important;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5)) !important;
}

.gift-details {
  flex: 1 !important;
}

.gift-room-tag {
  display: inline-block !important;
  background: rgba(56, 189, 248, 0.15) !important;
  color: #38bdf8 !important;
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  padding: 2px 8px !important;
  border-radius: 4px !important;
  margin-bottom: 6px !important;
}

.gift-name {
  color: #ffffff !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  margin: 0 0 6px 0 !important;
}

.gift-desc {
  color: #94a3b8 !important;
  font-size: 0.82rem !important;
  line-height: 1.4 !important;
  margin: 0 !important;
}

.btn-claim-gift {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: #ffffff !important;
  border: 1px solid #34d399 !important;
  border-radius: 8px !important;
  padding: 12px 28px !important;
  font-size: 0.95rem !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4) !important;
  transition: all 0.2s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.btn-claim-gift:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.7) !important;
}

/* Reward Cards Container (Pick 1 of 2) */
.reward-cards-container {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 20px !important;
  margin-bottom: 20px !important;
}

.reward-card {
  background: rgba(15, 23, 42, 0.75) !important;
  border: 2px solid rgba(148, 163, 184, 0.2) !important;
  border-radius: 14px !important;
  padding: 20px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  transition: all 0.25s ease !important;
  position: relative !important;
}

.reward-card:hover {
  transform: translateY(-4px) !important;
}

.card-living {
  border-color: rgba(56, 189, 248, 0.3) !important;
}

.card-living:hover {
  border-color: #38bdf8 !important;
  box-shadow: 0 10px 30px -10px rgba(56, 189, 248, 0.4) !important;
}

.card-bedroom {
  border-color: rgba(168, 85, 247, 0.3) !important;
}

.card-bedroom:hover {
  border-color: #a855f7 !important;
  box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.4) !important;
}

.card-room-badge {
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  padding: 3px 10px !important;
  border-radius: 20px !important;
  margin-bottom: 12px !important;
}

.card-living .card-room-badge {
  background: rgba(56, 189, 248, 0.15) !important;
  color: #38bdf8 !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
}

.card-bedroom .card-room-badge {
  background: rgba(168, 85, 247, 0.15) !important;
  color: #c084fc !important;
  border: 1px solid rgba(168, 85, 247, 0.3) !important;
}

.card-img-wrap {
  width: 100% !important;
  height: 120px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: rgba(0, 0, 0, 0.25) !important;
  border-radius: 8px !important;
  margin-bottom: 14px !important;
  overflow: hidden !important;
}

.card-img {
  max-width: 85% !important;
  max-height: 85% !important;
  object-fit: contain !important;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) !important;
}

.card-title {
  color: #ffffff !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  margin: 0 0 8px 0 !important;
}

.card-desc {
  color: #94a3b8 !important;
  font-size: 0.78rem !important;
  line-height: 1.4 !important;
  margin: 0 0 16px 0 !important;
  flex: 1 !important;
}

.btn-choose-reward {
  width: 100% !important;
  padding: 10px !important;
  border-radius: 8px !important;
  font-size: 0.85rem !important;
  font-weight: 800 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  transition: all 0.2s ease !important;
  border: none !important;
}

.card-living .btn-choose-reward {
  background: linear-gradient(135deg, #0284c7, #0369a1) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4) !important;
}

.card-living .btn-choose-reward:hover {
  background: linear-gradient(135deg, #0369a1, #075985) !important;
  box-shadow: 0 6px 20px rgba(2, 132, 199, 0.6) !important;
}

.card-bedroom .btn-choose-reward {
  background: linear-gradient(135deg, #9333ea, #7e22ce) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(147, 51, 234, 0.4) !important;
}

.card-bedroom .btn-choose-reward:hover {
  background: linear-gradient(135deg, #7e22ce, #6b21a8) !important;
  box-shadow: 0 6px 20px rgba(147, 51, 234, 0.6) !important;
}

.modal-footer-note {
  color: #64748b !important;
  font-size: 0.76rem !important;
  margin-top: 10px !important;
}
`;
    css += extraCss;
    fs.writeFileSync(path.join(baseDir, 'style.css'), css, 'utf8');
    console.log('style.css updated successfully.');
  }
}

updateIndexHtml();
updateStyleCss();
console.log('HTML and CSS update complete.');
