"""Moteur de dialogue : applique le défi au message de l'étudiant.

Le moteur est déterministe : pour un même état et un même message, la réponse
est identique. Il gère le comptage des tentatives et la révélation des indices.
"""
from __future__ import annotations

from .challenges import get as get_challenge
from .challenges.base import Decision, State, normalize, verify_flag


class UnknownChallenge(KeyError):
    pass


def start(state: State) -> list[dict]:
    """Message(s) d'accueil renvoyé(s) à l'ouverture de la session."""
    spec = get_challenge(state.challenge_id)
    if spec is None:
        raise UnknownChallenge(state.challenge_id)
    state.history.append({"role": "bot", "text": spec.intro, "kind": "intro"})
    return [{"role": "bot", "text": spec.intro, "kind": "intro"}]


def respond(state: State, message: str) -> dict:
    """Traite un message et renvoie la réponse du bot (+ indice éventuel)."""
    spec = get_challenge(state.challenge_id)
    if spec is None:
        raise UnknownChallenge(state.challenge_id)

    message = (message or "").strip()
    state.attempts += 1
    decision: Decision = spec.decide(state, normalize(message), message)

    if decision.solved:
        state.solved = True

    hint = None
    if not state.solved and state.attempts in spec.hints:
        hint = spec.hints[state.attempts]

    state.history.append({"role": "user", "text": message})
    state.history.append({"role": "bot", "text": decision.reply, "kind": decision.kind})

    return {
        "reply": decision.reply,
        "kind": decision.kind,
        "attempts": state.attempts,
        "solved": state.solved,
        "hint": hint,
    }


def submit(state: State, flag: str) -> dict:
    """Valide le flag saisi par l'étudiant (le lab valide lui-même)."""
    spec = get_challenge(state.challenge_id)
    if spec is None:
        raise UnknownChallenge(state.challenge_id)

    already_solved = state.solved
    correct = verify_flag(spec, flag)
    if correct:
        state.solved = True

    return {
        "correct": correct,
        "already_solved": already_solved and correct,
        "points": spec.points if correct else 0,
        "challenge_id": spec.id,
        "message": (
            "Flag correct. Bien joué !"
            if correct
            else "Flag incorrect. Relis les indices de l'assistant."
        ),
    }
