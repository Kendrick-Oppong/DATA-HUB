"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
// mobile-only overrides + iPhone frame, loaded LAST so they win (matches the
// original Smart Data Hub Mobile.html which links mobile.css after platform.css).
import "@/styles/mobile.css";

const MobileApp = dynamic(() => import("@/components/mobile-app").then((m) => m.MobileApp), {
  ssr: false,
});
const MotionLayer = dynamic(() => import("@/components/motion").then((m) => m.MotionLayer), {
  ssr: false,
});

export default function MobileClient() {
  // The original mobile build sets `body { font-size: 8px }` (the iPhone frame /
  // mobile.css scale off it). Apply it only on this route, restore on leave.
  useEffect(() => {
    const prev = document.body.style.fontSize;
    document.body.style.fontSize = "8px";
    return () => {
      document.body.style.fontSize = prev;
    };
  }, []);

  return (
    <>
      <MobileApp />
      <MotionLayer />
    </>
  );
}
