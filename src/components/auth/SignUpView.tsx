"use client";

import type { FormEvent } from "react";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Gift,
  Mail,
  Phone,
  Store,
  User,
  Lock,
  CheckCircle2,
} from "lucide-react";

import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SignUpViewProps {
  name: string;
  phone: string;
  countryCode: string;
  email: string;
  businessName: string;
  role: "customer" | "agent";
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  referralCode: string;
  agreeToTerms: boolean;
  error: string;

  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCountryCodeChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onBusinessNameChange: (value: string) => void;
  onRoleChange: (role: "customer" | "agent") => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onReferralCodeChange: (value: string) => void;
  onAgreeToTermsChange: (value: boolean) => void;
  onNavigateToLegal?: (page: "terms" | "privacy") => void;

  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SignUpView({
  name,
  phone,
  countryCode,
  email,
  businessName,
  role,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  referralCode,
  agreeToTerms,
  error,

  onNameChange,
  onPhoneChange,
  onCountryCodeChange,
  onEmailChange,
  onBusinessNameChange,
  onRoleChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onReferralCodeChange,
  onAgreeToTermsChange,
  onNavigateToLegal,

  onSubmit,
}: Readonly<SignUpViewProps>) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Role Selector Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onRoleChange("customer")}
          className={`group relative h-auto min-h-20 cursor-pointer flex-col items-start justify-start rounded-2xl border p-4 text-left whitespace-normal transition-all duration-200 ${
            role === "customer"
              ? "border-primary !bg-primary/5 hover:!bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span
                className={`flex size-8 items-center justify-center rounded-xl ${
                  role === "customer"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <User className="size-4" />
              </span>

              <p className={` ${role === "customer" ? "text-primary" : ""}`}>
                Customer Account
              </p>
            </div>

            {role === "customer" && (
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Personal data bundles, airtime, and WAEC vouchers.
          </p>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => onRoleChange("agent")}
          className={`group relative h-auto min-h-20 cursor-pointer flex-col items-start justify-start rounded-2xl border p-4 text-left whitespace-normal transition-all duration-200 ${
            role === "agent"
              ? "border-primary !bg-primary/5 hover:!bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span
                className={`flex size-8 items-center justify-center rounded-xl ${
                  role === "agent"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <Store className="size-4" />
              </span>

              <p className={` ${role === "agent" ? "text-primary" : ""}`}>
                Reseller Agent
              </p>
            </div>

            {role === "agent" && (
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Wholesale margin, custom web store, and commissions.
          </p>
        </Button>
      </div>
      {/* Full Name + Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="reg-name"
            className="text-xs font-bold text-foreground"
          >
            Full name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-name"
              type="text"
              required
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="h-11 pl-10 text-sm"
              autoComplete="name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="reg-email"
            className="text-xs font-bold text-foreground"
          >
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-email"
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              className="h-11 pl-10 text-sm"
              autoComplete="email"
            />
          </div>
        </div>
      </div>

      {/* Business Name (Agent only) + Phone Number */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {role === "agent" && (
          <div className="space-y-1.5">
            <Label
              htmlFor="reg-business"
              className="text-xs font-bold text-foreground"
            >
              Business / store name
            </Label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="reg-business"
                type="text"
                required
                placeholder="e.g. Kwesi Data Hub"
                value={businessName}
                onChange={(event) => onBusinessNameChange(event.target.value)}
                className="h-11 pl-10 text-sm"
                autoComplete="organization"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              This shows to customers on your store
            </p>
          </div>
        )}

        <div
          className={`${role === "agent" ? "space-y-1.5" : "col-span-1 sm:col-span-2 space-y-1.5"}`}
        >
          <Label
            htmlFor="reg-phone"
            className="text-xs font-bold text-foreground"
          >
            Phone number
          </Label>
          <div className="flex gap-2">
            <div className="relative w-24">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="reg-country-code"
                type="text"
                required
                placeholder="+233"
                value={countryCode}
                onChange={(event) => onCountryCodeChange(event.target.value)}
                className="h-11 pl-10 text-sm"
                readOnly
              />
            </div>
            <div className="relative flex-1">
              <Input
                id="reg-phone"
                type="tel"
                required
                placeholder="24 000 0000"
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                className="h-11 text-sm"
                autoComplete="tel"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            We'll text you a one-time code
          </p>
        </div>
      </div>

      {/* Password + Confirm Password */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="reg-password"
            className="text-xs font-bold text-foreground"
          >
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Create a password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="h-11 pl-10 pr-10 text-sm"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="reg-confirm-password"
            className="text-xs font-bold text-foreground"
          >
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="reg-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(event) => onConfirmPasswordChange(event.target.value)}
              className={`h-11 pl-10 pr-10 text-sm ${
                confirmPassword && password === confirmPassword
                  ? "border-emerald-500 ring-1 ring-emerald-500/30"
                  : ""
              }`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={onToggleConfirmPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Referral Code (Optional) - Full width */}
      <div className="space-y-1.5">
        <Label
          htmlFor="reg-referral"
          className="text-xs font-bold text-foreground"
        >
          Referral code (optional)
        </Label>
        <div className="relative">
          <Gift className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="reg-referral"
            type="text"
            placeholder="e.g. KWESI1899"
            value={referralCode}
            onChange={(event) => onReferralCodeChange(event.target.value)}
            className="h-11 pl-10 text-sm uppercase"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Got a code from a friend? Enter it for GHC2 off your first order.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => {
          // Google OAuth integration would go here
          console.log("Continue with Google clicked");
        }}
      >
        <svg className="size-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      {/* Terms of Service Checkbox */}
      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
        <Checkbox
          id="terms-check"
          checked={agreeToTerms}
          onCheckedChange={(checked) => onAgreeToTermsChange(checked === true)}
          className="mt-0.5 size-5"
        />

        <Label
          htmlFor="terms-check"
          className="cursor-pointer text-[12px] font-normal leading-relaxed text-foreground"
        >
          I agree to the Smart Data Hub{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-[11px] font-normal underline"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLegal?.("terms");
            }}
          >
            Terms of Service
          </Button>{" "}
          &{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-[11px] font-normal underline"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToLegal?.("privacy");
            }}
          >
            Privacy Policy
          </Button>
        </Label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full cursor-pointer gap-2 rounded-xl text-sm font-bold shadow-md"
      >
        <span>Proceed to Phone Verification</span>
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
