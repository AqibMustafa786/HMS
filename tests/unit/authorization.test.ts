import { describe, expect, it } from "vitest";
import { canAccessResource, type TrustedPrincipal } from "@/lib/authorization/policy";
import { DEFAULT_ROLE_PERMISSIONS, HMS_ROLES, normalizeRole } from "@/lib/authorization/roles";

const activeDoctor: TrustedPrincipal = {
  uid: "staff-1",
  tenantId: "hospital-a",
  branchIds: ["branch-1"],
  permissions: ["patients.read"],
  status: "active",
  role: "doctor",
};

describe("canAccessResource", () => {
  it("allows an active principal with permission inside its tenant and branch", () => {
    expect(canAccessResource(activeDoctor, { tenantId: "hospital-a", branchId: "branch-1" }, "patients.read")).toBe(true);
  });

  describe("HMS roles", () => {
    it("defines permissions for every supported role", () => {
      expect(HMS_ROLES).toHaveLength(9);
      for (const role of HMS_ROLES) {
        expect(DEFAULT_ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });

    it("normalizes legacy role names without accepting arbitrary roles", () => {
      expect(normalizeRole("admin")).toBe("hospital_admin");
      expect(normalizeRole("SUPER_ADMIN")).toBe("superadmin");
      expect(normalizeRole("owner")).toBeNull();
    });
  });

  it("denies cross-tenant access even when the permission matches", () => {
    expect(canAccessResource(activeDoctor, { tenantId: "hospital-b", branchId: "branch-1" }, "patients.read")).toBe(false);
  });

  it("denies access to an unassigned branch", () => {
    expect(canAccessResource(activeDoctor, { tenantId: "hospital-a", branchId: "branch-2" }, "patients.read")).toBe(false);
  });

  it("denies missing permissions and disabled accounts", () => {
    expect(canAccessResource(activeDoctor, { tenantId: "hospital-a" }, "patients.write")).toBe(false);
    expect(canAccessResource({ ...activeDoctor, status: "disabled" }, { tenantId: "hospital-a" }, "patients.read")).toBe(false);
  });
});
