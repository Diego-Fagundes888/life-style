/**
 * IndexedDB Database Layer usando Dexie.js
 *
 * Este módulo fornece:
 * - Schema completo para todas as entidades do Life Sync
 * - Migrações automáticas entre versões
 * - Hooks React para queries reativas
 * - Suporte a sync cross-tab nativo
 */

import Dexie, { type EntityTable } from "dexie";

// ============================================================================
// TYPES - Entidades do Banco de Dados
// ============================================================================

/** Hábito com histórico de completação */
export interface DBHabit {
    id: string;
    name: string;
    icon: string;
    category: "morning" | "evening" | "anytime";
    frequency: "daily" | "weekdays" | "weekends" | "custom";
    customDays?: number[];
    completionHistory: string[];
    createdAt: string;
    archived: boolean;
}

/** Tarefa semanal */
export interface DBTask {
    id: string;
    title: string;
    date: string | null;
    completed: boolean;
    category: "work" | "health" | "personal" | "learning" | "finance";
    estimatedMinutes: number;
    isRoutine: boolean;
    time?: string;
}

/** Foco semanal */
export interface DBWeeklyFocus {
    id: string;
    weekStart: string;
    focus: string;
    rating?: number;
}

/** Meta individual */
export interface DBGoal {
    id: string;
    categoryId: string;
    title: string;
    type: "binary" | "numeric";
    current: number;
    target: number;
    unit?: string;
    createdAt: string;
}

/** Categoria de metas */
export interface DBGoalCategory {
    id: string;
    title: string;
    icon: string;
    color: string;
    order: number;
}

/** Sonho (Bucket List) - Alinhado com Dream interface */
export interface DBDream {
    id: string;
    title: string;
    description?: string;
    category: string;
    status: "pending" | "in-progress" | "completed";
    image: string;
    realImage?: string;
    estimatedCost?: number;
    motivation?: string;
    steps: { id: string; title: string; completed: boolean }[];
    completedDate?: string;
    createdAt: string;
    updatedAt: string;
}

/** Dados de área de vida (Life Summary) */
export interface DBLifeAreaData {
    id: string; // lifeAreaId
    currentState: string;
    desiredState: string;
    obstacles: string;
    actions: string;
    score: number;
    goals: { id: string; text: string; completed: boolean }[];
    reflectionAnswers: Record<string, string>;
    imageUrl?: string;
    updatedAt: string;
}

/** Review mensal */
export interface DBMonthlyReview {
    id: string; // "YYYY-MM"
    month: number;
    year: number;
    pillars: Record<
        string,
        {
            metrics: Record<string, number>;
            answers: Record<string, string>;
        }
    >;
    finalized: boolean;
    updatedAt: string;
}

/** Configurações do usuário */
export interface DBSettings {
    id: string;
    key: string;
    value: unknown;
    updatedAt: string;
}

/** Perfil do usuário */
export interface DBUserProfile {
    id: string;
    name: string;
    yearlyGoal: string;
    wordOfYear: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

/** Dados financeiros */
export interface DBFinanceData {
    id: string;
    currentBalance: number;
    monthlyBudget: number;
    monthlySpent: number;
    savingsGoal: number;
    currentSavings: number;
    updatedAt: string;
}

/** Alocação de ativos */
export interface DBAssetAllocation {
    id: string;
    name: string;
    percentage: number;
    color: string;
    order: number;
}

/** Histórico de Life Score */
export interface DBLifeScoreHistory {
    id: string;
    date: string;
    scores: Record<string, number>;
    overallScore: number;
}

/** Conquistas do usuário */
export interface DBAchievement {
    id: string;
    achievementId: string;
    unlockedAt: string;
    category: string;
}

/** Notificações */
export interface DBNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

// ============================================================================
// DATABASE CLASS
// ============================================================================

export class LifeSyncDB extends Dexie {
    habits!: EntityTable<DBHabit, "id">;
    tasks!: EntityTable<DBTask, "id">;
    weeklyFocus!: EntityTable<DBWeeklyFocus, "id">;
    goals!: EntityTable<DBGoal, "id">;
    goalCategories!: EntityTable<DBGoalCategory, "id">;
    dreams!: EntityTable<DBDream, "id">;
    lifeAreas!: EntityTable<DBLifeAreaData, "id">;
    monthlyReviews!: EntityTable<DBMonthlyReview, "id">;
    settings!: EntityTable<DBSettings, "id">;
    userProfile!: EntityTable<DBUserProfile, "id">;
    financeData!: EntityTable<DBFinanceData, "id">;
    assetAllocations!: EntityTable<DBAssetAllocation, "id">;
    lifeScoreHistory!: EntityTable<DBLifeScoreHistory, "id">;
    achievements!: EntityTable<DBAchievement, "id">;
    notifications!: EntityTable<DBNotification, "id">;

    constructor() {
        super("LifeSyncDB");

        // Schema versão 1
        this.version(1).stores({
            habits: "id, category, archived, createdAt",
            tasks: "id, date, completed, category",
            weeklyFocus: "id, weekStart",
            goals: "id, categoryId, type",
            goalCategories: "id, order",
            dreams: "id, category, status, priority, createdAt",
            lifeAreas: "id, updatedAt",
            monthlyReviews: "id, month, year, finalized",
            settings: "id, key",
            userProfile: "id",
            financeData: "id",
            assetAllocations: "id, order",
            lifeScoreHistory: "id, date",
            achievements: "id, achievementId, category, unlockedAt",
            notifications: "id, type, read, createdAt",
        });
    }
}

// Singleton instance
export const db = new LifeSyncDB();

// ============================================================================
// MIGRATION FROM LOCALSTORAGE
// ============================================================================

interface PersistedData<T> {
    version?: number;
    data: T;
    savedAt?: string;
}

/**
 * Migra dados do LocalStorage para IndexedDB.
 * Executa apenas uma vez na primeira inicialização.
 */
export async function migrateFromLocalStorage(): Promise<{
    migrated: boolean;
    stats: Record<string, number>;
}> {
    const MIGRATION_KEY = "lifesync_indexeddb_migrated";
    const stats: Record<string, number> = {};

    // Verificar se já migrou
    if (typeof window === "undefined") {
        return { migrated: false, stats };
    }

    if (localStorage.getItem(MIGRATION_KEY) === "true") {
        return { migrated: true, stats };
    }

    console.log("[DB] Starting migration from LocalStorage...");

    try {
        // Migrar Habits
        const habitsRaw = localStorage.getItem("lifesync_habits");
        if (habitsRaw) {
            const parsed = JSON.parse(habitsRaw) as PersistedData<DBHabit[]>;
            const habits = parsed.data ?? (parsed as unknown as DBHabit[]);
            if (Array.isArray(habits) && habits.length > 0) {
                await db.habits.bulkPut(habits);
                stats.habits = habits.length;
            }
        }

        // Migrar Tasks
        const tasksRaw = localStorage.getItem("lifesync_tasks");
        if (tasksRaw) {
            const parsed = JSON.parse(tasksRaw) as PersistedData<DBTask[]>;
            const tasks = parsed.data ?? (parsed as unknown as DBTask[]);
            if (Array.isArray(tasks) && tasks.length > 0) {
                await db.tasks.bulkPut(tasks);
                stats.tasks = tasks.length;
            }
        }

        // Migrar Weekly Focus
        const focusRaw = localStorage.getItem("lifesync_weekly_focus");
        if (focusRaw) {
            const parsed = JSON.parse(focusRaw) as PersistedData<DBWeeklyFocus>;
            const focus = parsed.data ?? (parsed as unknown as DBWeeklyFocus);
            if (focus && focus.weekStart) {
                await db.weeklyFocus.put({ ...focus, id: focus.weekStart });
                stats.weeklyFocus = 1;
            }
        }

        // Migrar Goals (formato antigo)
        const goalsRaw = localStorage.getItem("life-sync-goals-v2");
        if (goalsRaw) {
            interface OldGoalCategory {
                id: string;
                title: string;
                icon: string;
                color: string;
                goals: Array<{
                    id: string;
                    title: string;
                    type: "binary" | "numeric";
                    current: number;
                    target: number;
                    unit?: string;
                }>;
            }
            const categories = JSON.parse(goalsRaw) as OldGoalCategory[];
            if (Array.isArray(categories)) {
                let goalCount = 0;
                for (let i = 0; i < categories.length; i++) {
                    const cat = categories[i];
                    await db.goalCategories.put({
                        id: cat.id,
                        title: cat.title,
                        icon: cat.icon,
                        color: cat.color,
                        order: i,
                    });

                    for (const goal of cat.goals) {
                        await db.goals.put({
                            ...goal,
                            categoryId: cat.id,
                            createdAt: new Date().toISOString(),
                        });
                        goalCount++;
                    }
                }
                stats.goalCategories = categories.length;
                stats.goals = goalCount;
            }
        }

        // Migrar Word of Year
        const wordRaw = localStorage.getItem("life-sync-word");
        if (wordRaw) {
            const existingProfile = await db.userProfile.get("default");
            await db.userProfile.put({
                id: "default",
                name: existingProfile?.name ?? "",
                yearlyGoal: existingProfile?.yearlyGoal ?? "",
                wordOfYear: wordRaw,
                createdAt: existingProfile?.createdAt ?? new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }

        // Migrar Life Summary
        const lifeSummaryRaw = localStorage.getItem("life-sync-life-summary");
        if (lifeSummaryRaw) {
            const areas = JSON.parse(lifeSummaryRaw) as Record<string, DBLifeAreaData>;
            if (areas && typeof areas === "object") {
                let count = 0;
                for (const [id, data] of Object.entries(areas)) {
                    await db.lifeAreas.put({
                        ...data,
                        id,
                        updatedAt: new Date().toISOString(),
                    });
                    count++;
                }
                stats.lifeAreas = count;
            }
        }

        // Migrar Bucket List
        const bucketRaw = localStorage.getItem("life-sync-bucket-list");
        if (bucketRaw) {
            const dreams = JSON.parse(bucketRaw) as DBDream[];
            if (Array.isArray(dreams) && dreams.length > 0) {
                await db.dreams.bulkPut(dreams);
                stats.dreams = dreams.length;
            }
        }

        // Migrar Reviews
        const reviewPattern = /^life-sync-review-(\d{4})-(\d{1,2})$/;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && reviewPattern.test(key)) {
                const match = key.match(reviewPattern)!;
                const year = parseInt(match[1]);
                const month = parseInt(match[2]);
                const reviewRaw = localStorage.getItem(key);
                if (reviewRaw) {
                    const review = JSON.parse(reviewRaw);
                    await db.monthlyReviews.put({
                        id: `${year}-${String(month).padStart(2, "0")}`,
                        month,
                        year,
                        pillars: review.pillars ?? {},
                        finalized: review.finalized ?? false,
                        updatedAt: new Date().toISOString(),
                    });
                    stats.reviews = (stats.reviews ?? 0) + 1;
                }
            }
        }

        // Marcar migração como completa
        localStorage.setItem(MIGRATION_KEY, "true");
        console.log("[DB] Migration completed:", stats);

        return { migrated: true, stats };
    } catch (error) {
        console.error("[DB] Migration failed:", error);
        return { migrated: false, stats };
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Limpa todos os dados do banco (reset completo).
 */
export async function clearAllData(): Promise<void> {
    await db.transaction(
        "rw",
        [
            db.habits,
            db.tasks,
            db.weeklyFocus,
            db.goals,
            db.goalCategories,
            db.dreams,
            db.lifeAreas,
            db.monthlyReviews,
            db.settings,
            db.userProfile,
            db.financeData,
            db.assetAllocations,
            db.lifeScoreHistory,
            db.achievements,
            db.notifications,
        ],
        async () => {
            await db.habits.clear();
            await db.tasks.clear();
            await db.weeklyFocus.clear();
            await db.goals.clear();
            await db.goalCategories.clear();
            await db.dreams.clear();
            await db.lifeAreas.clear();
            await db.monthlyReviews.clear();
            await db.settings.clear();
            await db.userProfile.clear();
            await db.financeData.clear();
            await db.assetAllocations.clear();
            await db.lifeScoreHistory.clear();
            await db.achievements.clear();
            await db.notifications.clear();
        }
    );

    // Limpar flag de migração para permitir re-migrar se necessário
    if (typeof window !== "undefined") {
        localStorage.removeItem("lifesync_indexeddb_migrated");
    }

    console.log("[DB] All data cleared");
}

/**
 * Exporta todos os dados para backup.
 */
export async function exportAllData(): Promise<{
    version: number;
    exportedAt: string;
    data: Record<string, unknown[]>;
}> {
    const data: Record<string, unknown[]> = {};

    data.habits = await db.habits.toArray();
    data.tasks = await db.tasks.toArray();
    data.weeklyFocus = await db.weeklyFocus.toArray();
    data.goals = await db.goals.toArray();
    data.goalCategories = await db.goalCategories.toArray();
    data.dreams = await db.dreams.toArray();
    data.lifeAreas = await db.lifeAreas.toArray();
    data.monthlyReviews = await db.monthlyReviews.toArray();
    data.settings = await db.settings.toArray();
    data.userProfile = await db.userProfile.toArray();
    data.financeData = await db.financeData.toArray();
    data.assetAllocations = await db.assetAllocations.toArray();
    data.lifeScoreHistory = await db.lifeScoreHistory.toArray();
    data.achievements = await db.achievements.toArray();
    data.notifications = await db.notifications.toArray();

    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
    };
}

/**
 * Importa dados de um backup.
 */
export async function importBackupData(backup: {
    data: Record<string, unknown[]>;
}): Promise<boolean> {
    try {
        // Limpar dados existentes primeiro
        await clearAllData();

        // Importar cada tabela
        if (backup.data.habits)
            await db.habits.bulkPut(backup.data.habits as DBHabit[]);
        if (backup.data.tasks)
            await db.tasks.bulkPut(backup.data.tasks as DBTask[]);
        if (backup.data.weeklyFocus)
            await db.weeklyFocus.bulkPut(backup.data.weeklyFocus as DBWeeklyFocus[]);
        if (backup.data.goals)
            await db.goals.bulkPut(backup.data.goals as DBGoal[]);
        if (backup.data.goalCategories)
            await db.goalCategories.bulkPut(backup.data.goalCategories as DBGoalCategory[]);
        if (backup.data.dreams)
            await db.dreams.bulkPut(backup.data.dreams as DBDream[]);
        if (backup.data.lifeAreas)
            await db.lifeAreas.bulkPut(backup.data.lifeAreas as DBLifeAreaData[]);
        if (backup.data.monthlyReviews)
            await db.monthlyReviews.bulkPut(backup.data.monthlyReviews as DBMonthlyReview[]);
        if (backup.data.settings)
            await db.settings.bulkPut(backup.data.settings as DBSettings[]);
        if (backup.data.userProfile)
            await db.userProfile.bulkPut(backup.data.userProfile as DBUserProfile[]);
        if (backup.data.financeData)
            await db.financeData.bulkPut(backup.data.financeData as DBFinanceData[]);
        if (backup.data.assetAllocations)
            await db.assetAllocations.bulkPut(
                backup.data.assetAllocations as DBAssetAllocation[]
            );
        if (backup.data.lifeScoreHistory)
            await db.lifeScoreHistory.bulkPut(
                backup.data.lifeScoreHistory as DBLifeScoreHistory[]
            );
        if (backup.data.achievements)
            await db.achievements.bulkPut(backup.data.achievements as DBAchievement[]);
        if (backup.data.notifications)
            await db.notifications.bulkPut(backup.data.notifications as DBNotification[]);

        console.log("[DB] Backup imported successfully");
        return true;
    } catch (error) {
        console.error("[DB] Import failed:", error);
        return false;
    }
}

/**
 * Download backup como arquivo JSON.
 */
export async function downloadBackup(): Promise<void> {
    const backup = await exportAllData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lifesync-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
