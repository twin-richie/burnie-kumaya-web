import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { ZodError } from "zod";
import { collectionItemSchemas, collectionSchemas, datastoreSchema, type CollectionName } from "./schemas";
import type { Datastore } from "./types";

const DATASTORE_COLLECTIONS = Object.keys(collectionSchemas) as CollectionName[];
const recordSources = new WeakMap<object, string>();

export class DataLoadError extends Error {
  constructor(
    message: string,
    public readonly file?: string,
  ) {
    super(file ? `${file}: ${message}` : message);
    this.name = "DataLoadError";
  }
}

export function getRecordSource(record: object): string | undefined {
  return recordSources.get(record);
}

function isCollectionName(value: string): value is CollectionName {
  return DATASTORE_COLLECTIONS.includes(value as CollectionName);
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.length ? issue.path.join(".") : "<root>"}: ${issue.message}`)
    .join("; ");
}

function isYamlFile(fileName: string): boolean {
  return /\.ya?ml$/i.test(fileName);
}

async function listYamlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listYamlFiles(fullPath);
      }
      if (entry.isFile() && isYamlFile(entry.name)) {
        return [fullPath];
      }
      return [];
    }),
  );

  return files.flat().sort((a, b) => a.localeCompare(b));
}

async function parseYamlFile(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");

  try {
    return parse(raw, { prettyErrors: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DataLoadError(`Invalid YAML: ${message}`, filePath);
  }
}

function collectionNameForFile(dataDir: string, filePath: string): CollectionName | undefined {
  const relativePath = path.relative(dataDir, filePath);
  const parts = relativePath.split(path.sep);
  const baseName = path.basename(filePath, path.extname(filePath));

  if (parts.length === 1) {
    return isCollectionName(baseName) ? baseName : undefined;
  }

  if (parts[0] === "meetings" && isYamlFile(filePath)) {
    return "meetings";
  }

  return undefined;
}

function annotateSources<T extends object>(items: T[], sources: string[]): void {
  items.forEach((item, index) => {
    const source = sources[index];
    if (source) {
      recordSources.set(item, source);
    }
  });
}

export async function loadDatastore(dataDir = path.join(process.cwd(), "data")): Promise<Datastore> {
  let yamlFiles: string[];

  try {
    yamlFiles = await listYamlFiles(dataDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DataLoadError(`Unable to read data directory: ${message}`, dataDir);
  }

  const rawStore: Record<CollectionName, unknown[]> = {
    areas: [],
    people: [],
    tasks: [],
    meetings: [],
    decisions: [],
    milestones: [],
    updates: [],
  };
  const sourceStore: Record<CollectionName, string[]> = {
    areas: [],
    people: [],
    tasks: [],
    meetings: [],
    decisions: [],
    milestones: [],
    updates: [],
  };
  const rootCollectionFiles = new Map<CollectionName, string>();

  for (const filePath of yamlFiles) {
    const collectionName = collectionNameForFile(dataDir, filePath);
    const relativePath = path.relative(dataDir, filePath);
    const isRootFile = !relativePath.includes(path.sep);

    if (collectionName && isRootFile) {
      const existing = rootCollectionFiles.get(collectionName);
      if (existing) {
        throw new DataLoadError(
          `Duplicate collection file for "${collectionName}"; already loaded ${existing}`,
          filePath,
        );
      }
      rootCollectionFiles.set(collectionName, filePath);
    }

    const parsed = await parseYamlFile(filePath);

    if (!collectionName) {
      continue;
    }

    if (isRootFile) {
      const schema = collectionSchemas[collectionName];
      const result = schema.safeParse(parsed ?? []);

      if (!result.success) {
        throw new DataLoadError(`Schema validation failed: ${formatZodError(result.error)}`, filePath);
      }

      rawStore[collectionName].push(...result.data);
      sourceStore[collectionName].push(...result.data.map(() => filePath));
      continue;
    }

    const schema = collectionItemSchemas[collectionName];
    const values = Array.isArray(parsed) ? parsed : [parsed];

    for (const [index, value] of values.entries()) {
      const result = schema.safeParse(value);

      if (!result.success) {
        const itemLabel = Array.isArray(parsed) ? ` item ${index}` : "";
        throw new DataLoadError(`Schema validation failed${itemLabel}: ${formatZodError(result.error)}`, filePath);
      }

      rawStore[collectionName].push(result.data);
      sourceStore[collectionName].push(filePath);
    }
  }

  const datastore = datastoreSchema.parse(rawStore);

  annotateSources(datastore.areas, sourceStore.areas);
  annotateSources(datastore.people, sourceStore.people);
  annotateSources(datastore.tasks, sourceStore.tasks);
  annotateSources(datastore.meetings, sourceStore.meetings);
  annotateSources(datastore.decisions, sourceStore.decisions);
  annotateSources(datastore.milestones, sourceStore.milestones);
  annotateSources(datastore.updates, sourceStore.updates);

  return datastore;
}
