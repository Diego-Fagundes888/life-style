"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
    /** Se o sheet está aberto */
    open: boolean;
    /** Callback quando o estado de aberto muda */
    onOpenChange: (open: boolean) => void;
    /** Conteúdo do sheet */
    children: React.ReactNode;
}

interface SheetContentProps {
    /** Lado da tela onde o sheet aparece */
    side?: "left" | "right" | "top" | "bottom";
    /** Conteúdo */
    children: React.ReactNode;
    /** Classes CSS adicionais */
    className?: string;
}

interface SheetHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface SheetTitleProps {
    children: React.ReactNode;
    className?: string;
}

interface SheetDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

const SheetContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => { } });

/**
 * Sheet - Slide-over panel component
 */
export function Sheet({ open, onOpenChange, children }: SheetProps) {
    // Bloqueia scroll do body quando aberto
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <SheetContext.Provider value={{ open, onOpenChange }}>
            {children}
        </SheetContext.Provider>
    );
}

/**
 * SheetContent - Conteúdo do sheet com animação
 */
export function SheetContent({
    side = "right",
    children,
    className
}: SheetContentProps) {
    const { open, onOpenChange } = React.useContext(SheetContext);

    // Animações baseadas no lado
    const variants = {
        left: {
            initial: { x: "-100%" },
            animate: { x: 0 },
            exit: { x: "-100%" },
        },
        right: {
            initial: { x: "100%" },
            animate: { x: 0 },
            exit: { x: "100%" },
        },
        top: {
            initial: { y: "-100%" },
            animate: { y: 0 },
            exit: { y: "-100%" },
        },
        bottom: {
            initial: { y: "100%" },
            animate: { y: 0 },
            exit: { y: "100%" },
        },
    };

    const sideClasses = {
        left: "left-0 top-0 bottom-0 h-full",
        right: "right-0 top-0 bottom-0 h-full",
        top: "top-0 left-0 right-0 w-full",
        bottom: "bottom-0 left-0 right-0 w-full",
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Sheet Content */}
                    <motion.div
                        className={cn(
                            "fixed z-50 shadow-2xl",
                            sideClasses[side],
                            className
                        )}
                        variants={variants[side]}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * SheetHeader - Cabeçalho do sheet
 */
export function SheetHeader({ children, className }: SheetHeaderProps) {
    return (
        <div className={cn("flex flex-col space-y-2", className)}>
            {children}
        </div>
    );
}

/**
 * SheetTitle - Título do sheet
 */
export function SheetTitle({ children, className }: SheetTitleProps) {
    return (
        <h2 className={cn("text-lg font-semibold", className)}>
            {children}
        </h2>
    );
}

/**
 * SheetDescription - Descrição do sheet
 */
export function SheetDescription({ children, className }: SheetDescriptionProps) {
    return (
        <p className={cn("text-sm text-muted-foreground", className)}>
            {children}
        </p>
    );
}
