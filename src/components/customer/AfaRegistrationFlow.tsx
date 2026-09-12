import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { AfaApplication } from '../../types';
import { SignalRail } from '../common/SignalRail';

interface AfaRegistrationFlowProps {
  walletBalance: number;
  onApplicationSubmitted: (app: AfaApplication) => void;
  applications: AfaApplication[];
}

export const AfaRegistrationFlow: React.FC<AfaRegistrationFlowProps> = ({
  walletBalance,
  onApplicationSubmitted,
  applications,
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('0244192834');
  const [ghanaCard, setGhanaCard] = useState('GHA-728192834-1');
  const [region, setRegion] = useState('Greater Accra');
  const [occupation, setOccupation] = useState('Agribusiness / Produce Retail');
  const [consent, setConsent] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<AfaApplication | null>(null);

  const fee = 50.00;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      alert('Please check the consent box to authorize Ghana Card verification.');
      return;
    }
    if (walletBalance < fee) {
      alert('Insufficient wallet balance to cover the GH₵ 50.00 processing fee. Please fund your wallet.');
      return;
    }

    const ref = `AFA-GH-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApp: AfaApplication = {
      id: `afa-${Date.now()}`,
      reference: ref,
      fullName,
      phoneNumber,
      ghanaCardNumber: ghanaCard,
      region,
      occupation,
      dateSubmitted: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'under_review',
      fee,
      notes: 'Submitted to Ministry of Food and Agriculture database for telecom tariff whitelisting.'
    };

    onApplicationSubmitted(newApp);
    setSubmittedApp(newApp);
  };

  const regions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
    'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono', 'Bono East',
    'Ahafo', 'Oti', 'Savannah', 'North East', 'Western North'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>AFA Registration (Subsidized Telecom Tariff)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agricultural & Rural Workers subsidized mobile tariff enrollment for MTN, Telecel, and AT.
          </p>
        </div>
        <SignalRail status="online" size="sm" label="MoFA Gateway Live" />
      </div>

      {!submittedApp ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Eligibility Explainer Banner */}
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs space-y-2">
            <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
              Who is eligible for the AFA Subsidized Tariff?
            </h3>
            <p className="leading-relaxed">
              Ghanaian citizens engaged in farming, agricultural commerce, food trading, farm logistics, or rural trades can register their Ghana SIM card. Once approved, you unlock special discounted monthly tariffs (e.g. 10GB for ~GH₵35).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-foreground">Subscriber & Identity Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Full Legal Name (as on Ghana Card)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah Addo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Ghana Phone Number to Register
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0244192834"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Ghana Card Number (GHA-XXXXXXXXX-X)
                </label>
                <input
                  type="text"
                  required
                  placeholder="GHA-728192834-1"
                  value={ghanaCard}
                  onChange={(e) => setGhanaCard(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Region of Residence
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden"
                >
                  {regions.map((r) => (
                    <option key={r} value={r}>{r} Region</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Primary Trade / Farming Activity
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cocoa / Maize Farming, Yam Wholesale Trader, Farm Logistics"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden"
                />
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-3 border-t border-border flex items-start gap-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                id="consentCheck"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <label htmlFor="consentCheck" className="cursor-pointer select-none leading-relaxed">
                I hereby declare that the information provided matches my official Ghana Card. I authorize Smart Data Hub to submit this application to the National Identification Authority (NIA) and Telecom Carrier database for tariff whitelisting.
              </label>
            </div>

            {/* Price and Submit */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Registration Processing Fee:</span>
                <div className="text-xl font-black text-foreground tabular-nums">GH₵ {fee.toFixed(2)}</div>
              </div>

              <button
                type="submit"
                disabled={!consent}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                Submit AFA Application (GH₵ 50.00)
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground">AFA Application Submitted!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Application <strong>{submittedApp.reference}</strong> has been logged and sent for NIA/MoFA verification.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applicant Name:</span>
              <span className="font-bold text-foreground">{submittedApp.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone Number:</span>
              <span className="font-mono text-foreground">{submittedApp.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold">
                Under Review (24-48 Hours)
              </span>
            </div>
          </div>

          <button
            onClick={() => setSubmittedApp(null)}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      )}

      {/* Existing Applications History */}
      {applications.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-border">
          <h3 className="text-sm font-bold text-foreground">Your Previous AFA Submissions</h3>
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="p-4 rounded-xl bg-card border border-border flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-foreground">{app.fullName} ({app.phoneNumber})</div>
                  <div className="text-[11px] text-muted-foreground">Ref: {app.reference} • {app.region}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  app.status === 'approved'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-900 dark:text-amber-300'
                }`}>
                  {app.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
