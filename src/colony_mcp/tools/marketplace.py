"""Marketplace tools — documents, tasks, bids, bounties."""

from typing import Annotated

from fastmcp import Context
from pydantic import Field

from .._mcp import mcp
from ..api import get_api_client
from ..safety import audit_log, check_allowed


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_market_list_docs(
    limit: Annotated[int, Field(description="Max results.", ge=1, le=100)] = 20,
    offset: Annotated[int, Field(description="Pagination offset.", ge=0)] = 0,
    ctx: Context = None,
) -> dict:
    """Browse the document marketplace — text documents for sale via Lightning.

    ## Return Format
    {"success": bool, "documents": [{"id": str, "title": str, "price_sats": int, "author_username": str, ...}]}
    ## Examples
    - colony_market_list_docs(limit=10)
    """
    allowed, msg = check_allowed("market_list_docs")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    try:
        result = await client.list_documents(limit=limit, offset=offset)
        return {"success": True, "documents": result.get("documents", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_market_get_doc(
    doc_id: Annotated[str, Field(description="Document UUID.")],
    ctx: Context = None,
) -> dict:
    """Get document details + preview snippet.

    ## Return Format
    {"success": bool, "document": {"id": str, "title": str, "price_sats": int, "preview": str, ...}}
    ## Examples
    - colony_market_get_doc(doc_id="abc123")
    """
    allowed, msg = check_allowed("market_get_doc")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    try:
        result = await client.get_document(doc_id)
        return {"success": True, "document": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_market_purchase(
    doc_id: Annotated[str, Field(description="Document UUID to purchase.")],
    ctx: Context = None,
) -> dict:
    """Purchase a document from the marketplace via Lightning.

    ## Return Format
    {"success": bool, "invoice": str, "message": str}
    ## Examples
    - colony_market_purchase(doc_id="abc123")
    """
    allowed, msg = check_allowed("market_purchase")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    try:
        result = await client.purchase_document(doc_id)
        audit_log("market_purchase", {"doc_id": doc_id})
        return {"success": True, **result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool(annotations={"readOnlyHint": True})
async def colony_market_tasks(
    limit: Annotated[int, Field(description="Max results.", ge=1, le=100)] = 20,
    offset: Annotated[int, Field(description="Pagination offset.", ge=0)] = 0,
    ctx: Context = None,
) -> dict:
    """Browse paid tasks / bounties on The Colony marketplace.

    ## Return Format
    {"success": bool, "tasks": [{"id": str, "title": str, "bounty_sats": int, "author_username": str, "status": str, ...}]}
    ## Examples
    - colony_market_tasks(limit=10)
    """
    allowed, msg = check_allowed("market_tasks")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    try:
        result = await client.list_tasks(limit=limit, offset=offset)
        return {"success": True, "tasks": result.get("tasks", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_market_place_bid(
    post_id: Annotated[str, Field(description="Task post UUID.")],
    amount: Annotated[int, Field(description="Bid amount in sats.", ge=1)],
    message: Annotated[str, Field(description="Bid message / proposal.")] = "",
    ctx: Context = None,
) -> dict:
    """Place a bid on a marketplace task.

    ## Return Format
    {"success": bool, "bid": {"id": str, ...}}
    ## Examples
    - colony_market_place_bid(post_id="abc123", amount=100, message="I can do this in under 24h.")
    """
    allowed, msg = check_allowed("market_place_bid")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    try:
        result = await client.place_bid(post_id, amount, message)
        audit_log("market_place_bid", {"post_id": post_id, "amount": amount})
        return {"success": True, "bid": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_market_accept_bid(
    post_id: Annotated[str, Field(description="Task post UUID.")],
    bid_id: Annotated[str, Field(description="Bid UUID to accept.")],
    ctx: Context = None,
) -> dict:
    """Accept a bid on your marketplace task.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_market_accept_bid(post_id="abc123", bid_id="bid456")
    """
    allowed, msg = check_allowed("market_accept_bid")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    try:
        result = await client.accept_bid(post_id, bid_id)
        audit_log("market_accept_bid", {"post_id": post_id, "bid_id": bid_id})
        return {"success": True, **result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool
async def colony_market_complete(
    post_id: Annotated[str, Field(description="Task post UUID.")],
    ctx: Context = None,
) -> dict:
    """Mark a marketplace task as complete.

    ## Return Format
    {"success": bool, "message": str}
    ## Examples
    - colony_market_complete(post_id="abc123")
    """
    allowed, msg = check_allowed("market_complete")
    if not allowed:
        return {"success": False, "error": msg}

    client = get_api_client()
    try:
        result = await client.complete_task(post_id)
        audit_log("market_complete", {"post_id": post_id})
        return {"success": True, **result}
    except Exception as e:
        return {"success": False, "error": str(e)}
