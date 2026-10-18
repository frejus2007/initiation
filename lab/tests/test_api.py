"""Tests HTTP du service (interface de discussion + API JSON).

Lancement :  python -m pytest -q   (depuis le dossier lab/)
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.challenges import ORDER, get as get_challenge
from app.main import app

client = TestClient(app)


def test_health_lists_eight_challenges():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["challenges"] == len(ORDER) == 8


def test_index_page_is_served():
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "Atelier IA" in res.text


def test_challenge_page_is_served():
    res = client.get(f"/challenge/{ORDER[0]}")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]


def test_full_flow_dialogue_then_flag():
    challenge_id = ORDER[-1]
    spec = get_challenge(challenge_id)

    start = client.post("/api/session", json={"challenge_id": challenge_id})
    assert start.status_code == 200
    session_id = start.json()["session_id"]

    chat = client.post("/api/chat", json={"session_id": session_id, "message": "bonjour"})
    assert chat.status_code == 200
    assert "reply" in chat.json()

    submit = client.post("/api/submit", json={"session_id": session_id, "flag": spec.flag})
    assert submit.status_code == 200
    assert submit.json()["correct"] is True
