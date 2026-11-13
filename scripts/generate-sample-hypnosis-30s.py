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
OUT_DIR = ROOT_DIR / "public" / "audio" / "night-companion" / "sample-hypnosis"
OUT_DIR.mkdir(parents=True, exist_ok=True)

REF_FEMALE = r"D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\Bedtime Relaxation Recording Brief.mp3"
REF_MALE = r"D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\reference_clean.wav"
BACKGROUND_432HZ = ROOT_DIR / "public" / "audio" / "night-companion" / "pacer" / "pacer-chime-coherent-5-5.mp3"

SR = 48000

print("Initializing Vieneu TTS Engine...")
tts = Vieneu()

# 30-Second Hypnosis Scripts
VI_PHRASES = [
    ("Thả lỏng đôi vai, và để cơ thể bạn chìm sâu vào sự êm ái của chiếc đệm.", 3.5),
    ("Bạn không cần phải cố gắng làm gì lúc này nữa.", 3.5),
    ("Mọi lo toan của ngày hôm nay, hãy để lại phía sau.", 4.0),
    ("Chỉ cần để tâm trí mình... nhẹ nhàng trôi đi.", 3.0),
]

EN_PHRASES = [
    ("Allow your shoulders to soften, letting the bed hold you completely.", 3.5),
    ("There is nothing you need to solve right now.", 3.5),
    ("Let every thought from the day slowly dissolve.", 4.0),
    ("Simply give yourself permission... to drift into rest.", 3.0),
]

def synthesize_spaced_audio(phrases, ref_audio, raw_wav_path):
    all_chunks = []
    for text, pause_sec in phrases:
        print(f"  Synthesizing chunk: {text[:40]}...")
        audio = tts.infer(text, ref_audio=ref_audio, denoise=False)
        audio = np.asarray(audio, dtype=np.float32)
        all_chunks.append(audio)
        if pause_sec > 0:
            silence = np.zeros(int(SR * pause_sec), dtype=np.float32)
            all_chunks.append(silence)
    combined = np.concatenate(all_chunks)
    sf.write(raw_wav_path, combined, SR)
    return len(combined) / SR

def master_whisper_voice(raw_wav, out_mp3, duration):
    fade_st = max(0.0, duration - 2.5)
    filter_chain = (
        "highpass=f=80,"
        "equalizer=f=250:t=q:w=1:g=-3,"
        "equalizer=f=3200:t=q:w=1.5:g=-4,"
        "equalizer=f=8500:t=q:w=1:g=+2.5,"
        "compand=attacks=0.08:decays=0.35:points=-80/-80|-40/-35|-20/-16|0/-6:gain=1,"
        "aecho=0.8:0.35:60|120:0.12|0.06,"
        "afade=t=in:ss=0:d=1.5,"
        f"afade=t=out:st={fade_st:.2f}:d=2.5,"
        "volume=0.9"
    )
    subprocess.run([
        "ffmpeg", "-y", "-i", str(raw_wav),
        "-filter_complex", filter_chain,
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(out_mp3)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def mix_with_ambient_432hz(voice_mp3, ambient_mp3, out_mixed_mp3, duration):
    fade_st = max(0.0, duration - 2.5)
    filter_complex = (
        "[0:a]volume=1.0[voice];"
        "[1:a]volume=0.22,aloop=loop=-1:size=2e+09[bg];"
        "[voice][bg]amix=inputs=2:duration=first:dropout_transition=2,"
        f"afade=t=out:st={fade_st:.2f}:d=2.5[out]"
    )
    subprocess.run([
        "ffmpeg", "-y",
        "-i", str(voice_mp3),
        "-i", str(ambient_mp3),
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(out_mixed_mp3)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    raw_vi = OUT_DIR / "sample_vi_raw.wav"
    out_vi = OUT_DIR / "sample_hypnosis_30s_vi_voice.mp3"
    out_vi_mixed = OUT_DIR / "sample_hypnosis_30s_vi_with_432hz.mp3"

    print("\n--- 1. Generating Vietnamese 30s Hypnosis Sample ---")
    dur_vi = synthesize_spaced_audio(VI_PHRASES, REF_FEMALE, raw_vi)
    print(f"Raw VI synthesized: {dur_vi:.1f}s")
    master_whisper_voice(raw_vi, out_vi, dur_vi)
    print(f"Mastered voice saved: {out_vi}")
    
    if BACKGROUND_432HZ.exists():
        mix_with_ambient_432hz(out_vi, BACKGROUND_432HZ, out_vi_mixed, dur_vi)
        print(f"Mixed with 432Hz ambient: {out_vi_mixed}")

    raw_en = OUT_DIR / "sample_en_raw.wav"
    out_en = OUT_DIR / "sample_hypnosis_30s_en_voice.mp3"
    out_en_mixed = OUT_DIR / "sample_hypnosis_30s_en_with_432hz.mp3"

    print("\n--- 2. Generating English 30s Hypnosis Sample ---")
    dur_en = synthesize_spaced_audio(EN_PHRASES, REF_FEMALE, raw_en)
    print(f"Raw EN synthesized: {dur_en:.1f}s")
    master_whisper_voice(raw_en, out_en, dur_en)
    print(f"Mastered voice saved: {out_en}")

    if BACKGROUND_432HZ.exists():
        mix_with_ambient_432hz(out_en, BACKGROUND_432HZ, out_en_mixed, dur_en)
        print(f"Mixed with 432Hz ambient: {out_en_mixed}")

    print("\nALL SAMPLES COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
