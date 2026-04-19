"use client";

import { useMemo } from "react";
import { useAuthRole } from "../hooks/use-auth-role";
import { useCommunityProfiles } from "../context/community-profiles-context";
import { getCommunityProfileId } from "../lib/supabase-user-metadata";
import { resolveAuthUserDisplay } from "../lib/auth-user-display";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

function formatRoleLabel(role: string | null): string {
  if (!role?.trim()) return "No role";
  const t = role.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function initials(firstName: string, lastName: string): string {
  const a = firstName.trim().charAt(0);
  const b = lastName.trim().charAt(0);
  if (a && b) return (a + b).toUpperCase();
  if (a) return a.toUpperCase();
  return "?";
}

export function DashboardUserStrip() {
  const { user, role, loading, error } = useAuthRole();
  const { rows: profileRows } = useCommunityProfiles();

  const matchedProfile = useMemo(() => {
    const id = getCommunityProfileId(user);
    if (!id) return null;
    return profileRows.find((r) => r.id === id) ?? null;
  }, [user, profileRows]);

  const display = useMemo(
    () => resolveAuthUserDisplay(user, matchedProfile),
    [user, matchedProfile],
  );

  if (loading) {
    return (
      <div
        className="flex items-center gap-3 min-w-[10rem] rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2"
        aria-busy="true"
        aria-label="Loading account"
      >
        <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 animate-pulse" />
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="h-3.5 w-24 max-w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-500">
        Not signed in
      </div>
    );
  }

  const line1 = [display.firstName, display.lastName].filter(Boolean).join(" ").trim();
  const showTwoLines = Boolean(display.firstName && display.lastName);

  return (
    <div className="flex items-center gap-3 min-w-0 max-w-[min(100%,20rem)] rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage
          src={display.avatarUrl || undefined}
          alt={line1 || "Signed-in user"}
        />
        <AvatarFallback className="text-xs font-medium">
          {initials(display.firstName, display.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-0.5">
        {showTwoLines ? (
          <>
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{display.firstName}</p>
            <p className="text-xs text-gray-600 truncate leading-tight">{display.lastName}</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{line1 || "Account"}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium capitalize">
            {formatRoleLabel(role)}
          </Badge>
          {error ? (
            <span className="text-[10px] text-amber-700 truncate max-w-[8rem]" title={error}>
              Role sync issue
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
