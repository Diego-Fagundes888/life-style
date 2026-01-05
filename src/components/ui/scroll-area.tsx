"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Conteúdo scrollável */
    children: React.ReactNode;
}

/**
 * ScrollArea - Área de scroll customizada
 * 
 * Container com scroll vertical customizado para listas longas.
 */
export function ScrollArea({ children, className, ...props }: ScrollAreaProps) {
    return (
        <div
            className={cn(
                "overflow-y-auto scrollbar-thin scrollbar-thumb-[#3C3C3C] scrollbar-track-transparent",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
