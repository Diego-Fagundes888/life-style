"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Play, Sparkles } from "lucide-react";
import { Dream, DreamStatus, getCategoryConfig, calculateDreamProgress } from "@/lib/types/bucket-list";
import { cn } from "@/lib/utils";

interface DreamCardProps {
    dream: Dream;
    onClick: () => void;
}

const statusConfig: Record<DreamStatus, {
    badge: string;
    badgeClass: string;
    overlay: string;
    border: string;
}> = {
    pending: {
        badge: '',
        badgeClass: '',
        overlay: '',
        border: 'border-transparent hover:border-slate-600',
    },
    'in-progress': {
        badge: 'Em Andamento',
        badgeClass: 'bg-amber-500 text-amber-950',
        overlay: '',
        border: 'border-amber-500/50 ring-2 ring-amber-500/20',
    },
    completed: {
        badge: 'Conquistado',
        badgeClass: 'bg-emerald-500 text-emerald-950',
        overlay: 'sepia-[0.2] brightness-90',
        border: 'border-emerald-500/30',
    },
};

/**
 * DreamCard - Card individual de um sonho na Bucket List.
 */
export function DreamCard({ dream, onClick }: DreamCardProps) {
    const [isHovered, setIsHovered] = React.useState(false);
    const category = getCategoryConfig(dream.category);
    const status = statusConfig[dream.status];
    const progress = calculateDreamProgress(dream);

    // Use real image if completed and available
    const displayImage = dream.status === 'completed' && dream.realImage
        ? dream.realImage
        : dream.image;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4 }}
            className={cn(
                "relative rounded-xl overflow-hidden cursor-pointer",
                "border-2 transition-all duration-300",
                "break-inside-avoid mb-4",
                status.border
            )}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image */}
            <div className="relative">
                <motion.img
                    src={displayImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'}
                    alt={dream.title}
                    className={cn(
                        "w-full object-cover transition-all duration-500",
                        status.overlay,
                        isHovered && dream.status !== 'completed' && "scale-105"
                    )}
                    style={{
                        // Vary aspect ratio for masonry effect
                        aspectRatio: ['3/4', '4/3', '1/1', '16/9'][parseInt(dream.id) % 4],
                    }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Status Badge */}
                {dream.status !== 'pending' && (
                    <div className={cn(
                        "absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold",
                        "flex items-center gap-1",
                        status.badgeClass
                    )}>
                        {dream.status === 'completed' ? (
                            <CheckCircle2 className="h-3 w-3" />
                        ) : (
                            <Play className="h-3 w-3" />
                        )}
                        {status.badge}
                    </div>
                )}

                {/* Completed Stamp */}
                {dream.status === 'completed' && dream.completedDate && (
                    <div className="absolute top-3 right-3 rotate-12">
                        <div className="px-3 py-1 bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider rounded border-2 border-emerald-300 shadow-lg">
                            ✓ {new Date(dream.completedDate).toLocaleDateString('pt-BR', {
                                month: 'short',
                                year: 'numeric'
                            })}
                        </div>
                    </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 right-3">
                    {dream.status !== 'completed' && (
                        <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white flex items-center gap-1">
                            <span>{category.emoji}</span>
                            <span className="hidden sm:inline">{category.label}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                        {dream.title}
                    </h3>

                    {/* Progress for in-progress items */}
                    {dream.status === 'in-progress' && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                                <span>Progresso</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-amber-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Cost estimate for pending */}
                    {dream.status === 'pending' && dream.estimatedCost && (
                        <div className="flex items-center gap-1 text-xs text-white/60 mt-2">
                            <span>💰</span>
                            <span>R$ {dream.estimatedCost.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                </div>

                {/* Hover Overlay */}
                {dream.status === 'pending' && isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-medium text-sm">
                            <Sparkles className="h-4 w-4" />
                            Ver Detalhes
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
