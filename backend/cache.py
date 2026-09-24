"""Simple file-based JSON cache to protect SerpApi free-tier quota (250/mo).

Every SerpApi call is cached under backend/.cache/<name>_<hash>.json.
Repeated test runs with identical params hit the file, not the API.
"""
import hashlib
import json
import os
import time
from pathlib import Path

CACHE_DIR = Path(__file__).parent / ".cache"
CACHE_TTL_SECONDS = 24 * 3600  # 24h


def _enabled() -> bool:
    return os.getenv("USE_CACHE", "true").lower() in ("1", "true", "yes")


def _key(name: str, params: dict) -> Path:
    blob = json.dumps(params, sort_keys=True, default=str)
    h = hashlib.sha256(blob.encode()).hexdigest()[:16]
    return CACHE_DIR / f"{name}_{h}.json"


def get(name: str, params: dict, ttl_seconds: int | None = None):
    """Return cached dict or None.

    ttl_seconds overrides the default 24h TTL per data type — time-sensitive
    data (current weather ~ hours, exchange rates ~ half a day) passes a
    shorter TTL here; omit it to keep CACHE_TTL_SECONDS.
    """
    if not _enabled():
        return None
    ttl = CACHE_TTL_SECONDS if ttl_seconds is None else ttl_seconds
    p = _key(name, params)
    if not p.exists():
        return None
    try:
        if time.time() - p.stat().st_mtime > ttl:
            return None
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def set(name: str, params: dict, data: dict) -> None:
    if not _enabled():
        return
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        p = _key(name, params)
        p.write_text(json.dumps(data, default=str), encoding="utf-8")
    except Exception as e:
        # Cache must never break the app
        print(f"[cache] write failed: {e}")
