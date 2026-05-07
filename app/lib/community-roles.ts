const ADMIN_EQUIVALENT_ROLES = new Set(["admin", "manager", "superadmin"]);

export function normalizeCommunityRole(role: string | null | undefined): string {
  return role?.trim().toLowerCase() ?? "";
}

export function communityRoleCanModerate(role: string | null | undefined): boolean {
  return ADMIN_EQUIVALENT_ROLES.has(normalizeCommunityRole(role));
}

export const communityRoleCanPin = communityRoleCanModerate;
