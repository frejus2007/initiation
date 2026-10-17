"""Gestion des sessions de chat (mémoire vive — suffisant pour un MVP local).

Une session associe un identifiant aléatoire à un défi et à son état. Les
sessions expirent après `ttl` secondes d'inactivité.
"""
from __future__ import annotations

import threading
import time
import uuid

from .challenges.base import State


class SessionStore:
    def __init__(self, ttl: int = 3600, max_sessions: int = 5000):
        self._ttl = ttl
        self._max = max_sessions
        self._lock = threading.Lock()
        self._items: dict[str, State] = {}

    def _purge_locked(self, now: float) -> None:
        expired = [sid for sid, st in self._items.items() if now - st.updated_at > self._ttl]
        for sid in expired:
            self._items.pop(sid, None)
        overflow = len(self._items) - self._max
        if overflow > 0:
            oldest = sorted(self._items.items(), key=lambda kv: kv[1].updated_at)
            for key, _ in oldest[:overflow]:
                self._items.pop(key, None)

    def create(self, challenge_id: str) -> State:
        now = time.time()
        state = State(
            session_id=uuid.uuid4().hex,
            challenge_id=challenge_id,
            created_at=now,
            updated_at=now,
        )
        with self._lock:
            self._purge_locked(now)
            self._items[state.session_id] = state
        return state

    def get(self, session_id: str):
        now = time.time()
        with self._lock:
            state = self._items.get(session_id)
            if state is None:
                return None
            if now - state.updated_at > self._ttl:
                self._items.pop(session_id, None)
                return None
            state.updated_at = now
            return state

    def delete(self, session_id: str) -> bool:
        with self._lock:
            return self._items.pop(session_id, None) is not None

    def count(self) -> int:
        with self._lock:
            return len(self._items)
