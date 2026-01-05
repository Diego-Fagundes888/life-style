"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronRight,
    Target,
    Sparkles
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import {
    calculateLifeScore,
    calculateTrend,
    getScoreMessage,
    AREA_CONFIG,
    type LifeAreaId,
    type LifeScoreEntry,
} from "@/lib/types/life-score";
import { getStoredData, STORAGE_KEYS } from "@/lib/store";
import { cn } from "@/lib/utils";

// ============================================================================
// ANIMATED SCORE COMPONENT
// ============================================================================

function AnimatedScore({ value, size = "large" }: { value: number; size?: "large" | "small" }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1500;
        const startTime = Date.now();
        const startValue = displayValue;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (value - startValue) * eased;

            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <span className={cn(
            "font-bold tabular-nums",
            size === "large" ? "text-7xl" : "text-2xl"
        )}>
            {displayValue.toFixed(1)}
        </span>
    );
}

// ============================================================================
// MINI AREA PROGRESS
// ============================================================================

function AreaProgress({
    areaId,
    score
}: {
    areaId: LifeAreaId;
    score: number;
}) {
    const config = AREA_CONFIG[areaId];
    const percentage = (score / 10) * 100;

    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm",
                config.bgClass
            )}>
                {config.emoji}
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400">{config.title}</span>
                    <span className={cn("text-xs font-medium", config.textClass)}>
                        {score.toFixed(1)}
                    </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: config.color }}
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// TREND BADGE
// ============================================================================

function TrendBadge({
    trend,
    delta
}: {
    trend: 'up' | 'down' | 'stable';
    delta: number;
}) {
    const config = {
        up: {
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/20',
            label: `+${delta.toFixed(1)}`
        },
        down: {
            icon: TrendingDown,
            color: 'text-red-400',
            bg: 'bg-red-500/20',
            label: delta.toFixed(1)
        },
        stable: {
            icon: Minus,
            color: 'text-zinc-400',
            bg: 'bg-zinc-500/20',
            label: '0.0'
        },
    }[trend];

    const Icon = config.icon;

    return (
        <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            config.bg, config.color
        )}>
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface LifeScoreCardProps {
    className?: string;
    onNavigate?: () => void;
}

export function LifeScoreCard({ className, onNavigate }: LifeScoreCardProps) {
    const [history, setHistory] = useState<LifeScoreEntry[]>([]);
    const [areaScores, setAreaScores] = useState<Record<LifeAreaId, number>>({
        body: 5,
        mind: 5,
        spirit: 5,
        money: 5,
        social: 5,
    });

    // Carregar dados do localStorage
    useEffect(() => {
        const storedHistory = getStoredData<LifeScoreEntry[]>(STORAGE_KEYS.LIFE_SCORE_HISTORY);
        if (storedHistory) {
            setHistory(storedHistory);
        }

        // TODO: Buscar scores reais de cada área
        // Por enquanto usa valores mock que serão integrados depois
    }, []);

    // Calcular score e tendência
    const globalScore = useMemo(() =>
        calculateLifeScore(areaScores),
        [areaScores]
    );

    const trend = useMemo(() => {
        if (history.length < 2) {
            return { current: globalScore, previous: globalScore, delta: 0, deltaPercent: 0, trend: 'stable' as const, message: 'Primeiro mês de tracking' };
        }
        const sorted = [...history].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return calculateTrend(globalScore, sorted[1]?.globalScore || globalScore);
    }, [globalScore, history]);

    const scoreMessage = useMemo(() => getScoreMessage(globalScore), [globalScore]);

    // Dados para o gráfico
    const chartData = useMemo(() => {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        if (history.length === 0) {
            // Dados mock para demonstração
            const now = new Date();
            return Array.from({ length: 6 }, (_, i) => {
                const monthIndex = (now.getMonth() - 5 + i + 12) % 12;
                return {
                    name: monthNames[monthIndex],
                    score: 5 + Math.random() * 3,
                };
            });
        }

        return history
            .slice(-6)
            .map(entry => ({
                name: monthNames[entry.month],
                score: entry.globalScore,
            }));
    }, [history]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800",
                "border border-zinc-800",
                className
            )}
        >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-emerald-500/5" />

            {/* Content */}
            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                        <h3 className="text-lg font-semibold text-white">Life Score</h3>
                    </div>
                    <TrendBadge trend={trend.trend} delta={trend.delta} />
                </div>

                {/* Main Score */}
                <div className="flex items-center gap-6 mb-6">
                    <div className="flex-shrink-0">
                        <div className="relative">
                            {/* Circular progress background */}
                            <svg className="w-32 h-32 -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-zinc-800"
                                />
                                <motion.circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="url(#scoreGradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: "0 352" }}
                                    animate={{
                                        strokeDasharray: `${(globalScore / 10) * 352} 352`
                                    }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#22c55e" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Score number */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <AnimatedScore value={globalScore} />
                                <span className="text-xs text-zinc-500">/10</span>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="flex-1">
                        <p className={cn("text-2xl mb-1", scoreMessage.color)}>
                            {scoreMessage.emoji}
                        </p>
                        <p className="text-sm text-zinc-300 mb-2">
                            {scoreMessage.message}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {trend.message}
                        </p>
                    </div>
                </div>

                {/* Mini Chart */}
                <div className="h-24 mb-6 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#71717a' }}
                            />
                            <YAxis
                                domain={[0, 10]}
                                hide
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: '1px solid #27272a',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                                labelStyle={{ color: '#a1a1aa' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="url(#chartGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Area Breakdown */}
                <div className="space-y-3">
                    {(Object.keys(AREA_CONFIG) as LifeAreaId[]).map((areaId) => (
                        <AreaProgress
                            key={areaId}
                            areaId={areaId}
                            score={areaScores[areaId] || 5}
                        />
                    ))}
                </div>

                {/* Footer */}
                {onNavigate && (
                    <button
                        onClick={onNavigate}
                        className={cn(
                            "w-full mt-6 py-3 rounded-xl",
                            "flex items-center justify-center gap-2",
                            "bg-zinc-800 hover:bg-zinc-700 transition-colors",
                            "text-sm text-zinc-300"
                        )}
                    >
                        <Target className="h-4 w-4" />
                        Ver detalhes
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
