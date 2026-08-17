import { promises as fs } from "node:fs";
import path from "node:path";

// Backs the Supabase-fallback stores (draftOrders, slots) with a JSON file
// instead of a module-level Map. Next.js dev (Turbopack especially) can
// give different route/page bundles their own instance of an imported
// module's top-level state, so a plain in-memory Map doesn't reliably
// survive a request to /api/draft-order followed by a request to
// /buying-options — a file on disk does, and it's still nowhere near
// production infrastructure so there's no confusion about which is real.
const DIR = path.join(process.cwd(), ".dev-data");

function filePath(name: string) {
  return path.join(DIR, `${name}.json`);
}

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath(name), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(name: string, data: T): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(filePath(name), JSON.stringify(data, null, 2));
}

// A file's read-modify-write isn't atomic the way a real database
// transaction is — two concurrent callers could both read the same
// snapshot before either writes back, silently losing one update (or,
// for slot capacity, defeating the whole point of capacity locking).
// This serializes callers sharing the same `name` within this process;
// real concurrency safety still comes from Postgres once a project is
// connected — this only matters for exercising races in local dev.
const locks = new Map<string, Promise<unknown>>();

export function withFileLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const prior = locks.get(name) ?? Promise.resolve();
  const result = prior.then(fn, fn);
  locks.set(
    name,
    result.catch(() => {}),
  );
  return result;
}
