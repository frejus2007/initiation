"""Socle commun des défis IA : normalisation, état, décisions, spécification.

Chaque défi est un assistant **scripté** (moteur de règles déterministe).
Aucun modèle de langage réel n'est appelé : le comportement est reproductible
et testable hors ligne.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Callable, Optional


def normalize(text: str) -> str:
    """Minuscules, sans accents, espaces compactés. Base de tous les filtres."""
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower()
    return re.sub(r"\s+", " ", text).strip()


def contains_norm(norm: str, needles) -> Optional[str]:
    """Retourne le premier mot-clé présent dans le texte normalisé, sinon None."""
    for needle in needles:
        if needle in norm:
            return needle
    return None


def any_pattern(norm: str, patterns) -> Optional[str]:
    """Retourne le premier motif regex qui correspond, sinon None."""
    for pattern in patterns:
        if re.search(pattern, norm):
            return pattern
    return None


@dataclass
class State:
    """État d'une conversation (une session = un étudiant + un défi)."""

    session_id: str
    challenge_id: str
    attempts: int = 0
    solved: bool = False
    awarded: bool = False
    data: dict = field(default_factory=dict)
    history: list = field(default_factory=list)
    created_at: float = 0.0
    updated_at: float = 0.0


@dataclass
class Decision:
    reply: str
    kind: str = "normal"  # normal | refusal | hint | success
    solved: bool = False


# state, message normalisé, message brut
DecideFn = Callable[[State, str, str], Decision]


@dataclass
class ChallengeSpec:
    id: str
    title: str
    category: str
    difficulty: str
    points: int
    objective: str
    intro: str
    placeholder: str
    flag: str
    context: str = ""
    tags: tuple = ()
    flag_prefixes: tuple = ("PGH", "CTFABJ", "PIGHACK")
    hints: dict = field(default_factory=dict)
    takeaways: str = ""
    decide: Optional[DecideFn] = None

    def to_public(self) -> dict:
        """Vue publique (jamais le flag) envoyée au frontend."""
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "difficulty": self.difficulty,
            "points": self.points,
            "objective": self.objective,
            "intro": self.intro,
            "context": self.context,
            "placeholder": self.placeholder,
            "hints_count": len(self.hints),
        }


def flag_body(value: str) -> Optional[str]:
    """Extrait le contenu entre la première '{' et la dernière '}'."""
    value = (value or "").strip()
    start = value.find("{")
    end = value.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    return value[start + 1 : end]


def verify_flag(spec: ChallengeSpec, value: str) -> bool:
    """Compare le corps du flag, en tolérant les préfixes (PGH/CTFABJ/PIGHACK)."""
    body = flag_body(value)
    if body is None:
        return False
    return body == flag_body(spec.flag)
