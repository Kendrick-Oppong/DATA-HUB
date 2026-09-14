"use client";
/* eslint-disable */
// @ts-nocheck
// Public agent storefront — mounted at /<handle> for guests (no login required).
// Fetches the agent's store config by handle and renders the same <Storefront> the
// agent previews in their dashboard, via StoreProvider in publicMode.
import React from "react";
import "@/lib/data";
import { StoreProvider } from "@/components/store";
import { Storefront } from "@/components/storefront";
import { I } from "@/components/icons";

if (typeof window !== "undefined") window.__SDH_WEB__ = true;

const { useState, useEffect } = React;

function PublicStore({ handle }) {
  const [state, setState] = useState({ status: "loading", store: null });

  useEffect(() => {
    let alive = true;
    document.body.style.background = "var(--bg)";
    fetch("/api/store/" + encodeURIComponent(handle))
      .then(async (r) => {
        if (!alive) return;
        if (r.ok) {
          const d = await r.json().catch(() => ({}));
          setState({ status: d && d.store ? "ok" : "missing", store: d && d.store });
        } else {
          setState({ status: r.status === 404 ? "missing" : "error", store: null });
        }
      })
      .catch(() => alive && setState({ status: "error", store: null }));
    return () => { alive = false; };
  }, [handle]);

  if (state.status === "loading") return <StoreSplash spinner />;
  if (state.status === "ok" && state.store) {
    return (
      <StoreProvider publicMode initialStore={state.store} initialScreen="store">
        <Storefront />
      </StoreProvider>
    );
  }
  return <StoreNotFound handle={handle} error={state.status === "error"} />;
}

function StoreSplash({ spinner, children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      {spinner ? <div className="spin" style={{ width: 34, height: 34 }} /> : children}
    </div>
  );
}

function StoreNotFound({ handle, error }) {
  const [q, setQ] = useState("");
  const go = () => {
    const h = q.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    if (h) window.location.href = "/" + h;
  };
  return (
    <StoreSplash>
      <div style={{ textAlign: "center", maxWidth: 440, width: "100%" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <I.brief size={28} stroke="var(--muted)" />
        </div>
        <h1 style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: 26, marginBottom: 8 }}>
          {error ? "Couldn’t load this store" : "Store not found"}
        </h1>
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55 }}>
          {error
            ? "Something went wrong reaching this store. Please try again in a moment."
            : <>No store lives at <strong style={{ color: "var(--ink)" }}>/{handle}</strong>. Check the link, or find an agent’s store below.</>}
        </p>
        {!error && (
          <div className="card pad-lg" style={{ marginTop: 22, textAlign: "left" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Looking for an agent store?</div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Enter the agent’s store link to visit their storefront.</p>
            <div className="control" style={{ marginBottom: 10 }}>
              <span className="pre" style={{ fontSize: 13.5 }}>/</span>
              <input value={q} placeholder="e.g. kwesi-data" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
            </div>
            <button className="btn btn-pri btn-full" onClick={go} disabled={!q.trim()}>Visit store</button>
          </div>
        )}
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20, color: "var(--muted)", fontWeight: 600, fontSize: 13.5 }}>
          <I.arrow size={15} stroke="currentColor" style={{ transform: "rotate(180deg)" }} />Back to Smart Data Hub
        </a>
      </div>
    </StoreSplash>
  );
}

export default PublicStore;
export { PublicStore };
