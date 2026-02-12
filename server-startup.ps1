$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sessionFile = Join-Path $projectRoot ".trilingo.session"

# Abort if already running
if (Test-Path $sessionFile) {
    $session = Get-Content $sessionFile | ConvertFrom-Json
    $alive = @()
    foreach ($pid in @($session.backend_pid, $session.frontend_pid)) {
        if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
            $alive += $pid
        }
    }
    if ($alive.Count -gt 0) {
        Write-Host "Trilingo is already running (PIDs: $($alive -join ', '))" -ForegroundColor Yellow
        Write-Host "Run .\server-shutdown.ps1 first."
        exit 1
    }
    Remove-Item $sessionFile -Force
}

# Add venv to PATH for child processes
$env:PATH = "$projectRoot\venv\Scripts;$projectRoot\venv;$env:PATH"

# Generate a human-friendly passphrase (4 words, ~810k combinations)
$words = @(
    "acorn",  "bloom",  "brave",  "cedar",  "cider",  "cloud",  "coral",  "crane",
    "daisy",  "denim",  "drift",  "ember",  "fable",  "flame",  "forge",  "frost",
    "gleam",  "grove",  "hazel",  "heron",  "ivory",  "jewel",  "knoll",  "latch",
    "lemon",  "lilac",  "maple",  "marsh",  "noble",  "olive",  "onyx",   "opal",
    "pearl",  "plume",  "quail",  "ridge",  "robin",  "sage",   "shore",  "slate",
    "solar",  "spark",  "stone",  "swift",  "thorn",  "torch",  "tulip",  "vivid",
    "waltz",  "wren"
)
$token = ($words | Get-Random -Count 4) -join "-"
$env:TRILINGO_TOKEN = $token

# Start backend (new console window)
$backend = Start-Process -PassThru -FilePath "python.exe" `
    -ArgumentList "-m", "uvicorn", "backend.main:app", "--reload", "--port", "8731" `
    -WorkingDirectory $projectRoot

# Start frontend (new console window)
$frontend = Start-Process -PassThru -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory "$projectRoot\frontend"

# Save session for shutdown
@{
    token        = $token
    backend_pid  = $backend.Id
    frontend_pid = $frontend.Id
} | ConvertTo-Json | Out-File $sessionFile -Encoding UTF8

# Print access info
Write-Host ""
Write-Host "  Trilingo is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "  Password:  $token" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Local:     http://localhost:8732?token=$token" -ForegroundColor White
Write-Host "  Phone:     http://$((Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1).IPAddress):8732?token=$token" -ForegroundColor White
Write-Host ""
Write-Host "  Run .\server-shutdown.ps1 to stop." -ForegroundColor DarkGray
Write-Host ""
