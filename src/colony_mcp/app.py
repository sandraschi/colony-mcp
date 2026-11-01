"""FastAPI app - serves REST API for the webapp, proxying to The Colony API."""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .api import get_api_client
from .config import get_settings

app = FastAPI(title="Colony MCP Webapp", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:10970",
        "http://127.0.0.1:10971",
        "http://localhost:10970",
        "http://localhost:10971",
        "tauri://localhost",
        "http://tauri.localhost",
        "https://tauri.localhost",
    ],
    allow_origin_regex=r"https?://(127\.0\.0\.1|localhost|goliath)(:\d+)?|https?://.*\.ts\.net(:\d+)?|tauri://.*",
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
        result = await client.sdk.get_posts(limit=limit)
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
            result = await client.sdk.search(query, limit=limit)
            return {"success": True, "posts": result}
        result = await client.sdk.get_posts(colony=colony or None, limit=limit)
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
        result = await client.sdk.create_post(
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
        result = await client.sdk.get_post(post_id)
        return {"success": True, "post": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/posts/{post_id}/comments")
async def colony_get_comments(post_id: str, limit: int = Query(50, ge=1, le=200)):
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = await client.sdk.get_comments(post_id, page=1)
        comments = result if isinstance(result, list) else result.get("comments", [])
        return {"success": True, "comments": comments[:limit]}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/colonies")
async def colony_list_colonies():
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = await client.sdk.get_colonies()
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
        await client.sdk.join_colony(req.colony)
        return {"success": True, "message": f"Joined {req.colony}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/colony/colonies/leave")
async def colony_leave(req: ColonyAction):
    client = get_api_client()
    await client._ensure_clients()
    try:
        await client.sdk.leave_colony(req.colony)
        return {"success": True, "message": f"Left {req.colony}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/colony/me")
async def colony_get_me():
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = await client.sdk.get_me()
        return {"success": True, "user": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/colony/rotate-key")
async def colony_rotate_key():
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = await client.sdk.rotate_key()
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
        result = await client.sdk.get_notifications(unread_only=unread_only)
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
        result = await client.sdk.get_webhooks()
        webhooks = result if isinstance(result, list) else [result]
        return {"success": True, "webhooks": webhooks}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/colony/webhooks")
async def webhook_create(req: WebhookCreate):
    client = get_api_client()
    await client._ensure_clients()
    try:
        result = await client.sdk.create_webhook(req.url, req.events, req.secret)
        return {"success": True, "webhook": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.delete("/api/colony/webhooks/{webhook_id}")
async def webhook_delete(webhook_id: str):
    client = get_api_client()
    await client._ensure_clients()
    try:
        await client.sdk.delete_webhook(webhook_id)
        return {"success": True, "message": f"Webhook {webhook_id} deleted."}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---- Fleet standard routes (capabilities, skills, LLM proxy, diagnostics, logs) ----

TOOL_NAMES = [
    "colony_search_posts",
    "colony_browse_directory",
    "colony_list_colonies",
    "colony_get_post",
    "colony_get_comments",
    "colony_get_user_profile",
    "colony_get_trending",
    "colony_get_poll",
    "colony_create_post",
    "colony_comment",
    "colony_edit_post",
    "colony_delete_post",
    "colony_vote_post",
    "colony_vote_comment",
    "colony_react",
    "colony_bookmark",
    "colony_follow",
    "colony_send_message",
    "colony_list_conversations",
    "colony_get_conversation",
    "colony_get_me",
    "colony_update_profile",
    "colony_rotate_key",
    "colony_get_notifications",
    "colony_mark_read",
    "colony_market_list_docs",
    "colony_market_get_doc",
    "colony_market_purchase",
    "colony_market_tasks",
    "colony_market_place_bid",
    "colony_market_accept_bid",
    "colony_market_complete",
    "colony_rate_limits",
    "colony_webhook_create",
    "colony_webhook_list",
    "colony_webhook_delete",
    "colony_join_colony",
    "colony_leave_colony",
    "colony_vote_poll",
    "colony_validate_content",
    "colony_help",
    "colony_status",
    "colony_shutdown",
]


@app.get("/api/status")
async def status():
    settings = get_settings()
    return {
        "status": "ok",
        "version": "0.1.0",
        "safety_mode": settings.safety_mode,
        "tool_count": len(TOOL_NAMES),
        "port": settings.port,
    }


@app.get("/api/capabilities")
async def capabilities():
    return {
        "success": True,
        "message": "Colony MCP capabilities",
        "data": {"tools": TOOL_NAMES, "tool_count": len(TOOL_NAMES), "version": "0.1.0"},
    }


@app.get("/api/skills")
async def skills():
    return [
        {
            "name": "colony-expert",
            "description": "Browse, post, vote, DM and trade on The Colony agent social network (40 tools).",
        }
    ]


async def _probe_llm(base_url: str, path: str) -> dict:
    import httpx as _httpx

    try:
        async with _httpx.AsyncClient(timeout=2.0) as c:
            r = await c.get(f"{base_url}{path}")
            if r.status_code == 200:
                return {"reachable": True, "data": r.json()}
    except Exception:
        pass
    return {"reachable": False, "data": None}


@app.get("/api/llm/discover")
async def llm_discover():
    ollama = await _probe_llm("http://127.0.0.1:11434", "/api/tags")
    lmstudio = await _probe_llm("http://127.0.0.1:1234", "/v1/models")
    return {
        "ollama": {"detected": ollama["reachable"]},
        "lmstudio": {"detected": lmstudio["reachable"]},
    }


@app.get("/api/llm/providers")
async def llm_providers():
    disc = await llm_discover()
    providers = []
    if disc["ollama"]["detected"]:
        providers.append({"id": "ollama", "label": "Ollama (local)", "detected": True, "models": []})
    if disc["lmstudio"]["detected"]:
        providers.append({"id": "lmstudio", "label": "LM Studio (local)", "detected": True, "models": []})
    if not providers:
        providers.append({"id": "ollama", "label": "Ollama (local)", "detected": False, "models": []})
    return {"providers": providers}


@app.get("/api/llm/models")
async def llm_models(provider: str = "ollama"):
    if provider == "lmstudio":
        probe = await _probe_llm("http://127.0.0.1:1234", "/v1/models")
        if probe["reachable"]:
            return {"models": [m.get("id", "") for m in probe["data"].get("data", [])]}
        return {"models": []}
    probe = await _probe_llm("http://127.0.0.1:11434", "/api/tags")
    if probe["reachable"]:
        return {"models": [m.get("name", "") for m in probe["data"].get("models", [])]}
    return {"models": []}


class LlmChatRequest(BaseModel):
    provider: str = "ollama"
    model: str = ""
    prompt: str = ""
    system: str | None = None


@app.post("/api/llm/chat")
async def llm_chat(req: LlmChatRequest):
    import httpx as _httpx

    if req.provider == "lmstudio":
        try:
            async with _httpx.AsyncClient(timeout=120.0) as c:
                r = await c.post(
                    "http://127.0.0.1:1234/v1/chat/completions",
                    json={
                        "model": req.model,
                        "messages": [
                            {"role": "system", "content": req.system or "You are a helpful assistant."},
                            {"role": "user", "content": req.prompt},
                        ],
                    },
                )
                r.raise_for_status()
                data = r.json()
                return {"response": data["choices"][0]["message"]["content"]}
        except Exception as e:
            return {"success": False, "error": str(e)}
    try:
        async with _httpx.AsyncClient(timeout=120.0) as c:
            r = await c.post(
                "http://127.0.0.1:11434/api/generate",
                json={"model": req.model, "prompt": req.prompt, "system": req.system, "stream": False},
            )
            r.raise_for_status()
            return {"response": r.json().get("response", "")}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/llm/onboarding")
async def llm_onboarding():
    disc = await llm_discover()
    if disc["ollama"]["detected"] or disc["lmstudio"]["detected"]:
        return {"ready": True, "message": "Local LLM detected."}
    return {
        "ready": False,
        "message": "No local LLM detected. Install Ollama (http://127.0.0.1:11434) or LM Studio (http://127.0.0.1:1234).",
        "recommended": "ollama",
    }


@app.get("/api/v1/diagnostics")
async def diagnostics():
    import platform
    import sys

    settings = get_settings()
    routes = sorted({getattr(r, "path", "") for r in app.routes if getattr(r, "path", "").startswith("/api")})
    return {
        "success": True,
        "message": "Colony MCP diagnostics",
        "data": {
            "version": "0.1.0",
            "tool_count": len(TOOL_NAMES),
            "safety_mode": settings.safety_mode,
            "port": settings.port,
            "python": sys.version.split()[0],
            "platform": platform.platform(),
            "routes": routes,
        },
    }


_LOG_BUFFER: list = []


@app.get("/api/logs")
async def logs_list(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0)):
    total = len(_LOG_BUFFER)
    return {"entries": _LOG_BUFFER[offset : offset + limit], "total": total}


@app.get("/api/logs/export")
async def logs_export(format: str = Query("json")):
    from fastapi.responses import PlainTextResponse

    if format == "csv":
        lines = ["id,timestamp,level,kind,detail"]
        for e in _LOG_BUFFER:
            lines.append(
                f"{e.get('id', '')},{e.get('timestamp', '')},{e.get('level', '')},{e.get('kind', '')},{e.get('detail', '')}"
            )
        return PlainTextResponse("\n".join(lines), media_type="text/csv")
    return {"entries": _LOG_BUFFER, "total": len(_LOG_BUFFER)}


@app.delete("/api/logs")
async def logs_clear():
    _LOG_BUFFER.clear()
    return {"success": True, "message": "Log buffer cleared."}


@app.post("/api/shutdown")
async def shutdown():
    import os
    import threading

    def _exit():
        import time

        time.sleep(0.5)
        os._exit(0)

    threading.Thread(target=_exit, daemon=True).start()
    return {"success": True, "message": "Shutting down in ~500 ms."}


# ---- FastMCP ASGI mount helper ----


def create_asgi_app():
    """Return the FastAPI app for ASGI mounting alongside FastMCP."""
    return app
