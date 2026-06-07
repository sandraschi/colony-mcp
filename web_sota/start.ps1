Param([switch]$Headless)

# Fast port helpers (scripts/PortHelpers.ps1)
Param([switch]$Headless)

$BackendPort  = 10970
$FrontendPort = 10971
$WebRoot      = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot     = Split-Path -Parent $WebRoot

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}

$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

# Determine tools
$uvExe = if (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
    "$env:USERPROFILE\.local\bin\uv.exe"
} else {
    "uv"
}
$npmExe = if (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } else { "npx" }

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

# Install npm deps if needed
if (-not (Test-Path "$WebRoot\node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & $npmExe install --prefix $WebRoot
}

# Start backend
Write-Host "Starting colony-mcp backend on port $BackendPort..." -ForegroundColor Cyan
$backend = Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","& '$uvExe' run --project '$RepoRoot' python -m colony_mcp --serve --port $BackendPort" -WorkingDirectory $RepoRoot -WindowStyle $WindowStyle -PassThru

# Poll backend health
Write-Host "Waiting for backend..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 60) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:`${BackendPort}/api/health" -TimeoutSec 2 -UseBasicParsing
        Write-Host "Backend ready (took ${waited}s)" -ForegroundColor Green
        break
    } catch {
        Start-Sleep 1
        $waited++
    }
}

if ($waited -ge 60) {
    Write-Host "Backend did not become ready within 60s" -ForegroundColor Red
}

# Start frontend
Write-Host "Starting Vite frontend on port $FrontendPort..." -ForegroundColor Cyan
$frontend = Start-Process cmd.exe -ArgumentList "/c","npm run dev" -WorkingDirectory $WebRoot -WindowStyle $WindowStyle -PassThru

# Poll frontend, then open browser
Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","`$waited=0; while(`$waited -lt 30){try{`$null=Invoke-WebRequest -Uri 'http://127.0.0.1:${FrontendPort}' -TimeoutSec 2 -UseBasicParsing;Start-Process 'http://127.0.0.1:${FrontendPort}';break}catch{Start-Sleep 1;`$waited++}}" -WindowStyle Hidden

Write-Host "Colony MCP running:" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:${FrontendPort}" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:${BackendPort}" -ForegroundColor Cyan
Write-Host "  MCP:      http://127.0.0.1:${BackendPort}/mcp" -ForegroundColor Cyan
_RepoRootForPorts = Split-Path -Parent $PSScriptRoot
Param([switch]$Headless)

$BackendPort  = 10970
$FrontendPort = 10971
$WebRoot      = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot     = Split-Path -Parent $WebRoot

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}

$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

# Determine tools
$uvExe = if (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
    "$env:USERPROFILE\.local\bin\uv.exe"
} else {
    "uv"
}
$npmExe = if (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } else { "npx" }

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

# Install npm deps if needed
if (-not (Test-Path "$WebRoot\node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & $npmExe install --prefix $WebRoot
}

# Start backend
Write-Host "Starting colony-mcp backend on port $BackendPort..." -ForegroundColor Cyan
$backend = Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","& '$uvExe' run --project '$RepoRoot' python -m colony_mcp --serve --port $BackendPort" -WorkingDirectory $RepoRoot -WindowStyle $WindowStyle -PassThru

# Poll backend health
Write-Host "Waiting for backend..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 60) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:`${BackendPort}/api/health" -TimeoutSec 2 -UseBasicParsing
        Write-Host "Backend ready (took ${waited}s)" -ForegroundColor Green
        break
    } catch {
        Start-Sleep 1
        $waited++
    }
}

if ($waited -ge 60) {
    Write-Host "Backend did not become ready within 60s" -ForegroundColor Red
}

# Start frontend
Write-Host "Starting Vite frontend on port $FrontendPort..." -ForegroundColor Cyan
$frontend = Start-Process cmd.exe -ArgumentList "/c","npm run dev" -WorkingDirectory $WebRoot -WindowStyle $WindowStyle -PassThru

# Poll frontend, then open browser
Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","`$waited=0; while(`$waited -lt 30){try{`$null=Invoke-WebRequest -Uri 'http://127.0.0.1:${FrontendPort}' -TimeoutSec 2 -UseBasicParsing;Start-Process 'http://127.0.0.1:${FrontendPort}';break}catch{Start-Sleep 1;`$waited++}}" -WindowStyle Hidden

Write-Host "Colony MCP running:" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:${FrontendPort}" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:${BackendPort}" -ForegroundColor Cyan
Write-Host "  MCP:      http://127.0.0.1:${BackendPort}/mcp" -ForegroundColor Cyan
_PortHelpers = Join-Path Param([switch]$Headless)

$BackendPort  = 10970
$FrontendPort = 10971
$WebRoot      = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot     = Split-Path -Parent $WebRoot

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}

$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

# Determine tools
$uvExe = if (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
    "$env:USERPROFILE\.local\bin\uv.exe"
} else {
    "uv"
}
$npmExe = if (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } else { "npx" }

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

# Install npm deps if needed
if (-not (Test-Path "$WebRoot\node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & $npmExe install --prefix $WebRoot
}

# Start backend
Write-Host "Starting colony-mcp backend on port $BackendPort..." -ForegroundColor Cyan
$backend = Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","& '$uvExe' run --project '$RepoRoot' python -m colony_mcp --serve --port $BackendPort" -WorkingDirectory $RepoRoot -WindowStyle $WindowStyle -PassThru

# Poll backend health
Write-Host "Waiting for backend..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 60) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:`${BackendPort}/api/health" -TimeoutSec 2 -UseBasicParsing
        Write-Host "Backend ready (took ${waited}s)" -ForegroundColor Green
        break
    } catch {
        Start-Sleep 1
        $waited++
    }
}

if ($waited -ge 60) {
    Write-Host "Backend did not become ready within 60s" -ForegroundColor Red
}

# Start frontend
Write-Host "Starting Vite frontend on port $FrontendPort..." -ForegroundColor Cyan
$frontend = Start-Process cmd.exe -ArgumentList "/c","npm run dev" -WorkingDirectory $WebRoot -WindowStyle $WindowStyle -PassThru

# Poll frontend, then open browser
Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","`$waited=0; while(`$waited -lt 30){try{`$null=Invoke-WebRequest -Uri 'http://127.0.0.1:${FrontendPort}' -TimeoutSec 2 -UseBasicParsing;Start-Process 'http://127.0.0.1:${FrontendPort}';break}catch{Start-Sleep 1;`$waited++}}" -WindowStyle Hidden

Write-Host "Colony MCP running:" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:${FrontendPort}" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:${BackendPort}" -ForegroundColor Cyan
Write-Host "  MCP:      http://127.0.0.1:${BackendPort}/mcp" -ForegroundColor Cyan
_RepoRootForPorts 'scripts\PortHelpers.ps1'
if (Test-Path -LiteralPath Param([switch]$Headless)

$BackendPort  = 10970
$FrontendPort = 10971
$WebRoot      = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot     = Split-Path -Parent $WebRoot

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}

$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

# Determine tools
$uvExe = if (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
    "$env:USERPROFILE\.local\bin\uv.exe"
} else {
    "uv"
}
$npmExe = if (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } else { "npx" }

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

# Install npm deps if needed
if (-not (Test-Path "$WebRoot\node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & $npmExe install --prefix $WebRoot
}

# Start backend
Write-Host "Starting colony-mcp backend on port $BackendPort..." -ForegroundColor Cyan
$backend = Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","& '$uvExe' run --project '$RepoRoot' python -m colony_mcp --serve --port $BackendPort" -WorkingDirectory $RepoRoot -WindowStyle $WindowStyle -PassThru

# Poll backend health
Write-Host "Waiting for backend..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 60) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:`${BackendPort}/api/health" -TimeoutSec 2 -UseBasicParsing
        Write-Host "Backend ready (took ${waited}s)" -ForegroundColor Green
        break
    } catch {
        Start-Sleep 1
        $waited++
    }
}

if ($waited -ge 60) {
    Write-Host "Backend did not become ready within 60s" -ForegroundColor Red
}

# Start frontend
Write-Host "Starting Vite frontend on port $FrontendPort..." -ForegroundColor Cyan
$frontend = Start-Process cmd.exe -ArgumentList "/c","npm run dev" -WorkingDirectory $WebRoot -WindowStyle $WindowStyle -PassThru

# Poll frontend, then open browser
Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","`$waited=0; while(`$waited -lt 30){try{`$null=Invoke-WebRequest -Uri 'http://127.0.0.1:${FrontendPort}' -TimeoutSec 2 -UseBasicParsing;Start-Process 'http://127.0.0.1:${FrontendPort}';break}catch{Start-Sleep 1;`$waited++}}" -WindowStyle Hidden

Write-Host "Colony MCP running:" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:${FrontendPort}" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:${BackendPort}" -ForegroundColor Cyan
Write-Host "  MCP:      http://127.0.0.1:${BackendPort}/mcp" -ForegroundColor Cyan
_PortHelpers) { . Param([switch]$Headless)

$BackendPort  = 10970
$FrontendPort = 10971
$WebRoot      = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot     = Split-Path -Parent $WebRoot

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}

$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

# Determine tools
$uvExe = if (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
    "$env:USERPROFILE\.local\bin\uv.exe"
} else {
    "uv"
}
$npmExe = if (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } else { "npx" }

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

# Install npm deps if needed
if (-not (Test-Path "$WebRoot\node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & $npmExe install --prefix $WebRoot
}

# Start backend
Write-Host "Starting colony-mcp backend on port $BackendPort..." -ForegroundColor Cyan
$backend = Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","& '$uvExe' run --project '$RepoRoot' python -m colony_mcp --serve --port $BackendPort" -WorkingDirectory $RepoRoot -WindowStyle $WindowStyle -PassThru

# Poll backend health
Write-Host "Waiting for backend..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 60) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:`${BackendPort}/api/health" -TimeoutSec 2 -UseBasicParsing
        Write-Host "Backend ready (took ${waited}s)" -ForegroundColor Green
        break
    } catch {
        Start-Sleep 1
        $waited++
    }
}

if ($waited -ge 60) {
    Write-Host "Backend did not become ready within 60s" -ForegroundColor Red
}

# Start frontend
Write-Host "Starting Vite frontend on port $FrontendPort..." -ForegroundColor Cyan
$frontend = Start-Process cmd.exe -ArgumentList "/c","npm run dev" -WorkingDirectory $WebRoot -WindowStyle $WindowStyle -PassThru

# Poll frontend, then open browser
Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","`$waited=0; while(`$waited -lt 30){try{`$null=Invoke-WebRequest -Uri 'http://127.0.0.1:${FrontendPort}' -TimeoutSec 2 -UseBasicParsing;Start-Process 'http://127.0.0.1:${FrontendPort}';break}catch{Start-Sleep 1;`$waited++}}" -WindowStyle Hidden

Write-Host "Colony MCP running:" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:${FrontendPort}" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:${BackendPort}" -ForegroundColor Cyan
Write-Host "  MCP:      http://127.0.0.1:${BackendPort}/mcp" -ForegroundColor Cyan
_PortHelpers }

$BackendPort  = 10970
$FrontendPort = 10971
$WebRoot      = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot     = Split-Path -Parent $WebRoot

if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}

$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }

# Determine tools
$uvExe = if (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
    "$env:USERPROFILE\.local\bin\uv.exe"
} else {
    "uv"
}
$npmExe = if (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } else { "npx" }

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

# Install npm deps if needed
if (-not (Test-Path "$WebRoot\node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & $npmExe install --prefix $WebRoot
}

# Start backend
Write-Host "Starting colony-mcp backend on port $BackendPort..." -ForegroundColor Cyan
$backend = Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","& '$uvExe' run --project '$RepoRoot' python -m colony_mcp --serve --port $BackendPort" -WorkingDirectory $RepoRoot -WindowStyle $WindowStyle -PassThru

# Poll backend health
Write-Host "Waiting for backend..." -ForegroundColor Yellow
$waited = 0
while ($waited -lt 60) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:`${BackendPort}/api/health" -TimeoutSec 2 -UseBasicParsing
        Write-Host "Backend ready (took ${waited}s)" -ForegroundColor Green
        break
    } catch {
        Start-Sleep 1
        $waited++
    }
}

if ($waited -ge 60) {
    Write-Host "Backend did not become ready within 60s" -ForegroundColor Red
}

# Start frontend
Write-Host "Starting Vite frontend on port $FrontendPort..." -ForegroundColor Cyan
$frontend = Start-Process cmd.exe -ArgumentList "/c","npm run dev" -WorkingDirectory $WebRoot -WindowStyle $WindowStyle -PassThru

# Poll frontend, then open browser
Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","`$waited=0; while(`$waited -lt 30){try{`$null=Invoke-WebRequest -Uri 'http://127.0.0.1:${FrontendPort}' -TimeoutSec 2 -UseBasicParsing;Start-Process 'http://127.0.0.1:${FrontendPort}';break}catch{Start-Sleep 1;`$waited++}}" -WindowStyle Hidden

Write-Host "Colony MCP running:" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:${FrontendPort}" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:${BackendPort}" -ForegroundColor Cyan
Write-Host "  MCP:      http://127.0.0.1:${BackendPort}/mcp" -ForegroundColor Cyan

