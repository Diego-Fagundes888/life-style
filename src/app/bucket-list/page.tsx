"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    Sparkles,
    Filter,
    CheckCircle2,
    Clock,
    Play,
    Search,
    SortAsc,
    DollarSign,
    Calendar,
    Award,
    Lightbulb,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DreamCard } from "@/components/bucket-list/dream-card";
import { DreamModal } from "@/components/bucket-list/dream-modal";
import { DreamWizard } from "@/components/bucket-list/dream-wizard";
import { FloatingDock } from "@/components/dashboard/FloatingDock";
import { db, type DBDream } from "@/lib/db";
import {
    Dream,
    DreamStatus,
    calculateBucketListStats,
    generateDreamId,
} from "@/lib/types/bucket-list";
import { cn } from "@/lib/utils";

// ============================================================================
// DREAM LEVEL SYSTEM
// ============================================================================

interface DreamLevel {
    id: number;
    name: string;
    icon: string;
    minCompleted: number;
    maxCompleted: number;
    color: string;
}

const DREAM_LEVELS: DreamLevel[] = [
    { id: 1, name: "Sonhador", icon: "✨", minCompleted: 0, maxCompleted: 2, color: "#8C9E78" },
    { id: 2, name: "Explorador", icon: "🌙", minCompleted: 3, maxCompleted: 5, color: "#768C9E" },
    { id: 3, name: "Aventureiro", icon: "⭐", minCompleted: 6, maxCompleted: 10, color: "#CCAE70" },
    { id: 4, name: "Legendário", icon: "🌟", minCompleted: 11, maxCompleted: 20, color: "#D99E6B" },
    { id: 5, name: "Imortal", icon: "👑", minCompleted: 21, maxCompleted: 999, color: "#C87F76" },
];

function getDreamLevel(completed: number): DreamLevel {
    for (let i = DREAM_LEVELS.length - 1; i >= 0; i--) {
        if (completed >= DREAM_LEVELS[i].minCompleted) {
            return DREAM_LEVELS[i];
        }
    }
    return DREAM_LEVELS[0];
}

function getDreamLevelProgress(completed: number): number {
    const current = getDreamLevel(completed);
    const nextIndex = DREAM_LEVELS.findIndex(l => l.id === current.id) + 1;
    if (nextIndex >= DREAM_LEVELS.length) return 100;
    const next = DREAM_LEVELS[nextIndex];
    const progressInLevel = completed - current.minCompleted;
    const levelRange = next.minCompleted - current.minCompleted;
    return Math.round((progressInLevel / levelRange) * 100);
}

// ============================================================================
// DREAM ACHIEVEMENTS
// ============================================================================

interface DreamAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    condition: (dreams: Dream[], totalCost: number) => boolean;
}

const DREAM_ACHIEVEMENTS: DreamAchievement[] = [
    {
        id: "first_dream",
        name: "Primeiro Sonho",
        description: "Complete seu primeiro sonho",
        icon: "🌟",
        color: "#CCAE70",
        condition: (dreams) => dreams.filter(d => d.status === "completed").length >= 1,
    },
    {
        id: "five_dreams",
        name: "5 Conquistados",
        description: "Complete 5 sonhos",
        icon: "🔥",
        color: "#D99E6B",
        condition: (dreams) => dreams.filter(d => d.status === "completed").length >= 5,
    },
    {
        id: "big_investor",
        name: "Grande Investidor",
        description: "Invista R$ 10.000+ em sonhos",
        icon: "💰",
        color: "#8C9E78",
        condition: (dreams, totalCost) => totalCost >= 10000,
    },
    {
        id: "diversified",
        name: "Diversificado",
        description: "Sonhos em 3+ categorias",
        icon: "🌈",
        color: "#768C9E",
        condition: (dreams) => {
            const categories = new Set(dreams.map(d => d.category));
            return categories.size >= 3;
        },
    },
    {
        id: "legendary",
        name: "Legendário",
        description: "Complete 20+ sonhos",
        icon: "👑",
        color: "#C87F76",
        condition: (dreams) => dreams.filter(d => d.status === "completed").length >= 20,
    },
    {
        id: "dreamer",
        name: "Grande Sonhador",
        description: "Tenha 10+ sonhos na lista",
        icon: "✨",
        color: "#9B59B6",
        condition: (dreams) => dreams.length >= 10,
    },
];

// ============================================================================
// QUICK INSIGHTS
// ============================================================================

function getDreamInsights(dreams: Dream[]): string[] {
    const insights: string[] = [];

    // Most affordable pending dream
    const pendingDreams = dreams.filter(d => d.status !== "completed" && d.estimatedCost);
    if (pendingDreams.length > 0) {
        const cheapest = pendingDreams.reduce((a, b) =>
            (a.estimatedCost || 0) < (b.estimatedCost || 0) ? a : b
        );
        if (cheapest.estimatedCost) {
            insights.push(`💰 Mais acessível: "${cheapest.title}" (R$ ${cheapest.estimatedCost.toLocaleString('pt-BR')})`);
        }
    }

    // In progress dreams
    const inProgress = dreams.filter(d => d.status === "in-progress");
    if (inProgress.length > 0) {
        insights.push(`🎯 Em andamento: ${inProgress.length} sonho(s) sendo realizados!`);
    }

    // Completion rate
    const completed = dreams.filter(d => d.status === "completed").length;
    if (dreams.length > 0 && completed > 0) {
        const rate = Math.round((completed / dreams.length) * 100);
        insights.push(`⚡ Taxa de realização: ${rate}% dos sonhos conquistados!`);
    }

    // Categories insight
    const categories = new Set(dreams.map(d => d.category));
    if (categories.size >= 3) {
        insights.push(`🌈 Sonhos diversificados em ${categories.size} áreas da vida!`);
    }

    return insights.slice(0, 3);
}

type FilterType = 'all' | 'pending' | 'in-progress' | 'completed';
type SortType = 'newest' | 'oldest' | 'alphabetical' | 'cost';

const filterConfig: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todos', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'pending', label: 'Pendentes', icon: <Clock className="h-4 w-4" /> },
    { id: 'in-progress', label: 'Em Andamento', icon: <Play className="h-4 w-4" /> },
    { id: 'completed', label: 'Realizados', icon: <CheckCircle2 className="h-4 w-4" /> },
];

const sortConfig: { id: SortType; label: string; icon: React.ReactNode }[] = [
    { id: 'newest', label: 'Mais Recentes', icon: <Calendar className="h-4 w-4" /> },
    { id: 'oldest', label: 'Mais Antigos', icon: <Calendar className="h-4 w-4" /> },
    { id: 'alphabetical', label: 'A-Z', icon: <SortAsc className="h-4 w-4" /> },
    { id: 'cost', label: 'Maior Custo', icon: <DollarSign className="h-4 w-4" /> },
];

/**
 * BucketListPage - A Lista de Vida (Antes de Morrer).
 */
export default function BucketListPage() {
    const [filter, setFilter] = React.useState<FilterType>('all');
    const [sortBy, setSortBy] = React.useState<SortType>('newest');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedDream, setSelectedDream] = React.useState<Dream | null>(null);
    const [isNewDream, setIsNewDream] = React.useState(false);
    const [showSortMenu, setShowSortMenu] = React.useState(false);
    const [showWizard, setShowWizard] = React.useState(false);

    // ========== INDEXEDDB DATA ==========
    const dbDreams = useLiveQuery(() => db.dreams.toArray(), [], []);

    // Convert DB format to Dream format
    const dreams: Dream[] = React.useMemo(() => {
        return dbDreams.map(d => ({
            id: d.id,
            title: d.title,
            description: d.description,
            category: d.category as Dream["category"],
            status: d.status as DreamStatus,
            image: d.image,
            realImage: d.realImage,
            estimatedCost: d.estimatedCost,
            motivation: d.motivation,
            steps: d.steps,
            completedDate: d.completedDate,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
        }));
    }, [dbDreams]);

    const mounted = dbDreams !== undefined;

    // ========== HANDLERS ==========

    const handleAddDream = () => {
        setShowWizard(true);
    };

    const handleWizardComplete = async (newDream: Dream) => {
        await db.dreams.add({
            id: newDream.id,
            title: newDream.title,
            description: newDream.description,
            category: newDream.category,
            status: newDream.status,
            image: newDream.image,
            realImage: newDream.realImage,
            estimatedCost: newDream.estimatedCost,
            motivation: newDream.motivation,
            steps: newDream.steps,
            createdAt: newDream.createdAt,
            updatedAt: newDream.updatedAt,
        });
    };

    const handleUpdateDream = async (updatedDream: Dream) => {
        await db.dreams.update(updatedDream.id, {
            title: updatedDream.title,
            description: updatedDream.description,
            category: updatedDream.category,
            status: updatedDream.status,
            image: updatedDream.image,
            realImage: updatedDream.realImage,
            estimatedCost: updatedDream.estimatedCost,
            motivation: updatedDream.motivation,
            steps: updatedDream.steps,
            completedDate: updatedDream.completedDate,
            updatedAt: new Date().toISOString(),
        });
        setSelectedDream(updatedDream);
    };

    const handleDeleteDream = async (id: string) => {
        await db.dreams.delete(id);
    };

    const handleCloseModal = () => {
        setSelectedDream(null);
        setIsNewDream(false);
    };

    // ========== FILTERING & SORTING ==========

    const filteredAndSortedDreams = React.useMemo(() => {
        let result = dreams;

        // Filter by status
        if (filter !== 'all') {
            result = result.filter(d => d.status === filter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(d =>
                d.title.toLowerCase().includes(query) ||
                d.description?.toLowerCase().includes(query) ||
                d.motivation?.toLowerCase().includes(query)
            );
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                result = [...result].sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                break;
            case 'oldest':
                result = [...result].sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                break;
            case 'alphabetical':
                result = [...result].sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'cost':
                result = [...result].sort((a, b) =>
                    (b.estimatedCost || 0) - (a.estimatedCost || 0)
                );
                break;
        }

        return result;
    }, [dreams, filter, searchQuery, sortBy]);

    const stats = calculateBucketListStats(dreams);

    // Calculate total estimated cost
    const totalEstimatedCost = React.useMemo(() => {
        return dreams
            .filter(d => d.status !== 'completed')
            .reduce((acc, d) => acc + (d.estimatedCost || 0), 0);
    }, [dreams]);

    // Total invested (completed dreams)
    const totalInvested = React.useMemo(() => {
        return dreams
            .filter(d => d.status === 'completed')
            .reduce((acc, d) => acc + (d.estimatedCost || 0), 0);
    }, [dreams]);

    // Dream Level
    const dreamLevel = React.useMemo(() => getDreamLevel(stats.completed), [stats.completed]);
    const dreamLevelProgress = React.useMemo(() => getDreamLevelProgress(stats.completed), [stats.completed]);

    // Achievements
    const unlockedAchievements = React.useMemo(
        () => DREAM_ACHIEVEMENTS.filter(a => a.condition(dreams, totalInvested)),
        [dreams, totalInvested]
    );
    const lockedAchievements = React.useMemo(
        () => DREAM_ACHIEVEMENTS.filter(a => !a.condition(dreams, totalInvested)),
        [dreams, totalInvested]
    );

    // Insights
    const insights = React.useMemo(() => getDreamInsights(dreams), [dreams]);

    // ========== RENDER ==========

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Carregando sonhos...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-slate-900 to-rose-900/20" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920')] bg-cover bg-center opacity-10" />

                <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
                    {/* Nav */}
                    <div className="flex items-center justify-between mb-12">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">Voltar</span>
                        </Link>

                        <Button onClick={handleAddDream} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Adicionar Sonho
                        </Button>
                    </div>

                    {/* Title */}
                    <div className="text-center max-w-2xl mx-auto">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4"
                        >
                            A Lista de Vida
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-slate-300/80 italic mb-6"
                        >
                            "Memento Mori — Lembre-se que você é mortal"
                        </motion.p>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-violet-400" />
                                <span className="text-slate-300">
                                    <strong className="text-white">{stats.total}</strong> Sonhos
                                </span>
                            </div>
                            <div className="text-slate-600 hidden md:block">•</div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span className="text-slate-300">
                                    <strong className="text-emerald-400">{stats.completed}</strong> Realizados
                                </span>
                            </div>
                            <div className="text-slate-600 hidden md:block">•</div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-400" />
                                <span className="text-slate-300">
                                    <strong className="text-amber-400">{stats.pending + stats.inProgress}</strong> Pendentes
                                </span>
                            </div>
                            {totalEstimatedCost > 0 && (
                                <>
                                    <div className="text-slate-600 hidden md:block">•</div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-indigo-400" />
                                        <span className="text-slate-300">
                                            <strong className="text-indigo-400">
                                                R$ {totalEstimatedCost.toLocaleString('pt-BR')}
                                            </strong> estimados
                                        </span>
                                    </div>
                                </>
                            )}
                        </motion.div>

                        {/* Completion Progress */}
                        {stats.total > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-6 max-w-xs mx-auto"
                            >
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                    <span>Progresso da Lista</span>
                                    <span className="font-bold text-violet-400">
                                        {Math.round((stats.completed / stats.total) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-violet-500 to-rose-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========== GAMIFICATION SECTION ========== */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Dream Level Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <motion.span
                                className="text-4xl"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {dreamLevel.icon}
                            </motion.span>
                            <div className="flex-1">
                                <p className="text-xs uppercase text-slate-500 tracking-wider">Nível de Sonhador</p>
                                <p className="text-xl font-bold" style={{ color: dreamLevel.color }}>{dreamLevel.name}</p>
                            </div>
                            <span className="text-sm text-slate-500">{dreamLevelProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${dreamLevelProgress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: dreamLevel.color }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500 text-center">
                            {stats.completed} sonhos conquistados
                        </p>
                    </motion.div>

                    {/* Achievement Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="w-5 h-5 text-amber-400" />
                            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Conquistas</h3>
                            <span className="ml-auto text-xs text-slate-500">{unlockedAchievements.length}/{DREAM_ACHIEVEMENTS.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {unlockedAchievements.map((achievement, index) => (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    className="relative group"
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-lg"
                                        style={{ backgroundColor: `${achievement.color}20`, border: `1px solid ${achievement.color}40` }}
                                    >
                                        {achievement.icon}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        <p className="font-semibold">{achievement.name}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {lockedAchievements.map((achievement) => (
                                <div key={achievement.id} className="relative group">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-800/50 border border-slate-700/50 opacity-40 grayscale">
                                        {achievement.icon}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        <p className="font-semibold">{achievement.name}</p>
                                        <p>{achievement.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Insights */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-amber-400" />
                            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Insights</h3>
                        </div>
                        <div className="space-y-2">
                            {insights.length > 0 ? (
                                insights.map((insight, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 + index * 0.1 }}
                                        className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
                                    >
                                        <p className="text-xs text-slate-300">{insight}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-2 text-slate-500">
                                    <p className="text-xs">Adicione sonhos para ver insights</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Filters + Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
                {/* Search + Filters + Sort */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            type="text"
                            placeholder="Buscar sonhos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <Filter className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        {filterConfig.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                    filter === f.id
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                                )}
                            >
                                {f.icon}
                                {f.label}
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-xs",
                                    filter === f.id ? "bg-white/20" : "bg-slate-700"
                                )}>
                                    {f.id === 'all'
                                        ? stats.total
                                        : f.id === 'pending'
                                            ? stats.pending
                                            : f.id === 'in-progress'
                                                ? stats.inProgress
                                                : stats.completed}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                            <SortAsc className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {sortConfig.find(s => s.id === sortBy)?.label}
                            </span>
                        </button>

                        {showSortMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 z-10"
                            >
                                {sortConfig.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            setSortBy(s.id);
                                            setShowSortMenu(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                            sortBy === s.id
                                                ? "bg-indigo-600 text-white"
                                                : "text-slate-300 hover:bg-slate-700"
                                        )}
                                    >
                                        {s.icon}
                                        {s.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Search Results Count */}
                {searchQuery && (
                    <div className="mb-4 text-sm text-slate-400">
                        {filteredAndSortedDreams.length} resultado(s) para "{searchQuery}"
                    </div>
                )}

                {/* Masonry Grid */}
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredAndSortedDreams.map((dream) => (
                            <DreamCard
                                key={dream.id}
                                dream={dream}
                                onClick={() => {
                                    setIsNewDream(false);
                                    setSelectedDream(dream);
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {filteredAndSortedDreams.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <Sparkles className="h-10 w-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">
                            {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum sonho encontrado'}
                        </h3>
                        <p className="text-slate-500 mb-6">
                            {searchQuery
                                ? `Tente buscar por outro termo`
                                : filter === 'all'
                                    ? 'Comece adicionando seus primeiros sonhos!'
                                    : `Nenhum sonho com status "${filterConfig.find(f => f.id === filter)?.label}"`}
                        </p>
                        {filter === 'all' && !searchQuery && (
                            <Button onClick={handleAddDream} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Adicionar Primeiro Sonho
                            </Button>
                        )}
                    </motion.div>
                )}

                {/* Footer Quote */}
                <div className="text-center py-12 mt-8">
                    <p className="text-slate-600 italic text-sm">
                        "A vida é curta demais para não sonhar. Mas curta demais também para não realizar."
                    </p>
                </div>
            </div>

            {/* Dream Modal */}
            <DreamModal
                isOpen={!!selectedDream}
                dream={selectedDream}
                onClose={handleCloseModal}
                onUpdate={handleUpdateDream}
                onDelete={handleDeleteDream}
                isNew={isNewDream}
            />

            {/* Dream Wizard */}
            <DreamWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onComplete={handleWizardComplete}
            />
            {/* FloatingDock */}
            <FloatingDock />
        </div>
    );
}
