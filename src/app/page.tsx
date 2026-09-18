import { redirect } from "next/navigation";

// Temporary root route for Phase 1 (foundation layer only). A later phase
// introduces the real `(app)` route group with the authenticated shell and
// the `/dashboard` screen itself; until then, landing on "/" simply hands
// off to it.
export default function RootPage() {
  redirect("/dashboard");
}
