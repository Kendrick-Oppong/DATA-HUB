"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { DataLoader, Empty, Field, Modal } from "@/components/ui";

/* Smart Data Hub — notification centre: the topbar bell and its quick-look popup, the full
   Notifications page, and the admin announcement composer.

   The feed is real: every notification comes from /api/notifications (raised server-side by
   order, wallet, payout, store-sale, support and account events) plus admin announcements
   addressed to the viewer's audience. */
const { useState: nU, useEffect: nE } = React;

// Per-type accent (icon colour + soft background) so the feed is scannable at a glance.
const TYPE_STYLE = {
  order:        ["var(--blue)", "var(--blue-050)"],
  wallet:       ["var(--ok)", "var(--ok-bg)"],
  payout:       ["#B9791C", "#FFF4E0"],
  sale:         ["var(--teal-ink)", "var(--teal-050)"],
  support:      ["var(--telecel)", "#FDE7E5"],
  account:      ["var(--blue-700)", "var(--blue-050)"],
  announcement: ["var(--teal-ink)", "var(--teal-050)"],
};
const styleFor = (type) => TYPE_STYLE[type] || ["var(--muted)", "var(--bg)"];

const AUDIENCE_LABEL = { all: "Everyone", agents: "Agents only", customers: "Customers only" };

/* ---------------- one row in the feed ---------------- */
function NotifRow({ n, onOpen, onDelete = null }) {
  const { S } = useStore();
  const [col, bg] = styleFor(n.type);
  return (
    <div
      className={"ntf-row" + (n.read ? "" : " unread")}
      onClick={() => onOpen(n)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(n); }}
    >
      <span className="ntf-ic" style={{ background: bg, color: col }}><Ic name={n.icon || "bell"} size={19} /></span>
      <div className="ntf-body">
        <div className="ntf-top">
          <strong>{n.title}</strong>
          {!n.read && <span className="ntf-dot" title="Unread" />}
          <span className="ntf-when">{S.ago(n.at)}</span>
        </div>
        <p>{n.body}</p>
        {(n.broadcast || n.ref) && (
          <div className="ntf-meta">
            {n.broadcast && <span className="pill approved" style={{ fontSize: 10.5 }}>Announcement{n.by ? " · " + n.by : ""}</span>}
            {n.ref && <span className="mono">{n.ref}</span>}
          </div>
        )}
      </div>
      {onDelete && (
        <button className="ntf-del" aria-label="Remove notification" onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}>
          <I.x size={14} />
        </button>
      )}
    </div>
  );
}

/* ---------------- topbar bell + quick-look popup ----------------
   The bell opens a small modal with the latest few notifications so a glance doesn't cost a
   page change. Opening one still marks it read and follows its link, and "View all" hands
   over to the full Notifications page. The badge shows how many are unread. */
const QUICK_LOOK = 5;   // how many the popup shows before it defers to the full page

function NotificationBell() {
  const {
    unreadNotifs, appPage, goApp, notifications, dataLoading,
    refreshNotifications, markNotifRead, markAllNotifsRead, user,
  } = useStore();
  const [open, setOpen] = nU(false);

  // Pull the freshest feed each time it's opened, so the popup can't show a stale list.
  nE(() => { if (open && user?.id) refreshNotifications(); }, [open]);

  const rows = (notifications || []).slice(0, QUICK_LOOK);
  const more = Math.max(0, (notifications || []).length - rows.length);

  const openOne = (n) => {
    if (!n.read) markNotifRead(n.id);
    setOpen(false);
    if (n.link) goApp(n.link);
  };
  const viewAll = () => { setOpen(false); goApp("notifications"); };

  return (
    <React.Fragment>
      <button
        className={"iconbtn" + (appPage === "notifications" || open ? " on" : "")}
        aria-label={unreadNotifs ? `Notifications (${unreadNotifs} unread)` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <I.bell size={20} />
        {unreadNotifs > 0 && <span className="ncount">{unreadNotifs > 99 ? "99+" : unreadNotifs}</span>}
      </button>

      {open && (
        <Modal
          title={unreadNotifs > 0 ? `Notifications · ${unreadNotifs} unread` : "Notifications"}
          onClose={() => setOpen(false)}
          foot={
            <div className="mfoot">
              {unreadNotifs > 0 && (
                <button className="btn btn-ghost" onClick={() => markAllNotifsRead()}>
                  <I.check size={17} />Mark all read
                </button>
              )}
              <button className="btn btn-pri" style={{ marginLeft: "auto" }} onClick={viewAll}>
                View all{more > 0 ? ` (${(notifications || []).length})` : ""}<I.arrow size={17} stroke="#fff" />
              </button>
            </div>
          }
        >
          {dataLoading?.notifications && rows.length === 0 ? (
            <DataLoader label="Loading notifications…" />
          ) : rows.length === 0 ? (
            <Empty icon="bell" title="Nothing yet" sub="Order updates, payouts and announcements will show up here." />
          ) : (
            <React.Fragment>
              <div className="ntf-feed">
                {rows.map((n) => <NotifRow key={n.id} n={n} onOpen={openOne} />)}
              </div>
              {more > 0 && (
                <p className="muted" style={{ fontSize: 12.5, textAlign: "center", marginTop: 12 }}>
                  {more} more {more === 1 ? "notification" : "notifications"} on the full page
                </p>
              )}
            </React.Fragment>
          )}
        </Modal>
      )}
    </React.Fragment>
  );
}

/* ---------------- full notifications page ---------------- */
function NotificationsPage() {
  const { notifications, unreadNotifs, dataLoading, refreshNotifications, markNotifRead, markAllNotifsRead, deleteNotif, clearNotifs, goApp, role, user, toast } = useStore();
  const [tab, setTab] = nU("all");
  const [compose, setCompose] = nU(false);

  nE(() => { if (user?.id) refreshNotifications(); }, []);

  const rows = tab === "unread" ? (notifications || []).filter(n => !n.read) : (notifications || []);
  const openOne = (n) => {
    if (!n.read) markNotifRead(n.id);
    if (n.link) goApp(n.link);
  };

  return (
    <React.Fragment>
      {role === "admin" && <AdminAnnouncements onCompose={() => setCompose(true)} />}

      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <h3>{unreadNotifs > 0 ? `Notifications · ${unreadNotifs} unread` : "Notifications"}</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="seg" style={{ margin: 0, width: "auto" }}>
              {[["all", "All"], ["unread", "Unread"]].map(([k, l]) => (
                <button key={k} className={tab === k ? "on" : ""} style={{ padding: "8px 14px" }} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>
            {unreadNotifs > 0 && <button className="btn btn-out" style={{ padding: "9px 15px", fontSize: 13.5 }} onClick={markAllNotifsRead}><I.check size={15} />Mark all read</button>}
            {(notifications || []).length > 0 && (
              <button className="btn btn-ghost" style={{ padding: "9px 13px", fontSize: 13.5 }} onClick={() => { clearNotifs(); toast("Notifications cleared", "check"); }}>Clear all</button>
            )}
          </div>
        </div>

        {dataLoading.notifications ? (
          <DataLoader label="Loading your notifications…" />
        ) : rows.length === 0 ? (
          <Empty
            icon="bell"
            title={tab === "unread" ? "Nothing unread" : "No notifications yet"}
            sub={tab === "unread" ? "You've read everything — nice." : "Delivery updates, wallet activity, payouts and announcements from our team will appear here."}
          />
        ) : (
          <div className="ntf-feed">
            {rows.map(n => <NotifRow key={n.id} n={n} onOpen={openOne} onDelete={deleteNotif} />)}
          </div>
        )}
      </div>

      {compose && <AnnounceModal onClose={() => setCompose(false)} />}
    </React.Fragment>
  );
}

/* ---------------- admin: announcements sent ---------------- */
function AdminAnnouncements({ onCompose }) {
  const { S, broadcasts, audienceCounts, refreshBroadcasts, deleteAnnouncement, toast } = useStore();
  nE(() => { refreshBroadcasts(); }, []);

  const withdraw = async (id) => {
    try { await deleteAnnouncement(id); toast("Announcement withdrawn", "x"); }
    catch (e) { toast(e.message || "Could not withdraw it", "info"); }
  };

  return (
    <div className="card pad-lg" style={{ marginBottom: 18 }}>
      <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
        <h3>Announcements</h3>
        <button className="btn btn-pri" style={{ padding: "10px 16px", fontSize: 14 }} onClick={onCompose}>
          <I.megaphone size={16} stroke="#fff" />New announcement
        </button>
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: -8, marginBottom: 16 }}>
        Send a message straight to everyone's notification bell — the whole platform, agents only, or customers only.
      </p>

      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {[["Everyone", audienceCounts.all, "users"], ["Agents", audienceCounts.agents, "brief"], ["Customers", audienceCounts.customers, "user"]].map(([l, v, ic], i) => (
          <div className="stat-tile" key={i}>
            <div className="lbl"><span className="ic" style={{ background: "var(--blue-050)", color: "var(--blue)" }}><Ic name={ic} size={17} /></span>{l}</div>
            <div className="v">{v ?? 0}</div>
          </div>
        ))}
      </div>

      {(broadcasts || []).length === 0 ? (
        <Empty icon="megaphone" title="No announcements sent" sub="Downtime notices, price changes and product news you send will be listed here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {broadcasts.map(b => (
            <div key={b.id} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ fontFamily: "var(--ff-display)", fontSize: 15.5 }}>{b.title}</strong>
                <span className="pill approved" style={{ fontSize: 10.5 }}>{AUDIENCE_LABEL[b.audience] || "Everyone"}</span>
                <span className="muted" style={{ fontSize: 12.5, marginLeft: "auto" }}>{S.ago(b.at)}</span>
                <button className="btn btn-ghost" style={{ padding: "6px 11px", fontSize: 12.5 }} onClick={() => withdraw(b.id)}>Withdraw</button>
              </div>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 8, whiteSpace: "pre-wrap" }}>{b.body}</p>
              {b.by && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Sent by {b.by}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- admin: compose an announcement ---------------- */
function AnnounceModal({ onClose }) {
  const { sendAnnouncement, audienceCounts, toast } = useStore();
  const [audience, setAudience] = nU("all");
  const [title, setTitle] = nU("");
  const [body, setBody] = nU("");
  const [email, setEmail] = nU(false);
  const [busy, setBusy] = nU(false);
  const [err, setErr] = nU("");

  const opts = [
    ["all", "Everyone", "users", "Every account on the platform"],
    ["agents", "Agents only", "brief", "Approved agents / resellers"],
    ["customers", "Customers only", "user", "Customers who aren't agents"],
  ];
  const ok = title.trim() && body.trim();
  const reach = audienceCounts[audience] ?? 0;

  const send = async () => {
    if (!ok || busy) return;
    setBusy(true); setErr("");
    try {
      const d = await sendAnnouncement({ title: title.trim(), body: body.trim(), audience, email });
      toast(`Announcement sent to ${d.recipients ?? reach} ${d.recipients === 1 ? "person" : "people"}`, "megaphone");
      onClose();
    } catch (e) {
      setErr(e?.message || "Could not send the announcement.");
    } finally { setBusy(false); }
  };

  return (
    <Modal title="Send an announcement" onClose={onClose}>
      <p className="muted" style={{ fontSize: 13.5, marginTop: -6, marginBottom: 14 }}>
        This lands in the notification bell of everyone you choose, straight away.
      </p>

      <div className="field"><label>Who should get this?</label></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {opts.map(([k, l, ic, sub]) => (
          <button key={k} className="ntf-aud" data-on={audience === k ? "1" : "0"} onClick={() => setAudience(k)}>
            <span className="ic"><Ic name={ic} size={19} /></span>
            <span className="tx"><span className="t">{l}</span><span className="s">{sub}</span></span>
            <span className="n">{audienceCounts[k] ?? 0}</span>
            {audience === k && <I.check size={16} stroke="var(--ok)" sw={3} />}
          </button>
        ))}
      </div>

      <Field label="Title" icon="megaphone" placeholder="e.g. MTN bundles back online" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
      <div className="field">
        <label>Message</label>
        <div className="control" style={{ height: "auto", padding: 14, alignItems: "flex-start" }}>
          <textarea rows={4} placeholder="What do you want them to know?" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000}
            style={{ border: "none", outline: "none", background: "none", font: "inherit", width: "100%", resize: "vertical", color: "var(--ink)" }} />
        </div>
      </div>

      <div className="set-row" style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--line)", borderRadius: 14, marginBottom: 14 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-050)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.mail size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Also send by email</div>
          <div className="muted" style={{ fontSize: 12.5 }}>Emails everyone in this audience who has an email address</div>
        </div>
        <label className="store-toggle" style={{ margin: 0 }}><input type="checkbox" checked={email} onChange={() => setEmail(v => !v)} /><span className="tk"></span></label>
      </div>

      {err && <div className="wd-otp-err" style={{ marginTop: 4 }}>{err}</div>}
      <button className="btn btn-pri btn-full" disabled={!ok || busy} style={{ opacity: (!ok || busy) ? .5 : 1 }} onClick={send}>
        <I.send size={18} stroke="#fff" />{busy ? "Sending…" : `Send to ${reach} ${reach === 1 ? "person" : "people"}`}
      </button>
    </Modal>
  );
}

export { AdminAnnouncements, AnnounceModal, NotificationBell, NotificationsPage, NotifRow };
