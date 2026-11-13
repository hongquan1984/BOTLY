import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const expectedApi = "http://127.0.0.1:54321";
const configPath = path.join(demoRoot, "supabase", "config.toml");
const runtimePath = path.join(demoRoot, "owner-demo-runtime.json");
const result = {
  result: "BLOCKED", projectId: null, cliVersion: null, apiOrigin: null,
  publishableKeyPresent: false, serverSecretPresent: false,
  authHealth: false, authSettings: false, localRestReachable: false,
  mailpitWebReachable: false, inheritedRemoteSupabaseEnvDetected: false,
  secretsPrinted: false,
};

try {
  if (!existsSync(configPath) || !existsSync(runtimePath)) throw new Error("Dedicated local Owner Demo configuration is missing.");
  const projectMatch = readFileSync(configPath, "utf8").match(/^project_id\s*=\s*"([^"]+)"/m);
  const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
  result.projectId = projectMatch?.[1] || null;
  result.cliVersion = runtime.cliVersion || null;
  result.apiOrigin = runtime.apiUrl === expectedApi ? expectedApi : "MISMATCH";
  result.publishableKeyPresent = typeof runtime.publishableKey === "string" && runtime.publishableKey.length > 20;
  result.serverSecretPresent = typeof runtime.secretKey === "string" && runtime.secretKey.length > 20;
  if (result.projectId !== "healthclues-owner-demo" || runtime.projectId !== result.projectId || runtime.apiUrl !== expectedApi || !result.publishableKeyPresent || !result.serverSecretPresent || runtime.source !== "supabase status --workdir healthclues-owner-demo --output json" || !/^\d+\.\d+\.\d+$/.test(result.cliVersion || "")) {
    throw new Error("Dedicated runtime config identity or required fields do not match the local Owner Demo.");
  }
  result.inheritedRemoteSupabaseEnvDetected = Object.entries(process.env)
    .filter(([name]) => /^(SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL)$/i.test(name))
    .some(([, value]) => {
      try { return !["127.0.0.1", "localhost"].includes(new URL(value).hostname); }
      catch { return Boolean(value); }
    });
  const headers = { apikey: runtime.publishableKey, Authorization: `Bearer ${runtime.publishableKey}` };
  const [health, settings, rest, mailpit] = await Promise.all([
    fetch(expectedApi + "/auth/v1/health", { signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetch(expectedApi + "/auth/v1/settings", { headers: { apikey: runtime.publishableKey }, signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetch(expectedApi + "/rest/v1/healthclues_catalog_items?select=id&limit=1", { headers, signal: AbortSignal.timeout(5000) }).catch(() => null),
    fetch("http://127.0.0.1:54324/", { signal: AbortSignal.timeout(5000) }).catch(() => null),
  ]);
  result.authHealth = Boolean(health?.ok);
  result.authSettings = Boolean(settings?.ok);
  result.localRestReachable = Boolean(rest?.ok);
  result.mailpitWebReachable = Boolean(mailpit?.ok);
  const passed = result.projectId === "healthclues-owner-demo" && result.apiOrigin === expectedApi && result.publishableKeyPresent && result.serverSecretPresent && result.authHealth && result.authSettings && result.localRestReachable && result.mailpitWebReachable && !result.inheritedRemoteSupabaseEnvDetected;
  result.result = passed ? "PASS" : "BLOCKED";
} catch {
  // Do not print exception text from config, provider, or HTTP clients.
  result.result = "BLOCKED";
}

console.log(JSON.stringify(result));
if (result.result !== "PASS") process.exitCode = 2;
