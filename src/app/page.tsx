import { redirect } from "next/navigation";

// Root simply routes into the app; middleware handles auth redirects.
export default function Home() {
  redirect("/dashboard");
}
