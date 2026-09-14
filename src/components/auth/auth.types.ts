import { UserRole } from "../../types";

export interface AuthSuccessPayload {
  name: string;
  phone: string;
  role: UserRole;
  ghanaCard?: string;
  email?: string;
}

export type AuthFlowMode =
  | "login"
  | "register"
  | "otp"
  | "forgot-password"
  | "new-password"
  | "two-factor"
  | "kyc-verify";

export type OtpChannel = "sms" | "whatsapp";

export type OtpPurpose = "registration" | "forgot-password";

export type ResetStep = "request" | "new-password" | "success";

export type DemoRole = "customer" | "agent" | "admin";
