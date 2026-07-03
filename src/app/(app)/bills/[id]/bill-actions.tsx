"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PaymentDialog } from "@/components/shared/payment-dialog";
import { cancelBill } from "@/app/actions/bills";
import { formatCurrency } from "@/lib/utils";
import { Printer, Wallet, MoreVertical, Share2, Ban, Copy, MessageCircle, Loader2 } from "lucide-react";

interface BillLite {
  id: number;
  billNumber: string;
  grandTotal: number;
  balance: number;
  status: string;
  customer: { name: string; mobile: string };
}

export function BillActions({
  bill,
  canRecordPayment,
  canCancel,
  canCreate,
}: {
  bill: BillLite;
  canRecordPayment: boolean;
  canCancel: boolean;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [payOpen, setPayOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const active = bill.status !== "CANCELLED";
  const hasBalance = bill.balance > 0.01;

  function share() {
    const text = `${bill.customer.name}, your bill ${bill.billNumber} from Vardhini Borewells is ${formatCurrency(
      bill.grandTotal,
    )}${hasBalance ? ` (Balance due: ${formatCurrency(bill.balance)})` : " — fully paid. Thank you!"}`;
    const phone = bill.customer.mobile.replace(/\D/g, "");
    const wa = `https://wa.me/${phone.length === 10 ? "91" + phone : phone}?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank");
  }

  async function onCancel() {
    if (!cancelReason.trim()) return toast.error("Enter a cancellation reason.");
    setLoading(true);
    const res = await cancelBill(bill.id, cancelReason);
    setLoading(false);
    if (res.ok) {
      toast.success("Bill cancelled");
      setCancelOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Print
      </Button>

      {active && hasBalance && canRecordPayment && (
        <Button onClick={() => setPayOpen(true)}>
          <Wallet className="h-4 w-4" /> Record Payment
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={share}>
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }}
          >
            <Share2 className="h-4 w-4" /> Copy link
          </DropdownMenuItem>
          {canCreate && (
            <DropdownMenuItem onClick={() => router.push(`/bills/new?duplicate=${bill.id}`)}>
              <Copy className="h-4 w-4" /> Duplicate bill
            </DropdownMenuItem>
          )}
          {active && canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={() => setCancelOpen(true)}>
                <Ban className="h-4 w-4" /> Cancel bill
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        jobId={bill.id}
        billNumber={bill.billNumber}
        balance={bill.balance}
        onDone={() => router.refresh()}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel {bill.billNumber}?</DialogTitle>
            <DialogDescription>
              The bill is retained with an audit trail. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Reason *</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Duplicate entry, customer cancelled…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={loading}>
              Keep bill
            </Button>
            <Button variant="destructive" onClick={onCancel} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
