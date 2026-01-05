/**
 * Predictions Engine - Projeções e alertas de risco.
 *
 * Usa dados históricos para prever quando metas serão atingidas
 * e detectar hábitos/áreas em risco de declínio.
 */

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface GoalPrediction {
    goalId: string;
    goalTitle: string;
    currentValue: number;
    targetValue: number;
    predictedDate: string | null;
    daysRemaining: number | null;
    confidence: number;
    onTrack: boolean;
    message: string;
}

export interface RiskAlert {
    id: string;
    type: "habit" | "area" | "goal";
    itemId: string;
    itemName: string;
    riskLevel: RiskLevel;
    reason: string;
    suggestion: string;
    detectedAt: string;
}

export interface TrendData {
    values: number[];
    dates: string[];
}

// ============================================================================
// PREDICTION FUNCTIONS
// ============================================================================

/**
 * Calcula a taxa de crescimento média baseada em dados históricos.
 */
export function calculateGrowthRate(data: TrendData): number {
    if (data.values.length < 2) return 0;

    let totalChange = 0;
    let periods = 0;

    for (let i = 1; i < data.values.length; i++) {
        const change = data.values[i] - data.values[i - 1];
        const daysBetween = getDaysBetween(data.dates[i - 1], data.dates[i]);

        if (daysBetween > 0) {
            totalChange += change / daysBetween;
            periods++;
        }
    }

    return periods > 0 ? totalChange / periods : 0;
}

/**
 * Calcula dias entre duas datas.
 */
function getDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Prevê quando uma meta será atingida baseado no ritmo atual.
 */
export function predictGoalCompletion(
    current: number,
    target: number,
    dailyGrowthRate: number,
    direction: "increase" | "decrease" = "increase"
): GoalPrediction {
    const diff = direction === "increase" ? target - current : current - target;

    // Já atingiu a meta
    if (diff <= 0) {
        return {
            goalId: "",
            goalTitle: "",
            currentValue: current,
            targetValue: target,
            predictedDate: new Date().toISOString(),
            daysRemaining: 0,
            confidence: 100,
            onTrack: true,
            message: "Meta já atingida! 🎉",
        };
    }

    // Sem progresso ou retrocedendo
    const effectiveRate =
        direction === "increase" ? dailyGrowthRate : -dailyGrowthRate;

    if (effectiveRate <= 0) {
        return {
            goalId: "",
            goalTitle: "",
            currentValue: current,
            targetValue: target,
            predictedDate: null,
            daysRemaining: null,
            confidence: 30,
            onTrack: false,
            message: "Ritmo atual não leva à meta. Ajuste sua estratégia.",
        };
    }

    // Calcular dias até atingir
    const daysNeeded = Math.ceil(diff / effectiveRate);
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysNeeded);

    // Calcular confiança baseada na consistência dos dados
    const confidence = Math.min(90, 50 + daysNeeded * -0.5 + 50);

    // Verificar se está no caminho (menos de 1 ano)
    const onTrack = daysNeeded <= 365;

    // Gerar mensagem
    let message: string;
    if (daysNeeded <= 7) {
        message = `Quase lá! Menos de uma semana para a meta.`;
    } else if (daysNeeded <= 30) {
        message = `Previsão: ${predictedDate.toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
        })}`;
    } else if (daysNeeded <= 90) {
        message = `Previsão: ${predictedDate.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
        })}`;
    } else if (onTrack) {
        message = `Previsão: ${predictedDate.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
        })} (${Math.round(daysNeeded / 30)} meses)`;
    } else {
        message = "Prazo muito longo. Considere acelerar ou ajustar a meta.";
    }

    return {
        goalId: "",
        goalTitle: "",
        currentValue: current,
        targetValue: target,
        predictedDate: predictedDate.toISOString(),
        daysRemaining: daysNeeded,
        confidence,
        onTrack,
        message,
    };
}

// ============================================================================
// RISK DETECTION
// ============================================================================

/**
 * Detecta riscos em um hábito baseado no histórico de completude.
 */
export function detectHabitRisk(
    habitId: string,
    habitName: string,
    completionHistory: string[],
    recentDays: number = 14
): RiskAlert | null {
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - recentDays * 24 * 60 * 60 * 1000);

    // Contar completudes recentes
    const recentCompletions = completionHistory.filter(
        (date) => new Date(date) >= recentCutoff
    ).length;

    // Calcular taxa de completude
    const completionRate = recentCompletions / recentDays;

    // Determinar risco
    let riskLevel: RiskLevel | null = null;
    let reason = "";
    let suggestion = "";

    if (completionRate < 0.1) {
        riskLevel = "critical";
        reason = `Apenas ${recentCompletions} completude(s) nos últimos ${recentDays} dias`;
        suggestion = "Considere simplificar este hábito ou encontrar um gatilho mais forte";
    } else if (completionRate < 0.3) {
        riskLevel = "high";
        reason = "Taxa de completude muito baixa recentemente";
        suggestion = "Tente associar este hábito a outro já estabelecido";
    } else if (completionRate < 0.5) {
        riskLevel = "medium";
        reason = "Consistência abaixo do ideal";
        suggestion = "Defina um lembrete ou prepare o ambiente para facilitar";
    }

    if (!riskLevel) return null;

    return {
        id: `risk_${habitId}_${Date.now()}`,
        type: "habit",
        itemId: habitId,
        itemName: habitName,
        riskLevel,
        reason,
        suggestion,
        detectedAt: new Date().toISOString(),
    };
}

/**
 * Detecta declínio em uma área da vida.
 */
export function detectAreaDecline(
    areaId: string,
    areaName: string,
    scores: number[],
    dates: string[]
): RiskAlert | null {
    if (scores.length < 3) return null;

    // Comparar média recente com média anterior
    const midpoint = Math.floor(scores.length / 2);
    const recentAvg =
        scores.slice(midpoint).reduce((a, b) => a + b, 0) /
        (scores.length - midpoint);
    const olderAvg =
        scores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;

    const decline = olderAvg - recentAvg;

    if (decline < 0.5) return null;

    let riskLevel: RiskLevel;
    if (decline >= 2) {
        riskLevel = "critical";
    } else if (decline >= 1.5) {
        riskLevel = "high";
    } else if (decline >= 1) {
        riskLevel = "medium";
    } else {
        riskLevel = "low";
    }

    return {
        id: `risk_area_${areaId}_${Date.now()}`,
        type: "area",
        itemId: areaId,
        itemName: areaName,
        riskLevel,
        reason: `Queda de ${decline.toFixed(1)} pontos no período recente`,
        suggestion: `Dedique atenção especial a ${areaName} esta semana`,
        detectedAt: new Date().toISOString(),
    };
}

/**
 * Detecta metas em risco de não serem cumpridas.
 * NOVO: Proteção robusta contra divisão por zero e edge cases.
 */
export function detectGoalRisk(
    goalId: string,
    goalTitle: string,
    current: number,
    target: number,
    deadline: string,
    growthRate: number
): RiskAlert | null {
    const daysUntilDeadline = getDaysBetween(
        new Date().toISOString().split("T")[0],
        deadline
    );

    if (daysUntilDeadline <= 0) return null;

    const remaining = target - current;

    // Se já atingiu ou ultrapassou a meta
    if (remaining <= 0) return null;

    const neededDailyRate = remaining / daysUntilDeadline;

    // NOVO: Proteção robusta contra divisão por zero e taxas problemáticas
    // Tratar growth rate <= 0 como risco crítico (não há progresso ou está regredindo)
    if (growthRate <= 0) {
        return {
            id: `risk_goal_${goalId}_${Date.now()}`,
            type: "goal",
            itemId: goalId,
            itemName: goalTitle,
            riskLevel: "critical",
            reason: growthRate < 0
                ? "Você está regredindo nesta meta"
                : "Sem progresso detectado recentemente",
            suggestion: `Retome o esforço em "${goalTitle}" urgentemente`,
            detectedAt: new Date().toISOString(),
        };
    }

    // NOVO: Garantir divisor mínimo seguro para evitar infinitos
    const safeGrowthRate = Math.max(growthRate, 0.001);
    const rateRatio = neededDailyRate / safeGrowthRate;

    if (rateRatio <= 1.2) return null; // No caminho certo

    let riskLevel: RiskLevel;
    let reason: string;

    if (rateRatio >= 3) {
        riskLevel = "critical";
        reason = "Ritmo atual é 3x menor que o necessário";
    } else if (rateRatio >= 2) {
        riskLevel = "high";
        reason = "Precisa dobrar o ritmo para atingir a meta";
    } else {
        riskLevel = "medium";
        reason = "Ritmo está um pouco abaixo do necessário";
    }

    return {
        id: `risk_goal_${goalId}_${Date.now()}`,
        type: "goal",
        itemId: goalId,
        itemName: goalTitle,
        riskLevel,
        reason,
        suggestion: `Aumente o esforço em "${goalTitle}" para não perder o prazo`,
        detectedAt: new Date().toISOString(),
    };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Cores e configurações por nível de risco.
 */
export const RISK_CONFIG: Record<
    RiskLevel,
    { color: string; bgClass: string; textClass: string; icon: string }
> = {
    low: {
        color: "#22c55e",
        bgClass: "bg-emerald-500/10",
        textClass: "text-emerald-400",
        icon: "✓",
    },
    medium: {
        color: "#f59e0b",
        bgClass: "bg-amber-500/10",
        textClass: "text-amber-400",
        icon: "⚠",
    },
    high: {
        color: "#f97316",
        bgClass: "bg-orange-500/10",
        textClass: "text-orange-400",
        icon: "⚠️",
    },
    critical: {
        color: "#ef4444",
        bgClass: "bg-red-500/10",
        textClass: "text-red-400",
        icon: "🚨",
    },
};

/**
 * Prioriza alertas por nível de risco.
 */
export function prioritizeAlerts(alerts: RiskAlert[]): RiskAlert[] {
    const priority: Record<RiskLevel, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
    };

    return [...alerts].sort(
        (a, b) => priority[b.riskLevel] - priority[a.riskLevel]
    );
}
