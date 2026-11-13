# Final Game Delivery Checklist

Rolling handoff for `App/HEALTHCLUES_FINAL_COMPLETE.md`. Update after each material stage; preserve completed evidence across restarts.

| Stage | State | Evidence / next exact action |
|---|---|---|
| Read project rules/specs/source/Git state | DONE | Root `AGENTS.md`, context, current state, canonical specs, 09D-R report, source and Git status inspected. |
| Preserve/advance owner demo | PASS (current build) | `app-build-final-a2` serves `http://127.0.0.1:3249/play`; Mailpit `http://127.0.0.1:54324`. Build staged in `%TEMP%\healthclues-owner-demo-builds` on C: after D: filled. Old known HealthClues preview processes were stopped only after verifying exact build path/port; persistent Supabase volume was preserved. |
| Optional Daily Pet reflection | PASS slice | Two optional prompts, skip and explicit opt-in to private note passed actual Chromium against 3248; screenshot pair visually inspected. Does not complete daily history/reminder work. |
| Save durable task and handoff | DONE | This file and `HEALTHCLUES_FINAL_COMPLETE.md`. |
| Current renderer / movement | PARTIAL | Sleep movement, camera/Pet follow and proximity verified on r6; health map full movement, collision fidelity, physical mobile and FPS remain unverified. |
| Local demo educational catalog | PASS (demo-only flow) | Latest actual Chromium test opened TEST ONLY entries, Full Details, Collection, private USER-REPORTED track and server-validated local demo equip in Sleep/Gout. Not human-reviewed content; not production approval. |
| Knowledge / Quick Quiz / mini-game | PARTIAL | Sleep and saved Gout Knowledge clue discovery/Quick Quiz passed using TEST ONLY local fixtures and server persistence. Separate mini-game, Skill levels and daily tip rules remain unimplemented/unverified. |
| Boss / persisted cosmetic rewards | PASS (demo-only flow) | Sleep TEST ONLY challenge completed in-map; API read confirmed cleared; screenshot includes local demo XP/key/keepsake. Boss fixture is synthetic, not educational approval. Full rewards/evolution coverage remains partial. |
| User Care Plan / medication / daily companion | PARTIAL | Existing private Care Plan/medication isolation still passes. New two-prompt Companion flow passed owner-browser test; explicit opt-in note reloaded from private Check-in API. This does not complete daily history/reminders or the full Care Plan UX. |
| Full Sleep journey | NOT VERIFIED | Run actual owner browser from Mailpit through movement, NPC, save/track, Backpack, Knowledge and return/reload; fix failures. |
| Full Health/Gout journey | PARTIAL | Context continuity tested; test region walk + relevant stations and private persistence. |
| Desktop/mobile screenshot QA | PARTIAL | 09D-R screenshots exist; capture all newly implemented screens from same build and visually inspect. |
| Auth/account privacy regression | VERIFIED PRIOR | 09D-R browser evidence records real local Auth, same World after reload, guest denial and second-account isolation; rerun if backend changes. |
| Docs / final acceptance report | IN PROGRESS | Report exists and source/spec/status records updated; rerun docs guard after Master/privacy scope notes. |

| Simplified one-scene Region Map paths | SOURCE PASS / BROWSER BLOCKED | Each region now has one compact path graph (Sleep 512 units; Health 474), seven validated approach points, zero gameplay bridge edges; regression script `scripts/test-healthclues-region-layout.mjs`. Owner build refresh is blocked because local Docker service is Stopped; URL 3249 is temporarily unavailable. Do not treat source test as browser evidence. |

## Next exact action

Implement/verify the remaining independent stages: a concise reusable in-region mini-game, shared four-category/five-level learning progress only if it can safely reuse existing reward mechanics, Health map travel, and test restart/resume against the persistent volume. Then perform physical-device mobile QA and human art review. Current owner build/URL is 3249; screenshots are under `reports/previews/`. D: space is critically low; keep future build output on `%TEMP%` and do not remove preserved baselines or owner data. Overall stays PARTIAL.
