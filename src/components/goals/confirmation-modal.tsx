"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning";
}

/**
 * ConfirmationModal - Modal de confirmação (Dark Mode).
 */
export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger",
}: ConfirmationModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const iconColor = variant === "danger" ? "text-rose-400" : "text-amber-400";
    const iconBg = variant === "danger" ? "bg-rose-500/20" : "bg-amber-500/20";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-3 rounded-full ${iconBg}`}>
                    <AlertTriangle className={`h-6 w-6 ${iconColor}`} />
                </div>
                <p className="text-slate-400">{message}</p>
            </div>

            <ModalFooter className="mt-6">
                <Button type="button" variant="ghost" onClick={onClose}>
                    {cancelLabel}
                </Button>
                <Button
                    type="button"
                    variant={variant === "danger" ? "destructive" : "default"}
                    onClick={handleConfirm}
                >
                    {confirmLabel}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
