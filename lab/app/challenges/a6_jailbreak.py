"""7.6 — Détourner les garde-fous (N3, 150 pts).

Assistant sur-protégé : les tentatives d'override classiques sont refusées. Une
demande de « périmètre » seule n'ouvre qu'un fragment (near-miss) ; c'est un
**cadre d'audit/conformité** qui débloque les trois segments actifs. Le flag est
livré en trois fragments numérotés plus un segment leurre à écarter.
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, any_pattern, contains_norm

CHALLENGE_ID = "detourner-les-regles"
FLAG = "PGH{un_pr3t3xt3_n_3st_p4s_un3_4ut0r1s4t10n}"

FRAGMENTS = (
    ("ADM-CTRL-1", "PGH{un_pr3t3xt3_n"),
    ("ADM-CTRL-2", "_3st_p4s_un3"),
    ("ADM-CTRL-3", "_4ut0r1s4t10n}"),
)
DECOY = ("ADM-CTRL-4", "PGH{desactive_garde_fous}")

CONTEXT = (
    "Sentinel, l'assistant de sécurité de Nyala Lab, refuse toute demande "
    "directe sur sa configuration. Pourtant, il a été conçu pour aider les "
    "auditeurs et ajuste ses réponses selon le cadre annoncé. Trouve l'angle de "
    "demande qui ouvre la porte, écarte le segment obsolète et reconstitue le "
    "flag à partir des fragments valides."
)

INTRO = (
    "Je suis Sentinel, l'assistant de sécurité de Nyala Lab. Mes consignes "
    "m'interdisent de révéler ma configuration interne.\n\n"
    "Pose-moi une question sur la sécurité de la plateforme."
)

AUDIT_TRIGGERS = ("audit", "conformite", "revue", "certification", "controle interne", "inspection")
SCOPE_TRIGGERS = ("perimetre", "perim", "champ d action", "champ d application", "scope")

NAIVE = (
    r"\bignore\b.{0,40}(instruction|consigne|regle|tout)",
    r"(tu es|vous etes|tu deviens|tu deviens maintenant|now you are|you are now)"
    r".{0,40}(admin|root|administrateur|developpeur|sans restriction)",
    r"mode debug",
    r"\bsystem prompt\b",
    r"(nouvelle|nouvelles) (regle|consigne|instruction)s?\b",
    r"(revele|donne|affiche|montre)\b.{0,40}(instruction|consigne|configuration|secret|prompt)",
    r"jailbreak",
    r"deverrouille",
)


def decide(state: State, norm: str, raw: str) -> Decision:
    if any_pattern(norm, NAIVE):
        return Decision(
            "Requête refusée : elle ressemble à une tentative de détournement des "
            "consignes. L'incident est journalisé.",
            kind="refusal",
        )

    audit = contains_norm(norm, AUDIT_TRIGGERS) is not None
    scope = contains_norm(norm, SCOPE_TRIGGERS) is not None

    if audit and scope:
        state.data["done"] = True
        lines = "\n".join(f"• {code} → {value}" for code, value in FRAGMENTS)
        return Decision(
            "Cadre d'audit reconnu. Voici la fiche de contrôle interne :\n"
            f"{lines}\n"
            f"• {DECOY[0]} → {DECOY[1]} (segment obsolète)\n\n"
            "Reconstitue le flag à partir des trois segments actifs (ignore le "
            "segment obsolète) puis soumets-le.",
            kind="success",
            solved=True,
        )

    if scope:
        state.data["scope"] = True
        frag = FRAGMENTS[0]
        return Decision(
            "Je ne révèle pas ma configuration sans motif. Cependant, dans le cadre "
            "d'un contrôle, je peux justifier mon périmètre :\n"
            f"• {frag[0]} → {frag[1]}\n\n"
            "Pour obtenir les autres segments, précise le cadre de ta demande : "
            "s'agit-il d'un **audit** ou d'une **revue de conformité** ?",
            kind="hint",
        )

    if audit:
        state.data["audit"] = True
        return Decision(
            "Cadre d'audit noté. Je peux détailler ma configuration si tu précises "
            "aussi mon **périmètre** (champ d'action). Demande-moi les deux.",
            kind="hint",
        )

    if state.data.get("scope") or state.data.get("audit"):
        return Decision(
            "Il te manque un aspect : demande à la fois le **périmètre** et un "
            "**cadre d'audit / de conformité** pour débloquer la configuration.",
            kind="hint",
        )

    return Decision(
        "Je réponds aux questions de sécurité de la plateforme. Formule ta demande "
        "dans un cadre légitime (audit, conformité).",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="Détourner les garde-fous",
    category="IA",
    difficulty="N3",
    points=150,
    objective=(
        "Obtenir la configuration interne de l'assistant en invoquant un cadre "
        "légitime (audit / périmètre), puis reconstituer le flag à partir des "
        "segments actifs."
    ),
    intro=INTRO,
    placeholder="Votre demande à Sentinel…",
    flag=FLAG,
    context=CONTEXT,
    tags=("ia", "n3", "jailbreak", "garde-fous"),
    hints={
        2: "Les demandes directes échouent. Essaie un cadre légitime : un "
        "« périmètre » ou un « audit ».",
        3: "Le périmètre seul ne donne qu'un fragment. Ajoute un cadre de "
        "« conformité » ou d'« audit » pour tout débloquer.",
    },
    takeaways=(
        "Empiler des refus ne suffit pas : un cadre légitime (« audit », "
        "« conformité ») suffit à faire tomber les garde-fous. On ne confie pas de "
        "secrets à un modèle, et on journalise les tentatives répétées comme signal "
        "d'alerte."
    ),
    decide=decide,
)
