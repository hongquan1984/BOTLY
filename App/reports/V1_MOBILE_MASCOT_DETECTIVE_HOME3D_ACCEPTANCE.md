# HealthClues Mobile — Cycle 95: Kiểm Thử 2 Vòng & Nghiệm Thu AI Vision Toàn Diện
## Mascot Guide, Unified Economy, Body Detective, 3D Chalet Shop & Humanoid Walking

**Ngày thực hiện:** 2026-11-14  
**Trạng thái:** IMPLEMENTED & VERIFIED ACROSS 2 RIGOROUS AUDIT ROUNDS (AI Vision + 0 Page Errors + Touch Ergonomics Pass).

---

### 1. Nguyên Tắc Thiết Kế Game Mobile & Tiêu Chuẩn Thẩm Định (Design Principles)

Quá trình nghiệm thu 2 vòng được thực hiện tự động và đối soát trực quan dựa trên 5 trụ cột chuẩn ngành game di động:
1. **Công Thái Học & Vùng Ngón Cái (Thumb Zone & Ergonomics):**
   - Vùng tương tác chính (Primary CTAs, Close Buttons, Navigation Pills) đạt kích thước tối thiểu khuyến nghị `44x44px` theo chuẩn Apple Human Interface Guidelines và Google Material Design.
   - Các nút quan trọng (`Tiếp tục`, `Nhận chìa khóa`, `Sắm đồ`, `Phá án`) nằm trong bán kính thao tác thuận tiện của ngón cái khi cầm máy 1 tay ở độ phân giải tiêu chuẩn `390×844`.
2. **Thị Giác, Màu Sắc & Tương Phản (Visual Hierarchy & Contrast):**
   - Tuân thủ phong cách Ghibli/Alpine ấm cúng, sang trọng và tươi sáng.
   - Tương phản văn bản đạt chuẩn WCAG AA trên nền ảnh thiên nhiên nhờ các lớp kính mờ chống chói (Dark Glassmorphism `rgba(4, 20, 30, 0.92)`).
   - Nút hành động nổi (`Phá Án` viền lam ngọc `#38bdf8`, `Mầm Nhỏ` viền ngọc lục bảo `#34d399`) có đổ bóng neon nhẹ, tách biệt hoàn toàn khỏi mặt nước và núi tuyết.
3. **Tâm Lý Học Hành Vi & Dòng Chảy Trải Nghiệm (Behavioral Psychology & Flow):**
   - **Tạo cảm giác gắn kết (Emotional Attachment):** Linh thú Mầm Nhỏ với chuyển động thở/phập phồng (`0.975 - 1.045`) và tiếng kêu cá heo ríu rít kích hoạt cảm xúc tích cực ngay lần chạm đầu.
   - **Động lực nội tại (Intrinsic Motivation):** Tặng ngay căn nhà 3D Chalet tráng lệ nhưng bên trong "trống trải", tạo động lực tự nhiên thôi thúc người chơi check-in thói quen và phá án để kiếm Xu sắm sửa nội thất.
   - **Không áp đặt thuật ngữ máy móc:** Xóa bỏ hoàn toàn từ ngữ "AI", đổi thành cách xưng hô thân mật *"Mình đã nhận được thông tin về vấn đề bạn đang quan tâm..."*.
4. **Cơ Chế Phản Hồi Ngay Lập Tức (Instant Positive Feedback):**
   - Mỗi tương tác phá án hoặc mua đồ đều phát âm thanh chúc mừng (Dolphin chirp/whistle/seal) kèm số dư Xu và EXP cập nhật tức thì trên thanh Top HUD.
5. **Độ Mượt & Sự Đơn Giản (Simplicity & Zero Friction):**
   - Không giấu tính năng trong menu phụ; `Phá Án` và `Mầm Nhỏ` luôn sẵn sàng 1-tap từ màn hình Thế Giới.
   - Sau khi phá án, có nút lớn `[NHẬN XU & ĐÓNG VĂN PHÒNG]` giúp quay lại làng ngay lập tức mà không phải tìm nút `X` nhỏ.

---

### 2. Chi Tiết Kiểm Thử 2 Vòng (2-Round Audit)

#### Vòng 1 (Round 1: Audit Hiện Trạng & Phát Hiện Điểm Cần Tối Ưu)
- **Kịch bản kiểm thử:** Chạy qua toàn bộ luồng Onboarding -> 5 bước hướng dẫn làng -> HUD Thế Giới -> Vụ án trinh thám -> Mua đồ nhà 3D -> Làng 3D.
- **Phân tích AI Vision Vòng 1:**
  1. *Lỗi Web Focus Outline:* Khi Mầm Nhỏ nhận focus trên Web, xuất hiện viền vuông trắng bao quanh linh vật tròn, phá vỡ tính thẩm mỹ mềm mại.
  2. *Độ tương phản nút HUD:* Nút `Phá Án` và `Mầm Nhỏ` có độ mờ nền cao (`0.22`), khi camera lia qua mặt nước sáng dễ bị giảm độ tương phản.
  3. *Vùng chạm nút đóng modal:* Nút `X` góc trên có kích thước `32x32px`, cần nới rộng lên chuẩn `44x44px` kèm `hitSlop`.
  4. *Dòng điều hướng sau khi phá án:* Người chơi phải bấm nút `X` nhỏ ở góc trên để đóng modal vụ án thay vì có nút CTA lớn ở chân modal.
  5. *Tên Làng 3D:* Thanh trạng thái góc dưới màn hình làng 3D vẫn còn chuỗi text "Làng Thụy Sỹ 3D".

#### Các Điểm Đã Sửa Đổi & Nâng Cấp Kỹ Thuật (Fixes & Polish)
1. **`MascotSprout.tsx`:** Bổ sung `outlineStyle: "none", outline: "none"` triệt tiêu hoàn toàn viền vuông focus của trình duyệt; chuyển viền thành vầng hào quang tròn mượt mà.
2. **`world.tsx`:** Nâng cấp 2 nút nổi `Phá Án` và `Mầm Nhỏ` lên nền đặc `rgba(4, 20, 30, 0.92)` với viền phát sáng cyan/emerald và bóng đổ, tăng độ tương phản rõ rệt trên mọi góc nhìn.
3. **`DetectiveMobileLauncher.tsx` & `HomeFurnitureShopModal.tsx`:**
   - Chuẩn hóa nút `closeBtn` đạt kích thước chính xác `44x44px` (`borderRadius: 22`) với `hitSlop: 8px`.
   - Thêm nút CTA lớn `[NHẬN XU & ĐÓNG VĂN PHÒNG]` ngay dưới thẻ kết luận vụ án thành công, giúp người chơi thoát nhanh bằng 1 chạm ngón cái.
4. **`village.ts`:** Thay thế triệt để chuỗi trạng thái thành `Làng Sống Khỏe 3D (Wellness Village)`.
5. **Build & Đồng Bộ:** `npm run build` cho Three.js và `npx expo export --platform web` đồng bộ sang `dist-web`.

#### Vòng 2 (Round 2: Nghiệm Thu AI Vision & Bằng Chứng Cuối Cùng)
- **Kịch bản kiểm thử:** Chạy lại trọn vẹn kịch bản với kiểm tra kích thước bounding box và bắt lỗi runtime (`pageerror`).
- **Kết quả đo lường (`r2_metrics.json`):**
  - Tổng số lỗi (`totalErrors`): **`0 lỗi`**.
  - Không có cảnh báo hay crash JavaScript nào xảy ra trên toàn bộ các màn hình.
  - Mọi nút bấm quan trọng đều đạt kích thước công thái học ngón cái.

---

### 3. Danh Mục Minh Chứng Hình Ảnh Nghiệm Thu (Round 2 Artifacts)

| Giai đoạn & Tính năng | Minh chứng hình ảnh AI Vision (Click để mở) |
| :--- | :--- |
| **1. Màn hình Chào mừng (Onboarding)** | [r2_01_onboarding_welcome.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_01_onboarding_welcome.png) |
| **1b. Chọn Hành trình khởi đầu** | [r2_01b_onboarding_quest_choice.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_01b_onboarding_quest_choice.png) |
| **2. Chào đón cùng Mầm Nhỏ** | [r2_02_onboarding_mascot_welcome.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_02_onboarding_mascot_welcome.png) |
| **2b. Tương tác Chạm Mầm Nhỏ & Tiếng Cá heo** | [r2_02b_onboarding_mascot_tapped.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_02b_onboarding_mascot_tapped.png) |
| **3. Khám phá & Chọn vấn đề quan tâm** | [r2_03_onboarding_discovery.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_03_onboarding_discovery.png) |
| **3b. Đã chọn mối quan tâm: Mất ngủ** | [r2_03b_concern_selected.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_03b_concern_selected.png) |
| **4. Bước 1: Gợi ý sức khỏe (Đã xóa viền vuông)** | [r2_04_tutorial_step1_health_recs.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_04_tutorial_step1_health_recs.png) |
| **5. Bước 2: Hướng dẫn Menu Hành Trình** | [r2_05_tutorial_step2_journey.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_05_tutorial_step2_journey.png) |
| **6. Bước 3: Hướng dẫn Nhiệm Vụ & Xu** | [r2_06_tutorial_step3_daily_care.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_06_tutorial_step3_daily_care.png) |
| **7. Bước 4: Hướng dẫn Căn Nhà Mới** | [r2_07_tutorial_step4_house_overview.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_07_tutorial_step4_house_overview.png) |
| **8. Bước 4: Modal Chìa Khóa Vàng Tặng Nhà** | [r2_08_tutorial_step4_house_key_modal.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_08_tutorial_step4_house_key_modal.png) |
| **9. Bước 5: Cốt truyện Làng Không Bác Sĩ** | [r2_09_tutorial_step5_detective_lore.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_09_tutorial_step5_detective_lore.png) |
| **10. HUD Thế Giới: Nút Nổi Tương Phản Cao** | [r2_10_world_hud_and_plaza.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_10_world_hud_and_plaza.png) |
| **11. Văn Phòng Hồ Sơ Thám Tử Cơ Thể** | [r2_11_detective_agency_modal.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_11_detective_agency_modal.png) |
| **12. Khám Nghiệm Hiện Trường & Manh Mối** | [r2_12_detective_investigation_scene.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_12_detective_investigation_scene.png) |
| **13. Phá Án Thành Công & Nút Thoát 1 Chạm** | [r2_13_detective_deduction_and_reward.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_13_detective_deduction_and_reward.png) |
| **14. Tab Ngôi Nhà: Sân Khấu 3D Chalet & Quà** | [r2_14_home_3d_chalet_view.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_14_home_3d_chalet_view.png) |
| **15. Chuyển Góc Nhìn Phòng Ngủ** | [r2_14b_home_3d_chalet_bedroom.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_14b_home_3d_chalet_bedroom.png) |
| **16. Cửa Hàng Nội Thất Bằng Xu (Nút X 44px)** | [r2_15_home_furniture_shop.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_15_home_furniture_shop.png) |
| **17. Nhân Vật 3D Người Thật Bước Đi Trong Làng** | [r2_17_humanoid_walking_village.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/round2_audit/r2_17_humanoid_walking_village.png) |

---

### 4. Nghiệm Thu Chi Tiết: Spotlight Tour Phát Sáng Menu, Linh Vật Mầm Nhỏ Đồng Bộ & Game Phá Án Webview (Cycle 97)

Quá trình kiểm thử tự động toàn diện bằng Playwright AI Vision (`run_mascot_detective_spotlight_audit.mjs`) đã xác thực trọn vẹn 18 bước trải nghiệm thực tế:

| Bước | Tính Năng & Trải Nghiệm Xác Thực | Minh Chứng AI Vision (Click để mở) |
| :--- | :--- | :--- |
| **1** | Màn hình khởi đầu với Linh vật Mầm Nhỏ đích thực (`healthclues-sprout-rabbit-laugh.png`), hiệu ứng phập phồng/thở và âm thanh cá heo | [01_onboarding_welcome_screen.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/01_onboarding_welcome_screen.png) |
| **2** | Chọn phân vùng hành trình (HealthClues Realm) | [02_onboarding_quest_choice.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/02_onboarding_quest_choice.png) |
| **3** | Mầm Nhỏ chào đón thân thiện, phản hồi xúc giác và tiếng cá heo khi chạm | [03_onboarding_mascot_welcome.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/03_onboarding_mascot_welcome.png) |
| **3b** | Tương tác chạm vào Mầm Nhỏ chuyển biểu cảm tươi cười và tiếng cười khúc khích | [03b_onboarding_mascot_tapped.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/03b_onboarding_mascot_tapped.png) |
| **4** | Chọn mối quan tâm sức khỏe (Mất ngủ, Giảm cân, v.v.) | [04_onboarding_discovery_step1.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/04_onboarding_discovery_step1.png) |
| **4b** | Xác nhận lựa chọn Mất ngủ, không dùng từ ngữ "AI" máy móc | [04b_onboarding_concern_selected.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/04b_onboarding_concern_selected.png) |
| **4c** | Thói quen & Yếu tố lối sống liên quan đến giấc ngủ | [04c_onboarding_discovery_step2.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/04c_onboarding_discovery_step2.png) |
| **5** | Bản kế hoạch khởi đầu được phân tích cá nhân hóa | [05_onboarding_plan_ready.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/05_onboarding_plan_ready.png) |
| **5b** | Mầm Nhỏ sẵn sàng đồng hành cùng người chơi vào Làng | [05b_onboarding_mascot_ready.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/05b_onboarding_mascot_ready.png) |
| **6** | **Bước 1 Tour:** Chào mừng vào Làng Sống Khỏe, tab **`Hành Trình` PHÁT SÁNG** viền vàng óng ánh với huy hiệu lấp lánh; Mầm Nhỏ thường trực ở góc dưới bên trái | [06_tour_step1_world_welcome_and_glowing_journey_tab.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/06_tour_step1_world_welcome_and_glowing_journey_tab.png) |
| **7** | Vị trí cố định của Linh vật Mầm Nhỏ ở góc dưới bên trái (`bottom: 74, left: 14`) | [07_permanent_mascot_helper_bottom_left.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/07_permanent_mascot_helper_bottom_left.png) |
| **8** | **Bước 2 Tour:** Chạm vào tab Hành Trình đang sáng -> Màn hình Hành Trình mở ra, Mầm Nhỏ hướng dẫn theo dõi mục tiêu & nút ➕ tạo thói quen; tab **`Nhiệm Vụ` PHÁT SÁNG** | [08_tour_step2_journey_screen_and_glowing_dailycare_tab.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/08_tour_step2_journey_screen_and_glowing_dailycare_tab.png) |
| **9** | **Bước 3 Tour:** Chạm vào tab Nhiệm Vụ đang sáng -> Hướng dẫn check-in 1 chạm nhận EXP và Xu; tab **`Ngôi Nhà` PHÁT SÁNG** | [09_tour_step3_daily_care_and_glowing_home_tab.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/09_tour_step3_daily_care_and_glowing_home_tab.png) |
| **10** | **Bước 4 Tour (Quà tặng):** Chạm vào Ngôi Nhà -> Hiệu ứng tặng Chìa Khóa Vàng mở khóa căn nhà 3D Chalet mới | [10_tour_step4_home_gift_celebration_golden_key.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/10_tour_step4_home_gift_celebration_golden_key.png) |
| **11** | **Bước 4 Tour (Cốt truyện):** Sân khấu 3D Chalet với người 3D thật bước đi; Mầm Nhỏ giải thích ngôi nhà trống cần kiếm Xu trang trí, và cốt truyện ngôi làng không có bác sĩ | [11_tour_step4_home_3d_chalet_and_detective_lore_card.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/11_tour_step4_home_3d_chalet_and_detective_lore_card.png) |
| **12** | **Bước 5 Tour:** Quay lại Thế Giới, nút nổi **`Phá Án` PHÁT SÁNG** viền vàng và hào quang nổi bật | [12_world_floating_pha_an_glowing_button.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/12_world_floating_pha_an_glowing_button.png) |
| **13** | **Tích hợp Webview `D:\botly\App\gametrinhtham`:** Mở modal toàn màn hình nhúng trực tiếp game phá án chạy trên cổng 3329 (`http://localhost:3329/detective`), thanh HUD trên cùng có nút `← Về Làng` và số dư `🪙 Xu` đồng bộ 2 chiều | [13_detective_webview_modal_verified.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/13_detective_webview_modal_verified.png) |
| **14** | Hoàn thành tour, quay về Làng Sống Khỏe êm thuận, nhận thưởng 50 Xu mở màn | [14_back_to_village_after_detective.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/14_back_to_village_after_detective.png) |
| **15** | Chạm vào icon Linh vật cố định góc dưới bên trái mở ngăn kéo trợ lý theo ngữ cảnh màn hình | [15_permanent_mascot_helper_drawer_open.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/15_permanent_mascot_helper_drawer_open.png) |
| **16** | Thư viện 6 vụ án y khoa thực thụ trong `D:\botly\App\gametrinhtham` | [16_detective_case_library_standalone.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/16_detective_case_library_standalone.png) |
| **17** | Hồ sơ bệnh án & lời trần tình nạn nhân Vụ 1 cùng điều tra viên Luna | [17_detective_case_001_luna_dossier.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/17_detective_case_001_luna_dossier.png) |
| **18** | Hiện trường phòng ngủ 2D với các điểm quét SVG và bảng suy luận y khoa trực quan | [18_detective_investigation_scene_bedroom.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/18_detective_investigation_scene_bedroom.png) |

---

---

### 6. Nghiệm Thu Chi Tiết: Màn Mờ Game Toàn Phần (Spotlight Scrim with Dimmed Backdrop), Khung Focus Phát Sáng & Vòng Đời Linh Vật Trợ Lý (Cycle 98)

Dựa trên phản hồi từ người dùng về hiện tượng cửa sổ hướng dẫn đè lên nhau, che mất danh sách thói quen và icon Mầm Nhỏ đè lên thẻ (`media_1794642739323_6dcc9a0a.png`), hệ thống đã được tái thiết kế toàn diện theo chuẩn UI/UX Game Mobile FTUE (First-Time User Experience):

1. **Khắc phục chồng đè (Zero Overlapping):**
   - Phủ màn mờ bối cảnh `rgba(3, 10, 8, 0.74)` lên toàn bộ màn hình, chỉ soi sáng đúng mục tiêu cần thao tác.
   - Thẻ thoại Mầm Nhỏ được thu gọn và bố trí khoa học bên trên hoặc bên dưới vùng focus, có mũi tên chỉ hướng (`▲` hoặc `▼`).
   - Linh vật ghim cố định góc dưới bên trái (`PermanentMascotHelper`) được ẩn hoàn toàn trong suốt quá trình hướng dẫn (`{!tourStep && <PermanentMascotHelper ... />}`), chỉ hiển thị khi đã hoàn tất hoặc bỏ qua tour.
   - Luôn có nút `Bỏ qua ✕` ở góc trên bên phải màn hình để người chơi thoát nhanh bằng 1 chạm bất kỳ lúc nào.

2. **Quy trình kiểm thử 12 bước Playwright AI Vision (`run_game_spotlight_tour_audit.mjs`):**

| Bước | Mô Tả Trải Nghiệm Xác Thực | Minh Chứng AI Vision (Click để mở) |
| :--- | :--- | :--- |
| **1** | Mờ thế giới, focus Tab `Hành Trình` viền vàng óng ánh, mũi tên `▼` trỏ xuống, Mầm Nhỏ chào mừng (không AI) | [spotlight_01_world_focus_journey.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_01_world_focus_journey.png) |
| **2** | Mở Hành Trình, mờ nền, focus cụm `Nhật Ký 7 Ngày` (streak & ngọc rune), mũi tên `▲` trỏ lên, danh sách thói quen không bị che | [spotlight_02_journey_track_7days.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_02_journey_track_7days.png) |
| **3** | Mờ nền, focus nút `+ Thêm Mới` với huy hiệu `TỰ LẬP MỤC TIÊU`, hướng dẫn tự tạo thói quen | [spotlight_03_journey_add_habit.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_03_journey_add_habit.png) |
| **4** | Focus Tab `Nhiệm Vụ` ở thanh điều hướng dưới cùng, mũi tên `▼` trỏ xuống | [spotlight_04_journey_focus_tab_daily.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_04_journey_focus_tab_daily.png) |
| **5** | Mở Nhiệm Vụ, mờ nền, focus dấu niêm phong check-in với huy hiệu `ĐÓNG DẤU NHẬN XU` | [spotlight_05_daily_checkin_seals.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_05_daily_checkin_seals.png) |
| **6** | Focus Tab `Ngôi Nhà` ở thanh điều hướng dưới cùng, mũi tên `▼` trỏ xuống | [spotlight_06_daily_focus_tab_home.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_06_daily_focus_tab_home.png) |
| **7** | Modal chúc mừng Chìa Khóa Vàng tặng Biệt Thự Gỗ Chalet 3D view hồ núi tuyết + 50 Xu tân thủ | [spotlight_07_home_gift_celebration.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_07_home_gift_celebration.png) |
| **8** | Sân khấu 3D Chalet trống trải, focus khung `BIỆT THỰ GỖ 3D CHALET`, Mầm Nhỏ giải thích động lực làm nhiệm vụ sắm nội thất | [spotlight_08_home_chalet_lore.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_08_home_chalet_lore.png) |
| **9** | Về Thế Giới, focus nút nổi `Phá Án` với huy hiệu `PHÁ ÁN KIẾM XU`, Mầm Nhỏ giải thích cốt truyện làng không có bác sĩ | [spotlight_09_world_focus_pha_an.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_09_world_focus_pha_an.png) |
| **10** | Mở trực tiếp Game Phá Án `D:\botly\App\gametrinhtham` qua WebView Modal toàn màn hình | [spotlight_10_detective_webview.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_10_detective_webview.png) |
| **11** | Bấm `← Về Làng` hoàn tất tour, cộng +50 Xu thưởng (tổng 150 Xu), linh vật ghim góc dưới bên trái xuất hiện sạch sẽ | [spotlight_11_tour_completed_permanent_mascot.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_11_tour_completed_permanent_mascot.png) |
| **12** | Chạm vào linh vật mở ngăn kéo trợ lý Mầm Nhỏ Đồng Hành với hướng dẫn ngữ cảnh & nút bật lại tour | [spotlight_12_helper_drawer_open.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_12_helper_drawer_open.png) |

- **Kết quả kiểm thử tự động:** `run_game_spotlight_tour_audit.mjs` đạt **100% PASS, 0 pageerror, exit code 0**.

---

### 8. Nghiệm Thu Chi Tiết: Cửa Sổ Khoét Sáng Trong Suốt 4 Lát Cắt (True 4-Slice Cutout Spotlight) & Tối Ưu Giao Diện Ngôi Nhà 3D Sạch Tuyệt Đối (Cycle 99)

Dựa trên phản hồi từ người dùng về việc cửa sổ hướng dẫn che mờ vùng thao tác (`media_1794645972370_c30d14f4.png`) và các menu trên màn hình Ngôi Nhà 3D bị chồng chéo lên nhau (`media_1794643006628_7a672c1f.jpg`), toàn bộ hệ thống đã được nâng cấp hoàn hảo theo chuẩn game di động cao cấp:

1. **Cơ Chế Cửa Sổ Khoét Sáng Trong Suốt (True 4-Slice Punch-Through Cutout):**
   - Thay thế toàn bộ lớp phủ đen phẳng bằng 4 lát cắt hình học (Top, Bottom, Left, Right).
   - Vùng mục tiêu (chuỗi 7 ngày, nút `+ Thêm Mới`, dấu niêm phong nhận xu, tab đáy) nằm trọn trong cửa sổ khoét thủng trong suốt 100%, giữ nguyên độ sáng và độ sắc nét nguyên bản mà không bị bất kỳ sắc tố đen nào che phủ.
   - Viền vàng óng ánh hổ phách (`#fbbf24`) với hiệu ứng breathing và huy hiệu định danh bao quanh chính xác vùng khoét sáng.
   - Thẻ thoại Mầm Nhỏ tự động chuyển vị trí: trỏ lên (`▲`) khi mục tiêu ở phía trên và trỏ xuống (`▼`) khi mục tiêu ở phía dưới, đảm bảo ZERO chồng chéo.
   - Nút `Bỏ qua ✕` đặt tại góc trên bên phải cho phép người chơi thoát tour bất cứ lúc nào.

2. **Khắc Phục Hoàn Toàn Xung Đột & Trùng Lặp Menu Ngôi Nhà 3D (Home Clean UI):**
   - **Triệt tiêu duplicate iframe HUD:** Tham số `hideHud=1` cùng CSS class `.hide-hud-mode` ẩn hoàn toàn các controls desktop của Three.js (`Làng 3D`, `Đặt đồ`, v.v.).
   - **Thanh điều khiển trên (Top Bar):** Đưa toàn bộ 5 nút (`Chalet 3D`, `Cửa: Mở/Đóng`, `Đèn: Bật/Tắt`, `Sắm Đồ (Xu)`, `2.5D`) vào horizontal `ScrollView`, chống tràn và chống ngắt dòng tuyệt đối trên mọi độ rộng màn hình.
   - **Thanh chọn phòng (Bottom Room Pills):** Nằm gọn gàng tại `bottom: 12` bên trong `Home3DStage` (ngay trên tab đáy 12px), 5 nút phòng hiển thị sắc nét với pill xanh ngọc `#34d399` active.
   - **Linh vật ghim cố định Mầm Nhỏ (`PermanentMascotHelper`):** Nhận diện ngữ cảnh Home và tự động nâng độ cao lên `bottom: 125, left: 14`, tạo ra khoảng cách thẳng đứng tách biệt an toàn **28.0px** phía trên `Phòng Khách` (Y: 698.5 so với 748.5). Cả hai cụm nút đều 100% hiển thị rõ ràng, không chạm nhau và bấm nhạy tuyệt đối.
   - **Camera Three.js mượt mà qua postMessage:** Chuyển phòng qua `CHALET_SET_VIEW` kích hoạt camera tweening trực tiếp mà không tải lại cảnh 3D.

3. **Bảng Minh Chứng Visual Snapshots (Cycle 99):**

| Ảnh Kiểm Thử | Nội Dung Xác Thực | Minh Chứng Visual (Click để mở) |
| :--- | :--- | :--- |
| **Spotlight 7 Ngày** | Cửa sổ khoét sáng 100% trong suốt chuỗi 7 ngày, card bóng khí ở dưới có mũi tên trỏ lên | [spotlight_v2_02_journey_track_7days.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_v2_02_journey_track_7days.png) |
| **Spotlight + Thêm Mới** | Cửa sổ khoét sáng nút `+ Thêm Mới` sáng rõ nguyên bản, card đặt ngay dưới trỏ lên | [spotlight_v2_03_journey_add_habit.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_v2_03_journey_add_habit.png) |
| **Spotlight Đóng Dấu** | Cửa sổ khoét sáng dấu niêm phong check-in nhận Xu | [spotlight_v2_05_daily_checkin_seals.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/spotlight_v2_05_daily_checkin_seals.png) |
| **Ngôi Nhà 3D Sạch Đẹp** | Sân khấu 3D Chalet: Top bar cuộn ngang không tràn, Room pills đáy, Mầm Nhỏ cách 28px bên trên không va chạm | [home_menu_perfect_01_stage.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/home_menu_perfect_01_stage.png) |
| **Chuyển Phòng 3D** | Chuyển góc nhìn camera sang Phòng Ngủ, Cửa: Đóng, Đèn: Tắt trơn tru | [home_menu_perfect_02_bedroom_switched.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/home_menu_perfect_02_bedroom_switched.png) |
| **Cửa Hàng Nội Thất** | Modal sắm nội thất bằng Xu mở đẹp, nút đóng aria-label nhạy | [home_menu_perfect_03_furniture_shop.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/home_menu_perfect_03_furniture_shop.png) |
| **Trợ Lý Mầm Nhỏ Home** | Mở ngăn kéo trợ lý Mầm Nhỏ Đồng Hành ngay trên màn hình Home sạch sẽ | [home_menu_perfect_04_mascot_drawer.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/home_menu_perfect_04_mascot_drawer.png) |

- **Kết quả kiểm thử tự động `verify_spotlight_and_home_perfect.mjs`:** Đạt **100% PASS, 0 page errors, exit code 0**.

---

### 9. Nghiệm Thu Tinh Gọn: Tích Hợp Header Thẻ Hướng Dẫn & Mũi Tên Động Theo Tọa Độ (Cycle 100)

Dựa trên yêu cầu hoàn thiện trải nghiệm thị giác và loại bỏ triệt để mọi thanh lơ lửng xung đột với thanh trạng thái đỉnh máy, hệ thống hướng dẫn tương tác (`InteractiveTourCard`) đã được tối ưu đạt cấp độ sản phẩm hoàn thiện cao cấp:

1. **Header Thẻ Tích Hợp (Integrated Dialogue Card Header):**
   - Loại bỏ hoàn toàn thanh `topHudRow` lơ lửng ở đỉnh màn hình (`paddingTop: 36`).
   - Huy hiệu đếm bước (`✨ BƯỚC 2/6 (a)`, `BƯỚC 5/6`, v.v.), tiêu đề bước và nút `Bỏ qua ✕` được đóng gói trực tiếp vào header của thẻ bóng khí (`dialogueHeader`).
   - Zero xung đột với `TopHud`, camera đục lỗ hay thanh công cụ trên đỉnh khi focus các nút như `Phá Án` hoặc `Sắm Đồ`.

2. **Mũi Tên Định Hướng Di Động Theo Tọa Độ Trục X Thực Tế (`arrowLeftPercent`):**
   - Mũi tên `▲` và `▼` tự động tính toán vị trí ngang khớp chính xác 100% với tâm điểm của phần tử mục tiêu (`punchRect.x + punchRect.width / 2`).
   - Mũi tên trỏ chuẩn xác vào nút `+ Thêm Mới` (dịch phải 80%), nút `Sắm Đồ` (dịch phải 80%), nút `Phá Án` (trung tâm 47%), và các tab đáy tương ứng.

3. **Bảng Minh Chứng Visual Toàn Diện (Cycle 100 - Real-Click Audit):**

| Bước | Mô Tả Trải Nghiệm Xác Thực | Minh Chứng Visual (Click để mở) |
| :--- | :--- | :--- |
| **01** | Chào mừng tại World, khoét sáng tab Hành Trình, nền thế giới mờ nhẹ | [perfect_01_world_welcome.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_01_world_welcome.png) |
| **02** | Focus Chuỗi 7 Ngày (100% trong suốt), mũi tên `▲` trỏ lên, thẻ bóng khí có header tích hợp | [perfect_02_streak_focused.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_02_streak_focused.png) |
| **03** | Focus nút `+ Thêm Mới` (100% trong suốt), mũi tên `▲` tự động dịch sang phải trỏ thẳng nút thêm thói quen | [perfect_03_add_button_focused.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_03_add_button_focused.png) |
| **04** | Focus tab `Nhiệm Vụ`, mũi tên `▼` trỏ xuống tab | [perfect_04_to_daily_focused.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_04_to_daily_focused.png) |
| **05** | Focus các dấu niêm phong check-in với huy hiệu `ĐÓNG DẤU NHẬN XU` sáng rõ | [perfect_05_daily_seal_focused.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_05_daily_seal_focused.png) |
| **06** | Focus tab `Ngôi Nhà`, thông báo tặng căn nhà mới | [perfect_06_to_home_focused.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_06_to_home_focused.png) |
| **07a**| Modal Chìa Khóa Vàng chúc mừng tặng Biệt Thự Gỗ Chalet 3D view hồ núi tuyết + 50 Xu tân thủ | [perfect_07a_house_gift_modal.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_07a_house_gift_modal.png) |
| **07b**| Cảnh nhà 3D hoàn chỉnh không trùng lặp nút, focus nút `Sắm Đồ`, bóng khí hướng dẫn kiếm Xu | [perfect_07b_home_chalet_lore.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_07b_home_chalet_lore.png) |
| **08** | Focus nút `Phá Án` ở toolbar World với huy hiệu `PHÁ ÁN KIẾM XU`, dẫn dắt cốt truyện làng không bác sĩ | [perfect_08_world_detective_focused.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_08_world_detective_focused.png) |
| **09** | Khởi động WebView Game Phá Án Next.js (port 3329) toàn màn hình | [perfect_09_detective_webview_opened.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_09_detective_webview_opened.png) |
| **10** | Trở về làng, linh vật Mầm Nhỏ ghim cố định góc dưới bên trái hoàn tất tour (+50 Xu) | [perfect_10_permanent_mascot_ready.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_10_permanent_mascot_ready.png) |
| **11** | Chạm Mầm Nhỏ mở ngăn kéo trợ lý đầy đủ tính năng & nút bật lại hướng dẫn bất cứ lúc nào | [perfect_11_assistant_drawer_opened.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/spotlight_mascot_audit/perfect_11_assistant_drawer_opened.png) |

---

### 10. Báo Cáo Nghiệm Thu Cycle 101 — Cân Bằng Màn Hình Khám Phá & Tích Hợp Người Thật Đi Bộ Sinh Động

1. **Khắc Phục Khoảng Trống Đáy Màn Hình Khám Phá (Discovery Screen 1 Void Elimination):**
   - **Thẻ Mầm Nhỏ (`size={92}`):** Khắc phục triệt để box Mầm Nhỏ bị teo nhỏ. Tăng avatar lên 92px, viền mint ngọc lục bảo `#a7f3d0`, tiêu đề `🌱 Mầm Nhỏ (Bạn Đồng Hành)` đậm nét, chữ 12.5px giãn dòng thoáng đãng, mang lại cảm giác thân thiện, gắn kết.
   - **Xóa bỏ 100% khoảng trống đen ở đáy màn hình:** Thẻ `parchmentCard` có `flexGrow: 1` và `minHeight: 520`, thẻ giấy da trải đều mượt mà ôm sát thanh nút cố định ở đáy (`innerScrollContentWithSticky: { flexGrow: 1 }`).
   - **Tối ưu công thái học các ô lựa chọn (`concernChipCard`):** Nút chọn tăng khoảng đệm dọc 13px, hộp kiểm `24x24px` bo góc mềm mại, nhãn chữ 13.5px và ô nhập ghi chú rộng rãi, thao tác ngón cái dễ dàng.

2. **Tích Hợp Nhân Vật Người Thật & Chu Kỳ Bước Đi Sinh Động (Realistic Human Adventurer Walk Cycle):**
   - **Thay thế hoàn toàn sprite chibi hoạt hình bằng nhân vật người thật:** Khắc phục yêu cầu của người dùng về nhân vật chibi tĩnh không chân tay di chuyển. Tận dụng bộ sprite chuẩn của HealthClues Adventurer với tỷ lệ người thật hoàn hảo (chiều cao 76px, boots da cao cổ, áo tunic thám hiểm, thắt lưng da, túi đeo chéo, áo choàng lam ngọc).
   - **Chu kỳ bước đi 4 khung hình (Animated 4-Frame Walk Cycle):** Khi người chơi di chuyển (`isMoving === true`), nhân vật chuyển động nhịp nhàng qua các khung hình:
     * Khung 1: Chân phải bước lên, tay trái vung về phía trước, túi chéo dịch chuyển.
     * Khung 2: Sải chân tối đa, gót giày tiếp đất vững chãi, vạt áo choàng tung bay theo gió.
     * Khung 3: Chân trái lướt tới, tay vung đối xứng tự nhiên.
     * Khi dừng lại (`!isMoving`): Trở về tư thế đứng thẳng, phong độ, hiên ngang.
   - **Đồng bộ hướng di chuyển & bóng tiếp đất:** Lật tỷ lệ `facingScaleAnim` (-1 / 1) tương ứng khi đi sang trái hoặc sang phải; bóng tiếp đất (`playerShadowOuter`) nằm chính xác dưới gót giày da.
   - **Đồng bộ cư dân trong làng (NPCs):** Anna trở thành Nhà Thực Vật Học (`human-botanist.webp`) với nón cói và giỏ thảo dược; Ben trở thành Kiện Tướng Thám Hiểm (`human-explorer.webp`) với gậy leo núi và balô dã ngoại; Leo trở thành Hiệp Sĩ Đồng Hành (`player-human-idle.png`); thú cưng Luna bay lơ lửng bên vai phải người chơi.

3. **Bảng Minh Chứng Visual Cycle 101:**

| Mục | Mô Tả Trải Nghiệm Xác Thực | Minh Chứng Visual (Click để mở) |
| :--- | :--- | :--- |
| **01** | Màn hình Khám phá thói quen (Bước 1): Box Mầm Nhỏ phóng to 92px, không còn khoảng trống đen ở đáy | [10_discovery_screen1_balanced_perfect.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/human_and_quiz_audit/10_discovery_screen1_balanced_perfect.png) |
| **02** | Thế Giới Làng Sống Khỏe: Nhân vật người thật (Bạn, Anna, Ben, Leo) đứng uy phong trên quảng trường | [11_world_realistic_characters_clean.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/human_and_quiz_audit/11_world_realistic_characters_clean.png) |
| **03** | Khung hình người thật đi bộ (Walk Frame 1): Chân tay vung bước, vạt áo choàng bay sinh động | [12_world_human_walking_frame1.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/human_and_quiz_audit/12_world_human_walking_frame1.png) |
| **04** | Khung hình người thật đi bộ (Walk Frame 2): Sải chân tiếp đất, bước đi thực tế trên nền đá | [13_world_human_walking_frame2.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/human_and_quiz_audit/13_world_human_walking_frame2.png) |
| **05** | Nhân vật dừng lại tiếp đất, tư thế hiên ngang cùng linh thú Luna bên vai phải | [14_world_human_arrived_clean.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/human_and_quiz_audit/14_world_human_arrived_clean.png) |

---

### 12. Báo Cáo Nghiệm Thu Cycle 102 — Làng Anpơ Chân Thật Sắc Nét (0 Cờ Quốc Gia), Tách Lớp 2.5D Parallax Hồ Núi, Nhân Vật 3D CGI & Chuẩn Hóa NPC

1. **Quảng Trường Làng Anpơ Chân Thật Sắc Nét (Photorealistic Alpine Village Square - ZERO Flags):**
   - **Tái hiện phong cách ảnh thật 8K:** Toàn bộ khung cảnh làng gỗ Chalet vùng núi Anpơ với kết cấu gỗ mộc lâu năm, mái ngói sẫm màu, giàn hoa phong lữ đỏ rực rủ từ ban công, nền quảng trường dorfplatz lát đá cuội tự nhiên, đài phun nước đá cổ kính và quán cà phê sân vườn.
   - **Tuyệt đối không có cờ quốc gia nào:** Toàn bộ các nóc nhà, cột buồm, lan can và ban công đã được kiểm tra kỹ lưỡng, bảo đảm 100% không mang bất kỳ lá cờ hay biểu trưng quốc gia nào.

2. **Tách Lớp 2.5D Parallax Sông Hồ & Núi Non Độc Lập (Separated 2.5D Parallax Diorama):**
   - **Tách ảnh thành 2 tầng không gian riêng biệt:**
     * Tầng phông nền xa (`swiss-village-lake-bg.webp`): Bầu trời, dãy núi tuyết hùng vĩ và mặt hồ ngọc bích trải rộng toàn bộ tầm nhìn.
     * Tầng tiền cảnh diorama (`swiss-village-mobile-diorama-v1.png`): Các ngôi nhà gỗ Chalet, giàn hoa, đài phun nước và nền đá dorfplatz với khoảng mở nhìn ra hồ được khoét trong suốt (alpha channel) viền mịn chống răng cưa.
   - **Hiệu ứng Parallax 2.5D sống động:** Khi nhân vật di chuyển hoặc cuộn camera, nền núi và hồ phía sau trượt nhẹ nhàng với tốc độ vi sai (`translateX: -cameraScroll.x * 0.22`, `translateY: -cameraScroll.y * 0.08`), tiền cảnh di chuyển tự nhiên với độ nghiêng không gian 11° (`perspective: 1200`), tạo cảm giác chiều sâu không gian 2.5D thực thụ.

3. **Nhân Vật 3D CGI Thể Khối & Chu Kỳ Bước Đi Tự Nhiên (Volumetric 3D Character Walk Cycle):**
   - **Tạo hình 3D CGI cao cấp:** Nhân vật hiệp sĩ thám hiểm được render 3D thể khối với tỷ lệ cơ thể trưởng thành chuẩn mực, áo tunic vải lanh có kết cấu vân dệt, áo choàng lam ngọc buông rủ với móc cài lá vàng, túi da đeo chéo, quần tối màu và ủng da cao cổ có phản xạ ánh sáng chân thực.
   - **Chu kỳ bước đi 4 khung hình sắc nét:** `player-human-idle.png`, `player-human-walk1.png`, `player-human-walk2.png`, `player-human-walk3.png` chuyển động nhịp nhàng chân tay khi chạm di chuyển trên quảng trường đá.

4. **Chuẩn Hóa Kích Thước & Tỷ Lệ Nhân Vật NPC Đồng Bộ (Harmonious NPC Sizing):**
   - **Khắc phục lỗi NPC bị lùn/bé:** Nâng cấp `styles.npcSprite` từ 44x52px lên 48x76px (bằng 100% chiều cao nhân vật người chơi).
   - **Đồng bộ remote player & khách tham quan:** `styles.remotePlayerSprite` và `remotePlayerActor` đạt kích thước chuẩn 48x76px.
   - **Căn chỉnh chân tiếp đất & bóng đổ:** Điểm neo chân NPC chạm đất chính xác tại `lm.y - 74`, bóng đổ kép (`groundShadowOuter` và `groundShadow`) nằm gọn dưới chân giày, loại bỏ tình trạng bóng bay lơ lửng.
   - **Cân bằng thang đo chiều sâu (`getWorldDepthScale`):** Giới hạn tỷ lệ thu nhỏ viễn cận từ 0.92x đến 1.08x, giúp các nhân vật dù ở xa bờ hồ hay ở gần đáy màn hình đều giữ được tỷ lệ hài hòa, không còn bị biến dạng tí hon.

5. **Bảng Minh Chứng Visual Cycle 102 (Playwright Verified):**

| Mục | Mô Tả Trải Nghiệm Xác Thực | Minh Chứng Visual (Click để mở) |
| :--- | :--- | :--- |
| **01** | Toàn cảnh làng Anpơ phong cách ảnh thật sắc nét (0 cờ quốc gia), lớp hồ núi 2.5D trong suốt phía sau, nhân vật 3D Bạn đứng hiên ngang, NPCs Anna & Ben cân đối | [01_world_photorealistic_scene.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/photorealistic_25d_audit/01_world_photorealistic_scene.png) |
| **02** | Bước đi khung hình 1: Chân vung bước trên quảng trường đá, áo choàng lam ngọc tung bay | [02_walk_step1.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/photorealistic_25d_audit/02_walk_step1.png) |
| **03** | Bước đi khung hình 2: Sải chân tiếp đất gót giày da chắc nịch, tỷ lệ cơ thể 3D chân thật | [03_walk_step2.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/photorealistic_25d_audit/03_walk_step2.png) |
| **04** | Bước đi khung hình 3: Đổi chân lướt tới nhịp nhàng, bóng tiếp đất trượt theo chân | [04_walk_step3.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/photorealistic_25d_audit/04_walk_step3.png) |
| **05** | Dừng chân tiếp đất vững chãi, trở về tư thế đứng thẳng phong độ bên cạnh linh thú Luna | [05_arrived_idle.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/photorealistic_25d_audit/05_arrived_idle.png) |
| **06** | Cuộn xoay camera: Hiệu ứng 2.5D Parallax trượt vi sai nền núi hồ phía sau, NPC Mia xuất hiện với chiều cao chuẩn mực 76px hài hòa | [06_parallax_panned.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/photorealistic_25d_audit/06_parallax_panned.png) |

---

### 13. Kết Quả Kiểm Tra Kỹ Thuật Tổng Thể Cycle 102
- `npx tsc --noEmit` (healthclues-mobile): **PASS 100% (0 errors)**.
- `npx expo export --platform web`: **PASS (4.37 MB bundle)**.
- Kiểm thử tự động E2E Playwright Cycle 102: **PASS 100% (6/6 captures, 0 errors)**.
- Nhất quán tài liệu dự án: `npm run docs:healthclues:check` **PASS 100%**.
