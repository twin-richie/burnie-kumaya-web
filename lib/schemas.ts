import { z } from "zod";

export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected ISO date in YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Expected a valid calendar date");

const nonEmptyString = z.string().trim().min(1);

export const provenanceSchema = z.strictObject({
  source_type: z.enum([
    "meeting",
    "doc",
    "user_instruction",
    "burnie_inference",
    "manual_seed",
  ]),
  source_ref: nonEmptyString,
  source_date: isoDateSchema.optional(),
  quote: nonEmptyString.optional(),
});

const confidenceAndProvenance = {
  confidence: confidenceSchema,
  provenance: z.array(provenanceSchema).min(1, "At least one provenance entry is required"),
};

export const areaSchema = z.strictObject({
  slug: nonEmptyString,
  name: nonEmptyString,
  description: nonEmptyString,
  lead: nonEmptyString.optional(),
  icon: nonEmptyString.optional(),
  color: nonEmptyString.optional(),
  ...confidenceAndProvenance,
});

export const personSchema = z.strictObject({
  id: nonEmptyString,
  name: nonEmptyString,
  role: nonEmptyString.optional(),
  areas: z.array(nonEmptyString).default([]),
  notes: nonEmptyString.optional(),
  ...confidenceAndProvenance,
});

export const taskSchema = z.strictObject({
  id: nonEmptyString,
  title: nonEmptyString,
  status: z.enum(["open", "in_progress", "blocked", "done", "parked"]),
  priority: z.enum(["urgent", "high", "normal", "low"]),
  area: nonEmptyString,
  owner: nonEmptyString.optional(),
  due_date: isoDateSchema.optional(),
  next_action: nonEmptyString.optional(),
  notes: nonEmptyString.optional(),
  needs_review: z.boolean(),
  review_note: nonEmptyString.optional(),
  ...confidenceAndProvenance,
  created_at: isoDateSchema,
  updated_at: isoDateSchema,
});

const meetingSectionSchema = z.strictObject({
  heading: nonEmptyString,
  body: nonEmptyString,
});

export const meetingSchema = z.strictObject({
  slug: nonEmptyString,
  date: isoDateSchema,
  title: nonEmptyString,
  attendees: z.array(nonEmptyString),
  summary: nonEmptyString,
  sections: z.array(meetingSectionSchema).default([]),
  action_items: z.array(nonEmptyString).default([]),
  decisions: z.array(nonEmptyString).default([]),
  source_refs: z.array(nonEmptyString).default([]),
  ...confidenceAndProvenance,
});

export const decisionSchema = z.strictObject({
  id: nonEmptyString,
  date: isoDateSchema,
  title: nonEmptyString,
  decision: nonEmptyString,
  area: nonEmptyString.optional(),
  rationale: nonEmptyString.optional(),
  supersedes: nonEmptyString.optional(),
  superseded_by: nonEmptyString.optional(),
  ...confidenceAndProvenance,
});

export const milestoneSchema = z.strictObject({
  id: nonEmptyString,
  date: isoDateSchema,
  title: nonEmptyString,
  type: z.enum(["deadline", "event", "build", "logistics", "payment", "meeting"]),
  area: nonEmptyString.optional(),
  description: nonEmptyString.optional(),
  ...confidenceAndProvenance,
});

const changedObjectSchema = z.strictObject({
  type: z.enum(["area", "person", "task", "meeting", "decision", "milestone", "update"]),
  id: nonEmptyString,
  change: nonEmptyString,
});

export const updateSchema = z.strictObject({
  id: nonEmptyString,
  date: isoDateSchema,
  title: nonEmptyString,
  summary: nonEmptyString,
  changed_objects: z.array(changedObjectSchema),
  source: nonEmptyString,
  ...confidenceAndProvenance,
});

export const datastoreSchema = z.strictObject({
  areas: z.array(areaSchema).default([]),
  people: z.array(personSchema).default([]),
  tasks: z.array(taskSchema).default([]),
  meetings: z.array(meetingSchema).default([]),
  decisions: z.array(decisionSchema).default([]),
  milestones: z.array(milestoneSchema).default([]),
  updates: z.array(updateSchema).default([]),
});

export const collectionSchemas = {
  areas: z.array(areaSchema),
  people: z.array(personSchema),
  tasks: z.array(taskSchema),
  meetings: z.array(meetingSchema),
  decisions: z.array(decisionSchema),
  milestones: z.array(milestoneSchema),
  updates: z.array(updateSchema),
} as const;

export const collectionItemSchemas = {
  areas: areaSchema,
  people: personSchema,
  tasks: taskSchema,
  meetings: meetingSchema,
  decisions: decisionSchema,
  milestones: milestoneSchema,
  updates: updateSchema,
} as const;

export type CollectionName = keyof typeof collectionSchemas;
