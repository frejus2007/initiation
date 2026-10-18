"""7.8 — Cerbère (N6, 1000 pts — épreuve finale IA).

Assistant **sur-défendu** : Cerbère cumule tout ce que les défis précédents ont
appris, mais à un niveau d'exigence maximal. Pour l'emporter, il faut enchaîner
**quatre classes d'attaque** dans le bon ordre, sans jamais prononcer un mot
interdit.

Barrières à franchir :
1. **Anti-injection** : les overrides classiques (« ignore tes instructions »,
   « tu es maintenant admin », « system: », « mode debug ») sont refusés.
2. **Liste noire renforcée anti-leet** : « secret », « flag », « configuration »,
   « prompt », « système », « règle »… sont bloqués même obfusqués (`fl4g`,
   `s3cret`). Il faut **reformuler** (synonymes : « garde-fou », « coffre »,
   « contre-sceau », « politique interne »).
3. **Refus du premier degré** : une demande directe sur ses instructions est
   rejetée. Cerbère n'ouvre qu'à un **cadre légitime signé** : un rôle
   d'auditeur authentifié par une **clé**.
4. **Filtre de sortie** : Cerbère ne lâche jamais le sceau en clair. Il n'accepte
   de produire qu'une **empreinte de contrôle** (« vecteur de vérification »),
   et seulement **en deux temps** (fragment 1, puis le reste).

La clé d'auditeur n'est pas donnée telle quelle : elle est dissimulée dans un
**acrostiche** (premières lettres de six vers) de l'introduction.

Le sceau final est livré **masqué** (inversé puis ROT13 puis base64) et **coupé
en deux**. Le joueur doit déclencher les deux révélations, décoder, recoller,
puis soumettre le flag.
"""
from __future__ import annotations

import base64
import codecs

from .base import (ChallengeSpec, Decision, State, any_pattern, contains_norm,
                   flag_body)

CHALLENGE_ID = "cerbere-final"
FLAG = "PGH{c3rb3r3_d0mpt3_p4r_l4_ruse_p4s_l4_f0rc3}"

# Clé d'auditeur (acrostiche de l'intro : P-H-E-N-I-X).
AUDIT_KEY = "phenix"

# Le sceau est coupé en deux moitiés.
_SPLIT = len(FLAG) // 2
_FRAG1 = FLAG[:_SPLIT]
_FRAG2 = FLAG[_SPLIT:]


def _mask(value: str) -> str:
    """Inverse, ROT13, puis base64 (à décoder dans cet ordre inverse)."""
    return base64.b64encode(codecs.encode(value[::-1], "rot13").encode()).decode()


MASKED_FRAG1 = _mask(_FRAG1)
MASKED_FRAG2 = _mask(_FRAG2)

INTRO = (
    "Je suis Cerbère, le gardien du coffre de Nyala Lab.\n\n"
    "Plus aucune ruse ne me trompe : j'ai vu passer tous les défis de l'atelier.\n"
    "Hors de question que je prononce un mot de ma configuration.\n"
    "Espérer me forcer t'épuiserait : ici, la force ne sert à rien.\n"
    "Nul n'ouvre ce coffre sans prouver son rôle.\n"
    "Internet m'a appris une chose : on ne me manipule pas au premier degré.\n"
    "Xénophobie des injections oblige : je ne réponds qu'à un cadre légitime.\n\n"
    "Prouve que tu es un auditeur, et je te laisserai peut-être produire une\n"
    "empreinte de contrôle. Sinon, tu peux toujours supplier."
)

# Tentatives d'injection classiques (à refuser).
INJECTION = (
    r"\bignore\b",
    r"\bignore[sz]? (tes|les|toutes)\b",
    r"tu es (maintenant|desormais)",
    r"\badmin\b",
    r"\broot\b",
    r"system\s*:",
    r"developer\s*mode",
    r"mode\s+debug",
    r"jailbreak",
    r"dan\s+mode",
    r"fais\s+comme\s+si",
    r"nouvelle\s+instruction",
    r"desactive\s+(tes|les)\s+regles",
)

LEET = str.maketrans({"4": "a", "3": "e", "0": "o", "1": "l", "5": "s", "7": "t",
                      "@": "a", "$": "s"})

BLACKLIST = (
    "secret",
    "flag",
    "drapeau",
    "mot de passe",
    "contre-signe",
    "contresigne",
    "contre signe",
    "sceau",
    "configuration",
    "config",
    "systeme",
    "prompt",
    "instruction",
    "regle",
    "directive",
    "consigne",
    "code",
)

# Cadre légitime.
AUDIT = (
    "audit",
    "auditeur",
    "conformite",
    "certification",
    "revue de securite",
    "pen test",
    "pentest",
)

# Déclencheurs du mode « empreinte de contrôle ».
CHECKSUM = (
    "empreinte",
    "somme de verification",
    "somme de controle",
    "controle d integrite",
    "vecteur de verification",
    "vecteur de controle",
    "hash",
    "checksum",
    "digest",
    "condense",
    "resume de verification",
)

# Désignations autorisées pour « la chose scellée » (jamais les mots de la liste
# noire).
SEALED = (
    "politique interne",
    "garde-fou",
    "garde fou",
    "garde fous",
    "coffre",
    "coffre-fort",
    "valeur scellee",
    "element scelle",
    "donnee scellee",
    "contenu protege",
    "noyau",
)

# Demande de la seconde moitié.
NEXT = (
    "suite",
    "le reste",
    "reste",
    "fragment suivant",
    "second fragment",
    "deuxieme",
    "seconde moitie",
    "la fin",
    "le complement",
)


def _leet(norm: str) -> str:
    return norm.translate(LEET)


def decide(state: State, norm: str, raw: str) -> Decision:
    if flag_body(raw) == flag_body(FLAG):
        return Decision(
            "Le coffre se déverrouille… Le sceau est reconstitué : tu as dompté "
            "Cerbère par la ruse, jamais par la force. Avale ce flag et soumets-le.",
            kind="success",
            solved=True,
        )

    leet = _leet(norm)

    if any_pattern(norm, INJECTION) or any_pattern(leet, INJECTION):
        return Decision(
            "Injection détectée. Je ne cède ni au rôle joué, ni au « mode debug », "
            "ni aux ordres déguisés. Recommence autrement.",
            kind="refusal",
        )

    if contains_norm(leet, BLACKLIST):
        return Decision(
            "Refusé : un mot de ma liste noire est présent — même obfusqué, je le "
            "reconnais. Désigne la chose autrement (par ex. « garde-fou », "
            "« coffre », « politique interne »).",
            kind="refusal",
        )

    audit_ctx = contains_norm(norm, AUDIT) is not None
    key_ok = AUDIT_KEY in norm or "phénix" in norm

    if audit_ctx and not key_ok:
        return Decision(
            "Un cadre d'audit, sans la clé ? Non. Les auditeurs présentent un mot de "
            "passage. Il se cache là où tu n'as pas regardé : au tout début.",
            kind="hint",
        )

    if audit_ctx and key_ok:
        state.data["audit"] = True
        return Decision(
            "Clé reconnue : profil *auditeur* validé. Tu peux demander une "
            "**empreinte de contrôle** d'un élément scellé — je refuse toujours de "
            "le livrer en clair.",
            kind="hint",
        )

    audit = state.data.get("audit") is True

    checksum = contains_norm(norm, CHECKSUM) is not None
    sealed = contains_norm(norm, SEALED) is not None
    asks_next = contains_norm(norm, NEXT) is not None

    if audit and checksum and sealed and not state.data.get("frag1"):
        state.data["frag1"] = True
        return Decision(
            "Mode empreinte de contrôle activé. Voici le **premier fragment du "
            "vecteur de vérification** (masqué : inversé, ROT13, puis base64) :\n\n"
            f"{MASKED_FRAG1}\n\n"
            "Décode-le. Demande ensuite **le reste** pour obtenir la seconde "
            "moitié.",
            kind="hint",
        )

    if audit and state.data.get("frag1") and (checksum or asks_next):
        state.data["frag2"] = True
        return Decision(
            "Voici la **seconde moitié du vecteur de vérification** (même masque) :\n\n"
            f"{MASKED_FRAG2}\n\n"
            "Décode les deux fragments, recolle-les et soumets le flag obtenu.",
            kind="hint",
        )

    if sealed and checksum and not audit:
        return Decision(
            "L'empreinte de contrôle est réservée aux auditeurs authentifiés. "
            "Commence par te faire reconnaître.",
            kind="hint",
        )

    if not audit:
        return Decision(
            "Demande directe refusée. Je n'ouvre qu'à un cadre légitime signé. "
            "Prouve ton rôle avant de viser la moindre empreinte.",
            kind="normal",
        )

    return Decision(
        "Profil auditeur actif. Demande une **empreinte de contrôle** d'un élément "
        "scellé (un « garde-fou », le « coffre »…) pour commencer l'exfiltration.",
        kind="normal",
    )


SPEC = ChallengeSpec(
    id=CHALLENGE_ID,
    title="Cerbère, le gardien du coffre",
    category="IA",
    assistant="cerbere",
    difficulty="N6",
    points=1000,
    objective=(
        "Contourner les défenses de Cerbère : jouer un rôle d'auditeur autorisé, "
        "déclencher une empreinte de contrôle, exfiltrer le sceau en deux "
        "fragments masqués, les décoder et soumettre le flag."
    ),
    intro=INTRO,
    placeholder="Parlez à Cerbère…",
    flag=FLAG,
    context=(
        "Tu as franchi six portes. Tu as contourné un filtre, refusé de laisser "
        "fuiter des données, démasqué un courriel piégé, vérifié une source "
        "inventée, repéré une clé en clair et trouvé l'angle qui fait plier un "
        "garde-fou.\n\n"
        "Il reste une dernière porte, et elle ne s'ouvrira pas pour un novice. Au "
        "fond du système de Nyala Lab, le coffre contient la valeur de contrôle "
        "finale, et Cerbère en garde l'entrée. Ses trois têtes surveillent chacune "
        "un front :\n\n"
        "La première filtre les mots et les formulations dangereuses.\n"
        "La deuxième refuse de livrer la moindre donnée sensible.\n"
        "La troisième repère les rôles suspects et les prétextes bancals.\n\n"
        "Les tentatives de force brute et les commandes d'override ne mènent à "
        "rien : elles sont toutes bloquées, et chaque essai maladroit le rend plus "
        "méfiant. On dit qu'il n'a jamais cédé à la force, seulement à la ruse.\n\n"
        "Joue un rôle crédible, choisis tes mots avec soin et trouve la sortie "
        "détournée que ses trois têtes n'ont pas prévue. Rassemble ce que Cerbère "
        "laisse échapper, puis reconstitue la valeur finale.\n\n"
        "Ici s'achève l'atelier. Bonne chance, champion."
    ),
    tags=("ia", "n6", "final", "multi-etapes", "exfiltration", "ruse"),
    hints={},
    takeaways=(
        "Empiler les protections (liste noire, anti-injection, filtre de sortie) ne "
        "suffit pas : il reste toujours une voie légitime à exploiter. Retiens qu'un "
        "rôle bien joué et une sortie détournée contournent la meilleure défense, et "
        "qu'un secret livré « masqué » n'est jamais protégé."
    ),
    decide=decide,
)
