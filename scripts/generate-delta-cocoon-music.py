import os
import sys
import subprocess
import numpy as np

sys.stdout.reconfigure(line_buffering=True)
SR = 44100

def create_smooth_brown_noise(num_samples, sr=SR):
    """
    Generate soft, velvety brown/pink noise without DC drift or extreme subsonic rumble.
    Fast FFT frequency shaping: 1/f^0.9 slope, clean subsonic cutoff below 40Hz.
    """
    white = np.random.normal(0, 1, num_samples).astype(np.float32)
    fft = np.fft.rfft(white)
    freqs = np.fft.rfftfreq(num_samples, 1.0 / sr)
    freqs[0] = 1.0
    filter_curve = 1.0 / (freqs ** 0.9)
    filter_curve[freqs < 40] = 0.0
    fft *= filter_curve
    brown = np.fft.irfft(fft, n=num_samples).astype(np.float32)
    max_val = np.max(np.abs(brown)) or 1.0
    return brown / max_val

def generate_delta_music(output_path, duration_seconds=600):
    """
    Stage 4 (40:00 - 55:00): Deep Delta Sleep Synchronization
    A rich, hypnotic, warm ambient sleep soundscape embedded with 1.8Hz Delta Binaural Beats.
    Audible and soothing on phones, earphones, and speakers.
    """
    print(f"Generating Stage 4 Delta Music: {output_path} ({duration_seconds}s)...", flush=True)
    num_samples = int(SR * duration_seconds)
    t = np.linspace(0, duration_seconds, num_samples, endpoint=False)

    # 1. Binaural Delta Beat: 108Hz carrier, 1.8Hz delta difference
    carrier_root = 108.0  # D2
    delta_diff = 1.8      # 1.8 Hz Deep Delta Slow-Wave
    tone_delta_L = 0.22 * np.sin(2 * np.pi * (carrier_root - delta_diff / 2.0) * t)
    tone_delta_R = 0.22 * np.sin(2 * np.pi * (carrier_root + delta_diff / 2.0) * t)

    # Secondary harmonic octave carrier (216Hz / D3) with 1.8Hz delta
    tone_octave_L = 0.14 * np.sin(2 * np.pi * (216.0 - delta_diff / 2.0) * t)
    tone_octave_R = 0.14 * np.sin(2 * np.pi * (216.0 + delta_diff / 2.0) * t)

    # 2. Solfeggio 174 Hz (Tension release) + 5th harmonic (162Hz)
    tone_solfeggio = 0.18 * np.sin(2 * np.pi * 174.0 * t)
    tone_fifth = 0.15 * np.sin(2 * np.pi * 162.0 * t)

    # 3. Ambient Pad Chord Progression (Ethereal slow chords evolving every 30s)
    chord_duration = 30.0
    num_chords = int(np.ceil(duration_seconds / chord_duration))
    
    chords = [
        [108.0, 162.0, 216.0, 243.0, 432.0],  # Dsus2
        [128.5, 162.0, 192.0, 243.0, 324.0],  # Fmaj7
        [144.0, 162.0, 216.0, 288.0, 432.0],  # Gsus2
        [108.0, 128.5, 162.0, 216.0, 432.0],  # Dm
    ]

    ambient_pad_L = np.zeros(num_samples, dtype=np.float32)
    ambient_pad_R = np.zeros(num_samples, dtype=np.float32)

    for i in range(num_chords):
        c_idx = i % len(chords)
        chord_freqs = chords[c_idx]
        start_samp = int(i * chord_duration * SR)
        end_samp = min(num_samples, int((i + 1) * chord_duration * SR))
        seg_len = end_samp - start_samp
        if seg_len <= 0:
            continue
        seg_t = t[start_samp:end_samp]

        # Window envelope for smooth crossfades between chords
        env = 0.5 * (1.0 - np.cos(2 * np.pi * np.linspace(0, 1, seg_len)))
        
        chord_sig_L = np.zeros(seg_len, dtype=np.float32)
        chord_sig_R = np.zeros(seg_len, dtype=np.float32)
        
        for f in chord_freqs:
            chord_sig_L += 0.06 * np.sin(2 * np.pi * (f - 0.25) * seg_t).astype(np.float32)
            chord_sig_R += 0.06 * np.sin(2 * np.pi * (f + 0.25) * seg_t).astype(np.float32)

        ambient_pad_L[start_samp:end_samp] += chord_sig_L * env
        ambient_pad_R[start_samp:end_samp] += chord_sig_R * env

    # 4. Singing Bowl / Bell Resonances (Every 45 seconds, soft chime that fades out)
    bell_L = np.zeros(num_samples, dtype=np.float32)
    bell_R = np.zeros(num_samples, dtype=np.float32)
    strike_interval = 45.0
    num_strikes = int(duration_seconds / strike_interval)
    
    for s in range(num_strikes):
        strike_time = s * strike_interval + 8.0
        start_idx = int(strike_time * SR)
        dur_decay = 16.0
        end_idx = min(num_samples, int((strike_time + dur_decay) * SR))
        strike_len = end_idx - start_idx
        if strike_len <= 0:
            continue
        st = np.linspace(0, dur_decay, strike_len, endpoint=False)
        decay_env = np.exp(-st / 4.2).astype(np.float32)
        
        bowl_tone = (
            0.12 * np.sin(2 * np.pi * 432.0 * st) +
            0.05 * np.sin(2 * np.pi * 864.0 * st) +
            0.02 * np.sin(2 * np.pi * 1296.0 * st)
        ).astype(np.float32) * decay_env

        bell_L[start_idx:end_idx] += bowl_tone
        bell_R[start_idx:end_idx] += bowl_tone * 0.95

    # 5. Velvet Brown Noise Layer
    brown_raw = create_smooth_brown_noise(num_samples, SR)
    swell = (0.75 + 0.25 * np.sin(2 * np.pi * 0.04 * t)).astype(np.float32)
    brown_cushion = brown_raw * swell * 0.18

    master_L = (
        tone_delta_L * 0.65 +
        tone_octave_L * 0.50 +
        tone_solfeggio * 0.40 +
        tone_fifth * 0.35 +
        ambient_pad_L * 0.70 +
        bell_L * 0.45 +
        brown_cushion * 0.50
    ).astype(np.float32)

    master_R = (
        tone_delta_R * 0.65 +
        tone_octave_R * 0.50 +
        tone_solfeggio * 0.40 +
        tone_fifth * 0.35 +
        ambient_pad_R * 0.70 +
        bell_R * 0.45 +
        brown_cushion * 0.50
    ).astype(np.float32)

    fade_in = int(SR * 6)
    fade_out = int(SR * 10)
    master_L[:fade_in] *= np.linspace(0, 1, fade_in, dtype=np.float32)
    master_R[:fade_in] *= np.linspace(0, 1, fade_in, dtype=np.float32)
    master_L[-fade_out:] *= np.linspace(1, 0, fade_out, dtype=np.float32)
    master_R[-fade_out:] *= np.linspace(1, 0, fade_out, dtype=np.float32)

    stereo = np.column_stack((master_L, master_R))

    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', 'pipe:0',
        '-af', 'lowpass=f=750,loudnorm=I=-19:TP=-2:LRA=7',
        '-c:a', 'libmp3lame', '-b:a', '192k', output_path
    ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    proc.communicate(stereo.tobytes())
    print(f"Finished {output_path} successfully!", flush=True)


def generate_cocoon_music(output_path, duration_seconds=600):
    """
    Stage 5 (55:00 - 60:00+): Infinite Sleep Cocoon
    A celestial, timeless ambient cocoon soundscape.
    Seamlessly loopable with warm ethereal chords and protective acoustic cushion.
    """
    print(f"Generating Stage 5 Sleep Cocoon Music: {output_path} ({duration_seconds}s)...", flush=True)
    num_samples = int(SR * duration_seconds)
    t = np.linspace(0, duration_seconds, num_samples, endpoint=False)

    f_root = 108.0    # 108 Hz (D2)
    f_fifth = 162.0   # 162 Hz (A2)
    f_octave = 216.0  # 216 Hz (D3)
    f_third = 270.0   # 270 Hz (F#3)
    f_fifth_h = 324.0 # 324 Hz (A3)
    f_high = 432.0    # 432 Hz (D4)

    mod1 = 0.90 + 0.10 * np.sin(2 * np.pi * 0.025 * t)
    mod2 = 0.90 + 0.10 * np.cos(2 * np.pi * 0.025 * t)

    drone_L = (
        0.26 * np.sin(2 * np.pi * f_root * t) +
        0.20 * np.sin(2 * np.pi * (f_fifth - 0.2) * t) +
        0.18 * np.sin(2 * np.pi * (f_octave + 0.15) * t) +
        0.14 * np.sin(2 * np.pi * (f_third - 0.1) * t) +
        0.10 * np.sin(2 * np.pi * (f_fifth_h + 0.25) * t) +
        0.08 * np.sin(2 * np.pi * (f_high) * t)
    ) * mod1

    drone_R = (
        0.26 * np.sin(2 * np.pi * f_root * t) +
        0.20 * np.sin(2 * np.pi * (f_fifth + 0.2) * t) +
        0.18 * np.sin(2 * np.pi * (f_octave - 0.15) * t) +
        0.14 * np.sin(2 * np.pi * (f_third + 0.1) * t) +
        0.10 * np.sin(2 * np.pi * (f_fifth_h - 0.25) * t) +
        0.08 * np.sin(2 * np.pi * (f_high) * t)
    ) * mod2

    shimmer_env = (0.5 * (1.0 - np.cos(2 * np.pi * 0.025 * t))) ** 2
    shimmer_L = 0.14 * np.sin(2 * np.pi * 432.0 * t) * shimmer_env
    shimmer_R = 0.14 * np.sin(2 * np.pi * (432.0 + 0.4) * t) * shimmer_env

    brown_raw = create_smooth_brown_noise(num_samples, SR)
    cocoon_breath = (0.80 + 0.20 * np.sin(2 * np.pi * 0.033 * t)).astype(np.float32)
    cocoon_cushion = brown_raw * cocoon_breath * 0.15

    master_L = (drone_L * 0.60 + shimmer_L * 0.35 + cocoon_cushion * 0.45).astype(np.float32)
    master_R = (drone_R * 0.60 + shimmer_R * 0.35 + cocoon_cushion * 0.45).astype(np.float32)

    xfade_sec = 15.0
    xfade_samples = int(SR * xfade_sec)
    
    tail_L = master_L[-xfade_samples:].copy()
    tail_R = master_R[-xfade_samples:].copy()
    head_L = master_L[:xfade_samples].copy()
    head_R = master_R[:xfade_samples].copy()

    ramp = np.linspace(0, 1, xfade_samples, dtype=np.float32)
    cos_w = np.cos(0.5 * np.pi * ramp)
    sin_w = np.sin(0.5 * np.pi * ramp)

    blended_head_L = head_L * sin_w + tail_L * cos_w
    blended_head_R = head_R * sin_w + tail_R * cos_w

    master_L[:xfade_samples] = blended_head_L
    master_R[:xfade_samples] = blended_head_R
    master_L[-xfade_samples:] = blended_head_L
    master_R[-xfade_samples:] = blended_head_R

    stereo = np.column_stack((master_L, master_R))

    proc = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', 'pipe:0',
        '-af', 'lowpass=f=680,loudnorm=I=-20:TP=-2:LRA=6',
        '-c:a', 'libmp3lame', '-b:a', '192k', output_path
    ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    proc.communicate(stereo.tobytes())
    print(f"Finished {output_path} successfully!", flush=True)

if __name__ == "__main__":
    delta_out = os.path.join(r"D:\botly\public\audio\night-companion\delta", "deep_delta_brown_noise.mp3")
    cocoon_out = os.path.join(r"D:\botly\public\audio\night-companion\cocoon", "sleep_cocoon_continuous.mp3")
    
    generate_delta_music(delta_out, duration_seconds=600)
    generate_cocoon_music(cocoon_out, duration_seconds=600)
    print("ALL STAGE 4 & STAGE 5 TRACKS GENERATED WITH TRUE SLEEP AMBIENT MUSIC!", flush=True)
