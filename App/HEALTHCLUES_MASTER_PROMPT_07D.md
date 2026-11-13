# HEALTHCLUES — MASTER PROMPT 07D
# IMMERSIVE FULLSCREEN WORLD EXPERIENCE

## Mission

Continue the existing HealthClues RPG at `D:\botly`. Make the existing World Preview the primary fullscreen game scene. Do not rebuild gameplay, replace the approved World artwork, create a second map, deploy production, or change production data.

## Required experience

- Keep one existing interactive World renderer and its eight biomes, region coordinates, roads, markers, pan/zoom, hit testing, and map artwork.
- Remove the nested map card, duplicated shell backdrop artwork, separate companion column, and large below-map confirmation card.
- Use the available viewport below the compact game HUD. On mobile, account for the fixed game navigation and safe areas; prevent accidental document scrolling and horizontal overflow.
- Place the starting-Quest indicator, selected-region summary, read-only label, existing companion sprite/dialogue, map controls, and `START YOUR JOURNEY` as concise overlays over the map.
- Keep the selected starting Quest highlighted. Previewing another region must not replace that starting Quest.
- Keep guest preview read-only. No private World, XP, equipment, check-in, Journal, Boss, or Community writes are allowed before existing activation/eligibility rules.
- `START YOUR JOURNEY` opens the existing activation overlay over the same World. Preserve Auth, consent, Backpack, persistence, and returning-player behavior.
- Preserve accessible keyboard controls and reduced-motion handling. Do not add another rendering engine or new game features.

## Verification and handoff

Verify the actual isolated owner preview in Chromium at desktop 1440×960 and mobile 390×844. Exercise `/play` → Quest → no more than 10 Quiz questions → Reveal → World Preview. Assert a single fullscreen map, visible CTA without scrolling, region selection, pan, zoom, read-only state, and activation overlay. Capture and inspect actual screenshots from that same preview build.

Run focused lint and the existing isolated HealthClues game E2E. Update `App/reports/FULLSCREEN_WORLD_ACCEPTANCE.md`, the existing game-flow/visual reports, and V1 progress/test/release reports. Mark production readiness separately; real provider Auth and existing content/privacy/security gates remain outside this visual milestone.
