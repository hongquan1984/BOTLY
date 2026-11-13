# HealthClues - Expansive RPG Quest Codex & Multi-Select Discovery Acceptance

**Date:** 2026-11-03  
**Status:** IMPLEMENTED, REBUILT & TESTED

---

## 1. Scope of Work

1. **Multi-Select Quiz Discovery (Bước 1 & Bước 2):**
   - Screen 1 (`HealthCluesGoalFirstDiscovery.tsx`): Updated to allow multi-select across health concerns (e.g., Gout, Digestion, Weight Management, Stress). Users can select multiple concerns with clear checkmarks and active counters.
   - Screen 2: Aggregates relevant factors from all selected concerns, allowing players to select multiple lifestyle circumstances seamlessly.
   - Enhanced visual design: Gilded fantasy parchment card frame, gold borders (`#dfc982`), RPG buttons with glowing selection rings.

2. **Eliminated "AI is not configured" Enterprise Errors:**
   - In `/api/healthclues/wellness-advisor`: Added resilient automatic fallback to reviewed deterministic catalog quests (`status: "DETERMINISTIC_DEMO"`).
   - If Gemini is enabled and private API key is present: calls live Gemini pipeline (`gemini-3.8-flash`).
   - If Gemini encounters an issue or quota/rate limit: smoothly falls back to reviewed habit quests. The player **never** encounters a 503 error box or support reference ID in-game.

3. **Expansive Landscape RPG Quest Board Modal (Hành trình của tôi):**
   - Eliminated the narrow 27rem (432px) right-edge drawer container (`is-journey-drawer`).
   - Replaced with a wide, centered **Landscape RPG Quest Codex** modal (`width: min(95vw, 78rem); max-height: min(92vh, 54rem);`).
   - 2-Column Overview on Desktop / Tablet:
     - **Left Column (~35%):** Companion Luna/Lumi live guide dialogue, 3-Slot Quest Runes Equipment HUD (`[Ô 1]`, `[Ô 2]`, `[Ô 3]`), and Journey Focus badge.
     - **Right Column (~65%):** Spacious Quest Cards with Option A (Khởi Động) & Option B (Bứt Phá) cards, difficulty tier badges, and `+20 EXP` reward badges.
   - Responsive mobile view with generous padding and card hierarchy.

4. **3-Slot Rune Equipment HUD:**
   - Glowing runic borders with specular gold highlights.
   - Automatic equipping into slot HUD upon choosing Option A or B.

---

## 2. Test Evidence

- `test-healthclues-rpg-quest-board.mjs`: **PASS** (Pet guide, 3-slot HUD, EXP badges, tier badges, interactive equipping, i18n & mojibake cleanup).
- `test-healthclues-adaptive-discovery.mjs`: **PASS** (13 assertions).
- `test-healthclues-personalized-plan-contract.mjs`: **PASS** (40+ assertions).
- `test-healthclues-gemini-plan-pipeline.mjs`: **PASS**.
