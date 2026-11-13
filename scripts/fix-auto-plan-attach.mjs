import fs from "fs";

const file = "d:/botly/src/features/healthclues/WellnessWorldGame.tsx";
let content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// 1. In enterWorld, remove line 227 blocker:
// if (onboardingBackpack && (!activationContext || !activationProfileSaved)) { setPageError("Finish verifying this adventure and saving your discovery before creating its World."); return; }
const blocker = `    if (onboardingBackpack && (!activationContext || !activationProfileSaved)) { setPageError("Finish verifying this adventure and saving your discovery before creating its World."); return; }`;
if (content.includes(blocker)) {
  content = content.replace(blocker, "");
  console.log("Removed enterWorld blocker");
} else {
  console.log("Blocker not found");
}

// 2. Add an effect to attach confirmed wellness plan to existing world if it has no plan yet:
const anchor = `  useEffect(() => {
    if (!session || loading || worldData.world || busy || activationAutoCreateStarted.current) return;
    activationAutoCreateStarted.current = true;
    void enterWorld();
  }, [session, loading, worldData.world, busy, enterWorld]);`;

const replacement = `  useEffect(() => {
    if (!session || loading || worldData.world || busy || activationAutoCreateStarted.current) return;
    activationAutoCreateStarted.current = true;
    void enterWorld();
  }, [session, loading, worldData.world, busy, enterWorld]);

  useEffect(() => {
    if (!activationContext?.wellnessPlan || !worldData.world || !session) return;
    if (worldData.wellnessPlan && worldData.wellnessPlan.goals?.length) return;
    const planKey = activationContext.wellnessPlanRequestKey || crypto.randomUUID();
    void authorizedFetch("/api/healthclues/plan", {
      method: "POST",
      body: JSON.stringify({
        worldId: worldData.world.id,
        requestKey: planKey,
        confirmed: true,
        goals: activationContext.wellnessPlan
      })
    }).then(() => {
      void loadWorld();
    }).catch(() => null);
  }, [activationContext, worldData.world, worldData.wellnessPlan, session, authorizedFetch, loadWorld]);`;

if (content.includes(anchor)) {
  content = content.replace(anchor, replacement);
  console.log("Added reactive plan attach effect");
} else {
  console.log("Anchor not found");
}

fs.writeFileSync(file, content, "utf8");
console.log("Updated WellnessWorldGame.tsx successfully");
