"use client";

import { useState, useMemo } from "react";
import { FloatingDock } from "@/components/dashboard/FloatingDock";
import { PlanningHeroSection } from "@/components/planning";
import { WeeklyPlanner } from "@/components/dashboard/WeeklyPlanner";
import { Calendar } from "lucide-react";

// Helper to get week start
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export default function PlanningPage() {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
    const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
        const today = new Date();
        const weekStart = getWeekStart(today);
        const diff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, Math.min(6, diff));
    });

    return (
        <main className="min-h-screen pb-32">
            <div className="p-4 md:p-6 lg:p-8">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    {/* Page Header */}
                    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#E3E3E3] flex items-center gap-3">
                                <Calendar className="h-7 w-7 text-[#768C9E]" />
                                Planejamento Semanal
                            </h1>
                            <p className="text-[#9B9B9B] mt-1">
                                Organize suas tarefas e visualize sua rotina base
                            </p>
                        </div>
                    </header>

                    {/* Hero Section with Progress Rings */}
                    <PlanningHeroSection
                        selectedDayIndex={selectedDayIndex}
                        onSelectDay={setSelectedDayIndex}
                        weekStart={currentWeekStart}
                    />

                    {/* Weekly Planner Component */}
                    <WeeklyPlanner
                        externalSelectedDayIndex={selectedDayIndex}
                        onExternalDayChange={setSelectedDayIndex}
                        externalWeekStart={currentWeekStart}
                        onExternalWeekChange={setCurrentWeekStart}
                    />
                </div>
            </div>

            {/* Floating Dock */}
            <FloatingDock />
        </main>
    );
}
