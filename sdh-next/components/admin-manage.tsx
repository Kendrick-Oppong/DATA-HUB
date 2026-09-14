"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { PriceEdit } from "@/components/admin";
import { ComplaintThreadModal } from "@/components/agent-account";
import { D } from "@/components/how-to";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { DataLoader, Empty, Field, Modal, Pill } from "@/components/ui";

/* Smart Data Hub — ADMIN management: AFA, SMS sender IDs, Checkers, Complaints */
const { useState: amU, useEffect: amE } = React;

/* ---------------- ADMIN · AFA REGISTRATIONS ---------------- */
function AdminAfa() {
  const { S, adminAfa, setAfaAdminStatus, setAfaAdminPrice, refreshAdminAfa, afaPrice } = useStore();
  const [filter, setFilter] = amU("all");
  const [price, setPrice] = amU(afaPrice);
  // Server-backed: applications, their Ghana Card numbers and the AFA fee all come from the API.
  React.useEffect(() => { refreshAdminAfa(); }, []);
  React.useEffect(() => { setPrice(afaPrice); }, [afaPrice]);

  const list = adminAfa || [];
  const count = (s) => list.filter(r => r.status === s).length;
  const rows = filter === "all" ? list : list.filter(r => r.status === filter);
  const priceChanged = Number(price) > 0 && Number(price) !== Number(afaPrice);

  return (
    <React.Fragment>
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        {[["Total applications", list.length, "idcard", "var(--blue)", "var(--blue-050)"],
          ["Approved", count("approved"), "checkc", "var(--ok)", "var(--ok-bg)"],
          ["Under review", count("pending"), "clock", "#B9791C", "#FFF4E0"],
          ["Not approved", count("rejected"), "x", "var(--telecel)", "#FDE7E5"]].map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div><div className="v">{v}</div></div>
        ))}
      </div>

      {/* The ONLY place the AFA fee can be set. Agents can't price AFA and earn nothing on it. */}
      <div className="card pad-lg" style={{ marginBottom: 18 }}>
        <div className="card-h"><h3>Registration fee</h3></div>
        <p className="muted" style={{ fontSize: 13.5, marginTop: -8, marginBottom: 14 }}>Applies everywhere — in the app and on every agent's store. Agents cannot change it and earn no commission on AFA.</p>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ margin: 0, maxWidth: 220 }}>
            <label>Price customers pay</label>
            <div className="control"><span className="pre">GH₵</span><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} /></div>
          </div>
          <button className="btn btn-pri" disabled={!priceChanged} style={{ opacity: priceChanged ? 1 : .5 }} onClick={() => setAfaAdminPrice(Number(price))}><I.check size={16} stroke="#fff" />Save price</button>
        </div>
      </div>

      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <h3>AFA registrations</h3>
          <div className="seg" style={{ margin: 0, width: "auto" }}>{[["all", "All"], ["pending", "Under review"], ["approved", "Approved"], ["rejected", "Not approved"]].map(([f, l]) => <button key={f} className={filter === f ? "on" : ""} style={{ padding: "8px 14px" }} onClick={() => setFilter(f)}>{l}</button>)}</div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Reference</th><th>Applicant</th><th>Submitted by</th><th>Ghana Card</th><th>Occupation</th><th>Paid</th><th>Status</th><th>When</th><th></th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="mono" style={{ fontSize: 12 }}>{r.id}</td>
                  <td><div style={{ fontWeight: 600 }}>{r.name}</div><div className="mono">{r.phone}</div><div className="muted" style={{ fontSize: 12 }}>{r.location}{r.dob ? " · " + r.dob : ""}</div></td>
                  <td className="muted" style={{ fontSize: 13 }}>{r.submittedBy}</td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{r.ghanaCard}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{r.occupation}</td>
                  <td className="amt">{S.fmt(r.amount)}</td>
                  <td><Pill status={r.status === "approved" ? "active" : r.status === "rejected" ? "failed" : "pending"}>{r.status === "approved" ? "Approved" : r.status === "rejected" ? "Not approved" : "Under review"}</Pill></td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(r.at)}</td>
                  <td><div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {r.status === "pending"
                      ? <React.Fragment>
                          <button className="btn btn-out" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => setAfaAdminStatus(r.id, "rejected")}>Reject</button>
                          <button className="btn btn-pri" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setAfaAdminStatus(r.id, "approved")}><I.check size={15} stroke="#fff" />Approve</button>
                        </React.Fragment>
                      : <button className="btn btn-out" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => setAfaAdminStatus(r.id, "pending")} title="Put this application back under review">Reopen</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty"><div className="ic"><I.idcard size={28} /></div><p>No AFA registrations {filter === "all" ? "yet" : "in this state"}.</p></div>}
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---------------- ADMIN · SMS SENDER IDs ---------------- */
function AdminSenderIds() {
  const { S, senderIds, smsCampaigns, smsBalance, setSenderStatus, refreshSms, dataLoading } = useStore();
  amE(() => { refreshSms(); }, [refreshSms]);

  // The shared platform sender needs no approval, so keep it out of the queue and its
  // counts — it isn't a request anyone has to action.
  const requests = senderIds.filter(s => !s.platform);
  const pending = requests.filter(s => s.status === "pending").length;
  const sent30d = smsCampaigns
    .filter(c => c.at >= Date.now() - 30 * 86400e3)
    .reduce((s, c) => s + (c.sent || 0), 0);

  return (
    <React.Fragment>
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {[
          ["Sender IDs", requests.length, "brief", "var(--blue)", "var(--blue-050)"],
          ["Pending approval", pending, "clock", "#B9791C", "#FFF4E0"],
          ["SMS sent (30d)", sent30d.toLocaleString(), "mail", "var(--teal-ink)", "var(--teal-050)"],
        ].map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div><div className="v">{v}</div></div>
        ))}
      </div>

      {/* Our own credit with Arkesel. Every campaign on the platform draws from this one
          balance, so it running dry stops SMS for everybody at once. */}
      {smsBalance && (
        <div className="card pad-lg" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
          <span style={{ width: 44, height: 44, borderRadius: 13, background: smsBalance.ok && smsBalance.units > 500 ? "var(--teal-050)" : "#FFF4E0", color: smsBalance.ok && smsBalance.units > 500 ? "var(--teal-ink)" : "#B9791C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.mail size={22} /></span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 15.5 }}>{smsBalance.ok ? `${Number(smsBalance.units).toLocaleString()} SMS units left with Arkesel` : "SMS balance unavailable"}</strong>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{smsBalance.ok ? `Account balance ${smsBalance.cash || "—"}. Every campaign on the platform draws from this — top up on the Arkesel dashboard before it runs out.` : (smsBalance.error || "Couldn't reach the SMS provider.")}</div>
          </div>
          {smsBalance.ok && smsBalance.units <= 500 && <span className="pill requested">Low</span>}
        </div>
      )}

      <div className="card pad-lg">
        <div className="card-h"><h3>Sender ID approvals</h3>{pending > 0 && <span className="pill requested">{pending} pending</span>}</div>
        <p className="muted" style={{ fontSize: 13, marginTop: -8, marginBottom: 14, display: "flex", gap: 7 }}><I.info size={15} style={{ flexShrink: 0 }} />Register the name on the Arkesel dashboard first and wait for the networks to clear it. Approving here only makes it selectable — if it isn't registered with Arkesel, every send under it will be rejected.</p>
        {dataLoading.sms ? <DataLoader label="Loading sender IDs…" /> : requests.length === 0 ? (
          <Empty icon="brief" title="No sender ID requests" sub="When an agent asks for their own sender name, it'll come here for approval." />
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Sender ID</th><th>Agent</th><th>Status</th><th>Requested</th><th></th></tr></thead>
              <tbody>
                {requests.map(s => (
                  <tr key={s.ref}>
                    <td style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 15 }}>{s.id}</td>
                    <td className="muted">{s.user}</td>
                    <td><Pill status={s.status === "approved" ? "delivered" : s.status === "rejected" ? "failed" : "requested"}>{s.status}</Pill></td>
                    <td className="muted">{S.ago(s.at)}</td>
                    <td><div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      {s.status === "pending" ? (
                        <React.Fragment>
                          <button className="btn btn-out" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => setSenderStatus(s.ref, "rejected")}>Reject</button>
                          <button className="btn btn-pri" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setSenderStatus(s.ref, "approved")}><I.check size={15} stroke="#fff" />Approve</button>
                        </React.Fragment>
                      ) : (
                        <button className="btn btn-out" style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => setSenderStatus(s.ref, s.status === "approved" ? "rejected" : "approved")}>{s.status === "approved" ? "Revoke" : "Approve"}</button>
                      )}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Recent SMS campaigns</h3></div>
        {dataLoading.sms ? <DataLoader label="Loading campaigns…" /> : smsCampaigns.length === 0 ? (
          <Empty icon="mail" title="No campaigns yet" sub="Bulk SMS sent by agents and customers will be listed here." />
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Campaign</th><th>Sender</th><th>Sent</th><th>Charged</th><th>Refunded</th><th>Status</th><th>When</th></tr></thead>
              <tbody>{smsCampaigns.map(s => (
                <tr key={s.id}>
                  <td className="mono">{s.id}</td>
                  <td style={{ fontWeight: 600 }}>{s.sender}</td>
                  <td className="amt">{s.sent}{s.failed > 0 ? <span className="muted"> / {s.recipients}</span> : null}</td>
                  <td className="amt">{S.fmt(s.cost)}</td>
                  <td className="amt">{s.refunded > 0 ? S.fmt(s.refunded) : "—"}</td>
                  <td><Pill status={s.status === "sent" ? "delivered" : s.status === "partial" ? "requested" : "failed"}>{s.status}</Pill></td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(s.at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

/* ---------------- ADMIN · CHECKER PRODUCTS ---------------- */
function CheckerFulfillModal({ order, onClose, onSubmit }) {
  const [serial, setSerial] = amU("");
  const [pin, setPin] = amU("");
  const [busy, setBusy] = amU(false);
  const [err, setErr] = amU("");
  const ok = serial.trim() && pin.trim();
  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true); setErr("");
    try { await onSubmit(order.id, pin.trim(), serial.trim()); }
    catch (e) { setErr(e?.message || "Could not deliver."); setBusy(false); }
  };
  return (
    <Modal title="Deliver voucher" onClose={onClose}>
      <div className="co-item" style={{ background: "var(--bg)" }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--teal-050)", color: "var(--teal-ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.ticket size={22} /></span>
        <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{order.product}{order.qty > 1 ? " ×" + order.qty : ""}</div><div className="muted" style={{ fontSize: 12.5 }}>Order {order.id} · SMS to {order.recipient}</div></div>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: "12px 0" }}>Copy the serial and PIN from your Muviin portal for this batch and paste them here. The buyer gets them by SMS instantly.</p>
      <Field label="Serial number" icon="ticket" placeholder="e.g. WRC123456789" value={serial} onChange={(e) => setSerial(e.target.value)} />
      <Field label="PIN" icon="lock" placeholder="e.g. 0123 4567 8901" value={pin} onChange={(e) => setPin(e.target.value)} />
      {err && <div className="wd-otp-err" style={{ marginTop: 4 }}>{err}</div>}
      <button className="btn btn-pri btn-full" disabled={!ok || busy} style={{ opacity: (!ok || busy) ? .5 : 1 }} onClick={submit}><I.send size={18} stroke="#fff" />{busy ? "Sending…" : "Send voucher by SMS"}</button>
    </Modal>
  );
}

function AdminCheckers() {
  const { S, toast } = useStore();
  const [data, setData] = amU({ orders: [], prices: [], mode: "dry" });
  const [loaded, setLoaded] = amU(false);
  const [fulfill, setFulfill] = amU(null);
  const [busy, setBusy] = amU("");
  const map = { processing: "processing", delivered: "delivered", failed: "failed", refunded: "failed" };

  const load = React.useCallback(async () => {
    try { const r = await fetch("/api/admin/checkers", { credentials: "include" }); if (r.ok) { const d = await r.json().catch(() => ({})); setData({ orders: d.orders || [], prices: d.prices || [], mode: d.mode || "dry" }); } }
    catch (e) {} finally { setLoaded(true); }
  }, []);
  React.useEffect(() => {
    load();
    const iv = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") load(); }, 15000);
    const onVis = () => load(); window.addEventListener("focus", onVis);
    return () => { clearInterval(iv); window.removeEventListener("focus", onVis); };
  }, [load]);

  const post = async (body) => { const r = await fetch("/api/admin/checkers", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Action failed."); return d; };
  const doFulfill = async (ref, pin, serial) => { const d = await post({ action: "fulfill", ref, pin, serial }); toast("Voucher sent by SMS", "check"); setFulfill(null); load(); return d.order; };
  const doFail = async (ref) => { if (busy) return; setBusy("fail-" + ref); try { await post({ action: "fail", ref }); toast("Order refunded to buyer", "refresh"); load(); } catch (e) { toast(e.message, "info"); } finally { setBusy(""); } };

  const orders = data.orders;
  const pending = orders.filter(o => o.status === "processing");
  const priceMap = {}; data.prices.forEach(p => { priceMap[String(p.cardType).toLowerCase()] = p.price; });

  return (
    <React.Fragment>
      <div className="card pad-lg" style={{ marginBottom: 18 }}>
        <div className="card-h"><h3>DataHub vouchers</h3><span className="pill" style={{ background: data.mode === "live" ? "var(--ok-bg)" : "#FFF4E0", color: data.mode === "live" ? "var(--ok)" : "#B9791C", fontSize: 11.5, fontWeight: 700 }}>{data.mode === "live" ? "Live" : "Dry mode"}</span></div>
        <p className="muted" style={{ fontSize: 13.5, marginTop: -8, marginBottom: 14 }}>Vouchers deliver instantly from your DataHub wallet — the PIN &amp; serial come back in the same purchase call, so there's nothing to restock or fulfil by hand.</p>
        <div className="grid g-2">
          {[["wassce", "WASSCE"], ["bece", "BECE"]].map(([id, label]) => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--teal-050)", color: "var(--teal-ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.ticket size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><strong style={{ fontSize: 15 }}>{label} Checker</strong><div className="muted" style={{ fontSize: 12.5 }}>DataHub price: {priceMap[label.toLowerCase()] != null ? S.fmt(priceMap[label.toLowerCase()]) : "—"}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card pad-lg">
        <div className="card-h"><div><h3>Fulfilment desk</h3><div className="muted" style={{ fontSize: 13 }}>Legacy Muviin orders only — a voucher stuck "processing" from before the DataHub switch. Enter the serial &amp; PIN to deliver by SMS.</div></div>{pending.length > 0 && <span className="pill requested">{pending.length} to fulfil</span>}</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Product</th><th>Buyer</th><th>Send to</th><th style={{ textAlign: "right" }}>Paid</th><th style={{ textAlign: "center" }}>Status</th><th style={{ textAlign: "right" }}>When</th><th></th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="mono" style={{ fontSize: 12 }}>{o.id}</td>
                  <td style={{ fontWeight: 600 }}>{o.product}{o.qty > 1 ? " ×" + o.qty : ""}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{o.buyer}</td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{o.recipient}</td>
                  <td className="amt" style={{ textAlign: "right" }}>{S.fmt(o.cost)}</td>
                  <td style={{ textAlign: "center" }}><Pill status={map[o.status]}>{o.status}</Pill></td>
                  <td className="muted" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{S.ago(o.at)}</td>
                  <td style={{ textAlign: "right" }}>
                    {o.status === "processing" ? (
                      <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="btn btn-out" style={{ padding: "7px 11px", fontSize: 12.5 }} disabled={busy === "fail-" + o.id} onClick={() => doFail(o.id)}>Refund</button>
                        <button className="btn btn-pri" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setFulfill(o)}><I.send size={14} stroke="#fff" />Deliver</button>
                      </div>
                    ) : o.status === "delivered" ? <span className="mono muted" style={{ fontSize: 11.5 }}>{o.serial} · {o.pin}</span> : <span className="muted" style={{ fontSize: 12.5 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loaded && <DataLoader label="Loading orders…" />}
          {loaded && orders.length === 0 && <div className="empty" style={{ padding: "36px 10px" }}><div className="ic"><I.ticket size={26} /></div><p>No checker orders yet. Paid orders land here to fulfil.</p></div>}
        </div>
      </div>
      {fulfill && <CheckerFulfillModal order={fulfill} onClose={() => setFulfill(null)} onSubmit={doFulfill} />}
    </React.Fragment>
  );
}

/* ---------------- ADMIN · COMPLAINTS DESK ---------------- */
function AdminComplaints() {
  const { S, toast, complaints, dataLoading, refreshComplaints, replyComplaint, complaintStatus, markComplaintRead, user } = useStore();
  const [filter, setFilter] = amU("all");
  const [detail, setDetail] = amU(null);
  const map = { open: "failed", "in-review": "processing", resolved: "delivered" };

  React.useEffect(() => { if (user?.id) refreshComplaints(); }, []);

  const openDetail = (id) => { setDetail(id); markComplaintRead(id); };
  const reply = (id, message) => replyComplaint(id, message);
  const status = (id, st) => complaintStatus(id, st);
  // Inline card buttons (no thread modal to swallow errors) — surface failures as a toast.
  const cardStatus = (id, st) => { complaintStatus(id, st).then(() => toast("Complaint " + (st === "resolved" ? "resolved" : "updated"), "check")).catch(e => toast(e?.message || "Could not update.", "info")); };

  const rows = filter === "all" ? complaints : complaints.filter(c => c.status === filter);
  const counts = { open: complaints.filter(c => c.status === "open").length, "in-review": complaints.filter(c => c.status === "in-review").length, resolved: complaints.filter(c => c.status === "resolved").length };
  const detailC = detail ? complaints.find(c => c.id === detail) || detail : null;
  const loaded = !dataLoading.complaints;

  return (
    <React.Fragment>
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {[["Open", counts.open, "flag", "var(--telecel)", "#FDE7E5"], ["In review", counts["in-review"], "clock", "#B9791C", "#FFF4E0"], ["Resolved", counts.resolved, "checkc", "var(--ok)", "var(--ok-bg)"]].map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div><div className="v">{v}</div></div>
        ))}
      </div>
      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <h3>Support desk</h3>
          <div className="seg" style={{ margin: 0, width: "auto" }}>{[["all", "All"], ["open", "Open"], ["in-review", "In review"], ["resolved", "Resolved"]].map(([f, l]) => <button key={f} className={filter === f ? "on" : ""} style={{ padding: "8px 13px" }} onClick={() => setFilter(f)}>{l}</button>)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!loaded && <DataLoader label="Loading complaints…" />}
          {loaded && rows.length === 0 && <div className="empty" style={{ padding: "34px 10px" }}><div className="ic"><I.flag size={26} /></div><p>{complaints.length === 0 ? "No complaints yet. Customer & agent issues land here." : "No complaints in this view."}</p></div>}
          {rows.map(c => (
            <div key={c.id} onClick={() => openDetail(c.id)} style={{ border: "1px solid " + (c.unread ? "var(--blue)" : "var(--line)"), borderRadius: 14, padding: "16px 18px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {c.unread && <span title="New reply" style={{ width: 8, height: 8, borderRadius: 99, background: "var(--blue)", flexShrink: 0 }}></span>}
                <strong style={{ fontFamily: "var(--ff-display)", fontSize: 16 }}>{c.subject}</strong>
                <span className="pill approved" style={{ fontSize: 11 }}>{c.category}</span>
                <Pill status={map[c.status]}>{c.status === "in-review" ? "In review" : c.status}</Pill>
                <span className="muted" style={{ fontSize: 12.5, marginLeft: "auto" }}>{S.ago(c.updatedAt || c.at)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 12 }}>{c.id}</span>
                <span className="muted" style={{ fontSize: 12.5 }}>· {c.user}</span>
                {c.ref !== "—" && <span className="muted" style={{ fontSize: 12.5 }}>· ref {c.ref}</span>}
                <span className="muted" style={{ fontSize: 12.5 }}>· {c.msgs} message{c.msgs !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--muted)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                {c.lastFrom === "support" && <span className="pill approved" style={{ fontSize: 10.5, flexShrink: 0 }}>You</span>}{c.last}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-pri" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => openDetail(c.id)}><I.send size={15} stroke="#fff" />Open &amp; reply</button>
                {c.status !== "resolved" && <button className="btn btn-out" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => cardStatus(c.id, "resolved")}><I.check size={15} />Mark resolved</button>}
                {c.status === "open" && <button className="btn btn-out" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => cardStatus(c.id, "in-review")}>Start review</button>}
                {c.status === "resolved" && <button className="btn btn-out" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => cardStatus(c.id, "in-review")}>Reopen</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {detailC && <ComplaintThreadModal complaint={detailC} admin onReply={reply} onStatus={status} onClose={() => setDetail(null)} />}
    </React.Fragment>
  );
}

export { AdminAfa, AdminCheckers, AdminComplaints, AdminSenderIds };
