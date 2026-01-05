"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import { MonthlyReviewData, PILLAR_CONFIG, PillarId } from "@/lib/types/review";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
    /** Dados da review atual */
    reviewData: MonthlyReviewData;
    /** Pilar atualmente ativo */
    activePillar: PillarId;
    /** Callback para selecionar pilar */
    onSelectPillar: (pillar: PillarId) => void;
}

/**
 * Calcula o progresso de preenchimento de um pilar.
 */
function calculatePillarProgress(data: MonthlyReviewData, pillarId: PillarId): number {
    const pillar = data[pillarId];
    const config = PILLAR_CONFIG.find(p => p.id === pillarId);
    if (!config) return 0;

    // Count filled answers (non-empty strings)
    const totalAnswers = config.questions.length;
    const filledAnswers = Object.values(pillar.answers).filter(a => a.trim().length > 0).length;

    // Metrics count as always filled if touched (slider interaction)
    // For simplicity, we consider answers as the main indicator
    return totalAnswers > 0 ? (filledAnswers / totalAnswers) * 100 : 100;
}

/**
 * Calcula o progresso total da review.
 */
function calculateTotalProgress(data: MonthlyReviewData): number {
    const pillarIds: PillarId[] = ['body', 'mind', 'spirit', 'money', 'social'];
    const progresses = pillarIds.map(id => calculatePillarProgress(data, id));
    return progresses.reduce((a, b) => a + b, 0) / progresses.length;
}

/**
 * ProgressIndicator - Barra de progresso da reflexão.
 */
export function ProgressIndicator({
    reviewData,
    activePillar,
    onSelectPillar,
}: ProgressIndicatorProps) {
    const totalProgress = calculateTotalProgress(reviewData);
    const isComplete = totalProgress >= 100;

    return (
        <div className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Progresso da Reflexão</span>
                    <span className={cn(
                        "font-bold tabular-nums",
                        isComplete ? "text-emerald-400" : "text-indigo-400"
                    )}>
                        {Math.round(totalProgress)}%
                    </span>
                </div>

                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className={cn(
                            "h-full rounded-full",
                            isComplete ? "bg-emerald-500" : "bg-indigo-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${totalProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Pillar Status */}
            <div className="flex items-center justify-between gap-1">
                {PILLAR_CONFIG.map((config) => {
                    const progress = calculatePillarProgress(reviewData, config.id);
                    const isComplete = progress >= 100;
                    const isActive = activePillar === config.id;

                    return (
                        <button
                            key={config.id}
                            onClick={() => onSelectPillar(config.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg transition-colors",
                                isActive
                                    ? "bg-slate-800"
                                    : "hover:bg-slate-800/50"
                            )}
                            title={`${config.title}: ${Math.round(progress)}%`}
                        >
                            {isComplete ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <Circle className={cn(
                                    "h-4 w-4",
                                    progress > 0 ? "text-amber-400" : "text-slate-600"
                                )} />
                            )}
                            <span className={cn(
                                "text-xs font-medium hidden sm:inline",
                                isActive ? "text-slate-200" : "text-slate-500"
                            )}>
                                {config.title.substring(0, 3)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Hook para verificar se a review está completa.
 */
export function useReviewProgress(reviewData: MonthlyReviewData) {
    const totalProgress = calculateTotalProgress(reviewData);
    const isComplete = totalProgress >= 100;

    const pillarProgresses = PILLAR_CONFIG.reduce((acc, config) => {
        acc[config.id] = calculatePillarProgress(reviewData, config.id);
        return acc;
    }, {} as Record<PillarId, number>);

    return {
        totalProgress,
        isComplete,
        pillarProgresses,
    };
}
