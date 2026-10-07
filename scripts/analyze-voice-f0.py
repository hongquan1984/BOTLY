import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import soundfile as sf
import numpy as np
from scipy.signal import correlate

def estimate_pitch(path):
    data, sr = sf.read(path)
    if len(data.shape) > 1:
        data = data.mean(axis=1) # stereo to mono
    
    chunk_size = int(sr * 0.05) # 50ms chunks
    pitches = []
    
    # Analyze up to first 60 seconds
    max_samples = min(len(data), sr * 60)
    for i in range(0, max_samples, chunk_size):
        chunk = data[i:i+chunk_size]
        if np.max(np.abs(chunk)) < 0.02:
            continue
        corr = correlate(chunk, chunk, mode='full')
        corr = corr[len(corr)//2:]
        min_lag = int(sr / 350)
        max_lag = int(sr / 70)
        if len(corr) < max_lag:
            continue
        peak_lag = min_lag + np.argmax(corr[min_lag:max_lag])
        if corr[peak_lag] > 0.3 * corr[0]:
            f0 = sr / peak_lag
            if 70 <= f0 <= 350:
                pitches.append(f0)
                
    if not pitches:
        return 0, 'unknown'
    med = float(np.median(pitches))
    q25 = float(np.percentile(pitches, 25))
    q75 = float(np.percentile(pitches, 75))
    gender = 'Nam (trầm / Male)' if med < 165 else 'Nữ (cao / Female)'
    return med, q25, q75, gender

files = [
    r'D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\reference_clean.wav',
    r'D:\Autobot\VietVoiceStudio\voicegoc\calm_thien\Guinness---In-Pursuit-of-More (1).mp3',
    r'D:\botly\public\audio\night-companion\intro\night1_intro_mind_wont_stop_en_v1.mp3',
    r'D:\botly\public\audio\night-companion\intro\night1_intro_mind_wont_stop_en_v2.mp3',
    r'D:\botly\public\audio\night-companion\intro\night1_intro_woke_up_en_v2.mp3',
    r'D:\botly\public\audio\night-companion\voice\guided-coherent-5-5.mp3',
    r'D:\botly\public\audio\night-companion\voice\guided-4-7-8.mp3',
    r'D:\botly\public\audio\night-companion\voice\guided-box-4-4-4-4.mp3',
]

for f in files:
    if os.path.exists(f):
        med, q25, q75, g = estimate_pitch(f)
        fname = os.path.basename(f)
        print(f'{fname:45} | F0 Median: {med:6.1f} Hz (IQR: {q25:5.1f}-{q75:5.1f} Hz) | Kết luận: {g}')
    else:
        print(f'{f} NOT FOUND')
