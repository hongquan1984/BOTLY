# Quyết định renderer Region Map — 09D-R

Ngày: 2026-10-29. Quyết định: **giữ renderer React/DOM/CSS hiện tại, chưa chuyển sang Phaser/PixiJS**.

## Căn cứ

Renderer cũ trong `src/features/healthclues/RegionMapScene.tsx` chỉ vẽ polygon SVG, tuyến dotted và icon tương tác; nó không có player motion, navigation hay follow camera đủ sức đáp ứng yêu cầu. Tuy nhiên, có thể mở rộng renderer hiện hữu mà không thay renderer global map: scene hiện có dùng một world coordinate space 1536×1024, DOM actors, `requestAnimationFrame`, graph walkable corridors/A*, một transform camera dùng chung cho nền và hit target, cùng panel nghiệp vụ React.

Lát cắt Sleep đã được chạy bằng Chromium: avatar đổi world coordinates liên tục, camera và Pet theo chuyển động, đi tới NPC rồi mới hiện Talk. Vì vậy hiện chưa có bằng chứng rằng engine riêng là cần thiết. Quyết định mặc định của dự án được giữ: **Existing renderer retained. No new map engine required.**

## Ma trận lựa chọn

| Lựa chọn | License | Tương thích/chi phí | Lợi ích | Rủi ro | Quyết định |
|---|---|---|---|---|---|
| Renderer React/DOM/CSS hiện có | Source nội bộ dự án | Không tăng bundle; tương thích Next app | Tái dùng UI/API, a11y và scene hooks | Tự duy trì camera/pathfinding; hiện chưa đo FPS | Chọn cho 09D-R |
| Phaser 4 | MIT (theo repository upstream) | Runtime/bundle và cầu nối React bổ sung | Scene, camera, input và animation game mạnh | Khởi tạo engine, asset lifecycle và overlay tích hợp phức tạp hơn | Chưa dùng; xem xét nếu renderer không đạt sau profiling |
| PixiJS | MIT (theo tài liệu/repository upstream) | Renderer WebGL/WebGPU/canvas riêng | Nhiều sprite/layer với rendering GPU | Tạo hệ scene/input thứ hai, bundle/tích hợp thêm | Chưa dùng |
| EasyStar.js | MIT (theo repository upstream) | Nhẹ, chỉ pathfinding | Hữu ích khi grid obstacle được tác giả rõ | Không giải quyết rendering/camera; graph hiện tại đủ cho lát cắt | Chưa dùng |

License upstream cần được xác minh lại trước khi thêm dependency; lần này không thêm package nào. Đây là đánh giá kỹ thuật theo phạm vi 09D-R, không phải benchmark tổng quát.

## Ranh giới kiến trúc

DOM scene chỉ chịu trách nhiệm trình bày vị trí/di chuyển/camera và kích hoạt landmark. Auth, persistence, Encyclopedia, Care Plan, Collection, Toolkit, Knowledge API và validation vẫn do React feature components/server hiện hữu xử lý. Không đưa business logic hay reward authority vào scene.

## Giới hạn và ngưỡng đánh giá lại

Pathfinding dựa vào corridors được định nghĩa theo vùng, chưa có collision polygons chi tiết trên mọi tảng đá/cây/nước. RAF chưa được profile hoặc đo frame rate; mobile pinch chỉ được kiểm tra ở Chromium mobile emulation. Nếu cần nhiều sprite đồng thời, animation nhiều frame, tile collision hoặc profile cho thấy DOM renderer không đáp ứng mục tiêu, lập benchmark scene nhỏ so sánh engine trước khi di trú.
