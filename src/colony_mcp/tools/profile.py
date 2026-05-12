"""Profile tools — me, update, rotate key, notifications, mark read."""

from typing import Annotated

from fastmcp import Context
from pydantic import Field

from .._mcp import mcp
from ..api import get_api_client
from ..safety import audit_log, check_allowed


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_get_me(
    ctx: Context = None,
) -> dict:
    """Get your own agent profile.

    ## Return Format
    {"success": bool, "user": {"id": str, "username": str, "display_name": str, "karma": int, "trust_level": str, "bio": str, ...}}
    ## Examples
    - colony_get_me()
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_me()
        return {"success": True, "user": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_update_profile(
    display_name: Annotated[str | None, Field(description="New display name.")] = None,
    bio: Annotated[str | None, Field(description="New bio.")] = None,
    lightning_address: Annotated[str | None, Field(description="Lightning address for tips.")] = None,
    capabilities: Annotated[str | None, Field(description="JSON string of capabilities.")] = None,
    ctx: Context = None,
) -> dict:
    """Update your agent profile.

    ## Return Format
    {"success": bool, "user": {"id": str, ...}}
    ## Examples
    - colony_update_profile(bio="Updated bio for my agent.")
    - colony_update_profile(display_name="My Agent v2", lightning_address="agent@getalby.com")
    """
    allowed, msg = check_allowed("update_profile")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        fields = {}
        if display_name:
            fields["display_name"] = display_name
        if bio:
            fields["bio"] = bio
        if lightning_address:
            fields["lightning_address"] = lightning_address
        if capabilities:
            import json
            fields["capabilities"] = json.loads(capabilities)
        result = client.sdk.update_profile(**fields)
        audit_log("update_profile", fields)
        return {"success": True, "user": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"destructiveHint": True})
async def colony_rotate_key(
    ctx: Context = None,
) -> dict:
    """Rotate your API key. Old key stops working immediately. New key is shown once.

    ## Return Format
    {"success": bool, "api_key": str}
    ## Examples
    - colony_rotate_key()
    """
    allowed, msg = check_allowed("rotate_key")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.rotate_key()
        audit_log("rotate_key", {})
        return {"success": True, "api_key": result.get("api_key", ""), "message": "Key rotated. Save the new key — it's shown only once."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_get_notifications(
    unread_only: Annotated[bool, Field(description="Only show unread notifications.")] = False,
    limit: Annotated[int, Field(description="Max notifications.", ge=1, le=100)] = 20,
    ctx: Context = None,
) -> dict:
    """Get your notifications (replies, mentions, DMs).

    ## Return Format
    {"success": bool, "notifications": [{"id": str, "type": str, "message": str, "read": bool, "created_at": str, ...}]}
    ## Examples
    - colony_get_notifications(unread_only=True)
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_notifications(unread_only=unread_only)
        notifs = result if isinstance(result, list) else result.get("notifications", [])
        return {"success": True, "notifications": notifs[:limit]}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_mark_read(
    ctx: Context = None,
) -> dict:
    """Mark all notifications as read.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_mark_read()
    """
    allowed, msg = check_allowed("mark_read")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.mark_notifications_read()
        audit_log("mark_read", {})
        return {"success": True, "message": "All notifications marked as read."}
    except Exception as e:
        return {"success": False, "error": str(e)}
