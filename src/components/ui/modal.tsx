"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg";
}

/**
 * Modal - Componente de modal/dialog (Dark Mode).
 */
export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = "md"
}: ModalProps) {
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className={cn(
                            "relative w-full bg-slate-900 rounded-xl shadow-2xl",
                            "border border-slate-800",
                            sizeClasses[size]
                        )}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-slate-800">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-100">
                                    {title}
                                </h2>
                                {description && (
                                    <p className="mt-1 text-sm text-slate-400">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * ModalFooter - Área de ações do modal.
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div className={cn(
            "flex items-center justify-end gap-3 pt-4 border-t border-slate-800 -mx-6 -mb-6 px-6 py-4 bg-slate-950/50 rounded-b-xl",
            className
        )}>
            {children}
        </div>
    );
}
