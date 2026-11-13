# HealthClues Knowledge Bilingual Empty State & Localization Acceptance Report (Cycle 35)

## 1. Context & User Evidence
- **User Attachment / Report**: The user reported an issue in the Knowledge Library ("Thư viện kiến thức") where the empty state message for an unreviewed or pending topic displayed hardcoded English:
  `"No reviewed Knowledge is currently available for Đường huyết · Huyết áp · Đau đầu / migraine · HealthClues Realm. HealthClues will not substitute unrelated topics."`
  while the rest of the interface (header, subtitle, skills, sidebar, footer) was rendered in Vietnamese.
- **Root Cause Analysis**:
  1. In `src/app/api/healthclues/knowledge/route.ts`, when `published.length === 0`, `emptyReason` was constructed with an English string containing `world.journeyLabel`.
  2. In `src/features/healthclues/KnowledgeJourneyPanel.tsx`, line 489 checked `data.emptyReason?.startsWith("No reviewed Knowledge")` but failed to handle variants and lacked a dedicated `emptyReasonVi` backend field, causing English strings to leak into Vietnamese sessions.
  3. In `src/features/healthclues/BossBattlePanel.tsx`, checkpoint dialogues and the empty challenge state lacked bilingual localization hooks.
  4. The user was inspecting the production deployment on Vercel which predated Cycle 34 and Cycle 35 bilingual fixes.

## 2. Implemented Changes
1. **API Localization**:
   - `src/app/api/healthclues/knowledge/route.ts`: Added `emptyReasonVi` alongside `emptyReason`.
     - English: `"No reviewed Knowledge is currently available for ${world.journeyLabel || 'this topic'}. HealthClues will not substitute unrelated topics."`
     - Vietnamese: `"Hiện chưa có manh mối kiến thức đã thẩm định y tế riêng cho chủ đề ${world.journeyLabel || 'này'}. HealthClues không thay thế bằng các chủ đề chưa liên quan để bảo đảm tính chuẩn xác."`
2. **Knowledge Library Front-end Guard**:
   - `src/features/healthclues/KnowledgeJourneyPanel.tsx`: Updated `KnowledgePayload` with `emptyReasonVi`. If `locale === "vi"`, priority is given to `data.emptyReasonVi`. If receiving legacy payloads, it falls back to a guaranteed Vietnamese explanation, ensuring zero English leakage into Vietnamese UI.
3. **Boss Challenge Localization**:
   - `src/features/healthclues/BossBattlePanel.tsx`: Integrated `useHealthCluesLocale` and `tx()` for all checkpoints, gate dialogues, XP rewards, and empty states.

## 3. Verification & Acceptance
- **Standalone Verification**: `scripts/test-knowledge-bilingual-empty.mjs` passed 100% across all 5 test cases (VI with emptyReasonVi, VI with English legacy fallback, EN with emptyReason, Boss VI, Boss EN).
- **Language Switcher Verification**: `scripts/test-language-toggle-verification.mjs` passed 100%.
- **Secret Scan**: `npm run secrets:scan` passed (3199 workspace source files clean).
- **Isolated Build**: Turbopack production build verified without regressions.
