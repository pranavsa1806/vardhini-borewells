"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomerFormDialog, type CustomerRecord } from "../customer-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteCustomer } from "@/app/actions/customers";
import { Pencil, Trash2 } from "lucide-react";

export function CustomerActions({ customer, hasJobs }: { customer: CustomerRecord; hasJobs: boolean }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [delOpen, setDelOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function onDelete() {
    setLoading(true);
    const res = await deleteCustomer(customer.id);
    setLoading(false);
    if (res.ok) {
      toast.success("Customer deleted");
      router.push("/customers");
    } else {
      toast.error(res.error);
      setDelOpen(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit
      </Button>
      <Button variant="outline" className="text-red-400" onClick={() => setDelOpen(true)} disabled={hasJobs}>
        <Trash2 className="h-4 w-4" /> Delete
      </Button>

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} onSaved={() => router.refresh()} />
      <ConfirmDialog
        open={delOpen}
        onOpenChange={setDelOpen}
        title="Delete customer?"
        description="This permanently removes the customer. This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={loading}
        onConfirm={onDelete}
      />
    </>
  );
}
