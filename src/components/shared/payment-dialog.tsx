"use client";
import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordPayment } from "@/app/actions/payments";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const MODES = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Card" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  jobId: number;
  billNumber: string;
  balance: number;
  onDone?: () => void;
}

export function PaymentDialog({ open, onOpenChange, jobId, billNumber, balance, onDone }: Props) {
  const [amount, setAmount] = React.useState("");
  const [mode, setMode] = React.useState("CASH");
  const [ref, setRef] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setAmount(balance > 0 ? String(balance) : "");
      setMode("CASH");
      setRef("");
    }
  }, [open, balance]);

  async function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount.");
    setLoading(true);
    const res = await recordPayment({
      jobId,
      amount: amt,
      paymentMode: mode,
      referenceNumber: ref,
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Payment recorded");
      onOpenChange(false);
      onDone?.();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {billNumber} · Balance due {formatCurrency(balance)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Payment mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reference number (optional)</Label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UPI ref / cheque no." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
