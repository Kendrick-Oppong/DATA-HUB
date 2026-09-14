"use client";

import { FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { AuthError } from "./AuthError";

interface NewPasswordViewProps {
  password: string;
  confirmPassword: string;
  error: string | null;
  isLoading: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function NewPasswordView({
  password,
  confirmPassword,
  error,
  isLoading,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: NewPasswordViewProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthError message={error} />

      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-medium">
          New password
        </label>

        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Enter your new password"
          autoComplete="new-password"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm-new-password" className="text-sm font-medium">
          Confirm new password
        </label>

        <Input
          id="confirm-new-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          placeholder="Confirm your new password"
          autoComplete="new-password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating password...
          </>
        ) : (
          <>
            Update Password
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
