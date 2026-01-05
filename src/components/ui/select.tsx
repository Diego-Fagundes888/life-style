"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface SelectProps {
    label?: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

/**
 * Select - Dropdown customizado (Dark Mode).
 */
export function Select({
    label,
    options,
    value,
    onChange,
    placeholder = "Selecione...",
    error,
    disabled = false,
}: SelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    return (
        <div className="space-y-1.5" ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-300">
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={cn(
                        "w-full px-3 py-2 rounded-lg border bg-slate-800 text-left",
                        "flex items-center justify-between gap-2",
                        "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900",
                        "transition-colors duration-200",
                        error
                            ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                            : "border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={disabled}
                >
                    <span className={cn(
                        "flex items-center gap-2",
                        !selectedOption && "text-slate-500"
                    )}>
                        {selectedOption?.icon}
                        <span className="text-slate-100">
                            {selectedOption?.label || placeholder}
                        </span>
                    </span>
                    <ChevronDown className={cn(
                        "h-4 w-4 text-slate-500 transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                        >
                            <div className="max-h-60 overflow-auto py-1">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 text-left flex items-center justify-between gap-2",
                                            "hover:bg-slate-700 transition-colors",
                                            option.value === value && "bg-indigo-500/20 text-indigo-300"
                                        )}
                                    >
                                        <span className="flex items-center gap-2 text-slate-200">
                                            {option.icon}
                                            {option.label}
                                        </span>
                                        {option.value === value && (
                                            <Check className="h-4 w-4 text-indigo-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {error && (
                <p className="text-sm text-rose-400">{error}</p>
            )}
        </div>
    );
}
