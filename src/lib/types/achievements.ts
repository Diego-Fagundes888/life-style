/**
 * Achievements System - Gamificação do Life Sync.
 * 
 * Define conquistas, critérios de desbloqueio e sistema de streaks.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Categoria de conquista */
export type AchievementCategory =
    | 'consistency'  // Constância (streaks)
    | 'milestone'    // Marcos (números específicos)
    | 'exploration'  // Exploração (usar features)
    | 'mastery'      // Maestria (pontuações altas)
    | 'special';     // Especiais (eventos, datas)

/** Raridade da conquista */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Definição de uma conquista */
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Emoji
    category: AchievementCategory;
    rarity: AchievementRarity;
    points: number;
    condition: AchievementCondition;
    secret?: boolean; // Conquista secreta (não mostra até desbloquear)
}

/** Condição para desbloquear conquista */
export interface AchievementCondition {
    type: 'streak' | 'count' | 'score' | 'date' | 'custom';
    target: number | string;
    context?: string; // Contexto adicional (ex: área específica)
}

/** Conquista desbloqueada pelo usuário */
export interface UnlockedAchievement {
    achievementId: string;
    unlockedAt: string;
    notified: boolean; // Se o usuário já foi notificado
}

/** Dados de streak */
export interface StreakData {
    habitId: string;
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string | null;
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
    // ========== CONSISTENCY (Streaks) ==========
    {
        id: 'streak_7',
        title: 'Uma Semana de Foco',
        description: 'Mantenha um hábito por 7 dias consecutivos',
        icon: '🔥',
        category: 'consistency',
        rarity: 'common',
        points: 10,
        condition: { type: 'streak', target: 7 },
    },
    {
        id: 'streak_21',
        title: 'Formando o Hábito',
        description: 'Mantenha um hábito por 21 dias consecutivos',
        icon: '⚡',
        category: 'consistency',
        rarity: 'rare',
        points: 30,
        condition: { type: 'streak', target: 21 },
    },
    {
        id: 'streak_30',
        title: 'Um Mês de Disciplina',
        description: 'Mantenha um hábito por 30 dias consecutivos',
        icon: '💪',
        category: 'consistency',
        rarity: 'rare',
        points: 50,
        condition: { type: 'streak', target: 30 },
    },
    {
        id: 'streak_66',
        title: 'Automático',
        description: 'Mantenha um hábito por 66 dias (formação completa)',
        icon: '🧠',
        category: 'consistency',
        rarity: 'epic',
        points: 100,
        condition: { type: 'streak', target: 66 },
    },
    {
        id: 'streak_100',
        title: 'Centenário',
        description: 'Mantenha um hábito por 100 dias consecutivos',
        icon: '💯',
        category: 'consistency',
        rarity: 'epic',
        points: 150,
        condition: { type: 'streak', target: 100 },
    },
    {
        id: 'streak_365',
        title: 'Lenda Viva',
        description: 'Mantenha um hábito por 1 ano consecutivo',
        icon: '👑',
        category: 'consistency',
        rarity: 'legendary',
        points: 500,
        condition: { type: 'streak', target: 365 },
    },

    // ========== MILESTONES (Counts) ==========
    {
        id: 'habits_5',
        title: 'Construtor de Hábitos',
        description: 'Crie 5 hábitos diferentes',
        icon: '🏗️',
        category: 'milestone',
        rarity: 'common',
        points: 15,
        condition: { type: 'count', target: 5, context: 'habits' },
    },
    {
        id: 'habits_10',
        title: 'Arquiteto da Rotina',
        description: 'Crie 10 hábitos diferentes',
        icon: '📐',
        category: 'milestone',
        rarity: 'rare',
        points: 30,
        condition: { type: 'count', target: 10, context: 'habits' },
    },
    {
        id: 'goals_complete_5',
        title: 'Realizador',
        description: 'Complete 5 metas',
        icon: '🎯',
        category: 'milestone',
        rarity: 'common',
        points: 20,
        condition: { type: 'count', target: 5, context: 'goals_completed' },
    },
    {
        id: 'dreams_3',
        title: 'Sonhador Ativo',
        description: 'Complete 3 sonhos da Bucket List',
        icon: '✨',
        category: 'milestone',
        rarity: 'epic',
        points: 100,
        condition: { type: 'count', target: 3, context: 'dreams_completed' },
    },
    {
        id: 'reviews_6',
        title: 'Reflexivo',
        description: 'Complete 6 revisões mensais',
        icon: '📝',
        category: 'milestone',
        rarity: 'rare',
        points: 40,
        condition: { type: 'count', target: 6, context: 'monthly_reviews' },
    },
    {
        id: 'reviews_12',
        title: 'Um Ano de Introspecção',
        description: 'Complete 12 revisões mensais',
        icon: '📚',
        category: 'milestone',
        rarity: 'epic',
        points: 100,
        condition: { type: 'count', target: 12, context: 'monthly_reviews' },
    },

    // ========== MASTERY (Scores) ==========
    {
        id: 'score_7',
        title: 'Ascensão',
        description: 'Atinja Life Score de 7.0 ou mais',
        icon: '📈',
        category: 'mastery',
        rarity: 'common',
        points: 25,
        condition: { type: 'score', target: 7 },
    },
    {
        id: 'score_8',
        title: 'Alto Desempenho',
        description: 'Atinja Life Score de 8.0 ou mais',
        icon: '🌟',
        category: 'mastery',
        rarity: 'rare',
        points: 50,
        condition: { type: 'score', target: 8 },
    },
    {
        id: 'score_9',
        title: 'Quase Perfeito',
        description: 'Atinja Life Score de 9.0 ou mais',
        icon: '💎',
        category: 'mastery',
        rarity: 'epic',
        points: 100,
        condition: { type: 'score', target: 9 },
    },
    {
        id: 'score_perfect',
        title: 'Vida Perfeita',
        description: 'Atinja Life Score de 10.0',
        icon: '🏆',
        category: 'mastery',
        rarity: 'legendary',
        points: 200,
        condition: { type: 'score', target: 10 },
    },
    {
        id: 'area_max',
        title: 'Mestre de Área',
        description: 'Atinja nota 10 em qualquer área da vida',
        icon: '🥇',
        category: 'mastery',
        rarity: 'rare',
        points: 40,
        condition: { type: 'score', target: 10, context: 'any_area' },
    },

    // ========== EXPLORATION (Features) ==========
    {
        id: 'first_habit',
        title: 'Primeiro Passo',
        description: 'Crie seu primeiro hábito',
        icon: '👶',
        category: 'exploration',
        rarity: 'common',
        points: 5,
        condition: { type: 'count', target: 1, context: 'habits' },
    },
    {
        id: 'first_goal',
        title: 'Visionário',
        description: 'Defina sua primeira meta anual',
        icon: '🎯',
        category: 'exploration',
        rarity: 'common',
        points: 5,
        condition: { type: 'count', target: 1, context: 'goals' },
    },
    {
        id: 'first_dream',
        title: 'Sonhador',
        description: 'Adicione seu primeiro sonho à Bucket List',
        icon: '🌈',
        category: 'exploration',
        rarity: 'common',
        points: 5,
        condition: { type: 'count', target: 1, context: 'dreams' },
    },
    {
        id: 'first_review',
        title: 'Introspectivo',
        description: 'Complete sua primeira revisão mensal',
        icon: '🔍',
        category: 'exploration',
        rarity: 'common',
        points: 10,
        condition: { type: 'count', target: 1, context: 'monthly_reviews' },
    },
    {
        id: 'backup_first',
        title: 'Precavido',
        description: 'Faça seu primeiro backup de dados',
        icon: '💾',
        category: 'exploration',
        rarity: 'common',
        points: 15,
        condition: { type: 'count', target: 1, context: 'backups' },
    },

    // ========== SPECIAL ==========
    {
        id: 'new_year',
        title: 'Ano Novo, Vida Nova',
        description: 'Use o app no primeiro dia do ano',
        icon: '🎆',
        category: 'special',
        rarity: 'rare',
        points: 25,
        condition: { type: 'date', target: '01-01' },
        secret: true,
    },
    {
        id: 'birthday',
        title: 'Parabéns!',
        description: 'Use o app no seu aniversário',
        icon: '🎂',
        category: 'special',
        rarity: 'rare',
        points: 25,
        condition: { type: 'custom', target: 'birthday' },
        secret: true,
    },
    {
        id: 'night_owl',
        title: 'Coruja Noturna',
        description: 'Use o app depois da meia-noite',
        icon: '🦉',
        category: 'special',
        rarity: 'common',
        points: 10,
        condition: { type: 'custom', target: 'night_usage' },
        secret: true,
    },
    {
        id: 'early_bird',
        title: 'Madrugador',
        description: 'Use o app antes das 6h da manhã',
        icon: '🐦',
        category: 'special',
        rarity: 'common',
        points: 10,
        condition: { type: 'custom', target: 'early_usage' },
        secret: true,
    },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Obtém conquista por ID */
export function getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
}

/** Filtra conquistas por categoria */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return ACHIEVEMENTS.filter(a => a.category === category);
}

/** Filtra conquistas por raridade */
export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
    return ACHIEVEMENTS.filter(a => a.rarity === rarity);
}

/** Calcula total de pontos de conquistas desbloqueadas */
export function calculateTotalPoints(unlockedIds: string[]): number {
    return unlockedIds.reduce((total, id) => {
        const achievement = getAchievementById(id);
        return total + (achievement?.points || 0);
    }, 0);
}

/** Calcula progresso de conquistas (% desbloqueadas) */
export function calculateAchievementProgress(unlockedIds: string[]): number {
    const nonSecretAchievements = ACHIEVEMENTS.filter(a => !a.secret);
    const unlockedNonSecret = unlockedIds.filter(id => {
        const a = getAchievementById(id);
        return a && !a.secret;
    });

    if (nonSecretAchievements.length === 0) return 0;
    return Math.round((unlockedNonSecret.length / nonSecretAchievements.length) * 100);
}

/** Cores por raridade */
export const RARITY_COLORS: Record<AchievementRarity, { bg: string; text: string; border: string; glow: string }> = {
    common: {
        bg: 'bg-zinc-700/50',
        text: 'text-zinc-300',
        border: 'border-zinc-600',
        glow: '',
    },
    rare: {
        bg: 'bg-blue-900/50',
        text: 'text-blue-300',
        border: 'border-blue-500/50',
        glow: 'shadow-blue-500/20 shadow-lg',
    },
    epic: {
        bg: 'bg-purple-900/50',
        text: 'text-purple-300',
        border: 'border-purple-500/50',
        glow: 'shadow-purple-500/30 shadow-lg',
    },
    legendary: {
        bg: 'bg-amber-900/50',
        text: 'text-amber-300',
        border: 'border-amber-500/50',
        glow: 'shadow-amber-500/40 shadow-xl',
    },
};

/** Labels por raridade */
export const RARITY_LABELS: Record<AchievementRarity, string> = {
    common: 'Comum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
};

/** Calcula streak atual de um hábito */
export function calculateStreak(completionHistory: string[]): number {
    if (completionHistory.length === 0) return 0;

    const sortedDates = [...completionHistory]
        .map(d => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Verificar se o hábito foi feito hoje ou ontem
    const mostRecent = sortedDates[0];
    mostRecent.setHours(0, 0, 0, 0);

    const isActive =
        mostRecent.getTime() === today.getTime() ||
        mostRecent.getTime() === yesterday.getTime();

    if (!isActive) return 0;

    // Contar dias consecutivos
    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
        const current = sortedDates[i - 1];
        const previous = sortedDates[i];

        const diffDays = Math.floor(
            (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}
