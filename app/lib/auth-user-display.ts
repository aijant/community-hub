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

/** Subset of community profile used for header display (from `get_community_profiles`). */
export type CommunityProfileDisplayInput = {
  name: string;
  avatar: string;
  firstName?: string;
  lastName?: string;
};

function partsFromCommunityProfile(profile: CommunityProfileDisplayInput): AuthUserDisplayParts {
  let firstName = profile.firstName?.trim() ?? "";
  let lastName = profile.lastName?.trim() ?? "";
  if (!firstName && !lastName && profile.name.trim()) {
    const { first, rest } = splitFirstAndRest(profile.name);
    firstName = first;
    lastName = rest;
  }
  return { firstName, lastName, avatarUrl: profile.avatar.trim() };
}

/**
 * Name + avatar for the signed-in user. When a matching community profile exists, its
 * `first_name` / `last_name` / `name` / `avatar_url` take priority; auth metadata fills gaps.
 */
export function resolveAuthUserDisplay(
  user: User | null,
  communityProfile: CommunityProfileDisplayInput | null | undefined,
): AuthUserDisplayParts {
  if (!user) {
    return { firstName: "", lastName: "", avatarUrl: "" };
  }
  const meta = displayFromUserMetadata(user);
  if (!communityProfile) return meta;
  const fromProfile = partsFromCommunityProfile(communityProfile);
  return {
    firstName: fromProfile.firstName || meta.firstName,
    lastName: fromProfile.lastName || meta.lastName,
    avatarUrl: fromProfile.avatarUrl || meta.avatarUrl,
  };
}
