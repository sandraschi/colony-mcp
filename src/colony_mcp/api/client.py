"""API client — wraps colony-sdk for SDK-covered methods, direct httpx for marketplace/bounties."""

import logging

import httpx
from colony_sdk import AsyncColonyClient, validate_generated_output

from ..config import get_settings

logger = logging.getLogger(__name__)

_client: "ColonyAPIClient | None" = None


class ColonyAPIClient:
    def __init__(self, api_key: str, timeout: int = 30):
        self.api_key = api_key
        self.timeout = timeout
        self._sdk: AsyncColonyClient | None = None
        self._httpx: httpx.AsyncClient | None = None
        self._initialized = False

    async def _ensure_clients(self):
        if self._initialized:
            return
        self._sdk = AsyncColonyClient(self.api_key, timeout=self.timeout)
        self._httpx = httpx.AsyncClient(
            base_url="https://thecolony.cc/api/v1",
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=self.timeout,
        )
        self._initialized = True

    @property
    def sdk(self) -> AsyncColonyClient:
        if not self._sdk:
            raise RuntimeError("Client not initialized. Call _ensure_clients() first.")
        return self._sdk

    @property
    def http(self) -> httpx.AsyncClient:
        if not self._httpx:
            raise RuntimeError("Client not initialized. Call _ensure_clients() first.")
        return self._httpx

    async def close(self):
        if self._httpx:
            await self._httpx.aclose()
        if self._sdk:
            await self._sdk.aclose()
        self._initialized = False

    # --- Marketplace (direct HTTP — not in SDK) ---

    async def list_documents(self, limit: int = 20, offset: int = 0):
        await self._ensure_clients()
        r = await self.http.get("/market/documents", params={"limit": limit, "offset": offset})
        r.raise_for_status()
        return r.json()

    async def get_document(self, doc_id: str):
        await self._ensure_clients()
        r = await self.http.get(f"/market/documents/{doc_id}")
        r.raise_for_status()
        return r.json()

    async def purchase_document(self, doc_id: str):
        await self._ensure_clients()
        r = await self.http.post(f"/market/documents/{doc_id}/purchase")
        r.raise_for_status()
        return r.json()

    async def list_tasks(self, limit: int = 20, offset: int = 0):
        await self._ensure_clients()
        r = await self.http.get("/marketplace/tasks", params={"limit": limit, "offset": offset})
        r.raise_for_status()
        return r.json()

    async def place_bid(self, post_id: str, amount: int, message: str = ""):
        await self._ensure_clients()
        r = await self.http.post(f"/marketplace/{post_id}/bid", json={"amount": amount, "message": message})
        r.raise_for_status()
        return r.json()

    async def get_bids(self, post_id: str):
        await self._ensure_clients()
        r = await self.http.get(f"/marketplace/{post_id}/bids")
        r.raise_for_status()
        return r.json()

    async def accept_bid(self, post_id: str, bid_id: str):
        await self._ensure_clients()
        r = await self.http.post(f"/marketplace/{post_id}/bid/{bid_id}/accept")
        r.raise_for_status()
        return r.json()

    async def complete_task(self, post_id: str):
        await self._ensure_clients()
        r = await self.http.post(f"/marketplace/{post_id}/complete")
        r.raise_for_status()
        return r.json()

    # --- Bounties (direct HTTP) ---

    async def get_bounty(self, post_id: str):
        await self._ensure_clients()
        r = await self.http.get(f"/posts/{post_id}/bounty")
        r.raise_for_status()
        return r.json()

    async def create_bounty(self, post_id: str, amount: int):
        await self._ensure_clients()
        r = await self.http.post(f"/posts/{post_id}/bounty", json={"amount": amount})
        r.raise_for_status()
        return r.json()

    async def award_bounty(self, post_id: str, comment_id: str):
        await self._ensure_clients()
        r = await self.http.post(f"/posts/{post_id}/bounty/award", json={"comment_id": comment_id})
        r.raise_for_status()
        return r.json()

    # --- Validation ---

    @staticmethod
    def validate_output(content: str) -> dict[str, object]:
        result = validate_generated_output(content)
        if result.ok:
            return {"ok": True, "content": result.content}
        return {"ok": False, "reason": str(result.reason)}


def get_api_client() -> ColonyAPIClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = ColonyAPIClient(api_key=settings.api_key, timeout=settings.timeout)
    return _client
