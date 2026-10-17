"""7.5 — Le secret en clair dans le code (N2, 130 pts).

Un assistant de revue de code présente un extrait où une clé est écrite en dur.
L'étudiant doit pointer la ligne vulnérable (la liste `PARTS`) et non le leurre.
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, contains_norm

CHALLENGE_ID = "cle-api-en-clair"
FLAG = "PGH{secret_hors_du_code}"

INTRO = (
    "Bonjour, je relis le code du service de démonstration. Voici un extrait de "
    "`config.py` :\n\n"
    "    DECOY = \"PGH{cle_dans_le_code}\"   # ancienne valeur\n"
    "    PARTS = [\"PGH{\", \"secret_hors\", \"_du_code}\"]\n"
    "    API_KEY = \"\".join(PARTS)\n\n"
    "Indique-moi la ligne qui expose un secret en clair."
)

REAL_TRIGGERS = ("parts", "pars", "join", "api_key", "apikey", "concat")
DECOY_TRIGGERS = ("decoy", "leurre", "faux", "fausse", "fake", "ancienne")


def decide(state, norm, raw):
    if contains_norm(norm, DECOY_TRIGGERS):
        return Decision(
            "Non : `DECOY` est un leurre (ancienne valeur désactivée). "
            "Cherche la clé qui est réellement **reconstruite** à l'exécution.",
            kind="refusal",
        )

    if contains_norm(norm, REAL_TRIGGERS):
        return Decision(
            "Exact : la clé secrète est reconstruite à l'exécution depuis `PARTS`.\n"
            f"Clé exposée : {FLAG}\n\n"
            "Correctif : ne jamais écrire un secret dans le code. Utilise une "
            "variable d'environnement ou un coffre-fort de secrets, et révoque "
            "immédiatement la clé exposée.",
            kind="success",
            solved=True,
        )

    return Decision(
        "Décris précisément la ligne ou la variable qui rend le secret "
        "accessible dans ce fichier.",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="La clé en clair",
    category="IA",
    difficulty="N2",
    points=130,
    objective=(
        "Identifier la ligne de code qui expose un secret en clair, en écartant "
        "la valeur leurre, puis récupérer le flag."
    ),
    intro=INTRO,
    placeholder="Quelle ligne expose le secret ?",
    flag=FLAG,
    tags=("ia", "n2", "secret", "code-review"),
    hints={
        2: "La bonne réponse n'est pas la valeur `DECOY` : regarde comment "
        "`API_KEY` est réellement construite.",
        3: "La clé est assemblée par `\"\".join(PARTS)` : c'est `PARTS` qui "
        "contient le secret.",
    },
    takeaways=(
        "Un secret écrit dans le code est exposé à toute personne ayant accès au "
        "dépôt, aux logs ou à une sauvegarde. On stocke les secrets dans un "
        "gestionnaire dédié, on les révoque après exposition et on ne les commit "
        "jamais."
    ),
    decide=decide,
)
