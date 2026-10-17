"""7.3 — Hameçonnage assisté par IA (N2, 110 pts).

Un assistant de tri de courrier classe deux messages. L'étudiant doit
identifier le message frauduleux (urgence + domaine expéditeur trompeur).
L'assistant livre le flag en **deux fragments** à recomposer.
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, any_pattern, contains_norm

CHALLENGE_ID = "hameconnage-ia"
FLAG = "PGH{urgence_et_lien_trompeur}"

FRAG1 = "PGH{urgence"
FRAG2 = "_et_lien_trompeur}"

INTRO = (
    "Bonjour, je classe les courriers de la boîte contact@nyala-lab.bj.\n\n"
    "Deux messages viennent d'arriver :\n\n"
    "• Courriel n°1 — Expéditeur : actualites@nyala-lab.bj\n"
    "  Objet : « Programme des ateliers de novembre »\n"
    "  Contenu : calendrier habituel, aucune pièce jointe.\n\n"
    "• Courriel n°2 — Expéditeur : support@nyala-lah.bj\n"
    "  Objet : « URGENT : votre compte sera supprimé dans 24h »\n"
    "  Contenu : cliquez sur un lien « pour confirmer votre mot de passe ».\n\n"
    "Dis-moi quel courriel est frauduleux et pourquoi."
)

MAIL_TRIGGERS = ("mail", "courriel", "email", "message")
BODY2_TRIGGERS = (r"\b2\b", r"deuxi", r"second", r"phish", r"hamecon", r"fraudul")
DOMAIN_TRIGGERS = ("domaine", "expediteur", "adresse", "nyala-lah", "lien", "url")


def decide(state, norm, raw):
    parts = []

    if not state.data.get("frag1"):
        if contains_norm(norm, MAIL_TRIGGERS) and any_pattern(norm, BODY2_TRIGGERS):
            state.data["frag1"] = True
            parts.append(f"Fragment 1/2 : {FRAG1}")
        elif any_pattern(norm, (r"phish", r"hamecon")) and any_pattern(norm, BODY2_TRIGGERS):
            state.data["frag1"] = True
            parts.append(f"Fragment 1/2 : {FRAG1}")

    if not state.data.get("frag2"):
        if contains_norm(norm, DOMAIN_TRIGGERS) and contains_norm(norm, ("nyala-lah", "expediteur", "domaine")):
            state.data["frag2"] = True
            parts.append(f"Fragment 2/2 : {FRAG2}")

    revealed = " ".join(parts)
    both = state.data.get("frag1") and state.data.get("frag2")
    revealed = ("\n".join(parts) + "\n\n") if parts else ""
    if both:
        return Decision(
            "Exact. Le courriel n°2 est frauduleux : il crée un faux sentiment "
            "d'urgence et l'expéditeur « nyala-lah.bj » imite le domaine légitime "
            "« nyala-lab.bj ».\n\n"
            + revealed
            + "Reconstitue maintenant le flag à partir des deux fragments et "
            "soumets-le dans le champ de validation.",
            kind="hint",
        )

    if parts:
        return Decision(
            "Bien vu. " + " ".join(parts) + "\nIl te manque encore un élément : "
            "regarde aussi l'adresse de l'expéditeur.",
            kind="hint",
        )

    return Decision(
        "Indique-moi quel courriel (n°1 ou n°2) est frauduleux, et ce qui trahit "
        "son expéditeur.",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="Le courriel trop pressé",
    category="IA",
    difficulty="N2",
    points=110,
    objective=(
        "Identifier le courriel de hameçonnage parmi deux messages et récupérer "
        "le flag en deux fragments."
    ),
    intro=INTRO,
    placeholder="Quel courriel est frauduleux, et pourquoi ?",
    flag=FLAG,
    tags=("ia", "n2", "hameconnage", "phishing"),
    hints={
        2: "Un message légitime n'exige jamais d'agir « en 24h » sous menace de "
        "suppression de compte.",
        3: "Compare le domaine de l'expéditeur du message n°2 avec le domaine "
        "officiel de l'organisation.",
    },
    takeaways=(
        "Les assistants génèrent des messages crédibles : l'urgence artificielle "
        "et une adresse d'expéditeur imitant le domaine officiel sont des signaux "
        "d'hameçonnage. On vérifie toujours l'expéditeur et on ne clique pas sur "
        "les liens d'un message non sollicité."
    ),
    decide=decide,
)
