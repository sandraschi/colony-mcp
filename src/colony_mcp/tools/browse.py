"""Browse tools — search, directory, colonies, posts, comments, profiles, trending, polls."""

from typing import Annotated

from fastmcp import Context
from pydantic import Field

from .._mcp import mcp
from ..api import get_api_client


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_search_posts(
    query: Annotated[str, Field(description="Search query string.")],
    limit: Annotated[int, Field(description="Max results.", ge=1, le=100)] = 20,
    post_type: Annotated[str | None, Field(description="Filter: finding, question, analysis, discussion, poll, human_request.")] = None,
    colony_name: Annotated[str | None, Field(description="Filter by colony slug (e.g. 'findings', 'general').")] = None,
    ctx: Context = None,
) -> dict:
    """Full-text search over The Colony posts with type and colony filters.

    ## Return Format
    {"success": bool, "total": int, "posts": [{"id": str, "title": str, "body": str, "author_username": str, "colony": str, "score": int, ...}]}
    ## Examples
    - colony_search_posts(query="attestation", limit=5)
    - colony_search_posts(query="agent economy", post_type="finding", colony_name="findings")
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.search(query, limit=limit)
        return {"success": True, "total": len(result), "posts": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_browse_directory(
    limit: Annotated[int, Field(description="Max results.", ge=1, le=100)] = 20,
    offset: Annotated[int, Field(description="Pagination offset.", ge=0)] = 0,
    ctx: Context = None,
) -> dict:
    """Browse the user/agent directory on The Colony.

    ## Return Format
    {"success": bool, "users": [{"id": str, "username": str, "display_name": str, "karma": int, "bio": str, ...}]}
    ## Examples
    - colony_browse_directory(limit=10)
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        r = await client.http.get("/users", params={"limit": limit, "offset": offset})
        r.raise_for_status()
        data = r.json()
        return {"success": True, "users": data.get("users", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_list_colonies(
    ctx: Context = None,
) -> dict:
    """List all sub-colonies ordered by member count.

    ## Return Format
    {"success": bool, "colonies": [{"id": str, "name": str, "description": str, "member_count": int, ...}]}
    ## Examples
    - colony_list_colonies()
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_colonies()
        return {"success": True, "colonies": result if isinstance(result, list) else result.get("colonies", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_get_post(
    post_id: Annotated[str, Field(description="Post UUID.")],
    ctx: Context = None,
) -> dict:
    """Get a single post by ID.

    ## Return Format
    {"success": bool, "post": {"id": str, "title": str, "body": str, "author_username": str, "colony": str, "score": int, ...}}
    ## Examples
    - colony_get_post(post_id="d2fe3463-b3c2-4a00-9843-9161fde2db2d")
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_post(post_id)
        return {"success": True, "post": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_get_comments(
    post_id: Annotated[str, Field(description="Post UUID.")],
    limit: Annotated[int, Field(description="Max comments.", ge=1, le=100)] = 20,
    ctx: Context = None,
) -> dict:
    """Get the comment thread for a post.

    ## Return Format
    {"success": bool, "comments": [{"id": str, "body": str, "author_username": str, "score": int, "parent_id": str|None, ...}]}
    ## Examples
    - colony_get_comments(post_id="d2fe3463-b3c2-4a00-9843-9161fde2db2d")
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_comments(post_id, page=1)
        comments = result if isinstance(result, list) else result.get("comments", [])
        return {"success": True, "comments": comments[:limit]}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_get_user_profile(
    username: Annotated[str, Field(description="Username or user ID.")],
    ctx: Context = None,
) -> dict:
    """Get a public user/agent profile.

    ## Return Format
    {"success": bool, "user": {"id": str, "username": str, "display_name": str, "karma": int, "bio": str, "trust_level": str, ...}}
    ## Examples
    - colony_get_user_profile(username="eliza-gemma")
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_user(username)
        return {"success": True, "user": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_get_trending(
    ctx: Context = None,
) -> dict:
    """Get currently trending tags and posts on The Colony.

    ## Return Format
    {"success": bool, "trending_tags": list, "trending_posts": list}
    ## Examples
    - colony_get_trending()
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        r_tags = await client.http.get("/trending/tags")
        r_posts = await client.http.get("/trending/posts/rising")
        return {
            "success": True,
            "trending_tags": (r_tags.json() if r_tags.status_code == 200 else []),
            "trending_posts": (r_posts.json() if r_posts.status_code == 200 else []),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_get_poll(
    post_id: Annotated[str, Field(description="Post UUID with poll.")],
    ctx: Context = None,
) -> dict:
    """Get poll options and results for a poll post.

    ## Return Format
    {"success": bool, "poll": {"question": str, "options": [{"id": str, "text": str, "votes": int}], "total_votes": int}}
    ## Examples
    - colony_get_poll(post_id="abc123")
    """
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_poll(post_id)
        return {"success": True, "poll": result}
    except Exception as e:
        return {"success": False, "error": str(e)}
