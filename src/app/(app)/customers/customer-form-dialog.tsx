"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2 } from "lucide-react";
import { customerSchema } from "@/lib/validators";
import { createCustomer, updateCustomer } from "@/app/actions/customers";

type FormValues = z.infer<typeof customerSchema>;

export interface CustomerRecord {
  id: number;
  customerName: string;
  mobile: string;
  address?: string | null;
  village?: string | null;
  taluk?: string | null;
  district?: string | null;
  state?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer?: CustomerRecord | null;
  onSaved?: (id: number) => void;
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSaved }: Props) {
  const editing = !!customer;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(customerSchema) });

  React.useEffect(() => {
    if (open) {
      reset({
        customerName: customer?.customerName ?? "",
        mobile: customer?.mobile ?? "",
        address: customer?.address ?? "",
        village: customer?.village ?? "",
        taluk: customer?.taluk ?? "",
        district: customer?.district ?? "",
        state: customer?.state ?? "",
      });
    }
  }, [open, customer, reset]);

  async function onSubmit(values: FormValues) {
    const res = editing ? await updateCustomer(customer!.id, values) : await createCustomer(values);
    if (res.ok) {
      toast.success(editing ? "Customer updated" : "Customer created");
      onOpenChange(false);
      onSaved?.(editing ? customer!.id : res.data!.id);
    } else {
      toast.error(res.error);
    }
  }

  const field = "space-y-1.5";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle>
          <DialogDescription>Customer contact and location details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={field}>
              <Label>Name *</Label>
              <Input {...register("customerName")} placeholder="Ramesh Kumar" />
              {errors.customerName && <p className="text-xs text-red-400">{errors.customerName.message}</p>}
            </div>
            <div className={field}>
              <Label>Mobile *</Label>
              <Input {...register("mobile")} placeholder="98800 00000" />
              {errors.mobile && <p className="text-xs text-red-400">{errors.mobile.message}</p>}
            </div>
          </div>
          <div className={field}>
            <Label>Address</Label>
            <Input {...register("address")} placeholder="House / street" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={field}>
              <Label>Village</Label>
              <Input {...register("village")} />
            </div>
            <div className={field}>
              <Label>Taluk</Label>
              <Input {...register("taluk")} />
            </div>
            <div className={field}>
              <Label>District</Label>
              <Input {...register("district")} />
            </div>
            <div className={field}>
              <Label>State</Label>
              <Input {...register("state")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
