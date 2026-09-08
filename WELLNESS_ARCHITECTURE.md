# Botly Wellness — Architecture Handoff

Last updated: 2026-08-28

## Product structure

Botly is one bilingual website, not separate subdomains at this stage. Wellness is organized into three audience portals:

| Portal | English route | Vietnamese route | Mascot | Content order |
| --- | --- | --- | --- | --- |
| Weight Loss | `/en/wellness/weight-management` | `/vi/song-khoe/giam-can` | Pip | Featured tool → supporting tools → videos → articles |
| Healing | `/en/wellness/healing` | `/vi/song-khoe/chua-lanh` | Lumi | Featured tool → supporting tools → videos → articles |
| Health Tips | `/en/wellness/health-tips` | `/vi/song-khoe/meo-suc-khoe` | Glint | Featured tool → supporting tools → videos → articles |

The root wellness pages `/en/wellness` and `/vi/song-khoe` introduce all three portals. English is the primary growth language, while Vietnamese remains a complete parallel experience.

## UX rules

- Each portal leads with a useful interactive tool rather than a news feed.
- Tool boxes appear first; videos second; articles/news third.
- Each portal has its own recognizable mascot and visual tone.
- Glint is the mature green glass character aligned with the Health Tips Facebook page.
- Facebook posts and Reels should point to the most relevant portal/tool rather than to a generic homepage.
- Health content must be positioned as education and self-care support, not diagnosis or treatment.

## Important files

- `src/data/wellness-portals.ts`: portal names, routes, tools, videos, articles, and mascots.
- `src/components/wellness/PortalLanding.tsx`: three-portal wellness homepage.
- `src/components/wellness/PortalHub.tsx`: shared portal page template.
- `src/components/wellness/WellnessHome.tsx`: homepage and all-tools entry points.
- `src/data/wellness.ts`: bilingual navigation and shared wellness data.
- `src/data/wellness-articles.ts`: guide/article data.
- `src/app/globals.css`: portal, mascot, tool, video, and story styling.
- `public/characters/`: Pip, Lumi, and Glint image assets.
- `supabase/`: optional account, newsletter, and cloud-plan backend setup.

## Existing tools

- Calorie needs calculator
- Food combination finder
- Stress check
- Meditation timer
- Remedy safety checker
- Seven-day wellness planner
- Local My Plan storage, with optional Supabase sync

## Current content status

- Health Tips includes links to the three supplied Facebook Reels.
- Weight Loss and Healing video cards have the final UI but still need real video URLs/content.
- Initial bilingual guides exist; content volume should be expanded portal by portal.

## Recommended next implementation step

Build the first acquisition funnel end-to-end for Weight Loss:

1. Upgrade the calorie tool into a personalized weight-loss plan generator.
2. Add email/plan saving after results, without blocking the initial result.
3. Create matching English-first landing copy and Vietnamese localization.
4. Connect one Weight Loss Reel/post to this exact tool URL with campaign tracking.
5. Measure tool start, completion, saved plan, newsletter signup, and return visit.

After validating that funnel, reuse the same pattern for Healing and Health Tips.

## Verification baseline

As of this handoff, `npm run lint` and `npm run build` both pass. The production build contains 33 routes.
