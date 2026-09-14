import React, { useState } from "react";
import { AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface AgentFailedBeneficiaryProps {
  onSubmitReport?: (data: { phoneNumber: string; orderId?: string }) => void;
}

export const AgentFailedBeneficiary: React.FC<AgentFailedBeneficiaryProps> = ({
  onSubmitReport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phoneNumber.replace(/\D/g, "");
    if (cleanedPhone.length < 9) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    setPhoneNumber("");
    setOrderId("");

    if (onSubmitReport) {
      onSubmitReport({ phoneNumber: cleanedPhone, orderId: orderId || undefined });
    }

    setTimeout(() => setSubmitted(false), 3000);
  };

  if (submitted) {
    return (
      <Card className="border-border shadow-xs">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Report submitted successfully
              </p>
              <p className="text-xs text-muted-foreground">
                Our team will review the MTN refused beneficiary and follow up.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Report MTN Refused Beneficiary
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs"
        >
          {isOpen ? "Hide" : "Report"}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-4">
            If MTN refused a number as a beneficiary for data transfer, report it here.
            Our team will investigate and help resolve the issue.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                MTN Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="024 000 0000"
                className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Order Reference (Optional)
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. SO-1234"
                className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-mono text-xs"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || phoneNumber.replace(/\D/g, "").length < 9}
              className="w-full text-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
};
