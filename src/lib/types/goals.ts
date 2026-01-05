/**
 * Goals Type Definitions - Life Sync Vision Board
 * 
 * Este módulo define os tipos e funções de cálculo para o sistema de metas anuais.
 * Suporta metas binárias (checkbox) e numéricas (com direção de progresso).
 */

/** Tipo da meta: binária (sim/não) ou numérica (valor progressivo) */
export type GoalType = 'binary' | 'numeric';

/** Direção do progresso: aumentar (livros lidos) ou diminuir (peso corporal) */
export type GoalDirection = 'increase' | 'decrease';

/** 
 * Cores temáticas disponíveis para categorias
 * Dark Academia Palette:
 * - rust: #C87F76 (Ferrugem - Saúde/Corpo)
 * - clay: #D99E6B (Barro - Energia/Foco)  
 * - olive: #8C9E78 (Oliva - Natureza/Hobbies)
 * - slate: #768C9E (Ardósia - Mente/Intelecto)
 * - gold: #CCAE70 (Ouro Envelhecido - Dinheiro)
 * Legacy colors mapped for backward compatibility
 */
export type CategoryColor =
    | 'rust' | 'clay' | 'olive' | 'slate' | 'gold'  // Dark Academia
    | 'rose' | 'blue' | 'emerald' | 'amber' | 'violet' | 'cyan';  // Legacy

/**
 * Interface para uma meta individual.
 * 
 * @example Meta binária
 * { id: 'h1', title: 'Fazer cardio', type: 'binary', current: 0, target: 1 }
 * 
 * @example Meta numérica crescente
 * { id: 'h2', title: 'Livros Lidos', type: 'numeric', current: 5, target: 12, direction: 'increase' }
 * 
 * @example Meta numérica decrescente
 * { id: 'h3', title: 'Gordura Corporal', type: 'numeric', current: 18, target: 12, startValue: 22, direction: 'decrease', unit: '%' }
 */
export interface Goal {
    /** Identificador único da meta */
    id: string;
    /** Título descritivo da meta */
    title: string;
    /** Tipo: binário (checkbox) ou numérico (barra de progresso) */
    type: GoalType;
    /** Valor atual (para binário: 0 = não feito, 1 = feito) */
    current: number;
    /** Valor alvo (para binário: sempre 1) */
    target: number;
    /** Unidade de medida opcional (ex: "kg", "%", "R$") */
    unit?: string;
    /** Incremento para inputs numéricos (ex: 0.5 para peso) */
    step?: number;
    /** 
     * Direção do progresso para metas numéricas.
     * - 'increase': progresso aumenta quando current se aproxima de target (ex: livros lidos)
     * - 'decrease': progresso aumenta quando current diminui em direção ao target (ex: peso corporal)
     * @default 'increase'
     */
    direction?: GoalDirection;
    /**
     * Valor inicial para metas decrescentes.
     * Necessário para calcular corretamente o progresso de metas como "gordura corporal 18% → 12%"
     * onde precisamos saber de onde partimos.
     */
    startValue?: number;
}

/**
 * Interface para uma categoria de metas.
 * Cada categoria agrupa metas relacionadas (ex: Saúde, Finanças).
 */
export interface GoalCategory {
    /** Identificador único da categoria */
    id: string;
    /** Nome da categoria (ex: "Saúde", "Financeiro") */
    title: string;
    /** Nome do ícone Lucide (ex: "Heart", "DollarSign") */
    icon: string;
    /** Cor temática da categoria */
    color: CategoryColor;
    /** Lista de metas dentro desta categoria */
    goals: Goal[];
}

/**
 * Calcula o progresso de uma meta individual (0-100).
 * 
 * Para metas de direção 'decrease' (como peso ou gordura corporal),
 * o progresso aumenta conforme o valor atual diminui em direção ao target.
 * 
 * @param goal - A meta para calcular o progresso
 * @returns Percentual de progresso (0-100)
 * 
 * @example
 * // Meta crescente: 5 livros lidos de 12
 * calculateGoalProgress({ current: 5, target: 12, direction: 'increase' }) // 41.67%
 * 
 * @example
 * // Meta decrescente: Peso de 75kg para 70kg, começou em 80kg
 * calculateGoalProgress({ current: 75, target: 70, startValue: 80, direction: 'decrease' }) // 50%
 */
export const calculateGoalProgress = (goal: Goal): number => {
    // Metas binárias: 0% ou 100%
    if (goal.type === 'binary') {
        return goal.current === 1 ? 100 : 0;
    }

    // Metas numéricas
    const direction = goal.direction ?? 'increase';

    if (direction === 'increase') {
        // Progresso normal: current/target
        if (goal.target === 0) return 0;
        const percentage = (goal.current / goal.target) * 100;
        return Math.min(Math.max(percentage, 0), 100);
    } else {
        // Progresso decrescente: quanto mais perto do target, maior o progresso
        // Fórmula: (startValue - current) / (startValue - target) * 100
        const start = goal.startValue ?? goal.current;
        const range = start - goal.target;

        if (range <= 0) return 100; // Já está no target ou abaixo

        const progress = start - goal.current;
        const percentage = (progress / range) * 100;

        return Math.min(Math.max(percentage, 0), 100);
    }
};

/**
 * Calcula o progresso médio de uma categoria.
 * 
 * @param category - A categoria para calcular o progresso
 * @returns Percentual médio de progresso (0-100)
 */
export const calculateCategoryProgress = (category: GoalCategory): number => {
    if (category.goals.length === 0) return 0;

    const totalProgress = category.goals.reduce((acc, goal) => {
        return acc + calculateGoalProgress(goal);
    }, 0);

    return Math.round(totalProgress / category.goals.length);
};

/**
 * Calcula o progresso global de todas as categorias.
 * 
 * @param categories - Lista de todas as categorias
 * @returns Percentual global de progresso (0-100)
 */
export const calculateGlobalProgress = (categories: GoalCategory[]): number => {
    let totalProgress = 0;
    let totalGoals = 0;

    categories.forEach(category => {
        category.goals.forEach(goal => {
            totalProgress += calculateGoalProgress(goal);
            totalGoals++;
        });
    });

    return totalGoals === 0 ? 0 : Math.round(totalProgress / totalGoals);
};

/**
 * Verifica se uma meta está completa.
 * 
 * @param goal - A meta para verificar
 * @returns true se a meta está 100% completa
 */
export const isGoalComplete = (goal: Goal): boolean => {
    return calculateGoalProgress(goal) >= 100;
};
