"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Scale,
  CreditCard,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { PublicFooter } from "../public/sections/PublicFooter";

interface TermsOfServiceProps {
  onBack: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToLegal?: (page: "terms" | "privacy") => void;
  onNavigatePublicTab?: (tab: any) => void;
}

const SECTIONS = [
  { id: "about", number: "01", title: "About Smart Data Hub" },
  { id: "services", number: "02", title: "Services We Provide" },
  {
    id: "eligibility",
    number: "03",
    title: "Eligibility & Account Registration",
  },
  { id: "ordering", number: "04", title: "Ordering, Pricing & Payment" },
  { id: "delivery", number: "05", title: "Delivery & Fulfillment SLA" },
  { id: "no-refund", number: "06", title: "No Refund & Cancellation Policy" },
  { id: "agent-terms", number: "07", title: "Agent & Reseller Program Terms" },
  { id: "user-conduct", number: "08", title: "User Conduct & Acceptable Use" },
  {
    id: "liability",
    number: "09",
    title: "Limitation of Liability & Warranties",
  },
  {
    id: "governing-law",
    number: "10",
    title: "Governing Law, Disputes & Contact",
  },
];

export function TermsOfService({
  onBack,
  onNavigateToPrivacy,
  onNavigateToLegal,
  onNavigatePublicTab,
}: TermsOfServiceProps) {
  const [activeSection, setActiveSection] = useState<string>("about");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1.5 text-sm font-semibold text-muted-foreground font-medium hover:text-foreground hover:bg-muted"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to home</span>
            </Button>

            <div className="h-4 w-px bg-border/80 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
                SDH
              </div>
              <span className="text-sm font-extrabold tracking-tight">
                Smart Data Hub
              </span>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider"
              >
                Legal
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToPrivacy && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToPrivacy}
                className="text-sm font-semibold h-8 rounded-lg"
              >
                Privacy Policy <ChevronRight className="size-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-bold text-primary uppercase tracking-wider mb-6">
            <Scale className="size-3.5" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
            Fair terms,
            <span> clear rules</span>
            <br />
            <span className="text-primary"> mutual respect</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            By accessing our website, creating an account, or purchasing any of
            our products and services, you agree to be bound by these Terms &
            Conditions. If you do not agree with any part, please do not use our
            services.
          </p>
        </div>
      </section>

      {/* Key principles */}
      <section className="border-b border-border bg-gradient-to-r from-primary/8 via-card to-amber-500/8">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "Act 843", label: "Data compliant", icon: ShieldCheck },
              { value: "3-5 days", label: "Refund window", icon: CreditCard },
              { value: "24/7", label: "Support access", icon: HelpCircle },
              {
                value: "Instant",
                label: "Suspension rights",
                icon: AlertTriangle,
              },
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

      {/* Main Content Layout with Sticky Sidebar */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          {/* Quick Table of Contents Sidebar */}
          <aside className="hidden lg:block sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-medium mb-3 px-2">
                Table of Contents
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
                      className={`font-mono text-[11px] ${activeSection === sec.id ? "text-primary-foreground/80" : "text-primary font-bold"}`}
                    >
                      {sec.number}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-border/80 space-y-2">
                <p className="text-[11px] text-muted-foreground font-medium leading-snug px-2">
                  Have questions about these terms?
                </p>
                <a
                  href="https://wa.me/233244192834?text=Hello%20Smart%20Data%20Hub%20Legal%20Inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
                >
                  <span>Chat with Legal Desk</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </aside>

          {/* Legal Body */}
          <main className="space-y-12">
            {/* Introductory Notice Banner */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed text-foreground space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <FileText className="size-4" />
                <span>Welcome to Smart Data Hub</span>
              </div>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                These Terms govern your use of our platform and digital services
                across Ghana. Please read them carefully — they explain how
                orders, our strict No Refund Policy, user eligibility, and your
                account work.
              </p>
            </div>

            {/* 01: About Smart Data Hub */}
            <section id="about" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  01
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  About Smart Data Hub
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  <strong className="text-foreground">Smart Data Hub</strong> is
                  a premier digital services platform operating under{" "}
                  <strong className="text-foreground">
                    Smart Pixels Ventures
                  </strong>
                  , duly registered and operating in accordance with the laws of
                  the Republic of Ghana. We provide convenient, automated access
                  to data bundles, airtime, utility bill settlements, television
                  subscriptions, examination result checker vouchers, and other
                  digital commerce products.
                </p>
                <p>
                  Our mission is simple —{" "}
                  <strong className="text-foreground">
                    “Smart Data, Seamless Connection.”
                  </strong>{" "}
                  We strive to provide affordable, reliable, and fast digital
                  services to customers, individual agents, and enterprise
                  partners across all sixteen (16) regions of Ghana.
                </p>
              </div>
            </section>

            {/* 02: Services We Provide */}
            <section id="services" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  02
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Services We Provide
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  Smart Data Hub currently offers the following core suites of
                  digital services:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    {
                      title: "Telecommunication Data Bundles",
                      desc: "Non-expiry, monthly, and SME bundles for MTN Ghana, Telecel Ghana, and AT (AirtelTigo) Ghana.",
                    },
                    {
                      title: "Airtime Top-ups",
                      desc: "Direct electronic credit recharge across all supported Ghanaian mobile carriers.",
                    },
                    {
                      title: "WAEC & School Vouchers",
                      desc: "WASSCE, BECE, NOV/DEC result checker pins, and school placement verification cards.",
                    },
                    {
                      title: "AFA Tariff Registration",
                      desc: "Agricultural Workers & Farmers Association subsidized mobile data package enrollment.",
                    },
                    {
                      title: "Utility Bill Payments",
                      desc: "Settlement of Electricity Company of Ghana (ECG) and Ghana Water Company Limited (GWCL) bills.",
                    },
                    {
                      title: "Agent Merchant Tools",
                      desc: "Wholesale data resale portals, personalized public storefronts, margin tracking, and instant MoMo commission payouts.",
                    },
                  ].map((srv) => (
                    <div
                      key={srv.title}
                      className="rounded-xl border border-border bg-card p-3.5 space-y-1"
                    >
                      <p className="text-sm font-bold text-foreground">
                        {srv.title}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {srv.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground font-medium pt-2">
                  All telecommunications services are provided in coordination
                  with authorized upstream carrier aggregators and licensed
                  telecom operators in Ghana. Availability of bundles and
                  pricing may be subject to network operational adjustments.
                </p>
              </div>
            </section>

            {/* 03: Eligibility & Account Registration */}
            <section id="eligibility" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  03
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Eligibility & Account Registration
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  To use Smart Data Hub, you must be at least 18 years of age or
                  have legal authorization from a parent or guardian to transact
                  online. By registering an account, you affirm that:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>
                    All information provided during registration (including full
                    name, active Ghanaian phone number, and valid email address)
                    is true, accurate, and up to date.
                  </li>
                  <li>
                    You are the legitimate owner or authorized signatory of the
                    Mobile Money wallet or bank account used to fund
                    transactions.
                  </li>
                  <li>
                    You will maintain the strict confidentiality of your account
                    credentials, passwords, and security PINs. You agree to
                    notify us immediately of any suspected unauthorized access.
                  </li>
                  <li>
                    For agent or reseller accounts, you agree to complete
                    identity verification (KYC) involving your Ghana Card
                    (National Identification Card) upon reaching regulatory
                    compliance thresholds.
                  </li>
                </ul>
              </div>
            </section>

            {/* 04: Ordering, Pricing & Payment */}
            <section id="ordering" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  04
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Ordering, Pricing & Payment
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  Prices for all data bundles, airtime packages, and digital
                  vouchers are quoted in Ghana Cedis (GH₵). Prices are displayed
                  clearly before you confirm and authorize any order.
                </p>
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="size-4 text-primary" />
                    Payment Rails & MoMo Processing
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    Payments are accepted via Bank of Ghana-regulated Mobile
                    Money channels (MTN MoMo, Telecel Cash, AT Money) and your
                    pre-funded Smart Data Hub Wallet. Orders are processed only
                    upon receiving verified payment authorization from the
                    payment gateway.
                  </p>
                </div>
                <p>
                  Smart Data Hub reserves the right to adjust product rates
                  dynamically based on prevailing wholesale tariffs set by
                  telecommunication operators. The price billed is always the
                  price confirmed at the exact time of order checkout.
                </p>
              </div>
            </section>

            {/* 05: Delivery & Fulfillment SLA */}
            <section id="delivery" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  05
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Delivery & Fulfillment SLA
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  Over 98% of data bundle and airtime orders are fulfilled
                  within{" "}
                  <strong className="text-foreground">15 to 45 seconds</strong>{" "}
                  via automated carrier gateways. However, external telecom
                  operator maintenance, gateway downtime, or unannounced carrier
                  upgrades may occasionally cause delays.
                </p>
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-sm">
                  <p className="font-bold text-foreground">
                    Standard Delivery Windows:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong className="text-foreground">Standard SLA:</strong>{" "}
                      15 seconds to 10 minutes under normal network load.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Network Latency Window:
                      </strong>{" "}
                      Up to 3 hours during upstream telecom scheduled
                      maintenance or peak congestions.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Automated Reconciliation:
                      </strong>{" "}
                      Orders exceeding 3 hours without carrier confirmation are
                      automatically flagged by our NOC desk for priority
                      dispatch or wallet credit.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 06: No Refund & Cancellation Policy */}
            <section id="no-refund" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-destructive font-mono">
                  06
                </span>
                <h2 className="text-2xl font-black tracking-tight text-destructive flex items-center gap-2">
                  <AlertTriangle className="size-6" />
                  No Refund & Cancellation Policy
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground font-medium">
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                  <p className="text-sm font-bold text-destructive uppercase tracking-wider">
                    Crucial Legal Notice on Digital Goods
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    Due to the immediate, non-recoverable electronic nature of
                    telecommunication data bundles, electronic airtime, and WAEC
                    digital vouchers, all sales are strictly FINAL and
                    NON-REFUNDABLE once delivered or processed by the telecom
                    network.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                    1. Incorrect Beneficiary Phone Numbers
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    It is the sole responsibility of the customer to ensure that
                    the recipient phone number entered during checkout is
                    correct, active, and registered with the appropriate telecom
                    operator. Once a data bundle or airtime credit has been
                    successfully credited to a phone number,{" "}
                    <strong className="text-foreground">
                      it cannot be reversed, retrieved, or refunded
                    </strong>{" "}
                    under any circumstance.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                    2. Unfulfillable Or Failed Orders
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    If an order is declared permanently unfulfillable due to
                    technical gateway failure or an inactive recipient SIM that
                    the carrier rejects:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      100% of the purchase amount will be credited back
                      immediately to your Smart Data Hub Wallet balance.
                    </li>
                    <li>
                      If you paid via Mobile Money without an account, our
                      support engineers will initiate an electronic MoMo
                      reversal to the originating wallet within 24 to 48
                      business hours following carrier reconciliation.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground">
                    3. Examination Vouchers
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    Serial Numbers and PINs for WAEC, BECE, and school placement
                    checkers are unique, single-use vouchers. Once generated or
                    displayed on screen, they cannot be exchanged or refunded.
                    In the rare event a PIN is defective prior to initial use,
                    our NOC team will verify with the examination body log and
                    issue a replacement PIN.
                  </p>
                </div>
              </div>
            </section>

            {/* 07: Agent & Reseller Program Terms */}
            <section id="agent-terms" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  07
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Agent & Reseller Program Terms
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  Users who enroll in the Smart Data Hub Agent / Reseller
                  Program are subject to specific business requirements:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>
                    <strong className="text-foreground">
                      Wholesale Rates:
                    </strong>{" "}
                    Discounted rates are provided to enable resellers to earn
                    commercial margins when servicing their retail customers.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Storefront Conduct:
                    </strong>{" "}
                    Resellers utilizing custom storefront subdomains (e.g.,
                    smartdatahub.com/store/your-name) must not misrepresent
                    their relationship with telecom operators or engage in
                    deceptive marketing.
                  </li>
                  <li>
                    <strong className="text-foreground">Payouts:</strong>{" "}
                    Commission payouts requested to Mobile Money numbers are
                    processed instantly or within 2 business hours subject to
                    standard telecom liquidity availability.
                  </li>
                  <li>
                    <strong className="text-foreground">Termination:</strong>{" "}
                    Smart Data Hub reserves the right to terminate reseller
                    privileges if fraudulent activities, chargeback abuse, or
                    tariff manipulation are detected.
                  </li>
                </ul>
              </div>
            </section>

            {/* 08: User Conduct & Acceptable Use */}
            <section id="user-conduct" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  08
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  User Conduct & Acceptable Use
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  You agree not to use Smart Data Hub for any of the following
                  prohibited activities:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  <li>
                    Engaging in unauthorized financial transactions, money
                    laundering, or processing funds derived from illegal
                    conduct.
                  </li>
                  <li>
                    Attempting to bypass security systems, probe
                    vulnerabilities, or scrape proprietary pricing or customer
                    data through automated bots without prior written approval.
                  </li>
                  <li>
                    Submitting false or fraudulent claims regarding failed
                    deliveries or duplicate Mobile Money deductions.
                  </li>
                  <li>
                    Impersonating another customer, carrier representative, or
                    Smart Data Hub administrator.
                  </li>
                </ul>
              </div>
            </section>

            {/* 09: Limitation of Liability & Warranties */}
            <section id="liability" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  09
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Limitation of Liability & Warranties
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  Smart Data Hub and Smart Pixels Ventures provide services on
                  an{" "}
                  <strong className="text-foreground">
                    “as is” and “as available”
                  </strong>{" "}
                  basis. While we maintain rigorous redundancy and carrier
                  bridge connections, we do not warrant that carrier networks
                  will be uninterrupted, error-free, or exempt from nationwide
                  telco outages.
                </p>
                <p>
                  To the maximum extent permitted by Ghanaian law, Smart Data
                  Hub shall not be liable for any direct, indirect, incidental,
                  special, or consequential damages resulting from loss of data,
                  telecom outages, delayed connectivity, or third-party service
                  provider failures. In all cases, our maximum aggregate
                  liability to you for any claim shall not exceed the actual
                  amount paid by you for the specific transaction giving rise to
                  the claim.
                </p>
              </div>
            </section>

            {/* 10: Governing Law, Disputes & Contact */}
            <section id="governing-law" className="space-y-4 scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border pb-3">
                <span className="text-2xl font-black text-primary font-mono">
                  10
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Governing Law, Disputes & Contact
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                <p>
                  These Terms and Conditions shall be governed by and construed
                  in accordance with the laws of the Republic of Ghana. Any
                  disputes arising out of or in connection with these Terms
                  shall first be submitted to mutual amicable resolution through
                  our designated customer complaints desk before escalation to
                  any court of competent jurisdiction in Accra, Ghana.
                </p>
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm">
                  <p className="font-bold text-foreground text-sm">
                    Official Entity & Contact Details:
                  </p>
                  <p>
                    <strong className="text-foreground">
                      Operating Company:
                    </strong>{" "}
                    Smart Pixels Ventures (trading as Smart Data Hub)
                  </p>
                  <p>
                    <strong className="text-foreground">
                      Headquarters & NOC Desk:
                    </strong>{" "}
                    Airport Residential Area, Accra, Greater Accra Region, Ghana
                  </p>
                  <p>
                    <strong className="text-foreground">
                      Support Hotline:
                    </strong>{" "}
                    +233 24 419 2834
                  </p>
                  <p>
                    <strong className="text-foreground">Official Email:</strong>{" "}
                    support@smartdatahub.com / legal@smartdatahub.gh
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
      />
    </div>
  );
}
