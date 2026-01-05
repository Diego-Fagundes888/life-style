"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { nanoid } from "nanoid";
import {
    db,
    migrateFromLocalStorage,
    type DBHabit,
    type DBTask,
    type DBWeeklyFocus,
} from "@/lib/db";
import { toISODateString } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

/** Status de sincronização */
export type SyncStatus = "idle" | "saving" | "saved" | "error" | "migrating";

// Re-export types for compatibility
export type TrackingHabit = DBHabit;
export type WeeklyTask = DBTask;

interface WeeklyFocus {
    weekStart: string;
    focus: string;
    rating?: number;
}

interface LifeSyncState {
    habits: DBHabit[];
    tasks: DBTask[];
    weeklyFocus: WeeklyFocus;
    isHydrated: boolean;
    syncStatus: SyncStatus;
    lastSaved: string | null;
    lastError: string | null;
    migrationStats: Record<string, number> | null;
}

interface LifeSyncActions {
    // Habits
    addHabit: (
        habit: Omit<DBHabit, "id" | "completionHistory" | "createdAt" | "archived">
    ) => Promise<void>;
    toggleHabitDate: (habitId: string, date: string) => Promise<void>;
    archiveHabit: (habitId: string) => Promise<void>;
    deleteHabit: (habitId: string) => Promise<void>;
    restoreHabit: (habitId: string) => Promise<void>;

    // Tasks
    addTask: (task: Omit<DBTask, "id">) => Promise<void>;
    toggleTask: (taskId: string) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    updateTaskDate: (taskId: string, date: string | null) => Promise<void>;

    // Weekly Focus
    setWeeklyFocus: (focus: string) => Promise<void>;
    setWeeklyRating: (rating: number) => Promise<void>;

    // Data Management
    clearAllData: () => Promise<void>;
    forceSync: () => void;
}

type LifeSyncContextValue = LifeSyncState & LifeSyncActions;

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_WEEKLY_FOCUS: WeeklyFocus = {
    weekStart: new Date().toISOString().split("T")[0],
    focus: "",
    rating: undefined,
};

// ============================================================================
// CONTEXT
// ============================================================================

const LifeSyncContext = createContext<LifeSyncContextValue | null>(null);

// ============================================================================
// HELPER
// ============================================================================

function generateId(prefix?: string): string {
    const id = nanoid(12);
    return prefix ? `${prefix}_${id}` : id;
}

function getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split("T")[0];
}

// ============================================================================
// PROVIDER
// ============================================================================

export function LifeSyncProvider({ children }: { children: React.ReactNode }) {
    const [isHydrated, setIsHydrated] = useState(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [migrationStats, setMigrationStats] = useState<Record<
        string,
        number
    > | null>(null);

    // ========================================================================
    // REACTIVE QUERIES (Live data from IndexedDB)
    // ========================================================================
    const habits = useLiveQuery(
        () => db.habits.filter((h) => !h.archived).toArray(),
        [],
        []
    );

    const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);

    const weekStart = getWeekStart();
    const weeklyFocusData = useLiveQuery(
        () => db.weeklyFocus.get(weekStart),
        [weekStart],
        undefined
    );

    const weeklyFocus: WeeklyFocus = weeklyFocusData ?? {
        ...DEFAULT_WEEKLY_FOCUS,
        weekStart,
    };

    // ========================================================================
    // INITIALIZATION & MIGRATION
    // ========================================================================
    useEffect(() => {
        async function init() {
            setSyncStatus("migrating");

            try {
                // Tentar migrar dados do LocalStorage
                const result = await migrateFromLocalStorage();

                if (
                    result.migrated &&
                    Object.keys(result.stats).length > 0
                ) {
                    setMigrationStats(result.stats);
                    console.log("[LifeSync] Migration stats:", result.stats);
                }

                setIsHydrated(true);
                setSyncStatus("idle");
            } catch (error) {
                console.error("[LifeSync] Init error:", error);
                setSyncStatus("error");
                setLastError(String(error));
                setIsHydrated(true);
            }
        }

        init();
    }, []);

    // ========================================================================
    // HABIT ACTIONS
    // ========================================================================
    const addHabit = useCallback(
        async (
            habitData: Omit<
                DBHabit,
                "id" | "completionHistory" | "createdAt" | "archived"
            >
        ) => {
            setSyncStatus("saving");
            try {
                const newHabit: DBHabit = {
                    ...habitData,
                    id: generateId("habit"),
                    completionHistory: [],
                    createdAt: toISODateString(new Date()),
                    archived: false,
                };
                await db.habits.add(newHabit);
                setLastSaved(new Date().toISOString());
                setSyncStatus("saved");
                setTimeout(() => setSyncStatus("idle"), 1000);
            } catch (error) {
                console.error("[LifeSync] addHabit error:", error);
                setSyncStatus("error");
                setLastError(String(error));
            }
        },
        []
    );

    const toggleHabitDate = useCallback(
        async (habitId: string, date: string) => {
            try {
                const habit = await db.habits.get(habitId);
                if (!habit) return;

                const hasDate = habit.completionHistory.includes(date);
                const newHistory = hasDate
                    ? habit.completionHistory.filter((d) => d !== date)
                    : [...habit.completionHistory, date];

                await db.habits.update(habitId, {
                    completionHistory: newHistory,
                });
            } catch (error) {
                console.error("[LifeSync] toggleHabitDate error:", error);
            }
        },
        []
    );

    const archiveHabit = useCallback(async (habitId: string) => {
        try {
            await db.habits.update(habitId, { archived: true });
        } catch (error) {
            console.error("[LifeSync] archiveHabit error:", error);
        }
    }, []);

    const restoreHabit = useCallback(async (habitId: string) => {
        try {
            await db.habits.update(habitId, { archived: false });
        } catch (error) {
            console.error("[LifeSync] restoreHabit error:", error);
        }
    }, []);

    const deleteHabit = useCallback(async (habitId: string) => {
        try {
            await db.habits.delete(habitId);
        } catch (error) {
            console.error("[LifeSync] deleteHabit error:", error);
        }
    }, []);

    // ========================================================================
    // TASK ACTIONS
    // ========================================================================
    const addTask = useCallback(async (taskData: Omit<DBTask, "id">) => {
        setSyncStatus("saving");
        try {
            const newTask: DBTask = {
                ...taskData,
                id: generateId("task"),
            };
            await db.tasks.add(newTask);
            setLastSaved(new Date().toISOString());
            setSyncStatus("saved");
            setTimeout(() => setSyncStatus("idle"), 1000);
        } catch (error) {
            console.error("[LifeSync] addTask error:", error);
            setSyncStatus("error");
            setLastError(String(error));
        }
    }, []);

    const toggleTask = useCallback(async (taskId: string) => {
        try {
            const task = await db.tasks.get(taskId);
            if (!task) return;
            await db.tasks.update(taskId, { completed: !task.completed });
        } catch (error) {
            console.error("[LifeSync] toggleTask error:", error);
        }
    }, []);

    const deleteTask = useCallback(async (taskId: string) => {
        try {
            await db.tasks.delete(taskId);
        } catch (error) {
            console.error("[LifeSync] deleteTask error:", error);
        }
    }, []);

    const updateTaskDate = useCallback(
        async (taskId: string, date: string | null) => {
            try {
                await db.tasks.update(taskId, { date });
            } catch (error) {
                console.error("[LifeSync] updateTaskDate error:", error);
            }
        },
        []
    );

    // ========================================================================
    // WEEKLY FOCUS ACTIONS
    // ========================================================================
    const setWeeklyFocusAction = useCallback(
        async (focus: string) => {
            try {
                const data: DBWeeklyFocus = {
                    id: weekStart,
                    weekStart,
                    focus,
                    rating: weeklyFocus.rating,
                };
                await db.weeklyFocus.put(data);
            } catch (error) {
                console.error("[LifeSync] setWeeklyFocus error:", error);
            }
        },
        [weekStart, weeklyFocus.rating]
    );

    const setWeeklyRating = useCallback(
        async (rating: number) => {
            try {
                const data: DBWeeklyFocus = {
                    id: weekStart,
                    weekStart,
                    focus: weeklyFocus.focus,
                    rating,
                };
                await db.weeklyFocus.put(data);
            } catch (error) {
                console.error("[LifeSync] setWeeklyRating error:", error);
            }
        },
        [weekStart, weeklyFocus.focus]
    );

    // ========================================================================
    // DATA MANAGEMENT
    // ========================================================================
    const clearAllData = useCallback(async () => {
        setSyncStatus("saving");
        try {
            // Limpar todas as tabelas
            await db.transaction(
                "rw",
                [db.habits, db.tasks, db.weeklyFocus],
                async () => {
                    await db.habits.clear();
                    await db.tasks.clear();
                    await db.weeklyFocus.clear();
                }
            );

            // Limpar flag de migração
            if (typeof window !== "undefined") {
                localStorage.removeItem("lifesync_indexeddb_migrated");
            }

            setSyncStatus("idle");
        } catch (error) {
            console.error("[LifeSync] clearAllData error:", error);
            setSyncStatus("error");
            setLastError(String(error));
        }
    }, []);

    const forceSync = useCallback(() => {
        // Com IndexedDB + useLiveQuery, os dados já são reativos
        // Este método é mantido para compatibilidade
        console.log("[LifeSync] forceSync called (no-op with IndexedDB)");
    }, []);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================
    const value = useMemo<LifeSyncContextValue>(
        () => ({
            // State
            habits: habits ?? [],
            tasks: tasks ?? [],
            weeklyFocus,
            isHydrated,
            syncStatus,
            lastSaved,
            lastError,
            migrationStats,
            // Habit Actions
            addHabit,
            toggleHabitDate,
            archiveHabit,
            deleteHabit,
            restoreHabit,
            // Task Actions
            addTask,
            toggleTask,
            deleteTask,
            updateTaskDate,
            // Weekly Focus Actions
            setWeeklyFocus: setWeeklyFocusAction,
            setWeeklyRating,
            // Data Management
            clearAllData,
            forceSync,
        }),
        [
            habits,
            tasks,
            weeklyFocus,
            isHydrated,
            syncStatus,
            lastSaved,
            lastError,
            migrationStats,
            addHabit,
            toggleHabitDate,
            archiveHabit,
            deleteHabit,
            restoreHabit,
            addTask,
            toggleTask,
            deleteTask,
            updateTaskDate,
            setWeeklyFocusAction,
            setWeeklyRating,
            clearAllData,
            forceSync,
        ]
    );

    return (
        <LifeSyncContext.Provider value={value}>
            {children}
        </LifeSyncContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useLifeSync(): LifeSyncContextValue {
    const context = useContext(LifeSyncContext);
    if (!context) {
        throw new Error("useLifeSync must be used within a LifeSyncProvider");
    }
    return context;
}

// ============================================================================
// SELECTOR HOOKS (Performance Optimized)
// ============================================================================

export function useHabits() {
    const {
        habits,
        addHabit,
        toggleHabitDate,
        archiveHabit,
        deleteHabit,
        restoreHabit,
        isHydrated,
    } = useLifeSync();
    return {
        habits,
        addHabit,
        toggleHabitDate,
        archiveHabit,
        deleteHabit,
        restoreHabit,
        isHydrated,
    };
}

export function useTasks() {
    const {
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        updateTaskDate,
        isHydrated,
    } = useLifeSync();
    return { tasks, addTask, toggleTask, deleteTask, updateTaskDate, isHydrated };
}

export function useWeeklyFocus() {
    const { weeklyFocus, setWeeklyFocus, setWeeklyRating, isHydrated } =
        useLifeSync();
    return { weeklyFocus, setWeeklyFocus, setWeeklyRating, isHydrated };
}

export function useSyncStatus() {
    const { syncStatus, lastSaved, lastError, forceSync } = useLifeSync();
    return { syncStatus, lastSaved, lastError, forceSync };
}
