import type { User } from "@supabase/supabase-js";

export type AuthUserDisplayParts = {
  firstName: string;
  lastName: string;
  avatarUrl: string;
};

function readMetaString(meta: Record<string, unknown> | undefined, keys: string[]): string {
  if (!meta) return "";
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function splitFirstAndRest(full: string): { first: string; rest: string } {
  const t = full.trim();
  if (!t) return { first: "", rest: "" };
  const i = t.indexOf(" ");
  if (i === -1) return { first: t, rest: "" };
  return { first: t.slice(0, i), rest: t.slice(i + 1).trim() };
}

function displayFromUserMetadata(user: User): AuthUserDisplayParts {
  const meta =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : undefined;

  let firstName = readMetaString(meta, ["given_name", "first_name"]);
  let lastName = readMetaString(meta, ["family_name", "last_name", "surname"]);

  if (!firstName && !lastName) {
    const combined = readMetaString(meta, ["full_name", "name", "real_name", "display_name"]);
    if (combined) {
      const { first, rest } = splitFirstAndRest(combined);
      firstName = first;
      lastName = rest;
    }
  }

  if (!firstName && user.email) {
    const local = user.email.split("@")[0]?.trim();
    if (local) firstName = local;
  }

  const avatarUrl = readMetaString(meta, ["avatar_url", "picture", "photo_url"]);

  return { firstName, lastName, avatarUrl };
}

function mergeCommunityProfile(
  base: AuthUserDisplayParts,
  profile: { name: string; avatar: string } | null | undefined,
): AuthUserDisplayParts {
  if (!profile) return base;
  let { firstName, lastName, avatarUrl } = base;

  if (!avatarUrl && profile.avatar.trim()) {
    avatarUrl = profile.avatar.trim();
  }

  if ((!firstName || !lastName) && profile.name.trim()) {
    const { first, rest } = splitFirstAndRest(profile.name);
    if (!firstName) firstName = first;
    if (!lastName) lastName = rest;
  }

  if (!lastName && profile.name.trim()) {
    const { first, rest } = splitFirstAndRest(profile.name);
    if (rest && (!firstName || first.toLowerCase() === firstName.toLowerCase())) {
      lastName = rest;
      if (!firstName) firstName = first;
    }
  }

  return { firstName, lastName, avatarUrl };
}

/** Display name + avatar from Supabase auth user, optionally enriched from a community profile row. */
export function resolveAuthUserDisplay(
  user: User | null,
  communityProfile: { name: string; avatar: string } | null | undefined,
): AuthUserDisplayParts {
  if (!user) {
    return { firstName: "", lastName: "", avatarUrl: "" };
  }
  return mergeCommunityProfile(displayFromUserMetadata(user), communityProfile ?? null);
}
