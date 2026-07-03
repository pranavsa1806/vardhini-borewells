"use client";
import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changeOwnPassword } from "@/app/actions/users";
import { Loader2, KeyRound } from "lucide-react";

export function ChangePasswordForm() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return toast.error("New passwords don't match.");
    setLoading(true);
    const res = await changeOwnPassword({
      currentPassword: current,
      newPassword: next,
      confirmPassword: confirm,
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Password changed successfully");
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="Re-enter new password"
          />
        </div>
      </div>
      <Button type="submit" disabled={loading || !current || !next || !confirm}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Update password
      </Button>
    </form>
  );
}
