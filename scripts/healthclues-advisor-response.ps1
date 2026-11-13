function Get-SanitizedAdvisorResponseBody {
  param([string]$RawBody, [switch]$IncludeGeneratedPlan)

  if ([string]::IsNullOrWhiteSpace($RawBody)) { return $null }
  try { $parsed = $RawBody | ConvertFrom-Json -ErrorAction Stop } catch { return @{ parseStatus = 'non_json'; bodyOmitted = $true } }

  $safe = [ordered]@{}
  if ($parsed.status -is [string] -and $parsed.status -match '^(AI_UNAVAILABLE|GEMINI_AI|DETERMINISTIC_DEMO)$') { $safe.status = $parsed.status }
  if ($parsed.requestId -is [string] -and $parsed.requestId -match '^[0-9a-fA-F-]{36}$') { $safe.requestId = $parsed.requestId }
  if ($parsed.diagnosticCode -is [string] -and $parsed.diagnosticCode -match '^[A-Z_]{2,48}$') { $safe.diagnosticCode = $parsed.diagnosticCode }
  if ($IncludeGeneratedPlan -and $parsed.status -eq 'GEMINI_AI' -and $parsed.goals -is [array]) {
    $goals = @()
    foreach ($goal in $parsed.goals) {
      if ($goal.goalId -isnot [string] -or $goal.goalId -notmatch '^[a-z0-9-]{1,100}$') { continue }
      $safeGoal = [ordered]@{ goalId = $goal.goalId }
      if ($goal.category -is [string] -and $goal.category -match '^[a-z_]{1,40}$') { $safeGoal.category = $goal.category }
      foreach ($field in @('title', 'relevanceReason')) {
        if ($goal.$field -is [string]) { $value = $goal.$field; $safeGoal[$field] = $value.Substring(0, [Math]::Min(400, $value.Length)) }
      }
      foreach ($optionName in @('optionA', 'optionB')) {
        $option = $goal.$optionName
        if ($option) {
          $safeOption = [ordered]@{}
          foreach ($field in @('title', 'action')) {
            if ($option.$field -is [string]) { $value = $option.$field; $safeOption[$field] = $value.Substring(0, [Math]::Min(500, $value.Length)) }
          }
          if ($option.target) {
            $target = [ordered]@{}
            if ($null -eq $option.target.value -or $option.target.value -is [ValueType]) { $target.value = $option.target.value }
            foreach ($field in @('unit', 'frequency', 'period')) {
              if ($null -eq $option.target.$field -or $option.target.$field -is [string]) { $target[$field] = $option.target.$field }
            }
            $safeOption.target = $target
          }
          $safeGoal[$optionName] = $safeOption
        }
      }
      if ($goal.evidenceSourceIds -is [array]) { $safeGoal.evidenceSourceIds = @($goal.evidenceSourceIds | Where-Object { $_ -is [string] -and $_ -match '^[a-z0-9_-]{1,80}$' } | Select-Object -First 6) }
      if ($goal.safetyConditions -is [array]) { $safeGoal.safetyConditions = @($goal.safetyConditions | Where-Object { $_ -is [string] } | ForEach-Object { $_.Substring(0, [Math]::Min(300, $_.Length)) } | Select-Object -First 6) }
      $goals += $safeGoal
    }
    $safe.goals = $goals
  }
  if ($safe.Count -eq 0) { return @{ bodyOmitted = $true } }
  return $safe
}

function Invoke-HealthCluesAdvisorRequest {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory=$true)][string]$Uri,
    [Parameter(Mandatory=$true)][hashtable]$Body,
    [Parameter(Mandatory=$true)][string]$Origin,
    [string]$RequestId = [guid]::NewGuid().ToString(),
    [switch]$IncludeGeneratedPlan
  )

  $Body.requestId = $RequestId
  $json = ConvertTo-Json -InputObject $Body -Depth 12 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $request = [Net.HttpWebRequest]::Create($Uri)
  $request.Method = 'POST'
  $request.ContentType = 'application/json; charset=utf-8'
  $request.Accept = 'application/json'
  $request.Headers['Origin'] = $Origin
  $request.Headers['x-request-id'] = $RequestId
  $request.Timeout = 60000
  $request.ReadWriteTimeout = 60000
  $request.ContentLength = $bytes.Length
  $stream = $request.GetRequestStream()
  try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }

  $response = $null
  try { $response = $request.GetResponse() }
  catch [Net.WebException] { $response = $_.Exception.Response }
  if ($null -eq $response) {
    return [ordered]@{ applicationStatus = $null; contentType = $null; requestId = $RequestId; body = $null; transportError = 'NO_HTTP_RESPONSE' }
  }
  try {
    $reader = New-Object IO.StreamReader($response.GetResponseStream(), [Text.Encoding]::UTF8, $true)
    try { $raw = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $responseRequestId = $response.Headers['x-request-id']
    $bodySafe = Get-SanitizedAdvisorResponseBody -RawBody $raw -IncludeGeneratedPlan:$IncludeGeneratedPlan
    if (-not $responseRequestId -and $bodySafe -and $bodySafe.requestId) { $responseRequestId = $bodySafe.requestId }
    return [ordered]@{
      applicationStatus = [int]$response.StatusCode
      contentType = [string]$response.ContentType
      requestId = if ($responseRequestId) { $responseRequestId } else { $RequestId }
      body = $bodySafe
    }
  } finally { $response.Dispose() }
}
