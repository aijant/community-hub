import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase-client";

export function useAuthRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u ?? null);
      if (!u) {
        setRole(null);
        return;
      }
      const { data, error: qErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("id", u.id)
        .single();
      if (qErr) {
        setError(qErr.message);
        setRole(null);
        return;
      }
      const r = data && typeof data === "object" && "role" in data ? (data as { role: unknown }).role : null;
      setRole(typeof r === "string" && r.trim() ? r.trim() : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load role.");
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => subscription.unsubscribe();
  }, [load]);

  const normalized = useMemo(() => role?.trim().toLowerCase() ?? "", [role]);

  const canPin = normalized === "admin" || normalized === "manager";
  const canModerate = canPin;
  const isClient = normalized === "client";

  return { user, role, loading, error, canPin, canModerate, isClient };
}
