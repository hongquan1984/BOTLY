import os
import numpy as np
import scipy.signal
import soundfile as sf
import subprocess

SR = 44100

def butter_lowpass_filter(data, cutoff, fs, order=4):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = scipy.signal.butter(order, normal_cutoff, btype='low', analog=False)
    y = scipy.signal.filtfilt(b, a, data, axis=0)
    return y

def generate_breathing_frequency_track(pattern_name, phase_durations, num_cycles, output_wav, output_mp3, sr=SR):
    """
    Synthesize ambient sleep frequency music with subtle, soft breathing cues.
    
    phase_durations:
      - for 5-5: [('inhale', 5.0), ('exhale', 5.0)]
      - for 4-2-6: [('inhale', 4.0), ('hold_in', 2.0), ('exhale', 6.0)]
      - for 4-7-8: [('inhale', 4.0), ('hold_in', 7.0), ('exhale', 8.0)]
      - for 4-4-4-4: [('inhale', 4.0), ('hold_in', 4.0), ('exhale', 4.0), ('hold_out', 4.0)]
    """
    cycle_duration = sum(dur for _, dur in phase_durations)
    total_duration = cycle_duration * num_cycles
    total_samples = int(sr * total_duration)
    t = np.linspace(0, total_duration, total_samples, endpoint=False)

    print(f"Synthesizing {pattern_name}: cycle={cycle_duration}s, total={total_duration}s ({num_cycles} cycles)...")

    # Base frequencies (A=432 Hz tuning + 174 Hz Solfeggio stress relief)
    f_root = 108.0    # Deep warm root (432 / 4)
    f_solf = 174.0    # 174 Hz Solfeggio foundation
    f_fifth = 162.0   # 108 * 1.5
    f_octave = 216.0  # 432 / 2
    f_high = 432.0    # 432 Hz Solfeggio natural resonance
    theta_diff = 4.0  # 4.0 Hz Theta wave for deep sleep onset

    # Construct the continuous drone bed (very soft, warm, hypnotic)
    # Left channel uses f - theta/2, Right channel uses f + theta/2 for binaural entrainment
    drone_L = (
        0.35 * np.sin(2 * np.pi * (f_root - theta_diff/2) * t) +
        0.25 * np.sin(2 * np.pi * (f_solf - theta_diff/2) * t) +
        0.18 * np.sin(2 * np.pi * (f_fifth) * t) +
        0.12 * np.sin(2 * np.pi * (f_octave - theta_diff/4) * t)
    )
    drone_R = (
        0.35 * np.sin(2 * np.pi * (f_root + theta_diff/2) * t) +
        0.25 * np.sin(2 * np.pi * (f_solf + theta_diff/2) * t) +
        0.18 * np.sin(2 * np.pi * (f_fifth) * t) +
        0.12 * np.sin(2 * np.pi * (f_octave + theta_diff/4) * t)
    )

    # Slow ambient tape-drift chorus (0.03 Hz, subtle and soothing)
    drift = 0.92 + 0.08 * np.sin(2 * np.pi * 0.03 * t)
    drone_L *= drift
    drone_R *= (0.92 + 0.08 * np.cos(2 * np.pi * 0.03 * t))

    # Construct the gentle breathing modulation envelope across cycles
    # Envelope modulates the presence of warm 432 Hz harmonic swell and filter movement
    cycle_samples = int(sr * cycle_duration)
    breath_envelope = np.zeros(total_samples)
    exhale_envelope = np.zeros(total_samples)

    for c in range(num_cycles):
        c_offset = c * cycle_samples
        curr_offset = 0

        for phase, dur in phase_durations:
            p_samples = int(sr * dur)
            phase_t = np.linspace(0, 1, p_samples, endpoint=False)
            start_idx = c_offset + curr_offset
            end_idx = min(total_samples, start_idx + p_samples)
            actual_len = end_idx - start_idx
            if actual_len <= 0:
                continue

            if phase == 'inhale':
                # Smooth, soft, rounded S-curve swell (no sharp attack, no startle)
                # S-curve: 0.5 * (1 - cos(pi * t))
                s_curve = 0.5 * (1.0 - np.cos(np.pi * phase_t[:actual_len]))
                breath_envelope[start_idx:end_idx] = s_curve
                exhale_envelope[start_idx:end_idx] = 0.0

            elif phase == 'hold_in':
                # Peaceful high plateau
                breath_envelope[start_idx:end_idx] = 1.0
                exhale_envelope[start_idx:end_idx] = 0.0

            elif phase == 'exhale':
                # Gentle, melting release descent back to stillness
                s_curve_down = 0.5 * (1.0 + np.cos(np.pi * phase_t[:actual_len]))
                breath_envelope[start_idx:end_idx] = s_curve_down
                # Warm grounding sub-presence during exhale
                exhale_curve = 0.5 * (1.0 - np.cos(2 * np.pi * phase_t[:actual_len]))
                exhale_envelope[start_idx:end_idx] = exhale_curve

            elif phase == 'hold_out':
                # Still, empty restful pause
                breath_envelope[start_idx:end_idx] = 0.0
                exhale_envelope[start_idx:end_idx] = 0.0

            curr_offset += p_samples

    # Inhale warm melodic swell (subtle 432 Hz + 216 Hz gentle harmonics)
    # Soft, pillowy frequency swell that rises seamlessly with breath
    swell_tone_L = (
        0.25 * np.sin(2 * np.pi * f_high * t) +
        0.20 * np.sin(2 * np.pi * (f_octave * 1.5) * t) +
        0.20 * np.sin(2 * np.pi * f_octave * t)
    ) * breath_envelope

    swell_tone_R = (
        0.25 * np.sin(2 * np.pi * (f_high + 1.2) * t) +
        0.20 * np.sin(2 * np.pi * (f_octave * 1.5 - 0.8) * t) +
        0.20 * np.sin(2 * np.pi * (f_octave + 1.0) * t)
    ) * breath_envelope

    # Exhale grounding warmth (deep 108 Hz + 174 Hz warm bass tone to encourage release)
    exhale_tone = 0.28 * np.sin(2 * np.pi * (f_root * 0.75) * t) * exhale_envelope

    # Combine all layers into master stereo
    master_L = drone_L * 0.55 + swell_tone_L * 0.35 + exhale_tone * 0.30
    master_R = drone_R * 0.55 + swell_tone_R * 0.35 + exhale_tone * 0.30

    master_stereo = np.vstack([master_L, master_R]).T

    # Apply 4th order low-pass filter at 550 Hz to remove ALL harshness, metallic bite, and suddenness
    master_filtered = butter_lowpass_filter(master_stereo, cutoff=550.0, fs=sr, order=4)

    # Master Volume: User requested "nhỏ thôi" (low volume, subtle, unobtrusive, no startle)
    # Target peak amplitude: 0.16 (approx -16 dB peak, RMS approx -25 dB)
    current_peak = np.max(np.abs(master_filtered))
    if current_peak > 0:
        target_peak = 0.16  # -15.9 dB
        master_filtered = (master_filtered / current_peak) * target_peak

    # Micro-fade (10ms cosine) at exact boundary to guarantee 100% seamless clickless loop
    fade_len = int(sr * 0.010)
    fade_in = 0.5 * (1 - np.cos(np.pi * np.linspace(0, 1, fade_len)))[:, None]
    fade_out = 0.5 * (1 + np.cos(np.pi * np.linspace(0, 1, fade_len)))[:, None]
    master_filtered[:fade_len] *= fade_in
    master_filtered[-fade_len:] *= fade_out

    # Save master uncompressed WAV
    os.makedirs(os.path.dirname(output_wav), exist_ok=True)
    sf.write(output_wav, master_filtered, sr)

    # Convert to MP3
    os.makedirs(os.path.dirname(output_mp3), exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-i", output_wav,
        "-codec:a", "libmp3lame", "-b:a", "192k",
        output_mp3
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    file_size = os.path.getsize(output_mp3)
    rms_db = 20 * np.log10(np.sqrt(np.mean(master_filtered**2)))
    peak_db = 20 * np.log10(np.max(np.abs(master_filtered)))
    print(f"Generated {pattern_name}: {output_mp3} | Size: {file_size} bytes | Peak: {peak_db:.1f} dB | RMS: {rms_db:.1f} dB")


def main():
    base_wav_dir = r"D:\botly\Music_Voice\pacer"
    public_mp3_dir = r"D:\botly\public\audio\night-companion\pacer"

    tracks = [
        (
            "Coherent 5-5",
            [('inhale', 5.0), ('exhale', 5.0)],
            6, # 60.0s
            os.path.join(base_wav_dir, "pacer-chime-coherent-5-5.wav"),
            os.path.join(public_mp3_dir, "pacer-chime-coherent-5-5.mp3")
        ),
        (
            "Downshift 4-2-6",
            [('inhale', 4.0), ('hold_in', 2.0), ('exhale', 6.0)],
            5, # 60.0s
            os.path.join(base_wav_dir, "pacer-chime-4-2-6.wav"),
            os.path.join(public_mp3_dir, "pacer-chime-4-2-6.mp3")
        ),
        (
            "Relaxing 4-7-8",
            [('inhale', 4.0), ('hold_in', 7.0), ('exhale', 8.0)],
            4, # 76.0s
            os.path.join(base_wav_dir, "pacer-chime-4-7-8.wav"),
            os.path.join(public_mp3_dir, "pacer-chime-4-7-8.mp3")
        ),
        (
            "Box 4-4-4-4",
            [('inhale', 4.0), ('hold_in', 4.0), ('exhale', 4.0), ('hold_out', 4.0)],
            4, # 64.0s
            os.path.join(base_wav_dir, "pacer-chime-box-4-4-4-4.wav"),
            os.path.join(public_mp3_dir, "pacer-chime-box-4-4-4-4.mp3")
        )
    ]

    for name, phases, cycles, wav_path, mp3_path in tracks:
        generate_breathing_frequency_track(name, phases, cycles, wav_path, mp3_path)

    print("\nAll 4 Sleep Frequency Music pacers generated successfully!")

if __name__ == "__main__":
    main()
