-- ─────────────────────────────────────────────────────────────────────────────
-- Fix bets delete policy to include bet_participants (group bets)
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "bets: delete own" on bets;
create policy "bets: delete own"
  on bets for delete to authenticated
  using (
    auth.uid() = creator_id
    or auth.uid() = opponent_id
    or exists (
      select 1 from bet_participants
      where bet_participants.bet_id = bets.id
        and bet_participants.user_id = auth.uid()
    )
  );
