import { describe, expect, it } from "vitest";
import { canAccessResource, type TrustedPrincipal } from "@/lib/authorization/policy";

const activeDoctor: TrustedPrincipal = {
  uid: "staff-1",
  tenantId: "hospital-a",
  branchIds: ["branch-1"],
  permissions: ["patients.read"],
  status: "active",
};

describe("canAccessResource", () => {
  it("allows an active principal with permission inside its tenant and branch", () => {
    expect(canAccessResource(activeDoctor, { tenantId: "hospital-a", branchId: "branch-1" }, "patients.read")).toBe(true);
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
