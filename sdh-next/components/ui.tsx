"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { createPortal } from "react-dom";
import { SDH } from "@/lib/data";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";

/* Smart Data Hub — shared UI primitives */
const { useState: uS, useEffect: uE, useRef: uR } = React;

// Plumbing for a money / decimal text input.
//
// A price field controlled purely by a NUMBER can never accept a decimal: type "12." and it
// parses to 12, the parent re-renders with 12, and the "." is wiped before the digit after it
// can be typed. So hold the raw text while the field is being edited, and only fall back to
// the number once it loses focus. `inputMode="decimal"` also gets phones a keypad with a
// decimal point on it, which "numeric" does not.
//
// Spread the result onto an <input>:  <input {...useDecimalInput(price, setPrice)} />
function useDecimalInput(value, onChange, { decimals = 2, onBlur: after = null } = {}) {
  const [draft, setDraft] = uS(null);   // string while editing, null when idle
  const handle = (e) => {
    let t = String(e.target.value).replace(/[^\d.]/g, "");
    const dot = t.indexOf(".");
    if (dot !== -1) t = t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, "");   // at most one "."
    if (decimals >= 0 && dot !== -1) {
      const [whole, frac] = t.split(".");
      t = whole + "." + (frac || "").slice(0, decimals);
    }
    setDraft(t);
    const n = parseFloat(t);
    onChange(Number.isFinite(n) ? n : 0);   // "" and "." mean 0 to the parent, but stay on screen
  };
  const blur = () => { setDraft(null); if (after) after(); };
  return {
    value: draft ?? (value === null || value === undefined || value === "" ? "" : String(value)),
    onChange: handle,
    onBlur: blur,
    inputMode: "decimal",
  };
}

const NetBadge = ({ net, size = 34, style }) => {
  const n = window.SDH.NETWORKS[net];
  if (!n) return <span className="netbadge" style={{ width: size, height: size, fontSize: size * 0.32, background: "var(--line-2)", color: "var(--muted)", ...style }}>?</span>;
  return <span className={"netbadge " + n.css} style={{ width: size, height: size, fontSize: size * 0.32, ...style }}>{n.short}</span>;
};

const Brand = ({ light, onClick }) => (
  <a className="brand" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
    <img src={(window.__resources&&window.__resources.logoMark)||"assets/logo-mark.png"} alt="Smart Data Hub" />SMART<span>&nbsp;DATA&nbsp;HUB</span>
  </a>
);

const Stars = ({ n = 5 }) => (
  <span className="stars">{Array.from({ length: n }).map((_, i) => <I.star key={i} size={17} />)}</span>
);

const Pill = ({ status, children }) => <span className={"pill " + status}>{children || status}</span>;

// Custom dropdown — replaces the native <select>. A native select's OPEN POPUP is drawn by
// the OS (a floating panel on Android, a wheel picker on iOS), so CSS on <option> barely
// reaches it and its width/position can't be controlled — on a phone it can render wider
// than the control it belongs to. This renders the whole thing ourselves, so it looks and
// sizes the same on every device.
// `options`: array of strings, or [value, label] pairs when the stored value differs from
// the display text (e.g. an id vs. its name).
function Select({ label, icon, hint, error, value, onChange, options, placeholder }) {
  const norm = (options || []).map((o) => (Array.isArray(o) ? o : [o, o]));
  const [open, setOpen] = uS(false);
  const [pos, setPos] = uS(null); // where the portaled popup lands, computed from the trigger
  const wrapRef = uR(null);
  const triggerRef = uR(null);
  const popRef = uR(null);

  // The popup is portaled out of the .field (see below) so a scrollable ancestor — most
  // commonly a Modal's own `overflow:auto` body — can't clip it before its own scrollbar
  // ever gets a chance to show. Position is computed from the trigger's real screen
  // coordinates and kept in sync while open (scroll/resize can move the trigger).
  const place = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const host = document.querySelector(".ios-screen");
    if (host) {
      const hr = host.getBoundingClientRect();
      setPos({ fixed: false, top: r.bottom - hr.top + 6, left: r.left - hr.left, width: r.width });
    } else {
      setPos({ fixed: true, top: r.bottom + 6, left: r.left, width: r.width });
    }
  };

  uE(() => {
    if (!open) return;
    place();
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const current = norm.find(([v]) => v === value);

  const popup = open && pos && (
    <div ref={popRef} className="select-pop" role="listbox"
      style={{ position: pos.fixed ? "fixed" : "absolute", top: pos.top, left: pos.left, width: pos.width }}>
      {norm.map(([v, l]) => (
        <div key={v} role="option" aria-selected={v === value} className={"select-opt" + (v === value ? " on" : "")}
          onClick={() => { onChange(v); setOpen(false); }}>
          {l}
          {v === value && <I.check size={15} stroke="var(--blue)" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="field select-field" ref={wrapRef}>
      {label && <label>{label}</label>}
      <button ref={triggerRef} type="button" className="control select-ctrl" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {icon && <Ic name={icon} size={19} />}
        <span className="select-val">{current ? current[1] : (placeholder || "")}</span>
        <I.chevd size={16} className="select-caret" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {popup && typeof document !== "undefined" && createPortal(popup, document.querySelector(".ios-screen") || document.body)}
      {hint && <div className={"hint" + (error ? " err" : "")}>{hint}</div>}
    </div>
  );
}

// Friendly empty-state block for lists/tables with no data yet.
const Empty = ({ icon = "receipt", title = "Nothing here yet", sub, action }) => (
  <div className="empty" style={{ padding: "40px 20px" }}>
    <div className="ic"><Ic name={icon} size={28} /></div>
    <h3 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 17, marginTop: 10 }}>{title}</h3>
    {sub && <p style={{ marginTop: 6, maxWidth: "44ch", marginLeft: "auto", marginRight: "auto" }}>{sub}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

// animated count-up for money values (guarantees the final value via timeout fallback)
function CountUp({ value, prefix = "GH₵", dur = 900, decimals = 2 }) {
  const [v, setV] = uS(value);
  uE(() => {
    let raf, done = false;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick); else { done = true; setV(value); }
    };
    setV(0);
    raf = requestAnimationFrame(tick);
    const fb = setTimeout(() => { if (!done) setV(value); }, dur + 300);
    return () => { cancelAnimationFrame(raf); clearTimeout(fb); };
  }, [value]);
  return <span>{prefix}{v.toLocaleString("en-GH", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

const Field = ({ label, icon, pre, hint, error, reveal, children, ...rest }) => {
  const [reveal_show, reveal_setShow] = uS(false);
  const type = reveal ? (reveal_show ? "text" : "password") : rest.type;
  const EyeIcon = I[reveal_show ? "eyeoff" : "eye"];
  return (
  <div className="field">
    {label && <label>{label}</label>}
    <div className="control">
      {icon && <Ic name={icon} size={19} />}
      {pre && <span className="pre">{pre}</span>}
      {children || <input {...rest} type={type} />}
      {reveal && <button type="button" className="reveal-btn" aria-label={reveal_show ? "Hide password" : "Show password"} onClick={() => reveal_setShow(s => !s)}><EyeIcon size={18} stroke="currentColor" /></button>}
    </div>
    {hint && <div className={"hint" + (error ? " err" : "")}>{hint}</div>}
  </div>
  );
};

function Modal({ title, onClose, children, foot, wide }) {
  uE(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const node = (
    <div className="modal-scrim" onClick={(e) => { if (e.target.classList.contains("modal-scrim")) onClose(); }}>
      <div className={"modal" + (wide ? " modal-wide" : "")} role="dialog" aria-modal="true">
        <div className="mhead">
          <h3>{title}</h3>
          <button className="mclose" onClick={onClose} aria-label="Close"><I.x size={18} stroke="#fff" /></button>
        </div>
        <div className="mbody">{children}</div>
        {foot}
      </div>
    </div>
  );

  // Render at the top of the current "screen" (the phone mockup on /mobile, the document
  // body everywhere else) instead of wherever the trigger happens to live in the tree.
  // The topbar has `backdrop-filter` + `position:sticky`, which — per spec — makes it a
  // containing block for `position:fixed` descendants. A modal opened from the bell/menu in
  // the topbar was being boxed into that 70px-tall bar instead of covering the screen.
  if (typeof document === "undefined") return node;
  const host = document.querySelector(".ios-screen") || document.body;
  return createPortal(node, host);
}

const Toasts = () => {
  const { toasts } = useStore();
  return toasts.map((t, i) => (
    <div className="toast" key={t.id} style={{ bottom: 26 + i * 56 }}>
      <span className="ic"><Ic name={t.icon} size={18} /></span>{t.msg}
    </div>
  ));
};

// decorative arc set used across brand surfaces
const Arc = ({ style, stroke = "#fff", opacity = 0.13 }) => (
  <svg className="arc-decor" viewBox="0 0 200 120" style={style} fill="none" stroke={stroke} strokeWidth="7" strokeLinecap="round" opacity={opacity}>
    <path d="M20 110 A80 80 0 0 1 180 110" /><path d="M48 110 A52 52 0 0 1 152 110" /><path d="M76 110 A24 24 0 0 1 124 110" />
  </svg>
);

const Kente = ({ style }) => <div className="kente" style={style} />;

// Branded loading state shown briefly while a page "loads" — matches the launch splash.
const PageLoader = () => (
  <div className="pg-loader" aria-busy="true" aria-label="Loading">
    <div className="pg-loader-logo">
      <span className="ring"></span>
      <span className="ring"></span>
      <img src={(window.__resources&&window.__resources.logoMark)||"assets/logo-mark.png"} alt="" />
    </div>
  </div>
);

// Inline loader for a data section (a table, list or card) while its fetch is in flight.
// Theme-aware; uses the shared `.spin` spinner.
const DataLoader = ({ label = "Loading…", pad = 48 }) => (
  <div role="status" aria-busy="true" aria-live="polite"
    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: `${pad}px 10px`, color: "var(--muted)" }}>
    <div className="spin" style={{ width: 30, height: 30 }} />
    {label && <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>}
  </div>
);

export { Arc, Brand, CountUp, DataLoader, Empty, Field, Kente, Modal, NetBadge, PageLoader, Pill, Select, Stars, Toasts, useDecimalInput };
