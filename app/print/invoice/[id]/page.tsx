import { notFound } from 'next/navigation';
import { storeGet } from '@/lib/server-store';
import { ensureTradingHistory } from '@/lib/demo-bootstrap';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import { SEED_GST } from '@/lib/erp/foundations';
import { invoiceFromOrder } from '@/lib/document';
import { PrintableDocument } from '@/components/printable-document';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureTradingHistory();
  const orders = (await storeGet<Order[]>(ORDERS_STORE_KEY)) ?? [];
  const order = orders.find(o => o.id === decodeURIComponent(id));
  if (!order) notFound();

  const doc = invoiceFromOrder(order, SEED_GST);
  if (!doc) notFound();

  return <PrintableDocument doc={doc} />;
}
