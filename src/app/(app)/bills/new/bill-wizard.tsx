"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerFormDialog } from "../../customers/customer-form-dialog";
import { searchCustomersAction, getCustomerLiteAction } from "@/app/actions/customers";
import { createBill } from "@/app/actions/bills";
import {
  calculateDrilling,
  calculateAdditionalCharge,
  calculateBillTotals,
  unitLabel,
  needsQuantity,
  type ChargeUnit,
} from "@/lib/calc";
import { formatCurrency, toDateInputValue } from "@/lib/utils";
import {
  User,
  Search,
  Ruler,
  Waves,
  Plus,
  Loader2,
  Receipt,
  AlertTriangle,
  Check,
  UserPlus,
} from "lucide-react";

interface Slab {
  id: number;
  startDepth: number;
  endDepth: number;
  pricePerFt: number;
}
interface BorewellTypeOpt {
  id: number;
  diameterName: string;
  slabs: Slab[];
}
interface ChargeRate {
  id: number;
  borewellTypeId: number;
  name: string;
  price: number;
  unit: ChargeUnit;
}
interface CustomerLite {
  id: number;
  customerName: string;
  mobile: string;
  village?: string | null;
}

interface InitialValues {
  borewellTypeId: number;
  totalDepth: number;
  waterLevel: number | null;
  remarks: string | null;
  discount: number;
}

interface Props {
  formData: { borewellTypes: BorewellTypeOpt[]; chargeRates: ChargeRate[] };
  recentCustomers: CustomerLite[];
  preselectedCustomer: CustomerLite | null;
  initial?: InitialValues | null;
}

export function BillWizard({ formData, recentCustomers, preselectedCustomer, initial }: Props) {
  const router = useRouter();

  // Customer
  const [customer, setCustomer] = React.useState<CustomerLite | null>(preselectedCustomer);
  const [custQuery, setCustQuery] = React.useState("");
  const [custResults, setCustResults] = React.useState<CustomerLite[]>(recentCustomers);
  const [custOpen, setCustOpen] = React.useState(false);
  const [newCustOpen, setNewCustOpen] = React.useState(false);

  // Job (optionally prefilled when duplicating a bill)
  const [typeId, setTypeId] = React.useState<number | null>(
    initial?.borewellTypeId ?? formData.borewellTypes[0]?.id ?? null,
  );
  const [depth, setDepth] = React.useState<string>(initial ? String(initial.totalDepth) : "");
  const [drillingDate, setDrillingDate] = React.useState(toDateInputValue(new Date()));
  const [waterLevel, setWaterLevel] = React.useState(initial?.waterLevel != null ? String(initial.waterLevel) : "");
  const [remarks, setRemarks] = React.useState(initial?.remarks ?? "");
  const [discount, setDiscount] = React.useState(initial?.discount ? String(initial.discount) : "");

  // Charges: map chargeRateId -> quantity
  const [selectedCharges, setSelectedCharges] = React.useState<Record<number, number>>({});

  const [submitting, setSubmitting] = React.useState(false);

  // Debounced customer search
  React.useEffect(() => {
    if (!custOpen) return;
    const t = setTimeout(async () => {
      const res = await searchCustomersAction(custQuery);
      setCustResults(res);
    }, 250);
    return () => clearTimeout(t);
  }, [custQuery, custOpen]);

  const selectedType = formData.borewellTypes.find((t) => t.id === typeId) ?? null;
  const availableCharges = formData.chargeRates.filter((c) => c.borewellTypeId === typeId);

  const depthNum = parseInt(depth || "0", 10) || 0;

  // Live drilling breakdown
  const drilling = React.useMemo(
    () => calculateDrilling(depthNum, selectedType?.slabs ?? []),
    [depthNum, selectedType],
  );

  // Live additional-charge totals
  const chargeLines = React.useMemo(() => {
    return Object.entries(selectedCharges)
      .map(([id, qty]) => {
        const rate = availableCharges.find((c) => c.id === Number(id));
        if (!rate) return null;
        const amount = calculateAdditionalCharge({ price: rate.price, unit: rate.unit, quantity: qty });
        return { rate, qty, amount };
      })
      .filter(Boolean) as { rate: ChargeRate; qty: number; amount: number }[];
  }, [selectedCharges, availableCharges]);

  const additionalTotal = chargeLines.reduce((s, l) => s + l.amount, 0);
  const discountNum = parseFloat(discount || "0") || 0;
  const totals = calculateBillTotals({
    drillingTotal: drilling.total,
    additionalTotal,
    discount: discountNum,
    taxRate: 0,
  });

  // When borewell type changes, drop charges that don't belong to the new type.
  React.useEffect(() => {
    setSelectedCharges((prev) => {
      const next: Record<number, number> = {};
      for (const [id, qty] of Object.entries(prev)) {
        if (availableCharges.some((c) => c.id === Number(id))) next[Number(id)] = qty;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  function toggleCharge(rate: ChargeRate) {
    setSelectedCharges((prev) => {
      const next = { ...prev };
      if (next[rate.id] !== undefined) {
        delete next[rate.id];
      } else {
        next[rate.id] = needsQuantity(rate.unit) ? 0 : 1;
      }
      return next;
    });
  }
  function setChargeQty(id: number, qty: number) {
    setSelectedCharges((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  async function onSubmit() {
    if (!customer) return toast.error("Select a customer first.");
    if (!typeId) return toast.error("Select a borewell type.");
    if (depthNum <= 0) return toast.error("Enter the drilling depth.");

    setSubmitting(true);
    const res = await createBill({
      customerId: customer.id,
      borewellTypeId: typeId,
      drillingDate,
      totalDepth: depthNum,
      waterLevel: waterLevel ? parseInt(waterLevel, 10) : null,
      remarks,
      discount: discountNum,
      taxRate: 0,
      charges: chargeLines.map((l) => ({ chargeRateId: l.rate.id, quantity: l.qty })),
    });
    setSubmitting(false);

    if (res.ok && res.data) {
      toast.success(`Bill ${res.data.billNumber} created`);
      router.push(`/bills/${res.data.id}`);
    } else {
      toast.error(res.ok ? "Failed to create bill" : res.error);
    }
  }

  return (
    <>
      <PageHeader title="Create Bill" description="Slab pricing is calculated automatically as you type." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: inputs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <p className="font-medium">{customer.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.mobile}
                      {customer.village ? ` · ${customer.village}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={custQuery}
                      onFocus={() => setCustOpen(true)}
                      onChange={(e) => {
                        setCustQuery(e.target.value);
                        setCustOpen(true);
                      }}
                      placeholder="Search customer by name or mobile…"
                      className="pl-9"
                    />
                  </div>
                  {custOpen && (
                    <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                      {custResults.length === 0 ? (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">No customers found.</p>
                      ) : (
                        custResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCustomer(c);
                              setCustOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                          >
                            <span className="font-medium">{c.customerName}</span>
                            <span className="text-muted-foreground">{c.mobile}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setNewCustOpen(true)}>
                    <UserPlus className="h-4 w-4" /> Create new customer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drilling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ruler className="h-4 w-4 text-primary" /> Drilling details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Borewell type (diameter)</Label>
                  <Select value={typeId ? String(typeId) : ""} onValueChange={(v) => setTypeId(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select diameter" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.borewellTypes.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.diameterName}"
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Drilling date</Label>
                  <Input type="date" value={drillingDate} onChange={(e) => setDrillingDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Total depth (ft)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    placeholder="e.g. 400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    <Waves className="h-3.5 w-3.5" /> Water level (ft)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={waterLevel}
                    onChange={(e) => setWaterLevel(e.target.value)}
                    placeholder="optional"
                  />
                </div>
              </div>

              {/* Live depth breakdown */}
              {depthNum > 0 && selectedType && (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold">Depth Breakdown</p>
                  {drilling.rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slab configured for this depth.</p>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-xs font-medium text-muted-foreground">
                        <span>Range</span>
                        <span className="text-right">Feet</span>
                        <span className="text-right">Rate</span>
                        <span className="w-24 text-right">Amount</span>
                      </div>
                      {drilling.rows.map((r) => (
                        <div key={r.label} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-sm">
                          <span>{r.label} ft</span>
                          <span className="text-right tabular-nums">{r.feet}</span>
                          <span className="text-right tabular-nums text-muted-foreground">{formatCurrency(r.ratePerFt)}</span>
                          <span className="w-24 text-right font-medium tabular-nums">{formatCurrency(r.amount)}</span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>Drilling total ({drilling.totalFeet} ft)</span>
                        <span className="tabular-nums">{formatCurrency(drilling.total)}</span>
                      </div>
                    </div>
                  )}
                  {drilling.exceedsSlabs && (
                    <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Depth exceeds the configured slabs by {drilling.uncoveredFeet} ft. Add a higher slab in Master Data
                      to price this range.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional charges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" /> Additional charges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableCharges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No additional charges configured for this borewell type.</p>
              ) : (
                <div className="space-y-2">
                  {availableCharges.map((c) => {
                    const selected = selectedCharges[c.id] !== undefined;
                    const qty = selectedCharges[c.id] ?? 0;
                    const amt = selected
                      ? calculateAdditionalCharge({ price: c.price, unit: c.unit, quantity: qty })
                      : 0;
                    return (
                      <div
                        key={c.id}
                        className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 transition-colors ${
                          selected ? "border-primary/40 bg-primary/5" : "border-border"
                        }`}
                      >
                        <button
                          onClick={() => toggleCharge(c)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(c.price)} {unitLabel(c.unit)}
                          </p>
                        </div>
                        {selected && needsQuantity(c.unit) && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={qty || ""}
                              onChange={(e) => setChargeQty(c.id, parseFloat(e.target.value) || 0)}
                              placeholder="Qty"
                              className="h-9 w-24"
                            />
                            <span className="text-xs text-muted-foreground">{unitLabel(c.unit).replace("per ", "")}</span>
                          </div>
                        )}
                        {selected && (
                          <span className="w-24 text-right text-sm font-semibold tabular-nums">{formatCurrency(amt)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any notes for this job…" />
            </CardContent>
          </Card>
        </div>

        {/* Right: sticky summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-primary" /> Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <Row label="Drilling" value={formatCurrency(drilling.total)} />
                  {chargeLines.map((l) => (
                    <Row
                      key={l.rate.id}
                      label={
                        <span className="text-muted-foreground">
                          {l.rate.name}
                          {needsQuantity(l.rate.unit) ? ` × ${l.qty}` : ""}
                        </span>
                      }
                      value={formatCurrency(l.amount)}
                    />
                  ))}
                  <Separator />
                  <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Discount (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="h-9 w-28 text-right"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
                  <span className="text-2xl font-bold tabular-nums">{formatCurrency(totals.grandTotal)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={onSubmit} disabled={submitting || !customer || depthNum <= 0}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  Generate Bill
                </Button>
                {!customer && <p className="text-center text-xs text-muted-foreground">Select a customer to continue.</p>}
              </CardContent>
            </Card>

            {selectedType && (
              <div className="flex flex-wrap gap-2 px-1">
                <Badge variant="secondary">{selectedType.diameterName}" borewell</Badge>
                {depthNum > 0 && <Badge variant="secondary">{depthNum} ft</Badge>}
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerFormDialog
        open={newCustOpen}
        onOpenChange={setNewCustOpen}
        onSaved={async (id) => {
          // Auto-select the newly created customer.
          const c = await getCustomerLiteAction(id);
          if (c) {
            setCustomer(c);
            setCustOpen(false);
          }
        }}
      />
    </>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
