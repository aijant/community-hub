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
  return res.json();
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
}

export function mapApiProfileToCommunityRow(api: ApiProfile, index: number): CommunityProfileRow {
  return {
    id: api.id ?? `profile-${index}`,
    name: api.name ?? "",
    linkedinUrl: api.linkedin_url ?? "",
    bio: api.description ?? "",
    title: api.position ?? "",
    avatar: api.avatar_url ?? "",
    room: formatRoom(api.room),
    role: api.role?.trim() ? api.role.trim() : null,
  };
}

const PIN_ROLES = new Set(["admin", "manager"]);

/** Case-insensitive: only admin and manager may pin/unpin. */
export function profileRoleCanPin(role: string | null | undefined): boolean {
  if (!role?.trim()) return false;
  return PIN_ROLES.has(role.trim().toLowerCase());
}
