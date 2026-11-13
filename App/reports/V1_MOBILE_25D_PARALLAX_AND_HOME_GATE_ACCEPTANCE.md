# Báo Cáo Nghiệm Thu: HealthClues Mobile — Cổng Làng An Cư (Home Haven Gate) & Bản Đồ 2.5D Diorama Tách Lớp Parallax Núi Hồ

**Ngày nghiệm thu:** 2026-11-13  
**Môi trường:** HealthClues Mobile Expo Web (`http://127.0.0.1:8081` & `http://127.0.0.1:8081/iphone.html`)  
**Thiết bị kiểm thử:** Trình giả lập iPhone 15 Pro, viewport mobile thực tế (`393x852`, `deviceScaleFactor: 2`).  
**Trạng thái kiểm thử:** 100% PASS (`npx tsc --noEmit` PASS, `npx expo export` PASS, Playwright visual capture PASS).

---

## 1. Yêu Cầu Của Người Dùng & Giải Pháp Thực Hiện

1. **Chuyển đổi Cổng Lớn thành Cổng Home & Bản Đồ Khu Phố Cư Dân:**
   - *Yêu cầu:* "cổng này thì thay bằng kiểu Home, người chơi đi vào đây thì sẽ về nhà, sau này đi vào đấy thì hiển thị bản đồ kiểu nhà của các người chơi, dạng minh họa"
   - *Thực hiện:*
     - Đổi icon `Swords` chiến đấu thành icon `Home` màu vàng kim trên cả 2 vùng Sleep Valley và HealthClues Realm.
     - Đổi tên landmark thành **Cổng Làng An Cư (Home Haven Gate)** với phụ đề *"Lối về chốn bình yên & cộng đồng sống khỏe"*.
     - Khi người chơi đến gần hoặc chạm vào cổng:
       - Xuất hiện pill hành động nhanh: `Về Nhà 🏡` (đi thẳng tới `/(game)/home`) và `Khu Phố →` (mở Sheet Khu Phố Cư Dân).
       - Modal Sheet **Bản Đồ Khu Phố Các Cư Dân (Minh Họa)** trực quan:
         - **Tổ Ấm Của Bạn (Your Cozy Chalet):** Thẻ nổi bật dẫn vào trang thiết kế nội thất `/home`.
         - **Khu Nhà Các Cư Dân Khác:**
           - *Nhà Mai Anh (Streak 14 ngày, Vườn cúc La Mã)*
           - *Nhà Minh Tuấn (Streak 21 ngày, Góc thể thao 10k bước)*
           - *Biệt Thự Bác Sĩ Hoàng (Cố vấn sức khỏe cộng đồng)*
           - *Gác Xép Leo & Lucas (Đài thiên văn & thư viện)*
           - *Bungalow Anna & Lily (Khu thiền định & yoga)*
         - Nút hành động tương tác: *"Ghé Thăm & Gửi Tim ❤️ (+5 EXP)"* kích hoạt haptics và toast thông báo.

2. **Tách Riêng Background Núi Hồ Cho Map 2.5D & Phân Biệt Tuyệt Đối 2D vs 2.5D:**
   - *Yêu cầu:* "đúng ra map 2,5d thì background núi hồ phải tách riêng ra thành 1 ảnh, chứ tao thấy 2d và 2,5d đang ko khác gì nhau"
   - *Thực hiện:*
     - **Tách Layer Nền Riêng Biệt:** Tạo layer ảnh phong cảnh núi tuyết & hồ nước Alpine Panorama độc lập (`world-bg-mountains-lake.webp`, độ phân giải cao `2000x520px`).
     - **Parallax Cuộn Đa Tầng Thời Gian Thực:** Khi người chơi di chuyển hoặc cuộn bản đồ, layer núi hồ phía sau trôi êm theo hệ số parallax (`cameraScroll.x * 0.22`, `cameraScroll.y * 0.08`), tạo cảm giác dãy núi và mặt hồ nằm tít tắp ở đường chân trời.
     - **Mặt Đất Nghiêng Phối Cảnh 3D (3D Perspective Ground Tilt):**
       - Ở chế độ **✨ 2.5D**: Áp dụng `perspective: 950`, `rotateX: 18deg`, `scale: 1.05` trên mặt phẳng bản đồ làng xóm, mở rộng đường chân trời hướng về dãy núi.
       - Ở chế độ **🗺️ 2D**: Mặt đất quay về `rotateX: 0deg`, `scale: 1.0`, hiển thị bản đồ trực giao phẳng chuẩn mực.
     - **Dựng Thẳng Nhân Vật (Billboard Counter-Tilt):**
       - Khi mặt đất nghiêng 18°, các nhân vật (Người chơi `Bạn`, Linh thú `Lumi`, các cư dân `Lucas`, `Anna`, `Mia`, `Ben`, `Leo` và nhãn mốc) được đối trọng `rotateX: -18deg` để đứng thẳng vuông góc với mặt đất, kèm bóng đổ tiếp xúc hình oval mềm mại.
     - **Nút Chuyển Đổi Rõ Ràng:** Nút chuyển góc nhìn hiển thị rõ `✨ 2.5D` (nổi bật, ánh sáng vàng) hoặc `🗺️ 2D` kèm toast thông báo trạng thái tức thì.

---

## 2. Bằng Chứng Hình Ảnh Nghiệm Thu (Visual Evidence)

1. **`world-25d-parallax-mountain.png`:**
   - Chế độ 2.5D hoạt động với phối cảnh 3D diorama. Các nhân vật đứng thẳng (billboard) trên mặt cỏ với bóng đổ tiếp xúc.
2. **`world-2d-flat-ground.png`:**
   - Chế độ 2D phẳng trực giao, toast *"Đã chuyển về mặt phẳng 2D chuẩn"*, nút hiển thị `🗺️ 2D`.
3. **`world-home-gate-view.png`:**
   - Toàn cảnh đường mòn hướng về **Cổng Làng An Cư (Home)**. Các nhân vật dạo bước và phát biểu thoại y khoa thân thiện.
4. **`iphone-simulator-25d-horizon.png`:**
   - Trình giả lập iPhone 15 Pro (`http://localhost:8081/iphone.html`) tích hợp đầy đủ khung máy Dynamic Island và thanh điều hướng mượt mà.
