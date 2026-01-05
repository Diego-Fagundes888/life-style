/**
 * Life Score - Sistema de pontuação global de vida.
 * 
 * Calcula uma pontuação agregada baseada nas 5 áreas da vida,
 * permitindo visualizar evolução e tendências ao longo do tempo.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Identificadores das 5 áreas da vida */
export type LifeAreaId = 'body' | 'mind' | 'spirit' | 'money' | 'social';

/** Pontuação de uma área específica */
export interface AreaScore {
    areaId: LifeAreaId;
    score: number; // 0-10
    weight: number; // Peso na média ponderada
    trend: 'up' | 'down' | 'stable'; // Tendência vs mês anterior
    delta: number; // Variação vs mês anterior
}

/** Registro histórico de Life Score */
export interface LifeScoreEntry {
    id: string;
    date: string; // YYYY-MM-DD
    month: number; // 0-11
    year: number;
    globalScore: number; // 0-10
    areaScores: Record<LifeAreaId, number>;
    createdAt: string;
}

/** Dados de tendência */
export interface LifeScoreTrend {
    current: number;
    previous: number;
    delta: number;
    deltaPercent: number;
    trend: 'up' | 'down' | 'stable';
    message: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Pesos padrão para cada área (soma = 1) */
export const DEFAULT_WEIGHTS: Record<LifeAreaId, number> = {
    body: 0.2,
    mind: 0.2,
    spirit: 0.2,
    money: 0.2,
    social: 0.2,
};

/** Configuração visual das áreas */
export const AREA_CONFIG: Record<LifeAreaId, {
    title: string;
    emoji: string;
    color: string;
    bgClass: string;
    textClass: string;
}> = {
    body: {
        title: 'Corpo',
        emoji: '💪',
        color: '#e11d48',
        bgClass: 'bg-rose-500/20',
        textClass: 'text-rose-400',
    },
    mind: {
        title: 'Mente',
        emoji: '🧠',
        color: '#3b82f6',
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
    },
    spirit: {
        title: 'Espírito',
        emoji: '✨',
        color: '#f97316',
        bgClass: 'bg-orange-500/20',
        textClass: 'text-orange-400',
    },
    money: {
        title: 'Dinheiro',
        emoji: '💰',
        color: '#22c55e',
        bgClass: 'bg-emerald-500/20',
        textClass: 'text-emerald-400',
    },
    social: {
        title: 'Social',
        emoji: '👥',
        color: '#8b5cf6',
        bgClass: 'bg-violet-500/20',
        textClass: 'text-violet-400',
    },
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calcula o Life Score global a partir das pontuações das áreas.
 * 
 * @param areaScores - Pontuações de cada área (0-10)
 * @param weights - Pesos de cada área (opcional, usa padrão se não fornecido)
 * @returns Score global (0-10)
 */
export function calculateLifeScore(
    areaScores: Partial<Record<LifeAreaId, number>>,
    weights: Record<LifeAreaId, number> = DEFAULT_WEIGHTS
): number {
    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(areaScores).forEach(([areaId, score]) => {
        const weight = weights[areaId as LifeAreaId] || 0;
        if (score !== undefined && score !== null) {
            weightedSum += score * weight;
            totalWeight += weight;
        }
    });

    if (totalWeight === 0) return 0;

    const score = weightedSum / totalWeight;
    return Math.round(score * 10) / 10; // 1 casa decimal
}

/**
 * Calcula a tendência comparando com período anterior.
 * 
 * @param current - Score atual
 * @param previous - Score anterior
 * @returns Dados de tendência
 */
export function calculateTrend(current: number, previous: number): LifeScoreTrend {
    const delta = current - previous;
    const deltaPercent = previous > 0 ? (delta / previous) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (delta > 0.3) trend = 'up';
    else if (delta < -0.3) trend = 'down';

    let message = '';
    if (trend === 'up') {
        message = `+${delta.toFixed(1)} pontos vs mês anterior! 🎉`;
    } else if (trend === 'down') {
        message = `${delta.toFixed(1)} pontos vs mês anterior`;
    } else {
        message = 'Estável em relação ao mês anterior';
    }

    return {
        current,
        previous,
        delta: Math.round(delta * 10) / 10,
        deltaPercent: Math.round(deltaPercent),
        trend,
        message,
    };
}

/**
 * Gera mensagem motivacional baseada no score.
 */
export function getScoreMessage(score: number): { emoji: string; message: string; color: string } {
    if (score >= 9) {
        return { emoji: '🏆', message: 'Extraordinário! Você está no topo!', color: 'text-amber-400' };
    }
    if (score >= 8) {
        return { emoji: '🌟', message: 'Excelente! Continue assim!', color: 'text-emerald-400' };
    }
    if (score >= 7) {
        return { emoji: '💪', message: 'Muito bom! Quase lá!', color: 'text-blue-400' };
    }
    if (score >= 6) {
        return { emoji: '📈', message: 'Bom progresso. Continue evoluindo!', color: 'text-cyan-400' };
    }
    if (score >= 5) {
        return { emoji: '🌱', message: 'Na média. Há espaço para crescer!', color: 'text-zinc-400' };
    }
    if (score >= 4) {
        return { emoji: '🔧', message: 'Precisa de atenção. Foque nas áreas fracas.', color: 'text-orange-400' };
    }
    return { emoji: '🚨', message: 'Atenção urgente necessária!', color: 'text-red-400' };
}

/**
 * Calcula projeção de quando atingirá um score alvo baseado no ritmo atual.
 */
export function projectGoalDate(
    currentScore: number,
    targetScore: number,
    monthlyGrowth: number
): { months: number; achievable: boolean; message: string } {
    if (currentScore >= targetScore) {
        return { months: 0, achievable: true, message: 'Meta já atingida! 🎉' };
    }

    if (monthlyGrowth <= 0) {
        return { months: -1, achievable: false, message: 'Ritmo atual não leva à meta' };
    }

    const difference = targetScore - currentScore;
    const months = Math.ceil(difference / monthlyGrowth);

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);

    return {
        months,
        achievable: true,
        message: `Projeção: ${futureDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
    };
}

// ============================================================================
// DATA HELPERS
// ============================================================================

/**
 * Cria um novo registro de Life Score.
 */
export function createLifeScoreEntry(
    areaScores: Record<LifeAreaId, number>,
    weights: Record<LifeAreaId, number> = DEFAULT_WEIGHTS
): LifeScoreEntry {
    const now = new Date();

    return {
        id: `ls_${Date.now()}`,
        date: now.toISOString().split('T')[0],
        month: now.getMonth(),
        year: now.getFullYear(),
        globalScore: calculateLifeScore(areaScores, weights),
        areaScores,
        createdAt: now.toISOString(),
    };
}

/**
 * Obtém o score mais recente para cada área a partir dos dados salvos.
 * Esta função deverá ser adaptada para buscar dados reais das áreas.
 */
export function getLatestAreaScores(): Partial<Record<LifeAreaId, number>> {
    // TODO: Buscar dos dados reais de cada área
    // Por enquanto, retorna valores padrão
    return {
        body: 5,
        mind: 5,
        spirit: 5,
        money: 5,
        social: 5,
    };
}

/**
 * Calcula média de crescimento mensal baseado no histórico.
 */
export function calculateMonthlyGrowth(history: LifeScoreEntry[]): number {
    if (history.length < 2) return 0;

    const sorted = [...history].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const deltas: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        deltas.push(sorted[i].globalScore - sorted[i + 1].globalScore);
    }

    return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}
