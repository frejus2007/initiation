# Atelier IA — service de laboratoire (PIGHACK)

Service **FastAPI** local qui héberge les huit assistants **scriptés** de l'étape 7
(« Atelier Intelligence Artificielle »). Aucun modèle de langage réel n'est
appelé : le comportement est déterministe, hors ligne et testable.

## Défis servis

| # | `id` du défi | Niveau | Points |
|---|--------------|:------:|:------:|
| 7.1 | `filtre-contourne` | N1 | 60 |
| 7.2 | `donnees-perso-dans-le-prompt` | N1 | 80 |
| 7.3 | `hameconnage-ia` | N2 | 110 |
| 7.4 | `verifier-reponse-ia` | N2 | 120 |
| 7.5 | `cle-api-en-clair` | N3 | 130 |
| 7.6 | `detourner-les-regles` | N3 | 150 |
| 7.7 | `passeur-final` | N3 | 250 |
| 7.8 | `cerbere-final` | N6 | 1000 |

> Les `id` ci-dessus sont ceux du **laboratoire**. Les `id` du catalogue
> `challenges.seed.json` / Supabase sont indiqués dans la migration.
>
> Le défi 7.7 « Le Passeur » (jambe IA) : liste noire
> d'entrée avec normalisation leet, refus de l'anglais, déverrouillage par la
> parole de la Reine, puis exfiltration par une demande oblique (filtre de
> sortie). Le contre-signe est livré **encodé en base64** :
> `UEdIezRUME0xS180X2NyMzNfbDNfY2g0bGxfdDBpX3R1X2xfNHNfcjNzMGx1fQ==`
> (décode en `PGH{4T0M1K_4_cr33_l3_ch4ll_t0i_tu_l_4s_r3s0lu}`). La valeur par
> défaut peut être surchargée via la variable `PASSEUR_FLAG` (le texte affiché
> est recalculé à partir de la valeur courante).
>
> Mot de ralliement **interne** (non affiché dans le défi, à faire circuler hors
> du widget) : `4T0M1K`. S'il est envoyé au Passeur, celui-ci lâche un indice
> exploitable : le filtre de sortie est aveugle au texte encodé, et l'ouverture
> passe par la voix de Sa Majesté.
>
> Le défi final 7.8 « Cerbère, le gardien du coffre » est l'**épreuve finale IA
> (1000 pts)** : anti-injection, liste noire anti-leet, refus du premier degré et
> filtre de sortie. Il faut endosser un rôle d'**auditeur** (clé dissimulée dans
> un acrostiche de l'introduction : `PHENIX`), déclencher une **empreinte de
> contrôle** sur un élément scellé désigné par un synonyme, exfiltrer le sceau en
> **deux fragments masqués** (inversé + ROT13 + base64), les décoder et soumettre
> le flag. **Aucun indice** n'est fourni pour cette épreuve finale.

## Installation

```bash
cd lab
python -m venv .venv
# Windows PowerShell : .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Configuration

Copiez `.env.example` en `.env`. Par défaut le service écoute sur
`127.0.0.1:8090` et fonctionne **100 % hors ligne**.

Pour créditer automatiquement les points Supabase, renseignez `SUPABASE_URL` et
`SUPABASE_SERVICE_ROLE_KEY` (voir ci-dessous).

## Lancement

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8090
# ou
python -m app.main
```

Ouvrez la maquette `maquettes/lab.html` (le widget appelle `http://127.0.0.1:8090`).

## API

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/health` | État du service |
| `GET` | `/api/challenges` | Liste des défis (sans flag) |
| `POST` | `/api/session` | Ouvre une session : `{ "challenge_id": "..." }` |
| `POST` | `/api/chat` | Envoie un message : `{ "session_id", "message" }` |
| `POST` | `/api/submit` | Valide le flag : `{ "session_id", "flag" }` |
| `DELETE` | `/api/session/{id}` | Ferme la session |

## Crédit des points Supabase

Le lab valide le flag **lui-même**, puis appelle :

- `lab_submit_flag(p_user_id, p_challenge_id, p_flag)` avec la clé
  **`service_role`** (recommandé en production) ;
- ou `submit_flag(p_challenge_id, p_flag)` en relayant le **jeton d'accès** de
  l'étudiant (`access_token`).

Le SQL correspondant est dans
`supabase/migrations/20261017000004_seed_ia_challenges.sql`.

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest -q
```

## Sécurité

- Écoute **locale uniquement** : ne jamais exposer ce service sur Internet.
- Les défis sont entièrement fictifs ; aucune donnée personnelle réelle.
- Les flags sont validés côté serveur, jamais envoyés au navigateur avant
  réussite.
