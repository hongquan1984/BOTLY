# Asset và yêu cầu art Region Map — 09D-R

## Đã thêm trong source

| Asset | Đường dẫn | Mục đích / provenance |
|---|---|---|
| Sleep Valley environment | `public/healthclues/assets/regions/sleep-valley-handpainted.webp` | Background 1536×1024, được tạo/chỉnh bằng imagegen theo art direction Sleep Valley; không có text/UI/nhân vật động trong bản cuối. |
| HealthClues Realm environment | `public/healthclues/assets/regions/healthclues-realm-handpainted.webp` | Background riêng 1536×1024, fantasy garden/river/village, tạo bằng imagegen. |
| Botanist | `public/healthclues/assets/regions/npc-botanist.webp` | Sprite NPC nền trong suốt, imagegen. |
| Trail Explorer | `public/healthclues/assets/regions/npc-explorer.webp` | Sprite NPC nền trong suốt, imagegen. |
| Wellness Guide | `public/healthclues/assets/regions/npc-wellness-guide.webp` | Sprite NPC nền trong suốt, imagegen. |
| Adventurer walk cycle | `public/healthclues/assets/characters/adventurer-walk-cycle.webp` | Sprite strip 4 frame cùng visual identity hiện có, tạo từ asset tham chiếu hiện hữu bằng imagegen. Idle vẫn reuse `HealthCluesAdventurer`. |

Art tạo cho prototype trong repository, chưa có license bên ngoài hoặc human art review. Không dùng/hotlink stock artwork. Các NPC/đối tượng cố định trong map background là scenery; tương tác NPC sử dụng sprite foreground riêng. Sleep background cuối được chỉnh lại để xóa các nhân vật bị lặp sau visual QA.

## Pipeline hiện tại

- World coordinate space: 1536×1024; vị trí landmark và walk corridors tách khỏi ảnh.
- Layering: background image → vignette → landmark/NPC controls → Pet/player DOM actors → HUD/dialogue/panels.
- Sprite/hitbox không được bake vào map. Labels, names, dialogue và UI được render bằng React.
- Backgrounds được phục vụ local qua public assets, WebP; mỗi map hiện xấp xỉ 0.5MB.

## Cần thêm/duyệt trước khi gọi là art-complete

- Art director/human review về hai map, palette, scale/perspective, hotspot fit và mobile crops.
- Movement direction sprites đủ hướng; hiện walk cycle là một strip ngắn, chưa chứng minh đủ hướng/facing.
- Luna/Lumi animated sprites chất lượng production; hiện Pet reuse component/art hiện có, chưa có full directional animation.
- Collision masks/foreground depth props nếu chuyển sang map navigation chính xác hơn.
- Asset/license provenance review theo quy trình release của dự án.

Do các giới hạn này, asset/gameplay milestone được báo PARTIAL, dù Sleep vertical slice đã chạy trong browser.

## Character identity correction — 2026-10-30

Implemented four separate original transparent sprites: blue-cloaked player with satchel and four-frame idle/walk strip; broad-brimmed Botanist with basket/apron; athletic Trail Explorer with staff/compass; calm cream/lavender Wellness Guide with lantern. NPC identities are reused consistently across both regions. Each is a separately rendered world object with feet anchoring, ground shadow and idle treatment; NPC art is not baked into scenery and no recolored player clone is used. Assets are generated owner-demo prototypes, not human-approved final art; no external stock/license claim is made. Current map artwork/layout, coordinates and route are locked after this pass unless owner explicitly requests correction.
