-- ==============================================================================
-- PIGHACK — Fonctions SQL, Triggers & Procédures RPC Supabase
-- Logique métier sécurisée : validation des flags, déblocage d'indices, leaderboard
-- ==============================================================================

-- 1. TRIGGER : CRÉATION AUTOMATIQUE DU PROFIL LORS DE L'INSCRIPTION AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Récupérer le pseudo depuis les métadonnées ou le préfixe de l'email
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'pseudo',
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Si le pseudo est déjà pris, ajouter un suffixe court
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substr(NEW.id::text, 1, 4);
  END IF;

  INSERT INTO public.profiles (id, username, role, total_points)
  VALUES (NEW.id, v_username, 'student', 0)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. FONCTION RPC : SOUMISSION ET VALIDATION D'UN FLAG
-- Exécutée avec les privilèges SECURITY DEFINER pour accéder à challenge_secrets de façon sécurisée.
CREATE OR REPLACE FUNCTION public.submit_flag(
  p_challenge_id TEXT,
  p_flag TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_challenge RECORD;
  v_secret RECORD;
  v_is_correct BOOLEAN := false;
  v_already_solved BOOLEAN := false;
  v_recent_attempts INTEGER;
  v_missing_prereqs TEXT[];
  v_hints_penalty INTEGER := 0;
  v_points_awarded INTEGER := 0;
  v_clean_flag TEXT;
BEGIN
  -- 2.1 Vérification de session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Vous devez être connecté pour soumettre un flag.');
  END IF;

  -- 2.2 Vérification de l'existence du défi
  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Défi introuvable.');
  END IF;

  IF v_challenge.status <> 'published' AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'CHALLENGE_NOT_OPEN', 'message', 'Ce défi n''est pas encore publié.');
  END IF;

  -- 2.3 Anti-Bruteforce / Rate-limiting : max 5 soumissions par minute sur ce défi
  SELECT count(*) INTO v_recent_attempts
  FROM public.submissions
  WHERE user_id = v_user_id
    AND challenge_id = p_challenge_id
    AND created_at > (now() - INTERVAL '1 minute');

  IF v_recent_attempts >= 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'RATE_LIMITED',
      'message', 'Trop de tentatives en peu de temps. Veuillez patienter une minute avant de réessayer.'
    );
  END IF;

  -- 2.4 Vérifier si l'utilisateur a déjà résolu ce défi
  SELECT EXISTS (
    SELECT 1 FROM public.user_progress
    WHERE user_id = v_user_id AND challenge_id = p_challenge_id AND status = 'solved'
  ) INTO v_already_solved;

  IF v_already_solved THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_SOLVED',
      'message', 'Vous avez déjà validé ce défi. Vos points ont déjà été enregistrés.'
    );
  END IF;

  -- 2.5 Vérifier les prérequis
  IF array_length(v_challenge.prerequisite_ids, 1) > 0 THEN
    SELECT array_agg(prereq_id) INTO v_missing_prereqs
    FROM unnest(v_challenge.prerequisite_ids) AS prereq_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_progress
      WHERE user_id = v_user_id AND challenge_id = prereq_id AND status = 'solved'
    );

    IF v_missing_prereqs IS NOT NULL AND array_length(v_missing_prereqs, 1) > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'PREREQUISITES_MISSING',
        'message', 'Vous devez valider les défis précédents du parcours avant d''enregistrer celui-ci.',
        'missing_prerequisites', v_missing_prereqs
      );
    END IF;
  END IF;

  -- 2.6 Récupérer le secret du défi
  SELECT * INTO v_secret FROM public.challenge_secrets WHERE challenge_id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_SECRET', 'message', 'Configuration de validation manquante.');
  END IF;

  -- 2.7 Comparaison du flag
  v_clean_flag := trim(p_flag);

  IF v_clean_flag = trim(v_secret.flag_secret)
     OR v_clean_flag = ANY(v_secret.accepted_flags)
     -- Tolérance si l'utilisateur a entré PIGHACK{...} au lieu de CTFABJ{...} ou l'inverse
     OR replace(v_clean_flag, 'PIGHACK{', 'CTFABJ{') = trim(v_secret.flag_secret)
     OR replace(v_clean_flag, 'CTFABJ{', 'PIGHACK{') = trim(v_secret.flag_secret)
  THEN
    v_is_correct := true;
  END IF;

  -- 2.8 Enregistrer la soumission
  IF v_is_correct THEN
    -- Calculer la déduction des indices débloqués
    SELECT COALESCE(SUM(points_deducted), 0) INTO v_hints_penalty
    FROM public.unlocked_hints
    WHERE user_id = v_user_id AND challenge_id = p_challenge_id;

    v_points_awarded := GREATEST(0, v_challenge.points - v_hints_penalty);

    -- Enregistrer la tentative réussie
    INSERT INTO public.submissions (user_id, challenge_id, submitted_flag, is_correct, points_awarded)
    VALUES (v_user_id, p_challenge_id, v_clean_flag, true, v_points_awarded);

    -- Mettre à jour la progression de l'utilisateur
    INSERT INTO public.user_progress (user_id, challenge_id, status, attempts_count, points_awarded, solved_at)
    VALUES (v_user_id, p_challenge_id, 'solved', 1, v_points_awarded, now())
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET
      status = 'solved',
      attempts_count = public.user_progress.attempts_count + 1,
      points_awarded = v_points_awarded,
      solved_at = now();

    -- Créditer les points au profil
    UPDATE public.profiles
    SET total_points = total_points + v_points_awarded,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Félicitations ! Flag validé avec succès.',
      'points_awarded', v_points_awarded,
      'base_points', v_challenge.points,
      'hints_penalty', v_hints_penalty,
      'challenge_id', p_challenge_id
    );
  ELSE
    -- Enregistrer la tentative échouée
    INSERT INTO public.submissions (user_id, challenge_id, submitted_flag, is_correct, points_awarded)
    VALUES (v_user_id, p_challenge_id, v_clean_flag, false, 0);

    INSERT INTO public.user_progress (user_id, challenge_id, status, attempts_count)
    VALUES (v_user_id, p_challenge_id, 'started', 1)
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET
      attempts_count = public.user_progress.attempts_count + 1;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'WRONG_FLAG',
      'message', 'Flag incorrect. Vérifiez votre raisonnement et réessayez.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. FONCTION RPC : DÉBLOCAGE D'UN INDICE AVEC DÉDUCTION DE POINTS
CREATE OR REPLACE FUNCTION public.unlock_hint(p_hint_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_hint RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Connexion requise.');
  END IF;

  SELECT * INTO v_hint FROM public.challenge_hints WHERE id = p_hint_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Indice introuvable.');
  END IF;

  -- Vérifier s'il est déjà débloqué
  IF EXISTS (SELECT 1 FROM public.unlocked_hints WHERE user_id = v_user_id AND hint_id = p_hint_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_unlocked', true,
      'content', v_hint.content,
      'points_deducted', 0
    );
  END IF;

  -- Enregistrer le déblocage
  INSERT INTO public.unlocked_hints (user_id, hint_id, challenge_id, points_deducted)
  VALUES (v_user_id, p_hint_id, v_hint.challenge_id, v_hint.points_cost);

  RETURN jsonb_build_object(
    'success', true,
    'already_unlocked', false,
    'content', v_hint.content,
    'points_deducted', v_hint.points_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. FONCTION RPC : CLASSEMENT SOUS PSEUDONYME (LEADERBOARD)
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  username TEXT,
  total_points INTEGER,
  solved_count BIGINT,
  last_solved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.total_points DESC, MAX(up.solved_at) ASC NULLS LAST) AS rank,
    p.username,
    p.total_points,
    COUNT(up.challenge_id) FILTER (WHERE up.status = 'solved') AS solved_count,
    MAX(up.solved_at) AS last_solved_at
  FROM public.profiles p
  LEFT JOIN public.user_progress up ON up.user_id = p.id AND up.status = 'solved'
  WHERE p.role = 'student'
  GROUP BY p.id, p.username, p.total_points
  ORDER BY p.total_points DESC, MAX(up.solved_at) ASC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 5. FONCTION RPC : RÉCUPÉRATION DU DÉTAIL D'UN DÉFI AVEC ÉTAT UTILISATEUR
CREATE OR REPLACE FUNCTION public.get_challenge_with_state(p_challenge_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_challenge JSONB;
  v_progress JSONB;
  v_hints JSONB;
BEGIN
  v_user_id := auth.uid();

  -- Données du défi
  SELECT to_jsonb(c.*) INTO v_challenge
  FROM public.challenges c
  WHERE c.id = p_challenge_id AND (c.status = 'published' OR public.is_admin());

  IF v_challenge IS NULL THEN
    RETURN jsonb_build_object('error', 'NOT_FOUND');
  END IF;

  -- État de l'utilisateur
  IF v_user_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'status', up.status,
      'attempts_count', up.attempts_count,
      'points_awarded', up.points_awarded,
      'solved_at', up.solved_at
    ) INTO v_progress
    FROM public.user_progress up
    WHERE up.user_id = v_user_id AND up.challenge_id = p_challenge_id;

    -- Indices avec contenu uniquement si débloqués
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', h.id,
        'order_num', h.order_num,
        'points_cost', h.points_cost,
        'is_unlocked', (uh.id IS NOT NULL),
        'content', CASE WHEN (uh.id IS NOT NULL OR public.is_admin()) THEN h.content ELSE NULL END
      ) ORDER BY h.order_num
    ) INTO v_hints
    FROM public.challenge_hints h
    LEFT JOIN public.unlocked_hints uh ON uh.hint_id = h.id AND uh.user_id = v_user_id
    WHERE h.challenge_id = p_challenge_id;
  ELSE
    v_progress := jsonb_build_object('status', 'unauthenticated');
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', h.id,
        'order_num', h.order_num,
        'points_cost', h.points_cost,
        'is_unlocked', false,
        'content', NULL
      ) ORDER BY h.order_num
    ) INTO v_hints
    FROM public.challenge_hints h
    WHERE h.challenge_id = p_challenge_id;
  END IF;

  RETURN jsonb_build_object(
    'challenge', v_challenge,
    'user_progress', COALESCE(v_progress, jsonb_build_object('status', 'not_started', 'attempts_count', 0)),
    'hints', COALESCE(v_hints, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
