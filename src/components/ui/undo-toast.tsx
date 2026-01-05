"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, X } from "lucide-react";
import { getStoredData, STORAGE_KEYS, undoAction } from "@/lib/store";
import { cn } from "@/lib/utils";

interface UndoAction {
    id: string;
    type: string;
    key: string;
    previousData: unknown;
    timestamp: string;
    description: string;
}

interface Toast {
    id: string;
    actionId: string;
    description: string;
    expiresAt: number;
}

const TOAST_DURATION = 5000; // 5 segundos

/**
 * UndoToastProvider - Sistema de toasts para ações reversíveis.
 * Exibe um toast com botão "Desfazer" por 5 segundos após ações destrutivas.
 */
export function UndoToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Limpar toasts expirados
    useEffect(() => {
        const interval = setInterval(() => {
            setToasts(prev => prev.filter(t => t.expiresAt > Date.now()));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Listener para novas ações de undo
    useEffect(() => {
        const handleNewAction = () => {
            const stack = getStoredData<UndoAction[]>(STORAGE_KEYS.UNDO_STACK) || [];
            if (stack.length === 0) return;

            const latestAction = stack[0];

            // Verificar se já existe toast para esta ação
            if (toasts.some(t => t.actionId === latestAction.id)) return;

            // Adicionar novo toast
            setToasts(prev => [...prev, {
                id: `toast_${Date.now()}`,
                actionId: latestAction.id,
                description: latestAction.description,
                expiresAt: Date.now() + TOAST_DURATION,
            }]);
        };

        // Ouvir eventos de storage para detectar novas ações
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEYS.UNDO_STACK) {
                handleNewAction();
            }
        };

        window.addEventListener('storage', handleStorage);

        // Também checar periodicamente (fallback para mesma aba)
        const checkInterval = setInterval(handleNewAction, 500);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(checkInterval);
        };
    }, [toasts]);

    const handleUndo = useCallback((toast: Toast) => {
        const success = undoAction(toast.actionId);
        if (success) {
            // Remover toast
            setToasts(prev => prev.filter(t => t.id !== toast.id));
            // Recarregar página para refletir mudanças
            window.location.reload();
        }
    }, []);

    const handleDismiss = useCallback((toastId: string) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
    }, []);

    return (
        <>
            {children}

            {/* Container de Toasts */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <UndoToast
                            key={toast.id}
                            toast={toast}
                            onUndo={() => handleUndo(toast)}
                            onDismiss={() => handleDismiss(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}

interface UndoToastProps {
    toast: Toast;
    onUndo: () => void;
    onDismiss: () => void;
}

function UndoToast({ toast, onUndo, onDismiss }: UndoToastProps) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startTime = Date.now();
        const endTime = toast.expiresAt;
        const duration = endTime - startTime;

        const updateProgress = () => {
            const remaining = endTime - Date.now();
            const percent = (remaining / duration) * 100;
            setProgress(Math.max(0, percent));
        };

        const interval = setInterval(updateProgress, 50);
        return () => clearInterval(interval);
    }, [toast.expiresAt]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
                "relative overflow-hidden",
                "flex items-center gap-3 px-4 py-3 pr-12",
                "bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg",
                "min-w-[280px] max-w-[400px]"
            )}
        >
            {/* Progress bar */}
            <div
                className="absolute bottom-0 left-0 h-1 bg-amber-500/50 transition-all duration-100"
                style={{ width: `${progress}%` }}
            />

            {/* Content */}
            <div className="flex-1">
                <p className="text-sm text-zinc-300">{toast.description}</p>
            </div>

            {/* Undo button */}
            <button
                onClick={onUndo}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
                    "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
                    "text-sm font-medium transition-colors"
                )}
            >
                <Undo2 className="h-3.5 w-3.5" />
                Desfazer
            </button>

            {/* Dismiss button */}
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
}
