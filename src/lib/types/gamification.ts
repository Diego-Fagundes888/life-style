/**
 * Gamification System Types & Utilities
 * 
 * Sistema de XP, Níveis e Streaks para engajar o usuário
 * no estilo Duolingo/Apple Fitness.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface GamificationState {
    /** Dias consecutivos de uso do app */
    currentStreak: number;
    /** Maior streak já alcançado */
    longestStreak: number;
    /** Total de XP acumulado */
    totalXP: number;
    /** Última data de atividade (ISO string) */
    lastActiveDate: string | null;
    /** Histórico de XP ganho por dia */
    xpHistory: Record<string, number>;
}

export interface Level {
    id: number;
    name: string;
    minXP: number;
    maxXP: number;
    icon: string;
    color: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Pontos de XP por ação */
export const XP_REWARDS = {
    HABIT_COMPLETE: 10,
    JOURNAL_ENTRY: 25,
    DAILY_STREAK: 5,
    REVIEW_COMPLETE: 50,
    GOAL_PROGRESS: 15,
    GOAL_COMPLETE: 100,
    FIRST_ACTION_OF_DAY: 20,
} as const;

/** Sistema de níveis */
export const LEVELS: Level[] = [
    { id: 1, name: "Iniciante", minXP: 0, maxXP: 99, icon: "🌱", color: "#8C9E78" },
    { id: 2, name: "Dedicado", minXP: 100, maxXP: 499, icon: "🌿", color: "#8C9E78" },
    { id: 3, name: "Consistente", minXP: 500, maxXP: 1499, icon: "🌳", color: "#CCAE70" },
    { id: 4, name: "Mestre", minXP: 1500, maxXP: 4999, icon: "⭐", color: "#CCAE70" },
    { id: 5, name: "Lenda", minXP: 5000, maxXP: Infinity, icon: "👑", color: "#D99E6B" },
];

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Retorna o nível atual baseado no XP total
 */
export function getCurrentLevel(totalXP: number): Level {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (totalXP >= LEVELS[i].minXP) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

/**
 * Retorna o próximo nível (ou null se já está no máximo)
 */
export function getNextLevel(totalXP: number): Level | null {
    const current = getCurrentLevel(totalXP);
    const nextIndex = LEVELS.findIndex(l => l.id === current.id) + 1;
    return nextIndex < LEVELS.length ? LEVELS[nextIndex] : null;
}

/**
 * Calcula o progresso percentual para o próximo nível
 */
export function getLevelProgress(totalXP: number): number {
    const current = getCurrentLevel(totalXP);
    const next = getNextLevel(totalXP);

    if (!next) return 100; // Já está no nível máximo

    const xpInCurrentLevel = totalXP - current.minXP;
    const xpNeededForNext = next.minXP - current.minXP;

    return Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
}

/**
 * Formata o XP para exibição (ex: 1.5k)
 */
export function formatXP(xp: number): string {
    if (xp >= 1000) {
        return `${(xp / 1000).toFixed(1)}k`;
    }
    return xp.toString();
}

/**
 * Verifica se é o primeiro acesso do dia
 */
export function isFirstActionOfDay(lastActiveDate: string | null): boolean {
    if (!lastActiveDate) return true;

    const today = new Date().toISOString().split("T")[0];
    return lastActiveDate !== today;
}

/**
 * Calcula o novo streak baseado na última data de atividade
 */
export function calculateNewStreak(
    currentStreak: number,
    lastActiveDate: string | null
): number {
    if (!lastActiveDate) return 1;

    const today = new Date();
    const lastActive = new Date(lastActiveDate);

    // Reset para início do dia para comparação
    today.setHours(0, 0, 0, 0);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Mesmo dia, mantém streak
        return currentStreak;
    } else if (diffDays === 1) {
        // Dia consecutivo, incrementa streak
        return currentStreak + 1;
    } else {
        // Mais de 1 dia sem usar, reseta streak
        return 1;
    }
}

/**
 * Retorna mensagem motivacional baseada no streak
 */
export function getStreakMessage(streak: number): string {
    if (streak >= 30) return "Você é imparável! 🔥";
    if (streak >= 14) return "Duas semanas! Incrível! 💪";
    if (streak >= 7) return "Uma semana de consistência! ⭐";
    if (streak >= 3) return "Mantendo o ritmo! 🌟";
    if (streak >= 1) return "Continue assim! 🌱";
    return "Comece sua jornada hoje! 🚀";
}

/**
 * Estado inicial de gamificação
 */
export const INITIAL_GAMIFICATION_STATE: GamificationState = {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    lastActiveDate: null,
    xpHistory: {},
};
