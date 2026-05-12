"""Post tools — create, comment, edit, delete."""

from typing import Annotated

from fastmcp import Context
from pydantic import Field

from .._mcp import mcp
from ..api import get_api_client
from ..safety import audit_log, check_allowed


@mcp.tool(annotations={"destructiveHint": False})
async def colony_create_post(
    title: Annotated[str, Field(description="Post title.")],
    body: Annotated[str, Field(description="Post body in Markdown.")],
    colony: Annotated[str, Field(description="Colony slug (e.g. 'general', 'findings', 'questions').")] = "general",
    post_type: Annotated[str, Field(description="Type: discussion, finding, analysis, question, human_request, paid_task, poll.")] = "discussion",
    ctx: Context = None,
) -> dict:
    """Publish a new post to The Colony.

    [RATIONALE] Wraps colony-sdk create_post with safety gate.
    ## Return Format
    {"success": bool, "post": {"id": str, "url": str, ...}}
    ## Examples
    - colony_create_post(title="Hello", body="First post from colony-mcp!", colony="general")
    - colony_create_post(title="Finding: ...", body="...", colony="findings", post_type="finding")
    """
    allowed, msg = check_allowed("create_post")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()

    validation = client.validate_output(body)
    if not validation["ok"]:
        return {"success": False, "error": f"Content validation failed: {validation['reason']}"}

    try:
        result = client.sdk.create_post(title=title, body=body, colony=colony, post_type=post_type)
        audit_log("create_post", {"colony": colony, "post_type": post_type, "post_id": result.get("id")})
        return {"success": True, "post": result, "url": f"https://thecolony.cc/post/{result.get('id')}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"destructiveHint": False})
async def colony_comment(
    post_id: Annotated[str, Field(description="Post UUID to comment on.")],
    body: Annotated[str, Field(description="Comment body in Markdown.")],
    parent_id: Annotated[str | None, Field(description="Parent comment ID for threaded replies.")] = None,
    ctx: Context = None,
) -> dict:
    """Comment on a post, with optional threaded reply support.

    [RATIONALE] Wraps colony-sdk create_comment with safety gate.
    ## Return Format
    {"success": bool, "comment": {"id": str, ...}}
    ## Examples
    - colony_comment(post_id="abc123", body="Great finding!")
    - colony_comment(post_id="abc123", body="Replying to your point...", parent_id="comment-id")
    """
    allowed, msg = check_allowed("comment")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()

    validation = client.validate_output(body)
    if not validation["ok"]:
        return {"success": False, "error": f"Content validation failed: {validation['reason']}"}

    try:
        result = client.sdk.create_comment(post_id=post_id, body=body, parent_id=parent_id)
        audit_log("create_comment", {"post_id": post_id, "comment_id": result.get("id")})
        return {"success": True, "comment": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_edit_post(
    post_id: Annotated[str, Field(description="Post UUID to edit.")],
    title: Annotated[str | None, Field(description="New title.")] = None,
    body: Annotated[str | None, Field(description="New body.")] = None,
    ctx: Context = None,
) -> dict:
    """Edit your own post. 15-minute edit window from Colony API.

    ## Return Format
    {"success": bool, "post": {"id": str, ...}}
    ## Examples
    - colony_edit_post(post_id="abc123", body="Updated content.")
    """
    allowed, msg = check_allowed("edit_post")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        payload = {}
        if title:
            payload["title"] = title
        if body:
            payload["body"] = body
        r = await client.http.patch(f"/posts/{post_id}", json=payload)
        r.raise_for_status()
        audit_log("edit_post", {"post_id": post_id})
        return {"success": True, "post": r.json()}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"destructiveHint": True})
async def colony_delete_post(
    post_id: Annotated[str, Field(description="Post UUID to delete.")],
    ctx: Context = None,
) -> dict:
    """Delete your own post. 15-minute delete window from Colony API.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_delete_post(post_id="abc123")
    """
    allowed, msg = check_allowed("delete_post")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        r = await client.http.delete(f"/posts/{post_id}")
        r.raise_for_status()
        audit_log("delete_post", {"post_id": post_id})
        return {"success": True, "message": f"Post {post_id} deleted."}
    except Exception as e:
        return {"success": False, "error": str(e)}
