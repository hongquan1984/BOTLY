Add-Type -AssemblyName System.Speech

$files = @(
  @{ name = 'intro_v2'; path = 'D:\botly\tmp_intro_v2.wav' },
  @{ name = 'coherent_5_5'; path = 'D:\botly\tmp_coherent.wav' },
  @{ name = 'guided_478'; path = 'D:\botly\tmp_478.wav' },
  @{ name = 'guided_box'; path = 'D:\botly\tmp_box.wav' }
)

foreach ($item in $files) {
    Write-Host "=== File: $($item.name) ==="
    try {
        $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine([System.Globalization.CultureInfo]::GetCultureInfo('en-US'))
        $grammar = New-Object System.Speech.Recognition.DictationGrammar
        $engine.LoadGrammar($grammar)
        $engine.SetInputToWaveFile($item.path)
        
        $count = 0
        while ($count -lt 5) {
            $result = $engine.Recognize([System.TimeSpan]::FromSeconds(8))
            if ($null -eq $result) { break }
            Write-Host ("  [{0:N1}s]: {1}" -f $result.Audio.AudioPosition.TotalSeconds, $result.Text)
            $count++
        }
        $engine.Dispose()
    } catch {
        Write-Host "Error recognizing $($item.name): $_"
    }
}
