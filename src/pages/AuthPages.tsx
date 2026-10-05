import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { Button, Card, Field, Icon, Input, Seal } from "../components/ui";

function AuthShell({ title, sub, children, footer }: { title: string; sub: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 pb-10 pt-14 sm:pt-20">
      <Seal size={52} className="text-accent" />
      <h1 className="mt-5 font-display text-[32px] font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-center text-[13.5px] leading-relaxed text-ink-soft">{sub}</p>
      <Card ticks className="mt-8 w-full p-7">{children}</Card>
      {footer && <div className="mt-6 text-center text-[13px] text-ink-soft">{footer}</div>}
    </div>
  );
}

function ErrorNote({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p className="anim-fade flex items-start gap-2 border border-accent/30 bg-accent/8 px-3.5 py-3 text-[12.5px] leading-relaxed text-accent-deep">
      <Icon name="alert" size={15} className="mt-0.5 shrink-0" /> {msg}
    </p>
  );
}

/* ============================= LOGIN ============================= */

export function LoginPage() {
  const { login, toast } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Please enter both your email and password.");
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Login failed.");
    toast(`Welcome back${res.role === "admin" ? ", Administrator" : ""}.`, "success");
    nav(res.role === "admin" ? "/admin" : "/dashboard");
  };

  const quick = (em: string) => {
    setEmail(em);
    setPassword("demo123");
    setError("");
  };

  return (
    <AuthShell
      title="Welcome back"
      sub="Log in to view your document requests, quotations and completed files."
      footer={
        <>
          New here? <Link to="/signup" className="font-semibold text-accent hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" required>
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Password" required>
          <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-[12.5px] font-medium text-ink-soft hover:text-accent">Forgot password?</Link>
        </div>
        <ErrorNote msg={error} />
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "Signing in…" : "Log In"}
        </Button>
      </form>
      <div className="mt-6 border-t border-line-soft pt-5">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Demo accounts</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => quick("aarav@demo.ink")} className="corner-ticks border border-line bg-cream px-3 py-2.5 text-left transition-colors hover:border-accent/50">
            <p className="text-[12px] font-semibold text-ink">Demo User</p>
            <p className="mt-0.5 text-[10.5px] text-ink-faint">aarav@demo.ink</p>
          </button>
          <button onClick={() => quick("admin@demo.ink")} className="corner-ticks border border-line bg-cream px-3 py-2.5 text-left transition-colors hover:border-gold/70">
            <p className="text-[12px] font-semibold text-ink">Demo Admin</p>
            <p className="mt-0.5 text-[10.5px] text-ink-faint">admin@demo.ink</p>
          </button>
        </div>
        <p className="mt-3 text-center text-[11px] text-ink-faint">Both use the password <span className="font-mono text-ink-soft">demo123</span></p>
      </div>
    </AuthShell>
  );
}

/* ============================= SIGN UP ============================= */

export function SignupPage() {
  const { signup, toast } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (f.name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError("Please enter a valid email address.");
    if (f.password.length < 6) return setError("Password must be at least 6 characters.");
    if (f.password !== f.confirm) return setError("The two passwords do not match.");
    setBusy(true);
    const res = await signup({ name: f.name, email: f.email, phone: f.phone, password: f.password });
    setBusy(false);
    if (!res.ok) return setError(res.error || "Could not create the account.");
    toast("Your account is ready.", "success", "You can now submit your first document.");
    nav("/dashboard");
  };

  return (
    <AuthShell
      title="Create your account"
      sub="One account for all your document requests, quotes and downloads."
      footer={
        <>
          Already registered? <Link to="/login" className="font-semibold text-accent hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full Name" required hint="Used on your requests, just as it should appear.">
          <Input placeholder="e.g. Aarav Mehta" value={f.name} onChange={set("name")} autoComplete="name" />
        </Field>
        <Field label="Email" required>
          <Input type="email" placeholder="you@example.com" value={f.email} onChange={set("email")} autoComplete="email" />
        </Field>
        <Field label="Phone Number" optional hint="Only used if we need to reach you about a specific request.">
          <Input type="tel" placeholder="+91 …" value={f.phone} onChange={set("phone")} autoComplete="tel" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required>
            <Input type="password" placeholder="At least 6 characters" value={f.password} onChange={set("password")} autoComplete="new-password" />
          </Field>
          <Field label="Confirm Password" required>
            <Input type="password" placeholder="Repeat password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" />
          </Field>
        </div>
        <ErrorNote msg={error} />
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "Creating account…" : "Sign Up"}
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-ink-faint">
          By signing up you agree to our terms. Your documents are handled per our privacy notes in Help.
        </p>
      </form>
    </AuthShell>
  );
}

/* ============================= FORGOT / RESET ============================= */

export function ForgotPage() {
  const { resetPassword } = useStore();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sent">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    const res = await resetPassword(email);
    if (!res.ok) return setError(res.error || "Could not process the request.");
    setState("sent");
  };

  return (
    <AuthShell title="Forgot your password?" sub="Enter the email of your account and we will help you back in.">
      {state === "sent" ? (
        <div className="anim-pop text-center">
          <span className="corner-ticks mx-auto grid h-14 w-14 place-items-center border border-moss/40 bg-moss/10 text-moss">
            <Icon name="mail" size={24} />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold text-ink">Check your inbox</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            If an account exists for <span className="font-semibold text-ink">{email}</span>, a reset link is on its way.
            <br />
            <span className="text-ink-faint">Delivery of emails will be connected through the backend once it is live.</span>
          </p>
          <Link to="/reset-password" className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:underline">
            <Icon name="lock" size={14} /> Open the reset link (demo)
          </Link>
          <p className="mt-3">
            <Link to="/login" className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-soft hover:text-accent">
              <Icon name="arrowL" size={14} /> Back to login
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" required>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <ErrorNote msg={error} />
          <Button type="submit" className="w-full" size="lg">
            Send Reset Link
          </Button>
          <p className="text-center">
            <Link to="/login" className="text-[12.5px] font-medium text-ink-soft hover:text-accent">Back to login</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 6) return setError("Password must be at least 6 characters.");
    if (pw !== pw2) return setError("The two passwords do not match.");
    setDone(true);
  };

  return (
    <AuthShell title="Set a new password" sub="Choose a new password for your account.">
      {done ? (
        <div className="anim-pop text-center">
          <span className="corner-ticks mx-auto grid h-14 w-14 place-items-center border border-moss/40 bg-moss/10 text-moss">
            <Icon name="check" size={26} />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold text-ink">Password updated</h2>
          <p className="mt-2 text-[13px] text-ink-soft">You can now log in with your new password.</p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:underline">
            <Icon name="arrowL" size={14} /> Go to login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="New Password" required>
            <Input type="password" placeholder="At least 6 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field label="Confirm New Password" required>
            <Input type="password" placeholder="Repeat password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
          <ErrorNote msg={error} />
          <Button type="submit" className="w-full" size="lg">
            Update Password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
