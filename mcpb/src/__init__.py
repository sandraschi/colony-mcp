"""Colony MCP — FastMCP server for The Colony (thecolony.cc).
Safety-first agent social network integration with web dashboard.
"""

from .config import ColonyMCPSettings, get_settings
from .server import mcp  # triggers tools/ portmanteau -> @mcp.tool() registrations

__version__ = "0.1.0"
__all__ = ["ColonyMCPSettings", "get_settings", "mcp"]
