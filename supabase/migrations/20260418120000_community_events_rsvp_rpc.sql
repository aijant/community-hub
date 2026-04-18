-- RSVP join/leave via SECURITY DEFINER RPC so non-owners can update `attendees`
-- without broadening UPDATE RLS on `community_events`.
-- Apply with Supabase CLI (`supabase db push`) or paste into SQL Editor.

CREATE OR REPLACE FUNCTION public.join_community_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.community_events
  SET attendees =
    CASE
      WHEN attendees IS NULL THEN ARRAY[uid]
      WHEN uid = ANY(attendees) THEN attendees
      ELSE array_append(attendees, uid)
    END
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_community_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.community_events
  SET attendees = array_remove(COALESCE(attendees, ARRAY[]::uuid[]), uid)
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.join_community_event(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_community_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_community_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_community_event(uuid) TO authenticated;
