Add-Type -AssemblyName System.Speech

function Transcribe-File($path, $label) {
    Write-Host "=== $label ==="
    $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine([System.Globalization.CultureInfo]::GetCultureInfo('en-US'))
    $grammar = New-Object System.Speech.Recognition.DictationGrammar
    $engine.LoadGrammar($grammar)
    $engine.SetInputToWaveFile($path)
    
    for ($i = 0; $i -lt 8; $i++) {
        try {
            $res = $engine.Recognize([System.TimeSpan]::FromSeconds(5))
            if ($null -eq $res) { break }
            Write-Host ("  [{0:N1}s]: {1}" -f $res.Audio.AudioPosition.TotalSeconds, $res.Text)
        } catch {
            break
        }
    }
    $engine.Dispose()
}

Transcribe-File "D:\botly\tmp_coherent.wav" "Coherent 5-5"
Transcribe-File "D:\botly\tmp_box.wav" "Box 4-4-4-4"
Transcribe-File "D:\botly\tmp_478.wav" "4-7-8"
