import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("committed security rules", () => {
  it("keeps Firestore collection access default-deny", () => {
    const rules = readFileSync("firestore.rules", "utf8");
    expect(rules).toContain("allow read, write: if false");
    expect(rules).not.toMatch(/allow\s+(read|write|create|update|delete)[^;]*if\s+(true|request\.auth != null)/);
  });

  it("keeps Storage object access default-deny", () => {
    const rules = readFileSync("storage.rules", "utf8");
    expect(rules).toContain("allow read, write: if false");
    expect(rules).not.toMatch(/allow\s+(read|write)[^;]*if\s+(true|request\.auth != null)/);
  });
});
