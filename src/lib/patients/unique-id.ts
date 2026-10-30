import { createHash, randomUUID } from "node:crypto";

export function normalizePatientKey(value: string) {
  if (typeof value !== "string") throw new TypeError("Patient key must be a string.");

  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/[\s-]/g, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();

  if (normalized.length < 3 || normalized.length > 64) {
    throw new RangeError("Patient key must contain between 3 and 64 letters or numbers.");
  }

  return normalized;
}

export function getPatientIdentityKey(value: string) {
  return createHash("sha256")
    .update(normalizePatientKey(value), "utf8")
    .digest("hex");
}

export function generatePatientId() {
  return `PT-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}
