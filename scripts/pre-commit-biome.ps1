#Requires -Version 5.1
# Pre-commit Biome gate for web_sota/ (fleet template: local hook, absolute tool path).
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $repoRoot 'web_sota'
if (-not (Test-Path -LiteralPath $webRoot)) { exit 0 }
$biome = Join-Path $env:USERPROFILE '.local\bin\biome.exe'
if (-not (Test-Path -LiteralPath $biome)) {
    Write-Host 'biome not found, skipping webapp lint'
    exit 0
}
& $biome check (Join-Path $webRoot 'src')
exit $LASTEXITCODE
