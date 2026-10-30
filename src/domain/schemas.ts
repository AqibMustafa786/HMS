import { z } from "zod";

export const idSchema = z.string().min(1).max(128);
export const timestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const hospitalSettingsSchema = z.object({
  name: z.string().trim().min(1).max(160),
  currency: z.string().length(3),
  timezone: z.string().min(1),
  branches: z.array(idSchema).default([]),
}).passthrough();

export const departmentSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(120),
  branchId: idSchema,
  active: z.boolean(),
}).and(timestampsSchema.partial());

export const staffProfileSchema = z.object({
  uid: idSchema,
  employeeNumber: z.string().min(1).max(64),
  displayName: z.string().trim().min(1).max(120),
  departmentId: idSchema,
  title: z.string().trim().min(1).max(120),
  status: z.enum(["active", "disabled", "on_leave"]),
}).and(timestampsSchema.partial());

export const roleSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(120),
  permissions: z.array(z.string()).default([]),
});

export const permissionSchema = z.object({
  key: z.string().regex(/^[a-z]+(?:[._][a-z]+)+$/),
  description: z.string().trim().min(1),
});

export const permissionAssignmentSchema = z.object({
  uid: idSchema,
  roleIds: z.array(idSchema),
  permissions: z.array(z.string()),
  departmentIds: z.array(idSchema).default([]),
  branchIds: z.array(idSchema).default([]),
  expiresAt: z.string().datetime().nullable(),
  status: z.enum(["active", "disabled"]),
});

export const patientSchema = z.object({
  id: idSchema,
  mrn: z.string().regex(/^MRN-\d+$/),
  givenName: z.string().trim().min(1).max(80),
  familyName: z.string().trim().min(1).max(80),
  dateOfBirth: z.string().date(),
  sex: z.enum(["female", "male", "intersex", "unknown"]),
  phone: z.string().max(32).optional(),
  branchId: idSchema,
  createdBy: idSchema,
  lifecycleState: z.enum(["active", "merged", "deactivated"]),
}).and(timestampsSchema.partial());

export const appointmentSchema = z.object({
  id: idSchema,
  patientId: idSchema,
  practitionerId: idSchema,
  branchId: idSchema,
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  state: z.enum(["booked", "checked_in", "in_progress", "completed", "cancelled", "no_show"]),
  createdBy: idSchema,
}).and(timestampsSchema.partial());

export const encounterSchema = z.object({
  id: idSchema,
  patientId: idSchema,
  practitionerId: idSchema,
  type: z.enum(["outpatient", "inpatient", "emergency"]),
  state: z.enum(["draft", "active", "finished", "amended"]),
  branchId: idSchema,
  createdBy: idSchema,
}).and(timestampsSchema.partial());

export const auditEventSchema = z.object({
  id: idSchema,
  actorUid: idSchema,
  action: z.string().min(1).max(160),
  resourceType: z.string().min(1).max(80),
  resourceId: idSchema,
  outcome: z.enum(["success", "denied", "failure"]),
  timestamp: z.string().datetime(),
  justification: z.string().max(500).optional(),
});

export const documentMetadataSchema = z.object({
  id: idSchema,
  ownerPatientId: idSchema.optional(),
  uploadedBy: idSchema,
  storagePath: z.string().min(1).max(1024),
  contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  byteSize: z.number().int().positive().max(10_485_760),
  classification: z.enum(["clinical", "identity", "credential", "administrative"]),
}).and(timestampsSchema.partial());
