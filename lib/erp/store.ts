// Client-side helpers that call the /api/erp/[key] route which fronts Vercel
// KV. Every phase file uses these; if KV isn't configured the API returns
// null and we fall back to the seed data supplied by the caller.

function isServer() { return typeof window === 'undefined'; }

async function getStore<T>(key: string): Promise<T[] | null> {
  if (isServer()) {
    // On the server (RSC render), skip the fetch — components will hydrate
    // with the fallback and re-fetch on the client.
    return null;
  }
  try {
    const res = await fetch(`/api/erp/${encodeURIComponent(key)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.rows)) return null;
    return data.rows as T[];
  } catch {
    return null;
  }
}

async function putStore<T>(key: string, rows: T[]): Promise<boolean> {
  if (isServer()) return false;
  try {
    const res = await fetch(`/api/erp/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function delStore(key: string): Promise<boolean> {
  if (isServer()) return false;
  try {
    const res = await fetch(`/api/erp/${encodeURIComponent(key)}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public helpers used by every phase[1-6].ts file.
// ---------------------------------------------------------------------------

/** Read a list from the store. Returns seed data on any read failure so
 *  UIs keep rendering even when the backend is unreachable. */
export async function readList<T>(key: string, seed: T[]): Promise<T[]> {
  const rows = await getStore<T>(key);
  return rows ?? seed;
}

/** Overwrite a whole list. */
export async function writeList<T>(key: string, rows: T[]): Promise<void> {
  await putStore(key, rows);
}

/** Insert or update by id. */
export async function upsertRow<T extends { id: string }>(key: string, seed: T[], row: T): Promise<T[]> {
  const rows = await readList<T>(key, seed);
  const idx = rows.findIndex(r => r.id === row.id);
  const next = rows.slice();
  if (idx >= 0) next[idx] = row;
  else next.unshift(row);
  await writeList(key, next);
  return next;
}

/** Delete by id. */
export async function deleteRow<T extends { id: string }>(key: string, seed: T[], id: string): Promise<T[]> {
  const rows = await readList<T>(key, seed);
  const next = rows.filter(r => r.id !== id);
  await writeList(key, next);
  return next;
}

/** Read a single object (not a list). */
export async function readSingle<T>(key: string, seed: T): Promise<T> {
  if (isServer()) return seed;
  try {
    const res = await fetch(`/api/erp/${encodeURIComponent(key)}`, { cache: 'no-store' });
    if (!res.ok) return seed;
    const data = await res.json();
    return (data.rows as T) ?? seed;
  } catch {
    return seed;
  }
}

/** Write a single object. */
export async function writeSingle<T>(key: string, value: T): Promise<void> {
  if (isServer()) return;
  try {
    await fetch(`/api/erp/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rows: value }),
    });
  } catch {}
}
