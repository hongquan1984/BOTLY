# Botanist RPG Botanical Cards & Visual Highlights Audit

**Audit Date**: 2026-11-07  
**Platform**: HealthClues Web & Mobile Viewports  
**Tested On**: Real Chromium CDP (port 3329)  
**Status**: 100% PASSED & VERIFIED  

---

## 1. Problem Statement & User Feedback

The user reviewed the previous iteration of the Botanist Garden station ("Vườn thảo mộc") and pointed out:
1. **Lack of Visual Artwork**: The previous cards were purely textual without any plant illustrations or botanical visual assets.
2. **Dense Wall of Text**: Each card displayed an entire textbook-style paragraph (`article.shortIntro`), making the overview heavy, academic, and intimidating to scan.
3. **Lack of Game/RPG Identity**: The card look and feel was overly generic/document-like rather than feeling like a collectible herb card in a fantasy adventure.
4. **Desire for Scannable Scientific Highlights**: The user requested that the card immediately list:
   - What compounds/bioactives the herb contains (e.g. Tía tô $\rightarrow$ Rosmarinic acid, Luteolin, Apigenin).
   - What studied effects / mechanisms it has (e.g. whether it can relieve pain/inflammation or inhibit enzymes like xanthine oxidase).
   - A clear secondary step to click into full details (`[Đọc chi tiết]`) rather than dumping everything onto the initial card.

---

## 2. Engineering Implementation

### A. High-Quality Public-Domain Botanical Plates
- Procured authentic, high-resolution botanical plates from public domain archives (e.g. *Curtis's Botanical Magazine*, Franz Eugen Köhler's *Medizinal-Pflanzen*), converted and optimized into WebP format:
  * `perilla-frutescens.webp`: Fresh Japanese shiso / Perilla frutescens textured leaves with serrated margins.
  * `hibiscus-sabdariffa.webp`: Deep crimson Roselle calyces and petals.
  * `matricaria-chamomilla.webp`: Crisp German chamomile daisy flowers with sunny golden disc florets.
  * `passiflora-incarnata.webp`: Intricate Purple Passionflower with radial violet filaments and green foliage.

### B. Data Layer Updates (`src/data/healthclues-botanical-library.ts`)
- Added optional fields to `BotanicalArticle`:
  * `imageUrl`: Local path to optimized WebP artwork.
  * `categoryBadge`: Herb category and wellness role (e.g. `🌿 Thảo mộc chuyển hóa acid uric`).
  * `keyHighlights`: Concise array of 3 bullet points summarizing studied mechanisms and effects.

### C. Redesigned RPG Collectible Card (`WellnessEncyclopediaStation.tsx`)
- **Card Aesthetics**:
  * Storybook fantasy parchment background: `bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f6f0e2]`.
  * Subtle gold hover border: `border-2 border-[#d8cfbe] hover:border-[#b89552]`.
  * Depth & Lift: `hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(180,145,75,0.22)]`.
- **Hero Image Window**:
  * Aspect container with `overflow-hidden rounded-2xl border-b border-[#ded4be]`.
  * Floating top-left: Evidence Level Pill (`Thử nghiệm lâm sàng`, `Nghiên cứu trên động vật`, etc.).
  * Floating top-right: Herb Category Pill (`🌿 Thảo mộc chuyển hóa acid uric`).
  * Floating bottom scrim: PubMed citations count (`2 trích dẫn PubMed`) and international Latin binomial name.
- **Removed Wall of Text**:
  * `article.shortIntro` is removed from the overview card, saving space and eliminating visual clutter.
- **Scannable Bioactives Section**:
  * Labeled with `<Sparkles size={11} className="text-amber-600" />` + `"Hoạt chất sinh học chính"`.
  * Renders individual bioactives in clean white pill tags (e.g. `Rosmarinic acid`, `Luteolin`, `Apigenin`).
- **Scannable Studied Effects Section**:
  * Labeled with `<FlaskConical size={11} className="text-emerald-700" />` + `"Tác dụng & cơ chế nghiên cứu"`.
  * Renders 2-3 concise bullet points with golden star bullets (`✦`).
- **Action Buttons**:
  * `[📖 Đọc chi tiết]`: Emerald/forest gradient button that launches `BotanicalArticleModal`.
  * `[🔖 Lưu kiến thức]`: Bookmark toggle syncing to Knowledge Book.

### D. Detailed Modal Enhancement (`BotanicalArticleModal.tsx`)
- Displays `article.imageUrl` inside a framed botanical thumbnail alongside Latin botanical classification, verified date, and evidence tier.

---

## 3. Quantitative Automated Verification Results (Chromium CDP)

| Test Suite | Metric / Assertion | Measured Value | Verdict |
| :--- | :--- | :--- | :--- |
| **Desktop 1280×800** | Cards Rendered for Gout Topic | 2 cards (Tía tô, Atiso đỏ) | **PASS** |
| | Hero Image Present on Card | `true` | **PASS** |
| | Image Source | `/healthclues/assets/botanical/perilla-frutescens.webp` | **PASS** |
| | Rendered Image Width & Height | `524px × 191px` | **PASS** |
| | Natural Image Dimensions | `800px × 600px` (loaded) | **PASS** |
| | Dense Paragraph (`shortIntro`) on Card | `false` (completely removed) | **PASS** |
| | Key Bioactive Pill Tags | 3 compounds (`Rosmarinic acid`, `Luteolin`, `Apigenin`) | **PASS** |
| | Studied Mechanisms Bullets | 3 bullets (`✦ Ức chế enzyme XO...`) | **PASS** |
| | Read Details Button | `true` | **PASS** |
| **Modal Interaction** | Modal Opens on Click | `true` | **PASS** |
| | Modal Header | `Tía tô` | **PASS** |
| | Hero Artwork in Modal | `true` | **PASS** |
| | PubMed Direct Links in Modal | 2 links (`https://pubmed.ncbi.nlm.nih.gov/...`) | **PASS** |
| **Mobile 390×844** | Card Fits Mobile Viewport | `cardWidth: 354px <= 390px` | **PASS** |
| | Mobile Hero Image Height | `175px` | **PASS** |
| | Zero Horizontal Overflow | `true` | **PASS** |

---

## 4. Evidence Artifacts

- Desktop Overview: `verified-botanist-rpg-cards-desktop.png`
- Detail Modal with Artwork: `verified-botanist-detail-modal-artwork.png`
- Mobile Responsive Cards: `verified-botanist-rpg-cards-mobile.png`
