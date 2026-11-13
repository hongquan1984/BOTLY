import fs from "node:fs";

const p = "d:/botly/src/features/healthclues/world-adventure.css";
let c = fs.readFileSync(p, "utf8");

const oldPills = `.hc-goal-card-pills-row {
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:0.45rem;
  margin-top:0.5rem;
  padding-top:0.55rem;
  border-top:1px solid rgba(255,255,255,0.08);
}

.hc-active-goal-card .hc-journey-exp-tag {
  background:rgba(245,158,11,0.2);
  border:1px solid #f59e0b;
  color:#ffd868;
  font-size:0.66rem;
  font-weight:900;
  border-radius:9999px;
  padding:0.12rem 0.48rem;
}

.hc-active-goal-card .hc-journey-quantities {
  background:rgba(255,255,255,0.1);
  border:1px solid rgba(255,255,255,0.2);
  color:#cbd5e1;
  font-size:0.68rem;
  font-weight:800;
  border-radius:9999px;
  padding:0.12rem 0.48rem;
}`;

const newPills = `.hc-goal-card-pills-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  margin-top: 0.35rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.hc-active-goal-card .hc-journey-exp-tag {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.65);
  color: #ffd868;
  font-size: 0.62rem;
  font-weight: 900;
  border-radius: 9999px;
  padding: 0.1rem 0.42rem;
  white-space: nowrap;
}

.hc-active-goal-card .hc-journey-quantities {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #cbd5e1;
  font-size: 0.62rem;
  font-weight: 700;
  border-radius: 9999px;
  padding: 0.1rem 0.42rem;
  white-space: nowrap;
}`;

const normC = c.replace(/\r\n/g, "\n");
const normOld = oldPills.replace(/\r\n/g, "\n");
const normNew = newPills.replace(/\r\n/g, "\n");

if (normC.includes(normOld)) {
  fs.writeFileSync(p, normC.replace(normOld, normNew).replace(/\n/g, "\r\n"), "utf8");
  console.log("Successfully updated pills CSS!");
} else {
  console.log("Could not find old pills CSS block");
}
