import React, { useState, useEffect, useCallback } from "react";
import {
  UserRole,
  AppTheme,
  UserAccount,
  Order,
  Transaction,
  AfaApplication,
  ResultCheckerProduct,
  TelecomGateway,
  AgentStoreConfig,
  Complaint,
} from "./types";
import {
  initialBundles,
  mockOrders,
  mockTransactions,
  mockAfaApplications,
  mockResultCheckers,
  mockGateways,
  mockAgentStore,
  mockComplaints,
  loadFromStorage,
  saveToStorage,
} from "./mockData";

// Common UI
import { Navbar } from "./components/common/Navbar";
import { Sidebar } from "./components/common/Sidebar";
import { CommandMenu } from "./components/common/CommandMenu";
import { ReceiptModal } from "./components/common/ReceiptModal";
import { SecurityPinsModal } from "./components/common/SecurityPinsModal";

// Dedicated Auth & Security Screens
import { AuthPage, AuthSuccessPayload } from "./components/auth/AuthPage";
import { AdminPinGate } from "./components/auth/AdminPinGate";

// Legal Pages
import { TermsOfService } from "./components/legal/TermsOfService";
import { PrivacyPolicy } from "./components/legal/PrivacyPolicy";

// Dedicated Public Marketing Site & Navigation
import { PublicMarketingSite } from "./components/public/PublicMarketingSite";
import { PublicNavbar } from "./components/public/PublicNavbar";

// Customer Flows
import { CustomerDashboard } from "./components/customer/CustomerDashboard";
import { BuyDataFlow } from "./components/customer/BuyDataFlow";
import { BuyAirtimeFlow } from "./components/customer/BuyAirtimeFlow";
import { ResultsCheckerFlow } from "./components/customer/ResultsCheckerFlow";
import { AfaRegistrationFlow } from "./components/customer/AfaRegistrationFlow";
import { UtilitiesFlow } from "./components/customer/UtilitiesFlow";
import { CustomerWalletOrders } from "./components/customer/CustomerWalletOrders";

// Agent Hub
import { AgentDashboard } from "./components/agent/AgentDashboard";
import { MyStoreBuilder } from "./components/agent/MyStoreBuilder";
import { AgentCommerce } from "./components/agent/AgentCommerce";

// Admin Ops Console
import { AdminOperations } from "./components/admin/AdminOperations";

// Public Storefront
import { PublicStorefront } from "./components/storefront/PublicStorefront";
import FundWalletModal from "./components/common/FundWalletModal";
import { DEMO_ACCOUNTS } from "./components/auth/auth.demo";

export type AppRoute =
  | { type: "public"; tab: string }
  | {
      type: "auth";
      mode:
        | "sign-in"
        | "sign-up"
        | "otp"
        | "forgot-password"
        | "new-password"
        | "two-factor"
        | "kyc-verify";
      redirectTargetRole?: UserRole;
      redirectReason?: string | null;
    }
  | { type: "storefront" }
  | { type: "dashboard"; role: "customer" | "agent" | "admin"; tab: string }
  | { type: "legal"; page: "terms" | "privacy" };

function parsePathToRoute(pathname: string, search = ""): AppRoute {
  const clean = pathname.replace(/\/$/, "") || "/";
  if (clean.startsWith("/auth")) {
    if (
      clean.includes("sign-up") ||
      clean.includes("signup") ||
      clean.includes("register")
    ) {
      return { type: "auth", mode: "sign-up" };
    }
    if (
      clean.includes("sign-in") ||
      clean.includes("signin") ||
      clean.includes("login")
    ) {
      return { type: "auth", mode: "sign-in" };
    }
    if (clean.includes("otp")) {
      return { type: "auth", mode: "otp" };
    }
    if (clean.includes("forgot") || clean.includes("reset")) {
      return { type: "auth", mode: "forgot-password" };
    }
    if (clean.includes("new-password")) {
      return { type: "auth", mode: "new-password" };
    }
    return { type: "auth", mode: "sign-in" };
  }
  if (clean.startsWith("/terms") || clean.includes("/terms-of-service")) {
    return { type: "legal", page: "terms" };
  }
  if (clean.startsWith("/privacy") || clean.includes("/privacy-policy")) {
    return { type: "legal", page: "privacy" };
  }
  if (clean.startsWith("/store") || clean.startsWith("/storefront")) {
    return { type: "storefront" };
  }
  if (clean.startsWith("/admin")) {
    return { type: "dashboard", role: "admin", tab: "gateways" };
  }
  if (clean.startsWith("/agent")) {
    return { type: "dashboard", role: "agent", tab: "overview" };
  }
  if (clean.startsWith("/customer")) {
    return { type: "dashboard", role: "customer", tab: "overview" };
  }
  const publicTab = new URLSearchParams(search).get("tab");
  const validPublicTabs = [
    "home",
    "services",
    "agent",
    "track",
    "faq",
    "about",
    "contact",
  ];
  return {
    type: "public",
    tab: publicTab && validPublicTabs.includes(publicTab) ? publicTab : "home",
  };
}

export default function App() {
  // Theme state (supports 6 themes: light, dark, sunset-amber, emerald-matrix, royal-indigo, ruby-red)
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem("sdh_theme") as AppTheme) || "ruby-red";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      "dark",
      "theme-sunset-amber",
      "theme-emerald-matrix",
      "theme-royal-indigo",
      "theme-ruby-red",
    );
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "sunset-amber") {
      root.classList.add("dark", "theme-sunset-amber");
    } else if (theme === "emerald-matrix") {
      root.classList.add("dark", "theme-emerald-matrix");
    } else if (theme === "royal-indigo") {
      root.classList.add("dark", "theme-royal-indigo");
    } else if (theme === "ruby-red") {
      root.classList.add("dark", "theme-ruby-red");
    }
    localStorage.setItem("sdh_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme as AppTheme);
  };

  // User Authentication & Demo Account State
  const [user, setUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("sdh_auth_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEMO_ACCOUNTS.customer;
  });

  // Security Credentials Reference Dialog
  const [isSecurityPinsOpen, setIsSecurityPinsOpen] = useState(false);

  // Admin Route Guard (Clearance PIN: 0000 / 7788)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("sdh_admin_unlocked") === "true";
  });

  // Current Route State
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window !== "undefined") {
      return parsePathToRoute(window.location.pathname, window.location.search);
    }
    return { type: "public", tab: "home" };
  });

  // Sync browser URL with routing
  const navigateTo = useCallback((newRoute: AppRoute, pushHistory = true) => {
    setRoute(newRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pushHistory && typeof window !== "undefined") {
      let path = "/";
      let search = "";
      if (newRoute.type === "public" && newRoute.tab !== "home") {
        search = `?tab=${encodeURIComponent(newRoute.tab)}`;
      } else if (newRoute.type === "auth") {
        path = `/auth/${newRoute.mode}`;
      } else if (newRoute.type === "legal") {
        path = newRoute.page === "terms" ? "/terms" : "/privacy";
      } else if (newRoute.type === "storefront") {
        path = "/storefront";
      } else if (newRoute.type === "dashboard") {
        path = `/${newRoute.role}/${newRoute.tab}`;
      }
      if (
        window.location.pathname !== path ||
        window.location.search !== search
      ) {
        window.history.pushState(null, "", `${path}${search}`);
      }
    }
  }, []);

  // Listen to popstate (Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      setRoute(
        parsePathToRoute(window.location.pathname, window.location.search),
      );
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Real-time synchronization across browser tabs for store config & wallet
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sdh_store_config" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setStoreConfig(parsed);
        } catch {
          // ignore
        }
      }
      if (e.key === "sdh_wallet_balance" && e.newValue) {
        const parsedVal = parseFloat(e.newValue);
        if (!isNaN(parsedVal)) setWalletBalance(parsedVal);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Nav helpers
  const navigateToPublic = (tab = "home") => {
    navigateTo({ type: "public", tab });
  };

  const navigateToAuth = (
    mode:
      | "sign-in"
      | "sign-up"
      | "otp"
      | "forgot-password"
      | "new-password"
      | "two-factor"
      | "kyc-verify",
    redirectTarget?: UserRole,
    reason?: string | null,
  ) => {
    navigateTo({
      type: "auth",
      mode,
      redirectTargetRole: redirectTarget,
      redirectReason: reason,
    });
  };

  const navigateToLegal = (page: "terms" | "privacy") => {
    navigateTo({ type: "legal", page });
  };

  const navigateToDashboard = (
    role: "customer" | "agent" | "admin",
    tab?: string,
  ) => {
    // ROUTE GUARD: unauthenticated user trying to access dashboard
    if (!user) {
      navigateToAuth(
        "sign-in",
        role,
        `Authentication Required: You must be signed in to access the ${role.toUpperCase()} dashboard. Please sign in or register.`,
      );
      return;
    }

    const defaultTab = tab || (role === "admin" ? "gateways" : "overview");
    navigateTo({ type: "dashboard", role, tab: defaultTab });
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("sdh_auth_user");
    setIsAdminUnlocked(false);
    localStorage.setItem("sdh_admin_unlocked", "false");
    navigateToPublic("home");
  };

  const handleAuthSuccess = (payload: AuthSuccessPayload | UserAccount) => {
    let fullUser: UserAccount;
    if ("role" in payload && "isKycVerified" in payload) {
      fullUser = payload as UserAccount;
    } else {
      const p = payload as AuthSuccessPayload;
      fullUser = {
        id: `usr-${Date.now()}`,
        name: p.name,
        phone: p.phone,
        email: p.email || `${p.phone}@sdh.com.gh`,
        role: p.role,
        isKycVerified: !!p.ghanaCard,
        ghanaCardNumber: p.ghanaCard || "GHA-721948192-3",
        securityPin: "2026",
      };
    }

    setUser(fullUser);
    localStorage.setItem("sdh_auth_user", JSON.stringify(fullUser));

    if (fullUser.role === "admin") {
      setIsAdminUnlocked(true);
      localStorage.setItem("sdh_admin_unlocked", "true");
    }

    // Redirect to target role if requested, else user's primary role
    const targetRole =
      route.type === "auth" && route.redirectTargetRole
        ? route.redirectTargetRole
        : fullUser.role === "public"
          ? "customer"
          : fullUser.role;

    if (targetRole === "public") {
      navigateToPublic("home");
    } else {
      navigateToDashboard(targetRole as "customer" | "agent" | "admin");
    }
  };

  const handleAdminPinSubmit = (pin: string) => {
    const authorized = pin === "0000" || pin === "7788";
    if (authorized) {
      setIsAdminUnlocked(true);
      localStorage.setItem("sdh_admin_unlocked", "true");
    }
    return authorized;
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    localStorage.setItem("sdh_admin_unlocked", "false");
  };

  // Sidebar collapse & mobile drawer state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUser(updatedUser);
    localStorage.setItem("sdh_auth_user", JSON.stringify(updatedUser));
  };

  // App Core State (persisted to localStorage)
  const [walletBalance, setWalletBalance] = useState<number>(() =>
    loadFromStorage("sdh_wallet_balance", 179.0),
  );
  const [commissionBalance, setCommissionBalance] = useState<number>(() =>
    loadFromStorage("sdh_commission_balance", 185.5),
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage("sdh_orders_v4", mockOrders),
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage("sdh_transactions_v2", mockTransactions),
  );
  const [afaApplications, setAfaApplications] = useState<AfaApplication[]>(() =>
    loadFromStorage("sdh_afa_apps", mockAfaApplications),
  );
  const [checkers, setCheckers] = useState<ResultCheckerProduct[]>(() =>
    loadFromStorage("sdh_checkers", mockResultCheckers),
  );
  const [gateways, setGateways] = useState<TelecomGateway[]>(() =>
    loadFromStorage("sdh_gateways", mockGateways),
  );
  const [storeConfig, setStoreConfig] = useState<AgentStoreConfig>(() =>
    loadFromStorage("sdh_store_config", mockAgentStore),
  );
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    loadFromStorage("sdh_complaints", mockComplaints),
  );

  // Modals
  const [isFundWalletOpen, setIsFundWalletOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] =
    useState<Order | null>(null);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  const handleOpenStorefrontNewTab = useCallback(() => {
    if (typeof window !== "undefined") {
      const handle = storeConfig?.handle || "store";
      const url = `${window.location.origin}/store/${handle}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [storeConfig?.handle]);

  // Tab change within current dashboard
  const handleTabChange = (tab: string) => {
    if (route.type === "dashboard") {
      navigateTo({ ...route, tab });
    }
  };

  // Role change from Navigation
  const handleRoleChange = (role: UserRole) => {
    if (role === "public") {
      navigateToPublic("home");
    } else if (role === "storefront") {
      navigateTo({ type: "storefront" });
    } else {
      navigateToDashboard(role as "customer" | "agent" | "admin");
    }
  };

  // Order Creation Handler
  const handleOrderCreated = (newOrder: Order) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveToStorage("sdh_orders_v4", updatedOrders);

    if (newOrder.paymentMethod === "wallet") {
      const newBal = Math.max(0, walletBalance - newOrder.amount);
      setWalletBalance(newBal);
      saveToStorage("sdh_wallet_balance", newBal);

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        reference: `TX-${newOrder.reference}`,
        date: newOrder.date,
        type: "debit",
        category: "purchase",
        amount: newOrder.amount,
        fee: 0,
        balanceAfter: newBal,
        description: `Payment for ${newOrder.productName}`,
        channel: "SDH Wallet",
        status: "completed",
      };
      const updatedTx = [newTx, ...transactions];
      setTransactions(updatedTx);
      saveToStorage("sdh_transactions_v2", updatedTx);
    }

    if (newOrder.agentMargin && newOrder.agentMargin > 0) {
      const newComm = commissionBalance + newOrder.agentMargin;
      setCommissionBalance(newComm);
      saveToStorage("sdh_commission_balance", newComm);
    }
  };

  // Wallet Funding Handler
  const handleFundSuccess = (
    amount: number,
    channel: string,
    reference: string,
  ) => {
    const newBal = walletBalance + amount;
    setWalletBalance(newBal);
    saveToStorage("sdh_wallet_balance", newBal);

    const newTx: Transaction = {
      id: `tx-fund-${Date.now()}`,
      reference,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      type: "credit",
      category: "wallet_funding",
      amount,
      fee: 0,
      balanceAfter: newBal,
      description: `Wallet top-up via ${channel}`,
      channel,
      status: "completed",
    };
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    saveToStorage("sdh_transactions_v2", updatedTx);
  };

  // Agent Commission Withdrawal
  const handleWithdrawSuccess = (amount: number, reference: string) => {
    const newComm = Math.max(0, commissionBalance - amount);
    setCommissionBalance(newComm);
    saveToStorage("sdh_commission_balance", newComm);

    const newTx: Transaction = {
      id: `tx-wdr-${Date.now()}`,
      reference,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      type: "debit",
      category: "withdrawal",
      amount,
      fee: 0,
      balanceAfter: newComm,
      description: `Commission Payout to Mobile Money`,
      channel: "Mobile Money Cashout",
      status: "completed",
    };
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    saveToStorage("sdh_transactions_v2", updatedTx);
  };

  // AFA Submission
  const handleAfaSubmitted = (app: AfaApplication) => {
    const updated = [app, ...afaApplications];
    setAfaApplications(updated);
    saveToStorage("sdh_afa_apps", updated);

    const newBal = Math.max(0, walletBalance - app.fee);
    setWalletBalance(newBal);
    saveToStorage("sdh_wallet_balance", newBal);

    const newTx: Transaction = {
      id: `tx-afa-${Date.now()}`,
      reference: `TX-${app.reference}`,
      date: app.dateSubmitted,
      type: "debit",
      category: "purchase",
      amount: app.fee,
      fee: 0,
      balanceAfter: newBal,
      description: `AFA Registration Processing Fee (${app.fullName})`,
      channel: "SDH Wallet",
      status: "completed",
    };
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    saveToStorage("sdh_transactions_v2", updatedTx);
  };

  // Gateway Simulation Toggle
  const handleToggleGateway = (id: string) => {
    const updated = gateways.map((gw) => {
      if (gw.id === id) {
        return {
          ...gw,
          status: gw.status === "online" ? "degraded" : "online",
          latencyMs: gw.status === "online" ? 840 : 42,
          successRate: gw.status === "online" ? 88.5 : 99.8,
        } as TelecomGateway;
      }
      return gw;
    });
    setGateways(updated);
    saveToStorage("sdh_gateways", updated);
  };

  // Order Retry (Admin)
  const handleRetryOrder = (orderId: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: "delivered" as const,
          deliveryTimeline: [
            ...(o.deliveryTimeline || []),
            {
              step: "Admin Manual EVD Retry Dispatched",
              timestamp: "10:05:00",
              status: "completed" as const,
              note: "Switched carrier node",
            },
          ],
        };
      }
      return o;
    });
    setOrders(updated);
    saveToStorage("sdh_orders_v4", updated);
  };

  // Order Refund (Admin)
  const handleRefundOrder = (orderId: string) => {
    const orderToRefund = orders.find((o) => o.id === orderId);
    if (!orderToRefund) return;

    const newBal = walletBalance + orderToRefund.amount;
    setWalletBalance(newBal);
    saveToStorage("sdh_wallet_balance", newBal);

    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: "failed" as const };
      }
      return o;
    });
    setOrders(updated);
    saveToStorage("sdh_orders_v4", updated);

    const refundTx: Transaction = {
      id: `tx-ref-${Date.now()}`,
      reference: `RFND-${orderToRefund.reference}`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      type: "credit",
      category: "refund",
      amount: orderToRefund.amount,
      fee: 0,
      balanceAfter: newBal,
      description: `Refund for Failed Order ${orderToRefund.reference}`,
      channel: "SDH Refund Engine",
      status: "completed",
    };
    const updatedTx = [refundTx, ...transactions];
    setTransactions(updatedTx);
    saveToStorage("sdh_transactions_v2", updatedTx);
  };

  // AFA Status Update (Admin)
  const handleUpdateAfaStatus = (
    id: string,
    status: "approved" | "rejected" | "needs_correction",
  ) => {
    const updated = afaApplications.map((a) => {
      if (a.id === id) return { ...a, status };
      return a;
    });
    setAfaApplications(updated);
    saveToStorage("sdh_afa_apps", updated);
  };

  // Add Voucher Stock (Admin)
  const handleAddVoucherStock = (checkerId: string, count: number) => {
    const updated = checkers.map((c) => {
      if (c.id === checkerId) return { ...c, stockCount: c.stockCount + count };
      return c;
    });
    setCheckers(updated);
    saveToStorage("sdh_checkers", updated);
  };

  // Update Store Config (Agent)
  const handleUpdateStoreConfig = (newConfig: AgentStoreConfig) => {
    setStoreConfig(newConfig);
    saveToStorage("sdh_store_config", newConfig);
  };

  // Complaints Support Handlers
  const handleAddComplaint = (ticket: Complaint) => {
    const updated = [ticket, ...complaints];
    setComplaints(updated);
    saveToStorage("sdh_complaints", updated);
  };

  const handleReplyComplaint = (ticketId: string, text: string) => {
    const updated = complaints.map((c) => {
      if (c.id === ticketId) {
        return {
          ...c,
          lastUpdated: "Just now",
          messages: [
            ...c.messages,
            {
              id: `msg-${Date.now()}`,
              sender: "customer" as const,
              senderName: user?.name || "Kojo Mensah",
              text,
              timestamp: "Just now",
            },
          ],
        };
      }
      return c;
    });
    setComplaints(updated);
    saveToStorage("sdh_complaints", updated);
  };

  // Repeat Order shortcut
  const handleRepeatOrder = (order: Order) => {
    if (!user) {
      navigateToAuth("sign-in", "customer");
      return;
    }
    if (order.serviceType === "data") {
      navigateToDashboard("customer", "buy-data");
    } else if (order.serviceType === "airtime") {
      navigateToDashboard("customer", "buy-airtime");
    } else {
      navigateToDashboard("customer", "results-checker");
    }
  };

  // ==========================================
  // ROUTING RENDER LOGIC
  // ==========================================

  // 1. DEDICATED AUTH SCREEN (/auth, /auth/login, /auth/register, /auth/otp, /auth/reset-pin)
  // ABSOLUTELY NO DASHBOARD NAVBAR!
  if (route.type === "auth") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
        <AuthPage
          mode={route.mode}
          redirectReason={route.redirectReason}
          onAuthSuccess={handleAuthSuccess}
          onBackToPublic={() => navigateToPublic("home")}
          onNavigateToAuth={navigateToAuth}
          onNavigateToLegal={navigateToLegal}
        />

        {/* Credentials helper modal */}
        <SecurityPinsModal
          isOpen={isSecurityPinsOpen}
          onClose={() => setIsSecurityPinsOpen(false)}
          onSelectAccount={(role) => {
            const acc = DEMO_ACCOUNTS[role];
            if (acc) {
              handleAuthSuccess(acc);
              setIsSecurityPinsOpen(false);
            }
          }}
        />
      </div>
    );
  }

  // 2. PUBLIC MARKETING SITE (/)
  // ABSOLUTELY NO DASHBOARD NAVBAR! USES DEDICATED PublicNavbar.
  if (route.type === "public") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
        <PublicNavbar
          user={user}
          activeTab={route.tab as any}
          onNavigateToPublic={navigateToPublic}
          onNavigateToAuth={(mode) => navigateToAuth(mode || "sign-in")}
          onNavigateToDashboard={(role) => {
            if (role === "storefront") {
              navigateTo({ type: "storefront" });
            } else if (role !== "public") {
              navigateToDashboard(role);
            }
          }}
          onSignOut={handleSignOut}
          theme={theme}
          onSetTheme={handleSetTheme}
          onOpenSecurityPins={() => setIsSecurityPinsOpen(true)}
        />

        <main className="flex-1">
          <PublicMarketingSite
            bundles={initialBundles}
            activeTab={route.tab as any}
            orders={orders}
            onNavigate={(role, tab) => {
              if (role === "public") {
                navigateToPublic(tab);
              } else {
                navigateToDashboard(
                  role as "customer" | "agent" | "admin",
                  tab,
                );
              }
            }}
            onStartPurchase={(bundleId, network) => {
              if (!user) {
                navigateToAuth(
                  "sign-in",
                  "customer",
                  "Please sign in or register to complete your instant data purchase.",
                );
              } else {
                navigateToDashboard("customer", "buy-data");
              }
            }}
            onOpenOrderTracker={(refOrPhone) => {
              if (!user) {
                navigateToAuth(
                  "sign-in",
                  "customer",
                  "Sign in to audit your real-time telecom orders.",
                );
              } else {
                navigateToDashboard("customer", "orders");
              }
            }}
            onApplyAgent={() => {
              if (!user) {
                navigateToAuth(
                  "sign-up",
                  "agent",
                  "Register your reseller business account to activate your branded store.",
                );
              } else {
                navigateToDashboard("agent", "my-store");
              }
            }}
            onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
            onOpenAuth={(mode) =>
              navigateToAuth(mode === "signup" ? "sign-up" : "sign-in")
            }
            onOpenSecurityPins={() => setIsSecurityPinsOpen(true)}
            onNavigateToLegal={navigateToLegal}
          />
        </main>

        <ReceiptModal
          isOpen={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          order={selectedReceiptOrder}
        />

        <SecurityPinsModal
          isOpen={isSecurityPinsOpen}
          onClose={() => setIsSecurityPinsOpen(false)}
          onSelectAccount={(role) => {
            const acc = DEMO_ACCOUNTS[role];
            if (acc) {
              handleAuthSuccess(acc);
              setIsSecurityPinsOpen(false);
            }
          }}
        />
      </div>
    );
  }

  // 3. PUBLIC AGENT STOREFRONT (/storefront)
  if (route.type === "storefront") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
        <PublicStorefront
          storeConfig={storeConfig}
          bundles={initialBundles}
          onOrderCreated={handleOrderCreated}
          onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
          onSwitchToSDH={() => navigateToPublic("home")}
          onUpdateStoreConfig={handleUpdateStoreConfig}
          onNavigatePublicTab={navigateToPublic}
          onNavigateToLegal={navigateToLegal}
        />

        <ReceiptModal
          isOpen={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          order={selectedReceiptOrder}
        />
      </div>
    );
  }

  // 4. LEGAL PAGES (/terms, /privacy)
  if (route.type === "legal") {
    if (route.page === "terms") {
      return (
        <TermsOfService
          user={user}
          onBack={() => navigateToPublic("home")}
          onNavigateToPrivacy={() => navigateToLegal("privacy")}
          onNavigateToLegal={navigateToLegal}
          onNavigatePublicTab={navigateToPublic}
          onNavigateToAuth={(mode) =>
            navigateToAuth((mode || "sign-in") as any)
          }
          onNavigateToDashboard={(role) => {
            if (role === "storefront") {
              navigateTo({ type: "storefront" });
            } else if (role !== "public") {
              navigateToDashboard(role as any);
            }
          }}
          onSignOut={handleSignOut}
          theme={theme}
          onSetTheme={handleSetTheme}
          onOpenSecurityPins={() => setIsSecurityPinsOpen(true)}
        />
      );
    }
    return (
      <PrivacyPolicy
        user={user}
        onBack={() => navigateToPublic("home")}
        onNavigateToTerms={() => navigateToLegal("terms")}
        onNavigateToLegal={navigateToLegal}
        onNavigatePublicTab={navigateToPublic}
        onNavigateToAuth={(mode) => navigateToAuth((mode || "sign-in") as any)}
        onNavigateToDashboard={(role) => {
          if (role === "storefront") {
            navigateTo({ type: "storefront" });
          } else if (role !== "public") {
            navigateToDashboard(role as any);
          }
        }}
        onSignOut={handleSignOut}
        theme={theme}
        onSetTheme={handleSetTheme}
        onOpenSecurityPins={() => setIsSecurityPinsOpen(true)}
      />
    );
  }

  // 5. DASHBOARD SHELL (/customer, /agent, /admin)
  // STRICT ROUTE GUARD: If not authenticated, DO NOT RENDER DASHBOARD OR DASHBOARD NAVBAR!
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
        <AuthPage
          mode="sign-in"
          redirectReason="Authentication Required: You must be signed in to access the Smart Data Hub dashboard. Please enter your phone number and password, or register a new account."
          onAuthSuccess={handleAuthSuccess}
          onBackToPublic={() => navigateToPublic("home")}
          onNavigateToAuth={navigateToAuth}
        />
        <SecurityPinsModal
          isOpen={isSecurityPinsOpen}
          onClose={() => setIsSecurityPinsOpen(false)}
          onSelectAccount={(role) => {
            const acc = DEMO_ACCOUNTS[role];
            if (acc) {
              handleAuthSuccess(acc);
              setIsSecurityPinsOpen(false);
            }
          }}
        />
      </div>
    );
  }

  // Type guard for dashboard routes
  if (route.type !== "dashboard") {
    return null;
  }

  const currentRole = route.role;
  const activeTab = route.tab;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Dashboard Top Navbar - ONLY shown for authenticated dashboard views */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        walletBalance={walletBalance}
        onOpenFundWallet={() => setIsFundWalletOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSetTheme={handleSetTheme}
        onOpenCommand={() => setIsCommandMenuOpen(true)}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        onOpenNotifications={() => {
          navigateToDashboard("customer", "notifications");
        }}
        user={user}
        onOpenAuth={(mode) =>
          navigateToAuth(mode === "signup" ? "sign-up" : "sign-in")
        }
        onLogout={handleSignOut}
        onOpenSecurityPins={() => setIsSecurityPinsOpen(true)}
        isAdminUnlocked={isAdminUnlocked}
        onLockAdmin={handleLockAdmin}
        onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileSidebarOpen}
      />

      {/* Main Authenticated App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Left Sidebar */}
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSelectTab={handleTabChange}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          unreadNotifications={0}
          openComplaintsCount={
            complaints.filter(
              (c) => c.status === "open" || c.status === "investigating",
            ).length
          }
          user={user}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onSignOut={handleSignOut}
          storeStatus={storeConfig.status}
        />

        {/* Dynamic Content Main Pane */}
        <main
          className={`${sidebarCollapsed ? "md:ml-20" : "md:ml-64"} ml-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 md:max-w-[95%] mx-auto w-full transition-[margin] duration-200`}
        >
          {/* CUSTOMER PORTAL */}
          {currentRole === "customer" && (
            <>
              {(activeTab === "overview" || activeTab === "dashboard") && (
                <CustomerDashboard
                  walletBalance={walletBalance}
                  onOpenFundWallet={() => setIsFundWalletOpen(true)}
                  onNavigateTab={handleTabChange}
                  orders={orders}
                  transactions={transactions}
                  onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
                  onRepeatOrder={handleRepeatOrder}
                />
              )}

              {activeTab === "buy-data" && (
                <BuyDataFlow
                  bundles={initialBundles}
                  walletBalance={walletBalance}
                  onOrderCreated={handleOrderCreated}
                  onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
                />
              )}

              {activeTab === "buy-airtime" && (
                <BuyAirtimeFlow
                  walletBalance={walletBalance}
                  onOrderCreated={handleOrderCreated}
                  onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
                />
              )}

              {activeTab === "results-checker" && (
                <ResultsCheckerFlow
                  checkers={checkers}
                  walletBalance={walletBalance}
                  orders={orders}
                  onOrderCreated={handleOrderCreated}
                  onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
                />
              )}

              {activeTab === "afa" && (
                <AfaRegistrationFlow
                  walletBalance={walletBalance}
                  onApplicationSubmitted={handleAfaSubmitted}
                  applications={afaApplications}
                />
              )}

              {activeTab === "utilities" && (
                <UtilitiesFlow
                  walletBalance={walletBalance}
                  onOrderCreated={handleOrderCreated}
                  onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
                />
              )}

              {(activeTab === "wallet" ||
                activeTab === "orders" ||
                activeTab === "complaints" ||
                activeTab === "guides" ||
                activeTab === "profile" ||
                activeTab === "notifications") && (
                <CustomerWalletOrders
                  view={activeTab as any}
                  walletBalance={walletBalance}
                  onOpenFundWallet={() => setIsFundWalletOpen(true)}
                  orders={orders}
                  transactions={transactions}
                  complaints={complaints}
                  onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
                  onAddComplaint={handleAddComplaint}
                  onReplyComplaint={handleReplyComplaint}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  onSetTheme={handleSetTheme}
                  onOpenSecurityPins={() => setIsSecurityPinsOpen(true)}
                  user={user}
                  onUpdateUser={handleUpdateUser}
                />
              )}
            </>
          )}

          {/* AGENT RESELLER HUB */}
          {currentRole === "agent" && (
            <>
              {(activeTab === "overview" || activeTab === "dashboard") && (
                <AgentDashboard
                  storeConfig={storeConfig}
                  onNavigateTab={handleTabChange}
                  onOpenStorefront={handleOpenStorefrontNewTab}
                  orders={orders}
                  commissionBalance={commissionBalance}
                />
              )}

              {activeTab === "my-store" && (
                <MyStoreBuilder
                  storeConfig={storeConfig}
                  onUpdateStoreConfig={handleUpdateStoreConfig}
                  onOpenStorefront={handleOpenStorefrontNewTab}
                  bundles={initialBundles}
                  orders={orders}
                />
              )}

              {(activeTab === "store-orders" ||
                activeTab === "pricing" ||
                activeTab === "analytics" ||
                activeTab === "bulk-sms" ||
                activeTab === "withdraw" ||
                activeTab === "verify") && (
                <AgentCommerce
                  view={activeTab as any}
                  storeConfig={storeConfig}
                  bundles={initialBundles}
                  orders={orders}
                  commissionBalance={commissionBalance}
                  onWithdrawSuccess={handleWithdrawSuccess}
                  onUpdateOrders={(updatedOrders) => {
                    setOrders(updatedOrders);
                    saveToStorage("sdh_orders_v4", updatedOrders);
                  }}
                  onNavigateTab={handleTabChange}
                />
              )}
            </>
          )}

          {/* ADMIN OPERATIONS CONSOLE WITH CLEARANCE PIN GUARD */}
          {currentRole === "admin" &&
            (!isAdminUnlocked ? (
              <AdminPinGate
                onSubmitPin={handleAdminPinSubmit}
                error=""
                isSuccess={isAdminUnlocked}
                onCancel={() => navigateToDashboard("customer", "overview")}
                onOpenSecurityPins={() => setIsSecurityPinsOpen(true)}
              />
            ) : (
              <AdminOperations
                view={
                  activeTab === "gateways" ||
                  activeTab === "orders-audit" ||
                  activeTab === "settlement" ||
                  activeTab === "afa-verification" ||
                  activeTab === "vouchers-stock"
                    ? (activeTab as any)
                    : "gateways"
                }
                gateways={gateways}
                onToggleGatewayStatus={handleToggleGateway}
                orders={orders}
                onRetryOrder={handleRetryOrder}
                onRefundOrder={handleRefundOrder}
                afaApplications={afaApplications}
                onUpdateAfaStatus={handleUpdateAfaStatus}
                checkers={checkers}
                onAddVoucherStock={handleAddVoucherStock}
              />
            ))}
        </main>
      </div>

      {/* Global Modals for Authenticated Dashboard */}
      <FundWalletModal
        isOpen={isFundWalletOpen}
        onClose={() => setIsFundWalletOpen(false)}
        currentBalance={walletBalance}
        onSuccess={(amount, channel) =>
          handleFundSuccess(amount, channel, `FW-${Date.now()}`)
        }
      />

      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />

      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onNavigate={(role, tab) => {
          if (role === "public") {
            navigateToPublic(tab);
          } else {
            navigateToDashboard(role as "customer" | "agent" | "admin", tab);
          }
        }}
        onSelectRole={handleRoleChange}
        onSelectTab={handleTabChange}
        currentRole={currentRole}
        onOpenFundWallet={() => setIsFundWalletOpen(true)}
        onToggleTheme={toggleTheme}
      />

      <SecurityPinsModal
        isOpen={isSecurityPinsOpen}
        onClose={() => setIsSecurityPinsOpen(false)}
        onSelectAccount={(role) => {
          const acc = DEMO_ACCOUNTS[role];
          if (acc) {
            handleAuthSuccess(acc);
            setIsSecurityPinsOpen(false);
          }
        }}
      />
    </div>
  );
}
