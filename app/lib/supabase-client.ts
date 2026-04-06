import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url?.trim() && anonKey?.trim());

export const supabase = createClient(url ?? "", anonKey ?? "");

export const COMMUNITY_DOCUMENTS_BUCKET = "community-documents";
