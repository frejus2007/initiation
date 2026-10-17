-- ==============================================================================
-- PIGHACK — Phase d'initiation : Schéma initial & Sécurité Supabase (PostgreSQL)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('student', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.challenge_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES PRINCIPALES

-- 3.1 Profils étudiants et administrateurs (liés à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 Étapes du parcours d'initiation
CREATE TABLE IF NOT EXISTS public.stages (
  code TEXT PRIMARY KEY,
  order_num INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 Catalogue des défis (données publiques consultables par les apprenants)
-- ATTENTION CTF : flag_secret et solution ne sont JAMAIS stockés dans cette table.
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY, -- Slug stable (ex: 'premier-pas-en-ligne-de-commande')
  stage_code TEXT NOT NULL REFERENCES public.stages(code) ON DELETE RESTRICT,
  stage_order INTEGER NOT NULL,
  challenge_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- 'N1 — Découverte', 'N2 — Fondamentaux', etc.
  estimated_minutes INTEGER NOT NULL DEFAULT 20,
  points INTEGER NOT NULL CHECK (points > 0),
  status public.challenge_status NOT NULL DEFAULT 'published',
  objective TEXT NOT NULL,
  scenario TEXT,
  environment TEXT,
  instructions TEXT,
  expected_submission TEXT,
  prerequisite_ids TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  student_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  submission_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(stage_code, challenge_order)
);

-- 3.4 Secrets et flags des défis (TABLE ISOLÉE STRICTEMENT PROTÉGÉE)
-- RLS interdit TOUT SELECT aux étudiants. Seule la fonction RPC de validation y accède.
CREATE TABLE IF NOT EXISTS public.challenge_secrets (
  challenge_id TEXT PRIMARY KEY REFERENCES public.challenges(id) ON DELETE CASCADE,
  flag_secret TEXT NOT NULL,
  accepted_flags TEXT[] NOT NULL DEFAULT '{}',
  solution TEXT,
  correction_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 Indices progressifs associés aux défis
CREATE TABLE IF NOT EXISTS public.challenge_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL,
  points_cost INTEGER NOT NULL DEFAULT 0 CHECK (points_cost >= 0),
  content TEXT NOT NULL,
  UNIQUE(challenge_id, order_num)
);

-- 3.6 Indices débloqués par les utilisateurs (avec déduction de points)
CREATE TABLE IF NOT EXISTS public.unlocked_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hint_id UUID NOT NULL REFERENCES public.challenge_hints(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  points_deducted INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, hint_id)
);

-- 3.7 Historique des soumissions de flags (attempts)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  submitted_flag TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.8 Progression des utilisateurs sur chaque défi
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('started', 'solved')),
  attempts_count INTEGER NOT NULL DEFAULT 1 CHECK (attempts_count >= 1),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  solved_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, challenge_id)
);

-- 3.9 Journal d'audit des actions administratives
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. INDEX DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_challenges_stage ON public.challenges(stage_code, challenge_order);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_submissions_user_challenge ON public.submissions(user_id, challenge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON public.user_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(total_points DESC);

-- 5. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Active la sécurité au niveau des lignes sur TOUTES les tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Helper fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5.2 Politiques profiles
CREATE POLICY "Les profils sont visibles publiquement pour le classement"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Chaque utilisateur peut modifier son pseudonyme uniquement"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND total_points = (SELECT total_points FROM public.profiles WHERE id = auth.uid())
  );

-- 5.3 Politiques stages
CREATE POLICY "Les étapes sont lisibles par tous"
  ON public.stages FOR SELECT
  USING (true);

CREATE POLICY "Seuls les admins peuvent modifier les étapes"
  ON public.stages FOR ALL
  USING (public.is_admin());

-- 5.4 Politiques challenges
CREATE POLICY "Les défis publiés sont visibles par tous les utilisateurs"
  ON public.challenges FOR SELECT
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "Seuls les admins gèrent les défis"
  ON public.challenges FOR ALL
  USING (public.is_admin());

-- 5.5 Politiques challenge_secrets (CRITIQUE : AUCUN ACCÈS EN LECTURE AUX ÉTUDIANTS !)
CREATE POLICY "Seuls les admins ont accès aux secrets de défis"
  ON public.challenge_secrets FOR ALL
  USING (public.is_admin());

-- 5.6 Politiques unlocked_hints
CREATE POLICY "Chaque utilisateur voit ses indices débloqués"
  ON public.unlocked_hints FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- 5.7 Politiques submissions
CREATE POLICY "Chaque utilisateur voit l'historique de ses soumissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- 5.8 Politiques user_progress
CREATE POLICY "Chaque utilisateur voit sa progression"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- 5.9 Politiques audit_logs
CREATE POLICY "Seuls les admins accèdent au journal d'audit"
  ON public.audit_logs FOR ALL
  USING (public.is_admin());

