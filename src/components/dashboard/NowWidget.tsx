"use client";

import { useTime } from "@/hooks/use-time";
import { getTimeRemaining } from "@/lib/utils";
import { getCurrentTimeBlock, getNextTimeBlock, type TimeBlock } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Brain,
    Coffee,
    Code,
    Moon,
    Sun,
    Dumbbell,
    UtensilsCrossed,
    Users,
    BookOpen,
    Gamepad2,
    ClipboardList,
    Footprints,
    Sunrise,
    Timer,
    ChevronRight,
} from "lucide-react";

// Mapeamento de ícones
const iconMap: Record<string, React.ElementType> = {
    Brain,
    Coffee,
    Code,
    Moon,
    Sun,
    Dumbbell,
    UtensilsCrossed,
    Users,
    BookOpen,
    Gamepad2,
    ClipboardList,
    Footprints,
    Sunrise,
};

// Dark Academia colors by category
const categoryColors: Record<TimeBlock["category"], string> = {
    "deep-work": "text-[#768C9E] bg-[rgba(118,140,158,0.2)]", // slate
    routine: "text-[#9B9B9B] bg-[rgba(155,155,155,0.15)]",     // neutral
    rest: "text-[#8C9E78] bg-[rgba(140,158,120,0.2)]",         // olive
    social: "text-[#D99E6B] bg-[rgba(217,158,107,0.2)]",       // clay
    health: "text-[#C87F76] bg-[rgba(200,127,118,0.2)]",       // rust
};

const categoryBadgeVariant: Record<TimeBlock["category"], "default" | "success" | "warning" | "danger" | "secondary" | "slate" | "olive" | "clay" | "rust"> = {
    "deep-work": "slate",
    routine: "secondary",
    rest: "olive",
    social: "clay",
    health: "rust",
};

/**
 * NowWidget - Dark Academia Style
 *
 * Widget de foco tático com estética elegante de biblioteca.
 */
export function NowWidget() {
    const { hours, minutes } = useTime();
    const currentBlock = getCurrentTimeBlock(hours, minutes);
    const nextBlock = getNextTimeBlock(hours, minutes);

    // Calcula tempo restante do bloco atual
    const remaining = currentBlock
        ? getTimeRemaining(currentBlock.endHour, currentBlock.endMinute, hours, minutes)
        : { hours: 0, minutes: 0 };

    // Calcula progresso dentro do bloco atual
    const blockProgress = currentBlock
        ? calculateBlockProgress(currentBlock, hours, minutes)
        : 0;

    const CurrentIcon = currentBlock ? iconMap[currentBlock.icon] || Timer : Timer;
    const NextIcon = nextBlock ? iconMap[nextBlock.icon] || Timer : Timer;

    return (
        <Card className="col-span-full lg:col-span-2 lg:row-span-2 border-[rgba(204,174,112,0.2)]">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-[#9B9B9B] font-sans font-medium">Agora</CardTitle>
                    <Badge variant="gold" className="font-mono">
                        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Bloco Atual */}
                {currentBlock ? (
                    <div className="space-y-4">
                        {/* Ícone e Título */}
                        <div className="flex items-start gap-4">
                            <div
                                className={`p-4 rounded-xl ${categoryColors[currentBlock.category]}`}
                            >
                                <CurrentIcon className="h-8 w-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-serif text-xl md:text-2xl font-medium text-[#E3E3E3] leading-tight">
                                    {currentBlock.title}
                                </h2>
                                <p className="text-[#9B9B9B] mt-1">
                                    {formatTimeRange(currentBlock)}
                                </p>
                            </div>
                        </div>

                        {/* Tempo Restante */}
                        <div className="bg-[#2C2C2C] rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#9B9B9B]">Tempo restante</span>
                                <Badge variant={categoryBadgeVariant[currentBlock.category]}>
                                    {currentBlock.category.replace("-", " ")}
                                </Badge>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl md:text-5xl font-bold font-mono text-[#E3E3E3]">
                                    {remaining.hours > 0 && (
                                        <>
                                            {remaining.hours}
                                            <span className="text-2xl text-[#5A5A5A]">h </span>
                                        </>
                                    )}
                                    {remaining.minutes}
                                </span>
                                <span className="text-2xl text-[#5A5A5A]">min</span>
                            </div>
                            <Progress value={blockProgress} variant="gold" size="md" />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-[#9B9B9B]">
                        Nenhum bloco definido para este horário
                    </div>
                )}

                {/* Próximo Bloco */}
                {nextBlock && (
                    <div className="pt-4 border-t border-[rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4 text-[#5A5A5A]" />
                            <div
                                className={`p-2 rounded-lg ${categoryColors[nextBlock.category]}`}
                            >
                                <NextIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#E3E3E3] truncate">
                                    A seguir: {nextBlock.title}
                                </p>
                                <p className="text-xs text-[#5A5A5A]">
                                    {formatTimeRange(nextBlock)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Formata o intervalo de tempo do bloco.
 */
function formatTimeRange(block: TimeBlock): string {
    const start = `${String(block.startHour).padStart(2, "0")}:${String(block.startMinute).padStart(2, "0")}`;
    const end = `${String(block.endHour).padStart(2, "0")}:${String(block.endMinute).padStart(2, "0")}`;
    return `${start} - ${end}`;
}

/**
 * Calcula o progresso dentro do bloco atual.
 */
function calculateBlockProgress(block: TimeBlock, currentHour: number, currentMinute: number): number {
    const startMinutes = block.startHour * 60 + block.startMinute;
    let endMinutes = block.endHour * 60 + block.endMinute;
    const currentMinutes = currentHour * 60 + currentMinute;

    // Trata blocos que cruzam meia-noite
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }

    const totalDuration = endMinutes - startMinutes;
    const elapsed = currentMinutes - startMinutes;

    return Math.round((elapsed / totalDuration) * 100);
}
