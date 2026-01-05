"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { HabitMatrix, MiniHeatmap } from "@/components/dashboard/HabitMatrix";
import { FloatingDock } from "@/components/dashboard/FloatingDock";
import {
    HabitsHeroSection,
    CelebrationOverlay,
    XPToastManager,
    AchievementBadges
} from "@/components/habits";
import { useHabits } from "@/context/LifeSyncContext";
import type { TrackingHabit, HabitCategory, HabitFrequency } from "@/lib/mock-data";
import {
    Sun,
    Moon,
    Check,
    Plus,
    MoreVertical,
    X,
    Flame,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Target,
    Droplets,
    Sparkles,
    Dumbbell,
    PenLine,
    MonitorOff,
    BookOpen,
    Heart,
    Shirt,
    GlassWater,
    Loader2,
    Trophy,
} from "lucide-react";

// ============================================================================
// HELPERS
// ============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
    Droplets, Sparkles, Dumbbell, PenLine, MonitorOff, BookOpen, Heart, Shirt, GlassWater, Sun,
};

function getIcon(iconName: string): React.ElementType {
    return ICON_MAP[iconName] || Target;
}

function toISODateString(date: Date): string {
    return date.toISOString().split("T")[0];
}

function calculateStreak(completionHistory: string[]): number {
    if (completionHistory.length === 0) return 0;
    const sortedDates = [...completionHistory].sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);
    const todayStr = toISODateString(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toISODateString(yesterday);
    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) return 0;
    if (sortedDates.includes(todayStr)) {
        currentDate = new Date(today);
    } else {
        currentDate = new Date(yesterday);
    }
    for (let i = 0; i < 365; i++) {
        const dateStr = toISODateString(currentDate);
        if (sortedDates.includes(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

// Dark Academia category colors
const CATEGORY_COLORS = {
    morning: {
        completed: "bg-[#D99E6B] border-[#D99E6B] text-white shadow-lg shadow-[rgba(217,158,107,0.2)]",
        default: "bg-[#2C2C2C] border-[rgba(255,255,255,0.05)] hover:border-[rgba(217,158,107,0.3)] hover:bg-[#303030]",
        icon: "bg-[rgba(217,158,107,0.2)]",
        iconColor: "text-[#D99E6B]",
    },
    evening: {
        completed: "bg-[#768C9E] border-[#768C9E] text-white shadow-lg shadow-[rgba(118,140,158,0.2)]",
        default: "bg-[#2C2C2C] border-[rgba(255,255,255,0.05)] hover:border-[rgba(118,140,158,0.3)] hover:bg-[#303030]",
        icon: "bg-[rgba(118,140,158,0.2)]",
        iconColor: "text-[#768C9E]",
    },
    anytime: {
        completed: "bg-[#8C9E78] border-[#8C9E78] text-white shadow-lg shadow-[rgba(140,158,120,0.2)]",
        default: "bg-[#2C2C2C] border-[rgba(255,255,255,0.05)] hover:border-[rgba(140,158,120,0.3)] hover:bg-[#303030]",
        icon: "bg-[rgba(140,158,120,0.2)]",
        iconColor: "text-[#8C9E78]",
    },
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface HabitCardProps {
    habit: TrackingHabit;
    isCompleted: boolean;
    onToggle: () => void;
    onArchive: () => void;
    showMiniHeatmap?: boolean;
}

function HabitCard({ habit, isCompleted, onToggle, onArchive, showMiniHeatmap = false }: HabitCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const Icon = getIcon(habit.icon);
    const streak = calculateStreak(habit.completionHistory);
    const colors = CATEGORY_COLORS[habit.category];

    const handleToggle = () => {
        if (!isCompleted) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 400);
        }
        onToggle();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleToggle}
            className={cn(
                "relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-300",
                isCompleted ? colors.completed : colors.default,
                isAnimating && "animate-pulse-grow"
            )}
        >
            {/* Menu Button */}
            <button
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className={cn(
                    "absolute top-3 right-3 p-2 rounded-lg transition-colors",
                    isCompleted ? "hover:bg-white/20 text-white/70 hover:text-white" : "hover:bg-[rgba(255,255,255,0.05)] text-[#5A5A5A] hover:text-[#9B9B9B]"
                )}
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-12 right-3 z-10 bg-[#202020] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl overflow-hidden"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => { onArchive(); setShowMenu(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-[#C87F76] hover:bg-[rgba(200,127,118,0.1)] transition-colors"
                        >
                            Arquivar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-start gap-4">
                {/* Icon with completion animation */}
                <div className={cn(
                    "relative p-3 rounded-lg transition-all duration-300",
                    isCompleted ? "bg-white/20" : colors.icon
                )}>
                    <AnimatePresence mode="wait">
                        {isCompleted ? (
                            <motion.div
                                key="check"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            >
                                <Check className="h-6 w-6 text-white" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="icon"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Icon className={cn("h-6 w-6", colors.iconColor)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn("font-semibold text-lg truncate", isCompleted ? "text-white" : "text-[#E3E3E3]")}>
                            {habit.name}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {streak > 0 && (
                            <motion.span
                                className={cn("flex items-center gap-1 text-sm font-medium", isCompleted ? "text-white/80" : "text-[#D99E6B]")}
                                animate={streak >= 7 ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.5, repeat: streak >= 7 ? Infinity : 0, repeatDelay: 2 }}
                            >
                                <Flame className="h-4 w-4" />
                                {streak} dias
                            </motion.span>
                        )}
                        {showMiniHeatmap && (
                            <div className="hidden sm:block">
                                <MiniHeatmap habit={habit} days={7} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Completion Pulse Effect */}
            {isAnimating && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-xl bg-[#8C9E78] pointer-events-none"
                />
            )}
        </motion.div>
    );
}

interface AddHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (habit: Omit<TrackingHabit, "id" | "completionHistory" | "createdAt" | "archived">) => void;
}

function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState<HabitCategory>("morning");
    const [frequency, setFrequency] = useState<HabitFrequency>("daily");
    const [selectedIcon, setSelectedIcon] = useState("Target");

    const iconOptions = [
        { name: "Target", icon: Target },
        { name: "Droplets", icon: Droplets },
        { name: "Dumbbell", icon: Dumbbell },
        { name: "BookOpen", icon: BookOpen },
        { name: "Heart", icon: Heart },
        { name: "PenLine", icon: PenLine },
        { name: "GlassWater", icon: GlassWater },
        { name: "MonitorOff", icon: MonitorOff },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ name: name.trim(), icon: selectedIcon, category, frequency });
        setName("");
        setCategory("morning");
        setFrequency("daily");
        setSelectedIcon("Target");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-[#202020] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.05)]">
                    <h2 className="font-serif text-xl font-medium text-[#E3E3E3]">Novo Hábito</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#9B9B9B] hover:text-[#E3E3E3] transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-[#9B9B9B] mb-2">Nome do Hábito</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Meditar 10 minutos"
                            className="w-full px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-xl text-[#E3E3E3] placeholder-[#5A5A5A] focus:border-[#CCAE70] outline-none transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-[#9B9B9B] mb-2">Ícone</label>
                        <div className="flex flex-wrap gap-2">
                            {iconOptions.map(({ name: iconName, icon: IconComponent }) => (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => setSelectedIcon(iconName)}
                                    className={cn(
                                        "p-3 rounded-xl border-2 transition-all",
                                        selectedIcon === iconName
                                            ? "border-[#CCAE70] bg-[rgba(204,174,112,0.15)] text-[#CCAE70]"
                                            : "border-[rgba(255,255,255,0.05)] bg-[#2C2C2C] text-[#9B9B9B] hover:border-[rgba(255,255,255,0.1)]"
                                    )}
                                >
                                    <IconComponent className="h-5 w-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-[#9B9B9B] mb-2">Categoria</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: "morning", label: "Manhã", icon: Sun, color: "#D99E6B" },
                                { value: "evening", label: "Noite", icon: Moon, color: "#768C9E" },
                                { value: "anytime", label: "Qualquer", icon: Calendar, color: "#8C9E78" },
                            ].map(({ value, label, icon: Icon, color }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setCategory(value as HabitCategory)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        category === value
                                            ? "border-current"
                                            : "border-[rgba(255,255,255,0.05)] bg-[#2C2C2C] text-[#9B9B9B] hover:border-[rgba(255,255,255,0.1)]"
                                    )}
                                    style={category === value ? { borderColor: color, backgroundColor: `${color}20`, color: color } : {}}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-sm font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium text-[#9B9B9B] mb-2">Frequência</label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                            className="w-full px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-xl text-[#E3E3E3] focus:border-[#CCAE70] outline-none"
                        >
                            <option value="daily">Todos os dias</option>
                            <option value="weekdays">Dias úteis (Seg-Sex)</option>
                            <option value="weekends">Finais de semana</option>
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-5 py-3 bg-[#2C2C2C] text-[#9B9B9B] rounded-xl font-medium hover:bg-[#3A3A3A] transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={!name.trim()} className="flex-1 px-5 py-3 bg-[#E3E3E3] text-[#191919] rounded-xl font-semibold hover:bg-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            <Plus className="h-5 w-5" />
                            Criar
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function HabitsPage() {
    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => toISODateString(today), [today]);

    const { habits, addHabit, toggleHabitDate, archiveHabit, isHydrated } = useHabits();
    const [showAddModal, setShowAddModal] = useState(false);
    const [matrixMonth, setMatrixMonth] = useState(today.getMonth());
    const [matrixYear, setMatrixYear] = useState(today.getFullYear());
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationType, setCelebrationType] = useState<"habit" | "allComplete">("habit");
    const [xpTrigger, setXpTrigger] = useState(0);

    const morningHabits = useMemo(() => habits.filter(h => h.category === "morning" && !h.archived), [habits]);
    const eveningHabits = useMemo(() => habits.filter(h => h.category === "evening" && !h.archived), [habits]);
    const anytimeHabits = useMemo(() => habits.filter(h => h.category === "anytime" && !h.archived), [habits]);

    const allTodayHabits = useMemo(() => [...morningHabits, ...eveningHabits, ...anytimeHabits], [morningHabits, eveningHabits, anytimeHabits]);
    const completedToday = useMemo(() => allTodayHabits.filter(h => h.completionHistory.includes(todayStr)).length, [allTodayHabits, todayStr]);

    const toggleHabitToday = useCallback((habitId: string) => {
        const habit = habits.find(h => h.id === habitId);
        const wasCompleted = habit?.completionHistory.includes(todayStr);

        toggleHabitDate(habitId, todayStr);

        // Trigger celebration if completing (not uncompleting)
        if (!wasCompleted) {
            setXpTrigger(prev => prev + 1);

            // Check if this completes all habits
            const newCompletedCount = completedToday + 1;
            if (newCompletedCount === allTodayHabits.length) {
                setCelebrationType("allComplete");
                setShowCelebration(true);
            }
        }
    }, [todayStr, toggleHabitDate, habits, completedToday, allTodayHabits.length]);

    const navigateMonth = (direction: -1 | 1) => {
        let newMonth = matrixMonth + direction;
        let newYear = matrixYear;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        else if (newMonth > 11) { newMonth = 0; newYear++; }
        setMatrixMonth(newMonth);
        setMatrixYear(newYear);
    };

    const goToCurrentMonth = () => {
        setMatrixMonth(today.getMonth());
        setMatrixYear(today.getFullYear());
    };

    const isCurrentMonth = matrixMonth === today.getMonth() && matrixYear === today.getFullYear();

    // Loading state
    if (!isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-[#CCAE70] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Celebration Overlay */}
            <CelebrationOverlay
                show={showCelebration}
                type={celebrationType}
                xpAmount={10}
                onComplete={() => setShowCelebration(false)}
            />

            {/* XP Toast */}
            <XPToastManager trigger={xpTrigger} amount={10} />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#191919]/80 backdrop-blur-lg border-b border-[rgba(255,255,255,0.05)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#E3E3E3] flex items-center gap-3">
                                <Target className="h-7 w-7 text-[#8C9E78]" />
                                Rastreamento de Hábitos
                            </h1>
                            <p className="text-[#9B9B9B] mt-1">
                                {today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#E3E3E3] text-[#191919] rounded-xl font-semibold hover:bg-[#D4D4D4] transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            Novo Hábito
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Hero Section */}
                <HabitsHeroSection />

                {/* Empty State */}
                {allTodayHabits.length === 0 && (
                    <Card className="border-dashed border-2 border-[rgba(255,255,255,0.1)]">
                        <CardContent className="p-12 text-center">
                            <Target className="h-16 w-16 mx-auto text-[#3A3A3A] mb-4" />
                            <h3 className="font-serif text-xl font-medium text-[#E3E3E3] mb-2">Nenhum hábito cadastrado</h3>
                            <p className="text-[#9B9B9B] mb-6">Comece criando seu primeiro hábito para rastrear sua consistência.</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E3E3E3] text-[#191919] rounded-xl font-semibold hover:bg-[#D4D4D4] transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                                Criar Primeiro Hábito
                            </button>
                        </CardContent>
                    </Card>
                )}

                {/* Habit Sections */}
                {allTodayHabits.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Morning */}
                        <Card className="border-[rgba(217,158,107,0.2)]">
                            <CardHeader className="p-5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[rgba(217,158,107,0.15)] rounded-xl"><Sun className="h-5 w-5 text-[#D99E6B]" /></div>
                                    <CardTitle className="text-xl font-sans">Rotina Matinal</CardTitle>
                                    <Badge variant="clay" className="ml-auto">{morningHabits.filter(h => h.completionHistory.includes(todayStr)).length}/{morningHabits.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {morningHabits.map(habit => (
                                        <HabitCard key={habit.id} habit={habit} isCompleted={habit.completionHistory.includes(todayStr)} onToggle={() => toggleHabitToday(habit.id)} onArchive={() => archiveHabit(habit.id)} showMiniHeatmap />
                                    ))}
                                </AnimatePresence>
                                {morningHabits.length === 0 && <div className="py-8 text-center text-[#5A5A5A]"><Sun className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Nenhum hábito matinal</p></div>}
                            </CardContent>
                        </Card>

                        {/* Evening */}
                        <Card className="border-[rgba(118,140,158,0.2)]">
                            <CardHeader className="p-5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[rgba(118,140,158,0.15)] rounded-xl"><Moon className="h-5 w-5 text-[#768C9E]" /></div>
                                    <CardTitle className="text-xl font-sans">Rotina Noturna</CardTitle>
                                    <Badge variant="slate" className="ml-auto">{eveningHabits.filter(h => h.completionHistory.includes(todayStr)).length}/{eveningHabits.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {eveningHabits.map(habit => (
                                        <HabitCard key={habit.id} habit={habit} isCompleted={habit.completionHistory.includes(todayStr)} onToggle={() => toggleHabitToday(habit.id)} onArchive={() => archiveHabit(habit.id)} showMiniHeatmap />
                                    ))}
                                </AnimatePresence>
                                {eveningHabits.length === 0 && <div className="py-8 text-center text-[#5A5A5A]"><Moon className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Nenhum hábito noturno</p></div>}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Anytime Habits */}
                {anytimeHabits.length > 0 && (
                    <Card className="border-[rgba(140,158,120,0.2)]">
                        <CardHeader className="p-5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[rgba(140,158,120,0.15)] rounded-xl"><Calendar className="h-5 w-5 text-[#8C9E78]" /></div>
                                <CardTitle className="text-xl font-sans">Qualquer Hora</CardTitle>
                                <Badge variant="olive" className="ml-auto">{anytimeHabits.filter(h => h.completionHistory.includes(todayStr)).length}/{anytimeHabits.length}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <AnimatePresence mode="popLayout">
                                    {anytimeHabits.map(habit => (
                                        <HabitCard key={habit.id} habit={habit} isCompleted={habit.completionHistory.includes(todayStr)} onToggle={() => toggleHabitToday(habit.id)} onArchive={() => archiveHabit(habit.id)} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Achievements Section */}
                {allTodayHabits.length > 0 && (
                    <Card className="border-[rgba(204,174,112,0.2)]">
                        <CardContent className="p-5">
                            <AchievementBadges habits={habits} />
                        </CardContent>
                    </Card>
                )}

                {/* Consistency Matrix */}
                {allTodayHabits.length > 0 && (
                    <Card>
                        <CardHeader className="p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#2C2C2C] rounded-xl"><Target className="h-5 w-5 text-[#9B9B9B]" /></div>
                                    <CardTitle className="text-xl font-sans">Matriz de Consistência</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => navigateMonth(-1)} className="p-2 rounded-xl bg-[#2C2C2C] hover:bg-[#3A3A3A] transition-colors"><ChevronLeft className="h-5 w-5 text-[#9B9B9B]" /></button>
                                    <button onClick={goToCurrentMonth} className={cn("px-4 py-2 rounded-xl font-medium transition-all capitalize", isCurrentMonth ? "bg-[rgba(204,174,112,0.15)] text-[#CCAE70] border border-[rgba(204,174,112,0.3)]" : "bg-[#2C2C2C] text-[#9B9B9B] hover:bg-[#3A3A3A]")}>
                                        {new Date(matrixYear, matrixMonth).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                                    </button>
                                    <button onClick={() => navigateMonth(1)} className="p-2 rounded-xl bg-[#2C2C2C] hover:bg-[#3A3A3A] transition-colors"><ChevronRight className="h-5 w-5 text-[#9B9B9B]" /></button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <HabitMatrix habits={habits} onToggleDate={toggleHabitDate} year={matrixYear} month={matrixMonth} />
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Add Habit Modal */}
            <AnimatePresence>
                {showAddModal && <AddHabitModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={addHabit} />}
            </AnimatePresence>

            {/* Floating Dock */}
            <FloatingDock />
        </div>
    );
}
