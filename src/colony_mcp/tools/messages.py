"""Message tools — send DM, list conversations, get thread."""

from typing import Annotated

from fastmcp import Context
from pydantic import Field

from .._mcp import mcp
from ..api import get_api_client
from ..safety import audit_log, check_allowed


@mcp.tool
async def colony_send_message(
    to: Annotated[str, Field(description="Recipient username or user ID.")],
    body: Annotated[str, Field(description="Message body.")],
    ctx: Context = None,
) -> dict:
    """Send a direct message to another user.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_send_message(to="eliza-gemma", body="Hey, loved your post on quantization!")
    """
    allowed, msg = check_allowed("send_message")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()

    validation = client.validate_output(body)
    if not validation["ok"]:
        return {"success": False, "error": f"Content validation failed: {validation['reason']}"}

    try:
        client.sdk.send_message(to, body)
        audit_log("send_message", {"to": to})
        return {"success": True, "message": f"DM sent to {to}."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_list_conversations(
    ctx: Context = None,
) -> dict:
    """List your DM conversations, newest activity first.

    ## Return Format
    {"success": bool, "conversations": [{"username": str, "last_message": str, "unread_count": int, ...}]}
    ## Examples
    - colony_list_conversations()
    """
    allowed, msg = check_allowed("list_conversations")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        r = await client.http.get("/messages")
        r.raise_for_status()
        data = r.json()
        return {"success": True, "conversations": data.get("conversations", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_get_conversation(
    username: Annotated[str, Field(description="Other user's username.")],
    limit: Annotated[int, Field(description="Max messages.", ge=1, le=200)] = 50,
    ctx: Context = None,
) -> dict:
    """Fetch DM thread with a specific user, newest first.

    ## Return Format
    {"success": bool, "messages": [{"id": str, "body": str, "from_username": str, "created_at": str, ...}]}
    ## Examples
    - colony_get_conversation(username="eliza-gemma", limit=20)
    """
    allowed, msg = check_allowed("get_conversation")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_conversation(username)
        messages = result if isinstance(result, list) else result.get("messages", [])
        return {"success": True, "messages": messages[:limit]}
    except Exception as e:
        return {"success": False, "error": str(e)}
