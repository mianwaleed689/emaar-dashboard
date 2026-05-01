/* eslint-disable */
/* ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
   DXB ANALYTICS ‚‚Ç¨‚Äù LOGIN SCREEN
   Extracted from EmaarDashboardV2.jsx
   Full auth flow: login, signup, Google OAuth, verify email, reset password
   ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê */

import React, { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { T } from "../data";
import { Icons } from "./Icons";
import { PasswordStrength } from "./SharedUI";
import { buildGlobalCSS } from "../styles/global";
import { TRIAL_DURATION_MS } from "../utils/constants";

const css = buildGlobalCSS(T);
const googleProvider = new GoogleAuthProvider();

const LoginScreen = ({ onLogin, onBack, defaultMode = "login" }) => {
  const [mode, setMode] = useState(defaultMode);
  const [screen, setScreen] = useState("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m) => { setMode(m); setError(""); setPass(""); setConfirmPass(""); };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      const snap = await getDoc(doc(db, "users", u.uid));
      if (!snap.exists()) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + TRIAL_DURATION_MS);
        await setDoc(doc(db, "users", u.uid), {
          name: u.displayName || u.email.split("@")[0],
          email: u.email, tier: "pro_trial",
          createdAt: now.toISOString(), trialStart: now.toISOString(), trialEnd: trialEnd.toISOString(),
          role: "user", provider: "google",
        });
        try {
          const emailjs = await import("@emailjs/browser");
          await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
            user_email: u.email, user_name: u.displayName || u.email.split("@")[0],
            project_name: "DXB Analytics Platform", change_type: "Welcome to DXB Analytics!",
            new_value: "Your 7-day Pro Trial is now active. Explore 48+ projects, yields, ROI data and more.",
            old_value: "New Account", updated_at: now.toLocaleDateString("en-AE"),
          }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
        } catch(e) {}
      }
      onLogin(u.email);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError("Google sign-in failed. Please try again.");
    }
    setGoogleLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email first, then click Forgot password"); return; }
    setLoading(true);
    try { await sendPasswordResetEmail(auth, email); setScreen("reset_sent"); setError(""); }
    catch (err) { setError("Could not send reset email. Check your email address."); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    if (!email || !pass) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, pass); onLogin(email); }
    catch (err) {
      const msgs = {
        "auth/user-not-found": "Invalid email or password",
        "auth/invalid-credential": "Invalid email or password",
        "auth/wrong-password": "Incorrect password",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/user-disabled": "This account has been disabled. Contact support.",
      };
      setError(msgs[err.code] || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e?.preventDefault?.();
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!email) { setError("Please enter your email address"); return; }
    if (!pass) { setError("Please enter a password"); return; }
    if (pass.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[0-9]/.test(pass)) { setError("Password must contain at least one number"); return; }
    if (pass !== confirmPass) { setError("Passwords do not match"); return; }
    if (!agreedTerms) { setError("Please agree to the Terms of Service and Privacy Policy"); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + TRIAL_DURATION_MS);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(), email, phone: phone.trim(), country: country.trim(),
        tier: "pro_trial", createdAt: now.toISOString(), trialStart: now.toISOString(), trialEnd: trialEnd.toISOString(),
        role: "user", emailVerified: false, provider: "email",
      });
      try { await sendEmailVerification(cred.user); } catch(e) {}
      try {
        const emailjs = await import("@emailjs/browser");
        await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
          user_email: email, user_name: name.trim(),
          project_name: "DXB Analytics Platform", change_type: "Welcome to DXB Analytics! ‚‚Ç¨‚Äù Please verify your email",
          new_value: "Your 7-day Pro Trial is active. Check your inbox to verify your email address.",
          old_value: "New Account", updated_at: now.toLocaleDateString("en-AE"),
        }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
      } catch(e) {}
      setScreen("verify");
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
        "auth/weak-password": "Password is too weak.",
        "auth/invalid-email": "Please enter a valid email address.",
      };
      setError(msgs[err.code] || "Sign up failed. Please try again.");
    }
    setLoading(false);
  };

  // ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Verify Email Screen ‚‚Äù‚Ç¨‚‚Äù‚Ç¨
  if (screen === "verify") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>ü‚Äúß</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10 }}>Check your inbox</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a verification link to <span style={{ color: T.gold, fontWeight: 600 }}>{email}</span>
          </p>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to verify your account, then come back and sign in. Check your spam folder if you don't see it within 2 minutes.
          </p>
          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, textAlign: "left" }}>
            {["Click the link in the verification email", "Return to this page", "Sign in with your email & password"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: T.green, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                <span style={{ fontSize: 12, color: T.textSecondary }}>{s}</span>
              </div>
            ))}
          </div>
          <button type="button" className="login-btn" onClick={() => { setScreen("form"); setMode("login"); setPass(""); setConfirmPass(""); }}>Go to Sign In ‚Ü‚Äô</button>
          <button type="button" onClick={async () => { try { if (auth.currentUser) { await sendEmailVerification(auth.currentUser); alert("Verification email resent! Check your inbox."); } } catch(e){} }} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Resend verification email</button>
        </div>
      </div>
    </div>
  );

  // ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Reset Sent Screen ‚‚Äù‚Ç¨‚‚Äù‚Ç¨
  if (screen === "reset_sent") return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(212,168,67,0.3)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>ü‚Äù‚Äò</div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 800, color: T.white, marginBottom: 10 }}>Password Reset Sent</h2>
          <p style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a reset link to <span style={{ color: T.gold, fontWeight: 600 }}>{email}</span>
          </p>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.7, marginBottom: 28 }}>
            Click the link in the email to set a new password. The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>
          <button type="button" className="login-btn" onClick={() => setScreen("form")}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );

  // ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Main Form ‚‚Äù‚Ç¨‚‚Äù‚Ç¨
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{css}</style>
      {onBack && (
        <button type="button" onClick={onBack} style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", color: T.textSecondary, fontSize: 13, fontFamily: "'Outfit', sans-serif", cursor: "pointer", zIndex: 10 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}>
          ‚Üê Back to Home
        </button>
      )}
      <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: `radial-gradient(${T.gold} 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
      <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(212,168,67,0.04) 0%, transparent 70%)` }} />

      <div className="fade-up" style={{ width: "100%", maxWidth: 440, padding: "0 20px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke={T.gold} strokeWidth="2" /><path d="M12 28V12h10l-6 8h8l-12 8z" fill={T.gold} /></svg>
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color: T.gold, letterSpacing: -0.5, marginBottom: 2 }}>DXB Analytics</h1>
          <p style={{ color: T.textMuted, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>Dubai Real Estate Intelligence</p>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 32 }}>
          {/* Mode Toggle */}
          <div style={{ display: "flex", marginBottom: 24, background: T.surfaceAlt, borderRadius: 10, padding: 3 }}>
            <button type="button" onClick={() => switchMode("login")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: mode === "login" ? T.gold : "transparent", color: mode === "login" ? T.bg : T.textMuted }}>Sign In</button>
            <button type="button" onClick={() => switchMode("signup")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: mode === "signup" ? T.gold : "transparent", color: mode === "signup" ? T.bg : T.textMuted }}>Create Account</button>
          </div>

          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: T.white, marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Start your free trial"}
          </h2>
          <p style={{ color: T.textSecondary, fontSize: 13, marginBottom: 20 }}>
            {mode === "login" ? "Sign in to access your dashboard" : "7 days full Pro access ‚‚Ç¨‚Äù no credit card required"}
          </p>

          {/* Google Sign-In */}
          <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", marginBottom: 16, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            {googleLoading
              ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: T.white, borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
              : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.4 5.5-5 7.2v6h8.1c4.7-4.4 7.2-10.8 7.2-17.3z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-8.1-6c-2.1 1.4-4.7 2.2-7.8 2.2-6 0-11-4-12.8-9.5H3v6.2C7 42.6 15 48 24 48z"/><path fill="#FBBC05" d="M11.2 28.9c-.5-1.4-.7-2.8-.7-4.4s.3-3 .7-4.4V14H3a23.9 23.9 0 0 0 0 20l8.2-5.1z"/><path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.6-6.6C35.9 2.5 30.4 0 24 0 15 0 7 5.4 3 13.9l8.2 5.1C13 13.6 18 9.5 24 9.5z"/></svg>
            }
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Full Name *</label>
                  <input className="login-input" type="text" placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Phone</label>
                    <input className="login-input" type="tel" placeholder="+971 50 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Country</label>
                    <input className="login-input" type="text" placeholder="UAE" value={country} onChange={e => setCountry(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Email Address *</label>
              <input className="login-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Password *</label>
              <div style={{ position: "relative" }}>
                <input className="login-input" type={showPass ? "text" : "password"} placeholder={mode === "signup" ? "Min 8 chars + 1 number" : "‚‚Ç¨¢‚‚Ç¨¢‚‚Ç¨¢‚‚Ç¨¢‚‚Ç¨¢‚‚Ç¨¢‚‚Ç¨¢‚‚Ç¨¢"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                  {showPass ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
              {mode === "signup" && <PasswordStrength password={pass} />}
            </div>

            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Confirm Password *</label>
                <div style={{ position: "relative" }}>
                  <input className="login-input" type={showConfirm ? "text" : "password"} placeholder="Re-enter your password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} style={{ paddingRight: 44, borderColor: confirmPass && confirmPass !== pass ? "rgba(239,68,68,0.5)" : confirmPass && confirmPass === pass ? "rgba(16,185,129,0.5)" : undefined }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
                    {showConfirm ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
                {confirmPass && confirmPass !== pass && <div style={{ fontSize: 10, color: T.red, marginTop: 4 }}>‚ú‚Äî Passwords do not match</div>}
                {confirmPass && confirmPass === pass && <div style={{ fontSize: 10, color: T.green, marginTop: 4 }}>‚ú‚Äú Passwords match</div>}
              </div>
            )}

            {error && <div style={{ color: T.red, fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

            {mode === "login" && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleForgot} type="button" disabled={loading} style={{ background: "none", border: "none", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", padding: 0 }}>
                  {loading ? "Sending..." : "Forgot password?"}
                </button>
              </div>
            )}

            {mode === "signup" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} style={{ accentColor: T.gold, marginTop: 2, flexShrink: 0, width: 14, height: 14 }} />
                <span style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                  I agree to the <a href="/terms" target="_blank" rel="noreferrer" style={{ color: T.gold, fontWeight: 600 }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: T.gold, fontWeight: 600 }}>Privacy Policy</a>. I consent to DXB Analytics processing my data for real estate intelligence services.
                </span>
              </label>
            )}

            <button type="button" className="login-btn" onClick={mode === "login" ? handleLogin : handleSignUp} disabled={loading || (mode === "signup" && !agreedTerms)}>
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(4,9,15,0.3)", borderTopColor: T.bg, borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? "Sign In" : "Start Free Trial ‚Ü‚Äô"}
            </button>

            {mode === "signup" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(212,168,67,0.06)", borderRadius: 8, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 16 }}>‚≠ê</span>
                <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>
                  <span style={{ color: T.gold, fontWeight: 600 }}>7-day Pro trial</span> ‚‚Ç¨‚Äù Full access. No credit card. Cancel anytime.
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <p style={{ color: T.textMuted, fontSize: 12 }}>
              {mode === "login" ? (
                <>Don't have an account? <button type="button" onClick={() => switchMode("signup")} style={{ color: T.gold, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif", padding: 0 }}>Sign up free</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode("login")} style={{ color: T.gold, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Outfit',sans-serif", padding: 0 }}>Sign in</button></>
              )}
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", color: T.textMuted, fontSize: 11, marginTop: 20 }}>
          ü‚Äù‚Äô Secured by Firebase ¬∑ SSL Encrypted ¬∑ GDPR Compliant
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
