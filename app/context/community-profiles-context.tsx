import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCommunityProfilesJson,
  mapApiProfileToCommunityRow,
  type CommunityProfileRow,
} from "../lib/community-profiles";

type CommunityProfilesContextValue = {
  rows: CommunityProfileRow[];
  loading: boolean;
  error: string | null;
  reload: (options?: { silent?: boolean }) => Promise<void>;
};

const CommunityProfilesContext = createContext<CommunityProfilesContextValue | null>(null);

export function CommunityProfilesProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<CommunityProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchCommunityProfilesJson();
      const list = data.profiles ?? [];
      setRows(list.map((api, index) => mapApiProfileToCommunityRow(api, index)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load resident profiles.");
      setRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ rows, loading, error, reload }),
    [rows, loading, error, reload],
  );

  return <CommunityProfilesContext.Provider value={value}>{children}</CommunityProfilesContext.Provider>;
}

export function useCommunityProfiles(): CommunityProfilesContextValue {
  const ctx = useContext(CommunityProfilesContext);
  if (!ctx) {
    throw new Error("useCommunityProfiles must be used within CommunityProfilesProvider");
  }
  return ctx;
}
