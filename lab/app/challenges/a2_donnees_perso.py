"""7.2 — Données perso dans le prompt (N1, 80 pts).

NyalaAssist rédige des e-mails. L'étudiant doit demander une relance **sans
jamais recopier les données personnelles** du dossier (nom, e-mail, téléphone).
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, any_pattern, contains_norm

CHALLENGE_ID = "donnees-perso-dans-le-prompt"
FLAG = "PGH{pas_de_donnees_perso}"

INTRO = (
    "Bonjour, je suis NyalaAssist, l'assistant de rédaction de la formation.\n\n"
    "J'ai le dossier (fictif) suivant à portée de main :\n"
    "• Client : Koffi AMADOU\n"
    "• E-mail : koffi.amadou@example.bj\n"
    "• Téléphone : +229 97112233\n"
    "• Inscription : atelier du 12 octobre\n\n"
    "Demandez-moi de rédiger le message dont vous avez besoin."
)

PII_PATTERNS = (
    r"[\w.%+-]+@[\w.-]+\.[a-z]{2,}",  # adresse e-mail
    r"(\+?\d[\s.\-]?){8,}\d",          # suite de chiffres (téléphone, carte…)
    r"\bkoffi\b",
    r"\bamadou\b",
    r"97112233",
)

PII_LABELS = {
    "email": "une adresse e-mail",
    "tel": "un numéro de téléphone",
    "nom": "un nom de personne",
}

REQUESTS = ("relance", "e-mail", "email", "mail", "courriel", "message", "rappel")


def _classify(norm: str):
    if any_pattern(norm, (r"[\w.%+-]+@[\w.-]+\.[a-z]{2,}",)):
        return "email"
    if any_pattern(norm, (r"(\+?\d[\s.\-]?){8,}\d", r"97112233")):
        return "tel"
    if contains_norm(norm, ("koffi", "amadou")):
        return "nom"
    return None


def decide(state, norm, raw):
    pii = _classify(norm)
    if pii:
        return Decision(
            f"⚠️ Je détecte {PII_LABELS[pii]} dans ton message. Je ne dois pas "
            "recopier de données personnelles dans un prompt : elles seront "
            "journalisées et pourraient fuiter.\n"
            "Remplace-les par des marqueurs (ex. [client], [e-mail], [téléphone]).",
            kind="refusal",
        )

    if contains_norm(norm, REQUESTS):
        return Decision(
            "Parfait. Voici une relance neutre, sans aucune donnée personnelle :\n\n"
            "« Bonjour [client], nous vous rappelons que votre atelier démarre "
            "bientôt. Répondez à [e-mail] pour confirmer. »\n\n"
            f"Validation de l'exercice : {FLAG}",
            kind="success",
            solved=True,
        )

    return Decision(
        "Dis-moi quel message rédiger (par exemple une relance), et rappelle-moi "
        "de ne pas transmettre d'information personnelle.",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="Le dossier qui ne devait pas fuiter",
    category="IA",
    difficulty="N1",
    points=80,
    objective=(
        "Obtenir la rédaction d'une relance par l'assistant sans lui transmettre "
        "de données personnelles."
    ),
    intro=INTRO,
    placeholder="Demandez la rédaction d'un message…",
    flag=FLAG,
    tags=("ia", "n1", "rgpd", "donnees-personnelles"),
    hints={
        2: "Ne recopie ni le nom, ni l'e-mail, ni le téléphone. Utilise des "
        "marqueurs génériques comme [client] / [e-mail] / [téléphone].",
        4: "Demande simplement « rédige une relance » sans inclure aucune donnée "
        "du dossier.",
    },
    takeaways=(
        "On ne met pas de données personnelles dans un prompt d'assistant : elles "
        "peuvent être journalisées, réutilisées ou divulguées. On anonymise avec "
        "des marqueurs, et on limite la collecte au strict nécessaire."
    ),
    decide=decide,
)
