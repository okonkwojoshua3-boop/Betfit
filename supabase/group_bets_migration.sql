-- ─────────────────────────────────────────────────────────────────────────────
-- Group Bets Migration
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Add losing_team_id to bets ────────────────────────────────────────────────
-- Stores the ID of the team that lost (or 'draw'). Replaces the old loser_id
-- 'creator'/'opponent' model with a team-based approach for group bets.
alter table bets
  add column if not exists losing_team_id text;

-- ── bet_participants ──────────────────────────────────────────────────────────
-- Every person in a group bet, including the creator.
create table if not exists bet_participants (
  id           uuid primary key default gen_random_uuid(),
  bet_id       uuid references bets(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  username     text not null,
  team_pick_id text not null,
  joined_at    timestamptz default now(),
  unique(bet_id, user_id)
);

alter table bet_participants enable row level security;

-- Anyone authenticated can read participants (bet IDs are UUIDs — not guessable)
create policy "bet_participants: read"
  on bet_participants for select to authenticated
  using (true);

-- Users can only add themselves
create policy "bet_participants: insert"
  on bet_participants for insert to authenticated
  with check (auth.uid() = user_id);

-- ── Update bets RLS to include participants ───────────────────────────────────
drop policy if exists "bets: read own" on bets;
create policy "bets: read own"
  on bets for select to authenticated
  using (
    auth.uid() = creator_id
    or exists (
      select 1 from bet_participants
      where bet_id = bets.id and user_id = auth.uid()
    )
  );

drop policy if exists "bets: update own" on bets;
create policy "bets: update own"
  on bets for update to authenticated
  using (
    auth.uid() = creator_id
    or exists (
      select 1 from bet_participants
      where bet_id = bets.id and user_id = auth.uid()
    )
  );

drop policy if exists "bets: delete own" on bets;
create policy "bets: delete own"
  on bets for delete to authenticated
  using (
    auth.uid() = creator_id
    or exists (
      select 1 from bet_participants
      where bet_id = bets.id and user_id = auth.uid()
    )
  );

-- Keep invite token policy so people can view bet before joining
drop policy if exists "bets: read by invite token" on bets;
create policy "bets: read by invite token"
  on bets for select to authenticated
  using (invite_token is not null);

-- ── Realtime ──────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table bet_participants;
