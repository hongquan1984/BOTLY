import fs from "node:fs";

const p = "d:/botly/src/features/healthclues/WorldAdventureScene.tsx";
let c = fs.readFileSync(p, "utf8");

const target = `<div className="hc-goal-info-col">
                      <div className="hc-goal-title-status-row">
                        <strong className="hc-quest-card-title">{chosenTitle}</strong>
                        <span className={\`hc-journey-status \${goal.choice === "active" ? "is-active" : "is-saved"}\`}>
                          {statusLabel(goal)}
                        </span>
                      </div>
                    </div>`;

const replacement = `<div className="hc-goal-info-col">
                      <div className="hc-goal-meta-header-row">
                        <span className="hc-goal-category-micro">{copy.title || (goal.category ? text(goal.category) : text("Thói quen"))}</span>
                        <span className={\`hc-journey-status \${goal.choice === "active" ? "is-active" : "is-saved"}\`}>
                          {statusLabel(goal)}
                        </span>
                      </div>
                      <p className="hc-quest-card-title">{chosenTitle}</p>
                    </div>`;

// Normalize line endings for replacement
const normalizedC = c.replace(/\r\n/g, "\n");
const normalizedTarget = target.replace(/\r\n/g, "\n");
const normalizedReplacement = replacement.replace(/\r\n/g, "\n");

if (normalizedC.includes(normalizedTarget)) {
  const updated = normalizedC.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(p, updated.replace(/\n/g, "\r\n"), "utf8");
  console.log("Successfully updated WorldAdventureScene.tsx goal card structure!");
} else {
  console.log("Could not find target block in WorldAdventureScene.tsx");
}
