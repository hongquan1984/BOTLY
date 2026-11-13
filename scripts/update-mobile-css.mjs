import fs from "fs";

const file = "d:/botly/src/features/healthclues/world-adventure.css";
let content = fs.readFileSync(file, "utf8");

const target = `.hc-active-goals-grid { grid-template-columns: 1fr; gap: 0.85rem; }
  .hc-active-goal-card { padding: 0.95rem 0.85rem; }
  .hc-goal-top-row { align-items: flex-start; gap: 0.75rem; }
  .hc-goal-info-col { gap: 0.25rem; }
  .hc-goal-title-status-row { flex-direction: column; align-items: flex-start; gap: 0.35rem; }
  .hc-active-goal-card .hc-quest-card-title { font-size: 0.98rem; line-height: 1.35; word-break: break-word; }
  .hc-goal-desc-text { font-size: 0.76rem; line-height: 1.4; }
  .hc-goal-action-box { padding: 0.75rem; gap: 0.4rem; }
  .hc-goal-action-body { font-size: 0.78rem; line-height: 1.4; }
  .hc-goal-card-pills-row { gap: 0.4rem; }
  .hc-goal-3d-frame, .hc-goal-mound-frame { width:3.5rem; height:3.5rem; }
  .hc-goal-3d-img { width:2.7rem; height:2.7rem; }`;

const replacement = `.hc-active-goals-grid { grid-template-columns: 1fr; gap: 0.65rem; }
  .hc-active-goal-card { padding: 0.65rem 0.75rem; }
  .hc-goal-top-row { align-items: center; gap: 0.65rem; }
  .hc-goal-info-col { gap: 0.2rem; }
  .hc-goal-title-status-row { flex-direction: column; align-items: flex-start; gap: 0.35rem; }
  .hc-active-goal-card .hc-quest-card-title { font-size: 0.8rem; line-height: 1.35; word-break: break-word; }
  .hc-goal-desc-text { font-size: 0.72rem; line-height: 1.35; }
  .hc-goal-action-box { padding: 0.6rem; gap: 0.35rem; }
  .hc-goal-action-body { font-size: 0.75rem; line-height: 1.35; }
  .hc-goal-card-pills-row { gap: 0.35rem; }
  .hc-goal-3d-frame, .hc-goal-mound-frame { width:2.5rem; height:3.0rem; }
  .hc-goal-3d-img { width:2.4rem; height:2.8rem; }`;

const normalizedContent = content.replace(/\r\n/g, "\n");
const normalizedTarget = target.replace(/\r\n/g, "\n");
const normalizedReplacement = replacement.replace(/\r\n/g, "\n");

if (normalizedContent.includes(normalizedTarget)) {
  const updated = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(file, updated, "utf8");
  console.log("SUCCESSFULLY UPDATED MOBILE CSS");
} else {
  console.log("TARGET NOT FOUND IN CSS");
}
