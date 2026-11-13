import os
import sys
import subprocess
import numpy as np
import soundfile as sf
from pathlib import Path
from vieneu import Vieneu

ROOT_DIR = Path(r"D:\botly")
OUT_DIR = ROOT_DIR / "public" / "audio" / "night-companion" / "sample-hypnosis"
OUT_DIR.mkdir(parents=True, exist_ok=True)

REF_FEMALE = r"D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\Bedtime Relaxation Recording Brief.mp3"
BACKGROUND_432HZ = ROOT_DIR / "public" / "audio" / "night-companion" / "pacer" / "pacer-chime-coherent-5-5.mp3"

SR = 48000

# Clinical Sleep Hypnosis Script (Ericksonian Framework - English)
# 1. Pacing (Sensory grounding)
# 2. Leading (Somatic release)
# 3. Double-bind & Paradoxical permission
# 4. Dissolution into theta drift
CLINICAL_HYPNOSIS_PHRASES = [
    ("Notice the weight of your body resting against the mattress, completely supported.", 4.0),
    ("There is nothing you need to accomplish right now, and nothing you need to fix.", 4.0),
    ("Let your jaw gently unclench, and feel your shoulders drop away from the tension of the day.", 4.5),
    ("With every natural breath out, you can allow yourself to sink just a little deeper.", 4.5),
    ("You can choose to listen to my voice, or simply let it blur into the quiet space around you.", 5.0),
    ("Resting here is already healing your body. Sleep will find you in its own time.", 4.0),
]

def synthesize_spaced_audio(phrases, ref_audio, raw_wav_path):
    print("Initializing Vieneu TTS Engine...")
    tts = Vieneu()
    all_chunks = []
    for text, pause_sec in phrases:
        print(f"  Synthesizing chunk: {text[:45]}...")
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
    fade_st = max(0.0, duration - 3.0)
    filter_chain = (
        "highpass=f=80,"
        "equalizer=f=250:t=q:w=1:g=-3,"
        "equalizer=f=3200:t=q:w=1.5:g=-4,"
        "equalizer=f=8500:t=q:w=1:g=+2.5,"
        "compand=attacks=0.08:decays=0.35:points=-80/-80|-40/-35|-20/-16|0/-6:gain=1,"
        "aecho=0.8:0.35:60|120:0.12|0.06,"
        "afade=t=in:ss=0:d=1.5,"
        f"afade=t=out:st={fade_st:.2f}:d=3.0,"
        "volume=0.9"
    )
    subprocess.run([
        "ffmpeg", "-y", "-i", str(raw_wav),
        "-filter_complex", filter_chain,
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(out_mp3)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def mix_with_ambient_432hz(voice_mp3, ambient_mp3, out_mixed_mp3, duration):
    fade_st = max(0.0, duration - 3.0)
    filter_complex = (
        "[0:a]volume=1.0[voice];"
        "[1:a]volume=0.22,aloop=loop=-1:size=2e+09[bg];"
        "[voice][bg]amix=inputs=2:duration=first:dropout_transition=2,"
        f"afade=t=out:st={fade_st:.2f}:d=3.0[out]"
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
    raw_wav = OUT_DIR / "clinical_hypnosis_demo_raw.wav"
    out_voice = OUT_DIR / "clinical_hypnosis_demo_voice.mp3"
    out_mixed = OUT_DIR / "clinical_hypnosis_demo_432hz.mp3"

    print("\n--- Generating Clinical Sleep Hypnosis Demo (English) ---")
    dur = synthesize_spaced_audio(CLINICAL_HYPNOSIS_PHRASES, REF_FEMALE, raw_wav)
    print(f"Total duration: {dur:.1f}s")
    master_whisper_voice(raw_wav, out_voice, dur)
    print(f"Mastered voice saved: {out_voice}")

    if BACKGROUND_432HZ.exists():
        mix_with_ambient_432hz(out_voice, BACKGROUND_432HZ, out_mixed, dur)
        print(f"Mixed with 432Hz ambient saved: {out_mixed}")

    print("\nCLINICAL HYPNOSIS DEMO GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
