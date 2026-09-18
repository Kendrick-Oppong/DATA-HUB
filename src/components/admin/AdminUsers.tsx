import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  UserCheck,
  ShoppingBag,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  Download,
  RefreshCw,
  Plus,
  Check,
  X,
  Clock,
  ExternalLink,
  Eye,
  Mail,
  Phone,
  Building,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Shield,
  Trash2,
  TrendingUp,
  UserX,
  Sparkles,
} from "lucide-react";
import { UserRole } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Label } from "../ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { PaginationHelper } from "../customer/views/PaginationHelper";
import { loadFromStorage, saveToStorage } from "../../mockData";

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "agent" | "admin";
  businessName?: string;
  handle?: string;
  agentStatus: "none" | "pending" | "approved" | "rejected";
  isKycVerified: boolean;
  ghanaCardNumber?: string;
  createdAt: string;
  balance: number;

  // Agent performance metrics
  totalOrders: number;
  deliveredOrders: number;
  processingOrders: number;
  storeRevenue: number;
  commissionEarned: number;
  pendingCommission: number;
  lastSaleAt?: string;
}

export const INITIAL_ADMIN_USERS: AdminUserRecord[] = [
  {
    id: "usr-admin-1",
    name: "Kendrick Admin",
    email: "admin@example.com",
    phone: "0501234567",
    role: "admin",
    agentStatus: "none",
    isKycVerified: true,
    ghanaCardNumber: "GHA-456789123-0",
    createdAt: "2025-01-10T09:00:00Z",
    balance: 5000.0,
    totalOrders: 0,
    deliveredOrders: 0,
    processingOrders: 0,
    storeRevenue: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  },
  {
    id: "usr-agent-1",
    name: "Ama Boateng",
    email: "agent@example.com",
    phone: "0201234567",
    role: "agent",
    businessName: "Ama Data Hub",
    handle: "amadata",
    agentStatus: "approved",
    isKycVerified: true,
    ghanaCardNumber: "GHA-987654321-0",
    createdAt: "2025-02-14T10:30:00Z",
    balance: 450.0,
    totalOrders: 142,
    deliveredOrders: 138,
    processingOrders: 4,
    storeRevenue: 18450.0,
    commissionEarned: 1240.0,
    pendingCommission: 85.0,
    lastSaleAt: "2026-09-17T18:30:00Z",
  },
  {
    id: "usr-agent-2",
    name: "Kofi Mensah",
    email: "kofi.mensah@gmail.com",
    phone: "0244128901",
    role: "agent",
    businessName: "Kofi Express Data",
    handle: "kofidata",
    agentStatus: "approved",
    isKycVerified: true,
    ghanaCardNumber: "GHA-112233445-9",
    createdAt: "2025-02-01T08:15:00Z",
    balance: 1280.5,
    totalOrders: 218,
    deliveredOrders: 210,
    processingOrders: 8,
    storeRevenue: 29400.0,
    commissionEarned: 2150.0,
    pendingCommission: 140.0,
    lastSaleAt: "2026-09-17T21:45:00Z",
  },
  {
    id: "usr-cust-1",
    name: "Kwame Mensah",
    email: "customer@example.com",
    phone: "0241234567",
    role: "customer",
    agentStatus: "none",
    isKycVerified: true,
    ghanaCardNumber: "GHA-123456789-0",
    createdAt: "2025-03-01T12:00:00Z",
    balance: 120.0,
    totalOrders: 18,
    deliveredOrders: 18,
    processingOrders: 0,
    storeRevenue: 0,
    commissionEarned: 0,
    pendingCommission: 0,
    lastSaleAt: "2026-09-16T14:10:00Z",
  },
  {
    id: "usr-agent-3",
    name: "Emmanuel Osei",
    email: "emma.osei@yahoo.com",
    phone: "0558923410",
    role: "agent",
    businessName: "Osei Ventures",
    handle: "sdhosei",
    agentStatus: "approved",
    isKycVerified: true,
    ghanaCardNumber: "GHA-334455667-1",
    createdAt: "2025-02-20T14:20:00Z",
    balance: 310.0,
    totalOrders: 98,
    deliveredOrders: 94,
    processingOrders: 4,
    storeRevenue: 12800.0,
    commissionEarned: 890.0,
    pendingCommission: 45.0,
    lastSaleAt: "2026-09-17T11:20:00Z",
  },
  {
    id: "usr-pend-1",
    name: "Akosua Serwaa",
    email: "akosua.serwaa@gmail.com",
    phone: "0279876543",
    role: "customer",
    businessName: "Serwaa Telecom Desk",
    agentStatus: "pending",
    isKycVerified: true,
    ghanaCardNumber: "GHA-778899001-2",
    createdAt: "2025-03-10T16:45:00Z",
    balance: 75.0,
    totalOrders: 12,
    deliveredOrders: 12,
    processingOrders: 0,
    storeRevenue: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  },
  {
    id: "usr-pend-2",
    name: "Yaw Appiah",
    email: "yaw.appiah@outlook.com",
    phone: "0509988776",
    role: "customer",
    businessName: "Appiah Data & Accessories",
    agentStatus: "pending",
    isKycVerified: false,
    createdAt: "2025-03-12T09:10:00Z",
    balance: 40.0,
    totalOrders: 5,
    deliveredOrders: 5,
    processingOrders: 0,
    storeRevenue: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  },
  {
    id: "usr-agent-4",
    name: "Grace Adjei",
    email: "grace.adjei@gmail.com",
    phone: "0243322110",
    role: "agent",
    businessName: "Grace Telecom Store",
    handle: "gracedata",
    agentStatus: "approved",
    isKycVerified: true,
    ghanaCardNumber: "GHA-556677889-3",
    createdAt: "2025-02-28T11:00:00Z",
    balance: 210.0,
    totalOrders: 76,
    deliveredOrders: 74,
    processingOrders: 2,
    storeRevenue: 9800.0,
    commissionEarned: 670.0,
    pendingCommission: 30.0,
    lastSaleAt: "2026-09-17T15:10:00Z",
  },
  {
    id: "usr-cust-2",
    name: "Abena Pokua",
    email: "abena.pokua@gmail.com",
    phone: "0541122334",
    role: "customer",
    agentStatus: "none",
    isKycVerified: true,
    ghanaCardNumber: "GHA-990011223-4",
    createdAt: "2025-03-05T13:30:00Z",
    balance: 15.0,
    totalOrders: 8,
    deliveredOrders: 8,
    processingOrders: 0,
    storeRevenue: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  },
  {
    id: "usr-pend-3",
    name: "Samuel Owusu",
    email: "samuel.owusu@icloud.com",
    phone: "0207766554",
    role: "customer",
    businessName: "Owusu Tech Solutions",
    agentStatus: "pending",
    isKycVerified: true,
    ghanaCardNumber: "GHA-445566778-5",
    createdAt: "2025-03-14T17:25:00Z",
    balance: 90.0,
    totalOrders: 3,
    deliveredOrders: 3,
    processingOrders: 0,
    storeRevenue: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  },
  {
    id: "usr-pend-4",
    name: "Patricia Kwarteng",
    email: "patricia.k@gmail.com",
    phone: "0268877665",
    role: "customer",
    businessName: "Patricia Data Express",
    agentStatus: "pending",
    isKycVerified: true,
    ghanaCardNumber: "GHA-889900112-6",
    createdAt: "2025-03-15T10:00:00Z",
    balance: 160.0,
    totalOrders: 15,
    deliveredOrders: 15,
    processingOrders: 0,
    storeRevenue: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  },
  {
    id: "usr-pend-5",
    name: "Joseph Baah",
    email: "joseph.baah@gmail.com",
    phone: "0553344556",
    role: "customer",
    businessName: "JB Digital Shop",
    agentStatus: "pending",
    isKycVerified: false,
    createdAt: "2025-03-16T14:40:00Z",
    balance: 25.0,
    totalOrders: 2,
    deliveredOrders: 2,
    processingOrders: 0,
    storeRevenue: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  },
];

const ITEMS_PER_PAGE = 8;

export interface AdminUsersProps {
  onNavigateTab?: (tab: string) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onNavigateTab }) => {
  const [users, setUsers] = useState<AdminUserRecord[]>(() =>
    loadFromStorage("admin_users_list", INITIAL_ADMIN_USERS),
  );

  const [viewTab, setViewTab] = useState<
    "all" | "agents" | "pending" | "admins" | "customers"
  >("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(
    null,
  );
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<
    "customer" | "agent" | "admin"
  >("customer");
  const [newUserBusiness, setNewUserBusiness] = useState("");
  const [newUserHandle, setNewUserHandle] = useState("");

  const updateUsers = (newUsers: AdminUserRecord[]) => {
    setUsers(newUsers);
    saveToStorage("admin_users_list", newUsers);
  };

  const showToast = (
    text: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [viewTab, roleFilter, kycFilter, searchQuery, fromDate, toDate]);

  // Statistics calculation
  const totalUsersCount = users.length;
  const agentsList = useMemo(
    () =>
      users.filter((u) => u.role === "agent" || u.agentStatus === "approved"),
    [users],
  );
  const customersList = useMemo(
    () =>
      users.filter(
        (u) => u.role === "customer" && u.agentStatus !== "approved",
      ),
    [users],
  );
  const adminsList = useMemo(
    () => users.filter((u) => u.role === "admin"),
    [users],
  );
  const pendingAgentsList = useMemo(
    () => users.filter((u) => u.agentStatus === "pending"),
    [users],
  );
  const sellingAgentsCount = useMemo(
    () => agentsList.filter((a) => a.totalOrders > 0).length,
    [agentsList],
  );

  const totalStoreRevenue = useMemo(
    () => agentsList.reduce((sum, a) => sum + (a.storeRevenue || 0), 0),
    [agentsList],
  );
  const totalCommissionPaid = useMemo(
    () => agentsList.reduce((sum, a) => sum + (a.commissionEarned || 0), 0),
    [agentsList],
  );

  // Date parsing helper
  const fromMs = fromDate ? new Date(`${fromDate}T00:00:00Z`).getTime() : null;
  const toMs = toDate ? new Date(`${toDate}T23:59:59.999Z`).getTime() : null;

  // Filtered rows
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Sub-tab view filter
      if (
        viewTab === "agents" &&
        u.role !== "agent" &&
        u.agentStatus !== "approved"
      )
        return false;
      if (viewTab === "pending" && u.agentStatus !== "pending") return false;
      if (viewTab === "admins" && u.role !== "admin") return false;
      if (
        viewTab === "customers" &&
        (u.role !== "customer" || u.agentStatus === "approved")
      )
        return false;

      // Dropdown Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      // KYC filter
      if (kycFilter === "verified" && !u.isKycVerified) return false;
      if (kycFilter === "unverified" && u.isKycVerified) return false;

      // Search query (strictly without font mono!)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (u.name || "").toLowerCase().includes(q);
        const matchEmail = (u.email || "").toLowerCase().includes(q);
        const matchPhone = (u.phone || "").includes(q);
        const matchBusiness = (u.businessName || "").toLowerCase().includes(q);
        const matchHandle = (u.handle || "").toLowerCase().includes(q);
        if (
          !matchName &&
          !matchEmail &&
          !matchPhone &&
          !matchBusiness &&
          !matchHandle
        ) {
          return false;
        }
      }

      // Date range filter
      if (fromMs != null || toMs != null) {
        const itemDate = u.createdAt ? new Date(u.createdAt).getTime() : 0;
        if (fromMs != null && itemDate < fromMs) return false;
        if (toMs != null && itemDate > toMs) return false;
      }

      return true;
    });
  }, [users, viewTab, roleFilter, kycFilter, searchQuery, fromMs, toMs]);

  const isFiltered =
    searchQuery !== "" ||
    viewTab !== "all" ||
    roleFilter !== "all" ||
    kycFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  const handleResetFilters = () => {
    setSearchQuery("");
    setViewTab("all");
    setRoleFilter("all");
    setKycFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE),
  );
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Actions
  const handleAgentAction = async (
    userId: string,
    action: "approve" | "reject",
  ) => {
    setBusyActionId(userId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const updated = users.map((u) => {
      if (u.id === userId) {
        if (action === "approve") {
          const autoHandle =
            u.handle || u.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return {
            ...u,
            role: "agent" as const,
            agentStatus: "approved" as const,
            handle: autoHandle,
            businessName: u.businessName || `${u.name} Telecom Store`,
          };
        } else {
          return {
            ...u,
            agentStatus: "rejected" as const,
          };
        }
      }
      return u;
    });
    updateUsers(updated);
    setBusyActionId(null);
    showToast(
      action === "approve"
        ? "Agent application approved. Account upgraded to Agent."
        : "Agent application declined.",
      action === "approve" ? "success" : "info",
    );

    if (selectedUser?.id === userId) {
      setSelectedUser(updated.find((u) => u.id === userId) || null);
    }
  };

  const handleChangeRole = async (
    userId: string,
    newRole: "customer" | "agent" | "admin",
  ) => {
    setBusyActionId(userId);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const updated = users.map((u) => {
      if (u.id === userId) {
        const newAgentStatus: "pending" | "approved" | "rejected" | "none" =
          newRole === "agent"
            ? "approved"
            : u.agentStatus === "approved"
              ? "none"
              : u.agentStatus;
        return {
          ...u,
          role: newRole,
          agentStatus: newAgentStatus,
        };
      }
      return u;
    });
    updateUsers(updated);
    setBusyActionId(null);
    showToast(`User role updated to ${newRole.toUpperCase()}.`, "success");

    if (selectedUser?.id === userId) {
      setSelectedUser(updated.find((u) => u.id === userId) || null);
    }
  };

  const handleToggleKyc = async (userId: string) => {
    setBusyActionId(userId);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const updated = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          isKycVerified: !u.isKycVerified,
        };
      }
      return u;
    });
    updateUsers(updated);
    setBusyActionId(null);
    showToast("User KYC verification status updated.", "info");

    if (selectedUser?.id === userId) {
      setSelectedUser(updated.find((u) => u.id === userId) || null);
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone.trim()) {
      showToast("Name and Phone Number are required.", "error");
      return;
    }
    const newUser: AdminUserRecord = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email:
        newUserEmail.trim() ||
        `${newUserName.toLowerCase().replace(/\s+/g, "")}@example.com`,
      phone: newUserPhone.trim(),
      role: newUserRole,
      businessName:
        newUserBusiness.trim() ||
        (newUserRole === "agent" ? `${newUserName} Store` : undefined),
      handle:
        newUserHandle.trim() ||
        (newUserRole === "agent"
          ? newUserName.toLowerCase().replace(/[^a-z0-9]/g, "")
          : undefined),
      agentStatus: newUserRole === "agent" ? "approved" : "none",
      isKycVerified: true,
      createdAt: new Date().toISOString(),
      balance: 0.0,
      totalOrders: 0,
      deliveredOrders: 0,
      processingOrders: 0,
      storeRevenue: 0,
      commissionEarned: 0,
      pendingCommission: 0,
    };
    updateUsers([newUser, ...users]);
    setIsAddUserOpen(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setNewUserRole("customer");
    setNewUserBusiness("");
    setNewUserHandle("");
    showToast(
      `New ${newUserRole.toUpperCase()} created successfully.`,
      "success",
    );
  };

  const handleExportCsv = () => {
    const head = [
      "Name",
      "Email",
      "Phone",
      "Role",
      "Agent Status",
      "Business Name",
      "Store Handle",
      "KYC Verified",
      "Wallet Balance (GHS)",
      "Total Orders",
      "Store Revenue (GHS)",
      "Commission Earned (GHS)",
      "Joined Date",
    ];

    const esc = (c: any) =>
      `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    const body = filteredUsers.map((u) => [
      esc(u.name),
      esc(u.email),
      esc(u.phone),
      esc(u.role),
      esc(u.agentStatus),
      esc(u.businessName || ""),
      esc(u.handle ? `/${u.handle}` : ""),
      esc(u.isKycVerified ? "Yes" : "No"),
      esc(u.balance.toFixed(2)),
      esc(u.totalOrders),
      esc(u.storeRevenue.toFixed(2)),
      esc(u.commissionEarned.toFixed(2)),
      esc(u.createdAt ? u.createdAt.slice(0, 10) : ""),
    ]);

    const csv = [head.map(esc).join(","), ...body.map((r) => r.join(","))].join(
      "\r\n",
    );
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `users-directory-${viewTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    showToast(
      `Exported ${filteredUsers.length} user records to CSV.`,
      "success",
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER (Matching AdminPayouts / AdminAfa header layout) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Users className="size-6 text-primary" />
            <span>User & Agent Directory</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Approve agent applications, promote customers to agents, manage
            admin access, and track agent storefront performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {toastMessage && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg animate-in fade-in duration-200 border ${
                toastMessage.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : toastMessage.type === "error"
                    ? "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
              }`}
            >
              {toastMessage.text}
            </span>
          )}

          <Button
            size="sm"
            onClick={() => setIsAddUserOpen(true)}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span>Add User / Agent</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={filteredUsers.length === 0}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 4 STATS CARDS TILES (Matching AdminPayouts & AdminAfa layout with icon + label next to icon) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Users */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total registered users
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {totalUsersCount}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {customersList.length} Customers · {agentsList.length} Agents ·{" "}
            {adminsList.length} Admins
          </p>
        </div>

        {/* Selling Agents */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
              <ShoppingBag className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Selling agents
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-teal-600 dark:text-teal-400">
            {sellingAgentsCount} / {agentsList.length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {agentsList.length > 0
              ? `${Math.round((sellingAgentsCount / agentsList.length) * 100)}% active storefront conversion`
              : "No agents registered"}
          </p>
        </div>

        {/* Store Revenue */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Store revenue
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            GH₵ {totalStoreRevenue.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Gross volume generated by agent stores
          </p>
        </div>

        {/* Commission Paid */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
              <TrendingUp className="size-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Commission paid
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-purple-600 dark:text-purple-400">
            GH₵ {totalCommissionPaid.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Earned on fulfilled storefront orders
          </p>
        </div>
      </div>

      {/* MAIN USERS CARD (Identical to Payout Requests & vouchers-stock / AdminCheckers pattern) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <Users className="size-5 text-primary" />
                <span>User Directory &amp; Accounts</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Manage customer accounts, approve agent applications, agent
                storefront performance.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filters Container (Exact match to Payout Requests & vouchers-stock) */}
        <div className="border-b border-border bg-muted/20 p-4 space-y-4">
          {/* Top Full-width Search Input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="admin-user-search"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Search user directory
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-user-search"
                type="text"
                placeholder="Search name, phone, email, business name, or store handle..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 bg-background pl-9 pr-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Box (Nested Card Box matching Payout Requests & vouchers-stock) */}
          <div className="rounded-xl border border-border bg-background p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  User directory filters &amp; date range
                </span>
                {isFiltered && (
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 font-semibold"
                  >
                    Active
                  </Badge>
                )}
              </div>
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                >
                  Reset filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Category / View Tab */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-view-tab"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  View Category
                </Label>
                <Select
                  value={viewTab}
                  onValueChange={(v: any) => {
                    setViewTab(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="filter-view-tab"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Users ({users.length})
                    </SelectItem>
                    <SelectItem value="agents">
                      Agents ({agentsList.length})
                    </SelectItem>
                    <SelectItem value="pending">
                      Pending Applications ({pendingAgentsList.length})
                    </SelectItem>
                    <SelectItem value="admins">
                      Admins ({adminsList.length})
                    </SelectItem>
                    <SelectItem value="customers">
                      Customers ({customersList.length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Account Role Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-role"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Account Role
                </Label>
                <Select
                  value={roleFilter}
                  onValueChange={(v) => {
                    setRoleFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    id="filter-role"
                    className="h-9 w-full text-xs"
                  >
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="customer">Retail Customer</SelectItem>
                    <SelectItem value="agent">Agent / Merchant</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* KYC Verification Filter */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-kyc"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  KYC Verification Status
                </Label>
                <Select
                  value={kycFilter}
                  onValueChange={(v) => {
                    setKycFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="filter-kyc" className="h-9 w-full text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All KYC Statuses</SelectItem>
                    <SelectItem value="verified">KYC Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Joined From Date */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="filter-from-date"
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  Joined From
                </Label>
                <Input
                  id="filter-from-date"
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION (Matching AdminPayouts & vouchers-stock Table styling) */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-bold">
                    User &amp; Storefront
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    Contact Info
                  </TableHead>
                  <TableHead className="text-xs font-bold">
                    Role &amp; Status
                  </TableHead>
                  <TableHead className="text-xs font-bold text-center">
                    Store Metrics
                  </TableHead>
                  <TableHead className="text-xs font-bold text-right">
                    Wallet Balance
                  </TableHead>
                  <TableHead className="text-xs font-bold text-center">
                    Agent Approval
                  </TableHead>
                  <TableHead className="text-xs font-bold text-right">
                    Admin Clearance
                  </TableHead>
                  <TableHead className="text-xs font-bold text-center">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <UserX className="size-10 stroke-1 mb-2 text-muted-foreground/60" />
                        <p className="text-sm font-semibold text-foreground">
                          No users found
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isFiltered
                            ? "Try broadening your search query or reset your filters."
                            : "No users exist in this view."}
                        </p>
                        {isFiltered && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="mt-3 text-xs font-bold"
                          >
                            Reset filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((u) => {
                    const isAdmin = u.role === "admin";
                    const isAgent =
                      u.role === "agent" || u.agentStatus === "approved";
                    const isPending = u.agentStatus === "pending";

                    return (
                      <TableRow key={u.id} className="hover:bg-muted/20">
                        {/* User & Business */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-extrabold text-xs shrink-0">
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-foreground truncate">
                                  {u.name}
                                </span>
                                {u.isKycVerified && (
                                  <span title="KYC Verified">
                                    <ShieldCheck className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {u.businessName ||
                                  (isAgent
                                    ? "SDH Merchant"
                                    : u.role === "admin"
                                      ? "System Admin"
                                      : "Retail Customer")}
                              </div>
                              {u.handle && (
                                <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                                  /{u.handle}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Contact Info (strictly without font-mono!) */}
                        <TableCell className="py-3">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-foreground">
                              {u.phone}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                              {u.email}
                            </div>
                          </div>
                        </TableCell>

                        {/* Role & Status Badges */}
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div>
                              {isAdmin ? (
                                <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                                  Admin
                                </Badge>
                              ) : isAgent ? (
                                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                                  Agent
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold text-muted-foreground"
                                >
                                  Customer
                                </Badge>
                              )}
                            </div>
                            {isPending && (
                              <span className="inline-block text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                Agent Request Pending
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Store Metrics */}
                        <TableCell className="py-3 text-center">
                          {isAgent ? (
                            <div className="space-y-0.5">
                              <div className="text-xs font-extrabold text-foreground tabular-nums">
                                {u.totalOrders} orders
                              </div>
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                                GH₵ {u.commissionEarned.toFixed(2)} comm.
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Wallet Balance */}
                        <TableCell className="py-3 text-right">
                          <span className="text-xs font-extrabold tabular-nums text-foreground">
                            GH₵ {u.balance.toFixed(2)}
                          </span>
                        </TableCell>

                        {/* Agent Approval Action */}
                        <TableCell className="py-3 text-center">
                          {isAdmin ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : isAgent ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              Verified Agent
                            </Badge>
                          ) : isPending ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyActionId === u.id}
                                onClick={() =>
                                  handleAgentAction(u.id, "reject")
                                }
                                className="h-7 px-2 text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer"
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                disabled={busyActionId === u.id}
                                onClick={() =>
                                  handleAgentAction(u.id, "approve")
                                }
                                className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer gap-1"
                              >
                                <Check className="size-3" />
                                <span>Approve</span>
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyActionId === u.id}
                              onClick={() => handleAgentAction(u.id, "approve")}
                              className="h-7 px-2.5 text-[11px] font-bold cursor-pointer"
                            >
                              Make Agent
                            </Button>
                          )}
                        </TableCell>

                        {/* Admin Clearance Action */}
                        <TableCell className="py-3 text-right">
                          {isAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyActionId === u.id}
                              onClick={() =>
                                handleChangeRole(
                                  u.id,
                                  u.businessName ? "agent" : "customer",
                                )
                              }
                              className="h-7 px-2.5 text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer"
                            >
                              Remove Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyActionId === u.id}
                              onClick={() => handleChangeRole(u.id, "admin")}
                              className="h-7 px-2.5 text-[11px] font-bold text-primary hover:bg-primary/5 cursor-pointer gap-1"
                            >
                              <Shield className="size-3" />
                              <span>Make Admin</span>
                            </Button>
                          )}
                        </TableCell>

                        {/* Details Action */}
                        <TableCell className="py-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedUser(u)}
                            className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View User Details"
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <PaginationHelper
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* USER DETAILS DIALOG / MODAL */}
      <Dialog
        open={selectedUser !== null}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        {selectedUser && (
          <DialogContent className="max-w-xl border-border bg-card">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-sm">
                  {getInitials(selectedUser.name)}
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                    <span>{selectedUser.name}</span>
                    {selectedUser.role === "admin" && (
                      <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 text-[10px]">
                        Admin
                      </Badge>
                    )}
                    {selectedUser.role === "agent" && (
                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 text-[10px]">
                        Agent
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Account ID: {selectedUser.id} · Registered{" "}
                    {formatDate(selectedUser.createdAt)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Profile Overview Card */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Contact Email
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Phone Number
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedUser.phone}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    KYC Verification
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-bold">
                    {selectedUser.isKycVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="size-3.5" /> Verified Ghana Card
                        ({selectedUser.ghanaCardNumber || "GHA-***"})
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="size-3.5" /> Unverified KYC
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Wallet Balance
                  </span>
                  <p className="font-black text-foreground tabular-nums text-sm mt-0.5">
                    GH₵ {selectedUser.balance.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Store Performance (If Agent) */}
              {(selectedUser.role === "agent" ||
                selectedUser.agentStatus === "approved") && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="size-4 text-teal-600" />
                    <span>Agent Storefront Performance</span>
                  </h4>
                  <div className="rounded-xl border border-border bg-teal-500/5 p-3.5 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        Store Link
                      </span>
                      <p className="font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
                        {selectedUser.handle
                          ? `/${selectedUser.handle}`
                          : "Not configured"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        Total Revenue
                      </span>
                      <p className="font-black text-foreground tabular-nums mt-0.5">
                        GH₵ {selectedUser.storeRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        Commission Earned
                      </span>
                      <p className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                        GH₵ {selectedUser.commissionEarned.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Management Actions */}
              <div className="space-y-2 pt-1">
                <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wider">
                  Admin Control Actions
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleKyc(selectedUser.id)}
                    className="text-xs font-bold gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="size-3.5" />
                    <span>
                      {selectedUser.isKycVerified
                        ? "Revoke KYC"
                        : "Mark KYC Verified"}
                    </span>
                  </Button>

                  {selectedUser.agentStatus === "pending" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAgentAction(selectedUser.id, "approve")
                      }
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1"
                    >
                      <Check className="size-3.5" />
                      <span>Approve Agent Application</span>
                    </Button>
                  )}

                  {selectedUser.role !== "admin" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleChangeRole(selectedUser.id, "admin")}
                      className="text-xs font-bold text-primary cursor-pointer gap-1"
                    >
                      <Shield className="size-3.5" />
                      <span>Grant Admin Access</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="text-xs font-bold cursor-pointer"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ADD / INVITE USER DIALOG */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <form onSubmit={handleAddUserSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                <span>Create New User or Agent</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add a new user directly to the system platform.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="new-user-name" className="text-xs font-bold">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-user-name"
                  type="text"
                  placeholder="e.g. Samuel Addo"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="new-user-phone" className="text-xs font-bold">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-user-phone"
                    type="text"
                    placeholder="e.g. 0244123456"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="new-user-email" className="text-xs font-bold">
                    Email Address
                  </Label>
                  <Input
                    id="new-user-email"
                    type="email"
                    placeholder="e.g. samuel@gmail.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Account Role</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(val: "customer" | "agent" | "admin") =>
                    setNewUserRole(val)
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Retail Customer</SelectItem>
                    <SelectItem value="agent">Agent / Merchant</SelectItem>
                    <SelectItem value="admin">System Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newUserRole === "agent" && (
                <>
                  <div className="space-y-1">
                    <Label
                      htmlFor="new-user-business"
                      className="text-xs font-bold"
                    >
                      Business / Store Name
                    </Label>
                    <Input
                      id="new-user-business"
                      type="text"
                      placeholder="e.g. Samuel Telecom Solutions"
                      value={newUserBusiness}
                      onChange={(e) => setNewUserBusiness(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="new-user-handle"
                      className="text-xs font-bold"
                    >
                      Storefront Handle (slug)
                    </Label>
                    <Input
                      id="new-user-handle"
                      type="text"
                      placeholder="e.g. samueldata"
                      value={newUserHandle}
                      onChange={(e) => setNewUserHandle(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
                className="text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
