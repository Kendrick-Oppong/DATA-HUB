import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Sparkles, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SignalRail } from '../common/SignalRail';

interface AdminPinGateProps { onSubmitPin: (pin: string) => void; error?: string; isSuccess?: boolean; onCancel: () => void; onOpenSecurityPins?: () => void; }

export const AdminPinGate: React.FC<AdminPinGateProps> = ({ onSubmitPin, error = '', isSuccess = false, onCancel, onOpenSecurityPins }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const updateDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value) || isSuccess) return;
    const next = [...pin]; next[index] = value; setPin(next);
    if (value && index < 3) document.getElementById(`admin-pin-${index + 1}`)?.focus();
    if (value && index === 3) onSubmitPin(next.join(''));
  };
  const useDemoPin = () => { setPin(['0', '0', '0', '0']); onSubmitPin('0000'); };
  return <div className="flex min-h-[75vh] items-center justify-center p-4"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-xl sm:p-8">
    <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">{isSuccess ? <CheckCircle2 className="size-8 text-success" /> : <ShieldAlert className="size-8" />}</div>
    <div className="mt-6 flex flex-col gap-2"><div className="flex items-center justify-center gap-2"><span className="rounded-full bg-destructive/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive">Restricted · Level 3</span><SignalRail status="online" size="sm" /></div><h2 className="text-xl font-black tracking-tight sm:text-2xl">NOC Operations Clearance</h2><p className="text-xs leading-relaxed text-muted-foreground">Enter the clearance PIN to access carrier operations.</p></div>
    <div className="mt-6 flex flex-col gap-3"><div className="flex justify-center gap-3">{pin.map((digit, index) => <Input key={index} id={`admin-pin-${index}`} type="password" inputMode="numeric" maxLength={1} autoFocus={index === 0} value={digit} onChange={(event) => updateDigit(index, event.target.value)} disabled={isSuccess} aria-label={`PIN digit ${index + 1}`} className={`size-12 rounded-2xl p-0 text-center font-mono text-2xl font-black sm:size-14 ${error ? 'border-destructive ring-2 ring-destructive/20' : ''}`} />)}</div>{error && <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-destructive"><AlertTriangle className="size-3.5" />{error}</p>}{isSuccess && <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-success"><CheckCircle2 className="size-3.5" />Clearance authorized.</p>}</div>
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-3.5 text-left"><div><span className="block text-[10px] font-bold uppercase text-muted-foreground">Demo access</span><span className="font-mono font-bold">0000</span></div><Button type="button" size="sm" onClick={useDemoPin}><Sparkles data-icon="inline-start" />Use demo PIN</Button></div>
    <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs"><Button type="button" variant="ghost" size="sm" onClick={onCancel}><ArrowLeft data-icon="inline-start" />Return to dashboard</Button>{onOpenSecurityPins && <Button type="button" variant="link" size="sm" onClick={onOpenSecurityPins}><KeyRound data-icon="inline-start" />PIN reference</Button>}</div>
  </div></div>;
};

export default AdminPinGate;
