"use client";
/* eslint-disable */
// @ts-nocheck
// Mobile root — ported from platform/mobile-app.jsx.
// AppRouter/SITE_PAGES/SiteShell now come from the shared router module.
// (ReactDOM.createRoot removed; mounted by app/mobile/page.tsx → MobileClient.)
import React from "react";
import "@/lib/data";
import { StoreProvider, useStore } from "@/components/store";
import { SITE_PAGES } from "@/components/router";
import { Storefront } from "@/components/storefront";
import { MobileAppShell } from "@/components/mobile-shell";
import { AuthScreen } from "@/components/auth";
import { IOSDevice } from "@/components/ios-frame";
import { I } from "@/components/icons";

const { useEffect: mApE, useState: mApS } = React;

function MobileSplash() {
  const [phase, setPhase] = mApS("show"); // show | hide | gone
  mApE(() => {
    const t1 = setTimeout(() => setPhase("hide"), 1750);
    const t2 = setTimeout(() => setPhase("gone"), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (phase === "gone") return null;
  return (
    <div className={"m-splash" + (phase === "hide" ? " out" : "")} aria-hidden="true">
      <div className="m-splash-logo">
        <span className="ring"></span>
        <span className="ring"></span>
        <img src="/assets/logo-mark.png" alt="" />
      </div>
      <div className="m-splash-word">SMART<span> DATA</span> HUB</div>
      <div className="m-splash-bar"><span></span></div>
    </div>
  );
}

function MobileRoot() {
  const { screen, sitePage, user, setScreen, setAuthMode, navSite } = useStore();
  // Mobile is a phone app first: the marketing HOMEPAGE is never shown —
  // entry (and post-logout) lands on login, or the app if signed in.
  // BUT info pages (Terms, FAQ, compliance, contact…) are reachable so the
  // legal links work; they render inside the phone with their own scroll
  // under a compact app-style bar (NOT the marketing nav/footer).
  const isInfoPage = screen === "site" && sitePage && sitePage !== "home";
  mApE(() => {
    if (screen === "site" && !isInfoPage) {
      if (user) setScreen("app");
      else { setAuthMode("login"); setScreen("auth"); }
    }
  }, [screen, sitePage, user]);

  if (screen === "store") return <Storefront />;
  if (screen === "app")   return <MobileAppShell />;
  if (isInfoPage) {
    const TITLES = { terms: "Terms & Conditions", faq: "Help & FAQ", compliance: "Legal & Compliance", contact: "Contact us", about: "About us", services: "Our services", reseller: "Agent program" };
    const Page = SITE_PAGES[sitePage] || SITE_PAGES.home;
    const goBack = () => { if (user) setScreen("app"); else { setAuthMode("login"); setScreen("auth"); } };
    return (
      <div className="m-app">
        <header className="topbar m-info-bar">
          <button className="hamb" onClick={goBack} aria-label="Back"><I.arrow size={22} style={{ transform: "rotate(180deg)" }} /></button>
          <div className="tt"><div className="mtitle">{TITLES[sitePage] || "Information"}</div></div>
        </header>
        <div className="m-scroll m-info-scroll"><Page /></div>
      </div>
    );
  }
  // "site"/home is transient (redirected above); render auth meanwhile
  return <AuthScreen />;
}

function MobileApp() {
  return (
    <StoreProvider>
      <div className="m-stage">
        <IOSDevice>
          <MobileRoot />
          <MobileSplash />
        </IOSDevice>
      </div>
    </StoreProvider>
  );
}

export { MobileApp, MobileRoot, MobileSplash };
