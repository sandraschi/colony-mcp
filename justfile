# Open the interactive recipe dashboard in the browser
default:
    @just --list

sync:
    uv sync --extra dev

lint:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check .

fix:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check --fix .

serve:
    uv run -m colony_mcp --http --port 10970

stdio:
    uv run -m colony_mcp --stdio

test:
    uv run pytest tests/ -v

vendor:
    uv lock --no-cache

