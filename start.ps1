param(
    [switch]$Headless,
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$NoBrowser,
    [switch]$ReuseIfRunning
)

# Root shim: the real fleet launcher lives in web_sota/ (WebRoot per fleet-start.config.ps1).
$RealLauncher = Join-Path $PSScriptRoot 'web_sota\start.ps1'
if (-not (Test-Path -LiteralPath $RealLauncher)) {
    Write-Host "ERROR: Missing web_sota/start.ps1" -ForegroundColor Red
    exit 1
}
& $RealLauncher @PSBoundParameters
exit $LASTEXITCODE
