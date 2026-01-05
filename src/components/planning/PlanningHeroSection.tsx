"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTasks, useWeeklyFocus } from "@/context/LifeSyncContext";
import { Target, TrendingUp, Calendar, Zap, CheckCircle2 } from "lucide-react";

// =============================================================================
// HELPERS
// =============================================================================

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getWeekDays(weekStart: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });
}

function toISODateString(date: Date): string {
    return date.toISOString().split("T")[0];
}

const DAY_NAMES_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

// =============================================================================
// MINI PROGRESS RING
// =============================================================================
interface MiniProgressRingProps {
    progress: number;
    size?: number;
    isToday?: boolean;
    isSelected?: boolean;
    dayLetter: string;
    dayNumber: number;
    onClick: () => void;
}

function MiniProgressRing({
    progress,
    size = 56,
    isToday = false,
    isSelected = false,
    dayLetter,
    dayNumber,
    onClick,
}: MiniProgressRingProps) {
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const getColor = () => {
        if (progress === 100) return "#8C9E78"; // olive - complete
        if (isToday) return "#CCAE70"; // gold for today
        if (progress > 0) return "#768C9E"; // slate for partial
        return "#3A3A3A"; // gray for empty
    };

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`
                relative flex flex-col items-center gap-1 p-1 rounded-xl transition-all
                ${isSelected ? "bg-[rgba(204,174,112,0.15)]" : "hover:bg-[rgba(255,255,255,0.05)]"}
            `}
        >
            {/* Ring */}
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
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${isToday ? "text-[#CCAE70]" : "text-[#E3E3E3]"}`}>
                        {dayNumber}
                    </span>
                </div>
                {/* Complete checkmark */}
                {progress === 100 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-[#8C9E78] rounded-full flex items-center justify-center"
                    >
                        <CheckCircle2 className="h-3 w-3 text-white" />
                    </motion.div>
                )}
            </div>

            {/* Day letter */}
            <span className={`text-xs font-medium ${isToday ? "text-[#CCAE70]" : "text-[#9B9B9B]"}`}>
                {dayLetter}
            </span>

            {/* Today indicator */}
            {isToday && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 w-2 h-2 bg-[#CCAE70] rounded-full"
                />
            )}
        </motion.button>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
interface PlanningHeroSectionProps {
    selectedDayIndex: number;
    onSelectDay: (index: number) => void;
    weekStart: Date;
}

export function PlanningHeroSection({
    selectedDayIndex,
    onSelectDay,
    weekStart
}: PlanningHeroSectionProps) {
    const { tasks, isHydrated } = useTasks();
    const { weeklyFocus } = useWeeklyFocus();

    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
    const todayStr = useMemo(() => toISODateString(new Date()), []);

    // Calculate stats for each day
    const dayStats = useMemo(() => {
        return weekDays.map(date => {
            const dateStr = toISODateString(date);
            const dayTasks = tasks.filter(t => t.date === dateStr && !t.isRoutine);
            const completed = dayTasks.filter(t => t.completed).length;
            const total = dayTasks.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { dateStr, completed, total, progress };
        });
    }, [weekDays, tasks]);

    // Calculate weekly totals
    const weeklyStats = useMemo(() => {
        const totalTasks = dayStats.reduce((sum, day) => sum + day.total, 0);
        const completedTasks = dayStats.reduce((sum, day) => sum + day.completed, 0);
        const weekProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const daysComplete = dayStats.filter(d => d.total > 0 && d.progress === 100).length;
        return { totalTasks, completedTasks, weekProgress, daysComplete };
    }, [dayStats]);

    if (!isHydrated) {
        return (
            <div className="bg-[#202020] rounded-2xl border border-[rgba(255,255,255,0.05)] p-6 animate-pulse h-40" />
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
                {/* Left: Weekly Goal */}
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[rgba(204,174,112,0.15)] rounded-xl">
                            <Target className="h-6 w-6 text-[#CCAE70]" />
                        </div>
                        <div>
                            <p className="text-sm text-[#9B9B9B]">Meta da Semana</p>
                            <p className="text-lg font-semibold text-[#E3E3E3] truncate max-w-[300px]">
                                {weeklyFocus.focus || "Defina sua meta..."}
                            </p>
                        </div>
                    </div>

                    {/* Weekly Stats */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(140,158,120,0.1)] border border-[rgba(140,158,120,0.2)] rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-[#8C9E78]" />
                            <span className="text-sm font-medium text-[#8C9E78]">
                                {weeklyStats.completedTasks}/{weeklyStats.totalTasks} tarefas
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(204,174,112,0.1)] border border-[rgba(204,174,112,0.2)] rounded-lg">
                            <TrendingUp className="h-4 w-4 text-[#CCAE70]" />
                            <span className="text-sm font-medium text-[#CCAE70]">
                                {weeklyStats.weekProgress}% da semana
                            </span>
                        </div>
                        {weeklyStats.daysComplete > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(217,158,107,0.1)] border border-[rgba(217,158,107,0.2)] rounded-lg">
                                <Calendar className="h-4 w-4 text-[#D99E6B]" />
                                <span className="text-sm font-medium text-[#D99E6B]">
                                    {weeklyStats.daysComplete} {weeklyStats.daysComplete === 1 ? "dia" : "dias"} 100%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Day Progress Rings */}
                <div className="flex items-center gap-2">
                    {weekDays.map((date, index) => {
                        const dateStr = toISODateString(date);
                        const isToday = dateStr === todayStr;
                        const stats = dayStats[index];

                        return (
                            <MiniProgressRing
                                key={dateStr}
                                progress={stats.progress}
                                isToday={isToday}
                                isSelected={index === selectedDayIndex}
                                dayLetter={DAY_NAMES_SHORT[date.getDay()]}
                                dayNumber={date.getDate()}
                                onClick={() => onSelectDay(index)}
                            />
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
