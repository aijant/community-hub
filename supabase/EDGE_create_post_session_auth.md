# Handoff: `community-create-post` + `community-get-posts` (session / role)

The Community Hub app no longer sends `author_id` (community profile UUID). The client invokes the Edge function with:

- `content`, `type_id`, `channel`, `is_pinned`
- `created_by`: Supabase `auth.users.id` (same idea as `community_events.created_by`)

## `community-create-post`

1. Derive the actor from the **JWT** (`auth.uid()`) and prefer that over trusting client `created_by` (optional: assert body `created_by` matches `auth.uid()` or ignore body and use JWT only).
2. Persist the post with `created_by` = that uid (or your column name for “who wrote it”).
3. Map display author (name/avatar) server-side to `community_profiles` if you still need a profile row; the **client** does not require `user_metadata.community_profile` to post.
4. Stop requiring `author_id` as the only way to create a post.

## `community-get-posts`

Return each post with `created_by` (or `createdBy`) set on every row, **like** `community_events.created_by`, so the UI can match the signed-in user without heuristics. Optional: also expose author `email` if you use it for display. The client falls back to email display / profile id when `created_by` is missing, but the DB should still provide `created_by` when possible.

## RLS / policies

Align with: non-moderators update/delete only their `created_by`; moderators (admin/manager) can pin and edit/delete any. See `supabase/community_board_rls_template.sql` for patterns if you use table RLS.
