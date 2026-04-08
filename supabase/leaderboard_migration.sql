-- ─────────────────────────────────────────────────────────────────────────────
-- Leaderboard Stats RPC
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns per-user win/loss/draw/punishment stats across ALL resolved bets.
-- SECURITY DEFINER bypasses RLS so the function can read bets from all users
-- while only exposing aggregated counts — no raw bet rows are returned.

CREATE OR REPLACE FUNCTION get_leaderboard_stats()
RETURNS TABLE (
  user_id              uuid,
  username             text,
  wins                 bigint,
  losses               bigint,
  draws                bigint,
  win_rate             numeric,
  punishments_owed     bigint,
  punishments_completed bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH resolved AS (
    -- All resolved bets with both resolution fields
    SELECT
      id,
      creator_id,
      opponent_id,
      losing_team_id,
      loser_id,
      status
    FROM bets
    WHERE status IN ('punishment_pending', 'completed')
  ),

  -- ── Modern path: bets resolved via losing_team_id ──────────────────────────
  -- Covers all bets using bet_participants (group bets + modern 1v1 bets)
  modern AS (
    SELECT
      bp.user_id,
      CASE
        WHEN r.losing_team_id = 'draw'             THEN 'draw'
        WHEN bp.team_pick_id = r.losing_team_id    THEN 'loss'
        ELSE                                             'win'
      END AS outcome,
      r.status
    FROM bet_participants bp
    JOIN resolved r ON r.id = bp.bet_id
    WHERE r.losing_team_id IS NOT NULL
  ),

  -- ── Legacy path: old 1v1 bets resolved via loser_id ('creator'/'opponent') ─
  -- Only for bets that have no bet_participants rows
  legacy AS (
    SELECT r.id, r.creator_id, r.opponent_id, r.loser_id, r.status
    FROM resolved r
    WHERE r.losing_team_id IS NULL
      AND r.loser_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM bet_participants WHERE bet_id = r.id
      )
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
        WHEN loser_id = 'draw'    THEN 'draw'
        WHEN loser_id = 'opponent' THEN 'loss'
        ELSE                            'win'
      END AS outcome,
      status
    FROM legacy
    WHERE opponent_id IS NOT NULL
  ),

  -- ── Union all outcome rows ──────────────────────────────────────────────────
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
      COUNT(*)           FILTER (WHERE outcome = 'win')                          AS wins,
      COUNT(*)           FILTER (WHERE outcome = 'loss')                         AS losses,
      COUNT(*)           FILTER (WHERE outcome = 'draw')                         AS draws,
      COUNT(*)           FILTER (WHERE outcome = 'loss' AND status = 'punishment_pending') AS punishments_owed,
      COUNT(*)           FILTER (WHERE outcome = 'loss' AND status = 'completed') AS punishments_completed
    FROM all_outcomes
    GROUP BY user_id
  )

  SELECT
    p.id                                                              AS user_id,
    p.username,
    COALESCE(a.wins,  0)                                             AS wins,
    COALESCE(a.losses, 0)                                            AS losses,
    COALESCE(a.draws,  0)                                            AS draws,
    CASE
      WHEN COALESCE(a.wins + a.losses + a.draws, 0) = 0 THEN 0
      ELSE ROUND(
        COALESCE(a.wins, 0)::numeric
        / (COALESCE(a.wins, 0) + COALESCE(a.losses, 0) + COALESCE(a.draws, 0))
        * 100
      , 0)
    END                                                              AS win_rate,
    COALESCE(a.punishments_owed, 0)                                  AS punishments_owed,
    COALESCE(a.punishments_completed, 0)                             AS punishments_completed
  FROM profiles p
  JOIN agg a ON a.user_id = p.id
  ORDER BY wins DESC, win_rate DESC;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard_stats() TO authenticated;
