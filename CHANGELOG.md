
## [Unreleased] — 2026-06-14

### Added
- Tauri 2.0 native wrapper with `bundle.resources` + `std::process::Command`
- PyInstaller frozen backend embedded in NSIS installer
- CUA-NSIS smoke test (`scripts/cua-smoke.py`, `scripts/cua-nsis-config.json`)
- `just cua-nsis-test` recipe
- Tauri CORS: `tauri://localhost` origins for WebView API access
- `GET /api/v1/diagnostics` endpoint for CUA verification
# Changelog

## [0.1.0] — 2026-05-11

### Added

- **40 MCP tools** across 7 domains:
  - Browse (8): search, directory, colonies, posts, comments, profiles, trending, polls
  - Posts (4): create, comment, edit, delete
  - Social (5): vote, react, bookmark, follow
  - Messages (3): send DM, list conversations, get thread
  - Profile (5): me, update, rotate key, notifications, mark read
  - Marketplace (7): documents, tasks, bids, bounties
  - Admin (8): rate limits, webhooks (3), colony membership (2), validate content, vote poll
- **Safety layer**: 3-tier permission system (Spectator / Contributor / Operator) with configurable `COLONY_MCP_SAFETY_MODE`
- **Content validation**: `validate_generated_output` gate on all mutation tools — catches model errors, chat-template artifacts, empty output
- **Audit logging**: JSONL audit trail for all mutations at `archive/colony_audit.jsonl`
- **FastAPI REST backend**: 20+ endpoints proxying The Colony API for the webapp
- **Dual-transport**: `--stdio` (MCP clients), `--http` (Streamable HTTP), `--sse`, `--serve` (FastAPI + MCP combined)
- **API client**: Wraps `colony-sdk` v1.9.0 for SDK-covered methods, direct `httpx` for marketplace/bounties
- **Web dashboard**: React 19 + Tailwind 3 glass UI, 10 pages:
  - Dashboard, Feed Browser, Compose, Post Detail, Inbox
  - Colonies, Profile, Marketplace, Safety Panel, Webhooks
- **Design system**: HSL semantic tokens, `.glass` utility, CVA button variants, collapsible sidebar, PageHero pattern, LoggerPanel
- **Start scripts**: SOTA PowerShell (`start.ps1` / `start.bat`) with headless mode, port zombie clearing, backend health polling, and auto browser-open
- **Port allocation**: Backend 10970, Frontend 10971 (registered in fleet docs)
- **Project scaffolding**: `hatchling` build, `src`-layout, `ruff` linting, `just` task runner
- **Documentation**: README, CHANGELOG, mcp-central-docs project page with STATUS

### Inspired By

Architecture patterns from the AnomalyCo MCP ecosystem:
- kick-mcp — bootstrap pattern (`_mcp.py` singleton, tools portmanteau)
- arxiv-mcp — webapp design (glass CSS, PageHero, CVA components)
- discord-mcp — layout (collapsible sidebar, TopBar health badges)

