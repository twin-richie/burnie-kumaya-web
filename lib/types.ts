import type { z } from "zod";
import type {
  areaSchema,
  confidenceSchema,
  datastoreSchema,
  decisionSchema,
  meetingSchema,
  milestoneSchema,
  personSchema,
  provenanceSchema,
  taskSchema,
  updateSchema,
} from "./schemas";

export type Confidence = z.infer<typeof confidenceSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
export type Area = z.infer<typeof areaSchema>;
export type Person = z.infer<typeof personSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type Update = z.infer<typeof updateSchema>;
export type Datastore = z.infer<typeof datastoreSchema>;
