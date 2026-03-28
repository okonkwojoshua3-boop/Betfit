-- ── Invite link support ───────────────────────────────────────────────────────
-- Run this in Supabase: SQL Editor → New Query → paste & run

-- Unique token per bet, used to build the shareable /invite/:token link
alter table bets
  add column if not exists invite_token uuid default gen_random_uuid() unique;

-- Store team names so the invite page can display them on any device
-- (live match data lives in creator's localStorage, not the DB)
alter table bets
  add column if not exists home_team_name text,
  add column if not exists away_team_name text,
  add column if not exists home_team_emoji text,
  add column if not exists away_team_emoji text;

-- Allow opponent_team_pick_id to be null for link invites
-- (opponent picks their team when they accept)
alter table bets alter column opponent_team_pick_id drop not null;

-- Any authenticated user can read a bet if they have the invite token
-- (tokens are UUID v4 — impossible to guess)
create policy "bets: read by invite token"
  on bets for select to authenticated
  using (invite_token is not null);

-- Any authenticated user can accept an open link invite (no opponent set yet)
create policy "bets: accept via invite"
  on bets for update to authenticated
  using (
    invite_token is not null
    and status = 'pending'
    and opponent_id is null
  )
  with check (opponent_id = auth.uid());
