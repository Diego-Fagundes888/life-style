/**
 * Life Sync - Monthly Review Types
 * 
 * Estrutura de dados para a página de Reflexão Mensal,
 * incluindo métricas quantitativas e respostas qualitativas
 * para cada pilar da vida.
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

/** Identificadores dos 5 pilares da vida */
export type PillarId = 'body' | 'mind' | 'spirit' | 'money' | 'social';

/** Estrutura de métricas por pilar */
export interface PillarMetrics {
    [key: string]: number;
}

/** Respostas qualitativas por pilar */
export interface PillarAnswers {
    [questionId: string]: string;
}

/** Dados completos de um pilar */
export interface PillarData {
    metrics: PillarMetrics;
    answers: PillarAnswers;
}

/** Dados completos de uma revisão mensal */
export interface MonthlyReviewData {
    body: PillarData;
    mind: PillarData;
    spirit: PillarData;
    money: PillarData;
    social: PillarData;
}

/** Revisão mensal salva com metadados */
export interface SavedMonthlyReview {
    id: string;
    month: number; // 0-11
    year: number;
    data: MonthlyReviewData;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// CONFIGURAÇÃO DOS PILARES
// ============================================================================

export interface MetricConfig {
    id: string;
    label: string;
    icon?: string;
}

export interface QuestionConfig {
    id: string;
    question: string;
}

export interface PillarConfig {
    id: PillarId;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    metrics: MetricConfig[];
    questions: QuestionConfig[];
}

/** Configuração completa de todos os pilares */
export const PILLAR_CONFIG: PillarConfig[] = [
    {
        id: 'body',
        title: 'Corpo',
        subtitle: 'Análise Biométrica & Performance',
        icon: 'Dumbbell',
        color: 'rose',
        metrics: [
            { id: 'arms', label: 'Braços/Força Superior' },
            { id: 'legs', label: 'Pernas/Resistência' },
            { id: 'fat', label: 'Satisfação com % Gordura' },
            { id: 'energy', label: 'Energia Geral' },
        ],
        questions: [
            { id: 'q1', question: 'Como você se sente atualmente sobre sua saúde e situação corporal?' },
            { id: 'q2', question: 'Como você gostaria de se sentir no futuro?' },
            { id: 'q3', question: 'Qual tipo de corpo você quer construir?' },
            { id: 'q4', question: 'Quais atividades físicas você se vê praticando?' },
            { id: 'q5', question: 'Razões inegociáveis para estar em forma?' },
        ],
    },
    {
        id: 'mind',
        title: 'Mente',
        subtitle: 'Intelecto & Bem-estar Emocional',
        icon: 'Brain',
        color: 'blue',
        metrics: [
            { id: 'focus', label: 'Foco & Concentração' },
            { id: 'learning', label: 'Aprendizado & Crescimento' },
            { id: 'creativity', label: 'Criatividade' },
            { id: 'emotional', label: 'Equilíbrio Emocional' },
        ],
        questions: [
            { id: 'q1', question: 'Como está sua clareza mental e capacidade de foco?' },
            { id: 'q2', question: 'O que você está aprendendo atualmente?' },
            { id: 'q3', question: 'Como você lida com suas emoções?' },
            { id: 'q4', question: 'Quais hábitos mentais você quer desenvolver?' },
            { id: 'q5', question: 'O que te traz paz e tranquilidade?' },
        ],
    },
    {
        id: 'spirit',
        title: 'Espírito',
        subtitle: 'Propósito & Significado',
        icon: 'Flame',
        color: 'amber',
        metrics: [
            { id: 'purpose', label: 'Senso de Propósito' },
            { id: 'gratitude', label: 'Gratidão' },
            { id: 'peace', label: 'Paz Interior' },
            { id: 'alignment', label: 'Alinhamento com Valores' },
        ],
        questions: [
            { id: 'q1', question: 'O que dá significado à sua vida neste momento?' },
            { id: 'q2', question: 'Você se sente alinhado com seus valores?' },
            { id: 'q3', question: 'Quais práticas espirituais ou reflexivas te nutrem?' },
            { id: 'q4', question: 'Pelo que você é grato este mês?' },
            { id: 'q5', question: 'Qual é o seu legado desejado?' },
        ],
    },
    {
        id: 'money',
        title: 'Dinheiro',
        subtitle: 'Recursos & Segurança Financeira',
        icon: 'DollarSign',
        color: 'emerald',
        metrics: [
            { id: 'income', label: 'Satisfação com Renda' },
            { id: 'savings', label: 'Poupança & Reservas' },
            { id: 'investments', label: 'Investimentos' },
            { id: 'control', label: 'Controle Financeiro' },
        ],
        questions: [
            { id: 'q1', question: 'Como está sua relação com dinheiro?' },
            { id: 'q2', question: 'Quais são seus objetivos financeiros para os próximos meses?' },
            { id: 'q3', question: 'Você está poupando consistentemente?' },
            { id: 'q4', question: 'Quais gastos desnecessários você pode eliminar?' },
            { id: 'q5', question: 'O que a abundância financeira significaria para você?' },
        ],
    },
    {
        id: 'social',
        title: 'Social',
        subtitle: 'Relacionamentos & Conexões',
        icon: 'Users',
        color: 'violet',
        metrics: [
            { id: 'family', label: 'Relacionamento Familiar' },
            { id: 'friends', label: 'Amizades' },
            { id: 'romantic', label: 'Relacionamento Amoroso' },
            { id: 'network', label: 'Networking & Comunidade' },
        ],
        questions: [
            { id: 'q1', question: 'Como estão seus relacionamentos mais importantes?' },
            { id: 'q2', question: 'Você está investindo tempo nas pessoas certas?' },
            { id: 'q3', question: 'Quais conexões você deseja fortalecer?' },
            { id: 'q4', question: 'Como você pode ser um melhor amigo/parceiro/familiar?' },
            { id: 'q5', question: 'Que tipo de comunidade você quer construir ao seu redor?' },
        ],
    },
];

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Calcula a média das métricas de um pilar.
 */
export function calculatePillarScore(metrics: PillarMetrics): number {
    const values = Object.values(metrics);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10;
}

/**
 * Gera dados iniciais vazios para uma nova revisão.
 */
export function createEmptyReviewData(): MonthlyReviewData {
    const createPillarData = (config: PillarConfig): PillarData => ({
        metrics: config.metrics.reduce((acc, m) => ({ ...acc, [m.id]: 5 }), {}),
        answers: config.questions.reduce((acc, q) => ({ ...acc, [q.id]: '' }), {}),
    });

    return {
        body: createPillarData(PILLAR_CONFIG[0]),
        mind: createPillarData(PILLAR_CONFIG[1]),
        spirit: createPillarData(PILLAR_CONFIG[2]),
        money: createPillarData(PILLAR_CONFIG[3]),
        social: createPillarData(PILLAR_CONFIG[4]),
    };
}

/**
 * Formata o nome do mês em português.
 */
export function formatMonthName(month: number, year: number): string {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/**
 * Obtém o mês anterior.
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
    if (month === 0) {
        return { month: 11, year: year - 1 };
    }
    return { month: month - 1, year };
}
