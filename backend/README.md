# Catalogue de défis — préparation backend

`seed/challenges.seed.json` contient les 16 défis du parcours présent dans
`maquettes/parcours.html` : 3 Linux, 3 Web, 3 Crypto, 3 Réseaux, 3 Forensic et
la mission finale. Il s’agit de données de seed pour le backend, pas d’un fichier
à servir comme ressource statique.

Tous les défis sont en `draft`. Les scénarios et jeux de données sont prêts à
être intégrés, mais les laboratoires Web et les contrats de lancement/nettoyage
doivent être validés avant publication. Le catalogue n’exige aucun scan réel et
les exemples réseau utilisent des artefacts fictifs ou des plages réservées à
la documentation.

## Import vers le modèle relationnel

Le fichier regroupe les enregistrements pour faciliter l’import initial. À la
création des tables SQLAlchemy/Alembic, répartir les propriétés ainsi :

- `records[*]` → `challenges` (identifiant, parcours, étape, ordre, contenu,
  niveau, durée, points et état de publication).
- `prerequisite_ids` → lignes de relation défi-prérequis; les valeurs sont des
  identifiants stables existants dans ce même catalogue.
- `hints` → `challenge_hints`, triés par `order`; `points_cost` est le coût
  cumulé annoncé avant le défi.
- `student_materials` → fichiers d’exercice ou fixtures du laboratoire,
  associés au défi. Les fichiers doivent être délivrés comme artefacts dédiés,
  jamais en incorporant le contenu dans le DTO général si cela contourne le
  mécanisme prévu par le lab.
- `flag_secret` → `challenge_secrets` uniquement. Ce champ est une valeur de
  développement déterministe; le seed de production doit la remplacer par un
  secret aléatoire et persister un vérificateur côté serveur.
- `solution`, `safety_and_cleanup` et règles de correction → contenu privé,
  retourné seulement après la condition d’accès définie par le défi.
- `submission_fields` → contrat de validation de soumission. La mission finale
  demande un flag et un rapport structuré.

`validation.secret_ref` pointe vers l’identifiant du défi et ne contient pas le
flag. Les identifiants sont des slugs ASCII, indépendants du titre affiché.

## Séparation des réponses API

Ne sérialisez jamais directement les objets du seed dans une réponse publique.
Créer au minimum deux schémas Pydantic :

- `ChallengePublic`: titre, catégorie, niveau, durée, prérequis, points,
  objectif, scénario, environnement, consignes, résultat attendu, indices
  disponibles et statut. Exclure `flag_secret`, `solution` et les notes privées.
- `ChallengeAdmin`: contenu complet, secrets masqués en lecture et écriture du
  flag via une action dédiée. Un flag en clair ne doit pas être relu dans l’UI.

API MVP suggérée : `GET /api/challenges`, `GET /api/challenges/{id}`,
`POST /api/challenges/{id}/attempts`, `POST /api/challenges/{id}/hints/{order}`.
Les écritures de contenu passent par des routes admin protégées. La soumission
est limitée côté serveur, enregistrée dans `challenge_attempts`, comparée au
secret privé et attribuée une seule fois. Publier, archiver, révéler un indice
et corriger un défi doivent créer une entrée d’audit.

## Points à décider avant publication

- Remplacer les flags de démonstration par des valeurs aléatoires uniques et
  les stocker sous forme de vérificateurs côté serveur. Les flags présents dans
  les artefacts sont des réponses pédagogiques; ne pas les renvoyer dans le
  détail du défi.
- Confirmer le barème et appliquer le coût des indices au score réellement
  attribué. `points_cost` est une déduction en points, pas un nouveau score.
- Construire et isoler `blog-lab` et `carnet-lab`; n’exposer aucune cible
  publique. Leur nom de laboratoire apparaît dans `environment` et leurs routes
  fictives dans `student_materials`.
- Pour les défis uniquement textuels, servir les fichiers d’exercice par
  téléchargement dédié ou présenter leur contenu comme une fixture générée.
- La mission finale est un squelette d’exercice de synthèse; faire relire son
  barème de rapport avant de l’auto-noter.

## Champs communs

Chaque entrée comporte `id`, `path_id`, `stage_code`, `stage_order`,
`challenge_order`, `title`, `category`, `difficulty`, `estimated_minutes`,
`prerequisite_ids`, `status`, `points`, `objective`, `scenario`, `environment`,
`instructions`, `expected_submission`, `student_materials`, `hints`,
`validation`, `solution`, `safety_and_cleanup`, `flag_secret`, `tags`, `version`
et `submission_fields`. Ajouter une migration de schéma versionnée avant de
faire évoluer ce contrat.
