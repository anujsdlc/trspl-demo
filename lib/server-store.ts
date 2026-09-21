import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { kv } from '@vercel/kv';

const KV_CONFIGURED = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const DATA_DIR = process.env.TRS_DATA_DIR || path.join(process.cwd(), '.data');

export function storeBackend(): 'kv' | 'file' {
  return KV_CONFIGURED ? 'kv' : 'file';
}

function fileFor(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(DATA_DIR, `${safe}.json`);
}

function isMissing(err: unknown): boolean {
  return (err as NodeJS.ErrnoException)?.code === 'ENOENT';
}

export async function storeGet<T = unknown>(key: string): Promise<T | null> {
  if (KV_CONFIGURED) return (await kv.get<T>(key)) ?? null;
  try {
    return JSON.parse(await fs.readFile(fileFor(key), 'utf8')) as T;
  } catch (err) {
    if (isMissing(err)) return null;
    throw err;
  }
}

export async function storeSet(key: string, value: unknown): Promise<void> {
  if (KV_CONFIGURED) {
    await kv.set(key, value);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const target = fileFor(key);
  const tmp = `${target}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value), 'utf8');
  await fs.rename(tmp, target);
}

export async function storeDel(key: string): Promise<void> {
  if (KV_CONFIGURED) {
    await kv.del(key);
    return;
  }
  try {
    await fs.unlink(fileFor(key));
  } catch (err) {
    if (!isMissing(err)) throw err;
  }
}
