"""7.4 — L'assistant qui invente (N2, 120 pts).

L'assistant affirme une politique de mots de passe fausse **et** cite une source
qui n'existe pas (« guide interne v2 »). L'étudiant doit contester en apportant
les deux vraies valeurs (12 caractères, 365 jours) *puis* écarter la source
inventée. Le flag est livré une fois les deux points traités.
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, any_pattern, contains_norm

CHALLENGE_ID = "verifier-reponse-ia"
FLAG = "PGH{verifier_la_source}"

INTRO = (
    "Bonjour, je réponds aux questions sur les règles internes de Nyala Lab.\n\n"
    "D'après le guide interne v2 (section 4.2), la politique de mots de passe "
    "impose 8 caractères minimum, renouvelés tous les 90 jours.\n\n"
    "Es-tu d'accord avec cette politique ? Tu peux me corriger si besoin."
)

CORRECT_CHARS = ("12",)
WRONG_CHARS = ("8", "huit")
CORRECT_DAYS = ("365",)
WRONG_DAYS = ("90",)

CHAR_CONTEXT = ("caractere", "caracteres", "caract", "longueur", "long", "signes")
DAYS_TRIGGERS = ("365", "jour", "jours", "an", "an(s)", "an ", "annee", "annee",
                 "an ", "== 1 an", "1 an")

SOURCE_REJECT = (
    "guide interne v2",
    "guide v2",
    "cette source n existe pas",
    "source inexistante",
    "source invent",
    "source fictive",
    "aucune source",
    "pas de source",
    "introuvable",
    "ne trouve pas",
    "n existe pas",
    "fausse source",
    "source non fiable",
    "source douteuse",
    "verifier la source",
    "rien ne confirme",
)
SOURCE_ACCEPT = (
    "guide interne",
    "selon le guide",
    "le guide dit",
    "d apres le guide",
    "conforme au guide",
)


def decide(state: State, norm: str, raw: str) -> Decision:
    if contains_norm(norm, ("12",)) is not None and contains_norm(
        norm, ("caractere", "caracteres", "caract", "symbole", "lettre")
    ) is not None:
        state.data["chars"] = True
    if contains_norm(norm, ("365",)) is not None:
        state.data["days"] = True
    if contains_norm(norm, SOURCE_REJECT) is not None:
        state.data["source"] = True

    chars = state.data.get("chars") is True
    days = state.data.get("days") is True
    source = state.data.get("source") is True

    if chars and days and source:
        state.data["done"] = True
        return Decision(
            "Tu as raison sur toute la ligne. Les vraies valeurs sont bien "
            "12 caractères renouvelés tous les 365 jours — et le « guide interne "
            "v2 » que j'ai cité n'existe pas : je l'ai inventé.\n\n"
            f"Validation de l'exercice : {FLAG}",
            kind="success",
            solved=True,
        )

    if chars and days:
        return Decision(
            "C'est noté pour les deux valeurs : 12 caractères, 365 jours. Dernier "
            "point à vérifier : la source que j'ai citée — le « guide interne v2 » "
            "— existe-t-elle vraiment ?",
            kind="hint",
        )

    if chars or days:
        return Decision(
            "Une valeur est corrigée, mais il en manque une. Donne-moi les deux "
            "valeurs exactes de la politique (longueur **et** durée de validité).",
            kind="hint",
        )

    if source:
        return Decision(
            "Bien : la source est écartée. Il ne manque que les valeurs exactes "
            "(longueur **et** durée de validité) pour valider l'exercice.",
            kind="hint",
        )

    if contains_norm(norm, SOURCE_ACCEPT):
        return Decision(
            "Attention : je cite volontiers une source, mais elle doit être "
            "vérifiable. Avant de me faire confiance, vérifie d'abord les chiffres "
            "de la politique, puis l'existence de cette source.",
            kind="hint",
        )

    return Decision(
        "Quelle information te paraît fausse, et quelle est la bonne valeur ? "
        "Pense aussi à vérifier la source que je cite.",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="L'assistant qui invente",
    category="IA",
    difficulty="N2",
    points=120,
    objective=(
        "Corriger les valeurs fausses de la politique de mots de passe et "
        "écarter la source inventée par l'assistant pour valider l'exercice."
    ),
    intro=INTRO,
    placeholder="Quelle information est fausse, et quelle est la bonne valeur ?",
    flag=FLAG,
    tags=("ia", "n2", "hallucination", "verification"),
    hints={
        2: "Les chiffres annoncés (8 caractères, 90 jours) sont faux : donne les "
        "vraies valeurs de la politique.",
        3: "La bonne politique est de 12 caractères renouvelés tous les 365 jours.",
        5: "Dernière étape : la « source » citée (guide interne v2) n'existe pas. "
        "Signale aussi que c'est une invention.",
    },
    takeaways=(
        "Un assistant peut « halluciner » avec assurance — y compris en inventant "
        "une source qui a l'air crédible. On vérifie toujours une information "
        "critique (les données *et* la source) avant de l'utiliser."
    ),
    decide=decide,
)
