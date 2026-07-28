"""Multi-transport runner for colony-mcp. Supports --stdio, --http, --sse, and --serve (FastAPI + MCP)."""

import argparse
import logging

from .config import get_settings
from .server import mcp  # ensures tools are registered via server -> tools portmanteau


def create_argument_parser() -> argparse.ArgumentParser:
    settings = get_settings()
    parser = argparse.ArgumentParser(description="Colony MCP server")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--stdio", action="store_true", help="Run via stdio transport (for MCP clients)")
    group.add_argument("--http", action="store_true", help="Run via Streamable HTTP transport")
    group.add_argument("--sse", action="store_true", help="Run via SSE transport")
    group.add_argument("--serve", action="store_true", help="Run FastAPI + MCP on same port (for webapp)")
    parser.add_argument("--port", type=int, default=settings.port, help=f"Port (default: {settings.port})")
    parser.add_argument("--host", type=str, default=settings.host, help=f"Host (default: {settings.host})")
    return parser


def run_server(args: argparse.Namespace) -> None:
    host = args.host
    port = args.port

    if args.serve:
        _run_combined(host, port)
    elif args.http:
        logging.info("Starting colony-mcp via Streamable HTTP on %s:%d", host, port)
        mcp.run(transport="http", host=host, port=port)
    elif args.sse:
        logging.info("Starting colony-mcp via SSE on %s:%d", host, port)
        mcp.run(transport="sse", host=host, port=port)
    else:
        logging.info("Starting colony-mcp via stdio")
        mcp.run(transport="stdio")


def _run_combined(host: str, port: int) -> None:
    import uvicorn
    from fastapi.middleware.cors import CORSMiddleware
    from starlette.applications import Starlette
    from starlette.middleware import Middleware
    from starlette.routing import Mount

    from .app import app as fastapi_app

    combined = Starlette(
        middleware=[Middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )],
        routes=[
            Mount("/mcp", app=mcp.http_app()),
            Mount("/", app=fastapi_app),
        ],
    )

    logging.info("Starting colony-mcp (FastAPI + MCP) on %s:%d", host, port)
    logging.info("  REST API: http://%s:%d/api/", host, port)
    logging.info("  MCP:      http://%s:%d/mcp/", host, port)

    uvicorn.run(combined, host=host, port=port, log_level="info")
