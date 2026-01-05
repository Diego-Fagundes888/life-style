"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Plus, Target, TrendingUp, CheckCircle2, Sparkles, Calendar, Award, Lightbulb } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalModal } from "@/components/goals/goal-modal";
import { CategoryModal } from "@/components/goals/category-modal";
import { ConfirmationModal } from "@/components/goals/confirmation-modal";
import { FloatingDock } from "@/components/dashboard/FloatingDock";
import { db, type DBGoal, type DBGoalCategory, type DBUserProfile } from "@/lib/db";
import {
    GoalCategory,
    Goal,
    CategoryColor,
    calculateGlobalProgress,
} from "@/lib/types/goals";

// ============================================================================
// ACHIEVEMENT BADGES SYSTEM
// ============================================================================

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    condition: (stats: GoalStats) => boolean;
}

interface GoalStats {
    totalGoals: number;
    completedGoals: number;
    globalProgress: number;
    categories: number;
    streak: number;
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: "first_step",
        name: "Primeiro Passo",
        description: "Complete sua primeira meta",
        icon: "🌟",
        color: "#CCAE70",
        condition: (stats) => stats.completedGoals >= 1,
    },
    {
        id: "goal_setter",
        name: "Definidor de Metas",
        description: "Tenha 5+ metas ativas",
        icon: "🎯",
        color: "#768C9E",
        condition: (stats) => stats.totalGoals >= 5,
    },
    {
        id: "halfway",
        name: "Metade do Caminho",
        description: "Alcance 50% de progresso",
        icon: "💎",
        color: "#8C9E78",
        condition: (stats) => stats.globalProgress >= 50,
    },
    {
        id: "diversified",
        name: "Diversificado",
        description: "Tenha 3+ categorias",
        icon: "🌈",
        color: "#D99E6B",
        condition: (stats) => stats.categories >= 3,
    },
    {
        id: "conqueror",
        name: "Conquistador",
        description: "Alcance 100% de progresso",
        icon: "👑",
        color: "#CCAE70",
        condition: (stats) => stats.globalProgress >= 100,
    },
    {
        id: "perfectionist",
        name: "Perfeccionista",
        description: "Complete 10+ metas",
        icon: "🏆",
        color: "#C87F76",
        condition: (stats) => stats.completedGoals >= 10,
    },
];

// ============================================================================
// MOTIVATIONAL INSIGHTS
// ============================================================================

function getMotivationalInsights(stats: GoalStats, categories: GoalCategory[]): string[] {
    const insights: string[] = [];

    // Best category
    if (categories.length > 0) {
        const categoryProgress = categories.map(cat => {
            const total = cat.goals.length;
            if (total === 0) return { name: cat.title, progress: 0 };
            const completed = cat.goals.filter(g => {
                if (g.type === "binary") return g.current >= g.target;
                if (g.direction === "decrease") return g.current <= g.target;
                return g.current >= g.target;
            }).length;
            return { name: cat.title, progress: Math.round((completed / total) * 100) };
        });

        const best = categoryProgress.reduce((a, b) => a.progress > b.progress ? a : b);
        const worst = categoryProgress.reduce((a, b) => a.progress < b.progress ? a : b);

        if (best.progress > 0) {
            insights.push(`🏆 Seu melhor desempenho é em "${best.name}" com ${best.progress}%!`);
        }

        if (worst.progress < best.progress && categories.length > 1) {
            insights.push(`🎯 Foco recomendado: "${worst.name}" precisa de atenção.`);
        }
    }

    // Progress insight
    if (stats.globalProgress > 0 && stats.globalProgress < 100) {
        const remaining = 100 - stats.globalProgress;
        insights.push(`⚡ Faltam apenas ${remaining}% para completar todas as metas!`);
    }

    // Completion rate
    if (stats.totalGoals > 0) {
        const rate = Math.round((stats.completedGoals / stats.totalGoals) * 100);
        if (rate > 50) {
            insights.push(`🔥 Taxa de conclusão: ${rate}% — Você está arrasando!`);
        } else if (rate > 0) {
            insights.push(`💪 ${stats.completedGoals} de ${stats.totalGoals} metas concluídas. Continue assim!`);
        }
    }

    return insights.slice(0, 3); // Max 3 insights
}

// ============================================================================
// AMBITION LEVEL SYSTEM
// ============================================================================

interface AmbitionLevel {
    id: number;
    name: string;
    icon: string;
    minProgress: number;
    maxProgress: number;
    color: string;
}

const AMBITION_LEVELS: AmbitionLevel[] = [
    { id: 1, name: "Sonhador", icon: "🌱", minProgress: 0, maxProgress: 20, color: "#8C9E78" },
    { id: 2, name: "Planejador", icon: "🚀", minProgress: 20, maxProgress: 40, color: "#768C9E" },
    { id: 3, name: "Executor", icon: "⚡", minProgress: 40, maxProgress: 60, color: "#CCAE70" },
    { id: 4, name: "Imparável", icon: "🔥", minProgress: 60, maxProgress: 80, color: "#D99E6B" },
    { id: 5, name: "Conquistador", icon: "👑", minProgress: 80, maxProgress: 100, color: "#CCAE70" },
];

function getAmbitionLevel(progress: number): AmbitionLevel {
    for (let i = AMBITION_LEVELS.length - 1; i >= 0; i--) {
        if (progress >= AMBITION_LEVELS[i].minProgress) {
            return AMBITION_LEVELS[i];
        }
    }
    return AMBITION_LEVELS[0];
}

function getAmbitionLevelProgress(progress: number): number {
    const current = getAmbitionLevel(progress);
    const nextIndex = AMBITION_LEVELS.findIndex(l => l.id === current.id) + 1;
    if (nextIndex >= AMBITION_LEVELS.length) return 100;
    const next = AMBITION_LEVELS[nextIndex];
    const progressInLevel = progress - current.minProgress;
    const levelRange = next.minProgress - current.minProgress;
    return Math.round((progressInLevel / levelRange) * 100);
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function ProgressMessage({ progress }: { progress: number }) {
    const getMessage = () => {
        if (progress === 0) return "Defina suas metas e comece a construir";
        if (progress < 25) return "Primeiros passos dados. Continue!";
        if (progress < 50) return "Bom progresso. Mantenha o ritmo";
        if (progress < 75) return "Mais da metade concluída!";
        if (progress < 100) return "Quase lá. O fim está próximo";
        return "Parabéns! Ano concluído com sucesso";
    };

    return (
        <p className="text-sm text-[#9B9B9B]">{getMessage()}</p>
    );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function YearlyGoalsPage() {
    // ========== STATE ==========
    const [showCategoryModal, setShowCategoryModal] = React.useState(false);
    const [showGoalModal, setShowGoalModal] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    // Editing States
    const [editingCategory, setEditingCategory] = React.useState<GoalCategory | undefined>();
    const [editingGoal, setEditingGoal] = React.useState<Goal | undefined>();
    const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{
        type: "category" | "goal";
        categoryId: string;
        goalId?: string;
    } | null>(null);

    // ========== INDEXEDDB DATA ==========
    const dbCategories = useLiveQuery(() => db.goalCategories.orderBy("order").toArray(), [], []);
    const dbGoals = useLiveQuery(() => db.goals.toArray(), [], []);
    const dbProfile = useLiveQuery(() => db.userProfile.get("default"), [], undefined);

    // Combine categories with their goals
    const categories: GoalCategory[] = React.useMemo(() => {
        return dbCategories.map(cat => ({
            id: cat.id,
            title: cat.title,
            icon: cat.icon,
            color: cat.color as CategoryColor,
            goals: dbGoals
                .filter(g => g.categoryId === cat.id)
                .map(g => ({
                    id: g.id,
                    title: g.title,
                    type: g.type,
                    current: g.current,
                    target: g.target,
                    unit: g.unit,
                }))
        }));
    }, [dbCategories, dbGoals]);

    const wordOfYear = dbProfile?.wordOfYear || "";
    const mounted = dbCategories !== undefined;

    // ========== HANDLERS: CATEGORY ==========

    const handleAddCategory = async (data: Omit<GoalCategory, "id" | "goals">) => {
        await db.goalCategories.add({
            id: generateId(),
            title: data.title,
            icon: data.icon,
            color: data.color,
            order: dbCategories.length,
        });
    };

    const handleEditCategory = async (data: Omit<GoalCategory, "id" | "goals">) => {
        if (!editingCategory) return;
        await db.goalCategories.update(editingCategory.id, {
            title: data.title,
            icon: data.icon,
            color: data.color,
        });
        setEditingCategory(undefined);
    };

    const handleDeleteCategory = async () => {
        if (!deleteTarget || deleteTarget.type !== "category") return;
        // Delete all goals in the category first
        await db.goals.where("categoryId").equals(deleteTarget.categoryId).delete();
        // Then delete the category
        await db.goalCategories.delete(deleteTarget.categoryId);
        setDeleteTarget(null);
    };

    // ========== HANDLERS: GOAL ==========

    const handleAddGoal = async (data: Omit<Goal, "id">) => {
        if (!activeCategoryId) return;
        await db.goals.add({
            id: generateId(),
            categoryId: activeCategoryId,
            title: data.title,
            type: data.type,
            current: data.current,
            target: data.target,
            unit: data.unit,
            createdAt: new Date().toISOString(),
        });
        setActiveCategoryId(null);
    };

    const handleEditGoal = async (data: Omit<Goal, "id">) => {
        if (!editingGoal || !activeCategoryId) return;
        await db.goals.update(editingGoal.id, {
            title: data.title,
            type: data.type,
            current: data.current,
            target: data.target,
            unit: data.unit,
        });
        setEditingGoal(undefined);
        setActiveCategoryId(null);
    };

    const handleUpdateGoal = async (categoryId: string, goalId: string, updatedGoal: Goal) => {
        await db.goals.update(goalId, {
            title: updatedGoal.title,
            type: updatedGoal.type,
            current: updatedGoal.current,
            target: updatedGoal.target,
            unit: updatedGoal.unit,
        });
    };

    const handleDeleteGoal = async () => {
        if (!deleteTarget || deleteTarget.type !== "goal" || !deleteTarget.goalId) return;
        await db.goals.delete(deleteTarget.goalId);
        setDeleteTarget(null);
    };

    // ========== HANDLERS: WORD OF YEAR ==========

    const handleWordOfYearChange = async (value: string) => {
        await db.userProfile.put({
            id: "default",
            name: dbProfile?.name || "",
            yearlyGoal: dbProfile?.yearlyGoal || "",
            wordOfYear: value.toUpperCase(),
            createdAt: dbProfile?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    };

    // ========== CALCULATIONS ==========

    const currentYear = new Date().getFullYear();
    const globalProgress = calculateGlobalProgress(categories);

    // Quick Stats Calculations
    const totalGoals = categories.reduce((sum, cat) => sum + cat.goals.length, 0);
    const completedGoals = categories.reduce((sum, cat) => {
        return sum + cat.goals.filter(g => {
            if (g.type === "binary") return g.current >= g.target;
            if (g.direction === "decrease") return g.current <= g.target;
            return g.current >= g.target;
        }).length;
    }, 0);

    // Ambition Level
    const ambitionLevel = getAmbitionLevel(globalProgress);
    const ambitionProgress = getAmbitionLevelProgress(globalProgress);

    // Days left in year
    const today = new Date();
    const endOfYear = new Date(currentYear, 11, 31);
    const daysLeft = Math.ceil((endOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Prediction: when will 100% be reached
    const daysPassed = Math.ceil((today.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
    const progressPerDay = daysPassed > 0 ? globalProgress / daysPassed : 0;
    const daysTo100 = progressPerDay > 0 ? Math.ceil((100 - globalProgress) / progressPerDay) : null;

    // Goal Stats for achievements
    const goalStats: GoalStats = {
        totalGoals,
        completedGoals,
        globalProgress,
        categories: categories.length,
        streak: 0, // Can be enhanced later
    };

    // Achievements
    const unlockedAchievements = ACHIEVEMENTS.filter(a => a.condition(goalStats));
    const lockedAchievements = ACHIEVEMENTS.filter(a => !a.condition(goalStats));

    // Motivational Insights
    const insights = getMotivationalInsights(goalStats, categories);

    // ========== RENDER ==========

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#191919]">
                <div className="animate-pulse text-[#9B9B9B]">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#191919] p-4 md:p-6 lg:p-8 pb-32">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ========== HEADER ========== */}
                <header className="flex items-center justify-between">
                    {/* Left: Back Button */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[#9B9B9B] hover:text-[#E3E3E3] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Voltar</span>
                    </Link>

                    {/* Right: Add Category Button */}
                    <Button
                        onClick={() => {
                            setEditingCategory(undefined);
                            setShowCategoryModal(true);
                        }}
                        className="gap-2 bg-[#E3E3E3] text-[#191919] hover:bg-[#D4D4D4]"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Categoria
                    </Button>
                </header>

                {/* ========== HERO SECTION ========== */}
                <section className="text-center space-y-6 py-8">
                    {/* Title */}
                    <div className="flex items-center justify-center gap-3">
                        <Target className="h-8 w-8 text-[#CCAE70]" />
                        <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-[#E3E3E3]">
                            Metas {currentYear}
                        </h1>
                    </div>

                    {/* Word of the Year */}
                    <div>
                        <p className="text-xs uppercase tracking-widest text-[#5A5A5A] mb-2">
                            Palavra do Ano
                        </p>
                        <input
                            type="text"
                            value={wordOfYear}
                            onChange={(e) => handleWordOfYearChange(e.target.value)}
                            className="text-2xl md:text-3xl font-bold tracking-widest text-center 
                                       bg-transparent border-b-2 border-transparent 
                                       hover:border-[#2F2F2F] focus:border-[#CCAE70]
                                       focus:outline-none text-[#CCAE70] 
                                       uppercase transition-colors"
                            placeholder="SUA PALAVRA"
                            maxLength={20}
                        />
                    </div>

                    {/* Global Progress */}
                    <div className="max-w-lg mx-auto space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#9B9B9B]">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm">Progresso Geral</span>
                            </div>
                            <motion.span
                                className="text-2xl font-bold text-[#CCAE70] tabular-nums font-mono"
                                key={globalProgress}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                            >
                                {globalProgress}%
                            </motion.span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 bg-[#202020] rounded-full overflow-hidden border border-[#2F2F2F]">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#CCAE70] to-[#D99E6B] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${globalProgress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>

                        <ProgressMessage progress={globalProgress} />
                    </div>

                    {/* Ambition Level */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto bg-gradient-to-br from-[#202020] via-[#252525] to-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <motion.span
                                className="text-3xl"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {ambitionLevel.icon}
                            </motion.span>
                            <div className="flex-1">
                                <p className="text-xs uppercase text-[#5A5A5A] tracking-wider">Nível de Ambição</p>
                                <p className="text-lg font-semibold text-[#E3E3E3]">{ambitionLevel.name}</p>
                            </div>
                            <span className="text-sm text-[#5A5A5A]">{ambitionProgress}% para próximo</span>
                        </div>
                        <div className="h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${ambitionProgress}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: ambitionLevel.color }}
                            />
                        </div>
                    </motion.div>
                </section>

                {/* ========== QUICK STATS ========== */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Goals */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 text-center hover:border-[rgba(204,174,112,0.2)] transition-all"
                    >
                        <div className="w-10 h-10 mx-auto mb-2 bg-[rgba(204,174,112,0.15)] rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-[#CCAE70]" />
                        </div>
                        <p className="text-2xl font-bold text-[#E3E3E3]">{totalGoals}</p>
                        <p className="text-xs text-[#5A5A5A] uppercase tracking-wider">Metas Ativas</p>
                    </motion.div>

                    {/* Completed Goals */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 text-center hover:border-[rgba(140,158,120,0.2)] transition-all"
                    >
                        <div className="w-10 h-10 mx-auto mb-2 bg-[rgba(140,158,120,0.15)] rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-[#8C9E78]" />
                        </div>
                        <p className="text-2xl font-bold text-[#8C9E78]">{completedGoals}</p>
                        <p className="text-xs text-[#5A5A5A] uppercase tracking-wider">Concluídas</p>
                    </motion.div>

                    {/* Days Left */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 text-center hover:border-[rgba(118,140,158,0.2)] transition-all"
                    >
                        <div className="w-10 h-10 mx-auto mb-2 bg-[rgba(118,140,158,0.15)] rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-[#768C9E]" />
                        </div>
                        <p className="text-2xl font-bold text-[#768C9E]">{daysLeft}</p>
                        <p className="text-xs text-[#5A5A5A] uppercase tracking-wider">Dias Restantes</p>
                    </motion.div>

                    {/* Prediction */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 text-center hover:border-[rgba(217,158,107,0.2)] transition-all"
                    >
                        <div className="w-10 h-10 mx-auto mb-2 bg-[rgba(217,158,107,0.15)] rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[#D99E6B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#D99E6B]">
                            {daysTo100 ? (daysTo100 <= daysLeft ? `${daysTo100}d` : "🎯") : "—"}
                        </p>
                        <p className="text-xs text-[#5A5A5A] uppercase tracking-wider">Para 100%</p>
                    </motion.div>
                </section>

                {/* ========== ACHIEVEMENTS & INSIGHTS ========== */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Achievement Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-[#202020] via-[#252525] to-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl p-5"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="w-5 h-5 text-[#CCAE70]" />
                            <h3 className="text-sm font-semibold text-[#E3E3E3] uppercase tracking-wider">Conquistas</h3>
                            <span className="ml-auto text-xs text-[#5A5A5A]">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
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
                                        className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl shadow-lg"
                                        style={{ backgroundColor: `${achievement.color}20`, border: `1px solid ${achievement.color}40` }}
                                    >
                                        {achievement.icon}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#191919] border border-[#2F2F2F] rounded text-xs text-[#E3E3E3] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        <p className="font-semibold">{achievement.name}</p>
                                        <p className="text-[#9B9B9B]">{achievement.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {/* Locked */}
                            {lockedAchievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className="relative group"
                                >
                                    <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] opacity-40 grayscale">
                                        {achievement.icon}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#191919] border border-[#2F2F2F] rounded text-xs text-[#9B9B9B] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        <p className="font-semibold">{achievement.name}</p>
                                        <p>{achievement.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Motivational Insights */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-gradient-to-br from-[#202020] via-[#252525] to-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl p-5"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-[#D99E6B]" />
                            <h3 className="text-sm font-semibold text-[#E3E3E3] uppercase tracking-wider">Insights</h3>
                        </div>
                        <div className="space-y-3">
                            {insights.length > 0 ? (
                                insights.map((insight, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 + index * 0.1 }}
                                        className="p-3 bg-[rgba(255,255,255,0.03)] rounded-lg border border-[rgba(255,255,255,0.05)]"
                                    >
                                        <p className="text-sm text-[#E3E3E3]">{insight}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-[#5A5A5A]">
                                    <p className="text-sm">Adicione metas para ver insights personalizados</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </section>

                {/* ========== CATEGORIES GRID ========== */}
                <main>
                    {categories.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <Target className="h-16 w-16 text-[#2F2F2F] mx-auto mb-4" />
                            <p className="text-[#5A5A5A] mb-4">
                                Nenhuma categoria criada ainda.
                            </p>
                            <Button
                                onClick={() => setShowCategoryModal(true)}
                                variant="outline"
                                className="border-[#2F2F2F] text-[#9B9B9B] hover:bg-[#202020] hover:text-[#E3E3E3]"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Criar primeira categoria
                            </Button>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((category, index) => (
                                <GoalCard
                                    key={category.id}
                                    category={category}
                                    index={index}
                                    onUpdateGoal={(goalId, updated) =>
                                        handleUpdateGoal(category.id, goalId, updated)
                                    }
                                    onAddGoal={() => {
                                        setActiveCategoryId(category.id);
                                        setEditingGoal(undefined);
                                        setShowGoalModal(true);
                                    }}
                                    onEditGoal={(goal) => {
                                        setActiveCategoryId(category.id);
                                        setEditingGoal(goal);
                                        setShowGoalModal(true);
                                    }}
                                    onDeleteGoal={(goalId) => {
                                        setDeleteTarget({
                                            type: "goal",
                                            categoryId: category.id,
                                            goalId,
                                        });
                                        setShowDeleteConfirm(true);
                                    }}
                                    onEditCategory={() => {
                                        setEditingCategory(category);
                                        setShowCategoryModal(true);
                                    }}
                                    onDeleteCategory={() => {
                                        setDeleteTarget({
                                            type: "category",
                                            categoryId: category.id,
                                        });
                                        setShowDeleteConfirm(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </main>

                {/* ========== FOOTER ========== */}
                <footer className="text-center py-8">
                    <p className="text-xs text-[#5A5A5A]">
                        Life Sync © {currentYear} — Seu Sistema Operacional Pessoal
                    </p>
                </footer>
            </div>

            {/* ========== MODALS ========== */}

            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(undefined);
                }}
                onSave={editingCategory ? handleEditCategory : handleAddCategory}
                editingCategory={editingCategory}
            />

            <GoalModal
                isOpen={showGoalModal}
                onClose={() => {
                    setShowGoalModal(false);
                    setEditingGoal(undefined);
                    setActiveCategoryId(null);
                }}
                onSave={editingGoal ? handleEditGoal : handleAddGoal}
                editingGoal={editingGoal}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
                onConfirm={
                    deleteTarget?.type === "category"
                        ? handleDeleteCategory
                        : handleDeleteGoal
                }
                title={
                    deleteTarget?.type === "category"
                        ? "Excluir Categoria"
                        : "Excluir Meta"
                }
                message={
                    deleteTarget?.type === "category"
                        ? "Tem certeza que deseja excluir esta categoria? Todas as metas dentro dela serão perdidas."
                        : "Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
                }
                confirmLabel="Excluir"
            />

            {/* FloatingDock */}
            <FloatingDock />
        </div>
    );
}
