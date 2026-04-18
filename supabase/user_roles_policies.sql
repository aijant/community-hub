-- Run in Supabase SQL Editor (Dashboard → SQL).
-- This project: `user_roles.id` is the PK and matches auth.users(id).
-- If you use a separate `user_id` column instead, change USING(...) accordingly.

alter table public.user_roles enable row level security;

-- Allow each signed-in user to read only their own role row.
-- Drop first if you need to replace an existing policy with the same name.
drop policy if exists "user_roles_select_own" on public.user_roles;

create policy "user_roles_select_own"
on public.user_roles
for select
to authenticated
using (auth.uid() = id);

-- If you already created this policy with `user_id`, re-run the DROP + CREATE above
-- in the SQL Editor so the policy matches your actual column names.
