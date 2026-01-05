"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SliderProps {
    /** Valor atual (0-10) */
    value: number;
    /** Callback de mudança */
    onChange: (value: number) => void;
    /** Label do slider */
    label?: string;
    /** Cor do slider */
    color?: "rose" | "blue" | "amber" | "emerald" | "violet" | "indigo";
    /** Mostrar valor numérico */
    showValue?: boolean;
    /** Desabilitado */
    disabled?: boolean;
    /** Mínimo */
    min?: number;
    /** Máximo */
    max?: number;
    /** Step */
    step?: number;
}

const colorClasses = {
    rose: {
        track: "bg-rose-500",
        thumb: "border-rose-500 bg-rose-500",
        glow: "shadow-rose-500/50",
    },
    blue: {
        track: "bg-blue-500",
        thumb: "border-blue-500 bg-blue-500",
        glow: "shadow-blue-500/50",
    },
    amber: {
        track: "bg-amber-500",
        thumb: "border-amber-500 bg-amber-500",
        glow: "shadow-amber-500/50",
    },
    emerald: {
        track: "bg-emerald-500",
        thumb: "border-emerald-500 bg-emerald-500",
        glow: "shadow-emerald-500/50",
    },
    violet: {
        track: "bg-violet-500",
        thumb: "border-violet-500 bg-violet-500",
        glow: "shadow-violet-500/50",
    },
    indigo: {
        track: "bg-indigo-500",
        thumb: "border-indigo-500 bg-indigo-500",
        glow: "shadow-indigo-500/50",
    },
};

/**
 * Slider - Input de range customizado para métricas.
 */
export function Slider({
    value,
    onChange,
    label,
    color = "indigo",
    showValue = true,
    disabled = false,
    min = 0,
    max = 10,
    step = 1,
}: SliderProps) {
    const colors = colorClasses[color];
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-2">
            {(label || showValue) && (
                <div className="flex items-center justify-between">
                    {label && (
                        <label className="text-sm font-medium text-slate-300">
                            {label}
                        </label>
                    )}
                    {showValue && (
                        <motion.span
                            key={value}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className={cn(
                                "text-lg font-bold tabular-nums",
                                value >= 8 ? "text-emerald-400" :
                                    value >= 5 ? "text-amber-400" :
                                        "text-rose-400"
                            )}
                        >
                            {value}
                        </motion.span>
                    )}
                </div>
            )}

            <div className="relative">
                {/* Track Background */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    {/* Filled Track */}
                    <motion.div
                        className={cn("h-full rounded-full", colors.track)}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                </div>

                {/* Native Range Input (invisible but interactive) */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    className={cn(
                        "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                        disabled && "cursor-not-allowed"
                    )}
                />

                {/* Custom Thumb (visual only) */}
                <motion.div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full",
                        "border-2 shadow-lg transition-shadow",
                        colors.thumb,
                        !disabled && `hover:shadow-lg ${colors.glow}`
                    )}
                    style={{ left: `calc(${percentage}% - 10px)` }}
                    animate={{ left: `calc(${percentage}% - 10px)` }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                />
            </div>

            {/* Scale Markers */}
            <div className="flex justify-between text-[10px] text-slate-600 px-1">
                {Array.from({ length: 11 }, (_, i) => (
                    <span key={i}>{i}</span>
                ))}
            </div>
        </div>
    );
}
