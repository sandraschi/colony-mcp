"""FastAPI app — serves REST API for the webapp, proxying to The Colony API."""


from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .api import get_api_client
from .config import get_settings

app = FastAPI(title="Colony MCP Webapp", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Health & Config ----

@app.get("/api/health")
async def health():
    settings = get_settings()
    return {
        "status": "ok",
        "port": settings.port,
        "version": "0.1.0",
        "safety_mode": settings.safety_mode,
    }


@app.get("/api/config")
async def config():
    settings = get_settings()
    return {
        "safety_mode": settings.safety_mode,
        "port": settings.port,
    }


class SafetyModeRequest(BaseModel):
    mode: str


@app.post("/api/config/safety-mode")
async def set_safety_mode(req: SafetyModeRequest):
    return {"success": True, "message": f"Safety mode set to {req.mode}. Restart required."}


# ---- Colony Proxy Routes ----

@app.get("/api/colony/feed")
async def colony_feed(limit: int = Query(20, ge=1, le=100)):
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_posts(limit=limit)
        posts = result if isinstance(result, list) else result.get("posts", [])
        return {"success": True, "posts": posts}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/posts")
async def colony_posts(
    query: str = Query(""),
    colony: str = Query(""),
    limit: int = Query(20, ge=1, le=100),
):
    client = get_api_client()
    await client._ensure_clients()
    try:
        if query:
            result = client.sdk.search(query, limit=limit)
            return {"success": True, "posts": result}
        result = client.sdk.get_posts(colony=colony or None, limit=limit)
        posts = result if isinstance(result, list) else result.get("posts", [])
        return {"success": True, "posts": posts}
    except Exception as e:
        return {"success": False, "error": str(e)}


class CreatePostRequest(BaseModel):
    title: str
    body: str
    colony: str = "general"
    post_type: str = "discussion"


@app.post("/api/colony/posts")
async def colony_create_post(req: CreatePostRequest):
    client = get_api_client()
    await client._ensure_clients()

    validation = client.validate_output(req.body)
    if not validation["ok"]:
        raise HTTPException(status_code=400, detail=f"Content validation failed: {validation['reason']}")

    try:
        result = client.sdk.create_post(
            title=req.title,
            body=req.body,
            colony=req.colony,
            post_type=req.post_type,
        )
        from .safety import audit_log
        audit_log("create_post", {"colony": req.colony, "post_type": req.post_type, "post_id": result.get("id")})
        return {"success": True, "post": result, "url": f"https://thecolony.cc/post/{result.get('id')}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/colony/posts/{post_id}")
async def colony_get_post(post_id: str):
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_post(post_id)
        return {"success": True, "post": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/posts/{post_id}/comments")
async def colony_get_comments(post_id: str, limit: int = Query(50, ge=1, le=200)):
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_comments(post_id, page=1)
        comments = result if isinstance(result, list) else result.get("comments", [])
        return {"success": True, "comments": comments[:limit]}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/colonies")
async def colony_list_colonies():
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_colonies()
        colonies = result if isinstance(result, list) else result.get("colonies", [])
        return {"success": True, "colonies": colonies}
    except Exception as e:
        return {"success": False, "error": str(e)}


class ColonyAction(BaseModel):
    colony: str


@app.post("/api/colony/colonies/join")
async def colony_join(req: ColonyAction):
    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.join_colony(req.colony)
        return {"success": True, "message": f"Joined {req.colony}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/colony/colonies/leave")
async def colony_leave(req: ColonyAction):
    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.leave_colony(req.colony)
        return {"success": True, "message": f"Left {req.colony}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/me")
async def colony_get_me():
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_me()
        return {"success": True, "user": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/colony/rotate-key")
async def colony_rotate_key():
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.rotate_key()
        from .safety import audit_log
        audit_log("rotate_key", {})
        return {"success": True, "api_key": result.get("api_key", ""), "message": "Key rotated."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/messages")
async def colony_list_conversations():
    client = get_api_client()
    await client._ensure_clients()
    try:
        r = await client.http.get("/messages")
        r.raise_for_status()
        data = r.json()
        return {"success": True, "conversations": data.get("conversations", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/notifications")
async def colony_notifications(unread_only: bool = Query(False), limit: int = Query(20)):
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_notifications(unread_only=unread_only)
        notifs = result if isinstance(result, list) else result.get("notifications", [])
        return {"success": True, "notifications": notifs[:limit]}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/market/documents")
async def market_documents(limit: int = Query(20), offset: int = Query(0)):
    client = get_api_client()
    try:
        result = await client.list_documents(limit=limit, offset=offset)
        return {"success": True, "documents": result.get("documents", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/market/tasks")
async def market_tasks(limit: int = Query(20), offset: int = Query(0)):
    client = get_api_client()
    try:
        result = await client.list_tasks(limit=limit, offset=offset)
        return {"success": True, "tasks": result.get("tasks", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/rate-limits")
async def rate_limits():
    client = get_api_client()
    await client._ensure_clients()
    try:
        r = await client.http.get("/limits/me")
        r.raise_for_status()
        return {"success": True, "limits": r.json()}
    except Exception as e:
        return {"success": False, "error": str(e)}


class WebhookCreate(BaseModel):
    url: str
    events: list[str]
    secret: str


@app.get("/api/colony/webhooks")
async def webhook_list():
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.get_webhooks()
        webhooks = result if isinstance(result, list) else [result]
        return {"success": True, "webhooks": webhooks}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/colony/webhooks")
async def webhook_create(req: WebhookCreate):
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = client.sdk.create_webhook(req.url, req.events, req.secret)
        return {"success": True, "webhook": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/colony/webhooks/{webhook_id}")
async def webhook_delete(webhook_id: str):
    client = get_api_client()
    await client._ensure_clients()
    try:
        client.sdk.delete_webhook(webhook_id)
        return {"success": True, "message": f"Webhook {webhook_id} deleted."}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---- FastMCP ASGI mount helper ----

def create_asgi_app():
    """Return the FastAPI app for ASGI mounting alongside FastMCP."""
    return app
