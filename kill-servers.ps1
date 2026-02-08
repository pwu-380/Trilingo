# Kill Trilingo dev servers (backend on 8731, frontend on 8732)
$ports = @(8731, 8732)
$killed = 0

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -match '^(python|node)$') {
            Write-Host "Killing $($proc.ProcessName) (PID $($proc.Id)) on port $port"
            Stop-Process -Id $proc.Id -Force
            $killed++
        } elseif ($proc) {
            Write-Host "Skipping non-Trilingo process: $($proc.ProcessName) (PID $($proc.Id)) on port $port"
        }
    }
}

if ($killed -eq 0) {
    Write-Host "No Trilingo servers found"
} else {
    Write-Host "Killed $killed process(es)"
}
