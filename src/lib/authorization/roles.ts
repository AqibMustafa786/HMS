export const STAFF_ROLES = [
  "superadmin",
  "hospital_admin",
  "doctor",
  "receptionist",
  "nurse",
  "lab_technician",
  "pharmacist",
  "accountant",
] as const;

export const HMS_ROLES = [...STAFF_ROLES, "patient"] as const;
export type HmsRole = typeof HMS_ROLES[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<HmsRole, readonly string[]> = {
  superadmin: ["*"],
  hospital_admin: ["appointments.read", "appointments.write", "patients.read", "patients.write", "staff.read", "staff.write", "reports.read", "settings.write"],
  doctor: ["appointments.read", "appointments.write", "patients.read", "clinical.write", "prescriptions.write", "laboratory.read", "messages.write"],
  receptionist: ["appointments.read", "appointments.write", "patients.read", "patients.write", "schedules.write"],
  nurse: ["appointments.read", "patients.read", "clinical.write", "prescriptions.read"],
  lab_technician: ["patients.read", "laboratory.read", "laboratory.write"],
  pharmacist: ["patients.read", "prescriptions.read", "pharmacy.read", "pharmacy.write"],
  accountant: ["patients.read", "billing.read", "billing.write", "reports.read", "insurance.write"],
  patient: ["appointments.read", "appointments.create", "documents.read", "profile.write"],
};

export function normalizeRole(role: unknown): HmsRole | null {
  if (typeof role !== "string") return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin") return "hospital_admin";
  if (normalized === "super_admin") return "superadmin";
  return HMS_ROLES.includes(normalized as HmsRole) ? normalized as HmsRole : null;
}
