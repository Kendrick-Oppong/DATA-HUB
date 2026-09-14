import AdminClient from "@/components/AdminClient";

// Dedicated admin entry at /admin — sign in with an admin account to reach the panel.
export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminClient />;
}
