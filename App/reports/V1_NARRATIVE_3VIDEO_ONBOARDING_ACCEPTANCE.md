# BÁO CÁO NGHIỆM THU: MASTER NARRATIVE & 3-VIDEO ONBOARDING V1
**Dự án:** HealthClues Mobile (`d:\botly\App\healthclues-mobile`)  
**Ngày thực hiện:** 15/11/2026 — Cycle 111  
**Vai trò:** Senior Narrative Game Designer, Mobile Game UX Architect, React Native / Expo Developer  
**Trạng thái kiểm thử:** 100% PASS (Playwright Automated Test Suite, Dual-Mode Web/Native Engine, Zero-Break Poster Fallback)

---

## MỤC LỤC
1. [Narrative Bible: Cốt Truyện Chính Thức & Tuyến Nhân Vật](#1-narrative-bible)
2. [Bảng Đối Chiếu Thoại (Dialogue Audit Table)](#2-bảng-đối-chiếu-thoại)
3. [Storyboard 3 Phân Cảnh Video Mở Đầu](#3-storyboard-3-phân-cảnh-video-mở-đầu)
4. [Bảng Danh Sách Khóa Ngôn Ngữ Song Ngữ (i18n VI / EN)](#4-bảng-danh-sách-khóa-ngôn-ngữ)
5. [Lược Đồ Quản Lý Trạng Thái & Cơ Chế Lưu Trữ (Story State Persistence)](#5-lược-đồ-quản-lý-trạng-thái)
6. [Kiến Trúc UI Shell Trình Chiếu Video & Poster Fallback (`IntroStoryPlayer`)](#6-kiến-trúc-ui-shell)
7. [Danh Sách Các Tệp Tin Đã Tạo & Cập Nhật](#7-danh-sách-các-tệp-tin)
8. [Bằng Chứng Kiểm Thử Tự Động & Ảnh Chụp Màn Hình](#8-bằng-chứng-kiểm-thử-tự-động)
9. [Hướng Dẫn Tích Hợp File Video MP4 Thực Tế Của Owner](#9-hướng-dẫn-tích-hợp-video-mp4)
10. [Hạng Mục Đệ Trình Xin Ý Kiến Chủ Dự Án (Owner Approval)](#10-hạng-mục-đệ-trình-xin-ý-kiến)

---

## 1. NARRATIVE BIBLE

### 1.1. Cốt Truyện Chính Thức (Official Lore)
Một con người bình thường trong thế giới hiện đại vô tình bước qua một cánh cổng phát quang huyền ảo lơ lửng giữa những tầng mây trắng muốt, đặt chân tới **Xứ Sở Sức Khỏe — HealthClues Realm**.

Tại đây, người chơi gặp gỡ **Lumi** — một linh vật nhỏ bé có đôi tai dài, cánh phép thuật lấp lánh và khả năng trò chuyện. Lumi đã kiên nhẫn chờ đợi vị khách từ thế giới con người suốt nhiều năm tháng, bởi **Nhà Tiên Tri** từng tiên báo trước rằng một ngày kia cánh cổng kỳ bí giữa các thế giới sẽ mở ra và một người được chọn sẽ bước tới.

Nhà Tiên Tri giao cho Lumi sứ mệnh cao cả: đồng hành cùng người khách, dẫn lối họ khám phá những điều kỳ diệu về cơ thể, sức khỏe và thói quen sinh hoạt. Dù vậy, bản thân Lumi vẫn chưa rõ lý do vì sao chính người chơi lại là người xuất hiện — điều bí ẩn này sẽ dần được giải mã qua từng cột mốc của cuộc hành trình.

### 1.2. Sứ Mệnh Của Người Chơi
> **"Khám phá cơ thể — Chăm sóc bản thân — Giải mã những câu chuyện sức khỏe — Lan tỏa kiến thức hữu ích."**

Người chơi sẽ:
- Dạo bước trong **Xứ Sở Sức Khỏe**, tương tác với các công trình kiến trúc đặc trưng của ngôi làng nổi.
- Tìm hiểu các cơ chế khoa học về giấc ngủ, dinh dưỡng, vận động, giảm stress và nhịp sinh học thông qua trải nghiệm nhẹ nhàng, dễ hiểu.
- Tự thiết lập và duy trì các thói quen lành mạnh phù hợp với nhịp sống thực tế của chính mình.
- Tiếp nhận các "Hồ sơ bệnh án bí ẩn" tại Văn phòng Thám tử Luna, truy tìm manh mối hiện trường, suy luận nguyên nhân y khoa và giúp đỡ người bệnh.

### 1.3. Hệ Thống Nhân Vật & Phân Vai
| Nhân Vật | Vai Trò Trong Game | Vị Trí Xuất Hiện | Tính Cách & Giọng Điệu |
| :--- | :--- | :--- | :--- |
| **Lumi** | Linh vật đồng hành xuyên suốt (Companion Mascot) | Video mở đầu, Quiz, Nút trợ thủ thường trực, Trong làng 3D | Hồn nhiên, ấm áp, tận tâm, giàu tình cảm, luôn cổ vũ người chơi |
| **Nhà Tiên Tri** | Thực thể thông tuệ cổ xưa (Lore Figurehead) | Lời sấm truyền trong Video, Kicker định hướng nhiệm vụ | Trang nghiêm, huyền bí, thông tuệ, từ bi |
| **Người Chơi** | Nhân vật chính (The Traveler / Thám tử) | Mọi không gian (3D Avatar / Góc nhìn người chơi) | Học hỏi, rèn luyện, chủ động khám phá cơ thể |
| **NPC Chuyên Đề** | Chuyên gia y khoa / Hướng dẫn viên các công trình | Bên trong công trình (Thực vật học, Thư viện, Quán Trà, Thám tử) | Am hiểu chuyên môn, điềm đạm, ân cần, giải thích dễ hiểu |

---

## 2. BẢNG ĐỐI CHIẾU THOẠI (DIALOGUE AUDIT TABLE)

| Vị Trí / Bước | Giao Diện Trước Đây | Giao Diện Mới (Master Narrative) | Tác Dụng Tâm Lý / UX |
| :--- | :--- | :--- | :--- |
| **Bắt đầu Onboarding** | Nút bấm khô khan: `"Bắt đầu khảo sát"` | Nút bấm hành trình: `"Bắt Đầu Hành Trình"` $\rightarrow$ Chiếu chuỗi 3 video mở đầu | Đưa người chơi vào bối cảnh phiêu lưu nhập vai thay vì làm biểu mẫu hành chính |
| **Quest Choice (Chọn vùng)** | Tiêu đề kỹ thuật: `"CHỌN VÙNG KHÁM PHÁ"` | Kicker huyền bí: `✨ NHÀ TIÊN TRI CHỈ DẪN` / `"Nhà Tiên Tri tiên báo bạn nên bắt đầu hành trình từ đâu?"` | Gắn liền lựa chọn của người chơi với truyền thuyết của thế giới |
| **Discovery Step 1 (Vấn đề quan tâm)** | Câu hỏi khảo sát: `"Bạn quan tâm đến chủ đề sức khỏe nào nhất?"` | Lumi tâm sự: `"Trước khi bắt đầu hành trình, mình muốn biết điều gì khiến bạn quan tâm nhất lúc này?"` | Tạo cảm giác được lắng nghe, thấu cảm, không phán xét |
| **Discovery Step 2 (Thói quen & Yếu tố)** | Câu hỏi trắc nghiệm: `"Hãy chọn các yếu tố liên quan đến bạn"` | Lumi đồng hành: `"Mình hiểu rồi. Vậy hãy kể thêm một chút về cuộc sống hằng ngày của bạn nhé..."` | Trò chuyện tự nhiên như hai người bạn tâm giao |
| **Kết màn Onboarding** | Thông báo hoàn thành: `"Thiết lập hoàn tất. Vào thế giới"` | Lumi trao gửi sứ mệnh: `"Chúng ta đã sẵn sàng rồi! Hành trình khám phá cơ thể và Xứ Sở Sức Khỏe bắt đầu từ đây."` kèm nút `"Bước Vào Xứ Sở Sức Khỏe"` | Đỉnh điểm cảm xúc trước khi bước vào không gian 3D |
| **Menu Cá Nhân / Trợ Thủ** | Không có tùy chọn xem lại cốt truyện | Bổ sung mục: `"Xem lại cốt truyện mở đầu (3 cảnh)"` | Giúp người chơi hồi tưởng cốt truyện hoặc khoe bạn bè bất kỳ lúc nào |

---

## 3. STORYBOARD 3 PHÂN CẢNH VIDEO MỞ ĐẦU

### Phân Cảnh 1: Cánh Cổng Bí Ẩn (The Mystery Portal)
- **Tên cảnh:** `story.video1` — `"Cánh Cổng Bí Ẩn"`
- **Mục tiêu truyền thông:** Khơi gợi sự tò mò và cảm giác diệu kỳ khi bước vào thế giới mới.
- **Mô tả hình ảnh (Poster / Video):** Người lữ khách đứng trước cánh cổng ánh sáng phát quang huyền ảo giữa biển mây bồng bềnh, những luồng sáng lấp lánh phản chiếu trên nền trời xanh ngọc.
- **Âm thanh gợi ý:** Tiếng chuông gió ngân nga, gió thổi nhẹ qua tầng mây, âm nền violin / piano huyền ảo.
- **Người nói:** `✨ Lời dẫn`
- **Lời thoại tiếng Việt:** *"Một con người bình thường vô tình bước qua cánh cổng kỳ lạ... và lạc vào vùng đất lơ lửng giữa những tầng mây."*
- **Lời thoại tiếng Anh:** *"An ordinary human accidentally stepped through a mysterious portal... and found themselves adrift in a realm floating among the clouds."*
- **Thời lượng khuyến nghị:** 8 – 12 giây.

### Phân Cảnh 2: Người Bạn Đã Chờ Đợi (The Awaited Friend - Lumi)
- **Tên cảnh:** `story.video2` — `"Người Bạn Đã Chờ Đợi"`
- **Mục tiêu truyền thông:** Giới thiệu linh vật Lumi, xây dựng mối liên kết cảm xúc gắn bó giữa linh vật và người chơi.
- **Mô tả hình ảnh (Poster / Video):** Lumi — sinh vật măng tai dài dễ thương với đôi cánh phát quang lấp lánh — bay đến nở nụ cười rạng rỡ và vẫy tay chào đón nồng nhiệt.
- **Âm thanh gợi ý:** Tiếng sáo véo von trong trẻo, tiếng vỗ cánh phép thuật và tiếng cười vui mừng của Lumi.
- **Người nói:** `🌱 Lumi`
- **Lời thoại tiếng Việt:** *"Chào bạn! Mình là Lumi! Nhà Tiên Tri từng nói rằng một ngày nào đó cánh cổng sẽ mở ra và có một người khách xuất hiện... Mình đã chờ bạn rất lâu rồi!"*
- **Lời thoại tiếng Anh:** *"Hello there! I'm Lumi! The Seer foretold that one day the portal would open and a human guest would arrive... I have been waiting for you for so long!"*
- **Thời lượng khuyến nghị:** 10 – 14 giây.

### Phân Cảnh 3: Xứ Sở Sức Khỏe (The Cloud Floating Village)
- **Tên cảnh:** `story.video3` — `"Xứ Sở Sức Khỏe"`
- **Mục tiêu truyền thông:** Mở ra toàn cảnh ngôi làng nổi 3D, nêu rõ sứ mệnh và kêu gọi người chơi bắt đầu.
- **Mô tả hình ảnh (Poster / Video):** Góc máy flycam lướt trên ngôi làng nổi cổ tích giữa mây ngàn: guồng nước quay êm ả, suối nước trong veo, những mái nhà gỗ ấm cúng, rặng phong đỏ và giếng đá cổ tích.
- **Âm thanh gợi ý:** Nhạc nền hùng tráng nhưng êm dịu, tiếng suối chảy róc rách, tiếng guồng nước gõ nhịp.
- **Người nói:** `🌱 Lumi`
- **Lời thoại tiếng Việt:** *"Đây là Xứ Sở Sức Khỏe — nơi lưu giữ những bí mật về cơ thể con người. Sứ mệnh của chúng ta là cùng nhau khám phá, chăm sóc bản thân và giải mã những điều kỳ diệu!"*
- **Lời thoại tiếng Anh:** *"This is the HealthClues Realm — home to the wondrous secrets of the human body. Our quest is to explore together, care for ourselves, and decode everyday mysteries!"*
- **Thời lượng khuyến nghị:** 12 – 15 giây.

---

## 4. BẢNG DANH SÁCH KHÓA NGÔN NGỮ (i18n VI / EN)

Toàn bộ các khóa ngôn ngữ đã được cập nhật đồng bộ tại:
- `D:\botly\App\healthclues-mobile\src\localization\vi.ts`
- `D:\botly\App\healthclues-mobile\src\localization\en.ts`

```typescript
// Trích xuất cấu trúc khóa trong vi.ts & en.ts
story: {
  controls: {
    skip: "Bỏ qua câu chuyện",        // EN: "Skip Story"
    continue: "Tiếp tục",             // EN: "Continue"
    pause: "Tạm dừng",               // EN: "Pause"
    play: "Phát tiếp",                // EN: "Play"
    narratorBadge: "Lời dẫn",        // EN: "Narrator"
    lumiBadge: "Lumi",                // EN: "Lumi"
  },
  video1: {
    title: "Cánh Cổng Bí Ẩn",
    caption: "Một con người bình thường vô tình bước qua cánh cổng kỳ lạ...",
  },
  video2: {
    title: "Người Bạn Đã Chờ Đợi",
    caption: "Chào bạn! Mình là Lumi! Nhà Tiên Tri từng nói...",
  },
  video3: {
    title: "Xứ Sở Sức Khỏe",
    caption: "Đây là Xứ Sở Sức Khỏe — nơi lưu giữ những bí mật...",
  },
  replayButton: "Xem lại cốt truyện mở đầu",
  replayTitle: "Cốt Truyện Khởi Đầu",
  replaySubtitle: "3 Phim Mở Đầu Cùng Lumi",
},
quizNarrative: {
  questChoiceKicker: "NHÀ TIÊN TRI CHỈ DẪN",
  questChoicePrompt: "Nhà Tiên Tri tiên báo bạn nên bắt đầu hành trình từ đâu?",
  discoveryPrompt: "Trước khi bắt đầu hành trình, mình muốn biết điều gì khiến bạn quan tâm nhất lúc này?",
  discoveryFollowUp: "Mình hiểu rồi. Vậy hãy kể thêm một chút về cuộc sống hằng ngày của bạn nhé...",
  planIntro: "Dựa vào những gì bạn chia sẻ, Nhà Tiên Tri và mình đã chuẩn bị những gợi ý chăm sóc đầu tiên:",
  finaleTitle: "Chào Mừng Đến Xứ Sở Sức Khỏe!",
  finaleBody: "Chúng ta đã sẵn sàng rồi! Hành trình khám phá cơ thể và chăm sóc bản thân bắt đầu từ đây.",
  enterWorldBtn: "Bước Vào Xứ Sở Sức Khỏe",
}
```

---

## 5. LƯỢC ĐỒ QUẢN LÝ TRẠNG THÁI (STORY STATE PERSISTENCE)

Tệp quản lý trạng thái: `D:\botly\App\healthclues-mobile\src\modules\story\storyState.ts`  
Khóa lưu trữ AsyncStorage: `healthclues_story_state_v1`

### 5.1. Cấu Trúc Dữ Liệu (TypeScript Interface)
```typescript
export interface StoryIntroState {
  hasSeenIntro: boolean;         // true: Đã xem xong hoặc đã bấm bỏ qua
  lastSceneIndex: number;        // 0: Cảnh 1, 1: Cảnh 2, 2: Cảnh 3
  skipped: boolean;              // true nếu người chơi chọn bấm "Bỏ qua câu chuyện"
  completedAt: string | null;    // ISO timestamp khi hoàn thành
  watchCount: number;            // Số lần đã xem (tăng lên khi phát lại)
}
```

### 5.2. Các Phương Thức API
- `getStoryState()`: Trả về trạng thái hiện tại từ bộ nhớ đệm hoặc giá trị mặc định (`hasSeenIntro: false`).
- `saveStoryProgress(sceneIndex)`: Lưu lại phân cảnh hiện tại người chơi đang dừng chân.
- `markStoryCompleted()`: Đánh dấu đã hoàn thành toàn bộ 3 cảnh, cập nhật `hasSeenIntro = true`, tăng `watchCount`.
- `markStorySkipped()`: Đánh dấu người chơi chủ động bỏ qua, cập nhật `hasSeenIntro = true`, `skipped = true`.
- `resetStoryState()`: Reset trạng thái khi người chơi yêu cầu xem lại toàn bộ từ đầu.

---

## 6. KIẾN TRÚC UI SHELL TRÌNH CHIẾU VIDEO (`IntroStoryPlayer`)

Tệp nguồn: `D:\botly\App\healthclues-mobile\src\modules\story\IntroStoryPlayer.tsx`

### 6.1. Sơ Đồ Khối Kiến Trúc
```
┌─────────────────────────────────────────────────────────────┐
│                    IntroStoryPlayer.tsx                     │
├─────────────────────────────────────────────────────────────┤
│  Top Bar: [1/3 ─── 2/3 ─── 3/3]   [⏸ Tạm dừng]  [Bỏ qua ✕] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│       ┌─────────────────────────────────────────────┐       │
│       │           Video Viewport Frame              │       │
│       │  - Thẻ <video> (HTML5 Web / expo-av Mobile) │       │
│       │  - Tự động fallback: Ghibli Story Poster   │       │
│       │  - Khung viền ngọc bích phát sáng breathing │       │
│       └─────────────────────────────────────────────┘       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Narrative Card:                                            │
│  [ 🌱 Lumi / ✨ Lời dẫn ]                                   │
│  "Chào bạn! Mình là Lumi! Nhà Tiên Tri từng nói rằng..."    │
│                                                             │
│                                           [ Tiếp tục ➔ ]    │
└─────────────────────────────────────────────────────────────┘
```

### 6.2. Các Đặc Điểm Kỹ Thuật Đột Phá
1. **Tuyệt đối không cưỡng chế chuyển cảnh (Zero Auto-Advance):** Người chơi có toàn quyền đọc lời thoại ở nhịp độ của riêng mình. Chỉ khi chạm vào nút `"Tiếp tục →"`, cảnh kế tiếp mới được kích hoạt.
2. **Cơ chế Fallback hai tầng (Dual-Tier Resilience):**
   - Tầng 1: Tải file MP4 từ `assets/videos/`.
   - Tầng 2: Nếu file video chưa nạp hoặc xảy ra lỗi mạng, ngay lập tức hiển thị Poster mỹ thuật độ phân giải cao phong cách Ghibli (`assets/story/story_poster_*.jpg`). Không bao giờ xuất hiện màn hình đen, biểu tượng ảnh vỡ hay lỗi runtime.
3. **Độ ổn định tương tác cao (Ergonomic Click Target):** Nút `"Tiếp tục →"` được cố định trong khung layout chắc chắn, không bị rung lắc, đảm bảo phản hồi ngay lập tức khi bấm.

---

## 7. DANH SÁCH CÁC TỆP TIN ĐÃ TẠO & CẬP NHẬT

| Tệp Tin | Loại | Mô Tả Thay Đổi |
| :--- | :--- | :--- |
| `healthclues-mobile/src/modules/story/storyState.ts` | **MỚI** | Module quản lý trạng thái lưu trữ AsyncStorage `healthclues_story_state_v1` |
| `healthclues-mobile/src/modules/story/IntroStoryPlayer.tsx` | **MỚI** | UI Shell trình chiếu video 3 cảnh, poster fallback, thanh tiến trình & card lời thoại |
| `healthclues-mobile/assets/story/story_poster_1_portal.jpg` | **MỚI** | Poster phân cảnh 1: Cánh Cổng Bí Ẩn trên tầng mây |
| `healthclues-mobile/assets/story/story_poster_2_lumi.jpg` | **MỚI** | Poster phân cảnh 2: Lumi vẫy tay chào giữa bụi sao phép thuật |
| `healthclues-mobile/assets/story/story_poster_3_realm.jpg` | **MỚI** | Poster phân cảnh 3: Toàn cảnh Xứ Sở Sức Khỏe Làng Nổi 3D |
| `healthclues-mobile/app/(onboarding)/quiz.tsx` | **CẬP NHẬT** | Tích hợp chuyển tiếp Video $\rightarrow$ Quiz, gắn lời thoại Lumi vào từng bước, bản ngữ hóa song ngữ |
| `healthclues-mobile/src/localization/vi.ts` | **CẬP NHẬT** | Bổ sung toàn bộ khóa dịch tiếng Việt cho câu chuyện và lời thoại trắc nghiệm |
| `healthclues-mobile/src/localization/en.ts` | **CẬP NHẬT** | Bổ sung toàn bộ khóa dịch tiếng Anh cho câu chuyện và lời thoại trắc nghiệm |
| `healthclues-mobile/app/(game)/profile.tsx` | **CẬP NHẬT** | Bổ sung tùy chọn "Xem lại cốt truyện mở đầu" trong cài đặt |
| `healthclues-mobile/src/modules/mascot/PermanentMascotHelper.tsx` | **CẬP NHẬT** | Bổ sung lối tắt "Xem Lại Đoạn Phim Mở Đầu (3 Cảnh)" trong menu trợ thủ |
| `App/CURRENT_STATE.md`, `MASTER_SPEC.md`, `UI_UX_SPEC.md`, `USER_FLOWS.md`, `BUSINESS_RULES.md`, `USE_CASES.md` | **CẬP NHẬT** | Đồng bộ toàn bộ tài liệu kỹ thuật chuẩn theo quy định |

---

## 8. BẰNG CHỨNG KIỂM THỬ TỰ ĐỘNG & ẢNH CHỤP MÀN HÌNH

Hệ thống đã trải qua kịch bản kiểm thử tự động toàn trình bằng Playwright (`test_narrative_onboarding.mjs`):
1. Khởi động màn hình Welcome $\rightarrow$ Kiểm tra chuyển đổi ngôn ngữ VI / EN.
2. Bấm "Bắt Đầu Hành Trình" $\rightarrow$ Kiểm tra mở Cảnh 1: Cánh Cổng Bí Ẩn.
3. Bấm "Tiếp tục" $\rightarrow$ Chuyển tiếp sang Cảnh 2: Người Bạn Đã Chờ Đợi (Lumi).
4. Bấm "Tiếp tục" $\rightarrow$ Chuyển tiếp sang Cảnh 3: Xứ Sở Sức Khỏe.
5. Bấm "Tiếp tục" $\rightarrow$ Chuyển tiếp vào Quest Choice với lời dẫn Nhà Tiên Tri.
6. Chạm chọn vùng $\rightarrow$ Lời thoại Lumi dẫn dắt khảo sát thói quen.
7. Chạm "AI Phân Tích & Gợi Ý" $\rightarrow$ Nhận thói quen gợi ý và hiển thị màn kết "Chào Mừng Đến Xứ Sở Sức Khỏe".
8. Bấm "Bước Vào Xứ Sở Sức Khỏe" $\rightarrow$ Vào trực tiếp Làng Nổi 3D.

### Bảng Lưu Vết Ảnh Chụp Màn Hình (Artifacts)
- **`real_video_01_welcome.png`**: Màn hình Chào mừng (Welcome) tích hợp chọn song ngữ VI/EN.
- **`real_video_02_scene1.png`**: Video 1 thực tế (`1.mp4`, 1920x1080) phát mượt mà — Cánh Cổng Bí Ẩn xoay chuyển ánh sáng phát quang huyền ảo giữa rừng sâu, phụ đề Lời dẫn.
- **`real_video_03_scene2.png`**: Video 2 thực tế (`2.mp4`, 1920x1080) phát mượt mà — Chú thỏ măng Lumi cười rạng rỡ chào đón trước lâu đài và đảo nổi.
- **`real_video_04_scene3.png`**: Video 3 thực tế (`3.mp4`, 1920x1080) phát mượt mà — Toàn cảnh Xứ Sở Sức Khỏe Làng Mây bồng bềnh và sứ mệnh rèn luyện.
- **`real_video_05_quest_choice.png`**: Chuyển tiếp mượt sang chọn nhiệm vụ Nhà Tiên Tri chỉ dẫn sau khi kết thúc Video 3.
- **`narrative_06_mascot_welcome.png`**: Lời chào thân tình của Lumi trước khi bước vào câu hỏi.
- **`narrative_07_discovery.png` & `07b`**: Khảo sát thói quen dưới dạng buổi trò chuyện tâm sự cùng Lumi.
- **`narrative_08_finale.png`**: Màn hình kết thúc Onboarding với nút *"Bước Vào Xứ Sở Sức Khỏe"*.
- **`narrative_09_world_entered.png`**: Bước chân trực tiếp vào Làng Nổi 3D, kết nối hoàn hảo mạch truyện.

---

## 9. KẾT QUẢ TÍCH HỢP 3 VIDEO MP4 GỐC TỪ THƯ MỤC `D:\botly\App\video`

Toàn bộ 3 tệp video MP4 chất lượng cao từ thư mục `D:\botly\App\video` đã được tích hợp hoàn tất vào hệ thống:
1. **Video 1 (`D:\botly\App\video\1.mp4` — 6.0 MB):**
   - Độ phân giải: 1920x1080 Full HD (H.264), âm thanh AAC Stereo 48kHz, thời lượng ~3.92 giây.
   - Nội dung: Cánh cổng mây phát quang huyền ảo giữa rừng rậm với lá bay và bụi sao lung linh.
2. **Video 2 (`D:\botly\App\video\2.mp4` — 4.88 MB):**
   - Độ phân giải: 1920x1080 Full HD (H.264), âm thanh AAC Stereo 48kHz, thời lượng ~10.0 giây.
   - Nội dung: Lumi măng tai dài đôi mắt xanh ngọc hiền hòa, mỉm cười chào đón nồng nhiệt trước lâu đài mây.
3. **Video 3 (`D:\botly\App\video\3.mp4` — 6.5 MB):**
   - Độ phân giải: 1920x1080 Full HD (H.264), âm thanh AAC Stereo 48kHz, thời lượng ~10.0 giây.
   - Nội dung: Lumi bay lượn trên cao ngắm toàn cảnh Xứ Sở Sức Khỏe giữa biển mây, thác nước và suối trong.

### Nâng cấp kỹ thuật hỗ trợ phát video:
- **Chuẩn HTTP 206 Partial Content (`serve_dist_8081.mjs`):** Máy chủ phục vụ hỗ trợ đầy đủ tiêu đề `Range` (`bytes=start-end`), cho phép trình duyệt di động tua và streaming mượt mà không bị giật lag.
- **Tính năng UI:** Bổ sung nút Bật/Tắt âm thanh (`[ 🔊 ]` / `[ 🔇 ]`) và nút Phát/Dừng (`[ || ]` / `[ ▶ ]`). Video tự động lặp nhẹ (`loop={true}`) khi người chơi đọc lời thoại, và chuyển cảnh mượt mà khi người chơi bấm nút `"Tiếp tục →"`.

---

## 10. HẠNG MỤC ĐỆ TRÌNH XIN Ý KIẾN CHỦ DỰ ÁN (OWNER APPROVAL)

1. **Chất lượng hiển thị video:** Owner xem qua các ảnh chụp thực tế màn hình (`real_video_02_scene1.png`, `real_video_03_scene2.png`, `real_video_04_scene3.png`) để đánh giá độ sắc nét và sự hài hòa của khung giao diện.
2. **Âm thanh video:** Cả 3 video đều có nhạc nền sẵn; hệ thống đã trang bị nút chuyển đổi âm thanh `[ 🔊 ]` để người chơi tùy chỉnh.
3. **Mạch chuyển tiếp:** Xác nhận quy trình chuyển tiếp mượt mà từ Video 3 sang câu hỏi trắc nghiệm đồng hành cùng Lumi.

---

## 11. BÁO CÁO NGHIỆM THU CYCLE 113: BỐ CỤC VIDEO RESPONSIVE KHÔNG ĐÈ TEXT, BỎ THUNG LŨNG GIẤC NGỦ & MẶC ĐỊNH HEALTHCLUES

**Ngày thực hiện:** 15/11/2026 — Cycle 113  
**Trạng thái kiểm thử:** 100% PASS (Playwright Automated Test Suite trên Port 8081).

### 11.1. Yêu cầu của Chủ dự án (Owner Directives)
1. **Khởi động ngay:** Bấm "Bắt Đầu Hành Trình" trên màn hình Welcome là vào video ngay lập tức với độ trễ 0ms.
2. **Bố cục Responsive:**
   - **Màn hình dọc (Điện thoại Portrait):** Video cố định chiều ngang (`width: 100%`), tự do chiều dọc theo tỷ lệ chuẩn (`aspectRatio: 16 / 9`). Bên dưới video là thẻ văn bản hội thoại nằm riêng biệt, tuyệt đối không đè lên video. Chứa vùng cuộn ScrollView tránh cắt chữ.
   - **Màn hình ngang (Landscape) hoặc máy tính:** Video mở rộng toàn cảnh (cinematic full view), thẻ văn bản là overlay gọn gàng ở đáy màn hình.
3. **Mặc định HealthClues Realm, bỏ Thung Lũng Giấc Ngủ:**
   - Trong Onboarding (`quiz.tsx`): Bỏ bước chọn vùng `quest_choice`. Hoàn thành hoặc bỏ qua 3 video vào thẳng `discovery` của HealthClues.
   - Thanh tiến trình: Rút gọn còn 2 bước (`1. Khám phá` → `2. Kế hoạch`).
   - Màn hình Thế Giới (`world.tsx`): Bỏ nút `[ 🌙 Thung Lũng ]` trên thanh công cụ trên cùng. Mặc định `activeRegion = "healthclues-realm"`.
   - Bỏ thanh dock trùng lặp "Vườn Thảo Mộc / Thư Giãn Mây / Hành Trình" dưới chân 3D trong `PlayerApp.tsx`.

### 11.2. Danh sách bằng chứng kiểm thử tự động Playwright (Screenshots)
- **`test_01_welcome.png`**: Màn hình Welcome khởi đầu chào mừng.
- **`test_02_video1_portrait.png`**: Video 1 ở chế độ dọc (390x844), video 16:9 ở trên, thẻ hội thoại ở dưới riêng biệt, không đè lấn.
- **`test_03_video1_landscape.png`**: Video 1 ở chế độ ngang (844x390), video mở rộng toàn cảnh, thẻ hội thoại overlay dưới đáy.
- **`test_04_video2_portrait.png`**: Video 2 Lumi chào đón, bố cục dọc tách biệt.
- **`test_05_video3_portrait.png`**: Video 3 Xứ Sở Sức Khỏe, bố cục dọc tách biệt.
- **`test_06_discovery_healthclues.png`**: Màn hình Khám phá HealthClues với thanh tiến trình 2 bước chuẩn (`1. Khám phá`, `2. Kế hoạch`), không còn Thung Lũng Giấc Ngủ.
- **`test_07_plan_builder.png`**: Màn hình Sẵn Sàng Lên Đường với nút "Bước Vào Xứ Sở Sức Khỏe".
- **`test_08_world_clean.png`**: Màn hình World 3D sạch sẽ, không còn nút Thung Lũng, không còn thanh dock trùng lặp dưới chân.
- **`test_09_detective_modal.png`**: Game Phá Án (Văn Phòng Thám Tử Luna) tải 100% không lỗi icon gãy.
- **`test_10_chalet_home.png`**: Ngôi nhà Chalet 3D tải 100% đầy đủ nội thất và cảnh quan hồ nước Thụy Sĩ.
