-- ─────────────────────────────────────────────────────────────────────────────
-- Fix proofs RLS to include bet_participants (group bets)
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- The old policies only checked bets.creator_id / bets.opponent_id.
-- Group bet participants join via bet_participants, so they were blocked.

drop policy if exists "proofs: read for bet participants" on proofs;
create policy "proofs: read for bet participants"
  on proofs for select to authenticated
  using (
    exists (
      select 1 from bets
      where bets.id = proofs.bet_id
        and bets.creator_id = auth.uid()
    )
    or exists (
      select 1 from bet_participants
      where bet_participants.bet_id = proofs.bet_id
        and bet_participants.user_id = auth.uid()
    )
  );

drop policy if exists "proofs: update for bet participants" on proofs;
create policy "proofs: update for bet participants"
  on proofs for update to authenticated
  using (
    exists (
      select 1 from bets
      where bets.id = proofs.bet_id
        and bets.creator_id = auth.uid()
    )
    or exists (
      select 1 from bet_participants
      where bet_participants.bet_id = proofs.bet_id
        and bet_participants.user_id = auth.uid()
    )
  );

-- Enable realtime on proofs so winners see uploads without refreshing
alter publication supabase_realtime add table proofs;
