/**
 * Life Sync - Bucket List Types
 * 
 * Estrutura de dados para a página Bucket List (Antes de Morrer).
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

/** Status do sonho */
export type DreamStatus = 'pending' | 'in-progress' | 'completed';

/** Categorias de sonhos */
export type DreamCategory =
    | 'travel'      // ✈️ Viagem
    | 'adventure'   // ⛰️ Aventura
    | 'skill'       // 🎸 Habilidade
    | 'creation'    // ✍️ Criação
    | 'altruism'    // ❤️ Altruísmo
    | 'experience'  // 🎭 Experiência
    | 'health'      // 💪 Saúde
    | 'relationship'; // 👨‍👩‍👧 Relacionamento

/** Etapa do checklist */
export interface DreamStep {
    id: string;
    title: string;
    completed: boolean;
}

/** Sonho/Item da Bucket List */
export interface Dream {
    id: string;
    title: string;
    description?: string;
    category: DreamCategory;
    status: DreamStatus;
    image: string;
    realImage?: string; // Foto real após conclusão
    estimatedCost?: number;
    motivation?: string;
    steps: DreamStep[];
    completedDate?: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// CONFIGURAÇÃO DE CATEGORIAS
// ============================================================================

export interface CategoryConfig {
    id: DreamCategory;
    label: string;
    emoji: string;
    color: string;
}

export const DREAM_CATEGORIES: CategoryConfig[] = [
    { id: 'travel', label: 'Viagem', emoji: '✈️', color: 'blue' },
    { id: 'adventure', label: 'Aventura', emoji: '⛰️', color: 'emerald' },
    { id: 'skill', label: 'Habilidade', emoji: '🎸', color: 'amber' },
    { id: 'creation', label: 'Criação', emoji: '✍️', color: 'violet' },
    { id: 'altruism', label: 'Altruísmo', emoji: '❤️', color: 'rose' },
    { id: 'experience', label: 'Experiência', emoji: '🎭', color: 'cyan' },
    { id: 'health', label: 'Saúde', emoji: '💪', color: 'orange' },
    { id: 'relationship', label: 'Relacionamento', emoji: '👨‍👩‍👧', color: 'pink' },
];

export function getCategoryConfig(category: DreamCategory): CategoryConfig {
    return DREAM_CATEGORIES.find(c => c.id === category) ?? DREAM_CATEGORIES[0];
}

// ============================================================================
// MOCK DATA (DEPRECATED - Dados agora são gerenciados pelo IndexedDB)
// ============================================================================

/**
 * @deprecated Use IndexedDB (db.dreams) para persistência de dados.
 * Este array é mantido vazio para backward compatibility temporária.
 */
export const MOCK_BUCKET_LIST: Dream[] = [];

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Calcula estatísticas da bucket list.
 */
export function calculateBucketListStats(dreams: Dream[]) {
    const total = dreams.length;
    const completed = dreams.filter(d => d.status === 'completed').length;
    const inProgress = dreams.filter(d => d.status === 'in-progress').length;
    const pending = dreams.filter(d => d.status === 'pending').length;

    return { total, completed, inProgress, pending };
}

/**
 * Calcula progresso de um sonho baseado nas etapas.
 */
export function calculateDreamProgress(dream: Dream): number {
    if (dream.steps.length === 0) return dream.status === 'completed' ? 100 : 0;
    const completed = dream.steps.filter(s => s.completed).length;
    return Math.round((completed / dream.steps.length) * 100);
}

/**
 * Gera um ID único.
 */
export function generateDreamId(): string {
    return `dream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cria um novo sonho com valores padrão.
 */
export function createEmptyDream(): Partial<Dream> {
    return {
        id: generateDreamId(),
        title: '',
        category: 'experience',
        status: 'pending',
        image: '',
        steps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
