-- ─────────────────────────────────────────────────────────────────────────────
-- Profile page migration
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Add new columns to profiles ───────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio                 text CHECK (char_length(bio) <= 150),
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS favourite_team      text,
  ADD COLUMN IF NOT EXISTS favourite_sport     text,
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();

-- ── RLS for profiles ─────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: anyone can read"  ON profiles;
CREATE POLICY "profiles: anyone can read"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles: own insert" ON profiles;
CREATE POLICY "profiles: own insert"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: own update" ON profiles;
CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Avatars storage bucket ────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read (avatar images are not sensitive)
DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can only upload/update/delete inside their own folder (avatars/<user_id>/...)
DROP POLICY IF EXISTS "avatars: own upload" ON storage.objects;
CREATE POLICY "avatars: own upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars: own update" ON storage.objects;
CREATE POLICY "avatars: own update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars: own delete" ON storage.objects;
CREATE POLICY "avatars: own delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── Update leaderboard RPC to include avatar_url ──────────────────────────────
DROP FUNCTION IF EXISTS get_leaderboard_stats();
CREATE OR REPLACE FUNCTION get_leaderboard_stats()
RETURNS TABLE (
  user_id               uuid,
  username              text,
  avatar_url            text,
  wins                  bigint,
  losses                bigint,
  draws                 bigint,
  win_rate              numeric,
  punishments_owed      bigint,
  punishments_completed bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH resolved AS (
    SELECT id, creator_id, opponent_id, losing_team_id, loser_id, status
    FROM bets
    WHERE status IN ('punishment_pending', 'completed')
  ),
  modern AS (
    SELECT
      bp.user_id,
      CASE
        WHEN r.losing_team_id = 'draw'          THEN 'draw'
        WHEN bp.team_pick_id = r.losing_team_id THEN 'loss'
        ELSE                                         'win'
      END AS outcome,
      r.status
    FROM bet_participants bp
    JOIN resolved r ON r.id = bp.bet_id
    WHERE r.losing_team_id IS NOT NULL
  ),
  legacy AS (
    SELECT r.id, r.creator_id, r.opponent_id, r.loser_id, r.status
    FROM resolved r
    WHERE r.losing_team_id IS NULL
      AND r.loser_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM bet_participants WHERE bet_id = r.id)
  ),
  legacy_creator AS (
    SELECT
      creator_id AS user_id,
      CASE
        WHEN loser_id = 'draw'    THEN 'draw'
        WHEN loser_id = 'creator' THEN 'loss'
        ELSE                           'win'
      END AS outcome,
      status
    FROM legacy
  ),
  legacy_opponent AS (
    SELECT
      opponent_id AS user_id,
      CASE
        WHEN loser_id = 'draw'     THEN 'draw'
        WHEN loser_id = 'opponent' THEN 'loss'
        ELSE                            'win'
      END AS outcome,
      status
    FROM legacy
    WHERE opponent_id IS NOT NULL
  ),
  all_outcomes AS (
    SELECT user_id, outcome, status FROM modern
    UNION ALL
    SELECT user_id, outcome, status FROM legacy_creator
    UNION ALL
    SELECT user_id, outcome, status FROM legacy_opponent
  ),
  agg AS (
    SELECT
      user_id,
      COUNT(*) FILTER (WHERE outcome = 'win')                                   AS wins,
      COUNT(*) FILTER (WHERE outcome = 'loss')                                  AS losses,
      COUNT(*) FILTER (WHERE outcome = 'draw')                                  AS draws,
      COUNT(*) FILTER (WHERE outcome = 'loss' AND status = 'punishment_pending') AS punishments_owed,
      COUNT(*) FILTER (WHERE outcome = 'loss' AND status = 'completed')          AS punishments_completed
    FROM all_outcomes
    GROUP BY user_id
  )
  SELECT
    p.id                                                                        AS user_id,
    p.username,
    p.avatar_url,
    COALESCE(a.wins,   0)                                                       AS wins,
    COALESCE(a.losses, 0)                                                       AS losses,
    COALESCE(a.draws,  0)                                                       AS draws,
    CASE
      WHEN COALESCE(a.wins + a.losses + a.draws, 0) = 0 THEN 0
      ELSE ROUND(
        COALESCE(a.wins, 0)::numeric
        / (COALESCE(a.wins, 0) + COALESCE(a.losses, 0) + COALESCE(a.draws, 0))
        * 100
      , 0)
    END                                                                         AS win_rate,
    COALESCE(a.punishments_owed, 0)                                             AS punishments_owed,
    COALESCE(a.punishments_completed, 0)                                        AS punishments_completed
  FROM profiles p
  JOIN agg a ON a.user_id = p.id
  ORDER BY wins DESC, win_rate DESC;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard_stats() TO authenticated;
