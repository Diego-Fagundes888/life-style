"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Star, Gem, Crown, Lock, ChevronRight } from "lucide-react";
import type { TrackingHabit } from "@/lib/mock-data";

// =============================================================================
// TYPES
// =============================================================================

interface Achievement {
    id: string;
    icon: string;
    name: string;
    description: string;
    requirement: number;
    color: string;
    bgColor: string;
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: "fire",
        icon: "🔥",
        name: "Fogo",
        description: "3 dias consecutivos",
        requirement: 3,
        color: "#FF6B35",
        bgColor: "rgba(255,107,53,0.15)",
    },
    {
        id: "star",
        icon: "⭐",
        name: "Estrela",
        description: "7 dias consecutivos",
        requirement: 7,
        color: "#CCAE70",
        bgColor: "rgba(204,174,112,0.15)",
    },
    {
        id: "diamond",
        icon: "💎",
        name: "Diamante",
        description: "30 dias consecutivos",
        requirement: 30,
        color: "#4FC3F7",
        bgColor: "rgba(79,195,247,0.15)",
    },
    {
        id: "crown",
        icon: "👑",
        name: "Coroa",
        description: "100 dias consecutivos",
        requirement: 100,
        color: "#FFD700",
        bgColor: "rgba(255,215,0,0.15)",
    },
];

// =============================================================================
// HELPERS
// =============================================================================

function toISODateString(date: Date): string {
    return date.toISOString().split("T")[0];
}

function calculateStreak(completionHistory: string[]): number {
    if (completionHistory.length === 0) return 0;

    const sortedDates = [...completionHistory].sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = toISODateString(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toISODateString(yesterday);

    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
        return 0;
    }

    let streak = 0;
    let currentDate = sortedDates.includes(todayStr) ? new Date(today) : new Date(yesterday);

    for (let i = 0; i < 365; i++) {
        const dateStr = toISODateString(currentDate);
        if (sortedDates.includes(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface AchievementBadgeProps {
    achievement: Achievement;
    isUnlocked: boolean;
    progress: number;
}

function AchievementBadge({ achievement, isUnlocked, progress }: AchievementBadgeProps) {
    const progressPercent = Math.min((progress / achievement.requirement) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className={`
                relative p-4 rounded-xl border-2 transition-all
                ${isUnlocked
                    ? `border-[${achievement.color}] bg-[${achievement.bgColor}]`
                    : "border-[rgba(255,255,255,0.05)] bg-[#2C2C2C]"
                }
            `}
            style={isUnlocked ? {
                borderColor: achievement.color,
                backgroundColor: achievement.bgColor,
            } : {}}
        >
            {/* Badge Icon */}
            <div className="flex items-center gap-3 mb-2">
                <span className={`text-3xl ${!isUnlocked && "grayscale opacity-50"}`}>
                    {achievement.icon}
                </span>
                <div>
                    <p className={`font-semibold ${isUnlocked ? "text-[#E3E3E3]" : "text-[#5A5A5A]"}`}>
                        {achievement.name}
                    </p>
                    <p className="text-xs text-[#9B9B9B]">
                        {achievement.description}
                    </p>
                </div>
                {!isUnlocked && (
                    <Lock className="h-4 w-4 text-[#5A5A5A] ml-auto" />
                )}
            </div>

            {/* Progress Bar (for locked) */}
            {!isUnlocked && (
                <div className="mt-2">
                    <div className="flex justify-between text-xs text-[#5A5A5A] mb-1">
                        <span>{progress} dias</span>
                        <span>{achievement.requirement} dias</span>
                    </div>
                    <div className="h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: achievement.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
            )}

            {/* Unlocked Indicator */}
            {isUnlocked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[#8C9E78] rounded-full flex items-center justify-center"
                >
                    <span className="text-xs">✓</span>
                </motion.div>
            )}
        </motion.div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface AchievementBadgesProps {
    habits: TrackingHabit[];
    compact?: boolean;
}

export function AchievementBadges({ habits, compact = false }: AchievementBadgesProps) {
    // Calculate best streak across all habits
    const bestStreak = useMemo(() => {
        let maxStreak = 0;
        habits.filter(h => !h.archived).forEach(habit => {
            const streak = calculateStreak(habit.completionHistory);
            if (streak > maxStreak) maxStreak = streak;
        });
        return maxStreak;
    }, [habits]);

    // Calculate which achievements are unlocked
    const achievementStatus = useMemo(() => {
        return ACHIEVEMENTS.map(achievement => ({
            ...achievement,
            isUnlocked: bestStreak >= achievement.requirement,
            progress: bestStreak,
        }));
    }, [bestStreak]);

    const unlockedCount = achievementStatus.filter(a => a.isUnlocked).length;
    const nextAchievement = achievementStatus.find(a => !a.isUnlocked);

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {achievementStatus.map(achievement => (
                    <motion.span
                        key={achievement.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`text-xl ${!achievement.isUnlocked && "grayscale opacity-30"}`}
                        title={`${achievement.name}: ${achievement.description}`}
                    >
                        {achievement.icon}
                    </motion.span>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[rgba(204,174,112,0.15)] rounded-lg">
                        <Star className="h-5 w-5 text-[#CCAE70]" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[#E3E3E3]">Conquistas</h3>
                        <p className="text-xs text-[#9B9B9B]">
                            {unlockedCount} de {ACHIEVEMENTS.length} desbloqueadas
                        </p>
                    </div>
                </div>

                {/* Best Streak */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(255,165,0,0.1)] rounded-lg">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-mono font-bold text-orange-400">{bestStreak}</span>
                    <span className="text-xs text-[#9B9B9B]">melhor streak</span>
                </div>
            </div>

            {/* Next Achievement Hint */}
            {nextAchievement && (
                <div className="flex items-center gap-3 p-3 bg-[#2C2C2C] rounded-lg border border-[rgba(255,255,255,0.05)]">
                    <span className="text-2xl grayscale opacity-50">{nextAchievement.icon}</span>
                    <div className="flex-1">
                        <p className="text-sm text-[#E3E3E3]">
                            Próxima conquista: <strong>{nextAchievement.name}</strong>
                        </p>
                        <p className="text-xs text-[#9B9B9B]">
                            Faltam {nextAchievement.requirement - bestStreak} dias
                        </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#5A5A5A]" />
                </div>
            )}

            {/* Achievement Grid */}
            <div className="grid grid-cols-2 gap-3">
                {achievementStatus.map(achievement => (
                    <AchievementBadge
                        key={achievement.id}
                        achievement={achievement}
                        isUnlocked={achievement.isUnlocked}
                        progress={achievement.progress}
                    />
                ))}
            </div>
        </div>
    );
}
