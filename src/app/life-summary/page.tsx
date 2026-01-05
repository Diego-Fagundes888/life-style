"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Square, Clock, Target, Star, Award, TrendingUp, CheckCircle } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { LifeAreaWizard } from "@/components/life-summary/LifeAreaWizard";
import { FloatingDock } from "@/components/dashboard/FloatingDock";
import { db, type DBLifeAreaData } from "@/lib/db";
import {
    LIFE_AREAS,
    TIPS,
    LifeArea,
    LifeAreaData,
    LifeAreaId,
    createEmptyAreaData,
    calculateAreaProgress,
    formatRelativeTime,
    Goal,
} from "@/lib/types/life-summary";
import { cn } from "@/lib/utils";

// ============================================================================
// SELF-DISCOVERY LEVEL SYSTEM
// ============================================================================

interface DiscoveryLevel {
    id: number;
    name: string;
    icon: string;
    minProgress: number;
    maxProgress: number;
    color: string;
}

const DISCOVERY_LEVELS: DiscoveryLevel[] = [
    { id: 1, name: "Iniciante", icon: "🌱", minProgress: 0, maxProgress: 20, color: "#8C9E78" },
    { id: 2, name: "Explorador", icon: "🌿", minProgress: 21, maxProgress: 40, color: "#768C9E" },
    { id: 3, name: "Consciente", icon: "✨", minProgress: 41, maxProgress: 60, color: "#CCAE70" },
    { id: 4, name: "Iluminado", icon: "🌟", minProgress: 61, maxProgress: 80, color: "#D99E6B" },
    { id: 5, name: "Mestre", icon: "👑", minProgress: 81, maxProgress: 100, color: "#C87F76" },
];

function getDiscoveryLevel(progress: number): DiscoveryLevel {
    for (let i = DISCOVERY_LEVELS.length - 1; i >= 0; i--) {
        if (progress >= DISCOVERY_LEVELS[i].minProgress) {
            return DISCOVERY_LEVELS[i];
        }
    }
    return DISCOVERY_LEVELS[0];
}

function getDiscoveryLevelProgress(progress: number): number {
    const current = getDiscoveryLevel(progress);
    const nextIndex = DISCOVERY_LEVELS.findIndex(l => l.id === current.id) + 1;
    if (nextIndex >= DISCOVERY_LEVELS.length) return 100;
    const next = DISCOVERY_LEVELS[nextIndex];
    const progressInLevel = progress - current.minProgress;
    const levelRange = next.minProgress - current.minProgress;
    return Math.round((progressInLevel / levelRange) * 100);
}

// ============================================================================
// LIFE SUMMARY ACHIEVEMENTS
// ============================================================================

interface LifeAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    condition: (areaDataMap: Record<LifeAreaId, LifeAreaData>, totalProgress: number) => boolean;
}

const LIFE_ACHIEVEMENTS: LifeAchievement[] = [
    {
        id: "first_reflection",
        name: "Primeira Reflexão",
        description: "Preencha sua primeira área",
        icon: "🎯",
        color: "#CCAE70",
        condition: (data, progress) => progress > 0,
    },
    {
        id: "five_areas",
        name: "Explorador Completo",
        description: "Preencha todas as 5 áreas",
        icon: "🔥",
        color: "#D99E6B",
        condition: (data) => {
            return Object.values(data).every(d => {
                const hasRating = d.rating && d.rating > 0;
                return hasRating;
            });
        },
    },
    {
        id: "high_score",
        name: "Excelência",
        description: "Nota 8+ em uma área",
        icon: "⭐",
        color: "#8C9E78",
        condition: (data) => Object.values(data).some(d => d.rating && d.rating >= 8),
    },
    {
        id: "all_started",
        name: "Jornada Iniciada",
        description: "Todas áreas com algum conteúdo",
        icon: "🌈",
        color: "#768C9E",
        condition: (data) => {
            return Object.values(data).every(d => {
                return (d.rating && d.rating > 0) || (d.goals && d.goals.length > 0) || d.notes;
            });
        },
    },
    {
        id: "master",
        name: "Mestre da Vida",
        description: "100% de progresso",
        icon: "👑",
        color: "#C87F76",
        condition: (data, progress) => progress === 100,
    },
    {
        id: "balanced",
        name: "Vida Equilibrada",
        description: "Todas áreas com nota ≥ 7",
        icon: "⚖️",
        color: "#9B59B6",
        condition: (data) => {
            const values = Object.values(data);
            return values.length >= 5 && values.every(d => d.rating && d.rating >= 7);
        },
    },
];

/**
 * LifeSummaryPage - Página "Vida em Resumo"
 * Estética: Notion Dark Mode
 */
export default function LifeSummaryPage() {
    const [selectedArea, setSelectedArea] = React.useState<LifeArea | null>(null);

    // ========== INDEXEDDB DATA ==========
    const lifeAreasRaw = useLiveQuery(() => db.lifeAreas.toArray(), [], []);

    // Convert array to map for easier access
    const areaDataMap = React.useMemo(() => {
        const map: Record<LifeAreaId, LifeAreaData> = {} as Record<LifeAreaId, LifeAreaData>;
        LIFE_AREAS.forEach(area => {
            const dbData = lifeAreasRaw.find(d => d.id === area.id);
            if (dbData) {
                // Convert DB format to LifeAreaData format
                map[area.id] = {
                    areaId: dbData.id as LifeAreaId,
                    answers: dbData.reflectionAnswers || {},
                    goals: (dbData.goals || []).map(g => ({
                        id: g.id,
                        text: g.text,
                        completed: g.completed,
                        createdAt: new Date().toISOString(),
                    })),
                    crossReferences: [],
                    customImage: dbData.imageUrl,
                    rating: dbData.score || undefined,
                    notes: dbData.currentState || undefined,
                    updatedAt: dbData.updatedAt,
                };
            } else {
                map[area.id] = createEmptyAreaData(area.id);
            }
        });
        return map;
    }, [lifeAreasRaw]);

    const mounted = lifeAreasRaw !== undefined;

    // ========== HANDLERS ==========

    const handleOpenModal = (area: LifeArea) => {
        setSelectedArea(area);
    };

    const handleSaveData = async (data: LifeAreaData) => {
        // Save to IndexedDB
        await db.lifeAreas.put({
            id: data.areaId,
            currentState: data.notes || "",
            desiredState: "",
            obstacles: "",
            actions: "",
            score: data.rating || 0,
            goals: data.goals.map(g => ({
                id: g.id,
                text: g.text,
                completed: g.completed,
            })),
            reflectionAnswers: data.answers,
            imageUrl: data.customImage,
            updatedAt: new Date().toISOString(),
        });
    };

    // ========== STATS ==========

    const totalProgress = React.useMemo(() => {
        if (!mounted || Object.keys(areaDataMap).length === 0) return 0;
        const sum = LIFE_AREAS.reduce((acc, area) => {
            return acc + calculateAreaProgress(areaDataMap[area.id], area);
        }, 0);
        return Math.round(sum / LIFE_AREAS.length);
    }, [areaDataMap, mounted]);

    // Discovery Level
    const discoveryLevel = React.useMemo(() => getDiscoveryLevel(totalProgress), [totalProgress]);
    const levelProgress = React.useMemo(() => getDiscoveryLevelProgress(totalProgress), [totalProgress]);

    // Achievements
    const unlockedAchievements = React.useMemo(
        () => LIFE_ACHIEVEMENTS.filter(a => a.condition(areaDataMap, totalProgress)),
        [areaDataMap, totalProgress]
    );
    const lockedAchievements = React.useMemo(
        () => LIFE_ACHIEVEMENTS.filter(a => !a.condition(areaDataMap, totalProgress)),
        [areaDataMap, totalProgress]
    );

    // Average Rating
    const averageRating = React.useMemo(() => {
        if (!mounted || Object.keys(areaDataMap).length === 0) return 0;
        const ratings = Object.values(areaDataMap).filter(d => d && d.rating && d.rating > 0).map(d => d.rating!);
        if (ratings.length === 0) return 0;
        return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    }, [areaDataMap, mounted]);

    // Areas Completed
    const areasCompleted = React.useMemo(() => {
        if (!mounted || Object.keys(areaDataMap).length === 0) return 0;
        return LIFE_AREAS.filter(area => {
            const data = areaDataMap[area.id];
            if (!data) return false;
            return calculateAreaProgress(data, area) === 100;
        }).length;
    }, [areaDataMap, mounted]);

    // ========== RENDER ==========

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#191919] flex items-center justify-center">
                <div className="animate-pulse text-[#666]">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#191919] pb-32">
            {/* Container */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[#666] hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Voltar</span>
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl font-serif font-bold text-white tracking-wide"
                            >
                                Vida em Resumo
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-[#888] mt-2 text-lg"
                            >
                                Uma análise profunda das 5 áreas fundamentais da sua vida.
                            </motion.p>
                        </div>

                        {/* Overall Progress */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-4 bg-[#252525] rounded-xl p-4 border border-[#333]"
                        >
                            <div className="text-right">
                                <div className="text-xs text-[#666] uppercase tracking-wider">Progresso Geral</div>
                                <div className="text-2xl font-bold text-white">{totalProgress}%</div>
                            </div>
                            <div className="w-20 h-20 relative">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="32"
                                        fill="none"
                                        stroke="#333"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="32"
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${totalProgress * 2.01} 201`}
                                        className="transition-all duration-500"
                                    />
                                </svg>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ========== QUICK STATS HERO ========== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Discovery Level Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] border border-[#333] rounded-xl p-5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <motion.span
                                className="text-3xl"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {discoveryLevel.icon}
                            </motion.span>
                            <div>
                                <p className="text-xs uppercase text-[#666] tracking-wider">Nível</p>
                                <p className="text-lg font-bold" style={{ color: discoveryLevel.color }}>{discoveryLevel.name}</p>
                            </div>
                        </div>
                        <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${levelProgress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: discoveryLevel.color }}
                            />
                        </div>
                    </motion.div>

                    {/* Progress Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] border border-[#333] rounded-xl p-5"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <p className="text-xs uppercase text-[#666] tracking-wider">Progresso Geral</p>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalProgress}%</p>
                        <p className="text-xs text-[#666] mt-1">da jornada completada</p>
                    </motion.div>

                    {/* Average Rating Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] border border-[#333] rounded-xl p-5"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-amber-400" />
                            <p className="text-xs uppercase text-[#666] tracking-wider">Satisfação Média</p>
                        </div>
                        <p className="text-3xl font-bold text-white">{averageRating || "—"}<span className="text-lg text-[#666]">/10</span></p>
                        <p className="text-xs text-[#666] mt-1">nas áreas avaliadas</p>
                    </motion.div>

                    {/* Areas Completed Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] border border-[#333] rounded-xl p-5"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-violet-400" />
                            <p className="text-xs uppercase text-[#666] tracking-wider">Áreas Completas</p>
                        </div>
                        <p className="text-3xl font-bold text-white">{areasCompleted}<span className="text-lg text-[#666]">/5</span></p>
                        <p className="text-xs text-[#666] mt-1">totalmente preenchidas</p>
                    </motion.div>
                </div>

                {/* ========== ACHIEVEMENT BADGES ========== */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-[#252525] to-[#1a1a1a] border border-[#333] rounded-xl p-5 mb-8"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider">Conquistas</h3>
                        <span className="ml-auto text-xs text-[#666]">{unlockedAchievements.length}/{LIFE_ACHIEVEMENTS.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
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
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#252525] border border-[#444] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    <p className="font-semibold">{achievement.name}</p>
                                </div>
                            </motion.div>
                        ))}
                        {lockedAchievements.map((achievement) => (
                            <div key={achievement.id} className="relative group">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#252525] border border-[#333] opacity-40 grayscale">
                                    {achievement.icon}
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#252525] border border-[#444] rounded text-xs text-[#888] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    <p className="font-semibold">{achievement.name}</p>
                                    <p>{achievement.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Main Layout: 2 Columns */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Grid of Cards */}
                    <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {LIFE_AREAS.map((area, index) => (
                                <AreaCard
                                    key={area.id}
                                    area={area}
                                    data={areaDataMap[area.id]}
                                    index={index}
                                    onClick={() => handleOpenModal(area)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Sidebar with Tips */}
                    <div className="w-full lg:w-[300px] flex-shrink-0">
                        <TipsSidebar />
                    </div>
                </div>
            </div>

            {/* Premium Life Area Wizard */}
            <LifeAreaWizard
                isOpen={!!selectedArea}
                area={selectedArea}
                data={selectedArea ? areaDataMap[selectedArea.id] : null}
                onClose={() => setSelectedArea(null)}
                onSave={handleSaveData}
            />

            {/* FloatingDock */}
            <FloatingDock />
        </div>
    );
}

// ========== AREA CARD COMPONENT ==========

interface AreaCardProps {
    area: LifeArea;
    data: LifeAreaData;
    index: number;
    onClick: () => void;
}

function AreaCard({ area, data, index, onClick }: AreaCardProps) {
    const progress = calculateAreaProgress(data, area);
    const displayImage = data?.customImage || area.image;
    const hasContent = progress > 0;
    const completedGoals = data?.goals?.filter(g => g.completed).length || 0;
    const totalGoals = data?.goals?.length || 0;

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            className="group text-left w-full bg-[#202020] rounded-lg overflow-hidden border border-[#2a2a2a] hover:border-[#444] hover:bg-[#252525] transition-all duration-300"
        >
            {/* Cover Image */}
            <div className="relative h-32 overflow-hidden">
                <img
                    src={displayImage}
                    alt={area.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#202020] to-transparent" />

                {/* Progress Badge */}
                {hasContent && (
                    <div className={cn(
                        "absolute top-2 right-2 px-2 py-1 text-xs rounded-full flex items-center gap-1",
                        progress === 100
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                    )}>
                        {progress === 100 ? (
                            <>
                                <Star className="h-3 w-3" />
                                Completo
                            </>
                        ) : (
                            `${progress}%`
                        )}
                    </div>
                )}

                {/* Rating Badge */}
                {data?.rating && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/10 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                        {data.rating}/10
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title Row */}
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{area.emoji}</span>
                    <span className="text-white font-medium group-hover:text-[#fff] transition-colors flex-1">
                        {area.title}
                    </span>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-3 text-xs text-[#666]">
                    {/* Goals count */}
                    {totalGoals > 0 && (
                        <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>
                                {completedGoals}/{totalGoals} objetivos
                            </span>
                        </div>
                    )}

                    {/* Last updated */}
                    {hasContent && data?.updatedAt && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(data.updatedAt)}</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {hasContent && (
                    <div className="mt-3 h-1 bg-[#333] rounded-full overflow-hidden">
                        <motion.div
                            className={cn(
                                "h-full rounded-full",
                                progress === 100 ? "bg-emerald-500" : "bg-white/50"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                        />
                    </div>
                )}
            </div>
        </motion.button>
    );
}

// ========== TIPS SIDEBAR COMPONENT ==========

function TipsSidebar() {
    return (
        <div className="space-y-4 sticky top-8">
            {/* Title */}
            <h2 className="text-sm font-serif font-semibold text-[#666] uppercase tracking-[0.2em]">
                Dicas
            </h2>

            {/* Tips List */}
            <div className="space-y-3">
                {TIPS.map((tip, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex gap-3 p-3 bg-[#252525] rounded-lg border border-[#2a2a2a]"
                    >
                        <Square className="h-4 w-4 text-[#555] flex-shrink-0 mt-0.5" />
                        <p className="text-[#999] text-sm leading-relaxed">
                            {tip}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Quote */}
            <div className="mt-8 p-4 border-l-2 border-[#333]">
                <p className="text-[#666] text-sm italic font-serif">
                    "The unexamined life is not worth living."
                </p>
                <p className="text-[#555] text-xs mt-2">— Socrates</p>
            </div>
        </div>
    );
}
