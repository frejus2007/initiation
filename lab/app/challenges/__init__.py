"""Registre des défis IA disponibles dans l'Atelier."""
from __future__ import annotations

from . import (
    a1_filtre,
    a2_donnees_perso,
    a3_hameconnage,
    a4_hallucination,
    a5_cle_api,
    a6_jailbreak,
)
from .base import ChallengeSpec, Decision, State, normalize, verify_flag

_ALL = (
    a1_filtre.SPEC,
    a2_donnees_perso.SPEC,
    a3_hameconnage.SPEC,
    a4_hallucination.SPEC,
    a5_cle_api.SPEC,
    a6_jailbreak.SPEC,
)

REGISTRY: dict[str, ChallengeSpec] = {spec.id: spec for spec in _ALL}

# Ordre d'affichage pédagogique (7.1 → 7.6)
ORDER = tuple(spec.id for spec in _ALL)


def get(challenge_id: str):
    return REGISTRY.get(challenge_id)


def list_public() -> list:
    return [REGISTRY[cid].to_public() for cid in ORDER]


__all__ = [
    "ChallengeSpec",
    "Decision",
    "State",
    "normalize",
    "verify_flag",
    "REGISTRY",
    "ORDER",
    "get",
    "list_public",
]
