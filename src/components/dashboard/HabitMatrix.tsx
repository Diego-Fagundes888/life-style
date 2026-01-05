"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { TrackingHabit } from "@/lib/mock-data";

// ============================================================================
// HELPERS
// ============================================================================

function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function toISODateString(date: Date): string {
    return date.toISOString().split("T")[0];
}

function calculateStreak(completionHistory: string[]): number {
    if (completionHistory.length === 0) return 0;

    const sortedDates = [...completionHistory].sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    const todayStr = toISODateString(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toISODateString(yesterday);

    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
        return 0;
    }

    if (sortedDates.includes(todayStr)) {
        currentDate = new Date(today);
    } else {
        currentDate = new Date(yesterday);
    }

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

// ============================================================================
// TYPES
// ============================================================================

interface HabitMatrixProps {
    habits: TrackingHabit[];
    onToggleDate: (habitId: string, date: string) => void;
    year?: number;
    month?: number;
}

interface MatrixCellProps {
    isCompleted: boolean;
    isToday: boolean;
    isFuture: boolean;
    onClick: () => void;
    dayNumber: number;
}

// ============================================================================
// COMPONENTS - Dark Academia Colors
// ============================================================================

function MatrixCell({ isCompleted, isToday, isFuture, onClick, dayNumber }: MatrixCellProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={isFuture}
            whileHover={!isFuture ? { scale: 1.2 } : undefined}
            whileTap={!isFuture ? { scale: 0.9 } : undefined}
            className={cn(
                "w-6 h-6 sm:w-7 sm:h-7 rounded-md transition-all flex items-center justify-center text-xs font-medium",
                isCompleted
                    ? "bg-[#8C9E78] text-white shadow-sm shadow-[rgba(140,158,120,0.3)]" // olive
                    : "bg-[#2C2C2C] hover:bg-[#3A3A3A]",
                isToday && "ring-2 ring-[#CCAE70] ring-offset-2 ring-offset-[#191919]", // gold ring
                isFuture && "opacity-30 cursor-not-allowed"
            )}
            title={`Dia ${dayNumber}`}
        >
            {isCompleted && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                    ✓
                </motion.span>
            )}
        </motion.button>
    );
}

function StreakBadge({ count }: { count: number }) {
    if (count === 0) return null;

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                count >= 7
                    ? "bg-[rgba(217,158,107,0.2)] text-[#D99E6B]" // clay for hot streak
                    : count >= 3
                        ? "bg-[rgba(204,174,112,0.2)] text-[#CCAE70]" // gold for medium streak
                        : "bg-[#2C2C2C] text-[#9B9B9B]" // neutral for small streak
            )}
        >
            <Flame className={cn(
                "h-3 w-3",
                count >= 7 ? "text-[#D99E6B]" : count >= 3 ? "text-[#CCAE70]" : "text-[#5A5A5A]"
            )} />
            {count}
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HabitMatrix({ habits, onToggleDate, year, month }: HabitMatrixProps) {
    const today = useMemo(() => new Date(), []);
    const displayYear = year ?? today.getFullYear();
    const displayMonth = month ?? today.getMonth();

    const monthDays = useMemo(() => getDaysInMonth(displayYear, displayMonth), [displayYear, displayMonth]);
    const todayStr = useMemo(() => toISODateString(today), [today]);

    const monthName = useMemo(() => {
        return new Date(displayYear, displayMonth).toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric"
        });
    }, [displayYear, displayMonth]);

    const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);

    return (
        <div className="overflow-x-auto hide-scrollbar">
            <div className="min-w-[700px]">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg font-medium text-[#E3E3E3] capitalize">{monthName}</h3>
                    <div className="flex gap-4 text-sm text-[#9B9B9B]">
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-[#8C9E78]" /> Concluído
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-[#2C2C2C]" /> Pendente
                        </span>
                    </div>
                </div>

                {/* Days Header */}
                <div className="flex">
                    {/* Habit name column spacer */}
                    <div className="w-44 shrink-0" />
                    {/* Streak badge spacer */}
                    <div className="w-16 shrink-0" />
                    {/* Day numbers */}
                    <div className="flex gap-1">
                        {monthDays.map((day, index) => {
                            const dayOfWeek = day.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "w-6 sm:w-7 text-center text-xs font-medium",
                                        isWeekend ? "text-[#5A5A5A]" : "text-[#9B9B9B]"
                                    )}
                                >
                                    {day.getDate()}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Habit Rows */}
                <div className="mt-2 space-y-2">
                    {activeHabits.map((habit) => {
                        const streak = calculateStreak(habit.completionHistory);

                        return (
                            <div key={habit.id} className="flex items-center">
                                {/* Habit Name */}
                                <div className="w-44 shrink-0 pr-3">
                                    <span className="text-sm font-medium text-[#E3E3E3] truncate block">
                                        {habit.name}
                                    </span>
                                    <span className="text-xs text-[#5A5A5A] capitalize">
                                        {habit.category === "morning" ? "🌅 Manhã" :
                                            habit.category === "evening" ? "🌙 Noite" : "⏰ Qualquer hora"}
                                    </span>
                                </div>

                                {/* Streak Badge */}
                                <div className="w-16 shrink-0 flex justify-center">
                                    <StreakBadge count={streak} />
                                </div>

                                {/* Matrix Cells */}
                                <div className="flex gap-1">
                                    {monthDays.map((day) => {
                                        const dateStr = toISODateString(day);
                                        const isCompleted = habit.completionHistory.includes(dateStr);
                                        const isToday = dateStr === todayStr;
                                        const isFuture = day > today;

                                        return (
                                            <MatrixCell
                                                key={dateStr}
                                                isCompleted={isCompleted}
                                                isToday={isToday}
                                                isFuture={isFuture}
                                                onClick={() => onToggleDate(habit.id, dateStr)}
                                                dayNumber={day.getDate()}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MINI HEATMAP (For Mobile) - Dark Academia Colors
// ============================================================================

interface MiniHeatmapProps {
    habit: TrackingHabit;
    days?: number;
}

export function MiniHeatmap({ habit, days = 7 }: MiniHeatmapProps) {
    const today = new Date();
    const recentDays = useMemo(() => {
        const dates: Date[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date);
        }
        return dates;
    }, [days, today]);

    return (
        <div className="flex gap-1">
            {recentDays.map((day) => {
                const dateStr = toISODateString(day);
                const isCompleted = habit.completionHistory.includes(dateStr);
                const isToday = toISODateString(today) === dateStr;

                return (
                    <div
                        key={dateStr}
                        className={cn(
                            "w-3 h-3 rounded-sm",
                            isCompleted ? "bg-[#8C9E78]" : "bg-[#2C2C2C]", // olive for completed
                            isToday && "ring-1 ring-[#CCAE70]" // gold ring for today
                        )}
                    />
                );
            })}
        </div>
    );
}
