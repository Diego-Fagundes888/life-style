"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    type Achievement,
    RARITY_COLORS,
    RARITY_LABELS,
} from "@/lib/types/achievements";

// ============================================================================
// STREAK BADGE
// ============================================================================

interface StreakBadgeProps {
    streak: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

/**
 * StreakBadge - Badge visual para exibir streak de dias.
 */
export function StreakBadge({ streak, size = 'md', showLabel = true }: StreakBadgeProps) {
    if (streak === 0) return null;

    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5 gap-0.5',
        md: 'text-sm px-2 py-1 gap-1',
        lg: 'text-base px-3 py-1.5 gap-1.5',
    };

    const iconSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    // Cor baseada no tamanho da streak
    const getStreakColor = () => {
        if (streak >= 100) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        if (streak >= 30) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        if (streak >= 7) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    };

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
                "flex items-center rounded-full border font-medium",
                sizeClasses[size],
                getStreakColor()
            )}
        >
            <span className={iconSizes[size]}>🔥</span>
            <span>{streak}</span>
            {showLabel && <span className="opacity-70">dias</span>}
        </motion.div>
    );
}

// ============================================================================
// ACHIEVEMENT CARD
// ============================================================================

interface AchievementCardProps {
    achievement: Achievement;
    unlocked: boolean;
    unlockedAt?: string;
    onClick?: () => void;
}

/**
 * AchievementCard - Card para exibir uma conquista (bloqueada ou desbloqueada).
 */
export function AchievementCard({
    achievement,
    unlocked,
    unlockedAt,
    onClick
}: AchievementCardProps) {
    const colors = RARITY_COLORS[achievement.rarity];

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-xl p-4 border cursor-pointer transition-all",
                unlocked
                    ? cn(colors.bg, colors.border, colors.glow)
                    : "bg-zinc-900/50 border-zinc-800 grayscale opacity-60"
            )}
        >
            {/* Locked overlay */}
            {!unlocked && !achievement.secret && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
                    <span className="text-2xl">🔒</span>
                </div>
            )}

            {/* Secret hidden */}
            {!unlocked && achievement.secret && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
                    <span className="text-2xl">❓</span>
                </div>
            )}

            {/* Content */}
            <div className="flex gap-3">
                {/* Icon */}
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                    unlocked ? "bg-white/10" : "bg-zinc-800"
                )}>
                    {unlocked || !achievement.secret ? achievement.icon : '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className={cn(
                        "font-medium truncate",
                        unlocked ? colors.text : "text-zinc-500"
                    )}>
                        {unlocked || !achievement.secret ? achievement.title : '???'}
                    </h4>
                    <p className="text-xs text-zinc-500 line-clamp-2">
                        {unlocked || !achievement.secret ? achievement.description : 'Conquista secreta'}
                    </p>
                </div>

                {/* Points */}
                <div className={cn(
                    "flex flex-col items-end",
                    unlocked ? colors.text : "text-zinc-600"
                )}>
                    <span className="text-lg font-bold">{achievement.points}</span>
                    <span className="text-xs opacity-70">pts</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    unlocked ? colors.bg : "bg-zinc-800",
                    unlocked ? colors.text : "text-zinc-500"
                )}>
                    {RARITY_LABELS[achievement.rarity]}
                </span>

                {unlocked && unlockedAt && (
                    <span className="text-xs text-zinc-500">
                        {new Date(unlockedAt).toLocaleDateString('pt-BR')}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// ============================================================================
// ACHIEVEMENT TOAST
// ============================================================================

interface AchievementToastProps {
    achievement: Achievement;
    onDismiss: () => void;
}

/**
 * AchievementToast - Toast animado para nova conquista desbloqueada.
 */
export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
    const colors = RARITY_COLORS[achievement.rarity];

    return (
        <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
                "flex items-center gap-4 p-4 rounded-2xl",
                "border shadow-2xl backdrop-blur-lg",
                colors.bg, colors.border, colors.glow
            )}
        >
            {/* Icon with animation */}
            <motion.div
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-4xl"
            >
                {achievement.icon}
            </motion.div>

            {/* Content */}
            <div className="pr-4">
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-zinc-400 mb-1"
                >
                    🎉 Nova Conquista!
                </motion.p>
                <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className={cn("text-lg font-bold", colors.text)}
                >
                    {achievement.title}
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-zinc-400"
                >
                    {achievement.description}
                </motion.p>
            </div>

            {/* Points */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.6 }}
                className={cn(
                    "flex flex-col items-center px-4 py-2 rounded-xl border",
                    colors.bg, colors.border
                )}
            >
                <span className={cn("text-2xl font-bold", colors.text)}>
                    +{achievement.points}
                </span>
                <span className="text-xs text-zinc-500">pontos</span>
            </motion.div>

            {/* Close button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onDismiss}
                className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white transition-colors"
            >
                ✕
            </motion.button>
        </motion.div>
    );
}

// ============================================================================
// MINI ACHIEVEMENTS PREVIEW
// ============================================================================

interface AchievementsPreviewProps {
    totalPoints: number;
    recentAchievements: Achievement[];
    progress: number; // 0-100
    onClick?: () => void;
}

/**
 * AchievementsPreview - Preview compacto de conquistas para dashboard.
 */
export function AchievementsPreview({
    totalPoints,
    recentAchievements,
    progress,
    onClick
}: AchievementsPreviewProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "p-4 rounded-xl border border-zinc-800 bg-zinc-900/50",
                "cursor-pointer hover:border-amber-500/30 transition-colors"
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <span className="font-medium text-white">Conquistas</span>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold text-amber-400">{totalPoints}</span>
                    <span className="text-xs text-zinc-500 ml-1">pts</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                </div>
            </div>

            {/* Recent achievements */}
            {recentAchievements.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Recentes:</span>
                    <div className="flex -space-x-1">
                        {recentAchievements.slice(0, 5).map((a) => (
                            <div
                                key={a.id}
                                className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-sm border-2 border-zinc-900"
                                title={a.title}
                            >
                                {a.icon}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
