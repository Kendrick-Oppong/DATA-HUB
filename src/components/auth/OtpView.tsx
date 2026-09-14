"use client";

import type { FormEvent } from "react";
import { ArrowRight, Loader2, MessageSquare, RefreshCw } from "lucide-react";

import { Button } from "../ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { AuthError } from "./AuthError";
import type { OtpChannel, OtpPurpose } from "./auth.types";

interface OtpViewProps {
  otp: string;
  otpChannel: OtpChannel;
  otpPhone: string;
  otpPurpose: OtpPurpose;
  error: string | null;
  isLoading: boolean;
  onOtpChange: (value: string) => void;
  onOtpChannelChange: (channel: OtpChannel) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
  onBack: () => void;
}

export function OtpView({
  otp,
  otpChannel,
  otpPhone,
  otpPurpose,
  error,
  isLoading,
  onOtpChange,
  onOtpChannelChange,
  onSubmit,
  onResend,
  onBack,
}: Readonly<OtpViewProps>) {
  const channelLabel = otpChannel === "whatsapp" ? "WhatsApp" : "SMS";

  let description = "Enter the code sent to verify your phone number.";

  if (otpPurpose === "forgot-password") {
    description = "Enter the code sent to recover your account.";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthError message={error} />

      <div className="rounded-lg bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="mt-1 font-semibold">{otpPhone}</p>
      </div>

      <InputOTP
        maxLength={6}
        value={otp}
        onChange={onOtpChange}
        containerClassName="justify-center"
      >
        <InputOTPGroup className="space-x-2">
          {Array.from({ length: 6 }, (_, index) => (
            <InputOTPSlot key={index} className="rounded-md border-l size-12" />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            Verify Code
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={onResend}
        className="mx-auto flex items-center text-sm font-medium text-primary hover:underline"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Resend code
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-muted-foreground hover:underline"
      >
        Go back
      </button>
    </form>
  );
}
