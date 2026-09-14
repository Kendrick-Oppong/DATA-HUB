"use client";
/* eslint-disable */
// @ts-nocheck
// Shared routing extracted from the original app.jsx / mobile-app.jsx (which each
// defined an identical AppRouter). Kept in one module so both roots reuse it.
import React from "react";
import { useStore } from "@/components/store";

import { BuyDataPage, BuyAirtimePage } from "@/components/buy";
import { StoreBuilderPage } from "@/components/store-builder";
import { StoreOrdersPage } from "@/components/store-orders";
import { ResultsCheckerPage, AfaPage, SmsPage, ApiPage } from "@/components/agent-services";
import { UtilitiesPage } from "@/components/utilities";
import { AdminAfa, AdminCheckers, AdminComplaints, AdminSenderIds } from "@/components/admin-manage";
import { AdminPricing, AdminOrders, AdminPayouts, AdminUsers, AdminDashboard, AdminAgents, AdminCommissions, AdminIncentives, AdminTransactions } from "@/components/admin";
import { AgentPricingPage, TransactionsPage, ComplaintsPage, WhatsNewPage, CommunityPage } from "@/components/agent-account";
import { HowToPage } from "@/components/how-to";
import { WalletPage, OrdersPage, ProfilePage, CustomerDashboard } from "@/components/customer";
import { CommissionsPage, WithdrawalsPage, CustomersPage, ResellerDashboard } from "@/components/reseller";
import { AnalyticsPage } from "@/components/analytics";
import { NotificationsPage } from "@/components/notifications";
import { AdminFailedBeneficiaries } from "@/components/failed-beneficiaries";

import { SiteNav, SiteFooter, HomePage } from "@/components/site";
import { AboutPage, ServicesPage, ResellerPage, FaqPage, ContactPage, CompliancePage, TermsPage } from "@/components/site-pages";

function AppRouter(page, role) {
  switch (page) {
    case "buy-data":   return BuyDataPage;
    case "buy-airtime":return BuyAirtimePage;
    case "my-store":   return StoreBuilderPage;
    case "store-orders": return StoreOrdersPage;
    case "results-checker": return ResultsCheckerPage;
    case "afa":        return role === "admin" ? AdminAfa : AfaPage;
    case "utilities":  return UtilitiesPage;
    // Agents compose and send; admins get the approvals queue + the platform-wide view.
    case "sms":        return role === "admin" ? AdminSenderIds : SmsPage;
    case "checkers":   return AdminCheckers;
    // Admin-only: the beneficiary tracker holds other agents' customers, so a non-admin
    // falls back to their own dashboard rather than seeing it.
    case "failed-beneficiaries":
      if (role === "admin") return AdminFailedBeneficiaries;
      return role === "reseller" ? ResellerDashboard : CustomerDashboard;
    case "api":        return ApiPage;
    case "pricing":    return role === "admin" ? AdminPricing : AgentPricingPage;
    // Admin-only page. A non-admin can't reach it from their nav, but fall back to their
    // own dashboard rather than rendering nothing if they ever land on it.
    case "referrals":  if (role === "admin") return AdminIncentives; return role === "reseller" ? ResellerDashboard : CustomerDashboard;
    case "transactions": return role === "admin" ? AdminTransactions : TransactionsPage;
    case "complaints": return role === "admin" ? AdminComplaints : ComplaintsPage;
    case "notifications": return NotificationsPage;
    case "whats-new":  return WhatsNewPage;
    case "how-to":     return HowToPage;
    case "community":  return CommunityPage;
    case "wallet":     return WalletPage;
    case "orders":     return role === "admin" ? AdminOrders : OrdersPage;
    case "profile":    return ProfilePage;
    case "commissions":return role === "admin" ? AdminCommissions : CommissionsPage;
    case "agents":     return AdminAgents;
    case "analytics":  return AnalyticsPage;
    case "customers":  return CustomersPage;
    case "withdrawals":return role === "admin" ? AdminPayouts : WithdrawalsPage;
    case "users":      return AdminUsers;
    case "dashboard":
    default:
      if (role === "admin") return AdminDashboard;
      if (role === "reseller") return ResellerDashboard;
      return CustomerDashboard;
  }
}

const SITE_PAGES = { home: () => <HomePage />, about: () => <AboutPage />, services: () => <ServicesPage />, reseller: () => <ResellerPage />, faq: () => <FaqPage />, contact: () => <ContactPage />, compliance: () => <CompliancePage />, terms: () => <TermsPage /> };

function SiteShell() {
  const { sitePage } = useStore();
  const Page = SITE_PAGES[sitePage] || SITE_PAGES.home;
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteNav />
      <Page />
      <SiteFooter />
    </div>
  );
}

export { AppRouter, SITE_PAGES, SiteShell };
