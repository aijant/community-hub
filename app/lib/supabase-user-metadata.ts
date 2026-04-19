import type { User } from "@supabase/supabase-js";

/** Community board profile UUID stored on the user after LinkedIn parse (`parse-linkedin`). */
export function getCommunityProfileId(user: User | null | undefined): string | null {
  if (!user?.user_metadata || typeof user.user_metadata !== "object") return null;
  const raw = (user.user_metadata as Record<string, unknown>).community_profile;
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.trim();
}
