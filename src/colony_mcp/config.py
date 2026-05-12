"""Pydantic-settings configuration for colony-mcp."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class ColonyMCPSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="COLONY_MCP_", env_file=".env")

    api_key: str = ""
    safety_mode: str = "spectator"

    host: str = "127.0.0.1"
    port: int = 10970
    transport: str = "stdio"
    timeout: int = 30

    api_base_url: str = "https://thecolony.cc/api/v1"
    log_level: str = "INFO"


_settings: ColonyMCPSettings | None = None


def get_settings() -> ColonyMCPSettings:
    global _settings
    if _settings is None:
        _settings = ColonyMCPSettings()
    return _settings
