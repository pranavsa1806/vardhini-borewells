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
import { createSlab, updateSlab, deleteSlab } from "@/app/actions/master";
import { exportToCsv } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";
import { Layers, Plus, Pencil, Trash2, Download, Loader2 } from "lucide-react";

interface Slab {
  id: number;
  borewellTypeId: number;
  diameter: string;
  startDepth: number;
  endDepth: number;
  pricePerFt: number;
}
interface TypeOpt {
  id: number;
  diameterName: string;
}

export function DrillingRatesClient({ rows, types }: { rows: Slab[]; types: TypeOpt[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<string>("ALL");
  const [editing, setEditing] = React.useState<Slab | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Slab | null>(null);

  const filtered = filter === "ALL" ? rows : rows.filter((r) => String(r.borewellTypeId) === filter);

  return (
    <>
      <PageHeader title="Drilling Rate Slabs" description="Depth-based drilling prices. Changes apply to all future bills instantly.">
        <Button variant="outline" onClick={() => exportToCsv("drilling-rates.csv", filtered as unknown as Record<string, unknown>[])}>
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Slab
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
            {types.map((t) => (
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
              <TableHead>Borewell</TableHead>
              <TableHead>From Depth</TableHead>
              <TableHead>To Depth</TableHead>
              <TableHead>Rate / ft</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No slabs. Add one to start.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Badge variant="secondary">{s.diameter}"</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{s.startDepth} ft</TableCell>
                  <TableCell className="tabular-nums">{s.endDepth} ft</TableCell>
                  <TableCell className="font-medium tabular-nums">{formatCurrency(s.pricePerFt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400" onClick={() => setDeleting(s)}>
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

      <SlabDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        slab={editing}
        types={types}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete slab?"
        description={
          deleting
            ? `Remove ${deleting.diameter}" ${deleting.startDepth}-${deleting.endDepth} ft slab? This is recorded in the audit trail.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteSlab(deleting.id);
          if (res.ok) {
            toast.success("Slab deleted");
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

function SlabDialog({
  open,
  onOpenChange,
  slab,
  types,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  slab: Slab | null;
  types: TypeOpt[];
  onSaved: () => void;
}) {
  const editing = !!slab;
  const [typeId, setTypeId] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTypeId(String(slab?.borewellTypeId ?? types[0]?.id ?? ""));
      setStart(slab ? String(slab.startDepth) : "");
      setEnd(slab ? String(slab.endDepth) : "");
      setPrice(slab ? String(slab.pricePerFt) : "");
      setReason("");
    }
  }, [open, slab, types]);

  async function submit() {
    setLoading(true);
    const payload = {
      borewellTypeId: Number(typeId),
      startDepth: Number(start),
      endDepth: Number(end),
      pricePerFt: Number(price),
      reason,
    };
    const res = editing ? await updateSlab(slab!.id, payload) : await createSlab(payload);
    setLoading(false);
    if (res.ok) {
      toast.success(editing ? "Slab updated" : "Slab added");
      onSaved();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit slab" : "Add slab"}</DialogTitle>
          <DialogDescription>Depth range and per-foot rate for a borewell type.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Borewell type</Label>
            <Select value={typeId} onValueChange={setTypeId} disabled={editing}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.diameterName}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start depth (ft)</Label>
              <Input type="number" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End depth (ft)</Label>
              <Input type="number" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Rate per ft (₹)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Reason for change (optional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fuel price increase" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Add slab"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
