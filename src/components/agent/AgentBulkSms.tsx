import React, { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

export const AgentBulkSms: React.FC = () => {
  const [smsAudience, setSmsAudience] = useState<"all" | "repeat" | "inactive">("all");
  const [senderId, setSenderId] = useState("KOFI-DATA");
  const [smsMessage, setSmsMessage] = useState(
    "Weekend Special: Enjoy non-expiry MTN 5GB for GH₵ 29.50 today on Kofi Telecom! Visit smartdatahub.com/store/kofi-telecom to order now.",
  );
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSentSuccess, setSmsSentSuccess] = useState(false);

  const recipientCounts = { all: 145, repeat: 58, inactive: 42 };
  const smsUnitsCost = (recipientCounts[smsAudience] * 0.04).toFixed(2);

  const handleSendBulkSms = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingSms(true);
    setTimeout(() => {
      setIsSendingSms(false);
      setSmsSentSuccess(true);
      setTimeout(() => setSmsSentSuccess(false), 3500);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <Send className="w-6 h-6 text-purple-600" />
          <span>Bulk SMS Campaign Dispatcher</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Send promotional SMS alerts to your store customers with your custom sender name.
        </p>
      </div>

      <form
        onSubmit={handleSendBulkSms}
        className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-5 text-xs"
      >
        {/* Audience Segment */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Target Audience Group
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all", label: "All Buyers", count: 145 },
              { id: "repeat", label: "Repeat Customers", count: 58 },
              { id: "inactive", label: "Inactive (>14d)", count: 42 },
            ].map((aud) => (
              <button
                key={aud.id}
                type="button"
                onClick={() => setSmsAudience(aud.id as any)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  smsAudience === aud.id
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30 font-bold text-foreground"
                    : "border-border bg-background hover:bg-muted text-muted-foreground"
                }`}
              >
                <div className="text-xs">{aud.label}</div>
                <div className="text-[10px] text-primary font-bold">
                  {aud.count} Contacts
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Sender ID */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Alphanumeric Sender ID (Max 11 chars)
          </label>
          <input
            type="text"
            maxLength={11}
            required
            value={senderId}
            onChange={(e) => setSenderId(e.target.value.toUpperCase())}
            className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-mono uppercase"
          />
        </div>

        {/* Message Body */}
        <div>
          <div className="flex justify-between font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            <span>Message Text</span>
            <span className="font-mono">{smsMessage.length} / 160 (1 SMS page)</span>
          </div>
          <textarea
            rows={4}
            required
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-xs leading-relaxed"
          />
        </div>

        {/* Cost & Submit */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <span className="text-muted-foreground">Estimated Campaign Cost:</span>
            <div className="text-lg font-black text-foreground tabular-nums">
              GH₵ {smsUnitsCost} ({recipientCounts[smsAudience]} recipients @ GH₵ 0.04)
            </div>
          </div>

          <button
            type="submit"
            disabled={isSendingSms}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSendingSms ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching Bulk SMS Gateway...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Campaign</span>
              </>
            )}
          </button>
        </div>

        {smsSentSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Campaign dispatched successfully to {recipientCounts[smsAudience]} handsets!
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
