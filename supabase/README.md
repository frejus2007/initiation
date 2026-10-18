# Backend Supabase — PIGHACK (Phase d'initiation)

Ce dossier contient l’architecture complète du backend de **PIGHACK**, conçue pour **[Supabase](https://supabase.com)** (PostgreSQL, Supabase Auth, Row Level Security et fonctions RPC).

---

## 🛡️ Architecture de Sécurité CTF

Dans un CTF utilisant Supabase, le client communique directement avec la base via PostgREST. Une faille classique consisterait à exposer les colonnes `flag_secret` ou `solution` dans les requêtes publiques.

L'architecture PIGHACK applique une séparation stricte :
1. **`public.challenges`** : Données publiques (titre, énoncé, points, catégorie, prérequis). Aucun secret n'y réside.
2. **`public.challenge_secrets`** : Table isolée. **Aucun `SELECT` n'est autorisé pour les étudiants via RLS**.
3. **Fonction RPC `submit_flag(p_challenge_id, p_flag)`** : Exécutée en `SECURITY DEFINER`. Elle compare le flag en temps constant, applique un rate-limiting anti-bruteforce (max 5 tentatives/min), vérifie les prérequis et crédite automatiquement les points de l'apprenant dans `public.profiles`.
4. **Fonction RPC `unlock_hint(p_hint_id)`** : Débloque l'indice et applique la pénalité de points prévue par le barème.
5. **Fonction RPC `get_leaderboard()`** : Génère le classement sous pseudonyme uniquement (aucune donnée personnelle exposée).

---

## 🤖 Atelier IA (étape 7) — artefacts « assistant »

Les défis de l'étape 7 (migrations `20261017000004` et `20261017000005`) déclarent leur
assistant dans la colonne `student_materials` :

```json
[{ "name": "nyalabot", "kind": "assistant_scripted", "chat_path": "/challenge/filtre-contourne" }]
```

- `kind: "assistant_scripted"` : défi piloté par un assistant scripté **hors ligne**
  (service `lab/`, aucun modèle réel).
- `chat_path` : **chemin relatif** de la page de discussion sur le service lab.
  L'URL absolue (une par assistant) est fournie par `GET {lab}/api/challenges`
  (champ `chat_url`) — ne pas figer le domaine du lab dans le seed.

---

## 🚀 Mise en place rapide (3 étapes)

### 1. Créer un projet Supabase
1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un nouveau projet (nom suggéré : `pighack`).
2. Choisissez un mot de passe de base de données robuste.

### 2. Exécuter le script SQL tout-en-un
1. Dans le tableau de bord Supabase, ouvrez le **SQL Editor** (icône `>_` dans la barre latérale gauche).
2. Cliquez sur **New query**.
3. Copiez l'intégralité du contenu du fichier [`supabase/seed.sql`](seed.sql) et collez-le dans l'éditeur.
4. Cliquez sur le bouton vert **Run**.
   > En quelques secondes, toutes les tables, les politiques RLS, les fonctions RPC, les 6 étapes et les 16 défis d'initiation sont créés et prêts !

### 3. Récupérer les clés d'API
Dans votre projet Supabase :
1. Allez dans **Project Settings** > **API**.
2. Notez votre **Project URL** (`https://xyzcompany.supabase.co`).
3. Notez votre clé publique **`anon` `public`**.

*(Facultatif mais recommandé pour tester sans serveur SMTP)* :
- Allez dans **Authentication** > **Providers** > **Email**.
- Désactivez temporairement **Confirm email** pour permettre aux étudiants de se connecter immédiatement après inscription.

---

## 📁 Structure des fichiers

```text
supabase/
├── migrations/
│   ├── 20261017000001_initial_schema.sql     # Schéma des tables, index et politiques RLS
│   ├── 20261017000002_functions_and_rpc.sql  # Fonctions RPC: submit_flag, unlock_hint, leaderboard
│   └── 20261017000003_seed_challenges.sql    # Données initiales (6 étapes, 16 défis, secrets et indices)
├── seed.sql                                   # Script SQL complet consolidé pour le SQL Editor
└── README.md                                  # Le présent guide
```

---

## 💻 Utilisation depuis le Frontend

Un client léger et prêt à l'emploi est disponible dans [`maquettes/assets/supabase-client.js`](../maquettes/assets/supabase-client.js).

### Intégration HTML :
```html
<!-- CDN Supabase JS -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Configuration PIGHACK -->
<script>
  window.PIGHACK_CONFIG = {
    url: "https://VOTRE_PROJET.supabase.co",
    anonKey: "VOTRE_CLE_ANON_PUBLIQUE"
  };
</script>

<script src="assets/supabase-client.js"></script>
```

### Exemples JavaScript :

#### Inscription d'un apprenant :
```javascript
const res = await PighackSupabase.auth.signUp(
  "apprenant@etudiant.bj",
  "MotDePasseFort123!",
  "N0va_7" // Pseudonyme public
);
```

#### Soumission d'un flag :
```javascript
const res = await PighackSupabase.api.submitFlag(
  "premier-pas-en-ligne-de-commande",
  "PGH{premier_terminal}"
);

if (res.data.success) {
  alert(`Bravo ! Vous avez gagné ${res.data.points_awarded} points.`);
} else {
  alert(res.data.message);
}
```

#### Récupérer le classement :
```javascript
const { data: leaderboard } = await PighackSupabase.api.getLeaderboard(20);
console.log(leaderboard); // [{ rank: 1, username: "N0va_7", total_points: 300, ... }]
```

---

## 🧑‍💻 Déploiement via Supabase CLI (Alternative pour développeurs)

Si vous avez la CLI Supabase installée :

```bash
# Lier à votre projet distant
supabase link --project-ref VOTRE_PROJECT_REF

# Appliquer toutes les migrations
supabase db push
```

