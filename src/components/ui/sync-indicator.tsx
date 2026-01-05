"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, Check, Loader2, RefreshCw } from "lucide-react";
import { useSyncStatus } from "@/context/LifeSyncContext";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * SyncIndicator - Dark Academia Style
 * Indicador visual de status de sincronização.
 */
export function SyncIndicator() {
    const { syncStatus, lastSaved, lastError, forceSync } = useSyncStatus();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCheck, setShowCheck] = useState(false);

    // Mostrar check temporariamente quando salvo
    useEffect(() => {
        if (syncStatus === 'saved') {
            setShowCheck(true);
            const timer = setTimeout(() => setShowCheck(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [syncStatus]);

    const getIcon = () => {
        switch (syncStatus) {
            case 'saving':
                return <Loader2 className="h-4 w-4 animate-spin" />;
            case 'saved':
                return showCheck ? <Check className="h-4 w-4" /> : <Cloud className="h-4 w-4" />;
            case 'error':
                return <CloudOff className="h-4 w-4" />;
            default:
                return <Cloud className="h-4 w-4" />;
        }
    };

    const getStatusText = () => {
        switch (syncStatus) {
            case 'saving':
                return 'Salvando...';
            case 'saved':
                return lastSaved ? `Salvo ${formatRelativeTime(lastSaved)}` : 'Salvo';
            case 'error':
                return lastError || 'Erro ao salvar';
            default:
                return lastSaved ? `Sincronizado` : 'Pronto';
        }
    };

    const getStatusColor = () => {
        switch (syncStatus) {
            case 'saving':
                return 'text-[#768C9E]'; // slate
            case 'saved':
                return showCheck ? 'text-[#8C9E78]' : 'text-[#9B9B9B]'; // olive / secondary
            case 'error':
                return 'text-[#C87F76]'; // rust
            default:
                return 'text-[#5A5A5A]'; // muted
        }
    };

    return (
        <motion.div
            className="fixed top-4 right-4 z-50"
            onHoverStart={() => setIsExpanded(true)}
            onHoverEnd={() => setIsExpanded(false)}
        >
            <motion.div
                layout
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full",
                    "bg-[#202020]/95 backdrop-blur-sm border border-[rgba(255,255,255,0.05)]",
                    "cursor-pointer select-none",
                    getStatusColor()
                )}
                onClick={() => {
                    if (syncStatus === 'error') {
                        forceSync();
                    }
                }}
            >
                <motion.div layout="position">
                    {getIcon()}
                </motion.div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-xs font-medium whitespace-nowrap overflow-hidden"
                        >
                            {getStatusText()}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Botão de retry para erros */}
                <AnimatePresence>
                    {isExpanded && syncStatus === 'error' && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                forceSync();
                            }}
                            className="p-1 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                        >
                            <RefreshCw className="h-3 w-3" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
