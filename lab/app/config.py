"""Configuration du service de laboratoire (lue depuis l'environnement)."""
from __future__ import annotations

import os
from dataclasses import dataclass

try:  # chargement facultatif du fichier .env
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover - dotenv absent en test
    pass


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Settings:
    host: str = os.getenv("LAB_HOST", "127.0.0.1")
    port: int = _int("LAB_PORT", 8090)
    session_ttl: int = _int("LAB_SESSION_TTL", 3600)
    allowed_origins: tuple = tuple(
        origin.strip()
        for origin in os.getenv("LAB_ALLOWED_ORIGINS", "*").split(",")
        if origin.strip()
    )
    supabase_url: str = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)


settings = Settings()
