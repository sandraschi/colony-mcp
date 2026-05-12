Param([switch]$Headless)

$BackendPort  = 10970
$FrontendPort = 10971
$RootDir       = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}

$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

# Clear zombie processes on both ports
Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Killing zombie on port $BackendPort (PID $($_.OwningProcess))" -ForegroundColor Yellow
    Stop-Process -Id $_.OwningProcess -Force
}
Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Killing zombie on port $FrontendPort (PID $($_.OwningProcess))" -ForegroundColor Yellow
    Stop-Process -Id $_.OwningProcess -Force
}

$env:FASTMCP_LOG_LEVEL = "WARNING"

# Determine uv path
$uvExe = if (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
    "$env:USERPROFILE\.local\bin\uv.exe"
} else {
    "uv"
}

Write-Host "Starting colony-mcp backend on port $BackendPort..." -ForegroundColor Cyan
& $uvExe run --project $RootDir python -m colony_mcp --serve --port $BackendPort

Write-Host "Backend started." -ForegroundColor Green
