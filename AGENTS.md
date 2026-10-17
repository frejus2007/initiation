# AGENTS.md — PIGHACK (repo `initiation`)

## Workflow Git
- Après chaque lot de modifications demandé, enchaîner **automatiquement** : `git add -A` → `git commit -m "<msg>"` → `git push origin <branche>`. Ne pas demander confirmation pour ces trois étapes.
- Identité de commit : `frejus2007` / `frejus2007@users.noreply.github.com`.
- Travailler sur une branche de fonctionnalité ; ne pas pousser directement sur `main`.
- Messages de commit concis, style conventionnel (`feat:`, `fix:`, `docs:`…), en français.

## Contexte
- Maquettes statiques dans `maquettes/` (HTML/CSS/JS, données de démo via `assets/challenges.js` + localStorage).
- Service « Atelier IA » (FastAPI) dans `lab/` — écoute sur `127.0.0.1:8090`, assistants scriptés hors ligne.
- Schéma/seed Supabase dans `supabase/` (migrations + `seed.sql`).

## Vérifications avant commit
- `node --check maquettes/assets/*.js`
- `python -m pytest -q` (dans `lab/`)
- JSON : `Get-Content <f> -Raw | ConvertFrom-Json`
