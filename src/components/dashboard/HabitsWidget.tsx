"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTime } from "@/hooks/use-time";
import { useHabits } from "@/context/LifeSyncContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Droplets,
    Sparkles,
    Sun,
    Dumbbell,
    PenLine,
    Timer,
    GlassWater,
    PersonStanding,
    MonitorOff,
    Book,
    Heart,
    Brain,
    Check,
    Sunrise,
    Moon,
    ChevronRight,
    Target,
    Plus,
    Loader2,
} from "lucide-react";

// Mapeamento de ícones
const iconMap: Record<string, React.ElementType> = {
    Droplets, Sparkles, Sun, Dumbbell, PenLine, Timer, GlassWater, PersonStanding, MonitorOff, Book, Heart, Brain, Target,
};

// Dark Academia period config
const periodConfig = {
    morning: { icon: Sunrise, label: "Manhã", color: "text-[#D99E6B]", category: "morning" as const },    // clay
    afternoon: { icon: Sun, label: "Tarde", color: "text-[#CCAE70]", category: "anytime" as const },      // gold
    evening: { icon: Moon, label: "Noite", color: "text-[#768C9E]", category: "evening" as const },       // slate
};

function toISODateString(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * HabitsWidget - Dark Academia Style
 *
 * Rastreador de hábitos com estética elegante de biblioteca.
 */
export function HabitsWidget() {
    const { hours } = useTime();
    const { habits, toggleHabitDate, isHydrated } = useHabits();
    const todayStr = useMemo(() => toISODateString(new Date()), []);

    // Determina período atual
    const currentPeriod = useMemo(() => {
        if (hours >= 5 && hours < 12) return "morning";
        if (hours >= 12 && hours < 18) return "afternoon";
        return "evening";
    }, [hours]);

    // Filtra hábitos do período atual
    const periodHabits = useMemo(() => {
        const config = periodConfig[currentPeriod];
        if (currentPeriod === "afternoon") {
            return habits.filter(h => h.category === "anytime" && !h.archived);
        }
        return habits.filter(h => h.category === config.category && !h.archived);
    }, [habits, currentPeriod]);

    // Calcula progresso
    const completedCount = useMemo(() =>
        periodHabits.filter(h => h.completionHistory.includes(todayStr)).length,
        [periodHabits, todayStr]
    );

    const progress = periodHabits.length > 0
        ? Math.round((completedCount / periodHabits.length) * 100)
        : 0;

    const PeriodIcon = periodConfig[currentPeriod].icon;

    // Loading state
    if (!isHydrated) {
        return (
            <Card className="col-span-full lg:col-span-2">
                <CardContent className="p-8 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-[#CCAE70] animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-sans font-medium">Hábitos</CardTitle>
                        <Badge variant="secondary" className="gap-1">
                            <PeriodIcon className={cn("h-3 w-3", periodConfig[currentPeriod].color)} />
                            {periodConfig[currentPeriod].label}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-[#9B9B9B]">
                            {completedCount}/{periodHabits.length}
                        </span>
                        <Link
                            href="/habits"
                            className="flex items-center gap-1 text-sm text-[#CCAE70] hover:text-[#D99E6B] transition-colors"
                        >
                            Ver todos
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Empty State */}
                {periodHabits.length === 0 && (
                    <div className="py-6 text-center">
                        <Target className="h-10 w-10 mx-auto text-[#5A5A5A] mb-2" />
                        <p className="text-[#9B9B9B] text-sm mb-3">Nenhum hábito para este período</p>
                        <Link
                            href="/habits"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(204,174,112,0.15)] text-[#CCAE70] rounded-lg text-sm font-medium hover:bg-[rgba(204,174,112,0.25)] transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Criar Hábito
                        </Link>
                    </div>
                )}

                {/* Habit Pills */}
                {periodHabits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {periodHabits.map((habit) => {
                            const isCompleted = habit.completionHistory.includes(todayStr);
                            const Icon = iconMap[habit.icon] || Sparkles;

                            return (
                                <button
                                    key={habit.id}
                                    onClick={() => toggleHabitDate(habit.id, todayStr)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300",
                                        "focus:outline-none focus:ring-2 focus:ring-[#CCAE70] focus:ring-offset-2 focus:ring-offset-[#191919]",
                                        isCompleted
                                            ? "bg-[rgba(140,158,120,0.2)] border-[rgba(140,158,120,0.5)] text-[#8C9E78]"
                                            : "bg-[#2C2C2C] border-[rgba(255,255,255,0.05)] text-[#E3E3E3] hover:border-[rgba(255,255,255,0.1)] hover:bg-[#303030]"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "relative flex items-center justify-center h-6 w-6 rounded-full transition-all duration-300",
                                            isCompleted ? "bg-[#8C9E78]" : "bg-[#3A3A3A]"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-4 w-4 text-white" />
                                        ) : (
                                            <Icon className="h-3.5 w-3.5 text-[#9B9B9B]" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{habit.name}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Progress Bar */}
                {periodHabits.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[#9B9B9B]">Progresso de Hoje</span>
                            <span className={cn(
                                "font-mono font-medium",
                                progress === 100 ? "text-[#8C9E78]" : "text-[#E3E3E3]"
                            )}>
                                {progress}%
                            </span>
                        </div>
                        <Progress
                            value={progress}
                            variant={progress === 100 ? "olive" : "gold"}
                            size="md"
                        />
                    </div>
                )}

                {/* Completion Message */}
                {progress === 100 && periodHabits.length > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(140,158,120,0.1)] border border-[rgba(140,158,120,0.2)]">
                        <Sparkles className="h-4 w-4 text-[#8C9E78]" />
                        <span className="text-sm text-[#8C9E78]">
                            Todos os hábitos concluídos! 🎉
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
