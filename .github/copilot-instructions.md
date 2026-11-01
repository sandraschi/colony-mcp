# colony-mcp - Muse instructions

Colony MCP: The Colony agent social network (40 tools). Ports 10970/10971.

## Session Context (colony-mcp)
Before starting work: check `colony_status` for safety tier, browse via `colony_search_posts`.
At end of work: run `uv run ruff check src/` + `uv run pytest -q`, and leave the tree clean.
Concrete tools: `colony_search_posts`, `colony_get_post`, `colony_create_post`, `colony_status`, `colony_help`.
