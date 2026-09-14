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

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: Readonly<PrivacyPolicyProps>) {
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
              Privacy Policy
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Last updated: September 2026
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8 sm:px-8">
            <section className="space-y-3">
              <h3 className="text-base font-bold">1. Information We Collect</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We collect information you provide directly, including your name, phone number, email address, Ghana Card number, and payment information. We also collect usage data to improve our services.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">2. How We Use Your Information</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We use your information to provide services, process transactions, communicate with you, verify your identity, and comply with legal obligations. We do not sell your personal data to third parties.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">3. Data Protection</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Smart Data Hub implements industry-standard security measures to protect your data. All transactions are encrypted using 256-bit SSL technology. We are compliant with the Ghana Data Protection Act 2012 (Act 843).
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">4. Data Sharing</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We may share your information with telecom operators to process your transactions. We may also share data with regulatory authorities when required by law. We never share your data for marketing purposes without your consent.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">5. Your Rights</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Under the Ghana Data Protection Act, you have the right to access, correct, or delete your personal data. You may also opt out of marketing communications at any time.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">6. Cookies and Tracking</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We use cookies to improve your experience and analyze usage patterns. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">7. Data Retention</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We retain your personal data only as long as necessary to provide our services and comply with legal requirements. Transaction records are retained for 7 years as required by financial regulations.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">8. Changes to This Policy</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We may update this privacy policy from time to time. We will notify you of significant changes via email or in-app notifications.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold">9. Contact Information</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                For questions about this Privacy Policy or to exercise your data rights, please contact our Data Protection Officer at dpo@smartdatahub.gh
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
