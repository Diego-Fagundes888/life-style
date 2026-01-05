"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lightbulb,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    PartyPopper,
    ChevronRight,
    X
} from "lucide-react";
import { type Insight, type InsightType } from "@/lib/insights-engine";
import { cn } from "@/lib/utils";

// ============================================================================
// INSIGHT CARD
// ============================================================================

const INSIGHT_CONFIG: Record<InsightType, {
    icon: typeof Lightbulb;
    bgClass: string;
    textClass: string;
    borderClass: string;
}> = {
    correlation: {
        icon: Lightbulb,
        bgClass: "bg-blue-500/10",
        textClass: "text-blue-400",
        borderClass: "border-blue-500/20",
    },
    trend: {
        icon: TrendingUp,
        bgClass: "bg-emerald-500/10",
        textClass: "text-emerald-400",
        borderClass: "border-emerald-500/20",
    },
    warning: {
        icon: AlertTriangle,
        bgClass: "bg-amber-500/10",
        textClass: "text-amber-400",
        borderClass: "border-amber-500/20",
    },
    celebration: {
        icon: PartyPopper,
        bgClass: "bg-purple-500/10",
        textClass: "text-purple-400",
        borderClass: "border-purple-500/20",
    },
    suggestion: {
        icon: Lightbulb,
        bgClass: "bg-cyan-500/10",
        textClass: "text-cyan-400",
        borderClass: "border-cyan-500/20",
    },
};

interface InsightCardProps {
    insight: Insight;
    onDismiss?: () => void;
    compact?: boolean;
}

export function InsightCard({ insight, onDismiss, compact = false }: InsightCardProps) {
    const config = INSIGHT_CONFIG[insight.type];
    const Icon = config.icon;

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border",
                    config.bgClass, config.borderClass
                )}
            >
                <div className={cn("p-2 rounded-lg", config.bgClass)}>
                    <span className="text-xl">{insight.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", config.textClass)}>
                        {insight.title}
                    </p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
                "relative p-4 rounded-xl border",
                config.bgClass, config.borderClass
            )}
        >
            {/* Dismiss button */}
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                    "p-2 rounded-xl",
                    config.bgClass
                )}>
                    <span className="text-2xl">{insight.icon}</span>
                </div>
                <div className="flex-1">
                    <h4 className={cn("font-semibold", config.textClass)}>
                        {insight.title}
                    </h4>
                    {insight.strength && (
                        <span className="text-xs text-zinc-500">
                            Correlação {insight.strength === 'strong' ? 'forte' :
                                insight.strength === 'moderate' ? 'moderada' : 'leve'}
                            {' '}({insight.confidence}%)
                        </span>
                    )}
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-400 mb-3">
                {insight.description}
            </p>

            {/* Actionable */}
            {insight.actionable && (
                <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg",
                    "bg-zinc-800/50 border border-zinc-700/50"
                )}>
                    <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-zinc-300">
                        {insight.actionable}
                    </p>
                </div>
            )}

            {/* Areas */}
            {insight.areas.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                    <span className="text-xs text-zinc-500">Áreas:</span>
                    {insight.areas.map(area => (
                        <span
                            key={area}
                            className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                        >
                            {area}
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// INSIGHTS WIDGET
// ============================================================================

interface InsightsWidgetProps {
    insights: Insight[];
    onViewAll?: () => void;
    maxDisplay?: number;
}

export function InsightsWidget({
    insights,
    onViewAll,
    maxDisplay = 3
}: InsightsWidgetProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const displayInsights = insights.slice(0, maxDisplay);

    // Auto-rotate insights
    useEffect(() => {
        if (displayInsights.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev =>
                (prev + 1) % displayInsights.length
            );
        }, 8000);

        return () => clearInterval(interval);
    }, [displayInsights.length]);

    if (displayInsights.length === 0) {
        return (
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="h-5 w-5 text-amber-400" />
                    <h3 className="font-medium text-white">Insights</h3>
                </div>
                <p className="text-sm text-zinc-500">
                    Continue usando o app para desbloquear insights personalizados sobre sua vida.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-400" />
                    <h3 className="font-medium text-white">Insights</h3>
                </div>
                {displayInsights.length > 1 && (
                    <div className="flex gap-1">
                        {displayInsights.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-colors",
                                    idx === currentIndex
                                        ? "bg-amber-400"
                                        : "bg-zinc-700 hover:bg-zinc-600"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    <InsightCard
                        key={displayInsights[currentIndex].id}
                        insight={displayInsights[currentIndex]}
                    />
                </AnimatePresence>
            </div>

            {/* Footer */}
            {onViewAll && insights.length > maxDisplay && (
                <button
                    onClick={onViewAll}
                    className={cn(
                        "w-full p-3 border-t border-zinc-800",
                        "text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50",
                        "transition-colors flex items-center justify-center gap-2"
                    )}
                >
                    Ver todos os insights ({insights.length})
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

// ============================================================================
// DAILY INSIGHT BANNER
// ============================================================================

interface DailyInsightBannerProps {
    insight: Insight;
    onDismiss?: () => void;
}

export function DailyInsightBanner({ insight, onDismiss }: DailyInsightBannerProps) {
    const config = INSIGHT_CONFIG[insight.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
                "relative flex items-center gap-4 p-4 rounded-xl border",
                config.bgClass, config.borderClass
            )}
        >
            <span className="text-3xl">{insight.icon}</span>

            <div className="flex-1">
                <h4 className={cn("font-medium", config.textClass)}>
                    {insight.title}
                </h4>
                <p className="text-sm text-zinc-400">
                    {insight.description}
                </p>
            </div>

            {insight.actionable && (
                <button className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-white/10 hover:bg-white/20 transition-colors",
                    config.textClass
                )}>
                    Agir
                </button>
            )}

            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </motion.div>
    );
}
