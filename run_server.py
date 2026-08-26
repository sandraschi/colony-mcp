"""PyInstaller entry point."""
import os
import sys

import _strptime  # noqa: F401

sys.path.insert(0, "src")

import uvicorn

from colony_mcp.app import app

# Tauri spawn passes PORT (BACKEND_PORT) via env; frozen sys.argv has no port arg.
port = int(os.getenv("PORT") or (sys.argv[1] if len(sys.argv) > 1 else 10971))
uvicorn.run(app, host="127.0.0.1", port=port)
