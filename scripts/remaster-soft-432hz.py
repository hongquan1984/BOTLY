import subprocess
import shutil
from pathlib import Path

ROOT_DIR = Path(r"D:\botly")
VOICE_DIR = ROOT_DIR / "public" / "audio" / "night-companion" / "voice"
TMP_DIR = Path(r"D:\Autobot\VietVoiceStudio\tmp")

RAW_FEMALE = TMP_DIR / "hypnosis_7min_female_raw.wav"
RAW_MALE = TMP_DIR / "hypnosis_7min_male_raw.wav"
BACKGROUND_432HZ = ROOT_DIR / "public" / "audio" / "night-companion" / "pacer" / "pacer-chime-coherent-5-5.mp3"

TOTAL_SEC = 420.0
FADE_START = TOTAL_SEC - 15.0

def remaster(raw_wav, out_mp3):
    # Studio Mastering:
    # Voice: highpass 80Hz, de-essing at 3200Hz -4dB, breathy air +2.5dB at 8500Hz, warm room reverb
    # 432Hz Ambient Bed: subtle level 0.08 (pure soft harmonic bed, zero clashes with whisper)
    filter_complex = (
        f"[0:a]highpass=f=80,"
        f"equalizer=f=250:t=q:w=1:g=-3,"
        f"equalizer=f=3200:t=q:w=1.5:g=-4,"
        f"equalizer=f=8500:t=q:w=1:g=+2.5,"
        f"compand=attacks=0.08:decays=0.35:points=-80/-80|-40/-35|-20/-16|0/-6:gain=1,"
        f"aecho=0.8:0.35:60|120:0.12|0.06,"
        f"afade=t=in:ss=0:d=2,"
        f"afade=t=out:st={FADE_START:.1f}:d=14[voice];"
        f"[1:a]volume=0.08,aloop=loop=-1:size=2e+09,atrim=0:{TOTAL_SEC},"
        f"afade=t=in:ss=0:d=2,"
        f"afade=t=out:st={FADE_START:.1f}:d=14[bg];"
        f"[voice][bg]amix=inputs=2:duration=first:dropout_transition=2,"
        f"volume=0.95[out]"
    )

    subprocess.run([
        "ffmpeg", "-y",
        "-i", str(raw_wav),
        "-i", str(BACKGROUND_432HZ),
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(out_mp3)
    ], check=True)
    print(f"Mastered: {out_mp3}")

def main():
    print("Remastering 7-minute hypnosis with ultra-soft 432Hz bed (volume=0.08)...")
    out_female = VOICE_DIR / "sleep_hypnosis_7min_female.mp3"
    out_male = VOICE_DIR / "sleep_hypnosis_7min_male.mp3"

    remaster(RAW_FEMALE, out_female)
    remaster(RAW_MALE, out_male)

    # Copy female as default primary tracks
    shutil.copy2(out_female, VOICE_DIR / "guided-coherent-5-5.mp3")
    shutil.copy2(out_female, VOICE_DIR / "guided-coherent-5-5_female.mp3")
    shutil.copy2(out_male, VOICE_DIR / "guided-coherent-5-5_male.mp3")
    print("All voice files successfully remastered and updated!")

if __name__ == "__main__":
    main()
