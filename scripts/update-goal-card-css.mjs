import fs from "node:fs";

const p = "d:/botly/src/features/healthclues/world-adventure.css";
let c = fs.readFileSync(p, "utf8");

// Replacement for .hc-active-goals-grid down to .hc-goal-action-box
const oldCSS = `/* 3-Column Goal Cards Grid */
.hc-active-goals-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));
  gap:0.85rem;
}

.hc-active-goal-card {
  background:linear-gradient(155deg,rgba(16,42,31,0.88) 0%,rgba(10,26,19,0.94) 100%);
  border:1px solid rgba(80,135,100,0.45);
  border-radius:1rem;
  padding:0.8rem 0.95rem;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  gap:0.5rem;
  box-shadow:0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
  transition:all 0.2s cubic-bezier(0.4,0,0.2,1);
}
.hc-active-goal-card:hover {
  border-color:#d4af37;
  box-shadow:0 8px 24px rgba(0,0,0,0.5), 0 0 14px rgba(212,175,55,0.25);
  transform:translateY(-1px);
}

.hc-goal-card-top {
  display:flex;
  gap:0.85rem;
  align-items:flex-start;
}

.hc-goal-illustration-col {
  flex-shrink:0;
}

.hc-goal-3d-frame {
  width:3.2rem;
  height:3.8rem;
  border-radius:0;
  background:transparent;
  border:none;
  display:grid;
  place-items:center;
  box-shadow:none;
  overflow:visible;
  filter:drop-shadow(0 3px 8px rgba(0,0,0,0.45));
}

.hc-goal-3d-img {
  width:3.1rem;
  height:3.7rem;
  object-fit:contain;
  border-radius:0.55rem;
  transition:transform 0.2s ease;
}
.hc-active-goal-card:hover .hc-goal-3d-img {
  transform:scale(1.06) translateY(-1px);
}

.hc-goal-mound-frame {
  width:3.2rem;
  height:3.2rem;
  border-radius:0.85rem;
  background:radial-gradient(circle at 50% 60%,rgba(20,50,35,0.9) 0%,rgba(10,30,20,0.9) 100%);
  border:1.5px solid rgba(80,135,100,0.5);
  display:grid;
  place-items:center;
  box-shadow:0 3px 10px rgba(0,0,0,0.35);
}

.hc-goal-info-col {
  flex:1;
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:0.35rem;
}

.hc-goal-title-status-row {
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:0.55rem;
}

.hc-active-goal-card .hc-quest-card-title {
  color:#ffffff;
  font-size:0.92rem;
  font-weight:850;
  line-height:1.35;
}

.hc-active-goal-card .hc-journey-status.is-active {
  background:rgba(34,197,94,0.18);
  border:1px solid #22c55e;
  color:#4ade80;
  font-size:0.65rem;
  font-weight:900;
  border-radius:9999px;
  padding:0.15rem 0.55rem;
  white-space:nowrap;
}
.hc-active-goal-card .hc-journey-status.is-saved {
  background:rgba(168,85,247,0.18);
  border:1px solid #c084fc;
  color:#e9d5ff;
  font-size:0.65rem;
  font-weight:900;
  border-radius:9999px;
  padding:0.15rem 0.55rem;
  white-space:nowrap;
}`;

const newCSS = `/* Compact, Clean Game Goal Cards Grid */
.hc-active-goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
  gap: 0.75rem;
}

.hc-active-goal-card {
  background: linear-gradient(160deg, rgba(16, 42, 31, 0.92) 0%, rgba(10, 26, 19, 0.96) 100%);
  border: 1px solid rgba(80, 140, 105, 0.45);
  border-radius: 0.85rem;
  padding: 0.65rem 0.8rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.45rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.hc-active-goal-card:hover {
  border-color: #d4af37;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(212, 175, 55, 0.22);
  transform: translateY(-1px);
}

.hc-goal-card-top {
  display: flex;
  gap: 0.65rem;
  align-items: center;
}

.hc-goal-illustration-col {
  flex-shrink: 0;
}

.hc-goal-3d-frame {
  width: 2.6rem;
  height: 3.1rem;
  border-radius: 0;
  background: transparent;
  border: none;
  display: grid;
  place-items: center;
  box-shadow: none;
  overflow: visible;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
}

.hc-goal-3d-img {
  width: 2.5rem;
  height: 3.0rem;
  object-fit: contain;
  border-radius: 0.45rem;
  transition: transform 0.2s ease;
}
.hc-active-goal-card:hover .hc-goal-3d-img {
  transform: scale(1.05) translateY(-1px);
}

.hc-goal-mound-frame {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.75rem;
  background: radial-gradient(circle at 50% 60%, rgba(20, 50, 35, 0.9) 0%, rgba(10, 30, 20, 0.9) 100%);
  border: 1.5px solid rgba(80, 135, 100, 0.5);
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.hc-goal-info-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.hc-goal-meta-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.hc-goal-category-micro {
  color: #ffd868;
  font-size: 0.68rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hc-active-goal-card .hc-quest-card-title {
  color: #f1f8f4;
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.38;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hc-active-goal-card .hc-journey-status.is-active {
  background: rgba(34, 197, 94, 0.18);
  border: 1px solid #22c55e;
  color: #4ade80;
  font-size: 0.62rem;
  font-weight: 900;
  border-radius: 9999px;
  padding: 0.12rem 0.45rem;
  white-space: nowrap;
}
.hc-active-goal-card .hc-journey-status.is-saved {
  background: rgba(168, 85, 247, 0.18);
  border: 1px solid #c084fc;
  color: #e9d5ff;
  font-size: 0.62rem;
  font-weight: 900;
  border-radius: 9999px;
  padding: 0.12rem 0.45rem;
  white-space: nowrap;
}`;

const normalizedC = c.replace(/\r\n/g, "\n");
const normalizedOld = oldCSS.replace(/\r\n/g, "\n");
const normalizedNew = newCSS.replace(/\r\n/g, "\n");

if (normalizedC.includes(normalizedOld)) {
  const updated = normalizedC.replace(normalizedOld, normalizedNew);
  fs.writeFileSync(p, updated.replace(/\n/g, "\r\n"), "utf8");
  console.log("Successfully updated world-adventure.css with compact goal cards!");
} else {
  console.log("Could not find old CSS block in world-adventure.css");
}
