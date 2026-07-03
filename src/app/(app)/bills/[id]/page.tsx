import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { getBillById, paidAmount } from "@/lib/services/bills";
import { getCompanySettings } from "@/lib/services/settings";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BillReceipt } from "./bill-receipt";
import { BillActions } from "./bill-actions";

export const dynamic = "force-dynamic";

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bill, settings, user] = await Promise.all([
    getBillById(Number(id)),
    getCompanySettings(),
    getSession(),
  ]);
  if (!bill) notFound();

  const paid = paidAmount(bill.payments);
  const balance = Number(bill.grandTotal) - paid;

  // QR encodes a quick summary — scannable for verification / sharing.
  const qrData = `Bill:${bill.billNumber}\nCustomer:${bill.customer.customerName}\nAmount:INR ${Number(
    bill.grandTotal,
  ).toFixed(2)}\nDate:${bill.drillingDate.toISOString().slice(0, 10)}`;
  const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 160 });

  const plain = {
    id: bill.id,
    billNumber: bill.billNumber,
    drillingDate: bill.drillingDate.toISOString(),
    totalDepth: bill.totalDepth,
    waterLevel: bill.waterLevel,
    remarks: bill.remarks,
    subtotal: Number(bill.subtotal),
    discount: Number(bill.discount),
    taxRate: Number(bill.taxRate),
    taxAmount: Number(bill.taxAmount),
    grandTotal: Number(bill.grandTotal),
    status: bill.status,
    cancelledReason: bill.cancelledReason,
    diameter: bill.borewellType.diameterName,
    createdBy: bill.createdBy?.name || bill.createdBy?.username || "—",
    customer: {
      name: bill.customer.customerName,
      mobile: bill.customer.mobile,
      address: [bill.customer.address, bill.customer.village, bill.customer.taluk, bill.customer.district, bill.customer.state]
        .filter(Boolean)
        .join(", "),
    },
    items: bill.items.map((it) => ({
      id: it.id,
      itemType: it.itemType,
      description: it.description,
      quantity: Number(it.quantity),
      unit: it.unit,
      rate: Number(it.rate),
      amount: Number(it.amount),
    })),
    payments: bill.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentMode: p.paymentMode,
      referenceNumber: p.referenceNumber,
      paymentDate: p.paymentDate.toISOString(),
    })),
    paid,
    balance,
  };

  return (
    <>
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bills">
            <ArrowLeft className="h-4 w-4" /> Bills
          </Link>
        </Button>
        <BillActions
          bill={plain}
          canRecordPayment={can(user?.role, "payments:record")}
          canCancel={can(user?.role, "bills:cancel")}
          canCreate={can(user?.role, "bills:create")}
        />
      </div>

      <BillReceipt
        bill={plain}
        company={{
          companyName: settings.companyName,
          address: settings.address,
          contactNumber: settings.contactNumber,
          email: settings.email,
          gstNumber: settings.gstNumber,
          footerText: settings.footerText,
          gstEnabled: settings.gstEnabled,
        }}
        qrDataUrl={qrDataUrl}
      />
    </>
  );
}
