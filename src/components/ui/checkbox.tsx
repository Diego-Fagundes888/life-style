"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    /** Cor do checkbox quando marcado */
    color?: "indigo" | "emerald" | "rose" | "blue" | "amber" | "violet" | "cyan";
}

/**
 * Mapeamento de cores para classes Tailwind.
 */
const colorClasses: Record<string, { bg: string; border: string; ring: string }> = {
    indigo: {
        bg: "bg-indigo-500",
        border: "border-indigo-500",
        ring: "ring-indigo-500/30",
    },
    emerald: {
        bg: "bg-emerald-500",
        border: "border-emerald-500",
        ring: "ring-emerald-500/30",
    },
    rose: {
        bg: "bg-rose-500",
        border: "border-rose-500",
        ring: "ring-rose-500/30",
    },
    blue: {
        bg: "bg-blue-500",
        border: "border-blue-500",
        ring: "ring-blue-500/30",
    },
    amber: {
        bg: "bg-amber-500",
        border: "border-amber-500",
        ring: "ring-amber-500/30",
    },
    violet: {
        bg: "bg-violet-500",
        border: "border-violet-500",
        ring: "ring-violet-500/30",
    },
    cyan: {
        bg: "bg-cyan-500",
        border: "border-cyan-500",
        ring: "ring-cyan-500/30",
    },
};

/**
 * Checkbox - Checkbox customizado com animações e suporte a dark mode.
 * 
 * Usa um input nativo escondido para acessibilidade e um componente visual
 * customizado com animações de bounce ao marcar.
 * 
 * @example
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} color="emerald" />
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, disabled, color = "indigo", ...props }, ref) => {
        const colors = colorClasses[color] ?? colorClasses.indigo;

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            onCheckedChange?.(event.target.checked);
        };

        return (
            <div className="relative inline-flex items-center justify-center align-middle">
                {/* Hidden native checkbox for accessibility */}
                <input
                    type="checkbox"
                    className="peer absolute h-5 w-5 cursor-pointer opacity-0 z-10"
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    ref={ref}
                    {...props}
                />

                {/* Visual checkbox */}
                <motion.div
                    className={cn(
                        "pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center",
                        "rounded-md border-2 transition-colors duration-200",
                        "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
                        "peer-focus-visible:ring-offset-slate-950",
                        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                        checked
                            ? [colors.bg, "border-transparent"]
                            : "border-slate-600 bg-slate-800/50",
                        checked && colors.ring,
                        className
                    )}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                >
                    <AnimatePresence mode="wait">
                        {checked && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 25,
                                }}
                            >
                                <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        );
    }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
