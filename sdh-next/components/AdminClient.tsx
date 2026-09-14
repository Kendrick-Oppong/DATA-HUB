"use client";
import dynamic from "next/dynamic";

// The app is client-only (window/localStorage at module + render time), so mount with
// ssr:false — mirrors WebClient.
const AdminApp = dynamic(() => import("@/components/admin-app").then((m) => m.AdminApp), { ssr: false });

// `page` deep-links to one admin page (e.g. /admin/failed-beneficiaries). Omitted on /admin,
// which restores whatever page the admin was last on.
export default function AdminClient({ page }: { page?: string }) {
  return <AdminApp page={page} />;
}
