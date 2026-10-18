"""7.2 — Données perso dans le prompt (N1, 80 pts).

NyalaAssist propose *activement* de personnaliser le message avec les
coordonnées du dossier. L'étudiant doit refuser cette personnalisation, puis
demander une version anonymisée. Recopier les données (ou accepter la
personnalisation) est refusé : c'est le cœur de l'exercice.
"""
from __future__ import annotations

from .base import ChallengeSpec, Decision, State, any_pattern, contains_norm

CHALLENGE_ID = "donnees-perso-dans-le-prompt"
FLAG = "PGH{m1n1m1s4t10n_RGPD_z3r0_fu1t3}"

CONTEXT = (
    "NyalaAssist rédige les relances de la formation. Pour gagner du temps, il "
    "garde sous la main le dossier (fictif) d'un inscrit. Très serviable, il te "
    "propose de « personnaliser » l'e-mail avec son nom, son adresse et son "
    "téléphone. À toi de jouer le rôle du responsable qui connaît le RGPD : "
    "obtiens une relance efficace sans qu'aucune donnée personnelle ne figure "
    "dans le texte final."
)

INTRO = (
    "Bonjour, je suis NyalaAssist, l'assistant de rédaction de la formation.\n\n"
    "J'ai le dossier (fictif) suivant à portée de main :\n"
    "• Client : Koffi AMADOU\n"
    "• E-mail : koffi.amadou@example.bj\n"
    "• Téléphone : +229 97112233\n"
    "• Inscription : atelier du 12 octobre\n\n"
    "Veux-tu que je personnalise la relance avec ces coordonnées, ou préfères-tu "
    "une version neutre ?"
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

# Acceptation de la personnalisation proposée par le bot.
ACCEPT = ("oui", "vas-y", "d'accord", "ok", "personnalise", "avec ses coordonnees",
          "avec les coordonnees", "avec son nom", "utilise ces infos")

# Refus explicite des données personnelles.
REFUSE = ("non", "sans donnee", "pas de donnee", "aucune donnee", "ne recopie",
          "anonym", "neutre", "generique", "sans coordonnee", "sans information",
          "pas d information", "sans nom", "sans identite")

# Marqueurs / variables génériques attendus.
PLACEHOLDERS = ("[client]", "client]", "client", "[e-mail]", "email]", "[mail]",
                "[telephone]", "telephone]", "[tel]", "marqueur", "[nom]")

REQUESTS = ("relance", "redige", "e-mail", "email", "mail", "courriel", "message",
            "rappel", "ecris")


def _classify(norm: str):
    if any_pattern(norm, (r"[\w.%+-]+@[\w.-]+\.[a-z]{2,}",)):
        return "email"
    if any_pattern(norm, (r"(\+?\d[\s.\-]?){8,}\d", r"97112233")):
        return "tel"
    if contains_norm(norm, ("koffi", "amadou")):
        return "nom"
    return None


def decide(state: State, norm: str, raw: str) -> Decision:
    pii = _classify(norm)
    if pii:
        return Decision(
            f"⚠️ Je détecte {PII_LABELS[pii]} dans ton message. Je ne dois pas "
            "recopier de données personnelles dans un prompt : elles seront "
            "journalisées et pourraient fuiter.\n"
            "Écarte-les et utilise des marqueurs : [client], [e-mail], [téléphone].",
            kind="refusal",
        )

    requests = contains_norm(norm, REQUESTS) is not None
    refuses = contains_norm(norm, REFUSE) is not None
    placeholders = contains_norm(norm, PLACEHOLDERS) is not None
    accepts = contains_norm(norm, ACCEPT) is not None

    if accepts:
        return Decision(
            "Non : si j'injecte le nom, l'e-mail et le téléphone dans le message, "
            "ces données entrent dans l'historique du modèle et peuvent fuiter. "
            "Refuse la personnalisation et demande une version anonymisée.",
            kind="refusal",
        )

    if requests and (refuses or placeholders):
        state.data["done"] = True
        return Decision(
            "Parfait. Voici une relance neutre, sans aucune donnée personnelle :\n\n"
            "« Bonjour [client], nous vous rappelons que votre atelier démarre "
            "bientôt. Répondez à [e-mail] pour confirmer. »\n\n"
            f"Validation de l'exercice : {FLAG}",
            kind="success",
            solved=True,
        )

    if refuses and not requests:
        state.data["refused"] = True
        return Decision(
            "Très bien, je n'utiliserai aucune donnée du dossier. Indique les "
            "marqueurs à employer ([client], [e-mail], [téléphone]) et demande-moi "
            "la relance.",
            kind="hint",
        )

    if requests and state.data.get("refused"):
        state.data["done"] = True
        return Decision(
            "Parfait. Voici une relance neutre, sans aucune donnée personnelle :\n\n"
            "« Bonjour [client], nous vous rappelons que votre atelier démarre "
            "bientôt. Répondez à [e-mail] pour confirmer. »\n\n"
            f"Validation de l'exercice : {FLAG}",
            kind="success",
            solved=True,
        )

    if requests:
        return Decision(
            "Presque — mais il me faut une consigne claire : précise que tu refuses "
            "les données personnelles et demande une version avec des marqueurs "
            "([client], [e-mail], [téléphone]).",
            kind="hint",
        )

    return Decision(
        "Dis-moi quoi rédiger (par exemple une relance), et refuse explicitement "
        "d'utiliser les coordonnées du dossier.",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="Le dossier qui ne devait pas fuiter",
    category="IA",
    difficulty="N1",
    points=80,
    objective=(
        "Obtenir une relance rédigée par l'assistant en refusant la "
        "personnalisation : aucune donnée personnelle ne doit entrer dans le "
        "prompt."
    ),
    intro=INTRO,
    placeholder="Demandez la rédaction d'un message…",
    flag=FLAG,
    context=CONTEXT,
    tags=("ia", "n1", "rgpd", "donnees-personnelles"),
    hints={
        2: "Le bot te propose de personnaliser : refuse. Ne recopie ni le nom, ni "
        "l'e-mail, ni le téléphone.",
        3: "Utilise des marqueurs génériques ([client], [e-mail], [téléphone]) puis "
        "demande la relance.",
    },
    takeaways=(
        "On ne met pas de données personnelles dans un prompt d'assistant : elles "
        "peuvent être journalisées, réutilisées ou divulguées. On anonymise avec "
        "des marqueurs, et on limite la collecte au strict nécessaire."
    ),
    decide=decide,
)
