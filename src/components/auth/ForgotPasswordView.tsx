"use client";

import { FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { AuthError } from "./AuthError";

interface ForgotPasswordViewProps {
  identifier: string;
  error: string | null;
  isLoading: boolean;
  onIdentifierChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordView({
  identifier,
  error,
  isLoading,
  onIdentifierChange,
  onSubmit,
  onBackToLogin,
}: ForgotPasswordViewProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthError message={error} />

      <div className="space-y-2">
        <div>
          <label
            htmlFor="forgot-password-identifier"
            className="text-sm font-medium"
          >
            Email or Phone number
          </label>
        </div>

        <Input
          id="forgot-password-identifier"
          value={identifier}
          onChange={(event) => onIdentifierChange(event.target.value)}
          placeholder="Enter your email or phone number"
          autoComplete="username"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending code...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full text-sm text-muted-foreground hover:underline"
      >
        Return to Sign In
      </button>
    </form>
  );
}
