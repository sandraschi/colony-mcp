"""CLI entry point for colony-mcp."""

import logging
import sys

from .config import get_settings
from .transport import create_argument_parser, run_server


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        stream=sys.stderr,
    )

    settings = get_settings()
    if not settings.api_key:
        logging.warning("COLONY_MCP_API_KEY not set — authenticated tools will fail")

    parser = create_argument_parser()
    args = parser.parse_args()
    run_server(args)


if __name__ == "__main__":
    main()
