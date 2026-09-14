"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { Arc, Brand, Field, Kente } from "@/components/ui";

/* Smart Data Hub — auth: signup / login / OTP / recovery */
const { useState: aU, useRef: aR, useEffect: aE } = React;

function OtpInput({ onComplete }) {
  const [vals, setVals] = aU(["", "", "", ""]);
  const refs = [aR(), aR(), aR(), aR()];
  aE(() => { refs[0].current && refs[0].current.focus(); }, []);
  const set = (i, v) => {
    v = v.replace(/\D/g, "").slice(-1);
    const next = [...vals]; next[i] = v; setVals(next);
    if (v && i < 3) refs[i + 1].current.focus();
    if (next.every(x => x)) onComplete(next.join(""));
  };
  const key = (i, e) => { if (e.key === "Backspace" && !vals[i] && i > 0) refs[i - 1].current.focus(); };
  return (
    <div className="otp-row">
      {vals.map((v, i) => (
        <input key={i} ref={refs[i]} inputMode="numeric" value={v} className={v ? "filled" : ""}
          onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => key(i, e)} maxLength={1} />
      ))}
    </div>
  );
}

function AuthAside() {
  const { S } = useStore();
  const faces = [["Ama", "logo-mtn"], ["Kwesi", "logo-atigo"], ["Efua", "logo-telecel"], ["Yaw", "logo-dstv"]];
  return (
    <div className="auth-aside">
      <Kente />
      <Arc style={{ bottom: -30, right: -40, width: 320 }} stroke="var(--teal)" opacity={0.1} />
      <Brand light />
      <span className="akwaaba"><I.bolt size={14} stroke="var(--teal)" />Akwaaba — welcome</span>
      <h2>Smart Data, <span className="t">Seamless</span> Connection.</h2>
      <p className="lead">You're in good company. Thousands of customers and agents buy data, airtime and digital services here — instantly, any time of day.</p>
      <div className="pts">
        {[["bolt", "Delivered in seconds — no waiting around"], ["coins", "Agents earn commission on every single order"], ["shield", "Payments stay safe through a licensed gateway"]].map(([ic, t], i) => (
          <div className="pt" key={i}><span className="b"><Ic name={ic} size={18} /></span>{t}</div>
        ))}
      </div>
      <div className="aside-proof">
        <div className="avatars">
          {faces.map(([nm, cls], i) => <span key={i} className={"netbadge " + cls} title={nm}>{nm[0]}</span>)}
        </div>
        <div className="txt">Joined by <strong>{S.company.stats.resellers} Ghanaians</strong> buying &amp; reselling every day · <strong>{S.company.stats.rating}</strong></div>
      </div>
    </div>
  );
}

function AuthScreen() {
  const { authMode, setAuthMode, authenticate, registerStart, registerVerify, loginUser, resetStart, resetVerify, checkRefCode, setScreen, navSite, toast, S } = useStore();
  const [step, setStep] = aU("form");       // form | otp | recover
  const [role, setRole] = aU("reseller");
  const [name, setName] = aU("");
  const [email, setEmail] = aU("");
  const [phone, setPhone] = aU("");
  const [loginId, setLoginId] = aU("");
  const [pw, setPw] = aU("");
  const [pw2, setPw2] = aU("");
  const [showPw, setShowPw] = aU(false);
  const [err, setErr] = aU("");
  const [remember, setRemember] = aU(true);
  const [agree, setAgree] = aU(false);
  const [biz, setBiz] = aU("");
  const [busy, setBusy] = aU(false);
  const [srvErr, setSrvErr] = aU("");
  const [otpPurpose, setOtpPurpose] = aU("register");  // register | reset
  const [otpCode, setOtpCode] = aU("");
  const [resendIn, setResendIn] = aU(0);   // cooldown seconds before "Resend" is allowed again
  const [resending, setResending] = aU(false);
  const [refCode, setRefCode] = aU("");
  const [refInfo, setRefInfo] = aU(null);   // { valid, referrer } once a code has been checked

  // A referral link (…/?ref=CODE) pre-fills the code and drops the param from the URL.
  aE(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const r = q.get("ref");
      if (!r) return;
      setRefCode(r.toUpperCase().replace(/[^A-Z0-9]/g, ""));
      setAuthMode("signup");
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch (e) {}
  }, []);

  // Confirm a typed/linked code belongs to a real account, so the referrer's name can be
  // shown before the person commits to signing up.
  aE(() => {
    const c = refCode.trim();
    if (c.length < 3) { setRefInfo(null); return; }
    let alive = true;
    const t = setTimeout(async () => {
      const d = await checkRefCode(c);
      if (alive) setRefInfo(d);
    }, 400);
    return () => { alive = false; clearTimeout(t); };
  }, [refCode]);

  // Tick the resend cooldown down to zero.
  aE(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const isSignup = authMode === "signup";
  const emailOk = (v) => /\S+@\S+\.\S+/.test(v.trim());

  const signupData = () => ({ name: name.trim(), email: email.trim(), phone, password: pw, role, business: role === "reseller" ? biz.trim() : undefined, ref: refCode.trim() || undefined });

  const submitForm = async () => {
    if (isSignup) {
      if (!name.trim()) return setErr("name");
      if (role === "reseller" && !biz.trim()) return setErr("biz");
      if (!emailOk(email)) return setErr("email");
      if (phone.replace(/\D/g, "").length < 9) return setErr("phone");
      if (pw.length < 4) return setErr("pw");
      if (pw2 !== pw) return setErr("pw2");
      if (!agree) return setErr("agree");
      setErr(""); setSrvErr(""); setBusy(true);
      try { await registerStart(signupData()); setOtpPurpose("register"); setOtpCode(""); setResendIn(30); setStep("otp"); }
      catch (e) { setSrvErr(e.message); }
      finally { setBusy(false); }
    } else {
      if (!loginId.trim()) return setErr("loginId");
      if (pw.length < 4) return setErr("pw");
      setErr(""); setSrvErr(""); setBusy(true);
      try { await loginUser(loginId.trim(), pw); }   // authenticate() navigates away on success
      catch (e) { setSrvErr(e.message); setBusy(false); }
    }
  };

  // OTP step — verify signup or password-reset code; authenticate() then navigates away
  const verify = async (code) => {
    const c = String(code != null ? code : otpCode).replace(/\D/g, "");
    if (c.length < 4) return;
    setSrvErr(""); setBusy(true);
    try {
      if (otpPurpose === "reset") await resetVerify(phone, c);
      else await registerVerify(phone, c);
    } catch (e) { setSrvErr(e.message); setBusy(false); }
  };

  const sendResetCode = async () => {
    if (phone.replace(/\D/g, "").length < 9) return setSrvErr("Enter a valid phone number.");
    setSrvErr(""); setBusy(true);
    try { await resetStart(phone); setOtpPurpose("reset"); setOtpCode(""); setResendIn(30); setStep("otp"); }
    catch (e) { setSrvErr(e.message); }
    finally { setBusy(false); }
  };

  const resendCode = async () => {
    if (resending || resendIn > 0) return;   // guard against spam / double taps
    setSrvErr(""); setResending(true);
    try {
      if (otpPurpose === "reset") await resetStart(phone); else await registerStart(signupData());
      setOtpCode("");
      setResendIn(30);
      toast("New code sent — check your email", "send");
    } catch (e) { setSrvErr(e.message); }
    finally { setResending(false); }
  };

  return (
    <div className="auth">
      <AuthAside />
      <div className="auth-main">
        <div className={"auth-card" + (isSignup && step === "form" ? " wide" : "")}>
          {window.__SDH_WEB__ && <a className="auth-back" onClick={() => { setScreen("site"); navSite("home"); }} style={{ cursor: "pointer" }}><I.back size={16} />Back to home</a>}
          <div className="top-brand"><Brand onClick={() => setScreen("site")} /></div>

          {step === "form" && (
            <React.Fragment>
              <div className="auth-hello"><span className="hb"><I.bolt size={24} stroke="#fff" /></span></div>
              <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
              <p className="sub">{isSignup ? "Create your account with your name, email and phone number." : "Sign in with your email or phone number and password to access your dashboard."}</p>
              <div className="seg">
                <button className={isSignup ? "on" : ""} onClick={() => setAuthMode("signup")}>Sign up</button>
                <button className={!isSignup ? "on" : ""} onClick={() => setAuthMode("login")}>Sign in</button>
              </div>

              {isSignup && (
                <React.Fragment>
                  <div className="field" style={{ marginTop: 22 }}><label>I want to…</label></div>
                  <div className="role-pick">
                    <button className={"rp" + (role === "customer" ? " on" : "")} onClick={() => setRole("customer")}>
                      <div className="ic"><I.user size={20} /></div><div className="t">Buy for myself</div><div className="s">Data &amp; airtime for me, family and friends</div>
                    </button>
                    <button className={"rp" + (role === "reseller" ? " on" : "")} onClick={() => setRole("reseller")}>
                      <div className="ic"><I.coins size={20} /></div><div className="t">Become an agent</div><div className="s">Sell at wholesale &amp; earn commission</div>
                    </button>
                  </div>
                  {role === "reseller" && <div className="hint" style={{ marginTop: 8, display: "flex", gap: 7, alignItems: "flex-start" }}><I.info size={15} stroke="var(--muted)" style={{ flexShrink: 0, marginTop: 1 }} />Agent accounts are reviewed &amp; approved by our team. You'll start as a customer and get full agent access (store, wholesale prices, commission) once approved — by SMS &amp; email.</div>}
                </React.Fragment>
              )}

              {isSignup ? (
                <React.Fragment>
                <div className="auth-grid">
                  <Field label="Full name" icon="user" placeholder="e.g. Kwesi Boateng" value={name} onChange={(e) => setName(e.target.value)} hint={err === "name" ? "Please enter your name" : null} error={err === "name"} />
                  {role === "reseller" && (
                    <Field label="Business / store name" icon="brief" placeholder="e.g. Kwesi Data Hub" value={biz} onChange={(e) => setBiz(e.target.value)} hint={err === "biz" ? "Enter your business name" : "This shows to customers on your store"} error={err === "biz"} />
                  )}
                  <Field label="Email" icon="mail" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} hint={err === "email" ? "Enter a valid email address" : null} error={err === "email"} />
                  <Field label="Phone number" icon="phone" pre="+233" placeholder="24 000 0000" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} hint={err === "phone" ? "Enter a valid phone number" : "We'll text you a one-time code"} error={err === "phone"} />
                  <Field label="Password" icon="lock" reveal placeholder="Create a password" value={pw} onChange={(e) => setPw(e.target.value)} hint={err === "pw" ? "At least 4 characters" : null} error={err === "pw"} />
                  <Field label="Confirm password" icon="lock" reveal placeholder="Re-enter password" value={pw2} onChange={(e) => setPw2(e.target.value)} hint={err === "pw2" ? "Passwords don't match" : null} error={err === "pw2"} />
                  <Field
                    label="Referral code (optional)" icon="gift" placeholder="e.g. KWESI1899"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    hint={refInfo ? (refInfo.valid ? `Referred by ${refInfo.referrer} — you get GH₵2 credit once your first order is delivered` : "We don't recognise that code") : "Got a code from a friend? Enter it for GH₵2 off your first order."}
                    error={!!refInfo && !refInfo.valid}
                  />
                </div>
                <div className="auth-pw-tools">
                  {pw2.length > 0 && (
                    <span className={"auth-pwmatch " + (pw2 === pw ? "ok" : "bad")}>
                      {pw2 === pw ? <React.Fragment><I.check size={14} stroke="currentColor" sw={3} />Passwords match</React.Fragment> : <React.Fragment><I.x size={13} stroke="currentColor" sw={3} />Passwords don't match</React.Fragment>}
                    </span>
                  )}
                </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Field label="Email or phone" icon="user" placeholder="you@example.com or 024 000 0000" value={loginId} onChange={(e) => setLoginId(e.target.value)} hint={err === "loginId" ? "Enter your email or phone number" : null} error={err === "loginId"} />
                  <Field label="Password" icon="lock" reveal placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} hint={err === "pw" ? "Password must be at least 4 characters" : null} error={err === "pw"} />
                  <div className="auth-remember-row">
                    <label className="auth-remember">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      <span className="rbox" style={remember ? { background: "var(--blue)", borderColor: "var(--blue)" } : undefined}>{remember && <I.check size={12} stroke="#fff" sw={3.2} />}</span>
                      Remember me
                    </label>
                    <a className="auth-forgot" onClick={() => { setStep("recover"); setSrvErr(""); setErr(""); }}>Forgot password?</a>
                  </div>
                </React.Fragment>
              )}

              {isSignup && (
                <label className={"auth-agree" + (err === "agree" ? " bad" : "")}>
                  <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); if (e.target.checked && err === "agree") setErr(""); }} />
                  <span className="rbox" style={agree ? { background: "var(--blue)", borderColor: "var(--blue)" } : undefined}>{agree && <I.check size={12} stroke="#fff" sw={3.2} />}</span>
                  <span>I agree to Smart Data Hub's <a onClick={(ev) => { ev.stopPropagation(); ev.preventDefault(); setScreen("site"); navSite("terms"); }}>Terms &amp; Conditions</a> &amp; Privacy Policy.</span>
                </label>
              )}

              {srvErr && <div className="hint err" style={{ marginBottom: 10, marginTop: -6, textAlign: "center" }}>{srvErr}</div>}
              <button className="btn btn-pri btn-full" onClick={submitForm} disabled={busy} style={busy ? { opacity: .7 } : undefined}>{busy ? (isSignup ? "Sending code…" : "Signing in…") : (isSignup ? "Create account" : "Sign in")}<I.arrow size={18} stroke="#fff" /></button>

              <div className="auth-alt">
                {isSignup ? "Already have an account? " : "New to Smart Data Hub? "}
                <a onClick={() => setAuthMode(isSignup ? "login" : "signup")}>{isSignup ? "Sign in" : "Create one"}</a>
              </div>
              {!isSignup && <p className="legal">By continuing you agree to Smart Data Hub's <a onClick={() => navSite("terms")} style={{ color: "var(--blue-700)", fontWeight: 600, cursor: "pointer" }}>Terms &amp; Conditions</a>. Phone-number sign-in keeps things light; OTP protects your wallet.</p>}
            </React.Fragment>
          )}

          {step === "otp" && (
            <React.Fragment>
              <button className="iconbtn" style={{ marginBottom: 18 }} onClick={() => { setStep("form"); setSrvErr(""); }}><I.back size={20} /></button>
              <h1>Verify your email</h1>
              <p className="sub">We sent a 4-digit code to <strong>{otpPurpose === "reset" ? "the email on your account" : (email || "your email")}</strong>. Enter it below to continue.</p>
              <OtpInput onComplete={(c) => { setOtpCode(c); verify(c); }} />
              {srvErr && <div className="hint err" style={{ margin: "2px 0 10px", textAlign: "center" }}>{srvErr}</div>}
              <button className="btn btn-pri btn-full" onClick={() => verify()} disabled={busy} style={busy ? { opacity: .7 } : undefined}>{busy ? "Verifying…" : "Verify & continue"}</button>
              <div className="auth-alt">
                Didn't get it?{" "}
                {resendIn > 0
                  ? <span style={{ opacity: .6 }}>Resend code in {resendIn}s</span>
                  : <a onClick={resendCode} style={{ cursor: resending ? "default" : "pointer", opacity: resending ? .6 : 1 }}>{resending ? "Sending…" : "Resend code"}</a>}
              </div>
            </React.Fragment>
          )}

          {step === "recover" && (
            <React.Fragment>
              <button className="iconbtn" style={{ marginBottom: 18 }} onClick={() => setStep("form")}><I.back size={20} /></button>
              <h1>Reset password</h1>
              <p className="sub">Enter your registered phone number and we'll email a reset code to the address on your account.</p>
              <Field label="Phone number" icon="phone" pre="+233" placeholder="24 000 0000" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {srvErr && <div className="hint err" style={{ marginBottom: 10, textAlign: "center" }}>{srvErr}</div>}
              <button className="btn btn-pri btn-full" onClick={sendResetCode} disabled={busy} style={busy ? { opacity: .7 } : undefined}>{busy ? "Sending…" : "Send reset code"}<I.send size={18} stroke="#fff" /></button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

export { AuthAside, AuthScreen, OtpInput };
