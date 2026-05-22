"use client";
import * as React from "react";
import { SendHorizonal, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function QuickCapture({ onLogged }: { onLogged: () => void }) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [receipt, setReceipt] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit() {
    if (!text.trim() || busy) return;
    setBusy(true); setErr(null); setReceipt(null);
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Capture failed");
      const data = await res.json();
      const parts: string[] = [];
      const nT = data.counts?.tasks  ?? 0;
      const nE = data.counts?.events ?? 0;
      const nD = data.counts?.daily_fields ?? 0;
      if (nT) parts.push(`${nT} task${nT===1?"":"s"}`);
      if (nE) parts.push(`${nE} event${nE===1?"":"s"}`);
      if (nD) parts.push(`updated ${nD} field${nD===1?"":"s"}`);
      setReceipt(parts.length ? `Logged ${parts.join(" · ")}` : "Nothing parseable — try more detail.");
      setText("");
      onLogged();
    } catch (e: any) {
      setErr(e?.message ?? "Capture failed");
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit(); }
  }

  return (
    <div className="rounded-lg border border-line bg-white shadow-card p-2.5">
      <div className="text-[10px] font-semibold tracking-wider text-muted mb-1.5">QUICK CAPTURE</div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder='"ate eggs ~400 cal, spent 42 at feed store, call gutter guy, slept 6.5 hrs"'
        className="min-h-[60px] text-sm"
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[11px] text-muted">
          {err     ? <span className="text-red-600">{err}</span>
           : receipt ? <span className="text-emerald-700">{receipt}</span>
           : <span>⌘/Ctrl + Enter to send</span>}
        </div>
        <Button variant="primary" size="sm" onClick={submit} disabled={busy || !text.trim()}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SendHorizonal className="h-3.5 w-3.5" />}
          Log
        </Button>
      </div>
    </div>
  );
}
