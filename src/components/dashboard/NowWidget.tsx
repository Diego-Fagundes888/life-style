"use client";

import * as React from "react";
import { useTime } from "@/hooks/use-time";
import { getTimeRemaining } from "@/lib/utils";
import {
    getCurrentTimeBlockFromList,
    getNextTimeBlockFromList,
    seedDefaultTimeBlocks,
    type DBTimeBlock
} from "@/lib/db";
import { useTimeBlocksQuery } from "@/lib/db-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RoutineEditorPanel } from "./RoutineEditorPanel";
import { getIconByName } from "@/components/ui/IconPicker";
import {
    Timer,
    ChevronRight,
    Settings,
} from "lucide-react";

// Dark Academia colors by category
const categoryColors: Record<DBTimeBlock["category"], string> = {
    "deep-work": "text-[#768C9E] bg-[rgba(118,140,158,0.2)]",
    routine: "text-[#9B9B9B] bg-[rgba(155,155,155,0.15)]",
    rest: "text-[#8C9E78] bg-[rgba(140,158,120,0.2)]",
    social: "text-[#D99E6B] bg-[rgba(217,158,107,0.2)]",
    health: "text-[#C87F76] bg-[rgba(200,127,118,0.2)]",
};

const categoryBadgeVariant: Record<DBTimeBlock["category"], "default" | "success" | "warning" | "danger" | "secondary" | "slate" | "olive" | "clay" | "rust"> = {
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
 * Agora com suporte a rotina personalizada via IndexedDB.
 */
export function NowWidget() {
    const { hours, minutes } = useTime();
    const timeBlocks = useTimeBlocksQuery();
    const [editorOpen, setEditorOpen] = React.useState(false);

    // Seed default time blocks on first load
    React.useEffect(() => {
        seedDefaultTimeBlocks();
    }, []);

    // Obtém blocos atual e próximo usando dados dinâmicos
    const currentBlock = React.useMemo(() =>
        getCurrentTimeBlockFromList(timeBlocks, hours, minutes),
        [timeBlocks, hours, minutes]
    );

    const nextBlock = React.useMemo(() =>
        getNextTimeBlockFromList(timeBlocks, hours, minutes),
        [timeBlocks, hours, minutes]
    );

    // Calcula tempo restante do bloco atual
    const remaining = currentBlock
        ? getTimeRemaining(currentBlock.endHour, currentBlock.endMinute, hours, minutes)
        : { hours: 0, minutes: 0 };

    // Calcula progresso dentro do bloco atual
    const blockProgress = currentBlock
        ? calculateBlockProgress(currentBlock, hours, minutes)
        : 0;

    const CurrentIcon = currentBlock ? getIconByName(currentBlock.icon) : Timer;
    const NextIcon = nextBlock ? getIconByName(nextBlock.icon) : Timer;

    return (
        <>
            <Card className="col-span-full lg:col-span-2 lg:row-span-2 border-[rgba(204,174,112,0.2)]">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-[#9B9B9B] font-sans font-medium">Agora</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditorOpen(true)}
                                className="h-8 w-8 text-[#5A5A5A] hover:text-[#CCA870] hover:bg-[rgba(204,174,112,0.1)]"
                                aria-label="Editar rotina"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Badge variant="gold" className="font-mono">
                                {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}
                            </Badge>
                        </div>
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
                            <p>Nenhum bloco definido para este horário</p>
                            <Button
                                variant="ghost"
                                onClick={() => setEditorOpen(true)}
                                className="text-[#CCA870] mt-2 hover:bg-[rgba(204,174,112,0.1)]"
                            >
                                Configurar rotina
                            </Button>
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

            {/* Routine Editor Panel */}
            <RoutineEditorPanel
                open={editorOpen}
                onOpenChange={setEditorOpen}
            />
        </>
    );
}

/**
 * Formata o intervalo de tempo do bloco.
 */
function formatTimeRange(block: DBTimeBlock): string {
    const start = `${String(block.startHour).padStart(2, "0")}:${String(block.startMinute).padStart(2, "0")}`;
    const end = `${String(block.endHour).padStart(2, "0")}:${String(block.endMinute).padStart(2, "0")}`;
    return `${start} - ${end}`;
}

/**
 * Calcula o progresso dentro do bloco atual.
 */
function calculateBlockProgress(block: DBTimeBlock, currentHour: number, currentMinute: number): number {
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
