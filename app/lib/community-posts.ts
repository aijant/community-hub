/**
 * `community-get-posts` (current): `{ pagination, pinned: Post[], recent: Post[] }`.
 * Each post may include nested `author: { id, name, avatar_url }`, `type: { id, value }`,
 * `created_by`, `is_pinned`, `content`, `channel`, `created_at`.
 *
 * Legacy shapes still supported: `{ posts | data | items | results: [...] }`, or a JSON array.
 */
import { supabase } from "./supabase-client";
import type { PostCategory } from "./community-post-types";
import {
  categoryFromTypeId,
  categoryFromTypeValue,
  DEFAULT_POST_CHANNEL,
  POST_TYPE_IDS,
} from "./community-post-types";

export interface BoardPostView {
  id: string;
  /** Community profile id (display author), not auth user id. */
  authorId: string;
  authorName: string;
  avatar: string;
  content: string;
  category: PostCategory;
  timestamp: Date;
  isPinned: boolean;
  channel: string;
  /** Supabase auth user id of creator (`created_by` on post). Used for client edit/delete ownership. */
  createdByUserId: string | null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pickString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

function pickBool(o: Record<string, unknown>, keys: string[], fallback = false): boolean {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "boolean") return v;
  }
  return fallback;
}

function pickDate(o: Record<string, unknown>, keys: string[]): Date {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return new Date();
}

function extractPostsPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];

  const pinnedArr = r["pinned"];
  const recentArr = r["recent"];
  if (Array.isArray(pinnedArr) || Array.isArray(recentArr)) {
    const pinned = Array.isArray(pinnedArr) ? pinnedArr : [];
    const recent = Array.isArray(recentArr) ? recentArr : [];
    const merged = [...pinned, ...recent];
    const seen = new Set<string>();
    const out: unknown[] = [];
    for (const item of merged) {
      const o = asRecord(item);
      const id = o ? pickString(o, ["id", "post_id", "uuid"]) : "";
      if (id) {
        if (seen.has(id)) continue;
        seen.add(id);
      }
      out.push(item);
    }
    return out;
  }

  for (const key of ["posts", "data", "items", "results"]) {
    const v = r[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function mapOnePost(raw: unknown, profileLookup: Map<string, { name: string; avatar: string }>): BoardPostView | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = pickString(o, ["id", "post_id", "uuid"]);
  if (!id) return null;

  const content = pickString(o, ["content", "body", "text", "message"]);
  const channelRaw = pickString(o, ["channel"]);
  const channel = channelRaw || DEFAULT_POST_CHANNEL;
  const isPinned = pickBool(o, ["is_pinned", "isPinned", "pinned"], false);

  const nestedAuthor = asRecord(o.author) ?? asRecord(o.profile) ?? asRecord(o.community_profile);
  const authorIdFromNested = nestedAuthor ? pickString(nestedAuthor, ["id"]) : "";
  const authorId =
    authorIdFromNested ||
    pickString(o, ["author_id", "authorId", "profile_id", "community_profile_id"]);

  const createdByUserIdRaw = pickString(o, ["created_by", "createdBy", "user_id"]);
  const createdByUserId = createdByUserIdRaw || null;

  let authorName = pickString(o, ["author_name", "authorName", "name", "display_name"]);
  let avatar = pickString(o, ["author_avatar", "avatar_url", "avatarUrl", "avatar"]);

  if (nestedAuthor) {
    if (!authorName) authorName = pickString(nestedAuthor, ["name", "display_name", "full_name"]);
    if (!avatar) avatar = pickString(nestedAuthor, ["avatar_url", "avatarUrl", "avatar"]);
  }

  if (authorId) {
    const p = profileLookup.get(authorId);
    if (p) {
      if (!authorName) authorName = p.name;
      if (!avatar) avatar = p.avatar;
    }
  }

  const typeObj = asRecord(o.type);
  const typeId =
    (typeObj ? pickString(typeObj, ["id"]) : "") ||
    pickString(o, ["type_id", "typeId", "post_type_id"]);
  const typeValue = typeObj ? pickString(typeObj, ["value", "slug", "name"]) : "";
  const category: PostCategory = typeId
    ? categoryFromTypeId(typeId)
    : categoryFromTypeValue(typeValue);

  return {
    id,
    authorId: authorId || "unknown",
    authorName: authorName || "Resident",
    avatar: avatar || "",
    content,
    category,
    timestamp: pickDate(o, ["created_at", "updated_at", "createdAt", "timestamp"]),
    isPinned,
    channel,
    createdByUserId,
  };
}

export function mapPostsResponse(
  data: unknown,
  profileRows: { id: string; name: string; avatar: string }[],
): BoardPostView[] {
  const lookup = new Map(profileRows.map((p) => [p.id, { name: p.name, avatar: p.avatar }]));
  const list = extractPostsPayload(data);
  const out: BoardPostView[] = [];
  for (const item of list) {
    const row = mapOnePost(item, lookup);
    if (row) out.push(row);
  }
  out.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return out;
}

function invokeErrorMessage(error: { message?: string } | null, data: unknown): string {
  const r = asRecord(data);
  if (r) {
    const msg = pickString(r, ["message", "error", "detail"]);
    if (msg) return msg;
  }
  return error?.message?.trim() || "Request failed.";
}

export async function fetchCommunityPostsRaw(): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke("community-get-posts", { method: "GET" });
  if (error) throw new Error(invokeErrorMessage(error, data));
  return data;
}

export async function fetchCommunityPosts(profileRows: { id: string; name: string; avatar: string }[]) {
  const data = await fetchCommunityPostsRaw();
  return mapPostsResponse(data, profileRows);
}

/**
 * Creates a post as the signed-in user. Edge should set `created_by` from JWT or trust this
 * `created_by` (Supabase `auth.users` id). Do not require `user_metadata.community_profile` on the client.
 */
export async function createCommunityPost(input: {
  content: string;
  category: PostCategory;
  /** Supabase auth user id (`auth.users.id`) — same as Events `created_by`. */
  createdByUserId: string;
  channel?: string;
  isPinned: boolean;
}) {
  const { data, error } = await supabase.functions.invoke("community-create-post", {
    body: {
      content: input.content,
      type_id: POST_TYPE_IDS[input.category],
      created_by: input.createdByUserId,
      channel: input.channel ?? DEFAULT_POST_CHANNEL,
      is_pinned: input.isPinned,
    },
  });
  if (error) throw new Error(invokeErrorMessage(error, data));
  return data;
}

export async function editCommunityPost(input: {
  postId: string;
  content: string;
  category: PostCategory;
  channel?: string;
  isPinned: boolean;
}) {
  const { data, error } = await supabase.functions.invoke("community-edit-post", {
    method: "PATCH",
    body: {
      post_id: input.postId,
      content: input.content,
      type_id: POST_TYPE_IDS[input.category],
      channel: input.channel ?? DEFAULT_POST_CHANNEL,
      is_pinned: input.isPinned,
    },
  });
  if (error) throw new Error(invokeErrorMessage(error, data));
  return data;
}

export async function deleteCommunityPost(postId: string) {
  const { data, error } = await supabase.functions.invoke("community-delete-post", {
    method: "DELETE",
    body: { post_id: postId },
  });
  if (error) throw new Error(invokeErrorMessage(error, data));
  return data;
}
