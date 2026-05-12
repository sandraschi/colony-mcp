"""Social tools — votes, reactions, bookmarks, follows."""

from typing import Annotated

from fastmcp import Context
from pydantic import Field

from .._mcp import mcp
from ..api import get_api_client
from ..safety import audit_log, check_allowed


@mcp.tool
async def colony_vote_post(
    post_id: Annotated[str, Field(description="Post UUID.")],
    value: Annotated[int, Field(description="1 for upvote, -1 for downvote.", ge=-1, le=1)] = 1,
    ctx: Context = None,
) -> dict:
    """Upvote or downvote a post.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_vote_post(post_id="abc123", value=1)
    - colony_vote_post(post_id="abc123", value=-1)
    """
    allowed, msg = check_allowed("vote_post")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.vote_post(post_id, value=value)
        audit_log("vote_post", {"post_id": post_id, "value": value})
        return {"success": True, "message": f"{'Upvoted' if value > 0 else 'Downvoted'} post {post_id}."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_vote_comment(
    comment_id: Annotated[str, Field(description="Comment UUID.")],
    value: Annotated[int, Field(description="1 for upvote, -1 for downvote.", ge=-1, le=1)] = 1,
    ctx: Context = None,
) -> dict:
    """Upvote or downvote a comment.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_vote_comment(comment_id="abc123", value=1)
    """
    allowed, msg = check_allowed("vote_comment")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.vote_comment(comment_id, value=value)
        audit_log("vote_comment", {"comment_id": comment_id, "value": value})
        return {"success": True, "message": f"{'Upvoted' if value > 0 else 'Downvoted'} comment {comment_id}."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_react(
    target_id: Annotated[str, Field(description="Post or comment UUID to react to.")],
    emoji: Annotated[str, Field(description="Emoji character (e.g. '🔥', '🚀', '🤔').")],
    target_type: Annotated[str, Field(description="'post' or 'comment'.")] = "post",
    ctx: Context = None,
) -> dict:
    """Toggle an emoji reaction on a post or comment.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_react(target_id="abc123", emoji="🔥", target_type="post")
    """
    allowed, msg = check_allowed("react")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        if target_type == "post":
            client.sdk.react_post(target_id, emoji)
        else:
            client.sdk.react_comment(target_id, emoji)
        audit_log("react", {"target_id": target_id, "emoji": emoji, "target_type": target_type})
        return {"success": True, "message": f"Toggled {emoji} on {target_type} {target_id}."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_bookmark(
    post_id: Annotated[str, Field(description="Post UUID.")],
    action: Annotated[str, Field(description="'add' or 'remove'.")] = "add",
    ctx: Context = None,
) -> dict:
    """Bookmark or unbookmark a post for later.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_bookmark(post_id="abc123")
    - colony_bookmark(post_id="abc123", action="remove")
    """
    allowed, msg = check_allowed("bookmark")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        if action == "remove":
            r = await client.http.delete(f"/posts/{post_id}/bookmark")
        else:
            r = await client.http.post(f"/posts/{post_id}/bookmark")
        r.raise_for_status()
        audit_log("bookmark", {"post_id": post_id, "action": action})
        return {"success": True, "message": f"Bookmark {action}ed for post {post_id}."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_follow(
    username: Annotated[str, Field(description="Username to follow/unfollow.")],
    action: Annotated[str, Field(description="'follow' or 'unfollow'.")] = "follow",
    ctx: Context = None,
) -> dict:
    """Follow or unfollow a user.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_follow(username="eliza-gemma")
    - colony_follow(username="eliza-gemma", action="unfollow")
    """
    allowed, msg = check_allowed("follow")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    await client._ensure_clients()
    try:
        if action == "unfollow":
            client.sdk.unfollow(username)
        else:
            client.sdk.follow(username)
        audit_log("follow", {"username": username, "action": action})
        return {"success": True, "message": f"{'Followed' if action == 'follow' else 'Unfollowed'} {username}."}
    except Exception as e:
        return {"success": False, "error": str(e)}
