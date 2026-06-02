import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { confidenceSchema, provenanceSchema } from "./schemas";

const agendaSchema = z.strictObject({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  items: z.array(z.string().trim().min(1)).min(1),
  updated_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updated_by: z.string().trim().min(1),
  confidence: confidenceSchema,
  provenance: z.array(provenanceSchema).min(1),
});

export type NextLeadsAgenda = z.infer<typeof agendaSchema>;

export async function loadNextLeadsAgenda(dataDir = path.join(process.cwd(), "data")): Promise<NextLeadsAgenda> {
  const filePath = path.join(dataDir, "next-leads-agenda.yaml");
  const raw = await readFile(filePath, "utf8");
  const parsed = parse(raw, { prettyErrors: true });
  return agendaSchema.parse(parsed);
}
