import { notFound } from 'next/navigation';
import { storeGet } from '@/lib/server-store';
import { CREDIT_NOTES_KEY, type CreditNote } from '@/lib/credit-notes';
import { SEED_GST } from '@/lib/erp/foundations';
import { documentFromCreditNote } from '@/lib/document';
import { PrintableDocument } from '@/components/printable-document';

export default async function CreditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notes = (await storeGet<CreditNote[]>(CREDIT_NOTES_KEY)) ?? [];
  const wanted = decodeURIComponent(id);
  const note = notes.find(n => n.id === wanted || n.number === wanted);
  if (!note) notFound();

  const doc = documentFromCreditNote(note, SEED_GST);
  if (!doc) notFound();

  return <PrintableDocument doc={doc} />;
}
