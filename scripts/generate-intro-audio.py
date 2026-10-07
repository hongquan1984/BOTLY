import os
import sys
import json
import shutil
import hashlib
import asyncio
import subprocess
import edge_tts

ROOT_DIR = r"D:\botly"
INTRO_ORIGINAL_DIR = os.path.join(ROOT_DIR, "Music_Voice", "introduce")
INTRO_PUBLIC_DIR = os.path.join(ROOT_DIR, "public", "audio", "night-companion", "intro")
VOICE_PUBLIC_DIR = os.path.join(ROOT_DIR, "public", "audio", "night-companion", "voice")
MUSIC_PUBLIC_DIR = os.path.join(ROOT_DIR, "public", "audio", "night-companion", "music")

MANIFEST_PATH = os.path.join(ROOT_DIR, "public", "audio", "night-companion", "intro_manifest.json")

VOICE_NAME = "en-US-AndrewNeural"
RATE = "-8%"
PITCH = "-1Hz"

SCRIPTS = [
    {
        "id": "night1_intro_general_en_v1",
        "filename": "night1_intro_general_en_v1.mp3",
        "target_state": "GENERAL",
        "title_en": "General Welcome & Gentle Settling",
        "title_vi": "Lời mở đầu chung & Thả lỏng nhẹ nhàng",
        "transcript_en": "Welcome. For the next few minutes, there's nothing else you need to finish. Find a position that feels comfortable. You can close your eyes if you like, or keep them open. Let your breathing stay natural for now. You don't need to force sleep. This is simply a little time to rest.",
        "transcript_vi": "Chào mừng bạn. Trong vài phút tới, bạn không còn việc gì cần phải hoàn thành. Hãy tìm một tư thế nằm thật thoải mái. Bạn có thể nhắm mắt lại nếu muốn, hoặc mở mắt. Cứ để hơi thở tự nhiên như vốn có. Bạn không cần phải ép mình ngủ. Đây đơn giản là một khoảng thời gian nhỏ để bạn được nghỉ ngơi.",
    },
    {
        "id": "night1_intro_mind_wont_stop_en_v1",
        "filename": "night1_intro_mind_wont_stop_en_v1.mp3",
        "target_state": "MIND_WONT_STOP",
        "title_en": "Mind Won't Stop Settling",
        "title_vi": "Lời mở đầu khi suy nghĩ chưa dứt",
        "transcript_en": "Welcome. You mentioned that thoughts keep coming when you lie down. If you like, set one thing aside for tomorrow before we begin. Settle into a comfortable position. You don't need to solve anything tonight. This is simply a quiet space to rest.",
        "transcript_vi": "Chào mừng bạn. Bạn đã chia sẻ rằng những suy nghĩ cứ liên tục xuất hiện khi nằm xuống. Nếu muốn, bạn có thể tạm cất một việc sang ngày mai trước khi bắt đầu. Hãy nằm ở tư thế dễ chịu. Tối nay bạn không cần phải giải quyết chuyện gì nữa. Đây đơn giản là một khoảng lặng để bạn nghỉ ngơi.",
    },
    {
        "id": "night1_intro_sleep_anxiety_en_v1",
        "filename": "night1_intro_sleep_anxiety_en_v1.mp3",
        "target_state": "SLEEP_ANXIETY",
        "title_en": "Sleep Anxiety Downshift",
        "title_vi": "Lời mở đầu giảm áp lực phải ngủ",
        "transcript_en": "Welcome. You don't need to make sleep happen during this practice. There is nothing to achieve or get right. Find a restful position, let your shoulders drop, and simply allow yourself a few minutes of quiet ease.",
        "transcript_vi": "Chào mừng bạn. Bạn không cần phải cố làm cho giấc ngủ đến trong bài thực hành này. Không có mục tiêu nào phải đạt hay phải làm cho đúng. Hãy chọn một tư thế thư thái, thả lỏng bờ vai và cho phép mình có vài phút nhẹ nhàng, êm dịu.",
    },
    {
        "id": "night1_intro_stress_carryover_en_v1",
        "filename": "night1_intro_stress_carryover_en_v1.mp3",
        "target_state": "STRESS_CARRYOVER",
        "title_en": "Stress Carryover Unwind",
        "title_vi": "Lời mở đầu xoa dịu căng thẳng trong ngày",
        "transcript_en": "Welcome. If the day still feels close, we can begin with a little space to unwind. Settle in and notice your posture. You can let the tension soften without forcing it. Right now, there is nothing else you need to carry.",
        "transcript_vi": "Chào mừng bạn. Nếu những chuyện trong ngày vẫn còn quẩn quanh, chúng ta có thể bắt đầu bằng một khoảng nhỏ để thả lỏng. Hãy nằm xuống và cảm nhận cơ thể. Bạn có thể để sự căng thẳng dịu bớt mà không cần gượng ép. Lúc này, bạn không còn phải gánh vác điều gì nữa.",
    },
    {
        "id": "night1_intro_not_sleepy_en_v1",
        "filename": "night1_intro_not_sleepy_en_v1.mp3",
        "target_state": "NOT_SLEEPY",
        "title_en": "Tired but Not Sleepy Ease",
        "title_vi": "Lời mở đầu khi chưa thấy buồn ngủ",
        "transcript_en": "Welcome. If you don't feel sleepy yet, that is completely okay. You can take some quiet time here, rest your body, and return to sleep whenever you feel ready. There's no rush and nothing you need to force.",
        "transcript_vi": "Chào mừng bạn. Nếu bạn chưa thấy buồn ngủ lúc này, điều đó hoàn toàn bình thường. Bạn có thể dành chút thời gian yên tĩnh ở đây, để cơ thể được nghỉ và quay lại ngủ khi sẵn sàng. Không cần vội vã và không có gì phải ép buộc.",
    },
    {
        "id": "night1_intro_woke_up_en_v1",
        "filename": "night1_intro_woke_up_en_v1.mp3",
        "target_state": "WOKE_UP",
        "title_en": "Middle of the Night Return",
        "title_vi": "Lời mở đầu khi tỉnh giấc giữa đêm",
        "transcript_en": "Welcome back. Waking up during the night happens to all of us. You don't need to restart your whole night or check the time. Settle back into comfort, let your breath stay easy, and let rest be enough for now.",
        "transcript_vi": "Chào bạn trở lại. Việc thức giấc giữa đêm là điều ai cũng từng trải qua. Bạn không cần phải làm lại mọi thứ hay kiểm tra xem mấy giờ. Hãy tìm lại tư thế dễ chịu, để hơi thở êm đềm và để sự nghỉ ngơi là đủ cho lúc này.",
    },
]

def get_ffprobe_info(file_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration,size,bit_rate:stream=sample_rate,channels",
        "-of", "json", file_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(res.stdout)
    fmt = data.get("format", {})
    streams = data.get("streams", [{}])
    stream = streams[0] if streams else {}
    return {
        "duration": float(fmt.get("duration", 0)),
        "size_bytes": int(fmt.get("size", 0)),
        "bit_rate": int(fmt.get("bit_rate", 0)),
        "sample_rate": int(stream.get("sample_rate", 0)) if stream.get("sample_rate") else 24000,
        "channels": int(stream.get("channels", 1)) if stream.get("channels") else 1,
    }

def get_sha256(file_path):
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

async def generate_file(item):
    filename = item["filename"]
    orig_path = os.path.join(INTRO_ORIGINAL_DIR, filename)
    public_path = os.path.join(INTRO_PUBLIC_DIR, filename)

    print(f"Generating TTS for {item['id']}...")
    communicate = edge_tts.Communicate(item["transcript_en"], VOICE_NAME, rate=RATE, pitch=PITCH)
    await communicate.save(orig_path)

    # Copy to public dir for web serving
    shutil.copy2(orig_path, public_path)

    info = get_ffprobe_info(orig_path)
    sha = get_sha256(orig_path)

    print(f"  -> Generated: {orig_path}")
    print(f"     Duration: {info['duration']:.2f}s | Size: {info['size_bytes']} bytes | Bitrate: {info['bit_rate']} bps")

    return {
        "asset_id": item["id"],
        "filename": filename,
        "target_state": item["target_state"],
        "title_en": item["title_en"],
        "title_vi": item["title_vi"],
        "local_original_path": orig_path,
        "web_path": f"/audio/night-companion/intro/{filename}",
        "transcript_en": item["transcript_en"],
        "transcript_vi": item["transcript_vi"],
        "voice_name": VOICE_NAME,
        "speech_rate": RATE,
        "speech_pitch": PITCH,
        "duration_seconds": round(info["duration"], 3),
        "size_bytes": info["size_bytes"],
        "sha256": sha,
        "format": "mp3",
        "sample_rate": info["sample_rate"],
        "channels": info["channels"],
        "license": "Microsoft Edge TTS Neural Voice (Used under Microsoft Cognitive Services terms; non-cloned standard neural voice)",
        "intended_use": "Night 1 pre-listening gentle audio introduction; not a medical treatment claim.",
        "created_at": "2026-10-06",
    }

async def main():
    os.makedirs(INTRO_ORIGINAL_DIR, exist_ok=True)
    os.makedirs(INTRO_PUBLIC_DIR, exist_ok=True)
    os.makedirs(VOICE_PUBLIC_DIR, exist_ok=True)
    os.makedirs(MUSIC_PUBLIC_DIR, exist_ok=True)

    manifest_entries = []
    for item in SCRIPTS:
        meta = await generate_file(item)
        manifest_entries.append(meta)

    # Copy guided breathing voices to public
    print("\nCopying existing guided breathing voice tracks to public/audio/night-companion/voice/...")
    voice_sources = [
        ("3 Minute Coherent Breathing 5-5 Rhythm for Instant Calm Anxiety Relief [get-save.com]_voice.mp3", "guided-coherent-5-5.mp3"),
        ("Beginner 4-7-8 Breathing Exercise 5 Minutes Relaxation with Calming Pace Stress Reduction with Calming Pace Stress Reduction with Gentle Waves [get-save.com]_voice.mp3", "guided-4-7-8.mp3"),
        ("3 Minute Box Breathing for Instant Calm 4-4-4-4 Technique [get-save.com]_voice.mp3", "guided-box-4-4-4-4.mp3"),
        ("Panic Out of Nowhere Try 4-2-6 Breathing [get-save.com]_voice.mp3", "guided-4-2-6.mp3"),
    ]

    for src_name, dst_name in voice_sources:
        src_path = os.path.join(ROOT_DIR, "Music_Voice", "voice", src_name)
        dst_path = os.path.join(VOICE_PUBLIC_DIR, dst_name)
        if os.path.exists(src_path):
            shutil.copy2(src_path, dst_path)
            info = get_ffprobe_info(dst_path)
            print(f"  -> Copied {dst_name}: {info['duration']:.2f}s ({info['size_bytes']} bytes)")
        else:
            print(f"  -> Warning: Source not found: {src_path}")

    # Copy background music to public
    print("\nCopying background music tracks to public/audio/night-companion/music/...")
    music_sources = [
        ("rmultimediaeu-ocean-waves-250310.mp3", "ocean-waves.mp3"),
        ("liecio-calming-rain-257596.mp3", "calming-rain.mp3"),
        ("soundreality-nature-forest-sound-537925.mp3", "nature-forest.mp3"),
        ("freesound_community-birds-19624.mp3", "birds.mp3"),
        ("boons_freak-rain-sound-188158.mp3", "rain-sound.mp3"),
    ]

    for src_name, dst_name in music_sources:
        src_path = os.path.join(ROOT_DIR, "Music_Voice", "music", src_name)
        dst_path = os.path.join(MUSIC_PUBLIC_DIR, dst_name)
        if os.path.exists(src_path):
            shutil.copy2(src_path, dst_path)
            info = get_ffprobe_info(dst_path)
            print(f"  -> Copied {dst_name}: {info['duration']:.2f}s ({info['size_bytes']} bytes)")

    # Save manifest
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest_entries, f, indent=2, ensure_ascii=False)
    print(f"\nManifest saved to {MANIFEST_PATH}")

    # Also save to D:\botly\Music_Voice\introduce\manifest.json
    orig_manifest = os.path.join(INTRO_ORIGINAL_DIR, "manifest.json")
    with open(orig_manifest, "w", encoding="utf-8") as f:
        json.dump(manifest_entries, f, indent=2, ensure_ascii=False)
    print(f"Original manifest saved to {orig_manifest}")

    print("\nAll audio files generated, copied, verified and manifested successfully!")

if __name__ == "__main__":
    asyncio.run(main())
