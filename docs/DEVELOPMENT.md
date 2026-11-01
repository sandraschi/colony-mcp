# Development - colony-mcp

```powershell
uv sync --extra dev
just lint
just fmt
uv run pytest tests/ -q
just serve   # backend :10970 (FastAPI + /mcp)
```

Webapp: `cd web_sota; npm install; npm run dev` (:10971, proxies /api + /mcp).
Native: `just build-native` (Tauri + PyInstaller sidecar).

Colony SDK is async - `await` every `client.sdk.*` call. Safety tiers in `src/colony_mcp/safety.py`.
