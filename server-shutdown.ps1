$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sessionFile = Join-Path $projectRoot ".trilingo.session"

if (-not (Test-Path $sessionFile)) {
    Write-Host "No active Trilingo session found." -ForegroundColor Yellow
    exit 0
}

$session = Get-Content $sessionFile | ConvertFrom-Json
$killed = 0

foreach ($entry in @(
    @{ Name = "Backend";  ProcessId = $session.backend_pid },
    @{ Name = "Frontend"; ProcessId = $session.frontend_pid }
)) {
    $procId = $entry.ProcessId
    if (-not $procId) { continue }
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $procId -Force
        Write-Host "Stopped $($entry.Name) ($($proc.ProcessName), PID $procId)"
        $killed++
    } else {
        Write-Host "$($entry.Name) (PID $procId) was already stopped" -ForegroundColor DarkGray
    }
}

Remove-Item $sessionFile -Force
Write-Host ""
if ($killed -gt 0) {
    Write-Host "Trilingo shut down ($killed process(es) stopped)." -ForegroundColor Green
} else {
    Write-Host "No running processes found. Session file cleaned up." -ForegroundColor Yellow
}
