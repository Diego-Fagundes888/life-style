"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Radar,
    ChevronRight,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar as RechartsRadar,
    ResponsiveContainer,
} from "recharts";
import {
    MonthlyReviewData,
    SavedMonthlyReview,
    PILLAR_CONFIG,
    calculatePillarScore,
    formatMonthName,
    getPreviousMonth,
} from "@/lib/types/review";
import { cn } from "@/lib/utils";

/**
 * ReviewWidget - Dark Academia Style
 *
 * Widget compacto de Reflexão Mensal com cores terrosas.
 */
export function ReviewWidget() {
    const [mounted, setMounted] = React.useState(false);
    const [currentData, setCurrentData] = React.useState<MonthlyReviewData | null>(null);
    const [previousData, setPreviousData] = React.useState<MonthlyReviewData | null>(null);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = getPreviousMonth(currentMonth, currentYear);

    // Load data from localStorage
    React.useEffect(() => {
        const loadData = (month: number, year: number): MonthlyReviewData | null => {
            const key = `life-sync-review-${year}-${month}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const parsed: SavedMonthlyReview = JSON.parse(saved);
                    return parsed.data;
                } catch {
                    return null;
                }
            }
            return null;
        };

        setCurrentData(loadData(currentMonth, currentYear));
        setPreviousData(loadData(prevMonth.month, prevMonth.year));
        setMounted(true);
    }, [currentMonth, currentYear, prevMonth.month, prevMonth.year]);

    // Calculate scores
    const scores = React.useMemo(() => {
        if (!currentData) return [];
        return PILLAR_CONFIG.map((pillar) => {
            const current = calculatePillarScore(currentData[pillar.id].metrics);
            const previous = previousData
                ? calculatePillarScore(previousData[pillar.id].metrics)
                : null;
            const change = previous !== null ? current - previous : null;
            return {
                id: pillar.id,
                title: pillar.title,
                shortTitle: pillar.title.substring(0, 3),
                color: pillar.color,
                current,
                previous,
                change,
            };
        });
    }, [currentData, previousData]);

    const radarData = scores.map((s) => ({
        pillar: s.shortTitle,
        value: s.current,
        fullMark: 10,
    }));

    const overallScore = scores.length > 0
        ? scores.reduce((acc, s) => acc + s.current, 0) / scores.length
        : 5;

    const bestPillar = scores.length > 0
        ? [...scores].sort((a, b) => b.current - a.current)[0]
        : null;

    const hasData = currentData !== null;
    const hasChanges = scores.some((s) => s.change !== null && Math.abs(s.change) > 0.5);

    if (!mounted) {
        return (
            <div className="lg:col-span-2 bg-[#202020] rounded-lg border border-[rgba(255,255,255,0.05)] p-6">
                <div className="animate-pulse h-[200px] flex items-center justify-center text-[#5A5A5A]">
                    Carregando...
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#202020] rounded-lg border border-[rgba(255,255,255,0.05)] p-6 hover:border-[rgba(118,140,158,0.3)] transition-colors"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[rgba(118,140,158,0.15)]">
                        <Radar className="h-5 w-5 text-[#768C9E]" />
                    </div>
                    <div>
                        <h2 className="font-serif font-medium text-[#E3E3E3]">
                            Reflexão Mensal
                        </h2>
                        <p className="text-xs text-[#9B9B9B]">
                            {formatMonthName(currentMonth, currentYear)}
                        </p>
                    </div>
                </div>

                <Link
                    href="/review"
                    className="flex items-center gap-1 text-sm text-[#768C9E] hover:text-[#8C9E78] transition-colors"
                >
                    {hasData ? "Continuar" : "Iniciar"}
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {hasData ? (
                <div className="grid grid-cols-2 gap-4">
                    {/* Mini Radar Chart */}
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={140}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="rgba(90, 90, 90, 0.3)" />
                                <PolarAngleAxis
                                    dataKey="pillar"
                                    tick={{ fill: "#5A5A5A", fontSize: 10 }}
                                />
                                <RechartsRadar
                                    name="Atual"
                                    dataKey="value"
                                    stroke="#CCAE70"
                                    fill="#CCAE70"
                                    fillOpacity={0.3}
                                    strokeWidth={2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                        {/* Overall Score */}
                        <div className="text-center p-3 bg-[#2C2C2C] rounded-lg">
                            <p className="text-xs text-[#9B9B9B] mb-1">Pontuação Geral</p>
                            <motion.span
                                key={overallScore}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                className="text-2xl font-bold text-[#CCAE70]"
                            >
                                {overallScore.toFixed(1)}
                            </motion.span>
                        </div>

                        {/* Best Pillar */}
                        {bestPillar && (
                            <div className="text-center p-2 bg-[rgba(140,158,120,0.1)] border border-[rgba(140,158,120,0.2)] rounded-lg">
                                <p className="text-xs text-[#8C9E78]">
                                    Destaque: <strong>{bestPillar.title}</strong>
                                </p>
                            </div>
                        )}

                        {/* Changes */}
                        {hasChanges && (
                            <div className="flex flex-wrap gap-1">
                                {scores.filter(s => s.change !== null && Math.abs(s.change) > 0.5).map((s) => (
                                    <div
                                        key={s.id}
                                        className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded text-xs",
                                            s.change! > 0
                                                ? "bg-[rgba(140,158,120,0.1)] text-[#8C9E78]"
                                                : "bg-[rgba(200,127,118,0.1)] text-[#C87F76]"
                                        )}
                                    >
                                        {s.change! > 0 ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3" />
                                        )}
                                        <span>{s.shortTitle}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgba(118,140,158,0.1)] flex items-center justify-center">
                        <Radar className="h-8 w-8 text-[#768C9E]/50" />
                    </div>
                    <p className="text-[#9B9B9B] mb-2">
                        Nenhuma reflexão este mês
                    </p>
                    <p className="text-xs text-[#5A5A5A] mb-4">
                        Avalie seus 5 pilares da vida e acompanhe sua evolução
                    </p>
                    <Link
                        href="/review"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#768C9E] hover:bg-[#8C9E78] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Iniciar Reflexão
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            )}
        </motion.div>
    );
}
