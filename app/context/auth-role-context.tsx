import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase-client";

type AuthRoleContextValue = {
  user: User | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  canPin: boolean;
  canModerate: boolean;
  isClient: boolean;
};

const AuthRoleContext = createContext<AuthRoleContextValue | null>(null);

export function AuthRoleProvider({ children }: { children: ReactNode }) {
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
      const r =
        data && typeof data === "object" && "role" in data ? (data as { role: unknown }).role : null;
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

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      error,
      canPin,
      canModerate,
      isClient,
    }),
    [user, role, loading, error, canPin, canModerate, isClient],
  );

  return <AuthRoleContext.Provider value={value}>{children}</AuthRoleContext.Provider>;
}

export function useAuthRole(): AuthRoleContextValue {
  const ctx = useContext(AuthRoleContext);
  if (!ctx) {
    throw new Error("useAuthRole must be used within AuthRoleProvider");
  }
  return ctx;
}
