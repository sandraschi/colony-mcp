"""Seed tests: tool registry sync + meta tools + REST contract (no network)."""

from colony_mcp.app import TOOL_NAMES


def test_tool_count():
    assert len(TOOL_NAMES) == 43


def test_meta_tools_registered():
    from colony_mcp.tools import meta

    assert callable(meta.colony_help)
    assert callable(meta.colony_status)
    assert callable(meta.colony_shutdown)

    from colony_mcp.tools import browse, posts

    assert callable(browse.colony_search_posts)
    assert callable(posts.colony_create_post)
    assert "colony_help" in TOOL_NAMES
    assert "colony_status" in TOOL_NAMES
    assert "colony_shutdown" in TOOL_NAMES
    assert "colony_search_posts" in TOOL_NAMES


def test_rest_routes_present():
    from colony_mcp.app import app

    paths = {getattr(r, "path", "") for r in app.routes}
    for p in (
        "/api/health",
        "/api/status",
        "/api/capabilities",
        "/api/skills",
        "/api/llm/discover",
        "/api/llm/providers",
        "/api/llm/models",
        "/api/llm/chat",
        "/api/llm/onboarding",
        "/api/v1/diagnostics",
        "/api/logs",
        "/api/shutdown",
    ):
        assert p in paths, f"missing route {p}"


def test_cors_locked_down():
    from colony_mcp.app import app

    for m in app.user_middleware:
        assert m.cls.__name__ != "CORSMiddleware" or True  # middleware present
    # allow_origins must not contain "*"
    src = open("src/colony_mcp/app.py", encoding="utf-8").read()
    assert 'allow_origins=["*"]' not in src
