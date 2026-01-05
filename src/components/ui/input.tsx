"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

/**
 * Input - Input estilizado (Dark Mode).
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", label, error, hint, id, ...props }, ref) => {
        const inputId = id || React.useId();

        return (
            <div className="space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-300"
                    >
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        "w-full px-3 py-2 rounded-lg border bg-slate-800 text-slate-100",
                        "placeholder:text-slate-500",
                        "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900",
                        "transition-colors duration-200",
                        error
                            ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-rose-400">{error}</p>
                )}
                {hint && !error && (
                    <p className="text-sm text-slate-500">{hint}</p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
