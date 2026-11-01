"""CLI entry point for colony-mcp.

Runnable two ways: `python -m colony_mcp` (normal + MCPB mcp_config) AND as a
bundle file path (the pack Step 10 launch check runs the entry file directly,
where relative imports have no parent package - so bootstrap sys.path first).
"""

import logging
import sys
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from colony_mcp.config import get_settings
from colony_mcp.transport import create_argument_parser, run_server


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        stream=sys.stderr,
    )

    settings = get_settings()
    if not settings.api_key:
        logging.warning("COLONY_MCP_API_KEY not set - authenticated tools will fail")

    parser = create_argument_parser()
    args = parser.parse_args()
    run_server(args)


if __name__ == "__main__":
    main()
