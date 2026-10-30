# HMS workspace instructions

- This is a multi-tenant HMS foundation. Use fictional data only; never introduce real patient information.
- Preserve default-deny Firestore and Storage rules. Never weaken authorization to make a UI flow work.
- Treat every patient, clinical, financial, staff, document, and tenant resource as sensitive. Enforce authorization in trusted server operations and rules; UI visibility is not security.
- Never trust client-provided tenant IDs, roles, permissions, prices, ownership, or authoritative timestamps.
- Keep clinical, financial, and administrative workflows domain-oriented, validated, auditable, and tested for unauthorized access as well as allowed behavior.
- Do not claim production readiness, compliance, penetration testing, or working integrations without evidence. Document external configuration and limitations.
- Run lint, typecheck, unit tests, and build after relevant changes; report only commands actually run.
