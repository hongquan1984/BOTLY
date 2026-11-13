# HealthClues — Nghiên cứu công nghệ bản đồ 09C

**Ngày:** 29-10-2026  
**Quyết định:** **Existing renderer retained. No new map engine required.**

## Kiến trúc hiện tại đã kiểm tra

- Global map và region map được render bằng SVG/DOM/React; hotspots là node React/SVG, tọa độ chuẩn hóa theo scene.
- Region scene áp một transform dùng chung cho nền SVG, đường đi và hotspot. Camera hỗ trợ pointer drag, wheel/zoom buttons, reset và phím mũi tên; hit targets vẫn nằm trong transform.
- HUD/dialogue/panels nằm ngoài camera layer để giữ thao tác khi pan/zoom.
- Browser test xác nhận zoom button thay transform và marker/landmark được click. Chưa benchmark FPS, pinch multi-touch trên thiết bị thật hoặc tải asset đo trong mạng chậm. Không tuyên bố 60 FPS.
- Chỉ thêm hành vi camera nhẹ trong renderer hiện có. Không thêm package, game engine hoặc bundle runtime.

## Ma trận lựa chọn

| Công nghệ | License/compatibility | Bundle/maintenance | Lợi ích | Rủi ro/fit | Quyết định |
|---|---|---|---|---|---|
| SVG + React/DOM hiện tại | Không thêm license/package; tương thích trực tiếp với React/Next App Router | Không tăng dependency; maintenance do project kiểm soát | Text/accessibility/hotspot DOM dễ tích hợp; map hiện tại hoạt động và được browser test | Camera gesture tùy biến; cần riêng QA pinch và bounds | **Giữ làm renderer hiện hành** |
| `react-zoom-pan-pinch` | MIT; React component cho DOM/SVG/HTML; repository có v4.2.0 phát hành 03-09-2026 và nêu keyboard navigation/pan utilities | Một package runtime; release activity hiện hành | Pan, pinch, wheel, controls và keyboard có sẵn | Cần benchmark transform/hotspots, interaction shielding, a11y và CSS stacking trước khi thay; chưa có bằng chứng current renderer không đủ | Không adopt ở 09C |
| Konva / `react-konva` | MIT; docs hiện hành hướng dẫn phiên bản wrapper theo major React, hỗ trợ React 19; browser-only canvas | Hai package (`konva`, `react-konva`); riêng scene graph cần maintenance | Hit testing, layers, shapes, drag, canvas renderer | Canvas làm accessibility/text/hotspot UI phức tạp hơn; không cần cho map point-and-click hiện có | Không adopt |
| PixiJS | MIT; WebGL/WebGPU 2D renderer | Engine/renderer và asset pipeline làm tăng đáng kể code/bundle/maintenance so với DOM/SVG; không benchmark trong project | Hiệu năng/layer/effects cho scene dày, sprite animation | Quá mức cần thiết cho các map hiện tại; thêm compatibility và fallback surface | Không adopt |
| Phaser | MIT framework | Framework lớn, game lifecycle/input/scene systems phải tích hợp song song | Hữu ích khi cần gameplay engine nhiều entity/physics/scene | Yêu cầu hiện tại là point-and-click RPG overlays; tạo engine thứ hai | Không adopt |
| Tiled | Editor GPL; một số thư viện đi kèm có license khác (ví dụ libtiled BSD 2-clause) | Editor/content pipeline riêng, runtime import cần quyết định | Hữu ích với tile maps/object layers/authoring lớn | Region maps hiện SVG scene config; chưa cần tilemap pipeline. Không dùng GPL editor/runtime assumption thay license từng thành phần | Không adopt |

## Kết luận đo đạc và điều kiện xem xét lại

Không có renderer migration và không thêm dependency. Browser đã xác nhận pointer-targeted hotspots và zoom control; đây không phải benchmark hiệu năng. Xem xét `react-zoom-pan-pinch` khi pinch multi-touch, camera bounds hoặc gesture conflict không thể triển khai/QA ổn định bằng renderer hiện tại. Chỉ xem xét canvas engine sau prototype đo bundle, keyboard/screen-reader fallback, desktop/mobile performance và hit-testing trên cùng hotspot data.

## Icon và asset licenses

- Dự án đã dùng icon package hiện có; không thêm icon package trong milestone này. Lucide upstream license ISC; một số Feather-derived icon có MIT notice riêng, nên giữ notices theo package. [Lucide license](https://github.com/lucide-icons/lucide/blob/main/LICENSE)
- Kenney Game Icons là CC0 theo trang asset; không tải hoặc sử dụng file nào trong milestone này. [Kenney asset license](https://kenney.nl/assets/game-icons), [Kenney FAQ](https://kenney.nl/support)
- Không lấy icon từ game-icons.net trong milestone này; chưa thêm bất kỳ attribution dependency nào.

## Nguồn chính thức

- [react-zoom-pan-pinch repository/license](https://github.com/BetterTyped/react-zoom-pan-pinch), [releases](https://github.com/BetterTyped/react-zoom-pan-pinch/releases)
- [Konva React docs](https://konvajs.org/docs/react/index.html)
- [PixiJS repository/package license](https://github.com/pixijs/pixijs/blob/dev/package.json)
- [Phaser license](https://phaser.io/download/license), [Phaser browser setup](https://docs.phaser.io/phaser/getting-started/set-up-dev-environment)
- [Tiled component licenses](https://github.com/mapeditor/tiled/blob/master/COPYING)
