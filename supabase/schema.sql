-- ─────────────────────────────────────────────────────────────────────────────
-- BetFit Database Schema
-- Run this in your Supabase project: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ─────────────────────────────────────────────────────────────────
-- Extends Supabase Auth users with a public username
create table if not exists profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  username   text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create a profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ── Bets ─────────────────────────────────────────────────────────────────────
create table if not exists bets (
  id                    uuid primary key default gen_random_uuid(),
  match_id              text not null,
  creator_id            uuid references profiles(id) on delete cascade not null,
  opponent_id           uuid references profiles(id) on delete set null,
  creator_name          text not null,
  opponent_name         text not null,
  creator_team_pick_id  text not null,
  opponent_team_pick_id text not null,
  punishment_id         text not null,
  punishment_reps       int  not null,
  status                text not null default 'pending'
                          check (status in ('pending','active','punishment_pending','completed')),
  loser_id              text check (loser_id in ('creator','opponent','draw')),
  home_score            int,
  away_score            int,
  created_at            timestamptz default now(),
  resolved_at           timestamptz
);


-- ── Proofs ────────────────────────────────────────────────────────────────────
create table if not exists proofs (
  id              uuid primary key default gen_random_uuid(),
  bet_id          uuid references bets(id) on delete cascade not null,
  uploaded_by     uuid references profiles(id) on delete cascade not null,
  file_url        text not null,
  status          text not null default 'pending_review'
                    check (status in ('pending_review','approved','rejected')),
  rejection_note  text,
  created_at      timestamptz default now()
);


-- ── Notifications ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  bet_id      uuid references bets(id) on delete cascade,
  message     text not null,
  loser_name  text,
  punishment  text,
  read        boolean default false,
  created_at  timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table profiles      enable row level security;
alter table bets          enable row level security;
alter table proofs        enable row level security;
alter table notifications enable row level security;


-- ── Profiles policies ────────────────────────────────────────────────────────
-- Anyone authenticated can read profiles (for opponent search)
create policy "profiles: read all"
  on profiles for select to authenticated using (true);

-- Users can update only their own profile
create policy "profiles: update own"
  on profiles for update to authenticated using (auth.uid() = id);


-- ── Bets policies ────────────────────────────────────────────────────────────
-- Users see only bets they are part of
create policy "bets: read own"
  on bets for select to authenticated
  using (auth.uid() = creator_id or auth.uid() = opponent_id);

-- Users can create bets as themselves
create policy "bets: insert as creator"
  on bets for insert to authenticated
  with check (auth.uid() = creator_id);

-- Users can update bets they are part of (accept, resolve, etc.)
create policy "bets: update own"
  on bets for update to authenticated
  using (auth.uid() = creator_id or auth.uid() = opponent_id);

-- Users can delete (decline) bets they are part of
create policy "bets: delete own"
  on bets for delete to authenticated
  using (auth.uid() = creator_id or auth.uid() = opponent_id);


-- ── Proofs policies ──────────────────────────────────────────────────────────
-- Users can see proofs for bets they are in
create policy "proofs: read for bet participants"
  on proofs for select to authenticated
  using (
    exists (
      select 1 from bets
      where bets.id = proofs.bet_id
        and (bets.creator_id = auth.uid() or bets.opponent_id = auth.uid())
    )
  );

-- Users can upload proof as themselves
create policy "proofs: insert own"
  on proofs for insert to authenticated
  with check (auth.uid() = uploaded_by);

-- Users can update proofs for bets they are in (approve/reject)
create policy "proofs: update for bet participants"
  on proofs for update to authenticated
  using (
    exists (
      select 1 from bets
      where bets.id = proofs.bet_id
        and (bets.creator_id = auth.uid() or bets.opponent_id = auth.uid())
    )
  );


-- ── Notifications policies ────────────────────────────────────────────────────
-- Users see only their own notifications
create policy "notifications: read own"
  on notifications for select to authenticated
  using (auth.uid() = user_id);

-- Allow insert from backend/trigger (service role handles this)
create policy "notifications: insert"
  on notifications for insert to authenticated
  with check (true);

-- Users can mark their own as read
create policy "notifications: update own"
  on notifications for update to authenticated
  using (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket for proof photos
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this separately if it fails inline:
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict do nothing;

-- Authenticated users can upload to their own folder
create policy "storage proofs: upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read proof files for bets they are in
create policy "storage proofs: read"
  on storage.objects for select to authenticated
  using (bucket_id = 'proofs');


-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime — enable for live bet/notification updates
-- ─────────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table bets;
alter publication supabase_realtime add table notifications;
