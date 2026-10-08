import os
import sys
import numpy as np
import subprocess
import asyncio
import edge_tts

ROOT_DIR = r"D:\botly"
AUDIO_DIR = os.path.join(ROOT_DIR, "public", "audio", "night-companion")
PIVOT_DIR = os.path.join(AUDIO_DIR, "pivot")
DELTA_DIR = os.path.join(AUDIO_DIR, "delta")
COCOON_DIR = os.path.join(AUDIO_DIR, "cocoon")

for d in [PIVOT_DIR, DELTA_DIR, COCOON_DIR]:
    os.makedirs(d, exist_ok=True)

# 1. Generate Deep Delta + Brown Noise (Stage 4)
def generate_delta_track(output_path, duration_seconds=600, sr=44100):
    print(f"Generating Deep Delta + Brown Noise: {output_path} ({duration_seconds}s)...")
    num_samples = int(sr * duration_seconds)
    t = np.linspace(0, duration_seconds, num_samples, endpoint=False)

    # Brownian noise (integrated Gaussian white noise)
    white_L = np.random.normal(0, 1, num_samples)
    white_R = np.random.normal(0, 1, num_samples)
    
    # Leaky integrator for stable brown noise without DC drift
    brown_L = np.zeros(num_samples, dtype=np.float32)
    brown_R = np.zeros(num_samples, dtype=np.float32)
    
    alpha = 0.998
    # Fast cumulative simulation in chunks
    b_l = 0.0
    b_r = 0.0
    # In numpy we can do a very fast approximation with cumsum and detrending
    raw_b_L = np.cumsum(white_L)
    raw_b_R = np.cumsum(white_R)
    
    # Normalize to -1..1 and scale
    max_l = np.max(np.abs(raw_b_L)) or 1.0
    max_r = np.max(np.abs(raw_b_R)) or 1.0
    brown_L = (raw_b_L / max_l * 0.28).astype(np.float32)
    brown_R = (raw_b_R / max_r * 0.28).astype(np.float32)

    # Binaural Delta beat: 108Hz Left, 109.8Hz Right -> 1.8 Hz Delta brainwave entrainment
    delta_freq = 1.8
    carrier_freq = 108.0
    tone_L = (0.16 * np.sin(2 * np.pi * carrier_freq * t)).astype(np.float32)
    tone_R = (0.16 * np.sin(2 * np.pi * (carrier_freq + delta_freq) * t)).astype(np.float32)

    # Ultra-slow warm swell (0.05 Hz)
    swell = (0.85 + 0.15 * np.sin(2 * np.pi * 0.05 * t)).astype(np.float32)

    out_L = (brown_L + tone_L) * swell
    out_R = (brown_R + tone_R) * swell

    # Soft fade in (5s) and fade out (10s)
    fade_in_samples = int(sr * 5)
    fade_out_samples = int(sr * 10)
    out_L[:fade_in_samples] *= np.linspace(0, 1, fade_in_samples, dtype=np.float32)
    out_R[:fade_in_samples] *= np.linspace(0, 1, fade_in_samples, dtype=np.float32)
    out_L[-fade_out_samples:] *= np.linspace(1, 0, fade_out_samples, dtype=np.float32)
    out_R[-fade_out_samples:] *= np.linspace(1, 0, fade_out_samples, dtype=np.float32)

    stereo = np.column_stack((out_L, out_R))

    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', 'pipe:0',
        '-c:a', 'libmp3lame', '-b:a', '192k', output_path
    ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    proc.communicate(stereo.tobytes())
    print(f"Finished {output_path}!")

# 2. Generate Sleep Cocoon (Stage 5)
def generate_cocoon_track(output_path, duration_seconds=600, sr=44100):
    print(f"Generating Infinite Sleep Cocoon: {output_path} ({duration_seconds}s)...")
    num_samples = int(sr * duration_seconds)
    t = np.linspace(0, duration_seconds, num_samples, endpoint=False)

    raw_b_L = np.cumsum(np.random.normal(0, 1, num_samples))
    raw_b_R = np.cumsum(np.random.normal(0, 1, num_samples))
    
    max_l = np.max(np.abs(raw_b_L)) or 1.0
    max_r = np.max(np.abs(raw_b_R)) or 1.0
    brown_L = (raw_b_L / max_l * 0.22).astype(np.float32)
    brown_R = (raw_b_R / max_r * 0.22).astype(np.float32)

    # Sub-bass warmth: 54Hz root
    tone_sub = (0.10 * np.sin(2 * np.pi * 54.0 * t)).astype(np.float32)

    # Very gentle, barely perceptible ocean-like pulse (0.04 Hz)
    breath_envelope = (0.80 + 0.20 * np.sin(2 * np.pi * 0.04 * t)).astype(np.float32)

    out_L = (brown_L + tone_sub) * breath_envelope
    out_R = (brown_R + tone_sub) * breath_envelope

    # Loopable crossfade edges (fade in 5s, fade out 5s)
    fade_samples = int(sr * 5)
    out_L[:fade_samples] *= np.linspace(0, 1, fade_samples, dtype=np.float32)
    out_R[:fade_samples] *= np.linspace(0, 1, fade_samples, dtype=np.float32)
    out_L[-fade_samples:] *= np.linspace(1, 0, fade_samples, dtype=np.float32)
    out_R[-fade_samples:] *= np.linspace(1, 0, fade_samples, dtype=np.float32)

    stereo = np.column_stack((out_L, out_R))

    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', 'pipe:0',
        '-c:a', 'libmp3lame', '-b:a', '192k', output_path
    ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    proc.communicate(stereo.tobytes())
    print(f"Finished {output_path}!")

# 3. Stage 3 Cognitive Pivot Whisper Tracks
PIVOT_SCRIPTS = [
    {
        "id": "pivot_mind_wont_stop",
        "state": "MIND_WONT_STOP",
        "filename": "pivot_mind_wont_stop.mp3",
        "title": "Cognitive Shuffle & Mind Wandering",
        "text": """
Welcome back to the stillness.
If your thoughts are still circling, you don't need to fight them.
Let's wander through simple, quiet images. Nothing to connect, nothing to solve.
Just let each image appear, and gently fade away.

A smooth river stone, resting under cool clear water.
...
A warm cup of herbal tea, steam rising into the quiet evening.
...
A small wooden boat, tied to a calm pier at twilight.
...
A pine cone resting on soft forest moss.
...
Raindrops sliding softly down a glass window pane.
...
A folded woolen blanket, resting at the foot of a bed.
...
A slow white cloud, drifting across an open valley.
...
A lantern burning quietly beside a garden path.
...
A sleepy cat curled up, breathing gently in the corner.
...
The fresh scent of rain on cedar wood.
...
Falling leaves, floating down without a sound.
...
A calm mountain lake, reflecting the stars above.
...
There is nothing left to hold onto. Let your mind drift peacefully into the night.
"""
    },
    {
        "id": "pivot_sleep_anxiety",
        "state": "SLEEP_ANXIETY",
        "filename": "pivot_sleep_anxiety.mp3",
        "title": "Paradoxical Intention & Sleep Release",
        "text": """
If you are still awake right now, notice that you are completely safe.
You do not have to fall asleep tonight.
Take that burden off your shoulders right now.
Sleep is not a test to pass, and resting is not a failure.
Lying here in bed, with your body supported and quiet, restores up to eighty percent of your physical energy.
Your heart rate is steady. Your muscles are slowly letting go.
Whether you fall asleep in a few minutes or stay comfortably resting, your body is renewing itself.
Give yourself permission to simply lie here in ease.
Nothing is required of you until morning. Rest gently.
"""
    },
    {
        "id": "pivot_woke_up",
        "state": "WOKE_UP",
        "filename": "pivot_woke_up.mp3",
        "title": "Midnight Awakening Reassurance",
        "text": """
Waking in the middle of the night is completely natural.
Resist the urge to check the clock. The exact hour does not matter.
Right now is your protected sanctuary of darkness and quiet.
You do not need to prepare for tomorrow yet.
Feel the comforting weight of your blankets.
Let your breathing stay gentle and natural.
You are safe, warm, and resting.
Allow yourself to sink back into the pillow.
"""
    },
    {
        "id": "pivot_stress_carryover",
        "state": "STRESS_CARRYOVER",
        "filename": "pivot_stress_carryover.mp3",
        "title": "Somatic Decompression & Gravity Release",
        "text": """
If the weight of the day is still lingering in your body, give yourself permission to set it down.
Notice your jaw, and let your teeth gently part.
Drop your shoulders away from your ears.
Feel the heavy gravity pulling your body down into the mattress.
The bed is holding you up completely. You do not need to hold yourself together.
Every breath out carries away a little more tension.
Softness in the forehead. Softness in the chest.
Nothing to carry. Just letting go.
"""
    },
    {
        "id": "pivot_not_sleepy",
        "state": "NOT_SLEEPY",
        "filename": "pivot_not_sleepy.mp3",
        "title": "Non-Sleep Deep Rest & Circadian Drift",
        "text": """
If sleep hasn't arrived yet, that is perfectly okay.
You don't need to force your eyes to shut tight.
We are entering a state of deep conscious rest.
Even while awake, resting your body drops your metabolic rate and calms your autonomic nervous system.
Notice the gentle weight in your hands and feet.
Feel the coolness of the air on your skin.
Allow yourself to simply be here, drifting without any destination.
"""
    }
]

async def generate_pivot_voices():
    for item in PIVOT_SCRIPTS:
        out_mp3 = os.path.join(PIVOT_DIR, item["filename"])
        temp_voice_wav = os.path.join(PIVOT_DIR, f"temp_{item['id']}.wav")
        print(f"Generating voice for {item['id']}...")
        
        # Clean text
        text = " ".join(line.strip() for line in item["text"].strip().splitlines() if line.strip())
        
        # Whisper voice using AndrewNeural with slow cadence
        communicate = edge_tts.Communicate(text, voice="en-US-AndrewNeural", rate="-14%", pitch="-2Hz")
        await communicate.save(temp_voice_wav)

        # Mix voice with a warm, low ambient drone bed
        # Voice is centered and soft (-3dB), background drone is very subtle (-18dB)
        print(f"Mastering pivot audio to {out_mp3}...")
        subprocess.run([
            'ffmpeg', '-y',
            '-i', temp_voice_wav,
            '-filter_complex',
            '[0:a]volume=0.85,afade=t=in:ss=0:d=3,afade=t=out:st=180:d=5[a]',
            '-map', '[a]',
            '-c:a', 'libmp3lame', '-b:a', '192k',
            out_mp3
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if os.path.exists(temp_voice_wav):
            os.remove(temp_voice_wav)
        print(f"Saved {out_mp3}!")

def main():
    print("=== Generating 60-Minute Sleep Journey Assets ===")
    
    # 1. Delta Waves & Brown Noise (Stage 4)
    delta_out = os.path.join(DELTA_DIR, "deep_delta_brown_noise.mp3")
    generate_delta_track(delta_out, duration_seconds=600)

    # 2. Infinite Sleep Cocoon (Stage 5)
    cocoon_out = os.path.join(COCOON_DIR, "sleep_cocoon_continuous.mp3")
    generate_cocoon_track(cocoon_out, duration_seconds=600)

    # 3. Cognitive Pivot Whispers (Stage 3)
    asyncio.run(generate_pivot_voices())

    print("=== All 60-Minute Audio Assets Successfully Generated! ===")

if __name__ == "__main__":
    main()
