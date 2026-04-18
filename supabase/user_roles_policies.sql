-- Run in Supabase SQL Editor (Dashboard → SQL).
-- Adjust the column in USING(...) to match your table:
--   - Most common: user_id uuid references auth.users(id)
--   - Alternative: id uuid primary key references auth.users(id)

alter table public.user_roles enable row level security;

-- Allow each signed-in user to read only their own role row.
-- Drop first if you need to replace an existing policy with the same name.
drop policy if exists "user_roles_select_own" on public.user_roles;

create policy "user_roles_select_own"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- If your FK column is `id` instead of `user_id`, use:
-- using (auth.uid() = id);
