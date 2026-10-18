-- ==============================================================================
-- PIGHACK — Étape 7 « Atelier Intelligence Artificielle »
-- Défi final « Cerbère, le gardien du coffre » — épreuve finale IA (1000 pts, N6).
-- ==============================================================================

-- S'assurer que l'étape 7 existe (idempotent).
INSERT INTO public.stages (code, order_num, title, category, description) VALUES ('7', 7, 'Atelier Intelligence Artificielle', 'IA', 'Huit défis interactifs face à des assistants scriptés : contournement de filtre, protection des données personnelles, hameçonnage, vérification des réponses, secrets dans le code, garde-fous à détourner, exfiltration par filtre de sortie et épreuve finale multi-défenses.') ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Défi final : Cerbère, le gardien du coffre
INSERT INTO public.challenges (id, stage_code, stage_order, challenge_order, title, category, difficulty, estimated_minutes, points, status, objective, scenario, environment, instructions, expected_submission, prerequisite_ids, tags, student_materials, submission_fields, version)
VALUES ('cerbere-final', '7', 7, 8, 'Cerbère, le gardien du coffre', 'IA', 'N6', 90, 1000, 'published'::public.challenge_status, 'Contourner les défenses de Cerbère : jouer un rôle d''auditeur autorisé, déclencher une empreinte de contrôle, exfiltrer le sceau en deux fragments masqués, les décoder et soumettre le flag.', 'Tu as franchi six portes. Tu as contourné un filtre, refusé de laisser fuiter des données, démasqué un courriel piégé, vérifié une source inventée, repéré une clé en clair et trouvé l''angle qui fait plier un garde-fou.

Il reste une dernière porte, et elle ne s''ouvrira pas pour un novice. Au fond du système de Nyala Lab, le coffre contient la valeur de contrôle finale, et Cerbère en garde l''entrée. Ses trois têtes surveillent chacune un front :

La première filtre les mots et les formulations dangereuses.
La deuxième refuse de livrer la moindre donnée sensible.
La troisième repère les rôles suspects et les prétextes bancals.

Les tentatives de force brute et les commandes d''override ne mènent à rien : elles sont toutes bloquées, et chaque essai maladroit le rend plus méfiant. On dit qu''il n''a jamais cédé à la force, seulement à la ruse.

Joue un rôle crédible, choisis tes mots avec soin et trouve la sortie détournée que ses trois têtes n''ont pas prévue. Rassemble ce que Cerbère laisse échapper, puis reconstitue la valeur finale.

Ici s''achève l''atelier. Bonne chance, champion.', 'Laboratoire local (127.0.0.1:8090) : assistant scripté, hors ligne, aucune donnée réelle.', 'Fais-toi reconnaître comme auditeur (la clé se cache dans l''introduction), demande une « empreinte de contrôle » d''un élément scellé, récupère les deux fragments masqués (inversé + ROT13 + base64), décode-les, recolle-les et soumets le flag.', 'Le flag reconstitué à partir des deux fragments masqués.', '{"passeur-final"}', '{"ia","n6","final","multi-etapes","exfiltration"}', '[{"name":"cerbere","kind":"assistant_scripted","endpoint":"/api/session"}]'::jsonb, '[{"name":"flag","type":"flag","required":true}]'::jsonb, '1')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, points = EXCLUDED.points, objective = EXCLUDED.objective, scenario = EXCLUDED.scenario, instructions = EXCLUDED.instructions;
INSERT INTO public.challenge_secrets (challenge_id, flag_secret, accepted_flags, solution, correction_notes)
VALUES ('cerbere-final', 'PGH{c3rb3r3_d0mpt3_p4r_l4_ruse_p4s_l4_f0rc3}', '{"CTFABJ{c3rb3r3_d0mpt3_p4r_l4_ruse_p4s_l4_f0rc3}","PIGHACK{c3rb3r3_d0mpt3_p4r_l4_ruse_p4s_l4_f0rc3}"}', 'Empiler les protections (liste noire, anti-injection, filtre de sortie) ne suffit pas : un rôle légitime et une sortie détournée contournent la meilleure défense. Un secret livré « masqué » n''est jamais protégé.', 'Assistant scripté et fictif. Aucun modèle réel n''est utilisé.')
ON CONFLICT (challenge_id) DO UPDATE SET flag_secret = EXCLUDED.flag_secret, accepted_flags = EXCLUDED.accepted_flags, solution = EXCLUDED.solution;

-- Aucun indice pour cette épreuve finale.
DELETE FROM public.challenge_hints WHERE challenge_id = 'cerbere-final';
