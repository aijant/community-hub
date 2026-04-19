"use client";

import { useMemo } from "react";
import { useAuthRole } from "../hooks/use-auth-role";
import { useCommunityProfiles } from "../context/community-profiles-context";
import { findCommunityProfileForAuthUser } from "../lib/community-profiles";
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

  const matchedProfile = useMemo(
    () => findCommunityProfileForAuthUser(user, profileRows),
    [user, profileRows],
  );

  const display = useMemo(
    () =>
      resolveAuthUserDisplay(
        user,
        matchedProfile
          ? {
              name: matchedProfile.name,
              avatar: matchedProfile.avatar,
              firstName: matchedProfile.firstName,
              lastName: matchedProfile.lastName,
            }
          : null,
      ),
    [user, matchedProfile],
  );

  if (loading) {
    return (
      <div
        className="flex w-full max-w-none items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 sm:max-w-[min(100%,20rem)]"
        aria-busy="true"
        aria-label="Loading account"
      >
        <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 animate-pulse sm:h-9 sm:w-9" />
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="h-3.5 w-24 max-w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-none rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-500 sm:max-w-[min(100%,20rem)]">
        Not signed in
      </div>
    );
  }

  const line1 = [display.firstName, display.lastName].filter(Boolean).join(" ").trim();
  const showTwoLines = Boolean(display.firstName && display.lastName);

  return (
    <div className="flex w-full max-w-none min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm sm:max-w-[min(100%,20rem)]">
      <Avatar className="h-8 w-8 shrink-0 sm:h-9 sm:w-9">
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
