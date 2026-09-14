import type { Metadata } from "next";
// Global stylesheets — same order as the original builds:
// web.css → platform.css → motion.css  (mobile.css is loaded only on /mobile).
// mobile-responsive.css adds real @media rules so the "/" web build is
// actually responsive on real phones (mobile.css itself only applies inside
// the fixed-width iPhone mockup on /mobile).
import "@/styles/web.css";
import "@/styles/platform.css";
import "@/styles/mobile-responsive.css";
import "@/styles/motion.css";

export const metadata: Metadata = {
  title: "Smart Data Hub",
  description: "Smart Data, Seamless Connection",
  // Versioned query busts browsers still showing a stale/other favicon.
  // Bump ?v= whenever the icon changes to force a re-fetch.
  icons: {
    icon: [{ url: "/favicon.ico?v=2", sizes: "any" }],
    shortcut: "/favicon.ico?v=2",
    apple: "/favicon.ico?v=2",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
