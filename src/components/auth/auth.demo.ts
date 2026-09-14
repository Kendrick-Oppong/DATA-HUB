import { UserRole } from "../../types";
import { AuthSuccessPayload, DemoRole } from "./auth.types";

export interface DemoAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: DemoRole;
  isKycVerified: boolean;
  ghanaCardNumber: string;
  securityPin: string;
}

export const DEMO_ACCOUNTS: Record<DemoRole, DemoAccount> = {
  customer: {
    id: "demo-customer",
    name: "Kwame Mensah",
    phone: "0241234567",
    email: "customer@example.com",
    role: "customer",
    isKycVerified: true,
    ghanaCardNumber: "GHA-123456789-0",
    securityPin: "1122",
  },

  agent: {
    id: "demo-agent",
    name: "Ama Boateng",
    phone: "0201234567",
    email: "agent@example.com",
    role: "agent",
    isKycVerified: true,
    ghanaCardNumber: "GHA-987654321-0",
    securityPin: "1122",
  },

  admin: {
    id: "demo-admin",
    name: "Kendrick Admin",
    phone: "0501234567",
    email: "admin@example.com",
    role: "admin",
    isKycVerified: true,
    ghanaCardNumber: "GHA-456789123-0",
    securityPin: "0000",
  },
};

export function toAuthPayload(account: DemoAccount): AuthSuccessPayload {
  return {
    name: account.name,
    phone: account.phone,
    role: account.role as UserRole,
    email: account.email,
    ghanaCard: account.ghanaCardNumber,
  };
}

export function getLoginRole(identifier: string, password: string): DemoRole {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  const isAdminLogin =
    password === "0000" ||
    password === "7788" ||
    normalizedIdentifier.includes("admin");

  if (isAdminLogin) {
    return "admin";
  }

  const isAgentLogin =
    password === "1122" || normalizedIdentifier.includes("agent");

  if (isAgentLogin) {
    return "agent";
  }

  return "customer";
}

export function createLoginPayload(
  identifier: string,
  password: string,
): AuthSuccessPayload {
  const role = getLoginRole(identifier, password);
  const demoAccount = DEMO_ACCOUNTS[role];

  return {
    name: demoAccount.name,
    phone: demoAccount.phone,
    role: demoAccount.role as UserRole,
    email: identifier.includes("@") ? identifier : demoAccount.email,
    ghanaCard: demoAccount.ghanaCardNumber,
  };
}
