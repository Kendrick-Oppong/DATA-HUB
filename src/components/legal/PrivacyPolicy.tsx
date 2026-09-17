"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  FileCheck,
  Server,
  UserCheck,
  ExternalLink,
  Database,
  CheckCircle2,
} from "lucide-react";
import { PublicFooter } from "../public/sections/PublicFooter";
import { PublicNavbar } from "../public/PublicNavbar";
import type { UserAccount, AppTheme } from "../../types";

interface PrivacyPolicyProps {
  user?: UserAccount | null;
  onBack: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToLegal?: (page: "terms" | "privacy") => void;
  onNavigatePublicTab?: (tab: any) => void;
  onNavigateToAuth?: (mode: string) => void;
  onNavigateToDashboard?: (role: string) => void;
  onSignOut?: () => void;
  theme?: AppTheme;
  onSetTheme?: (theme: string) => void;
  onOpenSecurityPins?: () => void;
}

const SECTIONS = [
  { id: "overview", number: "01", title: "Overview & Scope" },
  { id: "data-we-collect", number: "02", title: "Information We Collect" },
  { id: "how-we-use", number: "03", title: "How We Use Your Data" },
  { id: "legal-basis", number: "04", title: "Compliance with Act 843 (Ghana)" },
  {
    id: "data-sharing",
    number: "05",
    title: "Data Sharing & Carrier Disclosures",
  },
  { id: "security", number: "06", title: "Security Measures & Encryption" },
  { id: "retention", number: "07", title: "Data Retention & Storage" },
  { id: "your-rights", number: "08", title: "Your Privacy Rights & Choices" },
  { id: "cookies", number: "09", title: "Cookies & Tracking Technologies" },
  {
    id: "contact-dpo",
    number: "10",
    title: "Data Protection Officer & Contact",
  },
];

export function PrivacyPolicy({
  user,
  onBack,
  onNavigateToTerms,
  onNavigateToLegal,
  onNavigatePublicTab,
  onNavigateToAuth,
  onNavigateToDashboard,
  onSignOut,
  theme,
  onSetTheme,
  onOpenSecurityPins,
}: Readonly<PrivacyPolicyProps>) {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <PublicNavbar
        user={user}
        activeTab="home"
        onNavigateToPublic={onNavigatePublicTab || (() => {})}
        onNavigateToAuth={(mode) => onNavigateToAuth?.(mode || "sign-in")}
        onNavigateToDashboard={(role) => {
          if (role === "storefront") {
            onNavigatePublicTab?.("home");
          } else if (role !== "public") {
            onNavigateToDashboard?.(role);
          }
        }}
        onSignOut={onSignOut || (() => {})}
        theme={(theme as any) || "light"}
        onSetTheme={onSetTheme || (() => {})}
        onOpenSecurityPins={onOpenSecurityPins || (() => {})}
      />

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-6">
            <ShieldCheck className="size-3.5" />
            <span>Ghana Data Protection Act</span>
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
            Your data,
            <span> your control</span>
            <br />
            <span className="text-primary"> always protected</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground  max-w-xl mx-auto leading-relaxed">
            Smart Data Hub, operating under Smart Pixels Ventures, is committed
            to safeguarding your personal data and ensuring transparent
            processing across all our fintech and telecommunications services in
            Ghana.
          </p>
        </div>
      </section>

      {/* Key principles */}
      <section className="border-b border-border bg-gradient-to-r from-primary/8 via-card to-emerald-500/8">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "256-bit", label: "SSL encryption", icon: Lock },
              { value: "Act 843", label: "BoG compliant", icon: ShieldCheck },
              { value: "Zero", label: "Third-party sales", icon: Eye },
              { value: "7 years", label: "Data retention", icon: Database },
            ].map((s) => (
              <div key={s.label}>
                <s.icon className="size-5 mx-auto mb-2" />
                <p className="text-3xl font-black tabular-nums">{s.value}</p>
                <p className="text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Layout */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          {/* Quick Table of Contents Sidebar */}
          <aside className="hidden lg:block sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-medium mb-3 px-2">
                Policy Navigation
              </p>
              <nav className="space-y-1">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-sm font-medium rounded-xl transition-colors ${
                      activeSection === sec.id
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span
                      className={` text-[11px] ${activeSection === sec.id ? "text-primary-foreground/80" : "text-primary font-bold"}`}
                    >
                      {sec.number}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-border/80 space-y-2">
                <p className="text-[11px] text-muted-foreground font-medium leading-snug px-2">
                  Exercise your data rights or contact our DPO:
                </p>
                <a
                  href="mailto:dpo@smartdatahub.gh?subject=Privacy%20Request%20-%20Data%20Protection%20Officer"
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                >
                  <span>Email Data Officer</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </aside>

          {/* Policy Body */}
          <main className="space-y-12">
            {/* Introductory Notice Banner */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm leading-relaxed text-foreground space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                <Lock className="size-4" />
                <span>Our Privacy Commitment to You</span>
              </div>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                Smart Data Hub respects your privacy. We collect only the data
                necessary to fulfill your telecommunications orders, settle
                payments securely, comply with Bank of Ghana Anti-Money
                Laundering regulations, and provide uninterrupted support. We
                never sell or monetize your personal data.
              </p>
            </div>

            {/* 01: Overview & Scope */}
            <section id="overview" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">01</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Overview & Scope
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  This Privacy Policy describes how{" "}
                  <strong className="text-foreground">Smart Data Hub</strong> (a
                  digital brand operated by{" "}
                  <strong className="text-foreground">
                    Smart Pixels Ventures
                  </strong>
                  ) collects, uses, protects, and discloses personal information
                  when you visit our website, utilize our public marketplace,
                  register an account, or transact through our
                  telecommunications gateways.
                </p>
                <p>
                  By using Smart Data Hub, you acknowledge and agree to the
                  practices outlined in this Policy. If you do not agree, please
                  discontinue use of our platform immediately.
                </p>
              </div>
            </section>

            {/* 02: Information We Collect */}
            <section id="data-we-collect" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">02</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Information We Collect
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  We collect several categories of information to provide and
                  improve our services:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-primary" /> Identity &
                      Contact Data
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Full name, active telephone number (Mobile Money MSISDN),
                      email address, and optional business name for agents and
                      resellers.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <FileCheck className="size-3.5 text-emerald-600" />{" "}
                      Regulatory Identification (KYC)
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Ghana Card (National Identification Card) number and photo
                      copy when required for AFA registration or high-volume
                      agent payout verification.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Database className="size-3.5 text-amber-600" />{" "}
                      Transactional & Order Records
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Order reference IDs, selected telecom carrier, bundle
                      size, beneficiary phone numbers, payment amounts, and
                      gateway settlement timestamps.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Server className="size-3.5 text-purple-600" /> Technical
                      & Device Information
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      IP address, browser type, operating system, device
                      characteristics, and anonymized diagnostic logs collected
                      during checkout.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 03: How We Use Your Data */}
            <section id="how-we-use" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">03</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  How We Use Your Information
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  We process your personal information strictly for legitimate
                  operational and legal purposes:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>
                    <strong className="text-foreground">
                      Service Delivery:
                    </strong>{" "}
                    Transmitting beneficiary phone numbers and bundle
                    specifications to carrier EVD gateways (MTN, Telecel, AT) to
                    credit data and airtime instantly.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Payment Reconciliation:
                    </strong>{" "}
                    Verifying Mobile Money debit confirmations with authorized
                    payment processors and detecting duplicate or fraudulent
                    charges.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Customer Support:
                    </strong>{" "}
                    Resolving delivery queries, verifying purchase references,
                    and providing live NOC assistance via WhatsApp and
                    telephone.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Regulatory Reporting:
                    </strong>{" "}
                    Maintaining compliance records mandated by the Bank of Ghana
                    and the Data Protection Commission of Ghana.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Security & Fraud Prevention:
                    </strong>{" "}
                    Protecting our systems against denial-of-service attacks,
                    unauthorized wallet access, and abusive automated scraping.
                  </li>
                </ul>
              </div>
            </section>

            {/* 04: Compliance with Act 843 (Ghana) */}
            <section id="legal-basis" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">04</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Compliance with Ghana Data Protection Act 2012 (Act 843)
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  Smart Data Hub strictly adheres to the eight (8) data
                  protection principles set forth in Section 17 of the{" "}
                  <strong className="text-foreground">
                    Data Protection Act, 2012 (Act 843)
                  </strong>{" "}
                  of Ghana:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-1">
                  {[
                    "Accountability: Maintaining transparent records of all data handling.",
                    "Lawfulness of Processing: Only collecting data with your explicit consent or statutory basis.",
                    "Specification of Purpose: Processing data solely for stated digital delivery purposes.",
                    "Compatibility of Further Processing: Never repurposing customer data for secondary uses.",
                    "Quality of Information: Ensuring customer and order records remain accurate and current.",
                    "Openness: Providing full transparency on how and where data is processed.",
                    "Data Security Safeguards: 256-bit encryption and strict access controls.",
                    "Data Subject Participation: Honoring user requests to review, correct, or delete information.",
                  ].map((principle, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5"
                    >
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{principle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 05: Data Sharing & Carrier Disclosures */}
            <section id="data-sharing" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">05</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Data Sharing & Third-Party Disclosures
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  We do <strong className="text-foreground">not</strong> sell,
                  rent, or trade your personal data to advertisers or commercial
                  brokers. We share data only with trusted partners necessary to
                  fulfill transactions:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>
                    <strong className="text-foreground">
                      Telecommunication Operators:
                    </strong>{" "}
                    MTN Ghana, Telecel Ghana, and AT Ghana receive the recipient
                    phone number and requested bundle SKU to execute the top-up
                    on their core cellular switch.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Payment Service Providers:
                    </strong>{" "}
                    Licensed fintech aggregators and Mobile Money network
                    operators receive transaction amounts and MSISDNs to process
                    debits securely.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Law Enforcement & Regulators:
                    </strong>{" "}
                    Disclosures made only when formally mandated by a valid
                    court order, search warrant, or Bank of Ghana financial
                    intelligence directive.
                  </li>
                </ul>
              </div>
            </section>

            {/* 06: Security Measures & Encryption */}
            <section id="security" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">06</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Security Measures & Encryption
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  We implement robust technical and organizational security
                  safeguards designed to protect personal information against
                  loss, unauthorized access, destruction, or alteration:
                </p>
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
                  <p className="font-bold text-foreground flex items-center gap-2">
                    <Lock className="size-4 text-emerald-600" />
                    Security Controls in Place:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground font-medium">
                    <li>
                      All data transmitted between your browser and our servers
                      is protected using 256-bit Transport Layer Security
                      (TLS/SSL).
                    </li>
                    <li>
                      Account passwords and security PINs are hashed using
                      industry-standard cryptographic algorithms before database
                      storage.
                    </li>
                    <li>
                      Access to production databases is restricted to authorized
                      operations personnel via multi-factor authentication (MFA)
                      and audited VPN channels.
                    </li>
                    <li>
                      Continuous automated vulnerability scans and firewall
                      monitoring across all edge gateways.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 07: Data Retention & Storage */}
            <section id="retention" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">07</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Data Retention & Storage
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  Personal data is retained only for as long as is necessary to
                  accomplish the purposes described in this policy:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>
                    <strong className="text-foreground">
                      Active Account Information:
                    </strong>{" "}
                    Stored as long as your account remains active. You may
                    request account deletion at any time.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Financial & Order Records:
                    </strong>{" "}
                    Retained for a minimum of seven (7) years in compliance with
                    Bank of Ghana anti-money laundering (AML) and financial
                    record-keeping standards.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Technical Server Logs:
                    </strong>{" "}
                    Anonymized and automatically purged after ninety (90) days.
                  </li>
                </ul>
              </div>
            </section>

            {/* 08: Your Privacy Rights & Choices */}
            <section id="your-rights" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">08</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Your Privacy Rights & Choices
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  Under the Ghana Data Protection Act 2012, you possess clear
                  rights regarding your personal information:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>
                    <strong className="text-foreground">
                      Right of Access:
                    </strong>{" "}
                    Request a copy of the personal information we maintain
                    concerning your account.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Right to Rectification:
                    </strong>{" "}
                    Request correction of inaccurate, outdated, or incomplete
                    personal records.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Right to Erasure (“Right to be Forgotten”):
                    </strong>{" "}
                    Request deletion of your personal data where retention is no
                    longer legally mandated.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Right to Object:
                    </strong>{" "}
                    Object to processing for direct marketing or promotional
                    notifications at any time.
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground font-medium pt-1">
                  To exercise any of these rights, contact our Data Protection
                  Officer directly at{" "}
                  <strong className="text-foreground">
                    dpo@smartdatahub.gh
                  </strong>
                  .
                </p>
              </div>
            </section>

            {/* 09: Cookies & Tracking */}
            <section id="cookies" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">09</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Cookies & Tracking Technologies
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  We use essential session storage, cookies, and local client
                  storage strictly to remember your active user session, store
                  theme preferences, and protect against CSRF attacks. We do not
                  deploy aggressive third-party behavioral tracking cookies or
                  advertising pixels.
                </p>
              </div>
            </section>

            {/* 10: Data Protection Officer & Contact */}
            <section id="contact-dpo" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary ">10</span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Data Protection Officer & Contact Information
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  If you have inquiries, complaints, or formal requests
                  regarding this Privacy Policy or our compliance with the Data
                  Protection Commission of Ghana, please contact our team:
                </p>
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm">
                  <p className="font-bold text-foreground text-sm">
                    Data Protection Officer (DPO):
                  </p>
                  <p>
                    <strong className="text-foreground">Organization:</strong>{" "}
                    Smart Pixels Ventures (Smart Data Hub)
                  </p>
                  <p>
                    <strong className="text-foreground">Attn:</strong> Legal &
                    Data Protection Compliance Officer
                  </p>
                  <p>
                    <strong className="text-foreground">
                      Physical Office:
                    </strong>{" "}
                    Airport Residential Area, Accra, Ghana
                  </p>
                  <p>
                    <strong className="text-foreground">Direct Email:</strong>{" "}
                    dpo@smartdatahub.gh / privacy@smartdatahub.com
                  </p>
                  <p>
                    <strong className="text-foreground">
                      Customer Support:
                    </strong>{" "}
                    +233 24 419 2834
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      <PublicFooter
        onNavigateToLegal={onNavigateToLegal}
        onNavigatePublicTab={() => {}}
        theme={theme}
      />
    </div>
  );
}
