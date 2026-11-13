# Repo ESLint debt baseline

Recorded 2026-10-27 after adding the narrow `.tmp/**` ignore. ESLint still scans `src/` and the rest of the project.

The repo had 25 errors and 114 warnings before this task. Four low-risk JSX text-quote errors were corrected in NightAudioPlayer and CompactResultScreen. The static article metadata correction also removed one legacy `no-explicit-any` lint error. Current baseline is **20 errors across 11 non-HealthClues source files and 115 warnings**. The error baseline gate passes with no file/rule count increase. HealthClues routes, UI, matching code and E2E scripts have zero lint errors.

| Source path | Rule | Existing errors |
| --- | --- | ---: |
| `src/app/admin/night-companion/page.tsx` | `react-hooks/set-state-in-effect` | 1 |
| `src/app/admin/thong-ke/page.tsx` | `react-hooks/set-state-in-effect` | 1 |
| `src/app/admin/thong-ke/page.tsx` | `react-hooks/preserve-manual-memoization` | 5 |
| `src/app/api/ebooks/lead/route.ts` | `@typescript-eslint/no-explicit-any` | 1 |
| `src/app/api/rss/wellness/route.ts` | `@typescript-eslint/no-explicit-any` | 2 |
| `src/app/night-companion/reminder-manage/page.tsx` | `react-hooks/set-state-in-effect` | 1 |
| `src/app/night-companion/verify-email/page.tsx` | `react-hooks/set-state-in-effect` | 1 |
| `src/app/vi/song-khoe/huong-dan/[slug]/page.tsx` | `@typescript-eslint/no-explicit-any` | 1 |
| `src/components/app/SmartAppDownloadLanding.tsx` | `react-hooks/set-state-in-effect` | 1 |
| `src/components/app/SmartAppDownloadLanding.tsx` | `react-hooks/immutability` | 1 |
| `src/components/night-companion/NightAudioPlayer.tsx` | `react-hooks/set-state-in-effect` | 2 |
| `src/components/night-companion/NightAudioPlayer.tsx` | `@typescript-eslint/no-explicit-any` | 1 |
| `src/components/quiz/CompactResultScreen.tsx` | `react-hooks/set-state-in-effect` | 1 |
| `src/components/wellness/HealingSanctuaryHub.tsx` | `react-hooks/set-state-in-effect` | 1 |

`npm run lint:baseline` compares current file/rule error counts to this baseline using the active ESLint configuration. It fails if an error appears under a new file/rule or if any existing file/rule count grows. It does not turn off lint rules or make the ordinary lint command pass. No CI workflow exists in this checkout, so wire this gate into CI before relying on it for future changes.
