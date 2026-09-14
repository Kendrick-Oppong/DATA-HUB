"use client";
/* eslint-disable */
// @ts-nocheck
// Dedicated /admin entry point. Shows the admin panel to admins, a sign-in screen to
// guests, and an "admins only" notice to signed-in non-admins. Admin status comes from
// the account (role === "admin"); grant it via ADMIN_EMAILS or the admin Users page.
import React from "react";
import "@/lib/data";
import { StoreProvider, useStore } from "@/components/store";
import { AppShell, NAV } from "@/components/app-shell";

if (typeof window !== "undefined") window.__SDH_WEB__ = true;

function AdminGate({ page }) {
  const { role, appPage, setAppPage } = useStore();

  // Deep link (/admin/<page>) wins over the restored page, once we know they're an admin.
  React.useEffect(() => {
    if (page) setAppPage(page);
  }, [page]);

  // Keep an admin on a valid admin page (a saved appPage may be a reseller-only page).
  React.useEffect(() => {
    if (role === "admin") {
      const pages = NAV.admin.flatMap((g) => g.items.map((i) => i[0]));
      if (!pages.includes(appPage)) setAppPage("dashboard");
    }
  }, [role]);

  React.useEffect(() => {
    document.body.style.background = "var(--bg)";
  }, []);

  return <AppShell />;
}

function AdminApp({ page }) {
  return (
    <StoreProvider adminView>
      <AdminGate page={page} />
    </StoreProvider>
  );
}

export default AdminApp;
export { AdminApp };
