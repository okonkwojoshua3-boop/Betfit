-- ─────────────────────────────────────────────────────────────────────────────
-- Cancel Bet Migration
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the existing status check constraint so we can extend it
alter table bets drop constraint if exists bets_status_check;

-- Re-add with cancel_requested and cancelled statuses included
alter table bets add constraint bets_status_check
  check (status in ('pending','active','punishment_pending','completed','cancel_requested','cancelled'));
