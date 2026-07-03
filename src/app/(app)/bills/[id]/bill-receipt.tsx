import { Droplets } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

interface BillItem {
  id: number;
  itemType: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}
interface BillData {
  billNumber: string;
  drillingDate: string;
  totalDepth: number;
  waterLevel: number | null;
  remarks: string | null;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: string;
  cancelledReason: string | null;
  diameter: string;
  customer: { name: string; mobile: string; address: string };
  items: BillItem[];
  paid: number;
  balance: number;
}
interface Company {
  companyName: string;
  address: string | null;
  contactNumber: string | null;
  email: string | null;
  gstNumber: string | null;
  footerText: string | null;
  gstEnabled: boolean;
}

export function BillReceipt({
  bill,
  company,
  qrDataUrl,
}: {
  bill: BillData;
  company: Company;
  qrDataUrl: string;
}) {
  return (
    <div className="print-area mx-auto max-w-3xl rounded-lg border border-border bg-white p-8 text-zinc-900 shadow-sm sm:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Droplets className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{company.companyName}</h1>
            {company.address && <p className="text-sm text-zinc-600">{company.address}</p>}
            <p className="text-sm text-zinc-600">
              {[company.contactNumber, company.email].filter(Boolean).join(" · ")}
            </p>
            {company.gstEnabled && company.gstNumber && (
              <p className="text-xs text-zinc-500">GSTIN: {company.gstNumber}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold uppercase tracking-wide text-emerald-700">Invoice</p>
          <p className="font-mono text-sm">{bill.billNumber}</p>
          <p className="text-sm text-zinc-600">{formatDate(bill.drillingDate)}</p>
          <div className="mt-1 flex justify-end">
            <StatusBadge status={bill.status} />
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bill To</p>
          <p className="mt-1 text-base font-semibold">{bill.customer.name}</p>
          <p className="text-sm text-zinc-600">{bill.customer.mobile}</p>
          {bill.customer.address && <p className="max-w-xs text-sm text-zinc-600">{bill.customer.address}</p>}
        </div>
        <div className="text-right text-sm text-zinc-600">
          <p>
            <span className="text-zinc-500">Borewell:</span> {bill.diameter}"
          </p>
          <p>
            <span className="text-zinc-500">Total Depth:</span> {bill.totalDepth} ft
          </p>
          {bill.waterLevel != null && (
            <p>
              <span className="text-zinc-500">Water Level:</span> {bill.waterLevel} ft
            </p>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Bill QR code" className="h-24 w-24 rounded border border-zinc-200" />
      </div>

      {/* Items */}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-zinc-300 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-600">
            <th className="py-2 pl-2">#</th>
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 pr-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((it, i) => (
            <tr key={it.id} className="border-b border-zinc-100">
              <td className="py-2 pl-2 text-zinc-400">{i + 1}</td>
              <td className="py-2 font-medium">{it.description}</td>
              <td className="py-2 text-right tabular-nums">{it.quantity}</td>
              <td className="py-2 text-right text-zinc-500">{it.unit}</td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(it.rate)}</td>
              <td className="py-2 pr-2 text-right font-medium tabular-nums">{formatCurrency(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-5 flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600">Subtotal</span>
            <span className="tabular-nums">{formatCurrency(bill.subtotal)}</span>
          </div>
          {bill.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span className="tabular-nums">− {formatCurrency(bill.discount)}</span>
            </div>
          )}
          {bill.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-600">GST ({bill.taxRate}%)</span>
              <span className="tabular-nums">{formatCurrency(bill.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-zinc-900 pt-2 text-base font-bold">
            <span>Grand Total</span>
            <span className="tabular-nums">{formatCurrency(bill.grandTotal)}</span>
          </div>
          {bill.paid > 0 && (
            <>
              <div className="flex justify-between text-zinc-600">
                <span>Paid</span>
                <span className="tabular-nums">{formatCurrency(bill.paid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-amber-700">
                <span>Balance Due</span>
                <span className="tabular-nums">{formatCurrency(bill.balance)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {bill.remarks && (
        <div className="mt-6 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">
          <span className="font-medium text-zinc-700">Remarks: </span>
          {bill.remarks}
        </div>
      )}

      {bill.status === "CANCELLED" && bill.cancelledReason && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span className="font-semibold">Cancelled: </span>
          {bill.cancelledReason}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 flex items-end justify-between">
        <p className="max-w-sm text-xs text-zinc-500">{company.footerText}</p>
        <div className="text-center">
          <div className="mb-1 h-12 w-40 border-b border-zinc-400" />
          <p className="text-xs text-zinc-500">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
}
