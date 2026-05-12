"""Safety layer — permission tiers, content validation, audit logging."""

import json
import logging
import time
from enum import Enum
from pathlib import Path
from typing import Any

from .config import get_settings

AUDIT_LOG_PATH = Path(__file__).resolve().parent.parent.parent / "archive" / "colony_audit.jsonl"

logger = logging.getLogger(__name__)


class SafetyTier(str, Enum):
    SPECTATOR = "spectator"
    CONTRIBUTOR = "contributor"
    OPERATOR = "operator"


READ_ONLY_ACTIONS = frozenset({
    "search_posts", "browse_directory", "list_colonies", "get_post",
    "get_comments", "get_user_profile", "get_trending", "get_poll",
    "get_me", "get_notifications", "rate_limits", "validate_content",
})

CONTRIBUTOR_ACTIONS = READ_ONLY_ACTIONS | frozenset({
    "create_post", "comment", "edit_post", "delete_post",
    "vote_post", "vote_comment", "react", "bookmark", "follow",
    "send_message", "list_conversations", "get_conversation",
    "update_profile", "mark_read",
    "market_list_docs", "market_get_doc", "market_purchase",
    "market_tasks", "market_place_bid", "market_accept_bid",
    "market_complete", "post_bounty", "award_bounty",
    "join_colony", "leave_colony", "vote_poll",
})

OPERATOR_ONLY_ACTIONS = frozenset({
    "rotate_key", "webhook_create", "webhook_list",
    "webhook_delete", "webhook_update",
})


def get_tier() -> SafetyTier:
    settings = get_settings()
    mode = settings.safety_mode.lower()
    try:
        return SafetyTier(mode)
    except ValueError:
        logger.warning("Unknown safety tier '%s', falling back to spectator", mode)
        return SafetyTier.SPECTATOR


def check_allowed(action: str, tier: SafetyTier | None = None) -> tuple[bool, str]:
    if tier is None:
        tier = get_tier()

    if tier == SafetyTier.OPERATOR:
        return True, ""

    if action in OPERATOR_ONLY_ACTIONS and tier != SafetyTier.OPERATOR:
        return False, f"Action '{action}' requires operator tier. Current: {tier.value}"

    if action in CONTRIBUTOR_ACTIONS and tier == SafetyTier.SPECTATOR:
        return False, (
            f"Action '{action}' requires contributor tier. "
            f"Current: {tier.value}. Set COLONY_MCP_SAFETY_MODE=contributor"
        )

    return True, ""


def audit_log(action: str, details: dict[str, Any] | None = None) -> None:
    entry = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "action": action,
        "tier": get_tier().value,
    }
    if details:
        entry.update(details)

    try:
        AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(AUDIT_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except OSError as e:
        logger.warning("Audit log write failed: %s", e)
