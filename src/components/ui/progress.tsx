"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Valor atual (0-100) */
    value?: number;
    /** Variantes de cor - Dark Academia palette */
    variant?: "default" | "success" | "warning" | "danger" | "gold" | "rust" | "clay" | "olive" | "slate";
    /** Tamanho da barra */
    size?: "sm" | "md" | "lg";
    /** Mostrar texto do percentual */
    showValue?: boolean;
    /** Animação de entrada */
    animated?: boolean;
}

/**
 * Progress Bar - Dark Academia Theme
 *
 * Uses earthy, desaturated colors for an elegant library aesthetic.
 * Default variant uses accent-gold (#CCAE70).
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    (
        {
            className,
            value = 0,
            variant = "default",
            size = "md",
            showValue = false,
            animated = true,
            ...props
        },
        ref
    ) => {
        const clampedValue = Math.min(100, Math.max(0, value));
        const isComplete = clampedValue >= 100;
        const isNearComplete = clampedValue >= 90;

        // Dark Academia color palette
        const variantClasses: Record<string, string> = {
            default: "bg-[#CCAE70]",   // gold
            gold: "bg-[#CCAE70]",       // accent-gold
            success: "bg-[#8C9E78]",   // olive
            olive: "bg-[#8C9E78]",      // accent-olive
            warning: "bg-[#D99E6B]",   // clay
            clay: "bg-[#D99E6B]",       // accent-clay
            danger: "bg-[#C87F76]",    // rust
            rust: "bg-[#C87F76]",       // accent-rust
            slate: "bg-[#768C9E]",      // accent-slate
        };

        const glowClasses: Record<string, string> = {
            default: "shadow-[#CCAE70]/30",
            gold: "shadow-[#CCAE70]/30",
            success: "shadow-[#8C9E78]/30",
            olive: "shadow-[#8C9E78]/30",
            warning: "shadow-[#D99E6B]/30",
            clay: "shadow-[#D99E6B]/30",
            danger: "shadow-[#C87F76]/30",
            rust: "shadow-[#C87F76]/30",
            slate: "shadow-[#768C9E]/30",
        };

        const sizeClasses = {
            sm: "h-1.5",
            md: "h-2.5",
            lg: "h-4",
        };

        const ProgressBar = animated ? motion.div : "div";
        const animationProps = animated
            ? {
                initial: { width: 0 },
                animate: { width: `${clampedValue}%` },
                transition: { duration: 0.8, ease: "easeOut" as const },
            }
            : {};

        return (
            <div className="flex items-center gap-3 w-full">
                <div
                    ref={ref}
                    className={cn(
                        "relative w-full overflow-hidden rounded-full bg-[#2C2C2C]",
                        sizeClasses[size],
                        className
                    )}
                    {...props}
                >
                    {/* Background subtle shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent" />

                    {/* Progress fill */}
                    <ProgressBar
                        className={cn(
                            "h-full rounded-full transition-all relative overflow-hidden",
                            variantClasses[variant],
                            isNearComplete && ["shadow-lg", glowClasses[variant]],
                            isComplete && "animate-pulse"
                        )}
                        style={!animated ? { width: `${clampedValue}%` } : undefined}
                        {...animationProps}
                    >
                        {/* Inner shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" />

                        {/* Animated shimmer for high progress */}
                        {isNearComplete && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatDelay: 1,
                                }}
                            />
                        )}
                    </ProgressBar>
                </div>

                {showValue && (
                    <motion.span
                        className="text-sm font-medium text-[#9B9B9B] tabular-nums min-w-[3ch]"
                        key={clampedValue}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                    >
                        {clampedValue}%
                    </motion.span>
                )}
            </div>
        );
    }
);
Progress.displayName = "Progress";

export { Progress };
