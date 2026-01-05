"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTasks, useWeeklyFocus } from "@/context/LifeSyncContext";
import type { WeeklyTask, TaskCategory } from "@/lib/mock-data";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    GripVertical,
    Check,
    Lock,
    Target,
    Star,
    ChevronDown,
    ChevronUp,
    Inbox,
    Calendar,
    Clock,
    Briefcase,
    Heart,
    User,
    BookOpen,
    Wallet,
    X,
    Trash2,
    Loader2,
} from "lucide-react";

// ============================================================================
// CONSTANTS & HELPERS - Dark Academia Palette
// ============================================================================

const DAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_NAMES_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// Dark Academia category colors
const CATEGORY_CONFIG: Record<TaskCategory, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
    work: { color: "text-[#768C9E]", bgColor: "bg-[rgba(118,140,158,0.2)]", icon: Briefcase, label: "Trabalho" },      // slate
    health: { color: "text-[#C87F76]", bgColor: "bg-[rgba(200,127,118,0.2)]", icon: Heart, label: "Saúde" },           // rust
    personal: { color: "text-[#D99E6B]", bgColor: "bg-[rgba(217,158,107,0.2)]", icon: User, label: "Pessoal" },        // clay
    learning: { color: "text-[#8C9E78]", bgColor: "bg-[rgba(140,158,120,0.2)]", icon: BookOpen, label: "Aprendizado" }, // olive
    finance: { color: "text-[#CCAE70]", bgColor: "bg-[rgba(204,174,112,0.2)]", icon: Wallet, label: "Finanças" },      // gold
};

const CATEGORIES: TaskCategory[] = ["work", "health", "personal", "learning", "finance"];

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getWeekDays(weekStart: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });
}

function toISODateString(date: Date): string {
    return date.toISOString().split("T")[0];
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TaskCardProps {
    task: WeeklyTask;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
    const config = CATEGORY_CONFIG[task.category];
    const CategoryIcon = config.icon;

    if (task.isRoutine) {
        return (
            <div className="group flex items-center gap-4 px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-dashed border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)] transition-all">
                <div className="flex items-center gap-3 text-[#5A5A5A]">
                    <Lock className="h-4 w-4" />
                    {task.time && (
                        <span className="font-mono text-sm bg-[#2C2C2C] px-2 py-1 rounded-lg">
                            {task.time}
                        </span>
                    )}
                </div>
                <span className="text-base text-[#9B9B9B] italic flex-1">{task.title}</span>
                <span className={cn("px-3 py-1 rounded-lg text-xs font-medium", config.bgColor, config.color)}>
                    {config.label}
                </span>
                <button
                    onClick={() => onDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-[rgba(200,127,118,0.2)] text-[#5A5A5A] hover:text-[#C87F76] transition-all"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className={cn(
            "group flex items-center gap-4 px-4 py-3 rounded-lg transition-all",
            "bg-[#2C2C2C] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] hover:bg-[#303030]",
            task.completed && "opacity-50"
        )}>
            {/* Drag Handle */}
            <GripVertical className="h-5 w-5 text-[#3A3A3A] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

            {/* Checkbox */}
            <button
                onClick={() => onToggle(task.id)}
                className={cn(
                    "shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    task.completed
                        ? "bg-[rgba(140,158,120,0.2)] border-[#8C9E78] text-[#8C9E78]"
                        : "border-[#5A5A5A] hover:border-[#CCAE70]"
                )}
            >
                {task.completed && <Check className="h-4 w-4" />}
            </button>

            {/* Title */}
            <span className={cn(
                "flex-1 text-base font-medium text-[#E3E3E3]",
                task.completed && "line-through text-[#5A5A5A]"
            )}>
                {task.title}
            </span>

            {/* Category */}
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", config.bgColor)}>
                <CategoryIcon className={cn("h-4 w-4", config.color)} />
                <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
            </div>

            {/* Scheduled Time */}
            {task.time && (
                <div className="flex items-center gap-2 text-[#CCAE70] text-sm bg-[rgba(204,174,112,0.1)] px-3 py-1.5 rounded-lg font-mono">
                    <Clock className="h-4 w-4" />
                    {task.time}
                </div>
            )}

            {/* Delete */}
            <button
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-[rgba(200,127,118,0.2)] text-[#5A5A5A] hover:text-[#C87F76] transition-all"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}

interface AddTaskFormProps {
    onAdd: (task: Omit<WeeklyTask, "id">) => void;
    onCancel: () => void;
    targetDate: string | null;
    isRoutine?: boolean;
}

function AddTaskForm({ onAdd, onCancel, targetDate, isRoutine = false }: AddTaskFormProps) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<TaskCategory>("personal");
    const [time, setTime] = useState("09:00");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onAdd({
            title: title.trim(),
            date: isRoutine ? "ROUTINE" : targetDate,
            completed: false,
            category,
            estimatedMinutes: 30,
            isRoutine,
            time: time,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-[rgba(204,174,112,0.3)] bg-[rgba(204,174,112,0.05)]">
            {/* Time Picker */}
            <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#CCAE70]" />
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-32 px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-base text-[#E3E3E3] focus:border-[#CCAE70] outline-none"
                />
            </div>

            {/* Title */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isRoutine ? "Nome da rotina..." : "Título da tarefa..."}
                className="flex-1 min-w-[200px] px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-base text-[#E3E3E3] placeholder-[#5A5A5A] focus:border-[#CCAE70] outline-none"
                autoFocus
            />

            {/* Category */}
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-base text-[#E3E3E3] focus:border-[#CCAE70] outline-none cursor-pointer"
            >
                {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                ))}
            </select>

            {/* Actions */}
            <button
                type="submit"
                disabled={!title.trim()}
                className="px-6 py-3 bg-[#E3E3E3] text-[#191919] rounded-lg text-base font-semibold hover:bg-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Adicionar
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-[#2C2C2C] text-[#9B9B9B] rounded-lg text-base font-medium hover:bg-[#3A3A3A] transition-colors"
            >
                Cancelar
            </button>
        </form>
    );
}

interface DayTabProps {
    date: Date;
    isSelected: boolean;
    isToday: boolean;
    taskCount: number;
    completedCount: number;
    onClick: () => void;
}

function DayTab({ date, isSelected, isToday, taskCount, completedCount, onClick }: DayTabProps) {
    const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center px-4 py-3 rounded-lg transition-all min-w-[100px]",
                isSelected
                    ? isToday
                        ? "bg-[rgba(204,174,112,0.15)] border-2 border-[#CCAE70]"
                        : "bg-[#2C2C2C] border-2 border-[#5A5A5A]"
                    : "bg-[rgba(255,255,255,0.02)] border-2 border-transparent hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.05)]",
                isToday && !isSelected && "border-[rgba(204,174,112,0.3)]"
            )}
        >
            <span className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                isSelected ? (isToday ? "text-[#CCAE70]" : "text-[#E3E3E3]") : "text-[#5A5A5A]"
            )}>
                {DAY_NAMES_SHORT[date.getDay()]}
            </span>
            <span className={cn(
                "text-2xl font-bold",
                isSelected ? (isToday ? "text-[#CCAE70]" : "text-[#E3E3E3]") : "text-[#9B9B9B]"
            )}>
                {date.getDate()}
            </span>
            {taskCount > 0 && (
                <div className="flex items-center gap-1 mt-1">
                    <div className="w-8 h-1 bg-[#2C2C2C] rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full", isToday ? "bg-[#CCAE70]" : "bg-[#8C9E78]")}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-[#5A5A5A]">{completedCount}/{taskCount}</span>
                </div>
            )}
            {isToday && (
                <span className="mt-1 px-2 py-0.5 bg-[#CCAE70] text-[#191919] text-xs font-semibold rounded">
                    HOJE
                </span>
            )}
        </button>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface WeeklyPlannerProps {
    externalSelectedDayIndex?: number;
    onExternalDayChange?: (index: number) => void;
    externalWeekStart?: Date;
    onExternalWeekChange?: (date: Date) => void;
}

export function WeeklyPlanner({
    externalSelectedDayIndex,
    onExternalDayChange,
    externalWeekStart,
    onExternalWeekChange,
}: WeeklyPlannerProps = {}) {
    const { tasks, addTask: contextAddTask, toggleTask: contextToggleTask, deleteTask: contextDeleteTask, isHydrated } = useTasks();
    const { weeklyFocus, setWeeklyFocus: contextSetFocus, setWeeklyRating: contextSetRating } = useWeeklyFocus();

    // Use external state if provided, otherwise use internal state
    const [internalWeekStart, setInternalWeekStart] = useState(() => getWeekStart(new Date()));
    const [internalSelectedDayIndex, setInternalSelectedDayIndex] = useState(() => {
        const today = new Date();
        const weekStart = getWeekStart(today);
        const diff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, Math.min(6, diff));
    });

    // Controlled vs uncontrolled state
    const currentWeekStart = externalWeekStart ?? internalWeekStart;
    const selectedDayIndex = externalSelectedDayIndex ?? internalSelectedDayIndex;

    const setCurrentWeekStart = (value: Date | ((prev: Date) => Date)) => {
        const newValue = typeof value === 'function' ? value(currentWeekStart) : value;
        if (onExternalWeekChange) {
            onExternalWeekChange(newValue);
        } else {
            setInternalWeekStart(newValue);
        }
    };

    const setSelectedDayIndex = (index: number) => {
        if (onExternalDayChange) {
            onExternalDayChange(index);
        } else {
            setInternalSelectedDayIndex(index);
        }
    };

    const [showRoutine, setShowRoutine] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [reflectionOpen, setReflectionOpen] = useState(false);
    const [weekRating, setWeekRating] = useState<number>(weeklyFocus.rating || 0);
    const [showAddTask, setShowAddTask] = useState(false);
    const [showAddRoutine, setShowAddRoutine] = useState(false);
    const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null);

    const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
    const today = useMemo(() => toISODateString(new Date()), []);
    const selectedDate = weekDays[selectedDayIndex];
    const selectedDateStr = toISODateString(selectedDate);
    const isSelectedToday = selectedDateStr === today;

    const backlogTasks = useMemo(() =>
        tasks.filter(t => t.date === null && !t.isRoutine),
        [tasks]);

    const routineTasks = useMemo(() =>
        tasks.filter(t => t.isRoutine),
        [tasks]);

    const getTasksForDate = useCallback((date: Date) => {
        const dateStr = toISODateString(date);
        return tasks.filter(t => t.date === dateStr && !t.isRoutine);
    }, [tasks]);

    const selectedDayTasks = useMemo(() => getTasksForDate(selectedDate), [selectedDate, getTasksForDate]);

    const navigateWeek = (direction: -1 | 1) => {
        setCurrentWeekStart(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + (direction * 7));
            return newDate;
        });
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(getWeekStart(new Date()));
        const today = new Date();
        const weekStart = getWeekStart(today);
        const diff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        setSelectedDayIndex(Math.max(0, Math.min(6, diff)));
    };

    const toggleTask = (id: string) => {
        contextToggleTask(id);
    };

    const deleteTask = (id: string) => {
        contextDeleteTask(id);
    };

    const addTask = (taskData: Omit<WeeklyTask, "id">) => {
        contextAddTask(taskData);
        setShowAddTask(false);
        setShowAddRoutine(false);
    };

    const addBacklogTask = () => {
        if (!newTaskTitle.trim()) return;
        addTask({
            title: newTaskTitle.trim(),
            date: null,
            completed: false,
            category: "personal",
            estimatedMinutes: 30,
            isRoutine: false,
        });
        setNewTaskTitle("");
    };

    const weekRangeLabel = useMemo(() => {
        const endOfWeek = new Date(currentWeekStart);
        endOfWeek.setDate(currentWeekStart.getDate() + 6);
        const startDay = currentWeekStart.getDate();
        const endDay = endOfWeek.getDate();
        const monthStart = currentWeekStart.toLocaleDateString("pt-BR", { month: "short" });
        const monthEnd = endOfWeek.toLocaleDateString("pt-BR", { month: "short" });
        if (monthStart === monthEnd) {
            return `${startDay} - ${endDay} de ${monthStart}`;
        }
        return `${startDay} ${monthStart} - ${endDay} ${monthEnd}`;
    }, [currentWeekStart]);

    const isCurrentWeek = useMemo(() => {
        const actualWeekStart = getWeekStart(new Date());
        return currentWeekStart.getTime() === actualWeekStart.getTime();
    }, [currentWeekStart]);

    // Loading state
    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-[#CCAE70] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* ================================================================
                HEADER - Navigation + Focus
            ================================================================ */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Week Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigateWeek(-1)}
                        className="p-3 rounded-lg bg-[#2C2C2C] hover:bg-[#3A3A3A] transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5 text-[#9B9B9B]" />
                    </button>
                    <button
                        onClick={goToCurrentWeek}
                        className={cn(
                            "px-6 py-3 rounded-lg font-semibold transition-all",
                            isCurrentWeek
                                ? "bg-[rgba(204,174,112,0.15)] text-[#CCAE70] border-2 border-[rgba(204,174,112,0.3)]"
                                : "bg-[#2C2C2C] text-[#9B9B9B] border-2 border-transparent hover:bg-[#3A3A3A]"
                        )}
                    >
                        {weekRangeLabel}
                    </button>
                    <button
                        onClick={() => navigateWeek(1)}
                        className="p-3 rounded-lg bg-[#2C2C2C] hover:bg-[#3A3A3A] transition-colors"
                    >
                        <ChevronRight className="h-5 w-5 text-[#9B9B9B]" />
                    </button>
                </div>

                {/* Weekly Focus */}
                <div className="flex-1 flex items-center gap-3 w-full lg:w-auto">
                    <Target className="h-5 w-5 text-[#CCAE70] shrink-0" />
                    <input
                        type="text"
                        value={weeklyFocus.focus}
                        onChange={(e) => contextSetFocus(e.target.value)}
                        placeholder="Meta da semana..."
                        className="flex-1 px-4 py-3 bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,255,255,0.05)] rounded-lg text-base text-[#E3E3E3] placeholder-[#5A5A5A] focus:border-[#CCAE70] outline-none transition-all"
                    />
                </div>

                {/* Routine Toggle */}
                <button
                    onClick={() => setShowRoutine(!showRoutine)}
                    className={cn(
                        "flex items-center gap-3 px-5 py-3 rounded-lg font-medium transition-all",
                        showRoutine
                            ? "bg-[rgba(204,174,112,0.15)] text-[#CCAE70] border-2 border-[rgba(204,174,112,0.3)]"
                            : "bg-[#2C2C2C] text-[#9B9B9B] border-2 border-transparent hover:text-[#E3E3E3]"
                    )}
                >
                    <Lock className="h-5 w-5" />
                    <span>Rotina</span>
                    <div className={cn(
                        "w-12 h-6 rounded-full relative transition-colors",
                        showRoutine ? "bg-[#CCAE70]" : "bg-[#3A3A3A]"
                    )}>
                        <div className={cn(
                            "absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow",
                            showRoutine ? "translate-x-6" : "translate-x-0.5"
                        )} />
                    </div>
                </button>
            </div>

            {/* ================================================================
                DAY TABS - Horizontal Selection
            ================================================================ */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {weekDays.map((date, index) => {
                    const dateStr = toISODateString(date);
                    const dayTasks = getTasksForDate(date);
                    const completed = dayTasks.filter(t => t.completed).length;

                    return (
                        <DayTab
                            key={dateStr}
                            date={date}
                            isSelected={index === selectedDayIndex}
                            isToday={dateStr === today}
                            taskCount={dayTasks.length}
                            completedCount={completed}
                            onClick={() => setSelectedDayIndex(index)}
                        />
                    );
                })}
            </div>

            {/* ================================================================
                MAIN CONTENT - Two Columns
            ================================================================ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Brain Dump */}
                <Card className="xl:col-span-1 border-[rgba(217,158,107,0.2)]">
                    <CardHeader className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[rgba(217,158,107,0.15)] rounded-lg">
                                <Inbox className="h-5 w-5 text-[#D99E6B]" />
                            </div>
                            <CardTitle className="text-xl font-sans">Inbox</CardTitle>
                            <Badge variant="clay" className="ml-auto text-base px-3 py-1">{backlogTasks.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addBacklogTask()}
                                placeholder="Nova ideia..."
                                className="flex-1 px-4 py-3 bg-[#2C2C2C] border-2 border-[rgba(255,255,255,0.05)] rounded-lg text-base text-[#E3E3E3] placeholder-[#5A5A5A] focus:border-[#D99E6B] outline-none transition-all"
                            />
                            <button
                                onClick={addBacklogTask}
                                disabled={!newTaskTitle.trim()}
                                className="p-3 rounded-lg bg-[rgba(217,158,107,0.15)] text-[#D99E6B] hover:bg-[rgba(217,158,107,0.25)] disabled:opacity-50 transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto hide-scrollbar">
                            {backlogTasks.map(task => (
                                <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                            ))}
                            {backlogTasks.length === 0 && (
                                <div className="flex flex-col items-center py-12 text-[#5A5A5A]">
                                    <Inbox className="h-12 w-12 mb-3 opacity-30" />
                                    <p className="text-base">Inbox vazio</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Selected Day */}
                <Card className={cn(
                    "xl:col-span-2 transition-all",
                    isSelectedToday
                        ? "border-[rgba(204,174,112,0.2)]"
                        : "border-[rgba(255,255,255,0.05)]"
                )}>
                    <CardHeader className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-3 rounded-lg",
                                    isSelectedToday ? "bg-[rgba(204,174,112,0.15)]" : "bg-[#2C2C2C]"
                                )}>
                                    <Calendar className={cn("h-6 w-6", isSelectedToday ? "text-[#CCAE70]" : "text-[#9B9B9B]")} />
                                </div>
                                <div>
                                    <h2 className="font-serif text-2xl font-medium text-[#E3E3E3]">
                                        {DAY_NAMES_FULL[selectedDate.getDay()]}
                                    </h2>
                                    <p className="text-[#9B9B9B]">
                                        {selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                </div>
                                {isSelectedToday && (
                                    <Badge variant="gold" className="text-base px-4 py-1.5">HOJE</Badge>
                                )}
                            </div>

                            <button
                                onClick={() => setShowAddTask(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-[#E3E3E3] text-[#191919] rounded-lg font-semibold hover:bg-[#D4D4D4] transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                                Nova Tarefa
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-6">
                        {/* Add Task Form */}
                        {showAddTask && (
                            <AddTaskForm
                                onAdd={addTask}
                                onCancel={() => setShowAddTask(false)}
                                targetDate={selectedDateStr}
                            />
                        )}

                        {/* Routine Section */}
                        {showRoutine && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-[#9B9B9B] uppercase tracking-wide flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Rotina Base
                                    </h3>
                                    {!showAddRoutine && (
                                        <button
                                            onClick={() => setShowAddRoutine(true)}
                                            className="text-sm text-[#5A5A5A] hover:text-[#9B9B9B] flex items-center gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Adicionar
                                        </button>
                                    )}
                                </div>

                                {showAddRoutine && (
                                    <AddTaskForm
                                        onAdd={addTask}
                                        onCancel={() => setShowAddRoutine(false)}
                                        targetDate="ROUTINE"
                                        isRoutine
                                    />
                                )}

                                <div className="space-y-2">
                                    {routineTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tasks Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[#9B9B9B] uppercase tracking-wide flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                Tarefas do Dia
                                {selectedDayTasks.length > 0 && (
                                    <span className="ml-2 text-[#5A5A5A]">
                                        ({selectedDayTasks.filter(t => t.completed).length}/{selectedDayTasks.length})
                                    </span>
                                )}
                            </h3>

                            {selectedDayTasks.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedDayTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                                    ))}
                                </div>
                            ) : (
                                <div
                                    onClick={() => setShowAddTask(true)}
                                    className="flex flex-col items-center py-16 text-[#5A5A5A] border-2 border-dashed border-[rgba(255,255,255,0.05)] rounded-lg hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer transition-all"
                                >
                                    <Calendar className="h-12 w-12 mb-3 opacity-30" />
                                    <p className="text-base font-medium">Nenhuma tarefa</p>
                                    <p className="text-sm text-[#3A3A3A] mt-1">Clique para adicionar</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ================================================================
                REFLECTION FOOTER
            ================================================================ */}
            <Card>
                <button
                    onClick={() => setReflectionOpen(!reflectionOpen)}
                    className="w-full p-5 flex items-center justify-between hover:bg-[rgba(255,255,255,0.02)] transition-colors rounded-lg"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-[rgba(217,158,107,0.15)] rounded-lg">
                            <Star className="h-5 w-5 text-[#D99E6B]" />
                        </div>
                        <span className="font-serif text-lg font-medium text-[#E3E3E3]">Reflexão Semanal</span>
                    </div>
                    {reflectionOpen ? (
                        <ChevronUp className="h-6 w-6 text-[#5A5A5A]" />
                    ) : (
                        <ChevronDown className="h-6 w-6 text-[#5A5A5A]" />
                    )}
                </button>

                {reflectionOpen && (
                    <CardContent className="px-5 pb-5 pt-0 border-t border-[rgba(255,255,255,0.05)]">
                        <div className="pt-5">
                            <p className="text-base text-[#9B9B9B] mb-4">Eu segui o plano esta semana?</p>
                            <div className="flex flex-wrap items-center gap-3">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setWeekRating(star)}
                                        className="p-2 transition-transform hover:scale-110"
                                    >
                                        <Star className={cn(
                                            "h-12 w-12 transition-colors",
                                            star <= weekRating
                                                ? "fill-[#D99E6B] text-[#D99E6B]"
                                                : "text-[#3A3A3A] hover:text-[#5A5A5A]"
                                        )} />
                                    </button>
                                ))}
                                {weekRating > 0 && (
                                    <span className="text-lg text-[#E3E3E3] font-medium ml-4">
                                        {weekRating === 5 ? "🎉 Excelente!" :
                                            weekRating === 4 ? "👍 Muito bom!" :
                                                weekRating === 3 ? "😐 Regular" :
                                                    weekRating === 2 ? "📈 Precisa melhorar" :
                                                        "💪 Semana difícil"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
