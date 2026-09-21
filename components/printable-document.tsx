'use client';

import { inr } from '@/lib/utils';
import type { PrintDocument } from '@/lib/document';
import { Printer } from 'lucide-react';

export function PrintableDocument({ doc }: { doc: PrintDocument }) {
  const interState = doc.igst > 0;

  return (
    <div className="print-page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; }
          .sheet { border: none !important; box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 14mm; }
        }
        .sheet { color: #111; background: #fff; }
        .sheet th, .sheet td { border-color: #d4d4d4; }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-[color:var(--color-ink-muted)]">
          {doc.title} · {doc.number}
        </div>
        <button
          onClick={() => window.print()}
          className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center gap-2"
        >
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>

      <div className="sheet mx-auto max-w-[860px] border border-[color:var(--color-line)] p-8 text-[13px] leading-snug">
        <div className="flex items-start justify-between gap-6 pb-4 border-b-2 border-[#111]">
          <div>
            <div className="font-serif text-2xl leading-tight">{doc.seller.name}</div>
            {doc.seller.lines.map(l => (
              <div key={l} className="text-[color:#555]">{l}</div>
            ))}
            <div className="mt-1 font-mono text-[12px]">
              GSTIN {doc.seller.gstin} · State {doc.seller.stateCode} — {doc.seller.state}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="uppercase tracking-[0.2em] text-[11px]">{doc.title}</div>
            <div className="font-mono text-lg mt-1">{doc.number}</div>
            <div className="text-[color:#555]">
              {new Date(doc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            {doc.against && (
              <div className="mt-1 text-[11px] text-[color:#555]">
                against <span className="font-mono">{doc.against}</span>
              </div>
            )}
          </div>
        </div>

        {doc.origin && (
          <div className="py-2 border-b border-[#d4d4d4] text-[12px] flex items-center gap-2 flex-wrap">
            <span className="uppercase tracking-widest text-[10px] text-[color:#666]">Raised at</span>
            <span>{doc.origin.brand}</span>
            <span className="font-mono">{doc.origin.storeCode}</span>
            <span className="text-[color:#666]">{doc.origin.location}</span>
            {doc.origin.airportCode && <span className="font-mono text-[color:#666]">{doc.origin.airportCode}</span>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 py-4 border-b border-[#d4d4d4]">
          <div>
            <div className="uppercase tracking-widest text-[10px] text-[color:#666] mb-1">Billed to</div>
            <div className="font-medium">{doc.buyer.name}</div>
            {doc.buyer.lines.map(l => <div key={l} className="text-[color:#555]">{l}</div>)}
            {doc.buyer.gstin && <div className="font-mono text-[12px] mt-1">GSTIN {doc.buyer.gstin}</div>}
          </div>
          <div className="text-right">
            <div className="uppercase tracking-widest text-[10px] text-[color:#666] mb-1">Place of supply</div>
            <div>{doc.placeOfSupply}</div>
            <div className="text-[color:#555] mt-1">
              Reverse charge: {doc.reverseCharge ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        <table className="w-full mt-4 border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#f4f4f4]">
              <th className="border p-2 text-left font-medium">#</th>
              <th className="border p-2 text-left font-medium">Description</th>
              <th className="border p-2 text-left font-medium">HSN</th>
              <th className="border p-2 text-right font-medium">Qty</th>
              <th className="border p-2 text-left font-medium">UQC</th>
              <th className="border p-2 text-right font-medium">Taxable</th>
              <th className="border p-2 text-right font-medium">Rate</th>
              {interState
                ? <th className="border p-2 text-right font-medium">IGST</th>
                : <><th className="border p-2 text-right font-medium">CGST</th><th className="border p-2 text-right font-medium">SGST</th></>}
              <th className="border p-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={l.sku + i}>
                <td className="border p-2">{i + 1}</td>
                <td className="border p-2">
                  {l.description}
                  <div className="font-mono text-[10px] text-[color:#666]">{l.sku}</div>
                </td>
                <td className="border p-2 font-mono">{l.hsn}</td>
                <td className="border p-2 text-right font-mono">{l.qty}</td>
                <td className="border p-2 font-mono">{l.uqc}</td>
                <td className="border p-2 text-right font-mono">{inr(l.taxableValue)}</td>
                <td className="border p-2 text-right font-mono">{l.rate}%</td>
                {interState
                  ? <td className="border p-2 text-right font-mono">{inr(l.igst)}</td>
                  : <><td className="border p-2 text-right font-mono">{inr(l.cgst)}</td><td className="border p-2 text-right font-mono">{inr(l.sgst)}</td></>}
                <td className="border p-2 text-right font-mono">{inr(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <table className="text-[12px] min-w-[300px]">
            <tbody>
              <Total label="Taxable value" value={inr(doc.taxableValue)} />
              {interState
                ? <Total label="IGST" value={inr(doc.igst)} />
                : <>
                    <Total label="CGST" value={inr(doc.cgst)} />
                    <Total label="SGST" value={inr(doc.sgst)} />
                  </>}
              {doc.roundOff !== 0 && <Total label="Round off" value={inr(doc.roundOff)} />}
              <tr className="border-t-2 border-[#111]">
                <td className="py-2 pr-6 font-medium">Total</td>
                <td className="py-2 text-right font-mono text-base font-medium">{inr(doc.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-[12px]">
          <span className="uppercase tracking-widest text-[10px] text-[color:#666] mr-2">In words</span>
          {doc.amountInWords}
        </div>

        {doc.transport && (doc.transport.ewayBillNo || doc.transport.vehicleNo) && (
          <div className="mt-4 pt-3 border-t border-[#d4d4d4] grid grid-cols-3 gap-4 text-[12px]">
            <Field label="E-way bill" value={doc.transport.ewayBillNo ?? '—'} />
            <Field label="Vehicle" value={doc.transport.vehicleNo ?? '—'} />
            <Field label="Transporter" value={doc.transport.transporter ?? '—'} />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#d4d4d4] flex items-end justify-between gap-6">
          <div className="text-[11px] text-[color:#555] max-w-[60%]">
            {doc.notes.map(n => <div key={n}>{n}</div>)}
            <div className="mt-2">This is a computer-generated document.</div>
          </div>
          <div className="text-right text-[11px]">
            <div className="text-[color:#555]">For {doc.seller.name}</div>
            <div className="mt-10 border-t border-[#111] pt-1">Authorised signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 pr-6 text-[color:#555]">{label}</td>
      <td className="py-1 text-right font-mono">{value}</td>
    </tr>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="uppercase tracking-widest text-[10px] text-[color:#666]">{label}</div>
      <div className="font-mono">{value}</div>
    </div>
  );
}
