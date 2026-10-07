import fs from 'node:fs';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const files = [
  "D:/botly/public/audio/night-companion/intro/night1_intro_general_en_v1.mp3",
  "D:/botly/public/audio/night-companion/intro/night1_intro_mind_wont_stop_en_v1.mp3",
  "D:/botly/public/audio/night-companion/intro/night1_intro_mind_wont_stop_en_v2.mp3",
  "D:/botly/public/audio/night-companion/intro/night1_intro_sleep_anxiety_en_v1.mp3",
  "D:/botly/public/audio/night-companion/intro/night1_intro_not_sleepy_en_v1.mp3",
  "D:/botly/public/audio/night-companion/intro/night1_intro_stress_carryover_en_v1.mp3",
  "D:/botly/public/audio/night-companion/intro/night1_intro_woke_up_en_v1.mp3",
  "D:/botly/public/audio/night-companion/intro/night1_intro_woke_up_en_v2.mp3",
  "D:/botly/Music_Voice/introduce/night1_intro_mind_wont_stop_en_v1.mp3",
  "D:/botly/Music_Voice/introduce/night1_intro_mind_wont_stop_en_v2.mp3",
  "D:/botly/Music_Voice/introduce/night1_intro_woke_up_en_v1.mp3",
  "D:/botly/Music_Voice/introduce/night1_intro_woke_up_en_v2.mp3",
  "D:/botly/public/audio/night-companion/voice/guided-coherent-5-5.mp3",
  "D:/botly/public/audio/night-companion/voice/guided-4-7-8.mp3",
  "D:/botly/public/audio/night-companion/voice/guided-box-4-4-4-4.mp3",
  "D:/botly/public/audio/night-companion/voice/guided-4-2-6.mp3",
];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log(f, "DOES NOT EXIST");
    continue;
  }
  const buf = fs.readFileSync(f);
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const size = buf.length;
  let duration = "unknown";
  try {
    const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${f}"`).toString().trim();
    duration = parseFloat(out).toFixed(2);
  } catch(e) {}
  console.log(`${f} -> size: ${size}, duration: ${duration}s, sha: ${sha}`);
}
