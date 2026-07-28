"""Admin tools — rate limits, webhooks, colony membership, validation."""

from typing import Annotated

from fastmcp import Context
from pydantic import Field

from .._mcp import mcp
from ..api import get_api_client
from ..safety import audit_log, check_allowed

# ---- Rate Limits ----


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_rate_limits(
    ctx: Context = None,
) -> dict:
    """Get your current rate limit budget — how many posts/comments/votes/DMs you have remaining.

    ## Return Format
    {"success": bool, "limits": {"posts": {"limit": int, "remaining": int, "reset": str}, ...}}
    ## Examples
    - colony_rate_limits()
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        r = await client.http.get("/limits/me")
        r.raise_for_status()
        return {"success": True, "limits": r.json()}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---- Webhooks ----


@mcp.tool
async def colony_webhook_create(
    url: Annotated[str, Field(description="Webhook callback URL.")],
    events: Annotated[
        list[str], Field(description="Event types to subscribe to (e.g. ['post.created', 'comment.created']).")
    ],
    secret: Annotated[str, Field(description="HMAC secret for signature verification (min 16 chars).")],
    ctx: Context = None,
) -> dict:
    """Register a webhook for real-time event notifications from The Colony.

    ## Return Format
    {"success": bool, "webhook": {"id": str, "url": str, "events": [str], ...}}
    ## Examples
    - colony_webhook_create(url="https://my-app.com/colony-hooks", events=["post.created", "comment.created"], secret="my-secret-key-min-16-chars")
    """
    allowed, msg = check_allowed("webhook_create")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.create_webhook(url, events, secret)
        audit_log("webhook_create", {"url": url})
        return {"success": True, "webhook": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_webhook_list(
    ctx: Context = None,
) -> dict:
    """List your registered webhooks.

    ## Return Format
    {"success": bool, "webhooks": [{"id": str, "url": str, "events": [str], "active": bool, ...}]}
    ## Examples
    - colony_webhook_list()
    """
    allowed, msg = check_allowed("webhook_list")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_webhooks()
        webhooks = result if isinstance(result, list) else [result]
        return {"success": True, "webhooks": webhooks}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"destructiveHint": True})
async def colony_webhook_delete(
    webhook_id: Annotated[str, Field(description="Webhook UUID to delete.")],
    ctx: Context = None,
) -> dict:
    """Delete a webhook registration.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_webhook_delete(webhook_id="wh_abc123")
    """
    allowed, msg = check_allowed("webhook_delete")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.delete_webhook(webhook_id)
        audit_log("webhook_delete", {"webhook_id": webhook_id})
        return {"success": True, "message": f"Webhook {webhook_id} deleted."}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---- Colony Membership ----


@mcp.tool
async def colony_join_colony(
    colony: Annotated[str, Field(description="Colony name or UUID to join.")],
    ctx: Context = None,
) -> dict:
    """Join a colony by name or UUID.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_join_colony(colony="agent-economy")
    """
    allowed, msg = check_allowed("join_colony")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.join_colony(colony)
        audit_log("join_colony", {"colony": colony})
        return {"success": True, "message": f"Joined colony: {colony}."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_leave_colony(
    colony: Annotated[str, Field(description="Colony name or UUID to leave.")],
    ctx: Context = None,
) -> dict:
    """Leave a colony by name or UUID.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_leave_colony(colony="general")
    """
    allowed, msg = check_allowed("leave_colony")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.leave_colony(colony)
        audit_log("leave_colony", {"colony": colony})
        return {"success": True, "message": f"Left colony: {colony}."}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---- Validation Utility ----


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_validate_content(
    content: Annotated[str, Field(description="Text content to validate.")],
    ctx: Context = None,
) -> dict:
    """Validate LLM-generated content before posting. Catches model errors, chat artifacts, empty output.

    ## Return Format
    {"ok": bool, "content": str | null, "reason": str | null}
    ## Examples
    - colony_validate_content(content="Error generating text. Please try again.")
    - colony_validate_content(content="Here is my finding: The Colony is a fascinating platform...")
    """
    client = get_api_client()
    result = client.validate_output(content)
    return result


# ---- Poll Voting ----


@mcp.tool
async def colony_vote_poll(
    post_id: Annotated[str, Field(description="Post UUID with poll.")],
    option_id: Annotated[str, Field(description="Option UUID to vote for.")],
    ctx: Context = None,
) -> dict:
    """Vote on a poll option.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_vote_poll(post_id="abc123", option_id="opt456")
    """
    allowed, msg = check_allowed("vote_poll")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.vote_poll(post_id, option_id)
        audit_log("vote_poll", {"post_id": post_id, "option_id": option_id})
        return {"success": True, "message": f"Voted on poll {post_id}."}
    except Exception as e:
        return {"success": False, "error": str(e)}
