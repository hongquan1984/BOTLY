import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rebuild = process.argv.includes("--rebuild");
const buildDir = path.join(root, "App", ".tmp", rebuild ? `healthclues-owner-preview-${Date.now()}` : "healthclues-owner-preview");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const port = Number(process.env.HEALTHCLUES_PREVIEW_PORT || 3222);
const available = await new Promise(resolve => {
  const probe = net.createServer();
  probe.once("error", () => resolve(false));
  probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
});
assert.ok(available, `Port ${port} is occupied. No existing process was changed; choose another HEALTHCLUES_PREVIEW_PORT.`);

const privateEnv = name => /^(SUPABASE_|NEXT_PUBLIC_SUPABASE_|DATABASE_URL$|PGHOST$|PGPORT$|PGUSER$|PGPASSWORD$|RESEND_API_KEY$|EMAIL_FROM$|ENABLE_REAL_EMAIL_DISPATCH$|EBOOK_ADMIN_TOKEN$|HEALTHCLUES_(REVIEWER|MODERATOR)_TOKEN$)/i.test(name);
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !privateEnv(name)));
Object.assign(env, { NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", HEALTHCLUES_TURBOPACK_ROOT: root, HEALTHCLUES_PENDING_JOURNEY_SECRET: randomBytes(32).toString("base64url") });
delete env.HEALTHCLUES_BUILD_DIST_DIR;

if (!existsSync(path.join(buildDir, ".next", "BUILD_ID"))) {
  mkdirSync(buildDir, { recursive: true });
  for (const name of ["src", "public", "package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs"]) {
    const source = path.join(root, name);
    assert.ok(existsSync(source), `Missing source input: ${name}`);
    cpSync(source, path.join(buildDir, path.basename(name)), { recursive: true, dereference: false });
  }
  const build = spawnSync(process.execPath, [nextBin, "build"], { cwd: buildDir, env, stdio: "inherit", windowsHide: true });
  if (build.error) throw build.error;
  assert.equal(build.status, 0, `Isolated owner preview build failed (exit ${build.status}).`);
} else {
  console.log("Using existing isolated owner preview build. Rebuild it by moving its owned folder aside and rerunning this launcher.");
}

const logFile = path.join(root, "App", ".tmp", "healthclues-owner-preview.log");
writeFileSync(logFile, `\n\n[${new Date().toISOString()}] Starting isolated guest preview on ${port}.\n`, { flag: "a" });
const logFd = openSync(logFile, "a");
const server = spawn(process.execPath, [nextBin, "start", buildDir, "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: root, env, detached: true, windowsHide: true, stdio: ["ignore", logFd, logFd],
});
server.unref();
console.log(`HealthClues guest preview starting: http://127.0.0.1:${port}/play`);
console.log(`Isolated build: ${buildDir}`);
console.log(`Log: ${logFile}`);
