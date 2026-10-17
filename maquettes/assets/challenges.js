/* ============================================================
   PIGHACK — Système d'administration et catalogue de défis
   Gestion centralisée : Défis, Soumissions, Apprenants, Audit & Paramètres
   ============================================================ */
(function (global) {
  "use strict";

  var CHAL_KEY = "pighack_challenges_v3";
  var SUBS_KEY = "pighack_submissions_v1";
  var USERS_KEY = "pighack_users_v1";
  var AUDIT_KEY = "pighack_audit_v1";
  var SETT_KEY = "pighack_settings_v1";

  var seedChallenges = [
  {
    "id": "premier-pas-en-ligne-de-commande",
    "title": "Premier pas en ligne de commande",
    "category": "Linux",
    "level": "N1",
    "points": 50,
    "status": "published",
    "objective": "Créer un dossier de travail puis écrire et afficher un fichier de texte contenant le flag.",
    "scenario": "Dans le laboratoire fictif Bastion, un fichier de consigne a été placé dans le répertoire de départ.",
    "instructions": "Dans le dossier d’exercice, utilisez le terminal pour afficher le contenu du fichier fourni `note.txt`. Soumettez le flag découvert.",
    "expected_submission": "Le flag exact contenu dans note.txt.",
    "flag": "PGH{premier_terminal}",
    "hint1": "Utilisez `mkdir`, `cd`, `printf` et `cat`.",
    "hint2": "La réponse attendue est déjà donnée dans la consigne : le but est de produire et lire le fichier.",
    "hints": [
      "Utilisez `mkdir`, `cd`, `printf` et `cat`.",
      "La réponse attendue est déjà donnée dans la consigne : le but est de produire et lire le fichier."
    ],
    "solution": "La navigation et les commandes de base permettent de manipuler des fichiers sans interface graphique. Vérifiez le chemin courant avec `pwd` et le contenu avec `ls -la`."
  },
  {
    "id": "permissions-droits-dacces",
    "title": "Permissions & droits d’accès",
    "category": "Linux",
    "level": "N1",
    "points": 120,
    "status": "published",
    "objective": "Appliquer le mode 640 à un fichier local et lire son contenu.",
    "scenario": "Le fichier `rapport.txt` appartient à l’utilisateur fictif `analyste`. Les permissions affichées sont `-rw-r-----`. Le flag est dans le fichier de démonstration après attribution du droit de lecture au propriétaire.",
    "instructions": "Dans le dossier d’exercice, examinez les permissions de `rapport.txt`, retirez les droits d’exécution, réglez les droits à 640 puis lisez le fichier. Soumettez le flag découvert.",
    "expected_submission": "Le flag exact lu dans le fichier.",
    "flag": "PGH{droits_minimaux}",
    "hint1": "Les lettres `r`, `w`, `x` correspondent à lecture, écriture et exécution.",
    "hint2": "La valeur symbolique attendue est `640`; utilisez `chmod 640 rapport.txt`.",
    "hints": [
      "Les lettres `r`, `w`, `x` correspondent à lecture, écriture et exécution.",
      "La valeur symbolique attendue est `640`; utilisez `chmod 640 rapport.txt`."
    ],
    "solution": "Les permissions octales sont calculées par propriétaire/groupe/autres : 6=rw-, 4=r--, 0=---. La règle du moindre privilège limite l’accès au nécessaire."
  },
  {
    "id": "pipes-filtres-et-flux-caches",
    "title": "Pipes, filtres et flux cachés",
    "category": "Linux",
    "level": "N2",
    "points": 130,
    "status": "published",
    "objective": "Filtrer un journal synthétique pour isoler l’événement qui contient le flag.",
    "scenario": "Un journal fictif contient une ligne balisée parmi des événements ordinaires.",
    "instructions": "Enregistrez le journal fourni `access.log` dans votre dossier d’exercice, puis utilisez un filtre pour afficher la ligne marquée `FLAG`. Soumettez la valeur trouvée.",
    "expected_submission": "Le flag de la ligne marquée FLAG.",
    "flag": "PGH{pipe_et_filtre}",
    "hint1": "Reliez deux commandes avec le caractère pipe `|`.",
    "hint2": "`grep FLAG access.log` suffit pour filtrer les lignes.",
    "hints": [
      "Reliez deux commandes avec le caractère pipe `|`.",
      "`grep FLAG access.log` suffit pour filtrer les lignes."
    ],
    "solution": "Un pipe transmet la sortie standard d’une commande à l’entrée de la suivante. `grep` sélectionne les lignes correspondantes."
  },
  {
    "id": "inspection-den-tetes-http",
    "title": "Inspection d’en-têtes HTTP",
    "category": "Web",
    "level": "N1",
    "points": 80,
    "status": "published",
    "objective": "Lire un en-tête HTTP de réponse et relever sa valeur.",
    "scenario": "Le service de démonstration `http://127.0.0.1:8080` retourne des en-têtes préparés. Le champ `X-Training-Code` contient la réponse.",
    "instructions": "Lisez la réponse HTTP fournie dans `http-response.txt` et relevez la valeur de l’en-tête `X-Training-Code`.",
    "expected_submission": "La valeur complète de l’en-tête `X-Training-Code`.",
    "flag": "PGH{lire_les_entetes}",
    "hint1": "Les en-têtes suivent la ligne de statut et précèdent le corps.",
    "hint2": "Le nom de l’en-tête recherché commence par `X-Training`.",
    "hints": [
      "Les en-têtes suivent la ligne de statut et précèdent le corps.",
      "Le nom de l’en-tête recherché commence par `X-Training`."
    ],
    "solution": "Les en-têtes HTTP transportent des métadonnées. Ils peuvent révéler une configuration ou des informations qu’il faut éviter d’exposer."
  },
  {
    "id": "le-blog-qui-ne-devait-pas-mentir",
    "title": "Le blog qui ne devait pas mentir",
    "category": "Web",
    "level": "N2",
    "points": 150,
    "status": "published",
    "objective": "Repérer un contrôle d’accès appliqué uniquement dans l’interface et retrouver le flag du brouillon fictif.",
    "scenario": "Le blog fictif Atelier BJ masque un lien vers son studio de rédaction. Une route de démonstration non protégée donne accès à un brouillon contenant le flag.",
    "instructions": "Dans le laboratoire local uniquement, consultez la route de démonstration `/studio/brouillons/1` sans session. Relevez le flag du brouillon et expliquez où le contrôle d’accès est appliqué.",
    "expected_submission": "Flag du brouillon et constat en une phrase : le contrôle d’accès est-il côté client ou serveur ?",
    "flag": "PGH{acces_cote_serveur}",
    "hint1": "Un élément masqué dans l’interface reste accessible par URL.",
    "hint2": "La route doit vérifier l’identité et le rôle à chaque requête.",
    "hints": [
      "Un élément masqué dans l’interface reste accessible par URL.",
      "La route doit vérifier l’identité et le rôle à chaque requête."
    ],
    "solution": "La restriction n’était qu’un masquage du lien. Un contrôle d’accès doit être appliqué côté serveur sur chaque ressource. Erreur fréquente : considérer l’interface comme une barrière de sécurité.",
    "alias": "blog-acces"
  },
  {
    "id": "contournement-dauthentification-idor",
    "title": "Contournement d’authentification IDOR",
    "category": "Web",
    "level": "N3",
    "points": 200,
    "status": "draft",
    "objective": "Identifier un accès direct à un objet appartenant à un autre utilisateur de test et proposer le contrôle manquant.",
    "scenario": "L’application fictive Carnet BJ expose deux dossiers de démonstration `user_id=101` et `user_id=102`. Le second dossier est celui du compte de test propriétaire du laboratoire.",
    "instructions": "Dans le laboratoire local uniquement, comparez les dossiers 101 et 102 avec le compte de test. Relevez le flag du dossier 102 et indiquez le contrôle d’autorisation manquant.",
    "expected_submission": "Flag et nom du contrôle à effectuer sur chaque objet.",
    "flag": "PGH{objet_par_utilisateur}",
    "hint1": "Une authentification valide ne prouve pas que l’utilisateur peut accéder à chaque objet.",
    "hint2": "Comparez l’identifiant du compte connecté au propriétaire du dossier côté serveur.",
    "hints": [
      "Une authentification valide ne prouve pas que l’utilisateur peut accéder à chaque objet.",
      "Comparez l’identifiant du compte connecté au propriétaire du dossier côté serveur."
    ],
    "solution": "C’est un défaut de contrôle d’accès direct aux objets (IDOR/BOLA). Le serveur doit autoriser l’accès selon le propriétaire ou une permission explicite, sans faire confiance à l’identifiant fourni par le client."
  },
  {
    "id": "bribes-encodees-base64",
    "title": "Bribes encodées & Base64",
    "category": "Crypto",
    "level": "N1",
    "points": 75,
    "status": "published",
    "objective": "Décoder une chaîne Base64 et distinguer encodage et chiffrement.",
    "scenario": "Une note fictive a été encodée en Base64. L’encodage n’est pas un chiffrement.",
    "instructions": "Décodez `UEdIe2Jhc2U2NF9uZV9lc3RfcGFzfQ==` avec un outil local et soumettez le texte obtenu.",
    "expected_submission": "Le contenu décodé, un flag PGH.",
    "flag": "PGH{base64_ne_est_pas}",
    "hint1": "Base64 utilise un alphabet qui comprend lettres, chiffres, `+`, `/` et parfois `=`.",
    "hint2": "Sous Linux : `printf %s CHAINE | base64 -d`.",
    "hints": [
      "Base64 utilise un alphabet qui comprend lettres, chiffres, `+`, `/` et parfois `=`.",
      "Sous Linux : `printf %s CHAINE | base64 -d`."
    ],
    "solution": "La chaîne se décode en `PGH{base64_ne_est_pas}`. Base64 est un encodage réversible, pas une protection de confidentialité."
  },
  {
    "id": "dechiffrement-xor-cle-faible",
    "title": "Déchiffrement XOR & clé faible",
    "category": "Crypto",
    "level": "N2",
    "points": 140,
    "status": "published",
    "objective": "Retrouver un texte chiffré par XOR avec une clé d’un octet faible.",
    "scenario": "Le service de formation a chiffré un message avec XOR et une clé d’un octet faible. Les octets sont fournis ci-dessous.",
    "instructions": "Testez les clés d’un octet de `0x00` à `0xff`; recherchez le texte imprimable commençant par `PGH{`.",
    "expected_submission": "Le flag en clair.",
    "flag": "PGH{xor_cle_faible}",
    "hint1": "XOR avec une même clé deux fois retrouve le texte initial.",
    "hint2": "Pour chaque octet, calculez `cipher_byte ^ 0x48`; les 16 premiers octets donnent le préfixe lisible.",
    "hints": [
      "XOR avec une même clé deux fois retrouve le texte initial.",
      "Pour chaque octet, calculez `cipher_byte ^ 0x48`; les 16 premiers octets donnent le préfixe lisible."
    ],
    "solution": "Le texte clair est `PGH{xor_cle_faible}`. Une clé courte réutilisée ou faible permet une recherche exhaustive; utilisez un chiffrement moderne authentifié."
  },
  {
    "id": "collision-empreintes-sha-256",
    "title": "Collision & empreintes SHA-256",
    "category": "Crypto",
    "level": "N3",
    "points": 210,
    "status": "draft",
    "objective": "Expliquer pourquoi MD5 ne garantit plus l’intégrité face aux collisions et choisir une empreinte adaptée.",
    "scenario": "Deux fichiers de démonstration différents portent la même empreinte MD5 dans un scénario fictif. Il faut vérifier l’intégrité avec SHA-256 et ne pas confondre collision et préimage.",
    "instructions": "Examinez `manifest.txt`, relevez le code de validation et expliquez pourquoi MD5 ne convient plus pour vérifier des fichiers adversariaux.",
    "expected_submission": "Le flag du manifeste et une phrase expliquant le risque de collision MD5.",
    "flag": "PGH{sha256_pour_integrite}",
    "hint1": "Une collision signifie deux contenus distincts avec la même empreinte.",
    "hint2": "N’assimilez pas la collision à la récupération du contenu depuis l’empreinte.",
    "hints": [
      "Une collision signifie deux contenus distincts avec la même empreinte.",
      "N’assimilez pas la collision à la récupération du contenu depuis l’empreinte."
    ],
    "solution": "Le flag est fourni dans le manifeste. MD5 est vulnérable aux collisions et ne doit pas servir à garantir l’intégrité face à un adversaire. SHA-256 est préférable, avec signature/HMAC si l’authenticité est requise."
  },
  {
    "id": "analyse-de-capture-pcap",
    "title": "Analyse de capture PCAP",
    "category": "Réseaux",
    "level": "N2",
    "points": 120,
    "status": "published",
    "objective": "Extraire et décoder un flag dans une transcription PCAP synthétique.",
    "scenario": "Une capture fictive réduite présente une requête HTTP vers un service de laboratoire et un paramètre d’identification.",
    "instructions": "Décodez le paramètre `ref` dans la transcription fournie `capture-transcript.txt` et soumettez sa valeur.",
    "expected_submission": "Le flag après décodage URL.",
    "flag": "PGH{pcap_reconstituee}",
    "hint1": "Filtrez les paquets HTTP (`http.request`) dans Wireshark.",
    "hint2": "`%7B` et `%7D` représentent les accolades.",
    "hints": [
      "Filtrez les paquets HTTP (`http.request`) dans Wireshark.",
      "`%7B` et `%7D` représentent les accolades."
    ],
    "solution": "Le flag est `PGH{pcap_reconstituee}`. Les captures peuvent contenir des identifiants; limitez les données et utilisez TLS pour protéger les échanges."
  },
  {
    "id": "exfiltration-furtive-par-dns",
    "title": "Exfiltration furtive par DNS",
    "category": "Réseaux",
    "level": "N3",
    "points": 190,
    "status": "draft",
    "objective": "Repérer et décoder une valeur répartie dans les labels d’un journal DNS fictif.",
    "scenario": "Des journaux DNS de la zone fictive `lab.invalid` contiennent un sous-domaine encodé. Aucun domaine public n’est visé.",
    "instructions": "Examinez les requêtes: `a1.lab.invalid`, `Q1RGQUJK.lab.invalid`, `e2Ruc19zYWZlfQ==.lab.invalid`. Isolez les deux labels Base64, concaténez-les, décodez-les et soumettez le flag.",
    "expected_submission": "Le texte décodé des labels Base64 concaténés.",
    "flag": "PGH{dns_safe}",
    "hint1": "Ignorez le label hexadécimal `a1`; repérez les chaînes Base64.",
    "hint2": "Les labels `Q1RGQUJK` et `e2Ruc19zYWZlfQ==` forment une seule chaîne encodée.",
    "hints": [
      "Ignorez le label hexadécimal `a1`; repérez les chaînes Base64.",
      "Les labels `Q1RGQUJK` et `e2Ruc19zYWZlfQ==` forment une seule chaîne encodée."
    ],
    "solution": "Après concaténation puis décodage, on obtient `PGH{dns_safe}`. Des sous-domaines longs et répétitifs peuvent signaler un tunnel DNS; surveillez volume, entropie et destinations."
  },
  {
    "id": "pivoting-scan-de-sous-reseau",
    "title": "Pivoting & scan de sous-réseau",
    "category": "Réseaux",
    "level": "N4",
    "points": 250,
    "status": "draft",
    "objective": "Lire un plan de réseau de documentation et identifier l’hôte indiqué sans réaliser de scan.",
    "scenario": "Le schéma d’un réseau de laboratoire fictif montre une machine d’analyse et trois hôtes dans un sous-réseau isolé. Le défi est une lecture de plan, pas un scan réel.",
    "instructions": "À partir du plan et du rapport fournis dans `network-plan.txt`, identifiez l’hôte concerné et justifiez le pivot logique. Aucun scan réseau n’est demandé.",
    "expected_submission": "Flag associé au serveur web et adresse de l’hôte.",
    "flag": "PGH{pivot_documente}",
    "hint1": "Un pivot est un changement de point d’observation documenté, pas une autorisation d’attaquer une autre machine.",
    "hint2": "`192.0.2.0/24` est réservé à la documentation; identifiez `.2` dans les données fournies.",
    "hints": [
      "Un pivot est un changement de point d’observation documenté, pas une autorisation d’attaquer une autre machine.",
      "`192.0.2.0/24` est réservé à la documentation; identifiez `.2` dans les données fournies."
    ],
    "solution": "L’hôte est 192.0.2.2 et le flag est `PGH{pivot_documente}`. En environnement réel, un pivot doit être explicitement autorisé et segmenté."
  },
  {
    "id": "metadonnees-et-images-suspectes",
    "title": "Métadonnées et images suspectes",
    "category": "Forensic",
    "level": "N2",
    "points": 110,
    "status": "published",
    "objective": "Extraire un flag d’un rapport EXIF synthétique et relever un risque de confidentialité.",
    "scenario": "Une photographie fictive d’une salle de cours a des métadonnées EXIF nettoyées. Le rapport fourni indique une note dans le champ Comment.",
    "instructions": "Lisez `exif-report.txt`, relevez le contenu du champ Comment et indiquez une précaution de confidentialité.",
    "expected_submission": "Flag du champ Comment et une précaution de confidentialité.",
    "flag": "PGH{metadonnees_minimales}",
    "hint1": "Les métadonnées peuvent révéler plus que les pixels visibles.",
    "hint2": "Le champ `Comment` contient la chaîne à soumettre.",
    "hints": [
      "Les métadonnées peuvent révéler plus que les pixels visibles.",
      "Le champ `Comment` contient la chaîne à soumettre."
    ],
    "solution": "Le flag est dans Comment. Supprimez les coordonnées et métadonnées personnelles avant publication d’images lorsque cela est nécessaire."
  },
  {
    "id": "analyse-de-memoire-vive-volatility",
    "title": "Analyse de mémoire vive Volatility",
    "category": "Forensic",
    "level": "N3",
    "points": 230,
    "status": "draft",
    "objective": "Interpréter une sortie Volatility simulée pour retrouver le processus et le flag associés.",
    "scenario": "Un extrait textuel de sortie Volatility d’une machine de laboratoire fictive montre un processus suspect et un nom de fichier de preuve. Aucun dump mémoire réel n’est distribué.",
    "instructions": "Analysez `volatility-output.txt`, identifiez le PID associé au fichier de preuve, puis soumettez le flag extrait.",
    "expected_submission": "Flag de preuve et PID du processus pertinent.",
    "flag": "PGH{memoire_sans_dump}",
    "hint1": "Suivez le chemin du fichier de preuve et associez-le au PID de la ligne cmdline.",
    "hint2": "Le processus pertinent est PID 988.",
    "hints": [
      "Suivez le chemin du fichier de preuve et associez-le au PID de la ligne cmdline.",
      "Le processus pertinent est PID 988."
    ],
    "solution": "Le PID 988 ouvre le fichier indiqué, qui contient le flag. Dans une vraie investigation, préservez l’intégrité de l’image mémoire et consignez les outils et versions."
  },
  {
    "id": "chronologie-dun-incident-de-securite",
    "title": "Chronologie d’un incident de sécurité",
    "category": "Forensic",
    "level": "N4",
    "points": 260,
    "status": "draft",
    "objective": "Trier les événements UTC et établir une chronologie à partir de journaux synthétiques.",
    "scenario": "Les événements fictifs du portail Nyala Lab sont fournis avec des horodatages UTC. Reconstituez l’ordre et repérez l’événement qui porte le flag.",
    "instructions": "Triez les événements du fichier `events.csv` en UTC, identifiez l’alerte et résumez la séquence en une phrase.",
    "expected_submission": "Flag d’alerte et séquence ordonnée des quatre événements.",
    "flag": "PGH{chronologie_coherente}",
    "hint1": "Triez par horodatage avant de tirer une conclusion.",
    "hint2": "L’événement central est `alert rule-7`.",
    "hints": [
      "Triez par horodatage avant de tirer une conclusion.",
      "L’événement central est `alert rule-7`."
    ],
    "solution": "Le flag est porté par l’alerte à 10:04:19 UTC, après l’export et avant la fermeture de session. Une chronologie doit distinguer faits observés et hypothèses."
  },
  {
    "id": "operation-blackout-bj-mission-complete",
    "title": "Opération BlackOut BJ — mission complète",
    "category": "Mission",
    "level": "N6",
    "points": 500,
    "status": "draft",
    "objective": "Analyser les artefacts fictifs, démontrer une faiblesse d’autorisation et produire un rapport de remédiation.",
    "scenario": "Mandat fictif: Nyala Finance signale un accès anormal au portail de démonstration. Votre mission est limitée aux artefacts fournis et à un laboratoire local isolé.",
    "instructions": "À partir du mandat et des artefacts du dossier de mission, identifiez le défaut d’autorisation, soumettez le flag final et rédigez un rapport avec constat, preuve, impact, limites et remédiation.",
    "expected_submission": "Flag final et rapport structuré en cinq rubriques; la correction ne s’ouvre qu’après validation du flag.",
    "flag": "PGH{blackout_bj_remedie}",
    "hint1": "Commencez par vérifier si l’utilisateur analyst possède le rapport 43.",
    "hint2": "L’identifiant de l’objet change, mais l’autorisation doit être recalculée pour chaque objet.",
    "hints": [
      "Commencez par vérifier si l’utilisateur analyst possède le rapport 43.",
      "L’identifiant de l’objet change, mais l’autorisation doit être recalculée pour chaque objet.",
      "La remédiation doit inclure un contrôle côté serveur et un test de non-régression."
    ],
    "solution": "La séquence montre un accès objet sans contrôle de propriétaire (IDOR/BOLA). Limiter les accès au périmètre fictif, ajouter une autorisation côté serveur par objet, journaliser les refus et tester les rôles. Erreur fréquente: confondre session valide et droit d’accès."
  }
];
  var seedSubmissions = [
  {
    "id": "sub-1012",
    "timestamp": "2026-10-17 21:18:42",
    "student": "sylvie_k",
    "email": "sylvie.k@ecole.bj",
    "challengeId": "le-blog-qui-ne-devait-pas-mentir",
    "challengeTitle": "Le blog qui ne devait pas mentir",
    "flag": "PGH{acces_cote_serveur}",
    "isCorrect": true,
    "pointsAwarded": 150,
    "ip": "10.10.14.23"
  },
  {
    "id": "sub-1011",
    "timestamp": "2026-10-17 21:12:05",
    "student": "moussa.diallo",
    "email": "moussa.d@etudiant.bj",
    "challengeId": "pipes-filtres-et-flux-caches",
    "challengeTitle": "Pipes, filtres et flux cachés",
    "flag": "PGH{pipe_et_filtre}",
    "isCorrect": true,
    "pointsAwarded": 130,
    "ip": "10.10.14.88"
  },
  {
    "id": "sub-1010",
    "timestamp": "2026-10-17 21:05:19",
    "student": "jean_paul",
    "email": "jeanpaul.a@ecole.bj",
    "challengeId": "bribes-encodees-base64",
    "challengeTitle": "Bribes encodées & Base64",
    "flag": "flag{base64_ne_est_pas}",
    "isCorrect": false,
    "pointsAwarded": 0,
    "ip": "192.168.1.45",
    "note": "Format rejeté (attendu PGH{...})"
  },
  {
    "id": "sub-1009",
    "timestamp": "2026-10-17 20:58:33",
    "student": "fatou_dev",
    "email": "fatou.s@univ-abomey.bj",
    "challengeId": "dechiffrement-xor-cle-faible",
    "challengeTitle": "Déchiffrement XOR & clé faible",
    "flag": "PGH{xor_cle_faible}",
    "isCorrect": true,
    "pointsAwarded": 140,
    "ip": "10.10.15.12"
  },
  {
    "id": "sub-1008",
    "timestamp": "2026-10-17 20:41:10",
    "student": "koffi_99",
    "email": "koffi.m@etudiant.bj",
    "challengeId": "premier-pas-en-ligne-de-commande",
    "challengeTitle": "Premier pas en ligne de commande",
    "flag": "PGH{premier_terminal}",
    "isCorrect": true,
    "pointsAwarded": 50,
    "ip": "10.10.14.65"
  },
  {
    "id": "sub-1007",
    "timestamp": "2026-10-17 20:34:55",
    "student": "triche_bot",
    "email": "bot42@anonymous.xyz",
    "challengeId": "operation-blackout-bj-mission-complete",
    "challengeTitle": "Opération BlackOut BJ",
    "flag": "admin:admin",
    "isCorrect": false,
    "pointsAwarded": 0,
    "ip": "45.33.32.156",
    "note": "Brute-force détecté"
  },
  {
    "id": "sub-1006",
    "timestamp": "2026-10-17 20:20:12",
    "student": "aissa_cyber",
    "email": "aissa.t@etudiant.bj",
    "challengeId": "permissions-droits-dacces",
    "challengeTitle": "Permissions & droits d’accès",
    "flag": "PGH{droits_minimaux}",
    "isCorrect": true,
    "pointsAwarded": 120,
    "ip": "10.10.14.99"
  },
  {
    "id": "sub-1005",
    "timestamp": "2026-10-17 19:55:04",
    "student": "sylvie_k",
    "email": "sylvie.k@ecole.bj",
    "challengeId": "analyse-de-capture-pcap",
    "challengeTitle": "Analyse de capture PCAP",
    "flag": "PGH{pcap_reconstituee}",
    "isCorrect": true,
    "pointsAwarded": 120,
    "ip": "10.10.14.23"
  },
  {
    "id": "sub-1004",
    "timestamp": "2026-10-17 19:42:18",
    "student": "chams_sec",
    "email": "chams.d@etudiant.bj",
    "challengeId": "le-blog-qui-ne-devait-pas-mentir",
    "challengeTitle": "Le blog qui ne devait pas mentir",
    "flag": "PGH{mauvais_chemin}",
    "isCorrect": false,
    "pointsAwarded": 0,
    "ip": "10.10.14.110"
  },
  {
    "id": "sub-1003",
    "timestamp": "2026-10-17 19:10:45",
    "student": "moussa.diallo",
    "email": "moussa.d@etudiant.bj",
    "challengeId": "inspection-den-tetes-http",
    "challengeTitle": "Inspection d’en-têtes HTTP",
    "flag": "PGH{lire_les_entetes}",
    "isCorrect": true,
    "pointsAwarded": 80,
    "ip": "10.10.14.88"
  },
  {
    "id": "sub-1002",
    "timestamp": "2026-10-17 18:30:22",
    "student": "fatou_dev",
    "email": "fatou.s@univ-abomey.bj",
    "challengeId": "metadonnees-et-images-suspectes",
    "challengeTitle": "Métadonnées et images suspectes",
    "flag": "PGH{metadonnees_minimales}",
    "isCorrect": true,
    "pointsAwarded": 110,
    "ip": "10.10.15.12"
  },
  {
    "id": "sub-1001",
    "timestamp": "2026-10-17 17:15:09",
    "student": "koffi_99",
    "email": "koffi.m@etudiant.bj",
    "challengeId": "premier-pas-en-ligne-de-commande",
    "challengeTitle": "Premier pas en ligne de commande",
    "flag": "PGH{test_terminal}",
    "isCorrect": false,
    "pointsAwarded": 0,
    "ip": "10.10.14.65"
  }
];
  var seedUsers = [
  {
    "id": "u-admin",
    "pseudo": "admin@pighack",
    "email": "admin@pighack.bj",
    "role": "admin",
    "status": "active",
    "points": 0,
    "solvedCount": 0,
    "joinedAt": "2026-10-01"
  },
  {
    "id": "u-sylvie",
    "pseudo": "sylvie_k",
    "email": "sylvie.k@ecole.bj",
    "role": "student",
    "status": "active",
    "points": 450,
    "solvedCount": 4,
    "joinedAt": "2026-10-05"
  },
  {
    "id": "u-moussa",
    "pseudo": "moussa.diallo",
    "email": "moussa.d@etudiant.bj",
    "role": "student",
    "status": "active",
    "points": 390,
    "solvedCount": 3,
    "joinedAt": "2026-10-06"
  },
  {
    "id": "u-fatou",
    "pseudo": "fatou_dev",
    "email": "fatou.s@univ-abomey.bj",
    "role": "student",
    "status": "active",
    "points": 350,
    "solvedCount": 3,
    "joinedAt": "2026-10-08"
  },
  {
    "id": "u-koffi",
    "pseudo": "koffi_99",
    "email": "koffi.m@etudiant.bj",
    "role": "student",
    "status": "active",
    "points": 250,
    "solvedCount": 2,
    "joinedAt": "2026-10-09"
  },
  {
    "id": "u-jeanpaul",
    "pseudo": "jean_paul",
    "email": "jeanpaul.a@ecole.bj",
    "role": "student",
    "status": "active",
    "points": 170,
    "solvedCount": 2,
    "joinedAt": "2026-10-10"
  },
  {
    "id": "u-aissa",
    "pseudo": "aissa_cyber",
    "email": "aissa.t@etudiant.bj",
    "role": "student",
    "status": "active",
    "points": 120,
    "solvedCount": 1,
    "joinedAt": "2026-10-12"
  },
  {
    "id": "u-tuteur",
    "pseudo": "tuteur_marc",
    "email": "marc.tuteur@pighack.bj",
    "role": "tutor",
    "status": "active",
    "points": 0,
    "solvedCount": 0,
    "joinedAt": "2026-10-02"
  },
  {
    "id": "u-bot",
    "pseudo": "triche_bot",
    "email": "bot42@anonymous.xyz",
    "role": "student",
    "status": "suspended",
    "points": 0,
    "solvedCount": 0,
    "joinedAt": "2026-10-17"
  }
];
  var seedAudit = [
  {
    "id": "aud-005",
    "timestamp": "17/10/2026 · 21:00",
    "operator": "admin@pighack",
    "action": "Suspension de compte",
    "target": "triche_bot",
    "details": "Détection de requêtes de brute-force anormales sur la mission."
  },
  {
    "id": "aud-004",
    "timestamp": "17/10/2026 · 18:30",
    "operator": "admin@pighack",
    "action": "Validation du format de flag",
    "target": "Plateforme",
    "details": "Standardisation du préfixe officiel PGH{...} appliquée."
  },
  {
    "id": "aud-003",
    "timestamp": "16/10/2026 · 09:12",
    "operator": "admin@pighack",
    "action": "Publication de défi",
    "target": "Analyse de capture PCAP",
    "details": "Passage du statut brouillon à publié (120 points)."
  },
  {
    "id": "aud-002",
    "timestamp": "15/10/2026 · 17:40",
    "operator": "admin@pighack",
    "action": "Création de rôle",
    "target": "tuteur_marc",
    "details": "Attribution du rôle Tuteur d accompagnement."
  },
  {
    "id": "aud-001",
    "timestamp": "14/10/2026 · 03:00",
    "operator": "Système",
    "action": "Sauvegarde automatique",
    "target": "Base de données Supabase",
    "details": "Sauvegarde snapshots et catalogue synchronisés avec succès."
  }
];
  var defaultSettings = {
  "platform_name": "PIGHACK — Phase d’initiation",
  "status": "open",
  "flag_prefix": "PGH{",
  "flag_regex": "^PGH\\{[A-Za-z0-9_\\-\\.]+\\}$",
  "max_attempts_hour": 5,
  "hint_penalty": 20,
  "backend_mode": "supabase_hybrid"
};

  // --- Gestion des Défis ---
  function loadChallenges() {
    try {
      var saved = JSON.parse(localStorage.getItem(CHAL_KEY));
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch (_) {}
    localStorage.setItem(CHAL_KEY, JSON.stringify(seedChallenges));
    return seedChallenges.slice();
  }

  function saveChallenges(items) {
    localStorage.setItem(CHAL_KEY, JSON.stringify(items));
  }

  function byId(id) {
    if (!id) return null;
    var list = loadChallenges();
    return list.find(function (x) {
      return x.id === id || x.alias === id || (x.id === 'le-blog-qui-ne-devait-pas-mentir' && id === 'blog-acces');
    }) || null;
  }

  function addChallenge(record) {
    var items = loadChallenges();
    if (!record.id) record.id = 'defi-' + Date.now();
    record.updatedAt = new Date().toISOString();
    items.unshift(record);
    saveChallenges(items);
    logAudit('Création de défi', record.title, 'Nouveau défi créé avec statut ' + (record.status || 'draft'));
    return record;
  }

  function updateChallenge(id, record) {
    var items = loadChallenges();
    var idx = items.findIndex(function (x) { return x.id === id || x.alias === id; });
    if (idx >= 0) {
      record.id = items[idx].id;
      record.updatedAt = new Date().toISOString();
      items[idx] = Object.assign({}, items[idx], record);
      saveChallenges(items);
      logAudit('Modification de défi', record.title || id, 'Mise à jour du défi');
      return items[idx];
    } else {
      return addChallenge(record);
    }
  }

  function removeChallenge(id) {
    var items = loadChallenges();
    var target = byId(id);
    var filtered = items.filter(function (x) { return x.id !== id && x.alias !== id; });
    saveChallenges(filtered);
    if (target) {
      logAudit('Suppression de défi', target.title, 'Défi définitivement retiré du catalogue');
    }
  }

  function toggleStatus(id, newStatus) {
    var items = loadChallenges();
    var target = items.find(function (x) { return x.id === id || x.alias === id; });
    if (target) {
      target.status = newStatus;
      target.updatedAt = new Date().toISOString();
      saveChallenges(items);
      logAudit('Changement de statut', target.title, 'Nouveau statut : ' + newStatus);
    }
    return target;
  }

  function resetChallenges() {
    localStorage.setItem(CHAL_KEY, JSON.stringify(seedChallenges));
    logAudit('Réinitialisation catalogue', 'Catalogue PIGHACK', 'Restauration des 16 défis officiels');
    return seedChallenges.slice();
  }

  // --- Gestion du Journal des Soumissions ---
  function getSubmissions() {
    try {
      var saved = JSON.parse(localStorage.getItem(SUBS_KEY));
      if (Array.isArray(saved)) return saved;
    } catch (_) {}
    localStorage.setItem(SUBS_KEY, JSON.stringify(seedSubmissions));
    return seedSubmissions.slice();
  }

  function saveSubmissions(list) {
    localStorage.setItem(SUBS_KEY, JSON.stringify(list));
  }

  function recordSubmission(entry) {
    var list = getSubmissions();
    var chal = byId(entry.challengeId);
    var challengeTitle = entry.challengeTitle || (chal ? chal.title : entry.challengeId);
    var expectedFlag = chal ? chal.flag : '';
    var isCorrect = typeof entry.isCorrect === 'boolean' ? entry.isCorrect : (!!expectedFlag && entry.flag === expectedFlag);
    var points = entry.pointsAwarded != null ? entry.pointsAwarded : (isCorrect ? (chal ? chal.points : 100) : 0);

    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    var timestamp = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

    var sub = {
      id: 'sub-' + Date.now(),
      timestamp: timestamp,
      student: entry.student || 'apprenant_invite',
      email: entry.email || (entry.student ? entry.student + '@ecole.bj' : 'invite@pighack.bj'),
      challengeId: entry.challengeId || 'inconnu',
      challengeTitle: challengeTitle,
      flag: entry.flag || '',
      isCorrect: isCorrect,
      pointsAwarded: points,
      ip: entry.ip || '10.10.14.' + Math.floor(Math.random() * 200 + 10),
      note: entry.note || (isCorrect ? 'Validé' : (/^PGH\{/.test(entry.flag) ? 'Flag incorrect' : 'Format non standard'))
    };

    list.unshift(sub);
    if (list.length > 500) list = list.slice(0, 500);
    saveSubmissions(list);

    // Si correct, mettre à jour les points de l'apprenant
    if (isCorrect && sub.student) {
      creditUserPoints(sub.student, points);
    }

    return sub;
  }

  function clearSubmissions() {
    localStorage.setItem(SUBS_KEY, JSON.stringify([]));
    logAudit('Purger les soumissions', 'Journal', 'Suppression de toutes les tentatives');
  }

  function resetSubmissions() {
    localStorage.setItem(SUBS_KEY, JSON.stringify(seedSubmissions));
    logAudit('Réinitialisation soumissions', 'Journal', 'Restauration des tentatives de démonstration');
    return seedSubmissions.slice();
  }

  // --- Gestion des Utilisateurs / Apprenants ---
  function getUsers() {
    try {
      var saved = JSON.parse(localStorage.getItem(USERS_KEY));
      if (Array.isArray(saved)) return saved;
    } catch (_) {}
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
    return seedUsers.slice();
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function creditUserPoints(pseudo, pts) {
    var users = getUsers();
    var user = users.find(function (u) { return u.pseudo === pseudo; });
    if (user) {
      user.points = (user.points || 0) + pts;
      user.solvedCount = (user.solvedCount || 0) + 1;
      saveUsers(users);
    }
  }

  function updateUser(pseudo, changes) {
    var users = getUsers();
    var u = users.find(function (x) { return x.pseudo === pseudo; });
    if (u) {
      Object.assign(u, changes);
      saveUsers(users);
      logAudit('Mise à jour apprenant', pseudo, 'Rôle: ' + (u.role) + ', Statut: ' + (u.status));
      return u;
    }
    return null;
  }

  function addUser(user) {
    var users = getUsers();
    if (!user.pseudo) return null;
    user.id = 'u-' + Date.now();
    user.points = Number(user.points || 0);
    user.solvedCount = Number(user.solvedCount || 0);
    user.joinedAt = new Date().toISOString().slice(0, 10);
    users.unshift(user);
    saveUsers(users);
    logAudit('Création de compte', user.pseudo, 'Rôle: ' + user.role);
    return user;
  }

  function removeUser(pseudo) {
    var users = getUsers();
    var filtered = users.filter(function (x) { return x.pseudo !== pseudo; });
    saveUsers(filtered);
    logAudit('Suppression de compte', pseudo, 'Compte retiré');
  }

  function resetUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
    logAudit('Réinitialisation apprenants', 'Utilisateurs', 'Restauration des comptes de test');
    return seedUsers.slice();
  }

  // --- Journal d'audit ---
  function getAuditLogs() {
    try {
      var saved = JSON.parse(localStorage.getItem(AUDIT_KEY));
      if (Array.isArray(saved)) return saved;
    } catch (_) {}
    localStorage.setItem(AUDIT_KEY, JSON.stringify(seedAudit));
    return seedAudit.slice();
  }

  function logAudit(action, target, details, operator) {
    var logs = getAuditLogs();
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    var ts = pad(now.getDate()) + '/' + pad(now.getMonth()+1) + '/' + now.getFullYear() + ' · ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    var entry = {
      id: 'aud-' + Date.now(),
      timestamp: ts,
      operator: operator || 'admin@pighack',
      action: action,
      target: target || 'Système',
      details: details || ''
    };
    logs.unshift(entry);
    if (logs.length > 200) logs = logs.slice(0, 200);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
    return entry;
  }

  // --- Paramètres de la Plateforme ---
  function getSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETT_KEY));
      if (saved && typeof saved === 'object') return Object.assign({}, defaultSettings, saved);
    } catch (_) {}
    return Object.assign({}, defaultSettings);
  }

  function saveSettings(obj) {
    var current = getSettings();
    var updated = Object.assign({}, current, obj);
    localStorage.setItem(SETT_KEY, JSON.stringify(updated));
    logAudit('Configuration plateforme', 'Paramètres', 'Mise à jour des paramètres système');
    return updated;
  }

  // --- Sauvegarde & Restauration globale ---
  function exportAll() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      platform: 'PIGHACK',
      challenges: loadChallenges(),
      submissions: getSubmissions(),
      users: getUsers(),
      audit: getAuditLogs(),
      settings: getSettings()
    };
  }

  function importAll(data) {
    if (!data || typeof data !== 'object') throw new Error('Format de données invalide.');
    if (Array.isArray(data.challenges)) saveChallenges(data.challenges);
    if (Array.isArray(data.submissions)) saveSubmissions(data.submissions);
    if (Array.isArray(data.users)) saveUsers(data.users);
    if (Array.isArray(data.audit)) localStorage.setItem(AUDIT_KEY, JSON.stringify(data.audit));
    if (data.settings) saveSettings(data.settings);
    logAudit('Restauration globale', 'Plateforme', "Import d'une archive complete");
    return true;
  }

  // Export vers l'espace global
  global.PigHackChallenges = {
    key: CHAL_KEY,
    load: loadChallenges,
    save: saveChallenges,
    byId: byId,
    add: addChallenge,
    update: updateChallenge,
    remove: removeChallenge,
    toggleStatus: toggleStatus,
    resetChallenges: resetChallenges,

    // Submissions
    getSubmissions: getSubmissions,
    recordSubmission: recordSubmission,
    clearSubmissions: clearSubmissions,
    resetSubmissions: resetSubmissions,

    // Users
    getUsers: getUsers,
    saveUsers: saveUsers,
    updateUser: updateUser,
    addUser: addUser,
    removeUser: removeUser,
    resetUsers: resetUsers,

    // Audit
    getAuditLogs: getAuditLogs,
    logAudit: logAudit,

    // Settings
    getSettings: getSettings,
    saveSettings: saveSettings,

    // Export / Import
    exportAll: exportAll,
    importAll: importAll
  };

})(window);
