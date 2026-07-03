import { LoginForm } from "./login-form";
import { Droplets } from "lucide-react";

export const metadata = { title: "Sign in — Vardhini Borewells" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-12 lg:flex">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Droplets className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">Vardhini Borewells</p>
            <p className="text-sm text-white/70">Billing & Management</p>
          </div>
        </div>
        <div className="space-y-4 text-white">
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            Automated drilling bills, done in seconds.
          </h1>
          <p className="max-w-md text-white/80">
            Slab-wise drilling calculation, additional charges, payments and reports — all in one modern dashboard.
          </p>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} Vardhini Borewells</p>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Droplets className="h-5 w-5" />
            </div>
            <span className="font-semibold">Vardhini Borewells</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to manage your borewell bills.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
