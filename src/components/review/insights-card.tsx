"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
    Lightbulb,
    TrendingUp,
    TrendingDown,
    Trophy,
    AlertTriangle,
    Sparkles
} from "lucide-react";
import { MonthlyReviewData, PILLAR_CONFIG, calculatePillarScore } from "@/lib/types/review";
import { cn } from "@/lib/utils";

interface InsightsCardProps {
    /** Dados da review atual */
    currentData: MonthlyReviewData;
    /** Dados da review anterior (opcional) */
    previousData: MonthlyReviewData | null;
}

interface Insight {
    type: 'positive' | 'warning' | 'neutral' | 'celebration';
    icon: React.ReactNode;
    message: string;
}

/**
 * Gera insights automáticos baseados nos dados da review.
 */
function generateInsights(
    current: MonthlyReviewData,
    previous: MonthlyReviewData | null
): Insight[] {
    const insights: Insight[] = [];

    // Calculate current scores
    const scores = PILLAR_CONFIG.map((config) => ({
        id: config.id,
        title: config.title,
        current: calculatePillarScore(current[config.id].metrics),
        previous: previous ? calculatePillarScore(previous[config.id].metrics) : null,
    }));

    // Sort by current score
    const sorted = [...scores].sort((a, b) => b.current - a.current);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Insight 1: Best pillar
    if (best.current >= 7) {
        insights.push({
            type: 'positive',
            icon: <Trophy className="h-4 w-4" />,
            message: `Seu ponto mais forte é **${best.title}** com nota ${best.current.toFixed(1)}. Continue assim!`,
        });
    } else {
        insights.push({
            type: 'neutral',
            icon: <Lightbulb className="h-4 w-4" />,
            message: `**${best.title}** é sua área mais desenvolvida (${best.current.toFixed(1)}). Há espaço para crescer!`,
        });
    }

    // Insight 2: Opportunity for improvement
    if (worst.current < 5) {
        insights.push({
            type: 'warning',
            icon: <AlertTriangle className="h-4 w-4" />,
            message: `**${worst.title}** precisa de atenção (${worst.current.toFixed(1)}). Defina uma ação concreta para este mês.`,
        });
    } else if (worst.current < best.current - 2) {
        insights.push({
            type: 'neutral',
            icon: <Lightbulb className="h-4 w-4" />,
            message: `Considere focar mais em **${worst.title}** para equilibrar sua vida.`,
        });
    }

    // Insight 3: Comparison with previous month
    if (previous) {
        const improvements = scores.filter(s => s.previous !== null && s.current > s.previous + 0.5);
        const declines = scores.filter(s => s.previous !== null && s.current < s.previous - 0.5);

        if (improvements.length > 0) {
            const bestImproved = improvements.sort((a, b) =>
                (b.current - (b.previous ?? 0)) - (a.current - (a.previous ?? 0))
            )[0];
            const change = bestImproved.current - (bestImproved.previous ?? 0);
            insights.push({
                type: 'celebration',
                icon: <TrendingUp className="h-4 w-4" />,
                message: `**${bestImproved.title}** melhorou ${change.toFixed(1)} pontos comparado ao mês passado! 🎉`,
            });
        }

        if (declines.length > 0) {
            const worstDeclined = declines.sort((a, b) =>
                (a.current - (a.previous ?? 0)) - (b.current - (b.previous ?? 0))
            )[0];
            const change = (worstDeclined.previous ?? 0) - worstDeclined.current;
            insights.push({
                type: 'warning',
                icon: <TrendingDown className="h-4 w-4" />,
                message: `**${worstDeclined.title}** caiu ${change.toFixed(1)} pontos. O que mudou?`,
            });
        }
    }

    // Insight 4: Overall balance
    const avgScore = scores.reduce((a, b) => a + b.current, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b.current - avgScore, 2), 0) / scores.length;

    if (variance < 1) {
        insights.push({
            type: 'positive',
            icon: <Sparkles className="h-4 w-4" />,
            message: `Sua vida está bem equilibrada! Variação baixa entre os pilares.`,
        });
    } else if (variance > 4) {
        insights.push({
            type: 'neutral',
            icon: <Lightbulb className="h-4 w-4" />,
            message: `Grande variação entre pilares. Busque mais equilíbrio para bem-estar completo.`,
        });
    }

    return insights.slice(0, 4); // Max 4 insights
}

const typeStyles = {
    positive: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-300",
        icon: "text-emerald-400",
    },
    warning: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-300",
        icon: "text-amber-400",
    },
    neutral: {
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
        text: "text-slate-300",
        icon: "text-slate-400",
    },
    celebration: {
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/30",
        text: "text-indigo-300",
        icon: "text-indigo-400",
    },
};

/**
 * InsightsCard - Card com insights automáticos baseados nos dados.
 */
export function InsightsCard({ currentData, previousData }: InsightsCardProps) {
    const insights = generateInsights(currentData, previousData);

    if (insights.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Insights
            </h3>

            <div className="space-y-2">
                {insights.map((insight, index) => {
                    const styles = typeStyles[insight.type];

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border",
                                styles.bg,
                                styles.border
                            )}
                        >
                            <div className={styles.icon}>
                                {insight.icon}
                            </div>
                            <p
                                className={cn("text-sm", styles.text)}
                                dangerouslySetInnerHTML={{
                                    __html: insight.message.replace(
                                        /\*\*(.*?)\*\*/g,
                                        '<strong>$1</strong>'
                                    ),
                                }}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
