import { execSync } from "node:child_process";

const out = execSync("powershell -Command \"(Get-Item /proc/7692/cwd -ErrorAction SilentlyContinue).Target || (Get-CimInstance Win32_Process -Filter 'ProcessId=7692').CommandLine\"").toString();
console.log("CommandLine:", out);
