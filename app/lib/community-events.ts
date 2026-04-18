import { supabase } from "./supabase-client";

export interface CommunityEventRow {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string | null;
  created_by: string;
  attendees: string[] | null;
  max_attendees?: number | null;
}

export interface CommunityEventView {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizerName: string;
  attendeeDisplayNames: string[];
  attendeeIds: string[];
  createdByUserId: string;
  maxAttendees: number | null;
}

type ProfileLookup = Map<string, { name: string }>;

function formatDbError(err: { message?: string } | null, fallback: string): string {
  const m = err?.message?.trim();
  return m || fallback;
}

function pickString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function pickStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  return null;
}

function pickAttendees(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (const x of v) {
    if (typeof x === "string" && x.trim()) out.push(x);
  }
  return out;
}

function parseEventRow(raw: unknown): CommunityEventRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickString(o.id);
  if (!id) return null;
  const title = pickString(o.title);
  if (!title) return null;
  const date = pickString(o.date);
  if (!date) return null;
  const time = pickString(o.time);
  if (!time) return null;
  const createdBy = pickString(o.created_by);
  if (!createdBy) return null;

  let max: number | null = null;
  const mx = o.max_attendees;
  if (typeof mx === "number" && Number.isFinite(mx)) max = mx;

  return {
    id,
    title,
    description: pickStringOrNull(o.description),
    date,
    time,
    location: pickStringOrNull(o.location),
    created_by: createdBy,
    attendees: pickAttendees(o.attendees),
    max_attendees: max,
  };
}

function displayNameForUserId(id: string, lookup: ProfileLookup): string {
  const n = lookup.get(id)?.name?.trim();
  return n || "Resident";
}

export function mapEventRowToView(row: CommunityEventRow, lookup: ProfileLookup): CommunityEventView {
  const ids = row.attendees ?? [];
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    date: row.date,
    time: row.time,
    location: row.location ?? "",
    organizerName: displayNameForUserId(row.created_by, lookup),
    attendeeIds: [...ids],
    attendeeDisplayNames: ids.map((uid) => displayNameForUserId(uid, lookup)),
    createdByUserId: row.created_by,
    maxAttendees: row.max_attendees ?? null,
  };
}

export function mapEventRowsToViews(
  rows: CommunityEventRow[],
  profileRows: { id: string; name: string }[],
): CommunityEventView[] {
  const lookup: ProfileLookup = new Map(profileRows.map((p) => [p.id, { name: p.name }]));
  return rows.map((r) => mapEventRowToView(r, lookup));
}

export async function fetchCommunityEvents(
  profileRows: { id: string; name: string }[],
): Promise<CommunityEventView[]> {
  const { data, error } = await supabase
    .from("community_events")
    .select("*")
    .order("date", { ascending: true });

  if (error) throw new Error(formatDbError(error, "Could not load events."));
  const rows: CommunityEventRow[] = [];
  for (const raw of data ?? []) {
    const row = parseEventRow(raw);
    if (row) rows.push(row);
  }
  return mapEventRowsToViews(rows, profileRows);
}

export async function createCommunityEvent(input: {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  createdByUserId: string;
  maxAttendees?: number | null;
}) {
  const row: {
    title: string;
    description: string | null;
    date: string;
    time: string;
    location: string | null;
    created_by: string;
    attendees: string[];
    max_attendees?: number;
  } = {
    title: input.title.trim(),
    description: input.description.trim() || null,
    date: input.date,
    time: input.time,
    location: input.location.trim() || null,
    created_by: input.createdByUserId,
    attendees: [input.createdByUserId],
  };
  if (input.maxAttendees != null && input.maxAttendees > 0) {
    row.max_attendees = input.maxAttendees;
  }

  const { error } = await supabase.from("community_events").insert(row);
  if (error) throw new Error(formatDbError(error, "Could not create event."));
}

export async function updateCommunityEvent(input: {
  eventId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxAttendees?: number | null;
}) {
  const patch: {
    title: string;
    description: string | null;
    date: string;
    time: string;
    location: string | null;
    max_attendees?: number | null;
  } = {
    title: input.title.trim(),
    description: input.description.trim() || null,
    date: input.date,
    time: input.time,
    location: input.location.trim() || null,
  };
  if (input.maxAttendees !== undefined) {
    patch.max_attendees = input.maxAttendees;
  }

  const { error } = await supabase.from("community_events").update(patch).eq("id", input.eventId);
  if (error) throw new Error(formatDbError(error, "Could not update event."));
}

export async function deleteCommunityEvent(eventId: string) {
  const { error } = await supabase.from("community_events").delete().eq("id", eventId);
  if (error) throw new Error(formatDbError(error, "Could not delete event."));
}

export async function joinCommunityEvent(eventId: string) {
  const { error } = await supabase.rpc("join_community_event", { p_event_id: eventId });
  if (error) throw new Error(formatDbError(error, "Could not join event."));
}

export async function leaveCommunityEvent(eventId: string) {
  const { error } = await supabase.rpc("leave_community_event", { p_event_id: eventId });
  if (error) throw new Error(formatDbError(error, "Could not leave event."));
}
