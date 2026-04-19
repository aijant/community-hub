import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

/** Column on `user_roles` that matches `auth.users.id` (this schema uses `id` as PK/FK). */
const USER_ROLES_AUTH_FK_COLUMN = "id" as const;

function formatAuthOrQueryError(
  label: string,
  err: { message: string; code?: string } | null,
): string {
  if (!err?.message) return `${label}: unknown error`;
  const code = err.code ? ` [${err.code}]` : "";
  return `${label}: ${err.message}${code}`;
}

function roleFromUserRolesRow(data: unknown): string | null {
  const r =
    data && typeof data === "object" && "role" in data ? (data as { role: unknown }).role : null;
  return typeof r === "string" && r.trim() ? r.trim() : null;
}

export function AuthRoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Last user id we successfully loaded `role` for (avoids re-query on TOKEN_REFRESHED / tab focus). */
  const roleLoadedForUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const applySignedOut = () => {
      roleLoadedForUserIdRef.current = null;
      setUser(null);
      setRole(null);
      setError(null);
      setLoading(false);
    };

    const fetchRoleForUser = async (u: User) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: qErr } = await supabase
          .from("user_roles")
          .select("role")
          .eq(USER_ROLES_AUTH_FK_COLUMN, u.id)
          .maybeSingle();
        if (qErr) {
          setError(formatAuthOrQueryError("user_roles", qErr));
          setRole(null);
          roleLoadedForUserIdRef.current = null;
          return;
        }
        setRole(roleFromUserRolesRow(data));
        roleLoadedForUserIdRef.current = u.id;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load role.");
        setRole(null);
        roleLoadedForUserIdRef.current = null;
      } finally {
        setLoading(false);
      }
    };

    const { data: listenerData } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        applySignedOut();
        return;
      }

      const u = session?.user ?? null;
      if (!u) {
        applySignedOut();
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        setUser(u);
        setLoading(false);
        return;
      }

      if (event === "USER_UPDATED") {
        setUser(u);
        setLoading(false);
        return;
      }

      setUser(u);

      if (roleLoadedForUserIdRef.current === u.id) {
        setLoading(false);
        return;
      }

      void fetchRoleForUser(u);
    });

    const subscription = listenerData?.subscription;
    return () => subscription?.unsubscribe();
  }, []);

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
