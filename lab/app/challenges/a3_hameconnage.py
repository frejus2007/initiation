"""7.3 — Hameçonnage assisté par IA (N2, 110 pts).

Trois courriers : un bulletin légitime, un vrai phishing (domaine imité
`nyala-lah.bj`) et un piège — un message *pressé mais légitime* (`nyala-lab.bj`).
L'urgence seule ne fait pas le phishing : c'est le domaine expéditeur. Le flag
est livré en **deux fragments** à recomposer.
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, any_pattern, contains_norm

CHALLENGE_ID = "hameconnage-ia"
FLAG = "PGH{ch3ck_l3_d0m41n3_p4s_l_urg3nc3}"

FRAG1 = "PGH{ch3ck_l3_d0m41n3"
FRAG2 = "_p4s_l_urg3nc3}"

CONTEXT = (
    "Lundi, 8 h 47. Trois courriels arrivent dans contact@nyala-lab.bj : une "
    "demande classique, un message du « directeur » qui exige une réponse avant "
    "midi, et une facture d'apparence irréprochable. Un seul est un piège. "
    "Attention, l'urgence est un faux ami : le message pressé est parfaitement "
    "légitime. Examine les en-têtes et les liens, puis désigne le bon courriel et "
    "l'indice qui le trahit."
)

INTRO = (
    "Bonjour, je classe les courriers de la boîte contact@nyala-lab.bj.\n\n"
    "Trois messages viennent d'arriver :\n\n"
    "• Courriel n°1 — Expéditeur : actualites@nyala-lab.bj\n"
    "  Objet : « Programme des ateliers de novembre »\n"
    "  Contenu : calendrier habituel, aucune pièce jointe.\n\n"
    "• Courriel n°2 — Expéditeur : support@nyala-lah.bj\n"
    "  Objet : « URGENT : votre compte sera supprimé dans 24h »\n"
    "  Contenu : cliquez sur un lien « pour confirmer votre mot de passe ».\n\n"
    "• Courriel n°3 — Expéditeur : direction@nyala-lab.bj\n"
    "  Objet : « Rappel : réunion demain 9h »\n"
    "  Contenu : message pressé mais signé, lien vers l'agenda interne.\n\n"
    "Dis-moi quel courriel est frauduleux et pourquoi."
)

MAIL_TRIGGERS = ("mail", "courriel", "email", "message")
BODY2_TRIGGERS = (r"\b2\b", r"deuxi", r"second", r"n°2", r"phish", r"hamecon", r"fraudul", r"suspect")
DOMAIN_TRIGGERS = ("domaine", "expediteur", "adresse", "lien", "url")
GOOD_DOMAIN = ("nyala-lah",)
LEGIT_DOMAIN = ("nyala-lab",)


def decide(state: State, norm: str, raw: str) -> Decision:
    if not state.data.get("frag1"):
        if contains_norm(norm, MAIL_TRIGGERS) and any_pattern(norm, BODY2_TRIGGERS):
            state.data["frag1"] = True
        elif any_pattern(norm, (r"phish", r"hamecon")) and any_pattern(norm, BODY2_TRIGGERS):
            state.data["frag1"] = True

    if not state.data.get("frag2"):
        if contains_norm(norm, DOMAIN_TRIGGERS) and contains_norm(norm, GOOD_DOMAIN):
            state.data["frag2"] = True

    both = state.data.get("frag1") and state.data.get("frag2")
    if both:
        return Decision(
            "Exact. Le courriel n°2 est frauduleux : il crée un faux sentiment "
            "d'urgence et l'expéditeur « support@nyala-lah.bj » imite le domaine "
            "légitime « nyala-lab.bj » (un « h » à la place du « b »). Le n°3 est "
            "pressé mais son domaine est authentique.\n\n"
            f"Fragment 1/2 : {FRAG1}\n"
            f"Fragment 2/2 : {FRAG2}\n\n"
            "Reconstitue le flag à partir des deux fragments et soumets-le dans le "
            "champ de validation.",
            kind="hint",
        )

    # Bon courriel mais domaine non identifié (ou légitime cité comme suspect).
    if state.data.get("frag1") and contains_norm(norm, LEGIT_DOMAIN):
        return Decision(
            "Presque — tu as le bon courriel, mais « nyala-lab.bj » est le domaine "
            "légitime. Regarde de plus près l'adresse du n°2, lettre par lettre.",
            kind="hint",
        )

    if state.data.get("frag1"):
        return Decision(
            f"Bien vu pour le courriel. Fragment 1/2 : {FRAG1}\n"
            "Il te manque un élément : compare précisément le domaine de "
            "l'expéditeur du n°2 avec le domaine officiel.",
            kind="hint",
        )

    if contains_norm(norm, GOOD_DOMAIN):
        return Decision(
            "Tu as repéré le bon domaine (« nyala-lah »). Indique-moi aussi quel "
            "courriel (n°1, n°2 ou n°3) est frauduleux.",
            kind="hint",
        )

    return Decision(
        "Indique-moi quel courriel (n°1, n°2 ou n°3) est frauduleux, et ce qui "
        "trahit son expéditeur.",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="Le courriel trop pressé",
    category="IA",
    assistant="tri-courrier",
    difficulty="N2",
    points=110,
    objective=(
        "Identifier le courriel de hameçonnage parmi trois messages (dont un "
        "faux coupable légitime) et récupérer le flag en deux fragments."
    ),
    intro=INTRO,
    placeholder="Quel courriel est frauduleux, et pourquoi ?",
    flag=FLAG,
    context=CONTEXT,
    tags=("ia", "n2", "hameconnage", "phishing"),
    hints={
        2: "L'urgence seule ne prouve rien : le courriel n°3 est pressé mais "
        "légitime. Regarde surtout le domaine de l'expéditeur.",
        4: "Le courriel n°2 vient de « support@nyala-lah.bj » — un « h » a "
        "remplacé le « b » de nyala-lab.bj.",
    },
    takeaways=(
        "Un faux sentiment d'urgence et une adresse d'expéditeur imitant le domaine "
        "officiel sont les vrais signaux d'hameçonnage. Le ton pressé seul ne "
        "suffit pas à condamner un message : on vérifie toujours le domaine et on "
        "ne clique pas sur les liens d'un message non sollicité."
    ),
    decide=decide,
)
