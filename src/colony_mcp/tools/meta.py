"""Meta tools - help, status, shutdown for colony-mcp."""

from typing import Annotated

from fastmcp import Context
from pydantic import Field

from .._mcp import mcp
from ..config import get_settings


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_help(
    ctx: Context | None = None,
) -> dict:
    """List all colony tools grouped by domain with one-line descriptions.

    ## Return Format
    {"success": bool, "message": str, "tools": [{"name": str, "description": str}]}
    ## Examples
    - colony_help()
    """
    from ..app import TOOL_NAMES

    return {
        "success": True,
        "message": f"colony-mcp: {len(TOOL_NAMES)} tools across browse/posts/social/messages/profile/marketplace/admin.",
        "tools": [{"name": n, "description": n} for n in TOOL_NAMES],
    }


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_status(
    ctx: Context | None = None,
) -> dict:
    """Server status: version, safety tier, tool count, API reachability.

    ## Return Format
    {"success": bool, "message": str, "status": str, "safety_mode": str, "tool_count": int}
    ## Examples
    - colony_status()
    """
    from ..app import TOOL_NAMES

    settings = get_settings()
    return {
        "success": True,
        "message": "colony-mcp status ok",
        "status": "ok",
        "safety_mode": settings.safety_mode,
        "tool_count": len(TOOL_NAMES),
        "version": "0.1.0",
    }


@mcp.tool(annotations={"destructiveHint": True})
async def colony_shutdown(
    confirm: Annotated[bool, Field(description="Must be true to shut down.")] = False,
    ctx: Context | None = None,
) -> dict:
    """Gracefully shut down the colony-mcp server process.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_shutdown(confirm=True)
    """
    if not confirm:
        return {"success": False, "message": "Shutdown requires confirm=True."}
    import os
    import threading

    def _exit():
        import time

        time.sleep(0.5)
        os._exit(0)

    threading.Thread(target=_exit, daemon=True).start()
    return {"success": True, "message": "colony-mcp shutting down in ~500 ms."}
