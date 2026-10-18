# Maquettes — CTF Academy BJ

Maquettes statiques HTML/CSS (aucune dépendance npm, aucun serveur requis).
Système de design « Cyber Range » v6 : interface graphite, centre de dispatch et structures filaires animées — voir `../design/DESIGN.md`.

## Ouvrir

```bash
cd maquettes
python3 -m http.server 8080
```

Puis ouvrir [http://localhost:8080/bienvenue.html](http://localhost:8080/bienvenue.html) (entrée publique) ou [http://localhost:8080/](http://localhost:8080/) (espace connecté).

## Parcours utilisateur (maquette)

1. **bienvenue.html** — page publique / marque  
2. **inscription.html** ou **connexion.html** — auth (redirige vers les opérations)  
3. **index.html** — centre des opérations  
4. Challenges, parcours, leçons, scoreboard, profil, admin  

## Pages disponibles

| Page | Rôle |
|---|---|
| `bienvenue.html` | Accueil public : marque, parcours, CTA inscription |
| `connexion.html` | Connexion étudiant |
| `inscription.html` | Création de compte |
| `index.html` | Centre de dispatch : mission en cours + liste |
| `tableau-de-bord.html` | Espace apprenant : points, modules, historique |
| `challenges.html` | Catalogue des défis publiés |
| `parcours.html` | Carte tactique Cyber Range interactive (secteurs, nœuds de défis, briefing drawer et vue catalogue) |
| `defis.html` | Redirection de compatibilité vers le catalogue |
| `defi-detail.html` | Fiche défi : lab, flag et démarche guidée pas à pas |
| `lecon.html` | Leçon pas-à-pas avec terminal |
| `scoreboard.html` | Scoreboard sous pseudonyme |
| `profil.html` | Paramètres, badges, déconnexion |
| `admin.html` | Pilotage administrateur |
| `admin-defi.html` | Éditeur de défis |

## Assets

- `assets/style.css` — design system Cyber Range v6  
- `assets/carte.css` — styles de la carte tactique Cyber Range, du radar et du briefing drawer  
- `assets/carte.js` — moteur interactif de la carte (pan/zoom, sélection des nœuds, filtrage et catalogue)  
- `assets/nav.js` — menu mobile  
- `assets/challenges.js` — catalogue de défis de démonstration, partagé entre le catalogue, la fiche défi et les pages admin  

> **Atelier IA (étape 7)** : les défis IA ne sont **pas** hébergés dans cette
> maquette. Chacun est déployé séparément et référencé par son **URL**. Le
> service local `lab/` (FastAPI) sert de référence pour l'un d'eux.

## Administration et défis

L'éditeur permet de créer, modifier, publier, archiver et restaurer des défis. Le catalogue
initial contient trois défis publiés (Web, Réseaux, Crypto) et un brouillon de mission.
Les changements sont conservés dans `localStorage` du navigateur. La page de détail Web
vérifie le flag exact et limite les essais à cinq par session.

Cette maquette ne remplace pas un backend : les défis, flags, sessions et rôles sont visibles
ou modifiables dans le navigateur. Ne l'utilisez pas pour héberger de vrais secrets ou comptes.

Le catalogue complet destiné à l’implémentation backend (16 défis, prérequis, matériaux,
indices, contrats de validation et corrections) est décrit dans [backend/README.md](../backend/README.md)
et [backend/seed/challenges.seed.json](../backend/seed/challenges.seed.json). Le seed n’est pas
servi par le serveur statique des maquettes.

## Suite prévue (hors maquettes)

Selon le cahier des charges : React + TypeScript + Vite, FastAPI, PostgreSQL.
