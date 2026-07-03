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
import { Switch } from "@/components/ui/switch";
import { updateSettings } from "@/app/actions/settings";
import { Loader2, Save } from "lucide-react";

interface Settings {
  companyName: string;
  address: string;
  gstNumber: string;
  contactNumber: string;
  email: string;
  footerText: string;
  currency: string;
  gstEnabled: boolean;
  defaultTaxRate: number;
  billPrefix: string;
}

export function SettingsClient({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [loading, setLoading] = React.useState(false);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setLoading(true);
    const res = await updateSettings({ ...form, defaultTaxRate: Number(form.defaultTaxRate) });
    setLoading(false);
    if (res.ok) {
      toast.success("Settings saved");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Company profile, receipt and billing preferences.">
        <Button onClick={save} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Company name">
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="Address">
              <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact number">
                <Input value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
            </div>
            <Field label="Receipt footer text">
              <Input value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing & Tax</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bill number prefix">
                <Input value={form.billPrefix} onChange={(e) => set("billPrefix", e.target.value)} />
              </Field>
              <Field label="Currency">
                <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Enable GST</p>
                <p className="text-xs text-muted-foreground">Show tax on bills (architecture is GST-ready).</p>
              </div>
              <Switch checked={form.gstEnabled} onCheckedChange={(v) => set("gstEnabled", v)} />
            </div>
            <Field label="Default GST rate (%)">
              <Input
                type="number"
                value={form.defaultTaxRate}
                onChange={(e) => set("defaultTaxRate", Number(e.target.value))}
                disabled={!form.gstEnabled}
              />
            </Field>
            <Field label="GST number">
              <Input value={form.gstNumber} onChange={(e) => set("gstNumber", e.target.value)} disabled={!form.gstEnabled} />
            </Field>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
