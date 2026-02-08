$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sessionFile = Join-Path $projectRoot ".trilingo.session"

if (-not (Test-Path $sessionFile)) {
    Write-Host "No active Trilingo session found." -ForegroundColor Yellow
    exit 0
}

$session = Get-Content $sessionFile | ConvertFrom-Json
$killed = 0

foreach ($entry in @(
    @{ Name = "Backend";  PID = $session.backend_pid },
    @{ Name = "Frontend"; PID = $session.frontend_pid }
)) {
    $pid = $entry.PID
    if (-not $pid) { continue }
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $pid -Force
        Write-Host "Stopped $($entry.Name) ($($proc.ProcessName), PID $pid)"
        $killed++
    } else {
        Write-Host "$($entry.Name) (PID $pid) was already stopped" -ForegroundColor DarkGray
    }
}

Remove-Item $sessionFile -Force
Write-Host ""
if ($killed -gt 0) {
    Write-Host "Trilingo shut down ($killed process(es) stopped)." -ForegroundColor Green
} else {
    Write-Host "No running processes found. Session file cleaned up." -ForegroundColor Yellow
}
