"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => onOpenChange(false)}>
      <div
        className={cn(
          "w-full max-w-md rounded-xl bg-white shadow-xl border border-line",
          "max-h-[90vh] overflow-auto",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={() => onOpenChange(false)} className="p-1 rounded hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-line bg-black/[0.02] flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
