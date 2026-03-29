-- ─────────────────────────────────────────────────────────────────────────────
-- Team IDs Migration
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- Store real ESPN team IDs so InvitePage can use them for team picks.
-- Previously InvitePage stored 'home'/'away' literals which broke resolution.
alter table bets
  add column if not exists home_team_id text,
  add column if not exists away_team_id text;

-- opponent_id stores the specific user challenged (1v1 bets).
-- Likely already exists from the base schema; this is a no-op if so.
alter table bets
  add column if not exists opponent_id uuid references profiles(id);

-- Store sport and match kickoff time so BetDetail can render on any device,
-- not just the creator's (which has the match cached in localStorage).
alter table bets
  add column if not exists sport text,
  add column if not exists match_scheduled_at timestamptz;
