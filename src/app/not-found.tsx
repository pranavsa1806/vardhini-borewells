import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Droplets, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Droplets className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <p className="text-6xl font-bold tracking-tight">404</p>
        <p className="text-lg font-medium">Page not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">
          <Home className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
