"use client";

import { FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { AuthError } from "./AuthError";

interface LoginViewProps {
  identifier: string;
  password: string;
  error: string | null;
  isLoading: boolean;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export function LoginView({
  identifier,
  password,
  error,
  isLoading,
  onIdentifierChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  onRegister,
}: LoginViewProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthError message={error} />

      <div className="space-y-2">
        <div>
          <label htmlFor="login-identifier" className="text-sm font-medium">
            Email or Phone number
          </label>
        </div>

        <Input
          id="login-identifier"
          value={identifier}
          onChange={(event) => onIdentifierChange(event.target.value)}
          placeholder="Enter your login identifier"
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-sm font-medium">
            Password
          </label>

          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="font-medium text-primary hover:underline"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}
