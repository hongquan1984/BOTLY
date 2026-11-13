# HealthClues — My Wellness Home V1
## Photorealistic Layered Scene & Fixed Slot Decoration System

Hệ thống kiến trúc "Ngôi Nhà Sức Khỏe Thụy Sĩ" (Dream Swiss Wellness Home) theo cơ chế **Layered Fixed Slot System** cho HealthClues. Người chơi nhận quà từ các mốc sống khỏe và bật/tắt vật phẩm trên các vị trí (slot) cố định đã được thẩm định kiến trúc, loại bỏ hoàn toàn kéo thả tự do trong V1.

---

## 🌐 Địa chỉ truy cập & Kiểm thử
- **URL Web Demo**: [http://localhost:3450](http://localhost:3450)
- **Thư mục source code**: `D:\botly\App\prototypes\wellness-home`
- **Khởi động nhanh**: Nhấp đúp `start.bat` hoặc chạy `node server.mjs`.

---

## 📁 Cấu trúc thư mục Feature V1

```text
D:\botly\App\prototypes\wellness-home\
├── assets\
│   ├── scenes\                               # 3 Cảnh nền chuẩn hóa 1672x941
│   │   ├── scene_overview.webp               # Scene A: Toàn cảnh căn nhà & núi hồ
│   │   ├── scene_garden.webp                 # Scene B: Khu vườn & Sân ngoài trời
│   │   └── scene_interior.webp               # Scene C: Phòng khách nhìn ra hồ
│   └── items\                                # 10 Vật phẩm PNG photorealistic tách nền
│       ├── flower_pot_01.png                 # Chậu hoa đất nung phong lữ (quà khởi đầu)
│       ├── wooden_bench_01.png               # Băng ghế gỗ sồi ngoài trời
│       ├── outdoor_chair_01.png              # Ghế bành gỗ ngoài hiên
│       ├── outdoor_table_01.png              # Bàn trà tròn gỗ sồi
│       ├── garden_lantern_01.png             # Đèn lồng sắt đen sân vườn
│       ├── watering_can_01.png               # Bình tưới cây kẽm vintage
│       ├── flower_pot_02.png                 # Chậu cây Monstera trong nhà
│       ├── rug_01.png                        # Thảm len dệt Bắc Âu
│       ├── armchair_01.png                   # Ghế bành bọc len Thụy Sĩ
│       └── table_lamp_01.png                 # Đèn bàn gốm vải linen
├── data\
│   ├── scene-manifest.json                   # Định nghĩa 3 scene chuẩn
│   ├── slot-manifest.json                    # Tọa độ, giới hạn loại đồ, z-index từng slot
│   ├── item-manifest.json                    # Metadata 10 vật phẩm, prompt & vision score
│   ├── inventory-state.json                  # Mô hình player state & slot mapping
│   └── pipeline-report.json                  # Báo cáo đánh giá AI Vision Review
├── pipeline\
│   ├── pipeline-engine.mjs                   # Engine tự động: Composite, Review, Retry
│   └── vision-evaluator.mjs                  # Bộ chấm điểm 6 tiêu chuẩn AI Vision
├── evidence\                                 # Ảnh bằng chứng chụp tự động từ Chromium
│   ├── 01-v1-garden-slots-active.png
│   ├── 02-v1-item-detail-modal-with-vision-score.png
│   ├── 03-v1-interior-slots.png
│   ├── 04-v1-before-after-split-compare.png
│   ├── 05-v1-pipeline-report-modal.png
│   └── 06-v1-mobile-view.png
├── index.html                                # Giao diện ứng dụng hoàn chỉnh
├── style.css                                 # Bố cục Swiss luxury, responsive & slider
├── app.js                                    # Bộ điều khiển trung tâm
├── server.mjs                                # HTTP server tĩnh port 3450
└── start.bat                                 # Batch script khởi động nhanh
```

---

## 🏛️ Triết lý Thiết kế V1 (Đã khóa)

1. **Không kéo thả tự do**:
   - Tránh tình trạng người chơi đặt lệch phối cảnh, đồ vật lơ lửng trên bãi cỏ hoặc đè lên cửa ra vào.
   - Mỗi cảnh chia sẵn các **Slot cố định** có tọa độ pixel chuẩn, góc nhìn, tỷ lệ `scale_min` / `scale_max` và `z-index` tính toán chính xác theo phối cảnh kiến trúc.
2. **Quy tắc 1 Slot = 1 Vật phẩm**:
   - Mỗi slot chỉ cho phép 1 vật phẩm hiển thị cùng lúc. Khi đặt đồ mới, vật phẩm cũ tự động trả về kho.
3. **Thẩm mỹ Photorealistic & Swiss Alpine**:
   - Vật liệu thật: gỗ sồi, gốm nung, vải len bouclé, kẽm, sắt đen.
   - Ánh sáng tự nhiên đồng bộ với nắng sớm dãy Alps, bóng tiếp xúc nền tự nhiên.
4. **Cơ chế Trước / Sau (Before / After)**:
   - Thanh trượt chia đôi màn hình cho phép người chơi so sánh trực quan khung cảnh trống nguyên bản với cảnh đã trang trí.

---

## 🤖 AI Asset Pipeline & 6 Tiêu chuẩn Vision Review

Pipeline tự động (`pipeline/pipeline-engine.mjs`) thực thi qua 5 bước:
1. **Chuẩn hóa Background**: Nạp 3 scene master (`scene_overview`, `scene_garden`, `scene_interior`).
2. **Tạo / Kiểm tra Asset**: Asset PNG nền trong suốt, tách lớp sạch, không có viền trắng.
3. **Composite vào Slot**: Gắn item vào slot dựa trên anchor point, base width và depth scale.
4. **Vision Review (6 Tiêu chí)**:
   - `perspective_fit`: Góc nhìn và độ nghiêng mặt đất.
   - `scale_fit`: Tỷ lệ kích thước so với cửa, thềm hiên và tỷ lệ người thật.
   - `lighting_fit`: Hướng sáng và nhiệt độ màu (nắng sớm vàng ấm).
   - `shadow_fit`: Bóng tiếp xúc mặt đất và bóng ambient occlusion.
   - `visual_harmony`: Độ thanh lịch, tĩnh tâm, không lòe loẹt, cảm giác nhà mơ ước.
   - `slot_fit`: Đúng vị trí, không chắn lối đi, không chắn view hồ.
5. **Đánh giá & Retry Policy**:
   - **>= 85 điểm**: `PASS` (Được duyệt đưa vào game).
   - **70 - 84 điểm**: `RETRY` (Tự động điều chỉnh scale và bóng đổ, tối đa 3 lần).
   - **< 70 điểm**: `FAIL` (Chuyển sang kiểm duyệt thủ công).

---

## 📊 Bảng phân loại tính năng (Implementation Breakdown)

| Thành phần | Trạng thái | Ghi chú kỹ thuật |
| :--- | :---: | :--- |
| **3 Cảnh nền chuẩn hóa** | `IMPLEMENTED` | File WebP 1672×941 tại `assets/scenes/` |
| **Hệ thống Slot cố định** | `IMPLEMENTED` | File `data/slot-manifest.json` (11 slots trên 3 scene) |
| **Catalog 10 Vật phẩm** | `IMPLEMENTED` | File `data/item-manifest.json` & ảnh PNG photorealistic tại `assets/items/` |
| **Player State & Bật/Tắt đồ** | `IMPLEMENTED` | Quản lý qua `localStorage`, lưu persistent, tự phục hồi sau F5 |
| **Thanh trượt Trước / Sau** | `IMPLEMENTED` | Split slider kéo thả tương tác mượt mà trên cả 3 scene |
| **Modal chi tiết & Vision Score** | `IMPLEMENTED` | Hiển thị 6 thanh đo tiêu chí review cho từng vật phẩm |
| **AI Pipeline Engine** | `IMPLEMENTED` | Chạy thực tế bằng script `pipeline/pipeline-engine.mjs`, xuất `pipeline-report.json` |
| **Slot Picker tương tác** | `IMPLEMENTED` | Bấm vào slot trống mở drawer lọc đồ tương thích |
| **Cơ chế Nhiệm vụ mở khóa** | `MOCK` | Điều kiện mở khóa đang ở dạng trường mô tả & nút "Nhận thử / Nhận hết" để test UI |
| **API Backend Supabase Sync** | `STUB` | Hiện tại lưu trữ qua `localStorage` phía client để giữ prototype chạy độc lập |
| **Vật phẩm phức tạp (Piano, Tủ lớn)** | `FUTURE WORK` | Thuộc giai đoạn V2 sử dụng inpainting scene-integrated |
