"use client";
/* eslint-disable */
// @ts-nocheck
// Web Platform root — ported from platform/app.jsx.
// (ReactDOM.createRoot removed; mounted by app/page.tsx → WebClient instead.)
import React from "react";
import "@/lib/data";
import { StoreProvider, useStore } from "@/components/store";
import { Storefront } from "@/components/storefront";
import { AppShell } from "@/components/app-shell";
import { SiteShell } from "@/components/router";

const { useEffect: apE } = React;

// distinguishes the web build from the mobile build (used for back-to-home affordances)
if (typeof window !== "undefined") window.__SDH_WEB__ = true;

function Redirecting({ label }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center",
        justifyContent: "center",
        background: "var(--navy)",
        color: "#fff",
      }}
    >
      <div className="spin" style={{ width: 34, height: 34 }} />
      <div style={{ fontSize: 14, opacity: 0.8 }}>{label}</div>
    </div>
  );
}

function Root() {
  const { screen } = useStore();
  apE(() => {
    document.body.style.background =
      screen === "auth" ? "var(--navy)" : "var(--bg)";
  }, [screen]);
  // Admins are NOT force-redirected to /admin from here — they land in the normal app (as
  // Agent) and can switch to the Admin panel / Customer view from the account menu, or go
  // straight to /admin to sign in there. The dedicated admin entry lives at /admin.
  if (screen === "store") return <Storefront />;
  if (screen === "app") return <AppShell />;
  return <SiteShell />;
}

function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}

export { App, Root };
