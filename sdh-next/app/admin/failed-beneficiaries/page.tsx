import AdminClient from "@/components/AdminClient";

// Deep link to the Failed Beneficiary Tracker: /admin/failed-beneficiaries
//
// The admin panel is a single client app that switches pages internally, so this route mounts
// the same shell and tells it which page to open. That keeps the URL shareable/bookmarkable
// without duplicating the panel.
export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminClient page="failed-beneficiaries" />;
}
