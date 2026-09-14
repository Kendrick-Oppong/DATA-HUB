"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { Field, Modal, Pill } from "@/components/ui";

/* Smart Data Hub — Failed MTN beneficiary tracker.
   MTN refuses some data orders because the recipient isn't on the beneficiary list. Those
   numbers have to be added upstream by hand, so they're collected here:
     • automatically, whenever a purchase fails with that error (server-side capture)
     • manually, when an agent reports one or an admin adds one
   AdminFailedBeneficiaries — the full tracker (admin only).
   AgentFailedBeneficiary   — the agent's "send to admin" form. */
const { useState: fbU, useEffect: fbE, useCallback: fbC } = React;

// Local-format check mirroring strictLocalGhPhone() on the server: 0 + 9 digits.
const phoneOk = (v) => /^0\d{9}$/.test(String(v || "").replace(/\D/g, ""));
const phoneInput = (v) => String(v || "").replace(/\D/g, "").slice(0, 12);

/* ================= ADMIN — the tracker ================= */
function AdminFailedBeneficiaries() {
  const { S, toast } = useStore();
  const [items, setItems] = fbU([]);
  const [counts, setCounts] = fbU({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = fbU(true);
  const [addOpen, setAddOpen] = fbU(false);

  // Filters — status, free text, and a date range. Sent to the server so filtering happens.
  // NOTE: the stored status value stays "resolved" (it's already in the DB and in the API
  // contract); only the label an admin reads says "Verified", so no migration is needed.
  // against the whole table, not just what's already been fetched.
  const [status, setStatus] = fbU("pending");
  const [q, setQ] = fbU("");
  const [from, setFrom] = fbU("");
  const [to, setTo] = fbU("");

  const load = fbC(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (status) p.set("status", status);
      if (q.trim()) p.set("q", q.trim());
      // A date input gives a local calendar day; widen `to` to the end of that day so a
      // same-day from/to pair returns that day's reports rather than nothing.
      if (from) p.set("from", String(new Date(from + "T00:00:00").getTime()));
      if (to) p.set("to", String(new Date(to + "T23:59:59.999").getTime()));
      const r = await fetch("/api/failed-beneficiaries?" + p.toString(), { credentials: "include" });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setItems(d.items || []); setCounts(d.counts || { total: 0, pending: 0, resolved: 0 }); }
      else toast(d.error || "Could not load the tracker", "info");
    } catch (e) { toast("Could not load the tracker", "info"); }
    setLoading(false);
  }, [status, q, from, to]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  fbE(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  // "Copy All Numbers" — every number currently in the table, comma-separated, ready to
  // paste into MTN's beneficiary tool. Deduped: the same number reported three times only
  // needs adding once.
  const copyAll = async () => {
    const numbers = [...new Set(items.map((i) => i.phoneNumber))];
    if (!numbers.length) { toast("No numbers to copy", "info"); return; }
    const text = numbers.join(", ");
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // Clipboard API needs a secure context and can be blocked — fall back to a temporary
      // textarea + execCommand so the button still works on http:// and older browsers.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (e2) { toast("Could not copy — select and copy manually", "info"); return; }
    }
    toast(`${numbers.length} number${numbers.length === 1 ? "" : "s"} copied`, "copy");
  };

  const setRowStatus = async (id, next) => {
    try {
      const r = await fetch("/api/failed-beneficiaries/" + encodeURIComponent(id), {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast(d.error || "Could not update", "info"); return; }
      toast(next === "resolved" ? "Marked as verified" : "Reopened", next === "resolved" ? "checkc" : "refresh");
      load();
    } catch (e) { toast("Could not update", "info"); }
  };

  const remove = async (id, phone) => {
    try {
      const r = await fetch("/api/failed-beneficiaries/" + encodeURIComponent(id), {
        method: "DELETE", credentials: "include",
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast(d.error || "Could not delete", "info"); return; }
      toast(`${phone} removed`, "x");
      load();
    } catch (e) { toast("Could not delete", "info"); }
  };

  const stats = [
    ["Pending", counts.pending, "clock", "#B9791C", "#FFF4E0"],
    ["Verified", counts.resolved, "checkc", "var(--ok)", "var(--ok-bg)"],
    ["Showing", counts.total, "list", "var(--blue)", "var(--blue-050)"],
  ];

  return (
    <React.Fragment>
      <div className="card pad-lg" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
        <span style={{ width: 44, height: 44, borderRadius: 13, background: "#FFF4E0", color: "#B9791C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.flag size={22} /></span>
        <div>
          <strong style={{ fontSize: 15.5 }}>Numbers MTN refused as beneficiaries</strong>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>Collected automatically whenever an order fails with a beneficiary error, plus anything agents report. Add them upstream, then mark each one verified.</div>
        </div>
      </div>

      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {stats.map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div><div className="v">{v}</div></div>
        ))}
      </div>

      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <h3>Failed beneficiaries</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-out" style={{ padding: "9px 14px", fontSize: 13.5 }} onClick={copyAll}><I.copy size={15} />Copy all numbers</button>
            <button className="btn btn-pri" style={{ padding: "9px 14px", fontSize: 13.5 }} onClick={() => setAddOpen(true)}><I.plus size={15} stroke="#fff" />Add manually</button>
          </div>
        </div>

        {/* Filters: status, free-text search, and a date range. */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 14 }}>
          <div className="seg" style={{ margin: 0, width: "auto" }}>
            {[["pending", "Pending"], ["resolved", "Verified"], ["all", "All"]].map(([v, l]) => (
              <button key={v} className={status === v ? "on" : ""} style={{ padding: "8px 14px" }} onClick={() => setStatus(v)}>{l}</button>
            ))}
          </div>
          <div className="field" style={{ margin: 0, minWidth: 200, flex: 1 }}>
            <div className="control"><span style={{ color: "var(--faint)" }}><I.search size={17} /></span>
              <input placeholder="Search number or note" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ margin: 0 }}><label>From</label><div className="control"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div></div>
          <div className="field" style={{ margin: 0 }}><label>To</label><div className="control"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div></div>
          {(q || from || to) && <button className="btn btn-out" style={{ padding: "9px 13px", fontSize: 13 }} onClick={() => { setQ(""); setFrom(""); setTo(""); }}>Clear</button>}
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Date &amp; time</th><th>Phone number</th><th>Note</th><th>Added by</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="muted" style={{ whiteSpace: "nowrap", fontSize: 13 }}>{S.dateTime ? S.dateTime(r.createdAt) : new Date(r.createdAt).toLocaleString()}</td>
                  <td>
                    <span className="mono" style={{ fontWeight: 600 }}>{r.phoneNumber}</span>
                    {/* A number reported more than once is still broken — make that obvious. */}
                    {r.repeat > 1 && <span className="pill" style={{ marginLeft: 8, fontSize: 10.5, background: "#FFF4E0", color: "#B9791C" }}>×{r.repeat}</span>}
                  </td>
                  <td className="muted" style={{ fontSize: 13, maxWidth: 260 }}>{r.note || <span className="muted">—</span>}</td>
                  <td className="muted" style={{ fontSize: 13 }}>
                    {r.addedByName}
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", opacity: .75 }}>{r.addedByRole}</div>
                  </td>
                  <td><Pill status={r.status === "resolved" ? "active" : "pending"}>{r.status === "resolved" ? "Verified" : "Pending"}</Pill></td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      {r.status === "pending"
                        ? <button className="btn btn-pri" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setRowStatus(r.id, "resolved")}><I.check size={14} stroke="#fff" />Verify</button>
                        : <button className="btn btn-out" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setRowStatus(r.id, "pending")}>Reopen</button>}
                      <button className="btn btn-out" style={{ padding: "7px 11px", fontSize: 12.5, color: "var(--telecel)" }} onClick={() => remove(r.id, r.phoneNumber)} title="Delete this report"><I.x size={14} stroke="currentColor" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <div className="empty"><div className="ic"><I.flag size={28} /></div><p>{status === "pending" ? "No pending beneficiary failures — nothing to add upstream." : status === "resolved" ? "Nothing verified yet." : "Nothing here."}</p></div>
          )}
          {loading && <div className="empty"><div className="spin" style={{ width: 26, height: 26 }} /></div>}
        </div>
      </div>

      {addOpen && <AddManuallyModal onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); load(); }} />}
    </React.Fragment>
  );
}

/* Manual add — used by an admin who was told about a number out of band. */
function AddManuallyModal({ onClose, onDone }) {
  const { toast } = useStore();
  const [phone, setPhone] = fbU("");
  const [note, setNote] = fbU("");
  const [busy, setBusy] = fbU(false);

  const valid = phoneOk(phone) && !busy;
  const submit = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/failed-beneficiaries", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, note }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast(d.error || "Could not add the number", "info"); setBusy(false); return; }
      toast("Number added", "check");
      onDone();
    } catch (e) { toast("Could not add the number", "info"); setBusy(false); }
  };

  return (
    <Modal title="Add a number manually" onClose={onClose}>
      <Field label="Phone number *" icon="phone" inputMode="numeric" placeholder="e.g. 0509379146" value={phone} onChange={(e) => setPhone(phoneInput(e.target.value))} hint={phone && !phoneOk(phone) ? "10 digits starting with 0" : null} error={!!phone && !phoneOk(phone)} />
      <Field label="Note" icon="doc" placeholder="Anything worth remembering" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn btn-pri btn-full" disabled={!valid} style={{ opacity: valid ? 1 : .5, marginTop: 6 }} onClick={submit}>
        <I.plus size={17} stroke="#fff" />{busy ? "Adding…" : "Add to tracker"}
      </button>
    </Modal>
  );
}

/* ================= AGENT — report a number ================= */
// Sits on the agent's dashboard. An agent who hits the beneficiary error sends the number
// straight to the admin tracker; they can't read the tracker itself (it holds other agents'
// customers), so this is send-only by design.
function AgentFailedBeneficiary({ compact = false }) {
  const { toast } = useStore();
  const [raw, setRaw] = fbU("");
  const [busy, setBusy] = fbU(false);
  const [sent, setSent] = fbU([]);   // this session's submissions, for immediate feedback

  // One box for one number or fifty. Agents collect these over a shift and paste them in
  // from WhatsApp or a note, where they arrive separated by commas, spaces or newlines —
  // so every separator is accepted rather than demanding a particular format.
  const entries = raw.split(/[^0-9+]+/).map((v) => v.trim()).filter(Boolean);
  const good = [...new Set(entries.filter(phoneOk).map((v) => v.replace(/\D/g, "")))];
  const bad = entries.filter((v) => !phoneOk(v));
  const valid = good.length > 0 && !busy;

  const send = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const r = await fetch("/api/failed-beneficiaries", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumbers: good }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast(d.error || "Could not send the numbers", "info"); setBusy(false); return; }
      const n = d.added || good.length;
      toast(n === 1 ? "Number sent to Admin" : `${n} numbers sent to Admin`, "check");
      setSent((s) => [...good.map((phone) => ({ phone, at: Date.now() })), ...s].slice(0, 20));
      setRaw("");
    } catch (e) { toast("Could not send the numbers", "info"); }
    setBusy(false);
  };

  return (
    <div className="card pad-lg" style={compact ? {} : { marginTop: 18 }}>
      <div className="card-h">
        <div>
          <h3>Beneficiary problem?</h3>
          <div className="muted" style={{ fontSize: 13 }}>If an order failed with “can’t add beneficiary”, send us the number and we’ll add it upstream.</div>
        </div>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: "#FFF4E0", color: "#B9791C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.flag size={20} /></span>
      </div>

      <div className="field">
        <label>Phone number(s) *</label>
        <div className="control control-area">
          <textarea
            rows={3}
            placeholder={"0509379146\n0240021899\n0205064022"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </div>
        <div className="hint" style={{ marginTop: 6 }}>
          One number or many — paste them separated by commas, spaces or new lines.
        </div>
      </div>

      {/* Counts update as they type, so a mistyped number is caught before sending rather
          than silently dropped by the server. */}
      {(good.length > 0 || bad.length > 0) && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, fontWeight: 600, margin: "-4px 0 12px" }}>
          {good.length > 0 && <span style={{ color: "var(--ok)" }}>{good.length} valid number{good.length === 1 ? "" : "s"}</span>}
          {bad.length > 0 && <span style={{ color: "var(--telecel)" }}>{bad.length} won't send: {bad.slice(0, 3).join(", ")}{bad.length > 3 ? "…" : ""} — need 10 digits starting with 0</span>}
        </div>
      )}

      <button className="btn btn-pri btn-full" disabled={!valid} style={{ opacity: valid ? 1 : .5 }} onClick={send}>
        <I.send size={17} stroke="#fff" />{busy ? "Sending…" : good.length > 1 ? `Send ${good.length} numbers to Admin` : "Send to Admin"}
      </button>

      {sent.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Sent just now · {sent.length}</div>
          {/* Only the most recent few are listed — a 50-number batch shouldn't push the rest
              of the dashboard off the screen to confirm what the count already says. */}
          {sent.slice(0, 5).map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, padding: "5px 0" }}>
              <I.checkc size={15} stroke="var(--ok)" />
              <span className="mono" style={{ fontWeight: 600 }}>{s.phone}</span>
            </div>
          ))}
          {sent.length > 5 && <div className="muted" style={{ fontSize: 12.5, paddingTop: 4 }}>+{sent.length - 5} more sent</div>}
        </div>
      )}
    </div>
  );
}

export { AdminFailedBeneficiaries, AgentFailedBeneficiary };
