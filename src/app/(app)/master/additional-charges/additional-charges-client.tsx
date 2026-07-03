"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { upsertChargeRate, deleteChargeRate, createChargeType } from "@/app/actions/master";
import { unitLabel, type ChargeUnit } from "@/lib/calc";
import { formatCurrency } from "@/lib/utils";
import { Database, Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";

interface Row {
  id: number;
  chargeName: string;
  additionalChargeTypeId: number;
  borewellTypeId: number;
  diameter: string;
  unit: ChargeUnit;
  price: number;
  isActive: boolean;
}
interface Opt {
  id: number;
  name?: string;
  diameterName?: string;
}

const UNITS: ChargeUnit[] = ["PER_FT", "PER_DAY", "PER_HOLE", "FIXED"];

export function AdditionalChargesClient({
  rows,
  chargeTypes,
  borewellTypes,
}: {
  rows: Row[];
  chargeTypes: Opt[];
  borewellTypes: Opt[];
}) {
  const router = useRouter();
  const [filter, setFilter] = React.useState("ALL");
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Row | null>(null);
  const [newTypeOpen, setNewTypeOpen] = React.useState(false);

  const filtered = filter === "ALL" ? rows : rows.filter((r) => String(r.borewellTypeId) === filter);

  return (
    <>
      <PageHeader title="Additional Charges" description="PVC, transport, cleaning and more — priced per borewell type.">
        <Button variant="outline" onClick={() => setNewTypeOpen(true)}>
          <Tag className="h-4 w-4" /> New Charge Type
        </Button>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Charge
        </Button>
      </PageHeader>

      <div className="flex items-center gap-2">
        <Label className="text-sm">Filter</Label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All borewell types</SelectItem>
            {borewellTypes.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.diameterName}"
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Charge</TableHead>
              <TableHead>Borewell</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No charges configured.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.chargeName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.diameter}"</Badge>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{unitLabel(r.unit)}</TableCell>
                  <TableCell className="font-medium tabular-nums">{formatCurrency(r.price)}</TableCell>
                  <TableCell>
                    {r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setDeleting(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ChargeDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        charge={editing}
        chargeTypes={chargeTypes}
        borewellTypes={borewellTypes}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />

      <NewChargeTypeDialog open={newTypeOpen} onOpenChange={setNewTypeOpen} onSaved={() => router.refresh()} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete charge?"
        description={deleting ? `Remove ${deleting.chargeName} for ${deleting.diameter}"?` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteChargeRate(deleting.id);
          if (res.ok) {
            toast.success("Charge deleted");
            setDeleting(null);
            router.refresh();
          } else {
            toast.error(res.error);
          }
        }}
      />
    </>
  );
}

function ChargeDialog({
  open,
  onOpenChange,
  charge,
  chargeTypes,
  borewellTypes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  charge: Row | null;
  chargeTypes: Opt[];
  borewellTypes: Opt[];
  onSaved: () => void;
}) {
  const editing = !!charge;
  const [chargeTypeId, setChargeTypeId] = React.useState("");
  const [borewellTypeId, setBorewellTypeId] = React.useState("");
  const [unit, setUnit] = React.useState<ChargeUnit>("PER_FT");
  const [price, setPrice] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setChargeTypeId(String(charge?.additionalChargeTypeId ?? chargeTypes[0]?.id ?? ""));
      setBorewellTypeId(String(charge?.borewellTypeId ?? borewellTypes[0]?.id ?? ""));
      setUnit(charge?.unit ?? "PER_FT");
      setPrice(charge ? String(charge.price) : "");
      setActive(charge?.isActive ?? true);
      setReason("");
    }
  }, [open, charge, chargeTypes, borewellTypes]);

  async function submit() {
    setLoading(true);
    const res = await upsertChargeRate(charge?.id ?? null, {
      additionalChargeTypeId: Number(chargeTypeId),
      borewellTypeId: Number(borewellTypeId),
      unit,
      price: Number(price),
      isActive: active,
      reason,
    });
    setLoading(false);
    if (res.ok) {
      toast.success(editing ? "Charge updated" : "Charge added");
      onSaved();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit charge" : "Add charge"}</DialogTitle>
          <DialogDescription>Assign a price for a charge on a specific borewell type.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Charge</Label>
              <Select value={chargeTypeId} onValueChange={setChargeTypeId} disabled={editing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {chargeTypes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Borewell type</Label>
              <Select value={borewellTypeId} onValueChange={setBorewellTypeId} disabled={editing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {borewellTypes.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.diameterName}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as ChargeUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u} className="capitalize">
                      {unitLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          {editing && (
            <div className="space-y-1.5">
              <Label>Reason for change (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Supplier price change" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || !price}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewChargeTypeDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setDesc("");
    }
  }, [open]);

  async function submit() {
    setLoading(true);
    const res = await createChargeType({ name: name.trim(), description: desc });
    setLoading(false);
    if (res.ok) {
      toast.success("Charge type created");
      onOpenChange(false);
      onSaved();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New charge type</DialogTitle>
          <DialogDescription>e.g. 12" PVC, Casing, Rock Bit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
