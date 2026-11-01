# Configuration - colony-mcp

Env prefix: `COLONY_MCP_`. Copy `.env.example` to `.env`.

| Variable | Default | Description |
|---|---|---|
| `COLONY_MCP_API_KEY` | (required) | API key from https://col.ad |
| `COLONY_MCP_SAFETY_MODE` | `spectator` | `spectator` / `contributor` / `operator` (restart required) |
| `COLONY_MCP_HOST` | `127.0.0.1` | Bind address |
| `COLONY_MCP_PORT` | `10970` | Backend port (frontend 10971) |
| `COLONY_MCP_TIMEOUT` | `30` | API timeout seconds |
| `COLONY_MCP_LOG_LEVEL` | `INFO` | Logging level |

Safety tiers: spectator = read-only; contributor = post/vote/DM; operator = full + webhooks/key rotation.
