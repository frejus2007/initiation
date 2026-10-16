# CTF Academy BJ — Cyber Range v6

Direction visuelle : centre d’opérations CTF compact, sombre, orienté action.
Palette chaude uniquement — pas de violet, pas de dégradé mauve/indigo, pas d’emoji.

## Couleurs

| Rôle | Valeur | Usage |
|---|---|---|
| Graphite | `#0B0A09` / `#141210` | Fonds et surfaces |
| Corail | `#F15A38` | Marque, CTA, résolu |
| Ambre | `#F3B952` | Mission en cours, signaux |
| Texte | `#F3EFEA` / `#A39E97` | Principal / secondaire |
| Succès | `#5CB88A` | États validés uniquement |

## Typographie

- **Sora** — interface et titres  
- **IBM Plex Mono** — navigation, métadonnées, terminal  

## Fond animé

Sur toutes les pages, couche `.ambient` (orbes corail/ambre, grille dérivante, scan lent, points filaires).
Sur l’accueil connecté : structures isométriques SVG en plus.
Respect de `prefers-reduced-motion`.

## Pages

- `bienvenue.html` — marque en héros, CTA inscription  
- `index.html` — centre de dispatch (mission en cours + liste)  
- Auth, parcours & défis réunis en progression séquentielle, leçon, classement, profil, admin  
- Les défis commencent avec une démarche détaillée ; les indices diminuent au fil des notions acquises.  
- `parcours.html` — carte tactique Cyber Range interactive : enclaves sectorielles (Linux, Web, Crypto, Réseau, Forensic, Citadelle Finale), nœuds de défis cliquables avec dépendances animées, radar HUD, tiroir latéral de briefing opérationnel et vue catalogue alternative.  

## Principes

- Pas d’emoji dans l’UI (marqueurs CSS / SVG uniquement).  
- Terminaux charbon, commandes corail.  
- Animations lentes, derrière le contenu interactif.  
