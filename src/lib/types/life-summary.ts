/**
 * Life Summary - Tipos e Mock Data
 * Estética: Notion Dark Mode
 */

export type LifeAreaId = 'body' | 'mind' | 'spirit' | 'money' | 'social';

export interface LifeArea {
    id: LifeAreaId;
    title: string;
    emoji: string;
    color: string;
    colorClass: string;
    badgeClass: string;
    image: string;
    quote: {
        text: string;
        author: string;
    };
    questions: {
        id: string;
        question: string;
    }[];
}

// Objetivo com status de conclusão
export interface Goal {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
}

export interface LifeAreaData {
    areaId: LifeAreaId;
    answers: Record<string, string>;
    goals: Goal[];
    crossReferences: {
        targetArea: LifeAreaId;
        reason: string;
    }[];
    customImage?: string;       // URL da imagem personalizada
    rating?: number;            // Autoavaliação 1-10
    notes?: string;             // Anotações livres
    updatedAt: string;
}

// Configuração das 5 áreas da vida
export const LIFE_AREAS: LifeArea[] = [
    {
        id: 'body',
        title: 'Corpo',
        emoji: '🔴',
        color: '#e11d48',
        colorClass: 'text-rose-400',
        badgeClass: 'bg-rose-900/50 text-rose-200',
        image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
        quote: {
            text: "To lose confidence in one's body is to lose confidence in oneself.",
            author: "Simone de Beauvoir"
        },
        questions: [
            { id: 'q1', question: 'Feche os olhos por 10 segundos. Quando você pensa no seu corpo, qual é a primeira emoção que surge? Não a resposta "politicamente correta" — a verdadeira. De onde vem essa emoção?' },
            { id: 'q2', question: 'Qual parte do seu corpo você mais critica? Se essa parte pudesse responder, o que ela diria sobre como você a trata?' },
            { id: 'q3', question: 'Existe algum momento da sua infância em que você aprendeu a ter vergonha do seu corpo? Como essa memória ainda influencia quem você é hoje?' },
            { id: 'q4', question: 'Se seu corpo pudesse escrever uma carta de despedida para você, agradecendo por tudo que viveram juntos — o que estaria escrito nela?' },
            { id: 'q5', question: 'Qual é a sensação física que você mais evita sentir? O que aconteceria se você parasse de fugir dela?' },
            { id: 'q6', question: 'Imagine que você tem apenas 1 ano de vida com perfeita saúde. O que você faria com esse corpo que não está fazendo agora?' },
        ],
    },
    {
        id: 'mind',
        title: 'Mente',
        emoji: '🔵',
        color: '#3b82f6',
        colorClass: 'text-blue-400',
        badgeClass: 'bg-blue-900/50 text-blue-200',
        image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800',
        quote: {
            text: "The mind is everything. What you think you become.",
            author: "Buddha"
        },
        questions: [
            { id: 'q1', question: 'Qual é a frase que você mais repete para si mesmo quando está sozinho? Você diria essa frase para alguém que ama?' },
            { id: 'q2', question: 'Existe uma crença sobre você mesmo que você sabe que é mentira, mas continua acreditando? Por que é mais fácil acreditar nela do que enfrentá-la?' },
            { id: 'q3', question: 'Se você pudesse voltar no tempo e falar com a versão de 10 anos de você, o que essa criança precisaria ouvir que nunca ouviu?' },
            { id: 'q4', question: 'Qual é o pensamento que te visita às 3 da manhã quando você não consegue dormir? O que ele está tentando te dizer?' },
            { id: 'q5', question: 'Pense na pessoa que mais te julgou na vida. Agora perceba: você internalizou a voz dela? Quando você se critica, é sua voz ou a dela que você ouve?' },
            { id: 'q6', question: 'Se sua mente fosse um quarto, como ele estaria agora? Organizado? Caótico? Escuro? O que precisaria mudar para você se sentir em paz nele?' },
        ],
    },
    {
        id: 'spirit',
        title: 'Espírito',
        emoji: '🟠',
        color: '#f97316',
        colorClass: 'text-orange-400',
        badgeClass: 'bg-orange-900/50 text-orange-200',
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
        quote: {
            text: "The soul always knows what to do to heal itself. The challenge is to silence the mind.",
            author: "Caroline Myss"
        },
        questions: [
            { id: 'q1', question: 'Se você morresse esta noite, o que ficaria não dito? Para quem? Por que você ainda não disse?' },
            { id: 'q2', question: 'Qual é a ferida mais profunda que você carrega? Você está fugindo dela ou caminhando em direção à cura?' },
            { id: 'q3', question: 'Imagine seu "eu" de 80 anos olhando para trás. O que ele diria sobre a vida que você está vivendo agora? Ele estaria orgulhoso ou arrependido?' },
            { id: 'q4', question: 'Quando foi a última vez que você se sentiu verdadeiramente vivo — não apenas existindo, mas VIVO? O que você estava fazendo? Com quem?' },
            { id: 'q5', question: 'Se medo não existisse, o que você faria amanhã? O que está te impedindo de fazer isso agora?' },
            { id: 'q6', question: 'Existe algo que você sente que nasceu para fazer, mas que o mundo (ou você mesmo) te convenceu a abandonar? O que seria?' },
        ],
    },
    {
        id: 'money',
        title: 'Dinheiro',
        emoji: '🟡',
        color: '#eab308',
        colorClass: 'text-yellow-400',
        badgeClass: 'bg-yellow-900/50 text-yellow-200',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        quote: {
            text: "Wealth is the ability to fully experience life.",
            author: "Henry David Thoreau"
        },
        questions: [
            { id: 'q1', question: 'Qual foi a primeira "lição" sobre dinheiro que você aprendeu na infância? Quem te ensinou? Essa lição ainda controla suas decisões hoje?' },
            { id: 'q2', question: 'Se você acordasse amanhã com todo o dinheiro que precisa para sempre, o que você faria com seu tempo? Essa resposta revela seu verdadeiro propósito — por que você não está buscando isso agora?' },
            { id: 'q3', question: 'Qual é o seu maior medo financeiro? Esse medo é baseado na realidade atual ou em traumas do passado que você nunca processou?' },
            { id: 'q4', question: 'Seja brutalmente honesto: quanto da sua vida você está vendendo por segurança financeira? Vale a pena?' },
            { id: 'q5', question: 'Você já comprou algo tentando preencher um vazio emocional? O que você realmente estava buscando naquele momento?' },
            { id: 'q6', question: 'Se dinheiro fosse uma pessoa, como seria seu relacionamento com ela? Abusivo? Distante? Obsessivo? O que isso diz sobre você?' },
        ],
    },
    {
        id: 'social',
        title: 'Vida Social',
        emoji: '🟢',
        color: '#22c55e',
        colorClass: 'text-green-400',
        badgeClass: 'bg-green-900/50 text-green-200',
        image: 'https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=800',
        quote: {
            text: "We are all just walking each other home.",
            author: "Ram Dass"
        },
        questions: [
            { id: 'q1', question: 'Quem você ligaria às 3 da manhã se estivesse em desespero total? Se você hesitou, o que isso diz sobre suas conexões atuais?' },
            { id: 'q2', question: 'Qual máscara você usa socialmente que você está exausto de vestir? O que aconteceria se você simplesmente a tirasse?' },
            { id: 'q3', question: 'Existe alguém que você perdeu (fisicamente ou emocionalmente) que ainda ocupa seus pensamentos? O que ficou não dito entre vocês?' },
            { id: 'q4', question: 'Se você desaparecesse por 30 dias sem avisar ninguém, quem sentiria sua falta de verdade? Essa resposta te satisfaz?' },
            { id: 'q5', question: 'Pense na pessoa que mais te machucou. Você consegue sentir compaixão por ela? O que sua resposta revela sobre sua jornada de cura?' },
            { id: 'q6', question: 'Qual é a coisa mais vulnerável que você poderia dizer para alguém próximo, mas que continua adiando? O que você está protegendo: eles ou você mesmo?' },
        ],
    },
];

// Dicas para a Sidebar
export const TIPS = [
    "Procure validar suas percepções com pessoas de confiança.",
    "Não precisa fazer correndo. Vá com calma e profundidade.",
    "Seja brutalmente honesto consigo mesmo.",
    "Releia suas respostas depois de 24 horas.",
    "Conecte os pontos entre as áreas da sua vida.",
    "Celebre pequenas vitórias.",
];

// Funções utilitárias
export function getAreaById(id: LifeAreaId): LifeArea | undefined {
    return LIFE_AREAS.find(area => area.id === id);
}

export function createEmptyAreaData(areaId: LifeAreaId): LifeAreaData {
    return {
        areaId,
        answers: {},
        goals: [],
        crossReferences: [],
        customImage: undefined,
        rating: undefined,
        notes: undefined,
        updatedAt: new Date().toISOString(),
    };
}

export function getOtherAreas(currentId: LifeAreaId): LifeArea[] {
    return LIFE_AREAS.filter(area => area.id !== currentId);
}

// Calcular progresso de preenchimento (0-100%)
export function calculateAreaProgress(data: LifeAreaData, area: LifeArea): number {
    let filled = 0;
    let total = 0;

    // Respostas (2 perguntas = 40% do total)
    total += area.questions.length;
    filled += Object.values(data.answers).filter(a => a?.trim()).length;

    // Objetivos (pelo menos 1 = 20%)
    total += 1;
    if (data.goals.length > 0) filled += 1;

    // Rating (20%)
    total += 1;
    if (data.rating !== undefined) filled += 1;

    // Cross References (pelo menos 1 = 20%)
    total += 1;
    if (data.crossReferences.length > 0) filled += 1;

    return Math.round((filled / total) * 100);
}

// Formatar tempo relativo
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// Gerar ID único
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
