"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border border-line bg-white px-3 text-sm placeholder:text-muted",
          "focus:outline-none focus:ring-2 focus:ring-ink/20",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[72px] w-full rounded-md border border-line bg-white px-3 py-2 text-sm placeholder:text-muted",
          "focus:outline-none focus:ring-2 focus:ring-ink/20",
          className,
        )}
        {...props}
      />
    );
  },
);
