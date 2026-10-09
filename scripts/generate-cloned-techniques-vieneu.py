import os
import sys
import time
import json
import hashlib
import numpy as np
import soundfile as sf
import subprocess
from pathlib import Path
from vieneu import Vieneu

# Paths
ROOT_DIR = Path(r"D:\botly")
PIVOT_DIR = ROOT_DIR / "public" / "audio" / "night-companion" / "pivot"
VOICE_DIR = ROOT_DIR / "public" / "audio" / "night-companion" / "voice"
INTRO_DIR = ROOT_DIR / "public" / "audio" / "night-companion" / "intro"
TMP_DIR = Path(r"D:\Autobot\VietVoiceStudio\tmp")

TMP_DIR.mkdir(parents=True, exist_ok=True)
PIVOT_DIR.mkdir(parents=True, exist_ok=True)
VOICE_DIR.mkdir(parents=True, exist_ok=True)
INTRO_DIR.mkdir(parents=True, exist_ok=True)

REF_FEMALE = r"D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\Bedtime Relaxation Recording Brief.mp3"
REF_MALE = r"D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\reference_clean.wav"

SR = 48000

print("Initializing Vieneu TTS Engine...")
t_init = time.perf_counter()
tts = Vieneu()
print(f"Vieneu initialized in {time.perf_counter() - t_init:.2f}s")

# 1. Stage 3 Cognitive Pivot Whisper Scripts
PIVOT_SCRIPTS = [
    {
        "id": "pivot_mind_wont_stop",
        "state": "MIND_WONT_STOP",
        "title": "Cognitive Shuffle & Mind Wandering",
        "phrases": [
            ("Welcome back to the stillness.", 3.5),
            ("If your thoughts are still circling, you don't need to fight them.", 3.5),
            ("Let us wander through simple, quiet images.", 3.0),
            ("Nothing to connect. Nothing to solve.", 3.5),
            ("Just let each image appear, and gently fade away.", 4.0),
            ("A smooth river stone, resting under cool clear water.", 4.5),
            ("A warm cup of herbal tea, steam rising into the quiet evening.", 4.5),
            ("A small wooden boat, tied to a calm pier at twilight.", 4.5),
            ("A pine cone resting on soft forest moss.", 4.5),
            ("Raindrops sliding softly down a glass window pane.", 4.5),
            ("A folded woolen blanket, resting at the foot of a bed.", 4.5),
            ("A slow white cloud, drifting across an open valley.", 4.5),
            ("A lantern burning quietly beside a garden path.", 4.5),
            ("A sleepy cat curled up, breathing gently in the corner.", 4.5),
            ("The fresh scent of rain on cedar wood.", 4.5),
            ("Falling leaves, floating down without a sound.", 4.5),
            ("A calm mountain lake, reflecting the stars above.", 4.5),
            ("There is nothing left to hold onto.", 3.5),
            ("Let your mind drift peacefully into the night.", 4.0),
        ]
    },
    {
        "id": "pivot_sleep_anxiety",
        "state": "SLEEP_ANXIETY",
        "title": "Paradoxical Intention & Sleep Release",
        "phrases": [
            ("If you are still awake right now, notice that you are completely safe.", 3.5),
            ("You do not have to fall asleep tonight.", 3.5),
            ("Take that burden off your shoulders right now.", 3.5),
            ("Sleep is not a test to pass, and resting is not a failure.", 4.0),
            ("Lying here in bed, with your body supported and quiet, restores up to eighty percent of your physical energy.", 4.5),
            ("Your heart rate is steady. Your muscles are slowly letting go.", 4.0),
            ("Whether you fall asleep in a few minutes or stay comfortably resting, your body is renewing itself.", 4.5),
            ("Give yourself permission to simply lie here in ease.", 4.0),
            ("Nothing is required of you until morning.", 3.5),
            ("Rest gently.", 4.0),
        ]
    },
    {
        "id": "pivot_woke_up",
        "state": "WOKE_UP",
        "title": "Midnight Awakening Reassurance",
        "phrases": [
            ("Waking in the middle of the night is completely natural.", 3.5),
            ("Resist the urge to check the clock. The exact hour does not matter.", 4.0),
            ("Right now is your protected sanctuary of darkness and quiet.", 4.0),
            ("You do not need to prepare for tomorrow yet.", 3.5),
            ("Feel the comforting weight of your blankets.", 4.0),
            ("Let your breathing stay gentle and natural.", 4.0),
            ("You are safe, warm, and resting.", 3.5),
            ("Allow yourself to sink back into the pillow.", 4.0),
        ]
    },
    {
        "id": "pivot_stress_carryover",
        "state": "STRESS_CARRYOVER",
        "title": "Somatic Decompression & Gravity Release",
        "phrases": [
            ("If the weight of the day is still lingering in your body, give yourself permission to set it down.", 4.0),
            ("Notice your jaw, and let your teeth gently part.", 4.0),
            ("Drop your shoulders away from your ears.", 4.0),
            ("Feel the heavy gravity pulling your body down into the mattress.", 4.5),
            ("The bed is holding you up completely. You do not need to hold yourself together.", 4.5),
            ("Every breath out carries away a little more tension.", 4.0),
            ("Softness in the forehead. Softness in the chest.", 4.0),
            ("Nothing to carry. Just letting go.", 4.5),
        ]
    },
    {
        "id": "pivot_not_sleepy",
        "state": "NOT_SLEEPY",
        "title": "Non-Sleep Deep Rest NSDR Drift",
        "phrases": [
            ("If sleep has not arrived yet, that is perfectly okay.", 3.5),
            ("You do not need to force your eyes to shut tight.", 3.5),
            ("We are entering a state of deep conscious rest.", 4.0),
            ("Even while awake, resting your body drops your metabolic rate and calms your autonomic nervous system.", 4.5),
            ("Notice the gentle weight in your hands and feet.", 4.0),
            ("Feel the coolness of the air on your skin.", 4.0),
            ("Allow yourself to simply be here, drifting without any destination.", 4.5),
        ]
    }
]

# 2. Stage 1 Guided Breathing Scripts
BREATHING_SCRIPTS = [
    {
        "id": "guided-coherent-5-5",
        "pattern": "5-5",
        "title": "Coherent Breathing 5-5 Rhythm",
        "phrases": [
            ("Welcome to Coherent Breathing. We will breathe in for five seconds, and breathe out for five seconds.", 3.0),
            ("Settle comfortably into your bed, and let your shoulders drop.", 3.5),
            ("Inhale gently... feeling your breath rise.", 4.5),
            ("Exhale softly... letting go completely.", 4.5),
            ("Breathing in... two, three, four, five.", 4.5),
            ("Breathing out... two, three, four, five.", 4.5),
            ("Inhale calm and stillness.", 4.5),
            ("Exhale release and ease.", 4.5),
            ("Feel your heartbeat slowing down, finding harmony with each gentle wave of breath.", 4.0),
            ("Inhale peace.", 4.5),
            ("Exhale surrender.", 4.5),
            ("Now let your breath return to its natural rhythm. Your body is peaceful, grounded, and ready for deep rest.", 4.0),
        ]
    },
    {
        "id": "guided-box-4-4-4-4",
        "pattern": "4-4-4-4",
        "title": "Box Breathing 4-4-4-4 Technique",
        "phrases": [
            ("Welcome to Box Breathing. Four seconds in, four seconds hold, four seconds out, four seconds hold.", 3.0),
            ("This rhythm quiets racing thoughts and resets your nervous system.", 3.5),
            ("Breathe in... two, three, four.", 3.8),
            ("Hold gently... two, three, four.", 3.8),
            ("Breathe out slowly... two, three, four.", 3.8),
            ("Hold empty and calm... two, three, four.", 3.8),
            ("Inhale calmness... two, three, four.", 3.8),
            ("Rest in stillness... two, three, four.", 3.8),
            ("Release smoothly... two, three, four.", 3.8),
            ("Hold in quiet ease... two, three, four.", 3.8),
            ("Gently let go of the count. Feel the peaceful stillness throughout your entire body.", 4.0),
        ]
    },
    {
        "id": "guided-4-7-8",
        "pattern": "4-7-8",
        "title": "4-7-8 Relaxing Breathing",
        "phrases": [
            ("Welcome to four, seven, eight relaxing breathing. Inhale for four, hold for seven, exhale for eight.", 3.0),
            ("This practice signals safety directly to your parasympathetic system.", 3.5),
            ("Inhale smoothly... two, three, four.", 4.0),
            ("Hold gently... two, three, four, five, six, seven.", 6.5),
            ("Exhale softly... two, three, four, five, six, seven, eight.", 7.5),
            ("Inhale quiet peace... two, three, four.", 4.0),
            ("Hold in tranquil stillness... two, three, four, five, six, seven.", 6.5),
            ("Exhale, releasing all the weight of the day... two, three, four, five, six, seven, eight.", 7.5),
            ("Allow your breathing to settle into effortless ease. Sinking deeply into rest.", 4.0),
        ]
    },
    {
        "id": "guided-4-2-6",
        "pattern": "4-2-6",
        "title": "4-2-6 Downshift Breathing",
        "phrases": [
            ("Welcome to four, two, six downshift breathing. Inhale for four seconds, hold for two, and exhale for six.", 3.0),
            ("The extended exhale immediately soothes any tension or restlessness.", 3.5),
            ("Breathe in... two, three, four.", 3.8),
            ("Gentle pause... two.", 1.8),
            ("Exhale long and slow... two, three, four, five, six.", 5.8),
            ("Inhale calm... two, three, four.", 3.8),
            ("Brief pause... two.", 1.8),
            ("Release everything... two, three, four, five, six.", 5.8),
            ("Feel how heavy and relaxed your body has become. You are completely safe.", 4.0),
        ]
    }
]

# 3. Stage 1 Intros
INTRO_SCRIPTS = [
    {
        "id": "night1_intro_mind_wont_stop_en_v2",
        "text": "Welcome. You mentioned that your mind feels busy tonight. For the next few minutes, you don’t need to work through every thought. Let’s begin gently, with no need to force sleep."
    },
    {
        "id": "night1_intro_woke_up_en_v2",
        "text": "Welcome. Waking up during the night happens to all of us. You don't need to restart your night or check the time. Settle into comfort, let your breath stay easy, and let rest be enough for now."
    },
    {
        "id": "night1_intro_general_en_v1",
        "text": "Welcome. For the next few minutes, there is nothing else you need to finish. Settle into a comfortable position. Let your breathing stay natural. You don't need to force sleep. This is simply a little time to rest."
    },
    {
        "id": "night1_intro_sleep_anxiety_en_v1",
        "text": "Welcome. You don't need to make sleep happen during this practice. There is nothing to achieve or get right. Find a restful position, let your shoulders drop, and simply allow yourself a few minutes of quiet ease."
    },
    {
        "id": "night1_intro_stress_carryover_en_v1",
        "text": "Welcome. If the day still feels close, we can begin with a little space to unwind. Settle in and notice your posture. You can let the tension soften without forcing it. Right now, there is nothing else you need to carry."
    },
    {
        "id": "night1_intro_not_sleepy_en_v1",
        "text": "Welcome. If you don't feel sleepy yet, that is completely okay. You can take some quiet time here, rest your body, and return to sleep whenever you feel ready. There's no rush and nothing you need to force."
    }
]

def synthesize_phrases(phrases, ref_audio, raw_wav_path):
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

def master_whisper_audio(raw_wav, out_mp3):
    # Studio-grade Bedtime Whisper Mastering:
    # 1. highpass=f=80 (eliminate sub rumble and mic handling)
    # 2. equalizer 250Hz -3dB (clarify and reduce muddiness)
    # 3. equalizer 3200Hz -4dB (soften harsh sibilance for bedroom listening)
    # 4. equalizer 8500Hz +2.5dB (smooth breathy air shelf)
    # 5. compand (transparent soft leveling for intimate whisper proximity)
    # 6. aecho (very subtle warm room decay, 0.15 wet)
    # 7. afade (smooth fade in/out)
    filter_chain = (
        "highpass=f=80,"
        "equalizer=f=250:t=q:w=1:g=-3,"
        "equalizer=f=3200:t=q:w=1.5:g=-4,"
        "equalizer=f=8500:t=q:w=1:g=+2.5,"
        "compand=attacks=0.08:decays=0.35:points=-80/-80|-40/-35|-20/-16|0/-6:gain=1,"
        "aecho=0.8:0.35:60|120:0.12|0.06,"
        "afade=t=in:ss=0:d=2,"
        "volume=0.88"
    )
    subprocess.run([
        "ffmpeg", "-y", "-i", str(raw_wav),
        "-filter_complex", filter_chain,
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(out_mp3)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def generate_cognitive_pivots():
    print("\n=======================================================")
    print(" 1. GENERATING STAGE 3 COGNITIVE PIVOT WHISPER TRACKS")
    print("=======================================================")
    for item in PIVOT_SCRIPTS:
        pid = item["id"]
        print(f"\nProcessing Pivot: {pid} ({item['title']})")
        
        # Female Whisper (Primary default + _female)
        raw_female = TMP_DIR / f"{pid}_female_raw.wav"
        out_female = PIVOT_DIR / f"{pid}_female.mp3"
        out_default = PIVOT_DIR / f"{pid}.mp3"
        
        print("  -> Generating Female Whisper voice...")
        t0 = time.perf_counter()
        dur_f = synthesize_phrases(item["phrases"], REF_FEMALE, raw_female)
        master_whisper_audio(raw_female, out_female)
        # Also copy female version as default
        import shutil
        shutil.copy2(out_female, out_default)
        print(f"     Female Whisper saved: {out_female} ({dur_f:.1f}s, took {time.perf_counter()-t0:.1f}s)")
        
        # Male Calm (_male)
        raw_male = TMP_DIR / f"{pid}_male_raw.wav"
        out_male = PIVOT_DIR / f"{pid}_male.mp3"
        print("  -> Generating Male Calm voice...")
        t0 = time.perf_counter()
        dur_m = synthesize_phrases(item["phrases"], REF_MALE, raw_male)
        master_whisper_audio(raw_male, out_male)
        print(f"     Male Calm saved: {out_male} ({dur_m:.1f}s, took {time.perf_counter()-t0:.1f}s)")

def generate_guided_breathing():
    print("\n=======================================================")
    print(" 2. GENERATING STAGE 1 GUIDED BREATHING TECHNIQUES")
    print("=======================================================")
    for item in BREATHING_SCRIPTS:
        bid = item["id"]
        print(f"\nProcessing Breathing Technique: {bid} ({item['title']})")
        
        # Female Whisper
        raw_female = TMP_DIR / f"{bid}_female_raw.wav"
        out_female = VOICE_DIR / f"{bid}_female.mp3"
        out_default = VOICE_DIR / f"{bid}.mp3"
        
        print("  -> Generating Female Whisper voice...")
        t0 = time.perf_counter()
        dur_f = synthesize_phrases(item["phrases"], REF_FEMALE, raw_female)
        master_whisper_audio(raw_female, out_female)
        import shutil
        shutil.copy2(out_female, out_default)
        print(f"     Female Whisper saved: {out_female} ({dur_f:.1f}s, took {time.perf_counter()-t0:.1f}s)")
        
        # Male Calm
        raw_male = TMP_DIR / f"{bid}_male_raw.wav"
        out_male = VOICE_DIR / f"{bid}_male.mp3"
        print("  -> Generating Male Calm voice...")
        t0 = time.perf_counter()
        dur_m = synthesize_phrases(item["phrases"], REF_MALE, raw_male)
        master_whisper_audio(raw_male, out_male)
        print(f"     Male Calm saved: {out_male} ({dur_m:.1f}s, took {time.perf_counter()-t0:.1f}s)")

def generate_intros():
    print("\n=======================================================")
    print(" 3. GENERATING STAGE 1 INTROS FOR BOTH VOICES")
    print("=======================================================")
    for item in INTRO_SCRIPTS:
        iid = item["id"]
        text = item["text"]
        print(f"\nProcessing Intro: {iid}")
        
        # Female Whisper
        raw_female = TMP_DIR / f"{iid}_female_raw.wav"
        out_female = INTRO_DIR / f"{iid}_female.mp3"
        out_default = INTRO_DIR / f"{iid}.mp3"
        
        print("  -> Synthesizing Female Intro...")
        audio_f = tts.infer(text, ref_audio=REF_FEMALE, denoise=False)
        sf.write(raw_female, np.asarray(audio_f, dtype=np.float32), SR)
        master_whisper_audio(raw_female, out_female)
        import shutil
        shutil.copy2(out_female, out_default)
        
        # Male Calm
        raw_male = TMP_DIR / f"{iid}_male_raw.wav"
        out_male = INTRO_DIR / f"{iid}_male.mp3"
        print("  -> Synthesizing Male Intro...")
        audio_m = tts.infer(text, ref_audio=REF_MALE, denoise=False)
        sf.write(raw_male, np.asarray(audio_m, dtype=np.float32), SR)
        master_whisper_audio(raw_male, out_male)
        print(f"     Both versions saved for {iid}")

if __name__ == "__main__":
    t_start = time.perf_counter()
    generate_cognitive_pivots()
    generate_guided_breathing()
    generate_intros()
    print(f"\n=======================================================")
    print(f" ALL TECHNIQUES GENERATED & MASTERED IN {time.perf_counter() - t_start:.2f}s!")
    print("=======================================================")
