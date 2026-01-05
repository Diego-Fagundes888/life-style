/**
 * React Hooks para acesso ao banco de dados IndexedDB.
 *
 * Fornece hooks reativos que atualizam automaticamente
 * quando os dados mudam no banco.
 */

"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type DBHabit, type DBTask, type DBWeeklyFocus } from "./db";

// ============================================================================
// HABITS HOOKS
// ============================================================================

/**
 * Hook para listar todos os hábitos ativos.
 */
export function useHabitsQuery() {
    return useLiveQuery(
        () => db.habits.filter((h) => !h.archived).toArray(),
        [],
        []
    );
}

/**
 * Hook para listar hábitos arquivados.
 */
export function useArchivedHabitsQuery() {
    return useLiveQuery(
        () => db.habits.filter((h) => h.archived).toArray(),
        [],
        []
    );
}

/**
 * Hook para um hábito específico.
 */
export function useHabitQuery(id: string | undefined) {
    return useLiveQuery(
        () => (id ? db.habits.get(id) : undefined),
        [id],
        undefined
    );
}

// ============================================================================
// TASKS HOOKS
// ============================================================================

/**
 * Hook para listar tarefas por data.
 */
export function useTasksByDateQuery(date: string | null) {
    return useLiveQuery(
        () => db.tasks.filter((t) => t.date === date).toArray(),
        [date],
        []
    );
}

/**
 * Hook para listar todas as tarefas.
 */
export function useAllTasksQuery() {
    return useLiveQuery(() => db.tasks.toArray(), [], []);
}

/**
 * Hook para tarefas no backlog (sem data).
 */
export function useBacklogTasksQuery() {
    return useLiveQuery(
        () => db.tasks.filter((t) => t.date === null).toArray(),
        [],
        []
    );
}

// ============================================================================
// WEEKLY FOCUS HOOKS
// ============================================================================

/**
 * Hook para o foco semanal atual.
 */
export function useCurrentWeeklyFocusQuery(weekStart: string) {
    return useLiveQuery(
        () => db.weeklyFocus.get(weekStart),
        [weekStart],
        undefined
    );
}

// ============================================================================
// GOALS HOOKS
// ============================================================================

/**
 * Hook para listar categorias de metas.
 */
export function useGoalCategoriesQuery() {
    return useLiveQuery(
        () => db.goalCategories.orderBy("order").toArray(),
        [],
        []
    );
}

/**
 * Hook para listar metas de uma categoria.
 */
export function useGoalsByCategoryQuery(categoryId: string) {
    return useLiveQuery(
        () => db.goals.filter((g) => g.categoryId === categoryId).toArray(),
        [categoryId],
        []
    );
}

/**
 * Hook para todas as metas com suas categorias.
 */
export function useAllGoalsWithCategoriesQuery() {
    return useLiveQuery(async () => {
        const categories = await db.goalCategories.orderBy("order").toArray();
        const goals = await db.goals.toArray();

        return categories.map((cat) => ({
            ...cat,
            goals: goals.filter((g) => g.categoryId === cat.id),
        }));
    }, []);
}

// ============================================================================
// DREAMS (BUCKET LIST) HOOKS
// ============================================================================

/**
 * Hook para listar todos os sonhos.
 */
export function useDreamsQuery() {
    return useLiveQuery(() => db.dreams.toArray(), [], []);
}

/**
 * Hook para sonhos por status.
 */
export function useDreamsByStatusQuery(
    status: "pending" | "in_progress" | "completed"
) {
    return useLiveQuery(
        () => db.dreams.filter((d) => d.status === status).toArray(),
        [status],
        []
    );
}

// ============================================================================
// LIFE AREAS HOOKS
// ============================================================================

/**
 * Hook para dados de todas as áreas de vida.
 */
export function useLifeAreasQuery() {
    return useLiveQuery(() => db.lifeAreas.toArray(), [], []);
}

/**
 * Hook para uma área de vida específica.
 */
export function useLifeAreaQuery(id: string) {
    return useLiveQuery(() => db.lifeAreas.get(id), [id], undefined);
}

// ============================================================================
// MONTHLY REVIEWS HOOKS
// ============================================================================

/**
 * Hook para review de um mês específico.
 */
export function useMonthlyReviewQuery(month: number, year: number) {
    const id = `${year}-${String(month).padStart(2, "0")}`;
    return useLiveQuery(() => db.monthlyReviews.get(id), [id], undefined);
}

/**
 * Hook para histórico de reviews.
 */
export function useReviewHistoryQuery() {
    return useLiveQuery(
        () => db.monthlyReviews.orderBy("id").reverse().toArray(),
        [],
        []
    );
}

// ============================================================================
// USER PROFILE HOOKS
// ============================================================================

/**
 * Hook para perfil do usuário.
 */
export function useUserProfileQuery() {
    return useLiveQuery(() => db.userProfile.get("default"), [], undefined);
}

// ============================================================================
// FINANCE HOOKS
// ============================================================================

/**
 * Hook para dados financeiros.
 */
export function useFinanceDataQuery() {
    return useLiveQuery(() => db.financeData.get("default"), [], undefined);
}

/**
 * Hook para alocação de ativos.
 */
export function useAssetAllocationsQuery() {
    return useLiveQuery(
        () => db.assetAllocations.orderBy("order").toArray(),
        [],
        []
    );
}

// ============================================================================
// LIFE SCORE HISTORY HOOKS
// ============================================================================

/**
 * Hook para histórico de Life Score.
 */
export function useLifeScoreHistoryQuery(limit = 30) {
    return useLiveQuery(
        () => db.lifeScoreHistory.orderBy("date").reverse().limit(limit).toArray(),
        [limit],
        []
    );
}

// ============================================================================
// ACHIEVEMENTS HOOKS
// ============================================================================

/**
 * Hook para conquistas desbloqueadas.
 */
export function useAchievementsQuery() {
    return useLiveQuery(() => db.achievements.toArray(), [], []);
}

// ============================================================================
// NOTIFICATIONS HOOKS
// ============================================================================

/**
 * Hook para notificações.
 */
export function useNotificationsQuery() {
    return useLiveQuery(
        () => db.notifications.orderBy("createdAt").reverse().toArray(),
        [],
        []
    );
}

/**
 * Hook para contagem de notificações não lidas.
 */
export function useUnreadNotificationsCountQuery() {
    return useLiveQuery(
        () => db.notifications.filter((n) => !n.read).count(),
        [],
        0
    );
}

// ============================================================================
// MUTATION HELPERS
// ============================================================================

/**
 * Adiciona ou atualiza um hábito.
 */
export async function saveHabit(habit: DBHabit): Promise<string> {
    return db.habits.put(habit);
}

/**
 * Deleta um hábito.
 */
export async function deleteHabit(id: string): Promise<void> {
    await db.habits.delete(id);
}

/**
 * Toggle completion de um hábito para uma data.
 */
export async function toggleHabitCompletion(
    habitId: string,
    date: string
): Promise<void> {
    const habit = await db.habits.get(habitId);
    if (!habit) return;

    const hasDate = habit.completionHistory.includes(date);
    const newHistory = hasDate
        ? habit.completionHistory.filter((d) => d !== date)
        : [...habit.completionHistory, date];

    await db.habits.update(habitId, { completionHistory: newHistory });
}

/**
 * Arquiva/desarquiva um hábito.
 */
export async function toggleHabitArchive(habitId: string): Promise<void> {
    const habit = await db.habits.get(habitId);
    if (!habit) return;
    await db.habits.update(habitId, { archived: !habit.archived });
}

/**
 * Adiciona ou atualiza uma tarefa.
 */
export async function saveTask(task: DBTask): Promise<string> {
    return db.tasks.put(task);
}

/**
 * Deleta uma tarefa.
 */
export async function deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id);
}

/**
 * Toggle completion de uma tarefa.
 */
export async function toggleTaskCompletion(taskId: string): Promise<void> {
    const task = await db.tasks.get(taskId);
    if (!task) return;
    await db.tasks.update(taskId, { completed: !task.completed });
}

/**
 * Atualiza foco semanal.
 */
export async function saveWeeklyFocus(focus: DBWeeklyFocus): Promise<string> {
    return db.weeklyFocus.put(focus);
}

// ============================================================================
// TIME BLOCKS HOOKS
// ============================================================================

/**
 * Hook para listar todos os blocos de tempo ordenados.
 */
export function useTimeBlocksQuery() {
    return useLiveQuery(
        () => db.timeBlocks.orderBy("order").toArray(),
        [],
        []
    );
}

/**
 * Hook para um bloco de tempo específico.
 */
export function useTimeBlockQuery(id: string | undefined) {
    return useLiveQuery(
        () => (id ? db.timeBlocks.get(id) : undefined),
        [id],
        undefined
    );
}

// ============================================================================
// TIME BLOCKS MUTATIONS
// ============================================================================

import type { DBTimeBlock } from "./db";

/**
 * Adiciona ou atualiza um bloco de tempo.
 */
export async function saveTimeBlock(block: DBTimeBlock): Promise<string> {
    return db.timeBlocks.put(block);
}

/**
 * Deleta um bloco de tempo.
 */
export async function deleteTimeBlock(id: string): Promise<void> {
    await db.timeBlocks.delete(id);
}

/**
 * Atualiza a ordem dos blocos após reordenação (drag & drop).
 */
export async function reorderTimeBlocks(
    blocks: { id: string; order: number }[]
): Promise<void> {
    await db.transaction("rw", db.timeBlocks, async () => {
        for (const { id, order } of blocks) {
            await db.timeBlocks.update(id, { order });
        }
    });
}

/**
 * Cria um novo bloco de tempo com ID único.
 */
export async function createTimeBlock(
    block: Omit<DBTimeBlock, "id">
): Promise<string> {
    const id = `tb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return db.timeBlocks.put({ ...block, id });
}

