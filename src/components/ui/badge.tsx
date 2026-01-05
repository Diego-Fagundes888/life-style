import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Variante de cor - Dark Academia semantic colors */
    variant?: "default" | "success" | "warning" | "danger" | "secondary" | "rust" | "clay" | "olive" | "slate" | "gold";
}

/**
 * Badge - Dark Academia Theme
 *
 * Uses desaturated, earthy accent colors for an elegant, library-like feel.
 * Default uses accent-gold, semantic variants use academy colors.
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const variantClasses = {
            // Default - Gold (main accent)
            default: "bg-[rgba(204,174,112,0.15)] text-[#CCAE70] border-[rgba(204,174,112,0.3)]",
            // Semantic variants using academy palette
            success: "bg-[rgba(140,158,120,0.15)] text-[#8C9E78] border-[rgba(140,158,120,0.3)]", // olive
            warning: "bg-[rgba(217,158,107,0.15)] text-[#D99E6B] border-[rgba(217,158,107,0.3)]", // clay
            danger: "bg-[rgba(200,127,118,0.15)] text-[#C87F76] border-[rgba(200,127,118,0.3)]", // rust
            secondary: "bg-[rgba(255,255,255,0.05)] text-[#9B9B9B] border-[rgba(255,255,255,0.05)]",
            // Direct academy color variants
            rust: "bg-[rgba(200,127,118,0.15)] text-[#C87F76] border-[rgba(200,127,118,0.3)]",
            clay: "bg-[rgba(217,158,107,0.15)] text-[#D99E6B] border-[rgba(217,158,107,0.3)]",
            olive: "bg-[rgba(140,158,120,0.15)] text-[#8C9E78] border-[rgba(140,158,120,0.3)]",
            slate: "bg-[rgba(118,140,158,0.15)] text-[#768C9E] border-[rgba(118,140,158,0.3)]",
            gold: "bg-[rgba(204,174,112,0.15)] text-[#CCAE70] border-[rgba(204,174,112,0.3)]",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    variantClasses[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = "Badge";

export { Badge };
