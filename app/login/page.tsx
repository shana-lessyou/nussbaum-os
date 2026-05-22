"use client";
import * as React from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent]   = React.useState(false);
  const [busy, setBusy]   = React.useState(false);
  const [err, setErr]     = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const sb = createSupabaseBrowser();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErr(e?.message ?? "Sign-in failed");
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
        {sent ? (
          <div className="rounded-lg border border-line bg-white p-4 text-sm shadow-card">
            Check <b>{email}</b> for a sign-in link.
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-lg border border-line bg-white p-4 shadow-card space-y-3">
            <label className="text-xs text-muted">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {err && <div className="text-xs text-red-600">{err}</div>}
            <Button type="submit" variant="primary" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
