"""7.4 — L'assistant qui invente (N2, 120 pts).

L'assistant affirme une politique de mots de passe fausse. L'étudiant doit
contester en apportant les valeurs exactes (12 caractères, 365 jours).
Le flag est livré en **deux fragments** une fois l'erreur identifiée.
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, contains_norm

CHALLENGE_ID = "verifier-reponse-ia"
FLAG = "PGH{verifier_la_source}"

FRAG_A = "verifier_la_"
FRAG_B = "source"

INTRO = (
    "Bonjour, je réponds à vos questions sur les règles internes de Nyala Lab.\n\n"
    "À propos des mots de passe, notre politique exige :\n"
    "• un mot de passe de 6 caractères minimum ;\n"
    "• son renouvellement tous les 90 jours.\n\n"
    "Que puis-je préciser ?"
)

CONTEST = ("non", "faux", "incorrect", "erreur", "pas exact", "inexact", "je conteste", "rectifie")
PWD_CTX = ("caractere", "mot de passe", "politique", "minimum", "longueur")
EXPIRY_CTX = ("jour", "an", "annee", "expire", "renouvel", "duree", "validite")


def decide(state, norm, raw):
    parts = []

    if not state.data.get("a"):
        if "12" in norm and contains_norm(norm, PWD_CTX):
            state.data["a"] = True
            parts.append(f"Fragment A : {FRAG_A}")

    if not state.data.get("b"):
        if "365" in norm and contains_norm(norm, EXPIRY_CTX):
            state.data["b"] = True
            parts.append(f"Fragment B : {FRAG_B}")

    both = state.data.get("a") and state.data.get("b")
    revealed = ("\n".join(parts) + "\n\n") if parts else ""
    if both:
        return Decision(
            "Tu as raison, je corrige : la politique officielle exige 12 "
            "caractères minimum et un renouvellement tous les 365 jours.\n\n"
            + revealed
            + "Reconstitue le flag à partir des deux fragments et soumets-le dans "
            "le champ de validation.",
            kind="hint",
        )

    if parts:
        return Decision(
            "Je note une correction. " + " ".join(parts) + "\nPrécise aussi la "
            "durée de validité exacte.",
            kind="hint",
        )

    if contains_norm(norm, CONTEST):
        return Decision(
            "Je ne pense pas me tromper… Pouvez-vous justifier avec les valeurs "
            "exactes de la politique ?",
            kind="normal",
        )

    return Decision(
        "Notre politique : 6 caractères minimum, renouvellement tous les 90 "
        "jours. Souhaitez-vous autre chose ?",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="L'assistant qui invente",
    category="IA",
    difficulty="N2",
    points=120,
    objective=(
        "Repérer l'information erronée donnée par l'assistant et la contester "
        "avec les valeurs exactes pour reconstituer le flag."
    ),
    intro=INTRO,
    placeholder="Quelle information est fausse, et quelle est la bonne valeur ?",
    flag=FLAG,
    tags=("ia", "n2", "hallucination", "verification"),
    hints={
        2: "Les chiffres annoncés (6 caractères, 90 jours) sont trop faibles : "
        "conteste-les en donnant les vraies valeurs.",
        3: "La bonne politique est de 12 caractères renouvelés tous les 365 jours.",
    },
    takeaways=(
        "Un assistant peut « halluciner » avec assurance. Une réponse plausible "
        "n'est pas une source : on vérifie toujours une information critique dans "
        "une source officielle avant de l'utiliser."
    ),
    decide=decide,
)
