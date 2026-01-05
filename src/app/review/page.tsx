"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft,
    Dumbbell,
    Brain,
    Flame,
    DollarSign,
    Users,
    Check,
    Share2,
    RotateCcw,
    MoreVertical,
    LucideIcon,
    Award,
    Zap,
    Star,
    TrendingUp,
    Scale,
    Sparkles,
    Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { LifeRadarChart, RadarLegend } from "@/components/review/radar-chart";
import { MirrorMode } from "@/components/review/mirror-mode";
import { MonthSelector } from "@/components/review/month-selector";
import { SummaryModal } from "@/components/review/summary-modal";
import { ProgressIndicator } from "@/components/review/progress-indicator";
import { InsightsCard } from "@/components/review/insights-card";
import { ConfirmationModal } from "@/components/goals/confirmation-modal";
import { FloatingDock } from "@/components/dashboard/FloatingDock";
import {
    PillarId,
    MonthlyReviewData,
    SavedMonthlyReview,
    PILLAR_CONFIG,
    calculatePillarScore,
    createEmptyReviewData,
    formatMonthName,
    getPreviousMonth,
} from "@/lib/types/review";
import { cn } from "@/lib/utils";

// ============================================================================
// REVIEW STREAK SYSTEM
// ============================================================================

interface ReviewStreak {
    count: number;
    level: string;
    icon: string;
    color: string;
}

function calculateReviewStreak(selectedMonth: number, selectedYear: number): ReviewStreak {
    // SSR guard - return default during server-side rendering
    if (typeof window === "undefined") {
        return { count: 0, level: "Começando", icon: "✨", color: "#5A5A5A" };
    }

    let streak = 0;
    let month = selectedMonth;
    let year = selectedYear;

    // Check backwards for consecutive months with reviews
    for (let i = 0; i < 24; i++) {
        const key = `life-sync-review-${year}-${month}`;
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Check if review has meaningful data
                const hasData = PILLAR_CONFIG.some(pillar => {
                    const pillarData = parsed.data?.[pillar.id];
                    return pillarData && Object.values(pillarData.metrics || {}).some((v: unknown) => (v as number) !== 5);
                });
                if (hasData) {
                    streak++;
                } else {
                    break;
                }
            } catch {
                break;
            }
        } else {
            break;
        }

        // Go to previous month
        month--;
        if (month < 0) {
            month = 11;
            year--;
        }
    }

    if (streak >= 12) return { count: streak, level: "Mestre", icon: "👑", color: "#CCAE70" };
    if (streak >= 6) return { count: streak, level: "Dedicado", icon: "🔥", color: "#D99E6B" };
    if (streak >= 3) return { count: streak, level: "Consistente", icon: "⚡", color: "#768C9E" };
    if (streak >= 1) return { count: streak, level: "Iniciante", icon: "🌱", color: "#8C9E78" };
    return { count: 0, level: "Começando", icon: "✨", color: "#5A5A5A" };
}

// ============================================================================
// BALANCE SCORE CALCULATION
// ============================================================================

function calculateBalanceScore(reviewData: MonthlyReviewData): number {
    const scores = PILLAR_CONFIG.map(pillar => calculatePillarScore(reviewData[pillar.id].metrics));
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate standard deviation (lower = more balanced)
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Balance score: high average + low deviation = high score
    const balanceBonus = Math.max(0, 10 - stdDev * 2); // 0-10 bonus for balance
    const rawScore = (average * 8) + (balanceBonus * 2); // Weight: 80% average, 20% balance

    return Math.min(100, Math.round(rawScore));
}

// ============================================================================
// ACHIEVEMENT BADGES
// ============================================================================

interface ReviewAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    condition: (data: MonthlyReviewData, streak: number, balanceScore: number) => boolean;
}

const REVIEW_ACHIEVEMENTS: ReviewAchievement[] = [
    {
        id: "first_review",
        name: "Primeira Reflexão",
        description: "Complete sua primeira review",
        icon: "🌟",
        color: "#CCAE70",
        condition: (_, streak) => streak >= 1,
    },
    {
        id: "perfectionist",
        name: "Perfeccionista",
        description: "Média de todos pilares ≥ 8",
        icon: "🎯",
        color: "#8C9E78",
        condition: (data) => {
            const avg = PILLAR_CONFIG.reduce((sum, p) => sum + calculatePillarScore(data[p.id].metrics), 0) / PILLAR_CONFIG.length;
            return avg >= 8;
        },
    },
    {
        id: "balanced",
        name: "Equilibrado",
        description: "Todos pilares acima de 5",
        icon: "⚖️",
        color: "#768C9E",
        condition: (data) => PILLAR_CONFIG.every(p => calculatePillarScore(data[p.id].metrics) >= 5),
    },
    {
        id: "consistent",
        name: "Consistente",
        description: "3+ meses consecutivos",
        icon: "🔥",
        color: "#D99E6B",
        condition: (_, streak) => streak >= 3,
    },
    {
        id: "master",
        name: "Mestre da Reflexão",
        description: "12 meses consecutivos",
        icon: "👑",
        color: "#CCAE70",
        condition: (_, streak) => streak >= 12,
    },
    {
        id: "high_balance",
        name: "Vida Plena",
        description: "Balance Score ≥ 80",
        icon: "💎",
        color: "#C87F76",
        condition: (_, __, balanceScore) => balanceScore >= 80,
    },
];

// ============================================================================
// ÍCONES
// ============================================================================

const iconMap: Record<string, LucideIcon> = {
    Dumbbell,
    Brain,
    Flame,
    DollarSign,
    Users,
};

// ============================================================================
// CORES
// ============================================================================

const colorClasses: Record<string, {
    bg: string;
    text: string;
    border: string;
    active: string;
    inactive: string;
}> = {
    rose: {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/30",
        active: "bg-rose-500/20 border-rose-500 text-rose-300",
        inactive: "text-rose-400/50",
    },
    blue: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
        active: "bg-blue-500/20 border-blue-500 text-blue-300",
        inactive: "text-blue-400/50",
    },
    amber: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        active: "bg-amber-500/20 border-amber-500 text-amber-300",
        inactive: "text-amber-400/50",
    },
    emerald: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        active: "bg-emerald-500/20 border-emerald-500 text-emerald-300",
        inactive: "text-emerald-400/50",
    },
    violet: {
        bg: "bg-violet-500/10",
        text: "text-violet-400",
        border: "border-violet-500/30",
        active: "bg-violet-500/20 border-violet-500 text-violet-300",
        inactive: "text-violet-400/50",
    },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function MonthlyReviewPage() {
    // ========== DATE STATE ==========
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
    const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
    const prevMonth = getPreviousMonth(selectedMonth, selectedYear);

    // ========== DATA STATE ==========
    const [reviewData, setReviewData] = React.useState<MonthlyReviewData>(
        createEmptyReviewData()
    );
    const [previousReview, setPreviousReview] = React.useState<MonthlyReviewData | null>(null);
    const [activePillar, setActivePillar] = React.useState<PillarId>("body");
    const [mounted, setMounted] = React.useState(false);

    // ========== UI STATE ==========
    const [isSaving, setIsSaving] = React.useState(false);
    const [showSummary, setShowSummary] = React.useState(false);
    const [showResetConfirm, setShowResetConfirm] = React.useState(false);
    const [showMenu, setShowMenu] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // ========== PERSISTENCE ==========

    const loadReviewData = React.useCallback((month: number, year: number) => {
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
    }, []);

    // Load data when month changes
    React.useEffect(() => {
        const currentData = loadReviewData(selectedMonth, selectedYear);
        setReviewData(currentData ?? createEmptyReviewData());

        const prevData = loadReviewData(prevMonth.month, prevMonth.year);
        setPreviousReview(prevData);

        setMounted(true);
    }, [selectedMonth, selectedYear, prevMonth.month, prevMonth.year, loadReviewData]);

    // Auto-save
    React.useEffect(() => {
        if (mounted) {
            const review: SavedMonthlyReview = {
                id: `${selectedYear}-${selectedMonth}`,
                month: selectedMonth,
                year: selectedYear,
                data: reviewData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(
                `life-sync-review-${selectedYear}-${selectedMonth}`,
                JSON.stringify(review)
            );
        }
    }, [reviewData, mounted, selectedMonth, selectedYear]);

    // Close menu on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ========== HANDLERS ==========

    const handleMonthChange = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
    };

    const handleMetricChange = (pillarId: PillarId, metricId: string, value: number) => {
        setReviewData((prev) => ({
            ...prev,
            [pillarId]: {
                ...prev[pillarId],
                metrics: {
                    ...prev[pillarId].metrics,
                    [metricId]: value,
                },
            },
        }));
    };

    const handleAnswerChange = (pillarId: PillarId, questionId: string, value: string) => {
        setReviewData((prev) => ({
            ...prev,
            [pillarId]: {
                ...prev[pillarId],
                answers: {
                    ...prev[pillarId].answers,
                    [questionId]: value,
                },
            },
        }));
    };

    const handleFinalize = async () => {
        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        setShowSummary(true);
    };

    const handleReset = () => {
        setReviewData(createEmptyReviewData());
        setShowResetConfirm(false);
    };

    // ========== CALCULATIONS ==========

    const radarData = PILLAR_CONFIG.map((pillar) => ({
        pillar: pillar.title,
        current: calculatePillarScore(reviewData[pillar.id].metrics),
        previous: previousReview
            ? calculatePillarScore(previousReview[pillar.id].metrics)
            : 0,
        fullMark: 10,
    }));

    const activeConfig = PILLAR_CONFIG.find((p) => p.id === activePillar)!;
    const activeColors = colorClasses[activeConfig.color];

    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

    // Gamification calculations
    const reviewStreak = React.useMemo(
        () => calculateReviewStreak(selectedMonth, selectedYear),
        [selectedMonth, selectedYear, mounted]
    );
    const balanceScore = React.useMemo(
        () => calculateBalanceScore(reviewData),
        [reviewData]
    );
    const unlockedAchievements = React.useMemo(
        () => REVIEW_ACHIEVEMENTS.filter(a => a.condition(reviewData, reviewStreak.count, balanceScore)),
        [reviewData, reviewStreak.count, balanceScore]
    );
    const lockedAchievements = React.useMemo(
        () => REVIEW_ACHIEVEMENTS.filter(a => !a.condition(reviewData, reviewStreak.count, balanceScore)),
        [reviewData, reviewStreak.count, balanceScore]
    );

    // Celebration state
    const [showCelebration, setShowCelebration] = React.useState(false);

    // Average score
    const averageScore = React.useMemo(() => {
        const scores = PILLAR_CONFIG.map(p => calculatePillarScore(reviewData[p.id].metrics));
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }, [reviewData]);

    // Comparison with previous month
    const improvement = React.useMemo(() => {
        if (!previousReview) return null;
        const prevAvg = PILLAR_CONFIG.reduce((sum, p) => sum + calculatePillarScore(previousReview[p.id].metrics), 0) / PILLAR_CONFIG.length;
        const diff = averageScore - prevAvg;
        return { value: Math.abs(diff).toFixed(1), positive: diff >= 0 };
    }, [previousReview, averageScore]);

    // ========== RENDER ==========

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-32">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">Voltar</span>
                        </Link>

                        <h1 className="text-2xl font-bold text-slate-100">
                            Reflexão Mensal
                        </h1>
                    </div>

                    {/* Month Selector + Actions */}
                    <div className="flex items-center gap-3">
                        <MonthSelector
                            month={selectedMonth}
                            year={selectedYear}
                            onChange={handleMonthChange}
                            hasData={!!loadReviewData(selectedMonth, selectedYear)}
                        />

                        {/* Actions Menu */}
                        <div className="relative" ref={menuRef}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowMenu(!showMenu)}
                            >
                                <MoreVertical className="h-5 w-5" />
                            </Button>

                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1"
                                >
                                    <button
                                        onClick={() => {
                                            setShowResetConfirm(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Limpar Respostas
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Progress Indicator */}
                <div className="mb-6">
                    <ProgressIndicator
                        reviewData={reviewData}
                        activePillar={activePillar}
                        onSelectPillar={setActivePillar}
                    />
                </div>

                {/* ========== QUICK STATS HERO ========== */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Balance Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm"
                    >
                        <div className="w-10 h-10 mx-auto mb-2 bg-amber-500/15 rounded-lg flex items-center justify-center">
                            <Scale className="w-5 h-5 text-amber-400" />
                        </div>
                        <motion.p
                            className="text-2xl font-bold text-amber-400"
                            key={balanceScore}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                        >
                            {balanceScore}
                        </motion.p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Balance Score</p>
                    </motion.div>

                    {/* Review Streak */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm"
                    >
                        <div className="w-10 h-10 mx-auto mb-2 bg-orange-500/15 rounded-lg flex items-center justify-center">
                            <motion.span
                                className="text-xl"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {reviewStreak.icon}
                            </motion.span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: reviewStreak.color }}>
                            {reviewStreak.count}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{reviewStreak.level}</p>
                    </motion.div>

                    {/* Average Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm"
                    >
                        <div className="w-10 h-10 mx-auto mb-2 bg-blue-500/15 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-blue-400" />
                        </div>
                        <motion.p
                            className="text-2xl font-bold text-blue-400"
                            key={averageScore}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                        >
                            {averageScore.toFixed(1)}
                        </motion.p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Média Geral</p>
                    </motion.div>

                    {/* Improvement */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-4 text-center backdrop-blur-sm"
                    >
                        <div className="w-10 h-10 mx-auto mb-2 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className={cn(
                            "text-2xl font-bold",
                            improvement?.positive ? "text-emerald-400" : improvement ? "text-rose-400" : "text-slate-500"
                        )}>
                            {improvement ? `${improvement.positive ? '+' : '-'}${improvement.value}` : "—"}
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">vs Mês Anterior</p>
                    </motion.div>
                </section>

                {/* ========== ACHIEVEMENT BADGES ========== */}
                <section className="mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="w-5 h-5 text-amber-400" />
                            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Conquistas</h3>
                            <span className="ml-auto text-xs text-slate-500">{unlockedAchievements.length}/{REVIEW_ACHIEVEMENTS.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {/* Unlocked */}
                            {unlockedAchievements.map((achievement, index) => (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    className="relative group"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                                        style={{ backgroundColor: `${achievement.color}20`, border: `1px solid ${achievement.color}40` }}
                                    >
                                        {achievement.icon}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        <p className="font-semibold">{achievement.name}</p>
                                        <p className="text-slate-400">{achievement.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {/* Locked */}
                            {lockedAchievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className="relative group"
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-800/50 border border-slate-700/50 opacity-40 grayscale">
                                        {achievement.icon}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        <p className="font-semibold">{achievement.name}</p>
                                        <p>{achievement.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* Main Layout: Sidebar + Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ========== SIDEBAR (1/3) ========== */}
                    <div className="space-y-6">
                        {/* Radar Chart Card */}
                        <Card className="p-6">
                            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                                Visão Geral
                            </h2>
                            <LifeRadarChart
                                data={radarData}
                                showPrevious={!!previousReview}
                                height={280}
                            />
                            <RadarLegend />
                        </Card>

                        {/* Insights Card */}
                        <Card className="p-6">
                            <InsightsCard
                                currentData={reviewData}
                                previousData={previousReview}
                            />
                        </Card>

                        {/* Pillar Navigation */}
                        <Card className="p-4">
                            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 px-2">
                                Categorias
                            </h2>
                            <div className="space-y-2">
                                {PILLAR_CONFIG.map((pillar) => {
                                    const Icon = iconMap[pillar.icon];
                                    const colors = colorClasses[pillar.color];
                                    const isActive = activePillar === pillar.id;
                                    const score = calculatePillarScore(
                                        reviewData[pillar.id].metrics
                                    );

                                    return (
                                        <button
                                            key={pillar.id}
                                            onClick={() => setActivePillar(pillar.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
                                                "border-2 transition-all duration-200",
                                                "hover:bg-slate-800/50",
                                                isActive
                                                    ? colors.active
                                                    : "border-transparent text-slate-400"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "p-2 rounded-lg",
                                                    colors.bg
                                                )}
                                            >
                                                <Icon
                                                    className={cn(
                                                        "h-4 w-4",
                                                        isActive ? colors.text : colors.inactive
                                                    )}
                                                />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span
                                                    className={cn(
                                                        "font-medium",
                                                        isActive ? "" : "text-slate-300"
                                                    )}
                                                >
                                                    {pillar.title}
                                                </span>
                                            </div>
                                            <span
                                                className={cn(
                                                    "text-sm font-bold tabular-nums",
                                                    isActive ? colors.text : "text-slate-500"
                                                )}
                                            >
                                                {score.toFixed(1)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Finalize Button */}
                        <Button
                            onClick={handleFinalize}
                            disabled={isSaving || !isCurrentMonth}
                            className="w-full gap-2"
                            size="lg"
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Share2 className="h-4 w-4" />
                                    Encerrar Mês
                                </>
                            )}
                        </Button>

                        {!isCurrentMonth && (
                            <p className="text-xs text-center text-slate-500">
                                Visualizando mês anterior (somente leitura)
                            </p>
                        )}
                    </div>

                    {/* ========== CONTENT AREA (2/3) ========== */}
                    <div className="lg:col-span-2 space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activePillar}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                {/* PART A: Metrics */}
                                <Card className="p-6">
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold text-slate-100">
                                            {activeConfig.title}
                                        </h2>
                                        <p className="text-sm text-slate-400">
                                            {activeConfig.subtitle}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {activeConfig.metrics.map((metric) => (
                                            <Slider
                                                key={metric.id}
                                                label={metric.label}
                                                value={
                                                    reviewData[activePillar].metrics[
                                                    metric.id
                                                    ] ?? 5
                                                }
                                                onChange={(value) =>
                                                    handleMetricChange(
                                                        activePillar,
                                                        metric.id,
                                                        value
                                                    )
                                                }
                                                color={activeConfig.color as "rose" | "blue" | "amber" | "emerald" | "violet"}
                                                disabled={!isCurrentMonth}
                                            />
                                        ))}
                                    </div>

                                    {/* Average Score Display */}
                                    <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                                        <span className="text-slate-400">
                                            Pontuação Média
                                        </span>
                                        <motion.span
                                            key={calculatePillarScore(
                                                reviewData[activePillar].metrics
                                            )}
                                            initial={{ scale: 1.2 }}
                                            animate={{ scale: 1 }}
                                            className={cn(
                                                "text-2xl font-bold",
                                                activeColors.text
                                            )}
                                        >
                                            {calculatePillarScore(
                                                reviewData[activePillar].metrics
                                            ).toFixed(1)}
                                        </motion.span>
                                    </div>
                                </Card>

                                {/* PART B: Mirror Mode */}
                                <Card className="p-6">
                                    <MirrorMode
                                        previousMonthLabel={formatMonthName(
                                            prevMonth.month,
                                            prevMonth.year
                                        )}
                                        currentMonthLabel={formatMonthName(
                                            selectedMonth,
                                            selectedYear
                                        )}
                                        questions={activeConfig.questions}
                                        previousAnswers={
                                            previousReview?.[activePillar]?.answers ?? {}
                                        }
                                        currentAnswers={reviewData[activePillar].answers}
                                        onAnswerChange={(questionId, value) =>
                                            handleAnswerChange(activePillar, questionId, value)
                                        }
                                        color={activeConfig.color as "rose" | "blue" | "amber" | "emerald" | "violet"}
                                    />
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center py-8 mt-8">
                    <p className="text-xs text-slate-600">
                        Life Sync © {now.getFullYear()} — Seu Sistema Operacional Pessoal
                    </p>
                </footer>
            </div>

            {/* ========== MODALS ========== */}

            {/* Summary Modal */}
            <SummaryModal
                isOpen={showSummary}
                onClose={() => setShowSummary(false)}
                currentData={reviewData}
                previousData={previousReview}
                month={selectedMonth}
                year={selectedYear}
            />

            {/* Reset Confirmation */}
            <ConfirmationModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleReset}
                title="Limpar Respostas"
                message="Tem certeza que deseja limpar todas as respostas deste mês? Esta ação não pode ser desfeita."
                confirmLabel="Limpar Tudo"
                variant="danger"
            />

            {/* FloatingDock */}
            <FloatingDock />
        </div>
    );
}
