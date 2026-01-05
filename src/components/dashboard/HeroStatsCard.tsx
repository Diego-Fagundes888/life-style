"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTime } from "@/hooks/use-time";
import { useHabits } from "@/context/LifeSyncContext";
import { getStoredData, setStoredData, STORAGE_KEYS } from "@/lib/store";
import {
    GamificationState,
    INITIAL_GAMIFICATION_STATE,
    getCurrentLevel,
    getNextLevel,
    getLevelProgress,
    formatXP,
    calculateNewStreak,
    getStreakMessage,
    XP_REWARDS,
} from "@/lib/types/gamification";
import { Flame, Sparkles, TrendingUp, Zap } from "lucide-react";

// =============================================================================
// CIRCULAR PROGRESS RING COMPONENT
// =============================================================================
interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    children?: React.ReactNode;
}

function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    color = "#CCAE70",
    bgColor = "rgba(255,255,255,0.1)",
    children,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}

// =============================================================================
// STREAK FIRE ANIMATION
// =============================================================================
function StreakFire({ active }: { active: boolean }) {
    if (!active) return null;

    return (
        <motion.div
            className="relative"
            animate={{
                scale: [1, 1.1, 1],
            }}
            transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            <Flame className="h-8 w-8 text-orange-500" />
            <motion.div
                className="absolute inset-0"
                animate={{
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <Flame className="h-8 w-8 text-yellow-400" />
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// MOTIVATIONAL MESSAGES
// =============================================================================
function getMotivationalMessage(hour: number, streakDays: number, progress: number): string {
    // Morning messages
    if (hour >= 5 && hour < 12) {
        if (progress === 0) return "Novo dia, novas conquistas! ☀️";
        if (progress < 50) return "Bom começo! Continue assim 💪";
        return "Manhã produtiva! Você está voando 🚀";
    }

    // Afternoon messages
    if (hour >= 12 && hour < 18) {
        if (progress < 30) return "Ainda dá tempo de virar o jogo! ⚡";
        if (progress < 70) return "Metade do caminho! Bora finalizar 🎯";
        return "Tarde incrível! Quase lá 🌟";
    }

    // Evening messages
    if (progress === 100) return "Dia perfeito! Você é demais 👑";
    if (progress >= 80) return "Quase 100%! Um último esforço 🔥";
    if (streakDays > 7) return "Sua consistência inspira! 💎";

    return "Cada pequeno passo importa 🌙";
}

// =============================================================================
// HERO STATS CARD COMPONENT
// =============================================================================
export function HeroStatsCard() {
    const { hours } = useTime();
    const { habits, isHydrated } = useHabits();
    const [gamification, setGamification] = useState<GamificationState>(INITIAL_GAMIFICATION_STATE);
    const [showLevelUp, setShowLevelUp] = useState(false);

    // Load gamification state from localStorage
    useEffect(() => {
        if (!isHydrated) return;

        const stored = getStoredData<GamificationState>(STORAGE_KEYS.GAMIFICATION);
        if (stored) {
            // Calculate new streak based on last active date
            const newStreak = calculateNewStreak(stored.currentStreak, stored.lastActiveDate);
            const today = new Date().toISOString().split("T")[0];

            const updatedState: GamificationState = {
                ...stored,
                currentStreak: newStreak,
                longestStreak: Math.max(stored.longestStreak, newStreak),
                lastActiveDate: today,
            };

            // Check for first action of day bonus
            if (stored.lastActiveDate !== today) {
                updatedState.totalXP = stored.totalXP + XP_REWARDS.FIRST_ACTION_OF_DAY + XP_REWARDS.DAILY_STREAK;
                updatedState.xpHistory = {
                    ...stored.xpHistory,
                    [today]: XP_REWARDS.FIRST_ACTION_OF_DAY + XP_REWARDS.DAILY_STREAK,
                };
            }

            setGamification(updatedState);
            setStoredData(STORAGE_KEYS.GAMIFICATION, updatedState);
        } else {
            // First time user
            const today = new Date().toISOString().split("T")[0];
            const initialState: GamificationState = {
                ...INITIAL_GAMIFICATION_STATE,
                currentStreak: 1,
                lastActiveDate: today,
                totalXP: XP_REWARDS.FIRST_ACTION_OF_DAY,
                xpHistory: { [today]: XP_REWARDS.FIRST_ACTION_OF_DAY },
            };
            setGamification(initialState);
            setStoredData(STORAGE_KEYS.GAMIFICATION, initialState);
        }
    }, [isHydrated]);

    // Calculate daily progress from habits
    const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
    const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
    const completedToday = useMemo(() =>
        activeHabits.filter(h => h.completionHistory.includes(todayStr)).length,
        [activeHabits, todayStr]
    );
    const dailyProgress = useMemo(() =>
        activeHabits.length > 0 ? Math.round((completedToday / activeHabits.length) * 100) : 0,
        [activeHabits, completedToday]
    );

    // Level calculations
    const currentLevel = useMemo(() => getCurrentLevel(gamification.totalXP), [gamification.totalXP]);
    const nextLevel = useMemo(() => getNextLevel(gamification.totalXP), [gamification.totalXP]);
    const levelProgress = useMemo(() => getLevelProgress(gamification.totalXP), [gamification.totalXP]);

    // Motivational message
    const motivationalMessage = useMemo(
        () => getMotivationalMessage(hours, gamification.currentStreak, dailyProgress),
        [hours, gamification.currentStreak, dailyProgress]
    );

    // Add XP function (can be called from other components via context later)
    const addXP = useCallback((amount: number, source: string) => {
        setGamification(prev => {
            const today = new Date().toISOString().split("T")[0];
            const oldLevel = getCurrentLevel(prev.totalXP);
            const newTotalXP = prev.totalXP + amount;
            const newLevel = getCurrentLevel(newTotalXP);

            // Check for level up
            if (newLevel.id > oldLevel.id) {
                setShowLevelUp(true);
                setTimeout(() => setShowLevelUp(false), 3000);
            }

            const newState: GamificationState = {
                ...prev,
                totalXP: newTotalXP,
                xpHistory: {
                    ...prev.xpHistory,
                    [today]: (prev.xpHistory[today] || 0) + amount,
                },
            };

            setStoredData(STORAGE_KEYS.GAMIFICATION, newState);
            return newState;
        });
    }, []);

    // Expose addXP to window for global access (temporary solution)
    useEffect(() => {
        (window as unknown as { lifeSyncAddXP?: (amount: number, source: string) => void }).lifeSyncAddXP = addXP;
    }, [addXP]);

    if (!isHydrated) {
        return (
            <div className="col-span-full bg-[#202020] rounded-xl border border-[rgba(255,255,255,0.05)] p-6 animate-pulse h-32" />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-span-full"
        >
            {/* Level Up Toast */}
            <AnimatePresence>
                {showLevelUp && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.8 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-gradient-to-r from-[#CCAE70] to-[#D99E6B] text-[#191919] rounded-2xl shadow-2xl flex items-center gap-3"
                    >
                        <Sparkles className="h-6 w-6" />
                        <div>
                            <p className="font-bold">Level Up!</p>
                            <p className="text-sm opacity-80">Você alcançou o nível {currentLevel.name}!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Card */}
            <div className="bg-gradient-to-br from-[#202020] via-[#252525] to-[#1a1a1a] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 shadow-lg">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                    {/* Left: Streak + Message */}
                    <div className="flex-1 space-y-4">
                        {/* Streak Display */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,165,0,0.1)] border border-[rgba(255,165,0,0.2)] rounded-xl">
                                <StreakFire active={gamification.currentStreak > 0} />
                                <div>
                                    <p className="text-2xl font-bold font-mono text-orange-400">
                                        {gamification.currentStreak}
                                    </p>
                                    <p className="text-xs text-[#9B9B9B]">
                                        {gamification.currentStreak === 1 ? "dia" : "dias"} seguidos
                                    </p>
                                </div>
                            </div>

                            {/* Best Streak Badge */}
                            {gamification.longestStreak > gamification.currentStreak && (
                                <div className="px-3 py-1 bg-[rgba(204,174,112,0.1)] border border-[rgba(204,174,112,0.2)] rounded-lg">
                                    <p className="text-xs text-[#CCAE70]">
                                        Recorde: {gamification.longestStreak} dias
                                    </p>
                                </div>
                            )}
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

                        {/* Streak Message */}
                        <p className="text-sm text-[#9B9B9B]">
                            {getStreakMessage(gamification.currentStreak)}
                        </p>
                    </div>

                    {/* Center: Daily Progress Ring */}
                    <div className="flex flex-col items-center gap-2">
                        <ProgressRing
                            progress={dailyProgress}
                            size={130}
                            strokeWidth={10}
                            color={dailyProgress === 100 ? "#8C9E78" : "#CCAE70"}
                        >
                            <div className="text-center">
                                <motion.p
                                    key={dailyProgress}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    className="text-3xl font-bold text-[#E3E3E3]"
                                >
                                    {dailyProgress}%
                                </motion.p>
                                <p className="text-xs text-[#9B9B9B]">hoje</p>
                            </div>
                        </ProgressRing>
                        <p className="text-sm text-[#5A5A5A]">
                            {completedToday}/{activeHabits.length} hábitos
                        </p>
                    </div>

                    {/* Right: XP & Level */}
                    <div className="flex-1 flex flex-col items-center lg:items-end space-y-3">
                        {/* Level Badge */}
                        <div className="flex items-center gap-3 px-4 py-2 bg-[rgba(204,174,112,0.1)] border border-[rgba(204,174,112,0.2)] rounded-xl">
                            <span className="text-2xl">{currentLevel.icon}</span>
                            <div>
                                <p className="text-sm text-[#CCAE70] font-medium">
                                    {currentLevel.name}
                                </p>
                                <p className="text-xs text-[#9B9B9B]">
                                    Nível {currentLevel.id}
                                </p>
                            </div>
                        </div>

                        {/* XP Display */}
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-[#CCAE70]" />
                            <span className="text-xl font-bold font-mono text-[#E3E3E3]">
                                {formatXP(gamification.totalXP)} XP
                            </span>
                        </div>

                        {/* Level Progress */}
                        {nextLevel && (
                            <div className="w-full max-w-[200px] space-y-1">
                                <div className="flex justify-between text-xs text-[#5A5A5A]">
                                    <span>Próximo: {nextLevel.name}</span>
                                    <span>{levelProgress}%</span>
                                </div>
                                <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[#CCAE70] to-[#D99E6B] rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${levelProgress}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Today's XP */}
                        <div className="flex items-center gap-1 text-xs text-[#8C9E78]">
                            <TrendingUp className="h-3 w-3" />
                            <span>+{gamification.xpHistory[todayStr] || 0} XP hoje</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
