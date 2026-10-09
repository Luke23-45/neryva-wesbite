# serve-tunnel.ps1 — keeps the Acme demo publicly reachable over Serveo.
#
# What it does, forever until stopped (Ctrl+C):
#   1. Serves demo/widget on http://127.0.0.1:8081 (python http.server).
#   2. Holds an SSH remote-forward open (serveo.net) and writes the public
#      URL to tunnel.url (same dir) + prints it on every (re)connect.
#   3. Health-checks the public URL every 20s; on failure it kills and
#      re-opens the forward. The URL CHANGES on reconnect — add the new
#      origin to the channel's allowed_domains before proofing.
#
# Usage: powershell -ExecutionPolicy Bypass -File serve-tunnel.ps1
# Stop: Ctrl+C, then: Get-Process python,ssh -ErrorAction SilentlyContinue |
#   Where-Object { $_.Id -ne $PID } | Stop-Process -Force

$ErrorActionPreference = 'SilentlyContinue'
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Log = Join-Path $Dir 'serve-tunnel.log'
$UrlFile = Join-Path $Dir 'tunnel.url'
$SshLog = Join-Path $Dir 'serveo-ssh.log'

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Write-Output $line
  Add-Content -Path $Log -Value $line
}

function Test-Port($port) {
  $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  return $null -ne $c
}

function Start-DemoServer {
  if (Test-Port 8081) { return }
  Log 'demo server down — starting on 127.0.0.1:8081'
  Start-Process -FilePath 'python' -ArgumentList '-m', 'http.server', '8081', '--bind', '127.0.0.1' -WorkingDirectory $Dir | Out-Null
}

function Stop-Serveo {
  Get-Process ssh -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
      if ($cmd -match 'serveo\.net') {
        Stop-Process -Id $_.Id -Force
        Log "killed stale serveo ssh pid $($_.Id)"
      }
    } catch { }
  }
}

function Start-Serveo {
  Stop-Serveo
  Remove-Item -Path $SshLog -Force -ErrorAction SilentlyContinue
  # NOTE: 127.0.0.1, not localhost — localhost may resolve to ::1 while the
  # demo server binds IPv4, which surfaces as edge 502s.
  $sshCmd = '/c ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:127.0.0.1:8081 serveo.net > "' + $SshLog + '" 2>&1'
  Start-Process -FilePath 'cmd.exe' -ArgumentList $sshCmd -PassThru | Out-Null
  Log 'ssh forward starting, waiting for URL…'
  for ($i = 0; $i -lt 6; $i++) {
    Start-Sleep -Seconds 5
    $line = Get-Content -Path $SshLog -ErrorAction SilentlyContinue | Where-Object { $_ -match 'https://[a-z0-9.-]+\.serveousercontent\.com' } | Select-Object -First 1
    if ($line -match '(https://[a-z0-9.-]+\.serveousercontent\.com)') {
      $url = $Matches[1]
      Set-Content -Path $UrlFile -Value $url
      Log "PUBLIC URL: $url"
      return $url
    }
  }
  Log 'no URL issued within 30s'
  return $null
}

function Test-Tunnel($url) {
  if (-not $url) { return $false }
  try {
    $r = Invoke-WebRequest -Uri "$url/index.html" -UseBasicParsing -TimeoutSec 15
    return ($r.StatusCode -eq 200) -and ($r.Content -match 'Acme Corp')
  } catch { return $false }
}

Log '=== serve-tunnel watchdog starting ==='
$currentUrl = $null
if (Test-Path $UrlFile) { $currentUrl = (Get-Content -Path $UrlFile -Raw).Trim() }
$fails = 0

while ($true) {
  Start-DemoServer
  if (Test-Tunnel $currentUrl) {
    if ($fails -gt 0) { Log 'tunnel recovered' }
    $fails = 0
  } else {
    $fails++
    # A fresh forward needs seconds to become servable; only re-open on
    # consecutive failures so one slow probe never burns a good URL
    # (every reopen changes the URL and forces an allowlist update).
    if ($fails -lt 3) {
      Log "health probe failed ($fails/3) — waiting before judging"
    } else {
      Log 'tunnel unhealthy — re-opening (URL will change; update allowed_domains)'
      $currentUrl = Start-Serveo
      $fails = 0
      # Grace period: a fresh forward needs time before the first verdict.
      Start-Sleep -Seconds 20
      if (Test-Tunnel $currentUrl) {
        Log "tunnel healthy: $currentUrl"
      } else {
        Log 'WARNING: fresh tunnel not servable yet — next round judges'
        $fails = 1
      }
    }
  }
  Start-Sleep -Seconds 20
}
