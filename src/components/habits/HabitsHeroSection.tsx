"use client";

import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTime } from "@/hooks/use-time";
import { useHabits } from "@/context/LifeSyncContext";
import { Flame, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

// =============================================================================
// CIRCULAR PROGRESS RING
// =============================================================================
interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
}

function ProgressRing({ progress, size = 100, strokeWidth = 8 }: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    // Color based on progress
    const getColor = () => {
        if (progress === 100) return "#8C9E78"; // olive - complete
        if (progress >= 70) return "#CCAE70";   // gold - good progress
        if (progress >= 40) return "#D99E6B";   // clay - medium
        return "#768C9E";                        // slate - starting
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    key={progress}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-[#E3E3E3]"
                >
                    {progress}%
                </motion.span>
                <span className="text-xs text-[#9B9B9B]">concluído</span>
            </div>
        </div>
    );
}

// =============================================================================
// STREAK DISPLAY
// =============================================================================
function StreakDisplay({ streak }: { streak: number }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(255,165,0,0.1)] border border-[rgba(255,165,0,0.2)] rounded-xl">
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="relative"
            >
                <Flame className="h-7 w-7 text-orange-500" />
                {streak > 0 && (
                    <motion.div
                        className="absolute inset-0"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <Flame className="h-7 w-7 text-yellow-400" />
                    </motion.div>
                )}
            </motion.div>
            <div>
                <p className="text-xl font-bold font-mono text-orange-400">
                    {streak}
                </p>
                <p className="text-xs text-[#9B9B9B]">
                    {streak === 1 ? "dia" : "dias"} de streak
                </p>
            </div>
        </div>
    );
}

// =============================================================================
// MOTIVATIONAL MESSAGE
// =============================================================================
function getMotivationalMessage(
    hour: number,
    completedCount: number,
    totalCount: number,
    progress: number
): string {
    if (totalCount === 0) return "Crie seu primeiro hábito! 🌱";

    const remaining = totalCount - completedCount;

    if (progress === 100) return "Dia perfeito! Você é incrível! 🏆";

    // Morning messages
    if (hour >= 5 && hour < 12) {
        if (progress === 0) return "Bom dia! Vamos começar forte? ☀️";
        if (progress < 50) return `Bom começo! Faltam ${remaining} hábitos 💪`;
        return "Manhã produtiva! Continue assim 🚀";
    }

    // Afternoon messages
    if (hour >= 12 && hour < 18) {
        if (progress < 30) return "Ainda dá tempo! Bora acelerar ⚡";
        if (progress < 70) return `Quase lá! Só mais ${remaining} 🎯`;
        return "Tarde incrível! Finalize forte 🌟";
    }

    // Evening messages
    if (progress >= 80) return `Última reta! Só mais ${remaining} 🔥`;
    if (remaining <= 2) return "Você consegue! Só mais um pouco 💎";

    return "Cada hábito conta! 🌙";
}

// =============================================================================
// XP TODAY DISPLAY
// =============================================================================
function XPTodayDisplay({ count }: { count: number }) {
    const xpToday = count * 10; // 10 XP per habit

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(140,158,120,0.15)] border border-[rgba(140,158,120,0.2)] rounded-lg">
            <Zap className="h-5 w-5 text-[#8C9E78]" />
            <span className="text-lg font-bold font-mono text-[#8C9E78]">
                +{xpToday} XP
            </span>
            <span className="text-xs text-[#9B9B9B]">hoje</span>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function HabitsHeroSection() {
    const { hours } = useTime();
    const { habits, isHydrated } = useHabits();

    const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

    const activeHabits = useMemo(
        () => habits.filter(h => !h.archived),
        [habits]
    );

    const completedToday = useMemo(
        () => activeHabits.filter(h => h.completionHistory.includes(todayStr)).length,
        [activeHabits, todayStr]
    );

    const progress = useMemo(
        () => activeHabits.length > 0
            ? Math.round((completedToday / activeHabits.length) * 100)
            : 0,
        [activeHabits.length, completedToday]
    );

    // Calculate overall streak (best streak among habits)
    const bestStreak = useMemo(() => {
        let maxStreak = 0;
        activeHabits.forEach(habit => {
            const history = [...habit.completionHistory].sort().reverse();
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let currentDate = new Date(today);

            const todayStrLocal = todayStr;
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            if (history.includes(todayStrLocal)) {
                currentDate = new Date(today);
            } else if (history.includes(yesterdayStr)) {
                currentDate = new Date(yesterday);
            } else {
                return;
            }

            for (let i = 0; i < 365; i++) {
                const dateStr = currentDate.toISOString().split("T")[0];
                if (history.includes(dateStr)) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }

            if (streak > maxStreak) maxStreak = streak;
        });
        return maxStreak;
    }, [activeHabits, todayStr]);

    const motivationalMessage = useMemo(
        () => getMotivationalMessage(hours, completedToday, activeHabits.length, progress),
        [hours, completedToday, activeHabits.length, progress]
    );

    if (!isHydrated) {
        return (
            <div className="bg-[#202020] rounded-2xl border border-[rgba(255,255,255,0.05)] p-6 animate-pulse h-32" />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-[#202020] via-[#252525] to-[#1a1a1a] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 shadow-lg"
        >
            <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Left: Progress Ring */}
                <div className="flex-shrink-0">
                    <ProgressRing progress={progress} size={110} strokeWidth={10} />
                </div>

                {/* Center: Stats & Message */}
                <div className="flex-1 text-center lg:text-left space-y-3">
                    {/* Main Stats */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                        <StreakDisplay streak={bestStreak} />
                        <XPTodayDisplay count={completedToday} />
                    </div>

                    {/* Motivational Message */}
                    <motion.p
                        key={motivationalMessage}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-lg text-[#E3E3E3] font-medium"
                    >
                        {motivationalMessage}
                    </motion.p>

                    {/* Habit Counter */}
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-[#9B9B9B]">
                        <Target className="h-4 w-4" />
                        <span>
                            <span className="font-mono text-[#CCAE70]">{completedToday}</span>
                            {" de "}
                            <span className="font-mono">{activeHabits.length}</span>
                            {" hábitos concluídos"}
                        </span>
                    </div>
                </div>

                {/* Right: Achievements Preview */}
                <div className="flex-shrink-0 hidden md:flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1">
                        {bestStreak >= 3 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-2xl"
                                title="3 dias de streak!"
                            >
                                🔥
                            </motion.span>
                        )}
                        {bestStreak >= 7 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-2xl"
                                title="7 dias de streak!"
                            >
                                ⭐
                            </motion.span>
                        )}
                        {bestStreak >= 30 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl"
                                title="30 dias de streak!"
                            >
                                💎
                            </motion.span>
                        )}
                        {bestStreak >= 100 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl"
                                title="100 dias de streak!"
                            >
                                👑
                            </motion.span>
                        )}
                        {bestStreak < 3 && (
                            <span className="text-sm text-[#5A5A5A]">
                                Conquiste 3 dias para 🔥
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-[#5A5A5A]">Conquistas</p>
                </div>
            </div>
        </motion.div>
    );
}
