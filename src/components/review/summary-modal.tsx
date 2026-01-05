"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, TrendingUp, TrendingDown, Minus, Award, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LifeRadarChart } from "./radar-chart";
import { PILLAR_CONFIG, MonthlyReviewData, calculatePillarScore, formatMonthName } from "@/lib/types/review";
import { cn } from "@/lib/utils";

interface SummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentData: MonthlyReviewData;
    previousData: MonthlyReviewData | null;
    month: number;
    year: number;
}

/**
 * SummaryModal - Modal de resumo visual após encerrar o mês.
 */
export function SummaryModal({
    isOpen,
    onClose,
    currentData,
    previousData,
    month,
    year,
}: SummaryModalProps) {
    // Calculate scores
    const scores = PILLAR_CONFIG.map((pillar) => {
        const current = calculatePillarScore(currentData[pillar.id].metrics);
        const previous = previousData
            ? calculatePillarScore(previousData[pillar.id].metrics)
            : null;
        const change = previous !== null ? current - previous : null;

        return {
            id: pillar.id,
            title: pillar.title,
            color: pillar.color,
            current,
            previous,
            change,
        };
    });

    const overallScore = scores.reduce((acc, s) => acc + s.current, 0) / scores.length;
    const previousOverall = previousData
        ? scores.reduce((acc, s) => acc + (s.previous ?? 0), 0) / scores.length
        : null;
    const overallChange = previousOverall !== null ? overallScore - previousOverall : null;

    // Find best and worst pillars
    const sortedScores = [...scores].sort((a, b) => b.current - a.current);
    const bestPillar = sortedScores[0];
    const worstPillar = sortedScores[sortedScores.length - 1];

    // Radar data
    const radarData = scores.map((s) => ({
        pillar: s.title,
        current: s.current,
        previous: s.previous ?? 0,
        fullMark: 10,
    }));

    const getChangeIcon = (change: number | null) => {
        if (change === null) return null;
        if (change > 0.5) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
        if (change < -0.5) return <TrendingDown className="h-4 w-4 text-rose-400" />;
        return <Minus className="h-4 w-4 text-slate-400" />;
    };

    const getChangeColor = (change: number | null) => {
        if (change === null) return "text-slate-400";
        if (change > 0.5) return "text-emerald-400";
        if (change < -0.5) return "text-rose-400";
        return "text-slate-400";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        {/* Header */}
                        <div className="relative p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 text-slate-400"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-indigo-500/20">
                                    <Award className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-100">
                                        Reflexão Concluída! 🎉
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        {formatMonthName(month, year)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Radar Chart */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                                        Visão Geral
                                    </h3>
                                    <LifeRadarChart
                                        data={radarData}
                                        showPrevious={!!previousData}
                                        height={250}
                                    />

                                    {/* Overall Score */}
                                    <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                                        <p className="text-sm text-slate-400 mb-1">Pontuação Geral</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-4xl font-bold text-indigo-400">
                                                {overallScore.toFixed(1)}
                                            </span>
                                            {overallChange !== null && (
                                                <span className={cn("text-sm font-medium", getChangeColor(overallChange))}>
                                                    {overallChange > 0 ? "+" : ""}{overallChange.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Pillar Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                                        Por Categoria
                                    </h3>

                                    <div className="space-y-2">
                                        {scores.map((score) => (
                                            <div
                                                key={score.id}
                                                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                            >
                                                <span className="text-slate-200 font-medium">
                                                    {score.title}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-slate-100 tabular-nums">
                                                        {score.current.toFixed(1)}
                                                    </span>
                                                    {score.change !== null && (
                                                        <div className="flex items-center gap-1">
                                                            {getChangeIcon(score.change)}
                                                            <span className={cn("text-sm tabular-nums", getChangeColor(score.change))}>
                                                                {score.change > 0 ? "+" : ""}{score.change.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Insights */}
                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                            <Target className="h-4 w-4 text-emerald-400" />
                                            <span className="text-sm text-emerald-300">
                                                Ponto forte: <strong>{bestPillar.title}</strong> ({bestPillar.current.toFixed(1)})
                                            </span>
                                        </div>
                                        {worstPillar.current < bestPillar.current && (
                                            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                <TrendingUp className="h-4 w-4 text-amber-400" />
                                                <span className="text-sm text-amber-300">
                                                    Oportunidade: <strong>{worstPillar.title}</strong> ({worstPillar.current.toFixed(1)})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                            <Button variant="ghost" onClick={onClose}>
                                Fechar
                            </Button>
                            <Button className="gap-2">
                                <Download className="h-4 w-4" />
                                Exportar Resumo
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
