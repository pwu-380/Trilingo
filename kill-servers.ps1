# Kill any uvicorn/python processes listening on ports 8000-8009
$ports = 8000..8009
$killed = 0

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Killing $($proc.ProcessName) (PID $($proc.Id)) on port $port"
            Stop-Process -Id $proc.Id -Force
            $killed++
        }
    }
}

if ($killed -eq 0) {
    Write-Host "No servers found on ports 8000-8009"
} else {
    Write-Host "Killed $killed process(es)"
}
