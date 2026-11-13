# HealthClues — Master Prompt 08 Final V2 (owner correction included)

## Product direction

Continue the existing HealthClues app inside Botly. Do not rebuild the game, replace its database, artwork, map or gameplay APIs. Consumer-facing text remains English; implementation reports remain Vietnamese.

The global Overworld must preserve all eight existing regions and IDs. Only **Sleep Valley** and **HealthClues Realm** are playable detailed-map destinations in this release. Calm Forest, Energy Hills, Nutrition Garden, Movement Peaks, Balance Meadow and Natural Living Forest remain visible as **COMING SOON**, cannot start a journey, and retain database compatibility for later releases.

## Player journey

The intended experience is a safe, persistent, owner-playable RPG: `/play` → one of Sleep or Health → no more than ten initial adaptive Quiz questions, including eligibility when asked → short Reveal → read-only World Preview → email verification and explicit consent → in-game Backpack (zero to three reviewed tools, optional) → one persistent authenticated World. Returning players resume their saved World. Health Quiz concern/goal is self-reported context, never a diagnosis, and must drive the active Journey without asking the same concern again.

Sleep opens Sleep Valley with Luna. Health opens HealthClues Realm with Lumi and the selected Quiz topic. Toolkit/Collection, Daily Companion, reviewed Knowledge and educational Quick Quiz, mini-games, optional reviewed-content Boss, Rewards and map evolution belong inside the active region. Skills are four shared learning categories with five levels. Journey switching preserves World, history, Collection, loadouts and learning progress. No third map, Quiz land or Community Village is in scope.

## Non-negotiable safety and release requirements

- Keep age, eligibility, consent, RLS, owner scoping, reviewed-content gates and server-authoritative rewards.
- Do not use production Supabase, send real email, deploy or place health data in URLs/plaintext browser persistence.
- Demo accounts/content must be synthetic and visibly isolated from production.
- Preserve the existing World artwork and IDs. Do not make the other six regions playable or remove old data.
- Complete a real browser flow and desktop/mobile screenshot inspection. A headless test or HTTP 200 alone is not acceptance.
- Report each feature as implemented, browser verified, persistence verified, visual QA, and PASS/PARTIAL/BLOCKED. Do not call the product production-ready while review/security/privacy gates remain open.

## Priority

1. Isolated owner Auth + local mail inbox and persistent test World.
2. Two playable detailed region maps, reusing a shared map engine.
3. Quiz-to-Journey continuity and safe personalization.
4. Luna/Lumi, Journey-specific reviewed Toolkit and Knowledge.
5. In-map learning games, shared Skills, Boss/Rewards, persistence, and switching.
6. Real browser acceptance, screenshots, regression, and restart/stop instructions.

Finish one playable Sleep slice before duplicating mechanics in HealthClues Realm. If local Auth/mail or reviewed region assets are unavailable, record a precise blocker; do not substitute mocks/placeholders and claim completion.

