/**
 * Insights Engine - Análise de correlações entre áreas da vida.
 *
 * Detecta padrões e correlações entre diferentes aspectos da vida do usuário
 * para fornecer insights personalizados e acionáveis.
 */

import type { LifeAreaId } from "./types/life-score";

// ============================================================================
// TYPES
// ============================================================================

/** Tipo de insight */
export type InsightType =
    | "correlation" // Correlação entre áreas
    | "trend" // Tendência identificada
    | "warning" // Alerta de declínio
    | "celebration" // Celebração de conquista
    | "suggestion"; // Sugestão de ação

/** Força da correlação */
export type CorrelationStrength = "weak" | "moderate" | "strong";

/** Insight descoberto */
export interface Insight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    icon: string;
    areas: LifeAreaId[];
    strength?: CorrelationStrength;
    confidence: number; // 0-100
    actionable?: string; // Sugestão de ação
    discoveredAt: string;
    dismissed?: boolean;
}

/** Dados históricos para análise */
export interface HistoricalData {
    date: string;
    areaScores: Record<LifeAreaId, number>;
    habitCompletions: number;
    goalsCompleted: number;
}

// ============================================================================
// INSIGHT TEMPLATES
// ============================================================================

const INSIGHT_TEMPLATES: Record<
    string,
    {
        type: InsightType;
        title: string;
        description: string;
        icon: string;
        actionable?: string;
    }
> = {
    body_mind_positive: {
        type: "correlation",
        title: "Mente Sã, Corpo São",
        description:
            "Quando você cuida do seu corpo, sua mente também melhora! Nos períodos com mais atividade física, seu foco e clareza mental aumentam.",
        icon: "🧠",
        actionable: "Mantenha a rotina de exercícios para sustentar esse benefício.",
    },
    body_spirit_positive: {
        type: "correlation",
        title: "Corpo como Templo",
        description:
            "Sua prática de cuidar do corpo está elevando seu bem-estar espiritual. A conexão corpo-espírito está forte.",
        icon: "✨",
        actionable: "Considere adicionar meditação após exercícios.",
    },
    money_mind_stress: {
        type: "warning",
        title: "Estresse Financeiro",
        description:
            "Notamos que quando suas finanças estão baixas, sua saúde mental também cai. Isso é normal, mas vale atenção.",
        icon: "⚠️",
        actionable:
            "Crie um plano de emergência financeira para reduzir ansiedade.",
    },
    social_spirit_positive: {
        type: "correlation",
        title: "Conexões que Nutrem",
        description:
            "Seus relacionamentos sociais estão alimentando seu espírito. Pessoas importam para você!",
        icon: "💝",
        actionable: "Agende mais momentos de qualidade com quem você ama.",
    },
    habit_consistency: {
        type: "celebration",
        title: "Consistência Nota 10!",
        description:
            "Você está mantendo seus hábitos com regularidade impressionante. Continue assim!",
        icon: "🔥",
    },
    area_declining: {
        type: "warning",
        title: "Atenção Necessária",
        description:
            "Uma área da sua vida está em declínio há algumas semanas. Talvez seja hora de dar mais atenção a ela.",
        icon: "📉",
        actionable: "Defina uma pequena meta para essa área esta semana.",
    },
    area_improving: {
        type: "trend",
        title: "Evolução Constante",
        description:
            "Uma área está mostrando melhoria consistente. Seu esforço está valendo a pena!",
        icon: "📈",
    },
    balance_achieved: {
        type: "celebration",
        title: "Vida Equilibrada",
        description:
            "Todas as suas áreas estão com pontuações similares. Você está vivendo de forma equilibrada!",
        icon: "⚖️",
    },
    exercise_focus: {
        type: "correlation",
        title: "Exercício = Foco",
        description:
            "Identificamos que nos dias após exercício, sua produtividade e foco aumentam significativamente.",
        icon: "💪",
        actionable: "Considere exercitar-se pela manhã antes de tarefas importantes.",
    },
};

// ============================================================================
// CORRELATION ANALYSIS
// ============================================================================

/**
 * Calcula correlação de Pearson entre dois arrays de dados.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 3) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
        (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) return 0;
    return numerator / denominator;
}

/**
 * Classifica a força da correlação.
 */
function classifyCorrelation(r: number): CorrelationStrength | null {
    const absR = Math.abs(r);
    if (absR >= 0.7) return "strong";
    if (absR >= 0.4) return "moderate";
    if (absR >= 0.2) return "weak";
    return null;
}

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

/**
 * Gera insights baseados em dados históricos.
 */
export function generateInsights(history: HistoricalData[]): Insight[] {
    const insights: Insight[] = [];

    if (history.length < 7) {
        // Precisa de pelo menos 1 semana de dados
        return insights;
    }

    // Extrair séries temporais por área
    const areas: LifeAreaId[] = ["body", "mind", "spirit", "money", "social"];
    const areaData: Record<LifeAreaId, number[]> = {
        body: [],
        mind: [],
        spirit: [],
        money: [],
        social: [],
    };

    history.forEach((entry) => {
        areas.forEach((area) => {
            areaData[area].push(entry.areaScores[area] || 5);
        });
    });

    // Analisar correlações entre áreas
    const correlations: { areas: [LifeAreaId, LifeAreaId]; r: number }[] = [];

    for (let i = 0; i < areas.length; i++) {
        for (let j = i + 1; j < areas.length; j++) {
            const r = pearsonCorrelation(areaData[areas[i]], areaData[areas[j]]);
            correlations.push({ areas: [areas[i], areas[j]], r });
        }
    }

    // Gerar insights de correlações fortes
    correlations.forEach(({ areas, r }) => {
        const strength = classifyCorrelation(r);
        if (strength === "strong" || strength === "moderate") {
            const templateKey = `${areas[0]}_${areas[1]}_${r > 0 ? "positive" : "negative"}`;
            const template =
                INSIGHT_TEMPLATES[templateKey] || INSIGHT_TEMPLATES.body_mind_positive;

            insights.push({
                id: `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type: template.type,
                title: template.title,
                description: template.description,
                icon: template.icon,
                areas,
                strength,
                confidence: Math.round(Math.abs(r) * 100),
                actionable: template.actionable,
                discoveredAt: new Date().toISOString(),
            });
        }
    });

    // Analisar tendências por área
    areas.forEach((area) => {
        const data = areaData[area];
        const recentAvg =
            data.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, data.length);
        const olderAvg =
            data.slice(-14, -7).reduce((a, b) => a + b, 0) /
            Math.min(7, data.slice(-14, -7).length || 1);

        const change = recentAvg - olderAvg;

        if (change < -1) {
            // Declínio significativo
            insights.push({
                id: `insight_decline_${area}_${Date.now()}`,
                type: "warning",
                title: `${getAreaName(area)} em Declínio`,
                description: `Sua área de ${getAreaName(area)} caiu ${Math.abs(change).toFixed(1)} pontos nas últimas semanas.`,
                icon: "📉",
                areas: [area],
                confidence: 80,
                actionable: `Dedique mais atenção a ${getAreaName(area)} esta semana.`,
                discoveredAt: new Date().toISOString(),
            });
        } else if (change > 1) {
            // Melhoria significativa
            insights.push({
                id: `insight_improve_${area}_${Date.now()}`,
                type: "celebration",
                title: `${getAreaName(area)} Evoluindo!`,
                description: `Sua área de ${getAreaName(area)} subiu ${change.toFixed(1)} pontos. Excelente progresso!`,
                icon: "📈",
                areas: [area],
                confidence: 80,
                discoveredAt: new Date().toISOString(),
            });
        }
    });

    // Verificar equilíbrio
    const latestScores = areas.map((a) => areaData[a][areaData[a].length - 1]);
    const avg = latestScores.reduce((a, b) => a + b, 0) / latestScores.length;
    const variance =
        latestScores.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) /
        latestScores.length;

    if (variance < 1 && avg >= 6) {
        insights.push({
            id: `insight_balance_${Date.now()}`,
            type: "celebration",
            title: "Vida Equilibrada!",
            description:
                "Todas as suas áreas estão equilibradas e com boas pontuações. Parabéns!",
            icon: "⚖️",
            areas: areas,
            confidence: 90,
            discoveredAt: new Date().toISOString(),
        });
    }

    return insights.slice(0, 5); // Máximo 5 insights
}

/**
 * Retorna nome legível da área.
 */
function getAreaName(area: LifeAreaId): string {
    const names: Record<LifeAreaId, string> = {
        body: "Corpo",
        mind: "Mente",
        spirit: "Espírito",
        money: "Dinheiro",
        social: "Social",
    };
    return names[area];
}

/**
 * Gera insight diário baseado em dados simples.
 */
export function generateDailyInsight(
    habitCompletionRate: number,
    topArea: LifeAreaId,
    lowArea: LifeAreaId
): Insight {
    if (habitCompletionRate >= 80) {
        return {
            id: `daily_${Date.now()}`,
            type: "celebration",
            title: "Dia Produtivo!",
            description: `Você completou ${habitCompletionRate}% dos seus hábitos hoje. Continue assim!`,
            icon: "🎯",
            areas: [],
            confidence: 95,
            discoveredAt: new Date().toISOString(),
        };
    }

    if (habitCompletionRate < 30) {
        return {
            id: `daily_${Date.now()}`,
            type: "warning",
            title: "Dia Difícil?",
            description: `Poucos hábitos completados hoje. Tudo bem, amanhã é um novo dia!`,
            icon: "💪",
            areas: [],
            confidence: 90,
            actionable: "Comece amanhã com o hábito mais fácil.",
            discoveredAt: new Date().toISOString(),
        };
    }

    return {
        id: `daily_${Date.now()}`,
        type: "suggestion",
        title: `Foco em ${getAreaName(lowArea)}`,
        description: `${getAreaName(topArea)} está indo bem! Que tal dar mais atenção a ${getAreaName(lowArea)} hoje?`,
        icon: "💡",
        areas: [lowArea],
        confidence: 70,
        discoveredAt: new Date().toISOString(),
    };
}
