import os
import sys
import time
import subprocess
import numpy as np
import soundfile as sf
from pathlib import Path
from vieneu import Vieneu

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = Path(r"D:\botly")
VOICE_DIR = ROOT_DIR / "public" / "audio" / "night-companion" / "voice"
TMP_DIR = Path(r"D:\Autobot\VietVoiceStudio\tmp")

VOICE_DIR.mkdir(parents=True, exist_ok=True)
TMP_DIR.mkdir(parents=True, exist_ok=True)

REF_FEMALE = r"D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\Bedtime Relaxation Recording Brief.mp3"
REF_MALE = r"D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\reference_clean.wav"
BACKGROUND_432HZ = ROOT_DIR / "public" / "audio" / "night-companion" / "pacer" / "pacer-chime-coherent-5-5.mp3"

SR = 48000
TARGET_DURATION_SEC = 420.0  # Exactly 7 minutes (7 * 60)

# Full 7-Minute Clinical Sleep Hypnosis Script (Ericksonian Framework)
# Phase 1: Induction & Somatic Downshift (0:00 - 1:30)
# Phase 2: Deepener 5-Stage Descent (1:30 - 4:30)
# Phase 3: Dissolution & Open-Ended Transition (4:30 - 7:00)
HYPNOSIS_PHRASES = [
    # Phase 1: Induction & Somatic Release (0:00 - 1:30)
    ("Welcome to your sanctuary of rest. Settle into whatever position feels most comfortable for you.", 5.0),
    ("Notice the weight of your body pressing gently into the bed, completely held, completely supported.", 6.0),
    ("There is nothing you need to accomplish right now. The day behind you is finished, and tomorrow does not need your attention.", 7.0),
    ("Let your jaw unclench, allowing your teeth to part softly. Feel the small muscles around your eyes releasing their hold.", 7.0),
    ("Allow your shoulders to drop away from your ears, letting all the weight you carried today melt into the mattress.", 8.0),
    ("With every quiet breath out, feel your chest and belly softening, sinking naturally into the quiet night.", 8.0),

    # Phase 2: Deepener 5-Stage Descent (1:30 - 4:30)
    ("We are now stepping onto a gentle path of deep rest. With every count from five down to one, your mind and body will drift deeper into ease.", 8.0),
    ("Five. Imagine a smooth river stone resting under cool, clear water. The water flows over it effortlessly, washing away every thought and every trace of tension.", 10.0),
    ("Four. Notice a single white cloud drifting across a wide twilight sky. It moves without effort, without direction, floating weightlessly into the quiet evening.", 12.0),
    ("Three. A warm cup of herbal tea resting beside your bed, gentle steam rising into the calm room, carrying the soothing scent of chamomile and lavender.", 12.0),
    ("Two. Soft, gentle rain tapping quietly against the windowpane. Each raindrop slides down easily, slowing your heartbeat, slowing your breath, wrapping you in calm.", 14.0),
    ("One. Stepping into a quiet room of pure stillness. You have arrived at the deepest layer of comfort. Completely safe. Completely at peace.", 15.0),

    # Phase 3: Dissolution & Open-Ended Transition (4:30 - 7:00)
    ("You don't need to hold onto my voice any longer. You can let these words blur into distant echoes, as soft as the space around you.", 16.0),
    ("You do not have to try to fall asleep. Rest itself is healing your mind, restoring your energy, renewing every cell.", 20.0),
    ("Nothing is required of you until the morning sun rises. Just this breath. Just this quiet.", 22.0),
    ("Let go of the edges of your thoughts. Allow yourself to dissolve into the softness of the bed.", 25.0),
    ("Rest now. Drift freely into the night. Sleep will welcome you whenever it is ready.", 20.0),
]

def synthesize_hypnosis_track(phrases, ref_audio, raw_wav_path, target_sec=TARGET_DURATION_SEC):
    print(f"Synthesizing {len(phrases)} hypnosis phrases...")
    all_chunks = []
    t_start = time.perf_counter()
    
    for i, (text, pause_sec) in enumerate(phrases, 1):
        print(f"  [{i:02d}/{len(phrases):02d}] {text[:42]}... (+{pause_sec}s pause)")
        audio = tts.infer(text, ref_audio=ref_audio, denoise=False)
        audio = np.asarray(audio, dtype=np.float32)
        all_chunks.append(audio)
        if pause_sec > 0:
            silence = np.zeros(int(SR * pause_sec), dtype=np.float32)
            all_chunks.append(silence)
            
    combined = np.concatenate(all_chunks)
    current_dur = len(combined) / SR
    print(f"  -> Generated raw spoken audio: {current_dur:.1f}s (took {time.perf_counter()-t_start:.1f}s)")

    # Pad or trim to exactly target_sec (420.0s)
    target_samples = int(SR * target_sec)
    if len(combined) < target_samples:
        pad_needed = target_samples - len(combined)
        print(f"  -> Padding {pad_needed / SR:.1f}s of quiet tail to reach exactly {target_sec}s")
        silence_tail = np.zeros(pad_needed, dtype=np.float32)
        combined = np.concatenate([combined, silence_tail])
    elif len(combined) > target_samples:
        print(f"  -> Trimming to exact {target_sec}s")
        combined = combined[:target_samples]

    sf.write(raw_wav_path, combined, SR)
    return len(combined) / SR

def master_and_mix_hypnosis(raw_wav, ambient_432hz, out_mp3, total_sec=TARGET_DURATION_SEC):
    print("Mastering and mixing audio with 432Hz sleep soundscape...")
    # Studio Mastering Chain:
    # 1. highpass=f=80 (sub-rumble removal)
    # 2. equalizer 250Hz -3dB (clarity)
    # 3. equalizer 3200Hz -4dB (de-essing harsh sibilance)
    # 4. equalizer 8500Hz +2.5dB (airy breathy shelf)
    # 5. compand (intimate proximity leveling)
    # 6. aecho (warm subtle acoustic room reverb)
    # 7. afade (smooth fade-in at start, smooth decrescendo fade-out over final 15s)
    # 8. amix with 432Hz ambient frequency loop
    fade_start = total_sec - 15.0

    filter_complex = (
        f"[0:a]highpass=f=80,"
        f"equalizer=f=250:t=q:w=1:g=-3,"
        f"equalizer=f=3200:t=q:w=1.5:g=-4,"
        f"equalizer=f=8500:t=q:w=1:g=+2.5,"
        f"compand=attacks=0.08:decays=0.35:points=-80/-80|-40/-35|-20/-16|0/-6:gain=1,"
        f"aecho=0.8:0.35:60|120:0.12|0.06,"
        f"afade=t=in:ss=0:d=2,"
        f"afade=t=out:st={fade_start:.1f}:d=14[voice];"
        f"[1:a]volume=0.20,aloop=loop=-1:size=2e+09,atrim=0:{total_sec},"
        f"afade=t=in:ss=0:d=2,"
        f"afade=t=out:st={fade_start:.1f}:d=14[bg];"
        f"[voice][bg]amix=inputs=2:duration=first:dropout_transition=2,"
        f"volume=0.92[out]"
    )

    subprocess.run([
        "ffmpeg", "-y",
        "-i", str(raw_wav),
        "-i", str(ambient_432hz),
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(out_mp3)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Mastered 7-minute MP3 saved: {out_mp3}")

print("Initializing Vieneu TTS Engine...")
t_init = time.perf_counter()
tts = Vieneu()
print(f"Vieneu initialized in {time.perf_counter() - t_init:.2f}s")

def main():
    t_start = time.perf_counter()

    # 1. Female Whisper (Primary Default)
    raw_female = TMP_DIR / "hypnosis_7min_female_raw.wav"
    out_female = VOICE_DIR / "guided-coherent-5-5_female.mp3"
    out_default = VOICE_DIR / "guided-coherent-5-5.mp3"
    out_dedicated = VOICE_DIR / "sleep_hypnosis_7min_female.mp3"

    print("\n=======================================================")
    print(" 1. GENERATING 7-MINUTE FEMALE BEDTIME WHISPER HYPNOSIS")
    print("=======================================================")
    dur_f = synthesize_hypnosis_track(HYPNOSIS_PHRASES, REF_FEMALE, raw_female)
    master_and_mix_hypnosis(raw_female, BACKGROUND_432HZ, out_dedicated)
    
    import shutil
    shutil.copy2(out_dedicated, out_female)
    shutil.copy2(out_dedicated, out_default)
    print("Copied as default voice guidance track.")

    # 2. Male Calm
    raw_male = TMP_DIR / "hypnosis_7min_male_raw.wav"
    out_male = VOICE_DIR / "guided-coherent-5-5_male.mp3"
    out_dedicated_male = VOICE_DIR / "sleep_hypnosis_7min_male.mp3"

    print("\n=======================================================")
    print(" 2. GENERATING 7-MINUTE MALE CALM MEDITATION HYPNOSIS")
    print("=======================================================")
    dur_m = synthesize_hypnosis_track(HYPNOSIS_PHRASES, REF_MALE, raw_male)
    master_and_mix_hypnosis(raw_male, BACKGROUND_432HZ, out_dedicated_male)
    shutil.copy2(out_dedicated_male, out_male)

    print("\n=======================================================")
    print(f" ALL 7-MINUTE HYPNOSIS TRACKS COMPLETED IN {time.perf_counter() - t_start:.2f}s!")
    print("=======================================================")

if __name__ == "__main__":
    main()
