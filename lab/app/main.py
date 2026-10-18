"""PIGHACK — Atelier IA : service FastAPI des défis 7.1 → 7.8.

Expose les assistants scriptés et la validation des flags. En local, écoute en
principe sur 127.0.0.1 ; en déploiement (Railway/Render), le service écoute sur
0.0.0.0 et sur le port fourni par la plateforme via `$PORT`.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import engine
from .challenges import get as get_challenge
from .challenges import list_public
from .config import settings
from .sessions import SessionStore
from .supabase_client import SupabaseAwarder

logger = logging.getLogger("pighack.lab")

app = FastAPI(title="PIGHACK — Atelier IA", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins) or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = SessionStore(ttl=settings.session_ttl)
awarder = SupabaseAwarder(
    settings.supabase_url,
    settings.supabase_service_role_key,
    settings.supabase_anon_key,
)


def _get_state(session_id: str):
    state = store.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="SESSION_NOT_FOUND")
    return state


class StartRequest(BaseModel):
    challenge_id: str = Field(..., min_length=1, max_length=100)


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=8)
    message: str = Field("", max_length=4000)


class SubmitRequest(BaseModel):
    session_id: str = Field(..., min_length=8)
    flag: str = Field(..., max_length=200)
    user_id: str | None = None
    access_token: str | None = None


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "pighack-atelier-ia",
        "challenges": len(list_public()),
        "sessions": store.count(),
        "supabase": settings.supabase_enabled,
    }


@app.get("/api/challenges")
async def challenges():
    return {"challenges": list_public()}


@app.post("/api/session")
async def create_session(payload: StartRequest):
    spec = get_challenge(payload.challenge_id)
    if spec is None:
        raise HTTPException(status_code=404, detail="CHALLENGE_NOT_FOUND")
    state = store.create(payload.challenge_id)
    return {
        "session_id": state.session_id,
        "challenge": spec.to_public(),
        "messages": engine.start(state),
    }


@app.post("/api/chat")
async def chat(payload: ChatRequest):
    state = _get_state(payload.session_id)
    result = engine.respond(state, payload.message)
    result["session_id"] = state.session_id
    return result


@app.post("/api/submit")
async def submit(payload: SubmitRequest):
    state = _get_state(payload.session_id)
    result = engine.submit(state, payload.flag)

    if result["correct"] and not state.awarded:
        if awarder.enabled:
            award = await awarder.award(
                state.challenge_id,
                payload.flag,
                user_id=payload.user_id,
                access_token=payload.access_token,
            )
            state.awarded = bool(award.get("success"))
            result["award"] = award
        else:
            result["award"] = {"success": False, "error": "NOT_CONFIGURED"}

    return result


@app.delete("/api/session/{session_id}")
async def close_session(session_id: str):
    return {"closed": store.delete(session_id)}


def main():  # pragma: no cover - point d'entrée CLI
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)


if __name__ == "__main__":  # pragma: no cover
    main()
