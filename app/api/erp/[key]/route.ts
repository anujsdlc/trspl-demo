import { NextResponse } from 'next/server';
import { storeBackend, storeDel, storeGet, storeSet } from '@/lib/server-store';
import { ensureTradingHistory, isBootstrapKey } from '@/lib/demo-bootstrap';

function failure(action: string, key: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[erp-store] ${action} failed for ${key} (${storeBackend()} backend):`, message);
  return message;
}

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  try {
    if (isBootstrapKey(key)) await ensureTradingHistory();
    return NextResponse.json({ rows: await storeGet(key), backend: storeBackend() });
  } catch (err) {
    return NextResponse.json({ rows: null, error: failure('read', key, err) }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await storeSet(key, body.rows ?? body.value ?? null);
    return NextResponse.json({ ok: true, backend: storeBackend() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: failure('write', key, err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  try {
    await storeDel(key);
    return NextResponse.json({ ok: true, backend: storeBackend() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: failure('delete', key, err) }, { status: 500 });
  }
}
