export type Permission = string;

/** A verified, server-constructed identity and its trusted assignment context. */
export interface TrustedPrincipal {
  readonly uid: string;
  readonly tenantId: string;
  readonly branchIds: readonly string[];
  readonly permissions: readonly Permission[];
  readonly status: "active" | "disabled";
}

export interface ResourceScope {
  readonly tenantId: string;
  readonly branchId?: string;
}

/**
 * Pure authorization predicate. Call only after verifying the identity and
 * loading assignments from trusted storage; never construct this from request
 * body claims or client-side state.
 */
export function canAccessResource(
  principal: TrustedPrincipal,
  scope: ResourceScope,
  permission: Permission,
): boolean {
  if (principal.status !== "active") return false;
  if (principal.tenantId !== scope.tenantId) return false;
  if (!principal.permissions.includes("*") && !principal.permissions.includes(permission)) return false;
  if (scope.branchId && !principal.branchIds.includes(scope.branchId)) return false;
  return true;
}
