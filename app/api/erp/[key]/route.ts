import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Wraps Vercel KV. Returns null (fallback to seed) when KV env vars are not
// configured so pages don't crash on unconfigured deployments.

async function safeGet(key: string) {
  try {
    return await kv.get(key);
  } catch (err) {
    console.warn(`[erp-store] read failed for ${key}:`, err);
    return null;
  }
}

async function safeSet(key: string, value: unknown) {
  try {
    await kv.set(key, value);
    return true;
  } catch (err) {
    console.warn(`[erp-store] write failed for ${key}:`, err);
    return false;
  }
}

async function safeDel(key: string) {
  try {
    await kv.del(key);
    return true;
  } catch (err) {
    console.warn(`[erp-store] delete failed for ${key}:`, err);
    return false;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const rows = await safeGet(key);
  return NextResponse.json({ rows });
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const body = await req.json().catch(() => ({}));
  const ok = await safeSet(key, body.rows ?? body.value ?? null);
  return NextResponse.json({ ok });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const ok = await safeDel(key);
  return NextResponse.json({ ok });
}
