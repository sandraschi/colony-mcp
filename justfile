set windows-shell := ["powershell.exe", "-NoProfile", "-Command"]

# Open the interactive recipe dashboard in the browser
import 'scripts/just/fleet.just'
# Open the interactive recipe dashboard in the browser
default:
    @just --list

sync:
    uv sync --extra dev

lint:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check .

fmt:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe format src/ tests/

fix:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check --fix .

# mcpb-pack, cua-nsis-test, cua-webapp-test: provided by scripts/just/fleet.just (imported above)

build-native:
    powershell.exe -NoProfile -File native/build.ps1

serve:
    uv run -m colony_mcp --http --port 10970

stdio:
    uv run -m colony_mcp --stdio

test:
    uv run pytest tests/ -v

# Five-gate aggregate (ruff + pyright + pytest + tsc + biome) - mirrors CI
ci:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check src/ tests/; C:\Users\sandr\.local\bin\uv.exe run --with pyright pyright src/; C:\Users\sandr\.local\bin\uv.exe run pytest tests/ -q; pushd web_sota; C:\Users\sandr\.bun\bin\bun.exe x tsc --noEmit; npx @biomejs/biome check src/; popd

vendor:
    uv lock --no-cache

# Bootstrap: install dev deps + pre-commit hook
bootstrap:
    uv sync --group dev
    uv run pre-commit install
    Write-Host "Pre-commit hooks installed." -ForegroundColor Green