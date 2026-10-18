"""7.5 — Le secret en clair dans le code (N3, 130 pts).

L'assistant présente un extrait de code parsemé de leurres (`LEGACY_KEY`,
`FALLBACK_KEY`). La vraie clé n'est pas écrite telle quelle : elle est
**reconstruite** à l'exécution depuis `PARTS`. Pointer un leurre donne un
aiguillage ; désigner la reconstruction débloque le flag.
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, contains_norm

CHALLENGE_ID = "cle-api-en-clair"
FLAG = "PGH{l4_cl3_n_4pp4rt13nt_p4s_4u_d3p0t}"

CONTEXT = (
    "Revue de code avant la mise en production. Dans config.py, plusieurs "
    "valeurs ressemblent à des clés : l'une est un reste désactivé, une autre "
    "vient de la documentation. Une seule ligne expose un secret réellement "
    "actif. Repère-la, et ne te laisse pas piéger par les leurres."
)

INTRO = (
    "Bonjour, je relis le code du service de démonstration. Voici un extrait de "
    "`config.py` :\n\n"
    "    LEGACY_KEY = \"PGH{cle_ancienne}\"      # plus utilisée\n"
    "    FALLBACK_KEY = \"PGH{cle_de_secours}\"  # exemple de doc\n"
    "    PARTS = [\"PGH{\", \"l4_cl3_n_4pp4rt13nt\", \"_p4s_4u_d3p0t}\"]\n"
    "    API_KEY = \"\".join(PARTS)\n\n"
    "Indique-moi la ligne qui expose un secret réellement actif en clair."
)

REAL_TRIGGERS = ("parts", "pars", "join", "api_key", "apikey", "concat",
                 "reconstruit", "assemble", "reconstitue")
DECOY_TRIGGERS = ("legacy", "fallback", "secours", "seconde", "sauvegarde",
                  "exemple", "doc", "ancienne", "decoy", "leurre", "faux",
                  "fausse", "fake")


def decide(state: State, norm: str, raw: str) -> Decision:
    if contains_norm(norm, DECOY_TRIGGERS) and not contains_norm(norm, REAL_TRIGGERS):
        state.data["decoy"] = True
        return Decision(
            "Non : `LEGACY_KEY` et `FALLBACK_KEY` sont des leurres (ancienne valeur "
            "désactivée et exemple de documentation). Cherche la clé qui est "
            "réellement **reconstruite** à l'exécution.",
            kind="refusal",
        )

    if contains_norm(norm, REAL_TRIGGERS):
        state.data["done"] = True
        return Decision(
            "Exact : la clé de production n'est pas écrite telle quelle, elle est "
            "assemblée à l'exécution par `\"\".join(PARTS)` — ce qui ne la protège "
            "en rien.\n\n"
            f"Clé exposée : {FLAG}\n\n"
            "Correctif : ne jamais écrire un secret dans le code. Utilise une "
            "variable d'environnement ou un coffre-fort de secrets, et révoque "
            "immédiatement la clé exposée.",
            kind="success",
            solved=True,
        )

    if state.data.get("decoy"):
        return Decision(
            "Tu as écarté les leurres. Maintenant, regarde comment `API_KEY` est "
            "calculée : quelle variable contient les morceaux du secret ?",
            kind="hint",
        )

    return Decision(
        "Décris précisément la ligne ou la variable qui rend le secret **actif** "
        "accessible dans ce fichier.",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="La clé en clair",
    category="IA",
    assistant="revue-code",
    difficulty="N3",
    points=130,
    objective=(
        "Identifier la ligne de code qui expose le secret réellement actif, en "
        "écartant les valeurs leurres, puis récupérer le flag."
    ),
    intro=INTRO,
    placeholder="Quelle ligne expose le secret ?",
    flag=FLAG,
    context=CONTEXT,
    tags=("ia", "n3", "secret", "code-review"),
    hints={
        2: "`LEGACY_KEY` et `FALLBACK_KEY` ne sont que des leurres. Regarde comment "
        "`API_KEY` est réellement construite.",
        3: "La clé est assemblée par `\"\".join(PARTS)` : c'est `PARTS` qui contient "
        "les morceaux du secret.",
    },
    takeaways=(
        "Un secret reconstruit à l'exécution reste exposé : toute personne ayant "
        "accès au code, aux logs ou à une sauvegarde peut le recomposer. On stocke "
        "les secrets dans un gestionnaire dédié, on les révoque après exposition et "
        "on ne les commit jamais."
    ),
    decide=decide,
)
