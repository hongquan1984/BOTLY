# HealthClues — Asset Manifest 09C

## Update — shared region scenery plates — 2026-10-30

| Asset/identity | Source path | Cách dùng | Provenance / trạng thái |
|---|---|---|---|
| Sleep Valley scene blueprint | `public/healthclues/assets/regions/sleep-valley-scene-blueprint.webp` (regenerated scenery plate, 16:9 class) | Scenic background for the 1600×900 logical Sleep Valley renderer; separate NPC/player/Pet and landmark overlays | AI-generated and edited to contain no people; owner review pending; prototype art, not production-approved |
| HealthClues Realm scene blueprint | `public/healthclues/assets/regions/healthclues-realm-scene-blueprint.webp` (regenerated scenery plate, 16:9 class) | Distinct sunlit botanical background on the shared route/anchor layout | AI-generated and edited to contain no people; owner review pending; prototype art, not production-approved |

The renderer preserves the same normalized world positions in both scenes. Visual and route evidence is recorded in `HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Earlier 09C inventory below is historical and superseded where it describes the former SVG backgrounds.

**Ngày kiểm kê:** 29-10-2026  
**Phạm vi:** asset được dùng trong current owner demo; không tạo hoặc tải hình mới ở milestone này.

| Asset/identity | Source path | Cách dùng | Provenance / trạng thái |
|---|---|---|---|
| Approved global Overworld | `public/healthclues/assets/world/healthclues-world-overworld.webp` (634,618 bytes); PNG source cạnh bên (3,776,652 bytes); `manifest.json` | Welcome/global World Map nền gốc | Asset manifest mô tả artwork project HealthClues; được giữ nguyên, không redraw |
| Adventurer poses | `public/healthclues/assets/characters/adventurer-poses.webp` (353,544 bytes); PNG source cạnh bên (1,648,700 bytes) | Nhân vật player ở component dùng sprite có sẵn | Reuse; không tạo character mới |
| Luna/Lumi | `src/features/healthclues/HealthCluesPet.tsx` | Pet hình SVG/React theo region; Luna cho Sleep, Lumi cho HealthClues | In-app vector/component implementation; không phải file sprite sheet painterly riêng |
| Sleep Valley map | `src/features/healthclues/RegionMapScene.tsx` (`RegionLandscape` config) | SVG landscape với moon, routes, hotspots/landmarks và overlays | Functional programmatic SVG; **chưa phải hand-painted production artwork** |
| HealthClues Realm map | `src/features/healthclues/RegionMapScene.tsx` (`RegionLandscape` config) | SVG landscape, stations, path, hotspots và overlays | Functional programmatic SVG; **chưa phải hand-painted production artwork** |
| Botanist/Explorer/Wellness Guide/Care Records Keeper | `src/features/healthclues/WellnessEncyclopediaStation.tsx`, `PrivateCarePlanPanel.tsx` | NPC role labels/icon and short educational/private records interaction | Không có NPC portrait/animation asset độc lập |
| UI icons | Lucide components đã có trong project dependencies | Station, map, safety, backpack and navigation icons | Không thêm package; theo license của dependency đã có |

## Chưa có / cần production art

- Hai background detailed region dạng hand-painted nhiều lớp, tách riêng, tối ưu WebP/AVIF.
- Luna/Lumi sprite pose sheets nhất quán (idle/talk/carry/celebrate) và portrait/pose cho ba station NPC + Records Keeper.
- Landmark illustration cụ thể cho observatory/library/garden/trails/sanctuary.
- Motion/ambient sprite/particle asset chưa được tạo.

Không có hình generated trong milestone này; không gắn nhãn placeholder là final. Không dùng Kenney, game-icons.net, stock art hoặc remote hotlinks. Xem [map renderer decision](HEALTHCLUES_MAP_TECHNOLOGY_RESEARCH.md) và [asset directory source](../../public/healthclues/assets/).

## Role-distinct character sprite update — 2026-10-30

| Role | Asset | Status |
|---|---|---|
| Player | `public/healthclues/assets/characters/player-blue-adventurer-idle-walk.webp` | Original transparent four-frame strip; browser walk/direction tested |
| Botanist | `public/healthclues/assets/regions/npc-botanist-distinct.webp` | Original transparent; shared identity in both regions |
| Trail Explorer | `public/healthclues/assets/regions/npc-trail-explorer-distinct.webp` | Original transparent; shared identity in both regions |
| Wellness Guide | `public/healthclues/assets/regions/npc-wellness-guide-distinct.webp` | Original transparent; shared identity in both regions |

All assets are separate scene objects, not scenery content or recolored clones. These generated owner-demo prototypes await owner art approval; no external stock source/license is claimed. See the final acceptance report for browser captures with names hidden.
