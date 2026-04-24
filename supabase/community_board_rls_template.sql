-- TEMPLATE: Align RLS (or direct Supabase access) with the Message Board role matrix in the app.
-- The Community Hub app often calls Edge Functions: community-get-posts, community-create-post,
-- community-edit-post, community-delete-post. If those are the only entry points, enforce
-- the same rules inside those functions; you may skip table RLS.
--
-- If you also SELECT/INSERT/UPDATE/DELETE from a table, adapt names below and run in SQL Editor.
-- Replace YOUR_BOARD_TABLE, column names, and joins to your community profile / author FKs.
--
-- Matrix (as in the app):
--   Residents: create posts, edit/delete own. No pin.
--   admin / manager: no create, edit/delete any post, set is_pinned.
--
-- Requires: public.user_roles(id uuid PK = auth.users.id) with `role` text.
-- See: supabase/user_roles_policies.sql

-- Helper: true when the signed-in user is admin or manager (can moderate / pin).
CREATE OR REPLACE FUNCTION public.is_community_board_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.id = auth.uid()
      AND lower(trim(ur.role)) IN ('admin', 'manager')
  );
$$;

REVOKE ALL ON FUNCTION public.is_community_board_moderator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_community_board_moderator() TO authenticated;

-- EXAMPLE (commented; uncomment and rename after you have a real table + columns):
--
-- ALTER TABLE public.YOUR_BOARD_TABLE ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "board_select_authenticated"
-- ON public.YOUR_BOARD_TABLE
-- FOR SELECT
-- TO authenticated
-- USING (true);
--
-- -- Residents only; moderators use app UI which does not create (still deny at DB for defense in depth)
-- CREATE POLICY "board_insert_residents_only"
-- ON public.YOUR_BOARD_TABLE
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   NOT public.is_community_board_moderator()
--   AND created_by = auth.uid()
-- );
--
-- CREATE POLICY "board_update_owners"
-- ON public.YOUR_BOARD_TABLE
-- FOR UPDATE
-- TO authenticated
-- USING (created_by = auth.uid() AND NOT public.is_community_board_moderator())
-- WITH CHECK (created_by = auth.uid());
--
-- CREATE POLICY "board_update_moderators"
-- ON public.YOUR_BOARD_TABLE
-- FOR UPDATE
-- TO authenticated
-- USING (public.is_community_board_moderator())
-- WITH CHECK (public.is_community_board_moderator());
--
-- CREATE POLICY "board_delete_owners"
-- ON public.YOUR_BOARD_TABLE
-- FOR DELETE
-- TO authenticated
-- USING (created_by = auth.uid() AND NOT public.is_community_board_moderator());
--
-- CREATE POLICY "board_delete_moderators"
-- ON public.YOUR_BOARD_TABLE
-- FOR DELETE
-- TO authenticated
-- USING (public.is_community_board_moderator());
