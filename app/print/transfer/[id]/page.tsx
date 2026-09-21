import { notFound } from 'next/navigation';
import { storeGet } from '@/lib/server-store';
import { INTERSTATE_KEY, type InterstateTransfer } from '@/lib/interstate';
import { SEED_GST } from '@/lib/erp/foundations';
import { documentFromTransfer } from '@/lib/document';
import { PrintableDocument } from '@/components/printable-document';

export default async function TransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = (await storeGet<InterstateTransfer[]>(INTERSTATE_KEY)) ?? [];
  const wanted = decodeURIComponent(id);
  const transfer = rows.find(t => t.id === wanted || t.reference === wanted);
  if (!transfer) notFound();

  const doc = documentFromTransfer(transfer, SEED_GST);
  if (!doc) notFound();

  return <PrintableDocument doc={doc} />;
}
