import { execSync } from 'child_process';

const files = [
  'public/audio/night-companion/intro/night1_intro_mind_wont_stop_en_v2_female.mp3',
  'public/audio/night-companion/voice/guided-coherent-5-5_female.mp3',
  'public/audio/night-companion/pacer/pacer-chime-coherent-5-5.mp3',
  'public/audio/night-companion/pivot/pivot_mind_wont_stop_female.mp3',
  'public/audio/night-companion/delta/deep_delta_brown_noise.mp3',
  'public/audio/night-companion/cocoon/sleep_cocoon_continuous.mp3',
  'public/audio/night-companion/music/ocean-waves.mp3'
];

for (const f of files) {
  try {
    const dur = execSync(`ffprobe -i "${f}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
    console.log(`${f} -> ${dur}s (${(Number(dur) / 60).toFixed(2)} min)`);
  } catch (e) {
    console.error(f, e.message);
  }
}
