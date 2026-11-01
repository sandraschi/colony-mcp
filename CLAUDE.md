# colony-mcp

FastMCP 3.4 server (43 tools) + FastAPI backend (`src/colony_mcp/app.py`) +
React 19 dashboard (`web_sota/`, Vite :10971). Ports: backend **10970**,
frontend **10971** — never 3000/5000/5173/8000/8080.

## Entry points

- `uv run -m colony_mcp` — stdio (MCP clients); `--serve` — combined FastAPI+MCP on $port
- `web_sota/start.ps1` — fleet launcher (real entry; root `start.ps1` delegates)
- `just lint|fmt|test|ci|serve|mcpb-pack|build-native|cua-nsis-test|cua-webapp-test`

## Rules

- Colony SDK is async (`AsyncColonyClient`) — every `client.sdk.*` call needs `await`.
- Tools return `{"success", ...}` with a `message` or `error` key; mutations pass the safety-tier gate + `validate_generated_output`.
- CORS: explicit origins + regex in `app.py`/`transport.py` — never `["*"]`.
- Frontend uses same-origin `/api` (vite proxy); absolute backend URLs only behind the Tauri gate in `lib/api.ts`.
- `mcpb/pack.ps1` wipes + fresh-copies `src/` → `mcpb/src/`; manifest uses `${__dirname}` + `python -m colony_mcp`.

## Verify

`uv run ruff check src/ tests/`, `uv run --with pyright pyright src/`,
`bun x tsc --noEmit` (in `web_sota/`), `npx biome check src/`, `uv run pytest tests/ -q`.
