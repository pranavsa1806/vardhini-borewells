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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { createBorewellType, updateBorewellType, deleteBorewellType } from "@/app/actions/master";
import { Ruler, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Row {
  id: number;
  diameterName: string;
  isActive: boolean;
  slabs: number;
  jobs: number;
}

export function BorewellTypesClient({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Row | null>(null);

  return (
    <>
      <PageHeader title="Borewell Types" description="Available drilling diameters. Add future sizes without code changes.">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Type
        </Button>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Diameter</TableHead>
              <TableHead>Slabs</TableHead>
              <TableHead>Bills</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.diameterName}"</TableCell>
                <TableCell>{t.slabs}</TableCell>
                <TableCell>{t.jobs}</TableCell>
                <TableCell>
                  {t.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400"
                      disabled={t.jobs > 0}
                      title={t.jobs > 0 ? "Used by bills — disable instead" : "Delete"}
                      onClick={() => setDeleting(t)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <TypeDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        type={editing}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete borewell type?"
        description={deleting ? `Remove ${deleting.diameterName}" and its slabs/charges? This cannot be undone.` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteBorewellType(deleting.id);
          if (res.ok) {
            toast.success("Type deleted");
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

function TypeDialog({
  open,
  onOpenChange,
  type,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: Row | null;
  onSaved: () => void;
}) {
  const editing = !!type;
  const [name, setName] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(type?.diameterName ?? "");
      setActive(type?.isActive ?? true);
    }
  }, [open, type]);

  async function submit() {
    setLoading(true);
    const payload = { diameterName: name.trim(), isActive: active };
    const res = editing ? await updateBorewellType(type!.id, payload) : await createBorewellType(payload);
    setLoading(false);
    if (res.ok) {
      toast.success(editing ? "Type updated" : "Type added");
      onSaved();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit borewell type" : "Add borewell type"}</DialogTitle>
          <DialogDescription>Enter the diameter (e.g. 4.75, 6.5, 10).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Diameter name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="10" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
