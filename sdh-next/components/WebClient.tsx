"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// The whole prototype is client-only (uses window / localStorage / performance at
// module + render time), so we mount it with ssr:false — behaviour stays identical
// to the original in-browser build.
const App = dynamic(() => import("@/components/app").then((m) => m.App), { ssr: false });
const MotionLayer = dynamic(() => import("@/components/motion").then((m) => m.MotionLayer), {
  ssr: false,
});

export default function WebClient() {
  // The web build uses the default body font-size (the mobile build overrides it).
  useEffect(() => {
    const prev = document.body.style.fontSize;
    document.body.style.fontSize = "";
    return () => {
      document.body.style.fontSize = prev;
    };
  }, []);

  return (
    <>
      <App />
      <MotionLayer />
    </>
  );
}
