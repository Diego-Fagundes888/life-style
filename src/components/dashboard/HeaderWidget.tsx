"use client";

import { useTime } from "@/hooks/use-time";
import { getGreeting, formatDateElegant, getDayProgress } from "@/lib/utils";
import { USER_PROFILE } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles } from "lucide-react";

/**
 * HeaderWidget - Dark Academia Style
 *
 * Cabeçalho inteligente com estética de biblioteca antiga.
 * Usa cores terrosas e tipografia serif para headings.
 */
export function HeaderWidget() {
    const { hours, minutes, date } = useTime();
    const greeting = getGreeting(hours);
    const formattedDate = formatDateElegant(date);
    const dayProgress = getDayProgress(hours, minutes);

    return (
        <div className="col-span-full rounded-lg border border-[rgba(255,255,255,0.05)] bg-[#202020] p-6 shadow-sm">
            {/* Top Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Greeting & Date */}
                <div className="space-y-1">
                    <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#E3E3E3] flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-[#CCAE70]" />
                        {greeting}, <span className="text-[#CCAE70]">{USER_PROFILE.name}</span>
                    </h1>
                    <p className="text-[#9B9B9B] capitalize">{formattedDate}</p>
                </div>

                {/* Day Progress */}
                <div className="flex flex-col items-start md:items-end gap-2 min-w-[200px]">
                    <div className="flex items-center gap-2 text-sm text-[#9B9B9B]">
                        <span>Progresso do Dia</span>
                        <span className="font-mono text-[#CCAE70]">{dayProgress}%</span>
                    </div>
                    <Progress value={dayProgress} variant="gold" size="sm" className="w-full md:w-48" />
                </div>
            </div>

            {/* Yearly Goal Banner */}
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-2">
                    <Badge variant="default" className="gap-1">
                        <Target className="h-3 w-3" />
                        Foco 2026
                    </Badge>
                    <span className="text-sm text-[#E3E3E3]">{USER_PROFILE.yearlyGoal}</span>
                </div>
            </div>
        </div>
    );
}
