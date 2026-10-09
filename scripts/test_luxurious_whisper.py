import asyncio
import edge_tts
import subprocess
import os
import numpy as np

# Phrases with deliberate pauses
phrases = [
    "Welcome back to the stillness.",
    "If your thoughts are still circling ... you don't need to fight them.",
    "Let's wander through simple, quiet images.",
    "Nothing to connect.",
    "Nothing to solve.",
    "A smooth river stone ... resting under cool clear water.",
    "A warm cup of herbal tea ... steam rising into the quiet evening.",
    "A small wooden boat ... tied to a calm pier at twilight.",
    "A pine cone resting on soft forest moss.",
    "Raindrops sliding softly down a glass window pane.",
    "A folded woolen blanket ... resting at the foot of a bed.",
    "A slow white cloud ... drifting across an open valley.",
    "A lantern burning quietly beside a garden path.",
    "A sleepy cat curled up ... breathing gently in the corner.",
    "The fresh scent of rain on cedar wood.",
    "Falling leaves ... floating down without a sound.",
    "A calm mountain lake ... reflecting the stars above.",
    "There is nothing left to hold onto.",
    "Let your mind drift peacefully into the night."
]

async def make_phrase(text, out_path, voice="en-US-ChristopherNeural"):
    comm = edge_tts.Communicate(text, voice=voice, rate="-26%", pitch="-3Hz")
    await comm.save(out_path)

def make_silence(duration_sec, out_path, sr=44100):
    num_samples = int(sr * duration_sec)
    # Ultra-low, barely audible pink air bed (-45dB) so it doesn't feel like a harsh digital mute
    air = (np.random.normal(0, 0.003, (num_samples, 2))).astype(np.float32)
    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', 'pipe:0',
        '-c:a', 'libmp3lame', '-b:a', '192k', out_path
    ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    proc.communicate(air.tobytes())

async def build_spaced_whisper():
    os.makedirs("temp_whisper", exist_ok=True)
    file_list = []
    
    # 1. Generate silence files (3s and 4.5s)
    silence_3s = "temp_whisper/silence_3s.mp3"
    silence_4s = "temp_whisper/silence_4s.mp3"
    make_silence(3.0, silence_3s)
    make_silence(4.5, silence_4s)

    for i, p in enumerate(phrases):
        p_path = f"temp_whisper/p_{i:02d}.mp3"
        await make_phrase(p, p_path, voice="en-US-ChristopherNeural")
        file_list.append(p_path)
        # Add pause after each phrase (4.5s between imagery, 3s between intro phrases)
        if i < len(phrases) - 1:
            file_list.append(silence_4s if i >= 4 else silence_3s)

    # Concat all files with ffmpeg
    concat_txt = "temp_whisper/concat.txt"
    with open(concat_txt, "w") as f:
        for fpath in file_list:
            f.write(f"file '{os.path.abspath(fpath)}'\n")

    raw_concat = "temp_whisper/raw_concat.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt,
        "-c", "copy", raw_concat
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Master with intimate whisper EQ & soft space
    # 1. High pass at 100Hz (cuts plosive pops)
    # 2. Cut body boom at 250Hz (-4dB) (gives whisper lightness)
    # 3. Soft presence dip at 3.2kHz (-5dB) (removes shouting / conversational harshness)
    # 4. Air boost at 8kHz (+2.5dB) (enhances close breath ASMR)
    # 5. Soft optical compand for intimate proximity
    # 6. Warm ambient room decay
    final_output = "sample_true_bedtime_whisper_christopher.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-i", raw_concat,
        "-filter_complex",
        (
            "highpass=f=90,"
            "equalizer=f=250:t=q:w=1:g=-4,"
            "equalizer=f=3200:t=q:w=1.5:g=-5,"
            "equalizer=f=8000:t=q:w=1:g=+3,"
            "compand=attacks=0.08:decays=0.35:points=-80/-80|-40/-35|-20/-16|0/-6:gain=1,"
            "aecho=0.8:0.35:80|140:0.18|0.08,"
            "volume=0.85"
        ),
        "-c:a", "libmp3lame", "-b:a", "192k",
        final_output
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Mastered spaced bedtime whisper: {final_output}")

    # Also make Ava (female voice) version with same pacing to compare!
    file_list_ava = []
    for i, p in enumerate(phrases):
        p_path = f"temp_whisper/ava_{i:02d}.mp3"
        await make_phrase(p, p_path, voice="en-US-AvaNeural")
        file_list_ava.append(p_path)
        if i < len(phrases) - 1:
            file_list_ava.append(silence_4s if i >= 4 else silence_3s)
            
    concat_ava_txt = "temp_whisper/concat_ava.txt"
    with open(concat_ava_txt, "w") as f:
        for fpath in file_list_ava:
            f.write(f"file '{os.path.abspath(fpath)}'\n")

    raw_ava_concat = "temp_whisper/raw_ava_concat.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_ava_txt,
        "-c", "copy", raw_ava_concat
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    final_ava_output = "sample_true_bedtime_whisper_ava.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-i", raw_ava_concat,
        "-filter_complex",
        (
            "highpass=f=90,"
            "equalizer=f=250:t=q:w=1:g=-4,"
            "equalizer=f=3200:t=q:w=1.5:g=-5,"
            "equalizer=f=8000:t=q:w=1:g=+3,"
            "compand=attacks=0.08:decays=0.35:points=-80/-80|-40/-35|-20/-16|0/-6:gain=1,"
            "aecho=0.8:0.35:80|140:0.18|0.08,"
            "volume=0.85"
        ),
        "-c:a", "libmp3lame", "-b:a", "192k",
        final_ava_output
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Mastered spaced bedtime whisper: {final_ava_output}")

if __name__ == '__main__':
    asyncio.run(build_spaced_whisper())
