import type { User } from "@supabase/supabase-js";
import { getCommunityProfileId } from "./supabase-user-metadata";

export const COMMUNITY_PROFILES_URL =
  "https://ksxqwsihrizusoxorrcn.supabase.co/functions/v1/get_community_profiles";

export interface ApiProfile {
  id: string | null;
  name: string | null;
  position: string | null;
  description: string | null;
  room: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  /** When present: `admin` and `manager` may pin posts. */
  role?: string | null;
  /** Optional: returned by `get_community_profiles` for some tenants. */
  first_name?: string | null;
  last_name?: string | null;
  user_id?: string | null;
  auth_user_id?: string | null;
  email?: string | null;
}

export interface CommunityProfilesResponse {
  profiles: ApiProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export async function fetchCommunityProfilesJson(): Promise<CommunityProfilesResponse> {
  const url = `${COMMUNITY_PROFILES_URL}?_=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load profiles (${res.status})`);
  }
  return (await res.json()) as CommunityProfilesResponse;
}

export function formatRoom(room: string | null | undefined): string {
  const r = room?.trim();
  if (!r) return "—";
  return r.startsWith("Room ") ? r : `Room ${r}`;
}

export interface CommunityProfileRow {
  id: string;
  name: string;
  linkedinUrl: string;
  bio: string;
  title: string;
  avatar: string;
  room: string;
  role: string | null;
  firstName: string;
  lastName: string;
  userId: string | null;
  email: string | null;
}

function pickLooseString(raw: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function mapApiProfileToCommunityRow(api: ApiProfile, index: number): CommunityProfileRow {
  const raw = api as unknown as Record<string, unknown>;
  const firstName = pickLooseString(raw, ["first_name", "firstName", "given_name"]);
  const lastName = pickLooseString(raw, ["last_name", "lastName", "family_name", "surname"]);
  const userIdRaw = pickLooseString(raw, ["user_id", "auth_user_id", "linked_user_id", "supabase_user_id"]);
  const emailRaw = pickLooseString(raw, ["email", "user_email"]);

  return {
    id: api.id ?? `profile-${index}`,
    name: api.name ?? "",
    linkedinUrl: api.linkedin_url ?? "",
    bio: api.description ?? "",
    title: api.position ?? "",
    avatar: api.avatar_url ?? "",
    room: formatRoom(api.room),
    role: api.role?.trim() ? api.role.trim() : null,
    firstName,
    lastName,
    userId: userIdRaw || null,
    email: emailRaw || null,
  };
}

/** Match `get_community_profiles` row to the signed-in user (metadata id, then auth id, then email). */
export function findCommunityProfileForAuthUser(
  user: User | null,
  rows: CommunityProfileRow[],
): CommunityProfileRow | null {
  if (!user) return null;
  const metaId = getCommunityProfileId(user);
  if (metaId) {
    const byMeta = rows.find((r) => r.id === metaId);
    if (byMeta) return byMeta;
  }
  const byUid = rows.find((r) => r.userId === user.id);
  if (byUid) return byUid;
  const em = user.email?.trim().toLowerCase();
  if (em) {
    const byEmail = rows.find((r) => r.email?.trim().toLowerCase() === em);
    if (byEmail) return byEmail;
  }
  return null;
}

/** Synthetic id from `mapApiProfileToCommunityRow` when API omits `id`. */
function isPlaceholderCommunityProfileId(id: string): boolean {
  return /^profile-\d+$/.test(id.trim());
}

/**
 * Community profile UUID for posting / UI: prefers row match (metadata, user id, email),
 * then JWT `user_metadata.community_profile` when rows are not yet loaded.
 * Omits placeholder ids when the API returned no real `id`.
 */
export function getCommunityProfileIdForUser(
  user: User | null,
  rows: CommunityProfileRow[],
): string | null {
  const matched = findCommunityProfileForAuthUser(user, rows);
  if (matched && !isPlaceholderCommunityProfileId(matched.id)) {
    return matched.id;
  }
  const meta = getCommunityProfileId(user);
  if (meta && !isPlaceholderCommunityProfileId(meta)) {
    return meta;
  }
  return null;
}

/**
 * Why posting can be disabled even when a profile row is matched: API may omit a real UUID
 * (synthetic `profile-0` ids) or auth may lack `user_metadata.community_profile`.
 */
export function getCommunityProfileLinkStatus(
  user: User | null,
  rows: CommunityProfileRow[],
): "not_signed_in" | "linked" | "missing_link" | "placeholder_profile_id" {
  if (!user) return "not_signed_in";
  if (getCommunityProfileIdForUser(user, rows) != null) return "linked";
  const meta = getCommunityProfileId(user);
  if (meta && isPlaceholderCommunityProfileId(meta)) return "placeholder_profile_id";
  const matched = findCommunityProfileForAuthUser(user, rows);
  if (matched && isPlaceholderCommunityProfileId(matched.id)) return "placeholder_profile_id";
  return "missing_link";
}

const PIN_ROLES = new Set(["admin", "manager"]);

/** Case-insensitive: only admin and manager may pin/unpin. */
export function profileRoleCanPin(role: string | null | undefined): boolean {
  if (!role?.trim()) return false;
  return PIN_ROLES.has(role.trim().toLowerCase());
}
