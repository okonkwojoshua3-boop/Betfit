-- ─────────────────────────────────────────────────────────────────────────────
-- Fix storage upload policy + add missing proof delete policy
-- Run in Supabase: SQL Editor → New Query → paste & run
-- ─────────────────────────────────────────────────────────────────────────────

-- Use split_part instead of storage.foldername() — more reliable across versions
drop policy if exists "storage proofs: upload" on storage.objects;
create policy "storage proofs: upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and auth.uid()::text = split_part(name, '/', 1)
  );

-- Allow upsert (overwrite) on own files
drop policy if exists "storage proofs: update" on storage.objects;
create policy "storage proofs: update"
  on storage.objects for update to authenticated
  using (bucket_id = 'proofs' and auth.uid()::text = split_part(name, '/', 1))
  with check (bucket_id = 'proofs' and auth.uid()::text = split_part(name, '/', 1));

-- Allow users to delete their own storage files
drop policy if exists "storage proofs: delete" on storage.objects;
create policy "storage proofs: delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and auth.uid()::text = split_part(name, '/', 1));

-- Allow losers to delete their own proof rows (needed for re-upload flow)
drop policy if exists "proofs: delete own" on proofs;
create policy "proofs: delete own"
  on proofs for delete to authenticated
  using (auth.uid() = uploaded_by);
