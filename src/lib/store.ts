/**
 * LocalStorage Store - Camada de persistência robusta com versionamento.
 * 
 * Este módulo fornece:
 * - Schema versioning para migrações seguras
 * - Tratamento de erros com feedback ao usuário
 * - Eventos customizados para sincronização cross-tab
 * - Proteção contra perda de dados
 */

import { nanoid } from 'nanoid';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Versão atual do schema de dados */
export const SCHEMA_VERSION = 1;

/** Limite máximo de tamanho do undo stack em bytes (500KB) */
const MAX_UNDO_STACK_SIZE_BYTES = 500 * 1024;

/** Chaves que não devem ter backup (evita recursão) */
const NO_BACKUP_KEYS = ['lifesync_undo_stack'];

/** Chaves de armazenamento */
export const STORAGE_KEYS = {
    HABITS: "lifesync_habits",
    TASKS: "lifesync_tasks",
    WEEKLY_FOCUS: "lifesync_weekly_focus",
    USER: "lifesync_user",
    FINANCES: "lifesync_finances",
    GOALS: "lifesync_goals",
    LIFE_SUMMARY: "lifesync_life_summary",
    BUCKET_LIST: "lifesync_bucket_list",
    REVIEWS: "lifesync_reviews",
    ACHIEVEMENTS: "lifesync_achievements",
    LIFE_SCORE_HISTORY: "lifesync_life_score_history",
    SETTINGS: "lifesync_settings",
    UNDO_STACK: "lifesync_undo_stack",
    GAMIFICATION: "lifesync_gamification",
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// ============================================================================
// TYPES
// ============================================================================

/** Wrapper para dados persistidos com metadata */
interface PersistedData<T> {
    version: number;
    data: T;
    savedAt: string;
    checksum?: string;
}

/** Resultado de uma operação de salvamento */
export interface SaveResult {
    success: boolean;
    error?: 'QUOTA_EXCEEDED' | 'SERIALIZATION_ERROR' | 'UNKNOWN_ERROR';
    message?: string;
}

/** Eventos customizados para comunicação */
export type StorageEventType =
    | 'storage-full'
    | 'storage-error'
    | 'storage-sync'
    | 'storage-saved';

// ============================================================================
// EVENT SYSTEM
// ============================================================================

/** Dispara evento customizado de storage */
export function dispatchStorageEvent(
    type: StorageEventType,
    detail: Record<string, unknown>
): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(type, { detail }));
}

/** Listener para eventos de storage */
export function onStorageEvent(
    type: StorageEventType,
    callback: (detail: Record<string, unknown>) => void
): () => void {
    if (typeof window === 'undefined') return () => { };

    const handler = (e: Event) => {
        const customEvent = e as CustomEvent;
        callback(customEvent.detail);
    };

    window.addEventListener(type, handler);
    return () => window.removeEventListener(type, handler);
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Gera um ID único resistente a colisões.
 * Usa nanoid para garantir unicidade mesmo em operações rápidas.
 */
export function generateId(prefix?: string): string {
    const id = nanoid(12);
    return prefix ? `${prefix}_${id}` : id;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Retorna a chave de backup para uma chave de storage.
 */
function getBackupKey(key: string): string {
    return `${key}_backup`;
}

/**
 * Cria backup dos dados atuais antes de sobrescrever.
 */
function createBackup(key: string): void {
    if (NO_BACKUP_KEYS.includes(key)) return;

    try {
        const existing = localStorage.getItem(key);
        if (existing) {
            const backupKey = getBackupKey(key);
            localStorage.setItem(backupKey, existing);
        }
    } catch (error) {
        console.warn(`[Store] Failed to create backup for ${key}:`, error);
    }
}

/**
 * Tenta recuperar dados do backup.
 */
function recoverFromBackup<T>(key: string): T | null {
    try {
        const backupKey = getBackupKey(key);
        const backup = localStorage.getItem(backupKey);
        if (!backup) return null;

        const parsed = JSON.parse(backup) as PersistedData<T>;
        const data = parsed.data ?? parsed;

        // Validar que backup tem dados úteis
        if (Array.isArray(data) && data.length > 0) {
            console.warn(`[Store] Recuperando ${key} do backup (${data.length} itens)`);
            // Restaurar backup para storage principal
            localStorage.setItem(key, backup);
            return data as T;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Recupera dados do LocalStorage com validação de versão.
 * Inclui proteção contra corrupção com fallback para backup.
 * 
 * @param key - Chave de armazenamento
 * @param validator - Função opcional de validação de schema
 * @returns Dados ou null se não existir/inválido
 */
export function getStoredData<T>(
    key: string,
    validator?: (data: unknown) => data is T
): T | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as PersistedData<T>;

        // Verificar se é formato antigo (sem wrapper de versão)
        if (parsed.version === undefined) {
            // Migrar formato antigo para novo
            const migratedData = migrateOldFormat<T>(key, parsed as unknown as T);
            return migratedData;
        }

        // Verificar versão para migração
        if (parsed.version !== SCHEMA_VERSION) {
            return migrateData<T>(parsed, SCHEMA_VERSION);
        }

        // NOVO: Detectar possível corrupção (array vazio quando esperado dados)
        if (Array.isArray(parsed.data) && parsed.data.length === 0) {
            // Tentar recuperar do backup
            const recovered = recoverFromBackup<T>(key);
            if (recovered) {
                dispatchStorageEvent('storage-error', {
                    key,
                    error: 'RECOVERED_FROM_BACKUP',
                    message: 'Dados recuperados do backup automaticamente'
                });
                return recovered;
            }
        }

        // Validar schema se validador fornecido
        if (validator && !validator(parsed.data)) {
            console.error(`[Store] Schema validation failed for ${key}`);
            dispatchStorageEvent('storage-error', {
                key,
                error: 'VALIDATION_FAILED'
            });
            return null;
        }

        return parsed.data;
    } catch (error) {
        console.error(`[Store] Error reading ${key}:`, error);

        // NOVO: Tentar recuperar do backup em caso de erro de parsing
        const recovered = recoverFromBackup<T>(key);
        if (recovered) {
            dispatchStorageEvent('storage-error', {
                key,
                error: 'RECOVERED_FROM_BACKUP',
                message: 'Dados corrompidos foram recuperados do backup'
            });
            return recovered;
        }

        dispatchStorageEvent('storage-error', { key, error: String(error) });
        return null;
    }
}

/**
 * Salva dados no LocalStorage com wrapper de versão.
 * Retorna resultado indicando sucesso/falha.
 * 
 * @param key - Chave de armazenamento
 * @param data - Dados a salvar
 * @returns Resultado da operação
 */
export function setStoredData<T>(key: string, data: T): SaveResult {
    if (typeof window === "undefined") {
        return { success: false, error: 'UNKNOWN_ERROR', message: 'Window not available' };
    }

    try {
        // NOVO: Criar backup antes de sobrescrever (proteção contra corrupção)
        createBackup(key);

        const payload: PersistedData<T> = {
            version: SCHEMA_VERSION,
            data,
            savedAt: new Date().toISOString(),
        };

        const serialized = JSON.stringify(payload);
        localStorage.setItem(key, serialized);

        // Disparar evento de sucesso
        dispatchStorageEvent('storage-saved', { key, timestamp: payload.savedAt });

        return { success: true };
    } catch (error) {
        if (error instanceof DOMException) {
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.error(`[Store] Quota exceeded for ${key}`);
                dispatchStorageEvent('storage-full', {
                    key,
                    message: 'Armazenamento cheio! Exporte seus dados para backup.'
                });
                return {
                    success: false,
                    error: 'QUOTA_EXCEEDED',
                    message: 'Armazenamento cheio. Por favor, exporte seus dados.'
                };
            }
        }

        console.error(`[Store] Error writing ${key}:`, error);
        dispatchStorageEvent('storage-error', { key, error: String(error) });

        return {
            success: false,
            error: 'UNKNOWN_ERROR',
            message: 'Erro ao salvar dados'
        };
    }
}

/**
 * Remove dados do LocalStorage.
 */
export function removeStoredData(key: string): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`[Store] Error removing ${key}:`, error);
    }
}

/**
 * Limpa todos os dados do Life Sync.
 */
export function clearAllData(): void {
    if (typeof window === "undefined") return;

    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

/**
 * Verifica se a store foi inicializada.
 */
export function isStoreInitialized(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.HABITS) !== null;
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migra dados de formato antigo (sem wrapper) para novo formato.
 */
function migrateOldFormat<T>(key: string, oldData: T): T {
    console.log(`[Store] Migrating old format for ${key}`);

    // Salvar no novo formato
    setStoredData(key, oldData);

    return oldData;
}

/**
 * Migra dados entre versões de schema.
 */
function migrateData<T>(
    persisted: PersistedData<T>,
    targetVersion: number
): T {
    let currentData = persisted.data;
    let currentVersion = persisted.version;

    // Aplicar migrações incrementais
    while (currentVersion < targetVersion) {
        console.log(`[Store] Migrating from v${currentVersion} to v${currentVersion + 1}`);

        // Adicionar migrações específicas aqui conforme necessário
        // switch (currentVersion) {
        //     case 1:
        //         currentData = migrateV1toV2(currentData);
        //         break;
        // }

        currentVersion++;
    }

    return currentData;
}

// ============================================================================
// BACKUP & EXPORT
// ============================================================================

/** Estrutura do backup exportado */
export interface BackupData {
    version: number;
    appVersion: string;
    exportedAt: string;
    data: Record<string, unknown>;
}

/**
 * Exporta todos os dados da aplicação.
 */
export function exportAllData(): BackupData {
    const allData: Record<string, unknown> = {};

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        const data = getStoredData(key);
        if (data !== null) {
            allData[name] = data;
        }
    });

    return {
        version: SCHEMA_VERSION,
        appVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: allData,
    };
}

/**
 * Importa dados de um backup.
 * 
 * @param backup - Dados do backup
 * @returns true se importação foi bem sucedida
 */
export function importBackupData(backup: BackupData): boolean {
    try {
        // Validar estrutura básica
        if (!backup.version || !backup.data) {
            throw new Error('Invalid backup format');
        }

        // Importar cada chave
        Object.entries(backup.data).forEach(([name, data]) => {
            const key = STORAGE_KEYS[name as keyof typeof STORAGE_KEYS];
            if (key) {
                setStoredData(key, data);
            }
        });

        return true;
    } catch (error) {
        console.error('[Store] Error importing backup:', error);
        return false;
    }
}

/**
 * Baixa backup como arquivo JSON.
 */
export function downloadBackup(): void {
    const backup = exportAllData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `lifesync-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// UNDO/REDO SYSTEM
// ============================================================================

interface UndoAction {
    id: string;
    type: string;
    key: string;
    previousData: unknown;
    timestamp: string;
    description: string;
}

const MAX_UNDO_STACK_COUNT = 20;

/**
 * Adiciona uma ação ao stack de undo.
 * NOVO: Limita por tamanho (500KB) além de quantidade para evitar overflow do LocalStorage.
 */
export function pushUndoAction(
    type: string,
    key: string,
    previousData: unknown,
    description: string
): string {
    const stack = getStoredData<UndoAction[]>(STORAGE_KEYS.UNDO_STACK) || [];

    const action: UndoAction = {
        id: generateId('undo'),
        type,
        key,
        previousData,
        timestamp: new Date().toISOString(),
        description,
    };

    // Adicionar nova ação ao início
    let newStack = [action, ...stack];

    // Limitar por quantidade primeiro
    newStack = newStack.slice(0, MAX_UNDO_STACK_COUNT);

    // NOVO: Limitar por tamanho para evitar overflow do LocalStorage
    let serialized = JSON.stringify(newStack);
    while (serialized.length * 2 > MAX_UNDO_STACK_SIZE_BYTES && newStack.length > 1) {
        // Remover ações mais antigas até caber no limite
        newStack.pop();
        serialized = JSON.stringify(newStack);
    }

    if (newStack.length < stack.length + 1) {
        console.log(`[Store] Undo stack trimmed from ${stack.length + 1} to ${newStack.length} items due to size limit`);
    }

    setStoredData(STORAGE_KEYS.UNDO_STACK, newStack);

    return action.id;
}

/**
 * Desfaz a última ação.
 */
export function undoLastAction(): boolean {
    const stack = getStoredData<UndoAction[]>(STORAGE_KEYS.UNDO_STACK) || [];

    if (stack.length === 0) return false;

    const [action, ...rest] = stack;

    // Restaurar dados anteriores
    setStoredData(action.key, action.previousData);

    // Remover do stack
    setStoredData(STORAGE_KEYS.UNDO_STACK, rest);

    return true;
}

/**
 * Obtém ação de undo por ID.
 */
export function getUndoAction(id: string): UndoAction | null {
    const stack = getStoredData<UndoAction[]>(STORAGE_KEYS.UNDO_STACK) || [];
    return stack.find(a => a.id === id) || null;
}

/**
 * Desfaz uma ação específica por ID.
 */
export function undoAction(id: string): boolean {
    const stack = getStoredData<UndoAction[]>(STORAGE_KEYS.UNDO_STACK) || [];
    const action = stack.find(a => a.id === id);

    if (!action) return false;

    // Restaurar dados anteriores
    setStoredData(action.key, action.previousData);

    // Remover do stack
    setStoredData(STORAGE_KEYS.UNDO_STACK, stack.filter(a => a.id !== id));

    return true;
}

// ============================================================================
// STORAGE SIZE UTILITIES
// ============================================================================

/**
 * Calcula o tamanho total usado pelo LocalStorage.
 */
export function getStorageSize(): { used: number; total: number; percentage: number } {
    if (typeof window === 'undefined') {
        return { used: 0, total: 0, percentage: 0 };
    }

    let used = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
            used += item.length * 2; // UTF-16 = 2 bytes per char
        }
    });

    // Estimar limite (geralmente 5-10MB)
    const total = 5 * 1024 * 1024; // 5MB em bytes
    const percentage = Math.round((used / total) * 100);

    return { used, total, percentage };
}
