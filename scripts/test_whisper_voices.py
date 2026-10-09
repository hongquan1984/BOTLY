import asyncio
import edge_tts
import subprocess
import os

sample_text = (
    "Welcome back to the stillness. ... "
    "If your thoughts are still circling ... you don't need to fight them. ... "
    "Let's wander through simple, quiet images. ... "
    "Nothing to connect. ... Nothing to solve. ... "
    "A smooth river stone ... resting under cool clear water. ... "
    "A warm cup of herbal tea ... steam rising into the quiet evening."
)

voices = [
    ("en-US-AvaNeural", "-22%", "-2Hz", "ava"),
    ("en-US-JennyNeural", "-24%", "-3Hz", "jenny"),
    ("en-US-ChristopherNeural", "-22%", "-3Hz", "christopher"),
    ("en-US-AndrewNeural", "-25%", "-3Hz", "andrew_slow"),
]

async def generate_samples():
    for voice, rate, pitch, tag in voices:
        raw_mp3 = f"sample_{tag}_raw.mp3"
        comm = edge_tts.Communicate(sample_text, voice=voice, rate=rate, pitch=pitch)
        await comm.save(raw_mp3)

        # Process with ffmpeg:
        # 1. Warm EQ: boost warm low (120Hz +2dB), reduce harsh presence (3.5kHz -4dB), keep airy highs (8kHz +1.5dB)
        # 2. Soft compressor for intimate proximity
        # 3. Ambient room reverb (delicate soft decay)
        processed_mp3 = f"sample_{tag}_whisper.mp3"
        subprocess.run([
            "ffmpeg", "-y", "-i", raw_mp3,
            "-filter_complex",
            (
                "equalizer=f=3200:t=q:w=1.5:g=-5,"
                "equalizer=f=180:t=q:w=1:g=+2,"
                "equalizer=f=7500:t=q:w=1:g=+1,"
                "compand=attacks=0.1:decays=0.3:points=-80/-80|-35/-30|-20/-16|0/-6:gain=1,"
                "aecho=0.8:0.4:60|120:0.2|0.1,"
                "volume=0.85"
            ),
            "-c:a", "libmp3lame", "-b:a", "192k",
            processed_mp3
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Generated sample: {processed_mp3}")

if __name__ == '__main__':
    asyncio.run(generate_samples())
