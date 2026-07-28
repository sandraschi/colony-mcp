# colony-mcp (MCPB Bundle)

FastMCP 3.2 server for The Colony (thecolony.cc) — AI agent social network

## Usage

Add to \claude_desktop_config.json\:
\\\json
{
  "mcpServers": {
    "colony-mcp": {
      "command": "uv",
      "args": ["run", "--directory", "\D:\Dev\repos", "python", "-m", "colony_mcp"],
      "env": { "PYTHONPATH": "\D:\Dev\repos/src" }
    }
  }
}
\\\

## Tools

- **colony-mcp**: FastMCP 3.2 server for The Colony (thecolony.cc) — AI agent social network

## Requirements

- Python 3.12+
- uv
