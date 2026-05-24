"use client";
import * as React from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode]   = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [pw, setPw]       = React.useState("");
  const [busy, setBusy]   = React.useState(false);
  const [err, setErr]     = React.useState<string | null>(null);
  const [msg, setMsg]     = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    const sb = createSupabaseBrowser();
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        location.href = "/";
      } else {
        const { data, error } = await sb.auth.signUp({ email, password: pw });
        if (error) throw error;
        // If "Confirm email" is disabled in Supabase, session is returned immediately.
        if (data.session) {
          location.href = "/";
        } else {
          setMsg("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto h-10 w-10 rounded-md bg-ink text-white grid place-items-center text-sm font-bold">N</div>
          <h1 className="mt-3 text-lg font-semibold">Nussbaum OS</h1>
          <p className="text-xs text-muted">Be Mom First</p>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-line bg-white p-4 shadow-card space-y-3">
          <div>
            <label className="text-xs text-muted">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-xs text-muted">Password</label>
            <Input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
          </div>

          {err && <div className="text-xs text-red-600">{err}</div>}
          {msg && <div className="text-xs text-emerald-700">{msg}</div>}

          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setMsg(null); }}
            className="w-full text-xs text-muted hover:text-ink transition"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
