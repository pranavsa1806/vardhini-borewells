import { PageSkeleton } from "@/components/shared/loading-skeletons";

// Instant feedback while any app page's server data loads.
export default function Loading() {
  return <PageSkeleton />;
}
