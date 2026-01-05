"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
    children: React.ReactNode;
}

interface AlertDialogTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
}

interface AlertDialogContentProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogFooterProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogTitleProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

const AlertDialogContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => { } });

/**
 * AlertDialog - Modal de confirmação
 */
export function AlertDialog({ children }: AlertDialogProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <AlertDialogContext.Provider value={{ open, setOpen }}>
            {children}
        </AlertDialogContext.Provider>
    );
}

/**
 * AlertDialogTrigger - Botão que abre o dialog
 */
export function AlertDialogTrigger({ asChild, children }: AlertDialogTriggerProps) {
    const { setOpen } = React.useContext(AlertDialogContext);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
        });
    }

    return (
        <button onClick={() => setOpen(true)}>
            {children}
        </button>
    );
}

/**
 * AlertDialogContent - Conteúdo do modal
 */
export function AlertDialogContent({ children, className }: AlertDialogContentProps) {
    const { open, setOpen } = React.useContext(AlertDialogContext);

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
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />

                    {/* Dialog */}
                    <motion.div
                        className={cn(
                            "fixed left-[50%] top-[50%] z-50 w-full max-w-lg p-6 rounded-xl shadow-2xl",
                            "bg-[#1E1E1E] border border-[rgba(255,255,255,0.1)]",
                            className
                        )}
                        initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * AlertDialogHeader - Cabeçalho do dialog
 */
export function AlertDialogHeader({ children, className }: AlertDialogHeaderProps) {
    return (
        <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
            {children}
        </div>
    );
}

/**
 * AlertDialogFooter - Rodapé com ações
 */
export function AlertDialogFooter({ children, className }: AlertDialogFooterProps) {
    return (
        <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}>
            {children}
        </div>
    );
}

/**
 * AlertDialogTitle - Título do dialog
 */
export function AlertDialogTitle({ children, className }: AlertDialogTitleProps) {
    return (
        <h2 className={cn("text-lg font-semibold", className)}>
            {children}
        </h2>
    );
}

/**
 * AlertDialogDescription - Descrição do dialog
 */
export function AlertDialogDescription({ children, className }: AlertDialogDescriptionProps) {
    return (
        <p className={cn("text-sm text-[#9B9B9B]", className)}>
            {children}
        </p>
    );
}

/**
 * AlertDialogAction - Botão de ação principal
 */
export function AlertDialogAction({ children, className, onClick, ...props }: AlertDialogActionProps) {
    const { setOpen } = React.useContext(AlertDialogContext);

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center px-4 py-2 rounded-lg",
                "text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                className
            )}
            onClick={(e) => {
                onClick?.(e);
                setOpen(false);
            }}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * AlertDialogCancel - Botão de cancelar
 */
export function AlertDialogCancel({ children, className, onClick, ...props }: AlertDialogCancelProps) {
    const { setOpen } = React.useContext(AlertDialogContext);

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center px-4 py-2 rounded-lg",
                "text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                "mt-2 sm:mt-0",
                className
            )}
            onClick={(e) => {
                onClick?.(e);
                setOpen(false);
            }}
            {...props}
        >
            {children}
        </button>
    );
}
