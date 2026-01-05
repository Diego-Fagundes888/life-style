import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "ghost" | "outline" | "success" | "secondary" | "destructive";
    size?: "sm" | "md" | "lg" | "icon";
}

/**
 * Button - Dark Academia Style
 *
 * Primary uses white/off-white background for contrast.
 * Ghost and outline variants use subtle charcoal backgrounds.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "md", ...props }, ref) => {
        const baseClasses =
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCAE70] focus-visible:ring-offset-2 focus-visible:ring-offset-[#191919] disabled:pointer-events-none disabled:opacity-50";

        const variantClasses = {
            // Primary: White background, dark text (as per spec)
            default:
                "bg-[#E3E3E3] text-[#191919] hover:bg-[#D4D4D4] active:bg-[#C4C4C4] shadow-sm",
            // Ghost: No background, subtle hover
            ghost:
                "hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E3E3E3] text-[#9B9B9B]",
            // Outline: Subtle border
            outline:
                "border border-[rgba(255,255,255,0.1)] bg-transparent hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E3E3E3] text-[#9B9B9B]",
            // Success: Olive green
            success:
                "bg-[#8C9E78] text-white hover:bg-[#9CAE88] active:bg-[#7C8E68] shadow-sm",
            // Secondary: Charcoal
            secondary:
                "bg-[#2C2C2C] text-[#E3E3E3] hover:bg-[#3A3A3A] active:bg-[#252525]",
            // Destructive: Rust
            destructive:
                "bg-[#C87F76] text-white hover:bg-[#D88F86] active:bg-[#B86F66] shadow-sm",
        };

        const sizeClasses = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 text-sm",
            lg: "h-12 px-6 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
