"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </Button>

          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground">
              SDH
            </div>
            <span className="text-sm font-extrabold tracking-tight">
              Smart Data Hub
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-10">
        <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <CardHeader className="space-y-4 p-6 sm:p-8">
            <CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">
              Terms of Service
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Last updated: September 2026
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8 sm:px-8">
            <section className="space-y-3">
              <h3 className="text-base font-bold">1. Acceptance of Terms</h3>
              <p className="text-sm leading-relaxed text muted-foreground">
                By accessing and using Smart Data Hub services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">2. Services Description</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Smart Data Hub provides telecommunications services including data bundles, airtime top-ups, WAEC result checking, and AFA registration services. All services are subject to availability and telecom operator policies.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">3. User Responsibilities</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Users are responsible for maintaining the confidentiality of their account credentials. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">4. Payment and Refunds</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                All payments are processed through secure channels. Refunds are processed according to our refund policy and telecom operator guidelines. Failed transactions may take 3-5 business days to reflect in your account.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">5. Ghana Data Protection Compliance</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Smart Data Hub is compliant with the Ghana Data Protection Act 2012 (Act 843). We collect and process personal data in accordance with applicable laws and regulations.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">6. Limitation of Liability</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Smart Data Hub shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use our services.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">7. Termination</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time for violation of these terms or suspicious activity.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">8. Contact Information</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                For questions about these Terms of Service, please contact our support team through the app or email support@smartdatahub.gh
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
