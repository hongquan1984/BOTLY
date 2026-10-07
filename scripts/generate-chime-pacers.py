import os
import numpy as np
import scipy.signal
import soundfile as sf
import subprocess

SR = 44100

def create_singing_bowl_strike(f0, duration=5.0, gain=0.6, sr=SR):
    """
    Synthesize an organic Tibetan Singing Bowl strike using inharmonic partials
    with subtle beating and exponential decay.
    """
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    
    # Singing bowl partial ratios and relative amplitudes
    partials = [
        (1.000, 1.00, 4.5),   # Fundamental
        (2.712, 0.45, 2.8),   # 2nd partial
        (5.184, 0.20, 1.6),   # 3rd partial
        (8.321, 0.08, 0.9),   # 4th partial
    ]
    
    # Soft attack envelope (25ms) + exponential decay
    attack_samples = int(sr * 0.025)
    attack = np.linspace(0, 1, attack_samples)**2
    env = np.ones_like(t)
    env[:attack_samples] = attack
    
    sig = np.zeros_like(t)
    for ratio, amp, decay_tau in partials:
        freq = f0 * ratio
        # Add subtle natural beating (vibrato/chorus ~ 2.2 Hz)
        beating = 1.0 + 0.12 * np.sin(2 * np.pi * 2.2 * t)
        decay = np.exp(-t / decay_tau)
        sig += amp * np.sin(2 * np.pi * freq * t) * decay * beating
        
    sig = sig * env * gain
    return sig

def create_sleep_frequency_bed(total_duration, sr=SR):
    """
    Warm ambient theta/delta sleep frequency drone (136.1 Hz Om tone with 4.5 Hz Theta binaural difference).
    Low-pass filtered and attenuated to -24 dB for a cozy, non-intrusive bed.
    """
    t = np.linspace(0, total_duration, int(sr * total_duration), endpoint=False)
    
    f_base = 136.1  # Grounding meditative Om frequency
    f_theta = 4.5   # 4.5 Hz Theta wave for sleep onset
    
    # Left channel: f_base - f_theta/2, Right channel: f_base + f_theta/2
    left = np.sin(2 * np.pi * (f_base - f_theta/2) * t) * 0.5 + np.sin(2 * np.pi * (f_base * 0.5) * t) * 0.25
    right = np.sin(2 * np.pi * (f_base + f_theta/2) * t) * 0.5 + np.sin(2 * np.pi * (f_base * 0.5) * t) * 0.25
    
    # Add subtle warm sub-harmonics
    sub = np.sin(2 * np.pi * (f_base * 0.25) * t) * 0.15
    left += sub
    right += sub
    
    # Warm gentle LFO swell (~0.05 Hz, 20s wave)
    swell = 0.85 + 0.15 * np.sin(2 * np.pi * 0.05 * t)
    left *= swell
    right *= swell
    
    # Soft gain at -24 dB (amplitude ~ 0.06)
    drone_gain = 0.065
    stereo_drone = np.vstack([left * drone_gain, right * drone_gain]).T
    return stereo_drone

def build_pacer_track(events, cycle_duration, num_cycles, output_wav, output_mp3, sr=SR):
    """
    events: list of tuples (time_in_cycle, f0, chime_duration, gain)
    """
    total_duration = cycle_duration * num_cycles
    total_samples = int(sr * total_duration)
    chimes_mono = np.zeros(total_samples)
    
    for cycle in range(num_cycles):
        cycle_start_time = cycle * cycle_duration
        for offset, f0, chime_dur, gain in events:
            event_time = cycle_start_time + offset
            event_sample = int(sr * event_time)
            chime = create_singing_bowl_strike(f0, duration=chime_dur, gain=gain, sr=sr)
            end_sample = min(total_samples, event_sample + len(chime))
            chimes_mono[event_sample:end_sample] += chime[:end_sample - event_sample]
            
    # Convert chimes to stereo with gentle spatial spread
    # Inhale slightly warm right, exhale center/deep left
    chimes_left = chimes_mono * 0.95
    chimes_right = chimes_mono * 1.05
    chimes_stereo = np.vstack([chimes_left, chimes_right]).T
    
    # Add sleep frequency bed
    drone_stereo = create_sleep_frequency_bed(total_duration, sr=sr)
    
    mixed = chimes_stereo + drone_stereo
    
    # Normalize peak to -1 dB to prevent clipping
    peak = np.max(np.abs(mixed))
    if peak > 0:
        target_peak = 0.89  # -1 dB
        mixed = (mixed / peak) * target_peak
        
    # Apply micro-fade in/out (5ms) at loop boundary to guarantee click-free looping
    fade_len = int(sr * 0.005)
    fade_in = np.linspace(0, 1, fade_len)[:, None]
    fade_out = np.linspace(1, 0, fade_len)[:, None]
    mixed[:fade_len] *= fade_in
    mixed[-fade_len:] *= fade_out
    
    # Save WAV
    os.makedirs(os.path.dirname(output_wav), exist_ok=True)
    sf.write(output_wav, mixed, sr)
    print(f"Generated WAV: {output_wav} ({total_duration:.2f}s)")
    
    # Convert to MP3
    os.makedirs(os.path.dirname(output_mp3), exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-i", output_wav,
        "-codec:a", "libmp3lame", "-b:a", "192k",
        output_mp3
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"  -> Converted MP3: {output_mp3}")

def main():
    root = r"D:\botly"
    public_pacer_dir = os.path.join(root, "public", "audio", "night-companion", "pacer")
    orig_pacer_dir = os.path.join(root, "Music_Voice", "pacer")
    
    # 1. Coherent 5-5 (10s cycle: 5s Inhale, 5s Exhale) -> 6 cycles = 60s
    print("\n--- Generating 5-5 Coherent Breathing Pacer ---")
    events_5_5 = [
        (0.0, 216.0, 4.8, 0.70),  # Inhale: Higher singing bowl (A3 ~ 216 Hz)
        (5.0, 174.0, 4.8, 0.65),  # Exhale: Lower grounding Solfeggio bowl (F3 ~ 174 Hz)
    ]
    build_pacer_track(
        events_5_5,
        cycle_duration=10.0,
        num_cycles=6,
        output_wav=os.path.join(orig_pacer_dir, "pacer-chime-coherent-5-5.wav"),
        output_mp3=os.path.join(public_pacer_dir, "pacer-chime-coherent-5-5.mp3")
    )
    
    # 2. Box Breathing 4-4-4-4 (16s cycle: 4s In, 4s Hold, 4s Out, 4s Hold) -> 4 cycles = 64s
    print("\n--- Generating 4-4-4-4 Box Breathing Pacer ---")
    events_box = [
        (0.0, 216.0, 3.8, 0.70),   # 1. Inhale (216 Hz)
        (4.0, 256.0, 3.8, 0.60),   # 2. Hold in (256 Hz - Middle C)
        (8.0, 192.0, 3.8, 0.68),   # 3. Exhale (192 Hz - G3)
        (12.0, 162.0, 3.8, 0.60),  # 4. Hold out (162 Hz - Grounding)
    ]
    build_pacer_track(
        events_box,
        cycle_duration=16.0,
        num_cycles=4,
        output_wav=os.path.join(orig_pacer_dir, "pacer-chime-box-4-4-4-4.wav"),
        output_mp3=os.path.join(public_pacer_dir, "pacer-chime-box-4-4-4-4.mp3")
    )
    
    # 3. 4-7-8 Relaxing Breath (19s cycle: 4s In, 7s Hold, 8s Out) -> 4 cycles = 76s
    print("\n--- Generating 4-7-8 Breathing Pacer ---")
    events_478 = [
        (0.0, 216.0, 3.8, 0.70),   # 1. Inhale (4s)
        (4.0, 256.0, 6.5, 0.55),   # 2. Hold (7s) - softly sustains
        (11.0, 144.0, 7.5, 0.72),  # 3. Exhale (8s) - deep, long grounding bowl (D3 ~ 144 Hz)
    ]
    build_pacer_track(
        events_478,
        cycle_duration=19.0,
        num_cycles=4,
        output_wav=os.path.join(orig_pacer_dir, "pacer-chime-4-7-8.wav"),
        output_mp3=os.path.join(public_pacer_dir, "pacer-chime-4-7-8.mp3")
    )

    # 4. Panic / Downshift 4-2-6 (12s cycle: 4s In, 2s Hold, 6s Out) -> 5 cycles = 60s
    print("\n--- Generating 4-2-6 Downshift Breathing Pacer ---")
    events_426 = [
        (0.0, 216.0, 3.8, 0.70),   # 1. Inhale (4s)
        (4.0, 240.0, 1.9, 0.55),   # 2. Hold (2s)
        (6.0, 160.0, 5.8, 0.70),   # 3. Exhale (6s)
    ]
    build_pacer_track(
        events_426,
        cycle_duration=12.0,
        num_cycles=5,
        output_wav=os.path.join(orig_pacer_dir, "pacer-chime-4-2-6.wav"),
        output_mp3=os.path.join(public_pacer_dir, "pacer-chime-4-2-6.mp3")
    )

    print("\nAll 4 Chime Pacer + Sleep Frequency tracks created successfully!")

if __name__ == "__main__":
    main()
