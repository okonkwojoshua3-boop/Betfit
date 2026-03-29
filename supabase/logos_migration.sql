-- ─────────────────────────────────────────────────────────────────────────────
-- Logos Migration
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- Store ESPN team logo URLs so every participant sees real team images,
-- not just the bet creator (who has the match in local cache).
alter table bets
  add column if not exists home_team_logo text,
  add column if not exists away_team_logo text;
