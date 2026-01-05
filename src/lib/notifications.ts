/**
 * Notifications System - Notificações inteligentes do Life Sync.
 * 
 * Gerencia permissões, agendamento e envio de notificações.
 */

// ============================================================================
// TYPES
// ============================================================================

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface ScheduledNotification {
    id: string;
    title: string;
    body: string;
    scheduledFor: string; // ISO timestamp
    type: 'reminder' | 'streak' | 'review' | 'achievement' | 'insight';
    url?: string;
    sent?: boolean;
}

// ============================================================================
// PERMISSION MANAGEMENT
// ============================================================================

/**
 * Verifica se o navegador suporta notificações.
 */
export function supportsNotifications(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Obtém o status atual da permissão de notificações.
 */
export function getNotificationPermission(): NotificationPermission {
    if (!supportsNotifications()) return 'denied';
    return Notification.permission;
}

/**
 * Solicita permissão para enviar notificações.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!supportsNotifications()) return 'denied';

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('[Notifications] Error requesting permission:', error);
        return 'denied';
    }
}

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

/**
 * Registra o service worker para PWA e notificações push.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.log('[SW] Service workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[SW] Service worker registered:', registration.scope);
        return registration;
    } catch (error) {
        console.error('[SW] Registration failed:', error);
        return null;
    }
}

/**
 * Obtém a registration do service worker atual.
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }

    try {
        return await navigator.serviceWorker.ready;
    } catch {
        return null;
    }
}

// ============================================================================
// NOTIFICATION SENDING
// ============================================================================

/**
 * Envia uma notificação local.
 */
export async function sendNotification(
    title: string,
    options?: NotificationOptions & { url?: string }
): Promise<boolean> {
    if (!supportsNotifications()) return false;
    if (Notification.permission !== 'granted') return false;

    try {
        const registration = await getServiceWorkerRegistration();

        if (registration) {
            // Use service worker for better reliability
            await registration.showNotification(title, {
                icon: '/icon-192.png',
                badge: '/icon-badge.png',
                ...options,
                data: { url: options?.url || '/' },
            });
        } else {
            // Fallback to basic notification
            new Notification(title, {
                icon: '/icon-192.png',
                ...options,
            });
        }

        return true;
    } catch (error) {
        console.error('[Notifications] Failed to send:', error);
        return false;
    }
}

// ============================================================================
// SMART NOTIFICATIONS
// ============================================================================

/**
 * Notifica sobre streak em risco.
 */
export function notifyStreakAtRisk(habitName: string, currentStreak: number): Promise<boolean> {
    return sendNotification('🔥 Streak em Risco!', {
        body: `Não perca sua sequência de ${currentStreak} dias em "${habitName}"!`,
        tag: 'streak-risk',
        url: '/habits',
    });
}

/**
 * Notifica sobre revisão mensal pendente.
 */
export function notifyMonthlyReview(): Promise<boolean> {
    const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });

    return sendNotification('📝 Hora da Reflexão', {
        body: `A revisão de ${monthName} está esperando por você. Reserve 10 minutos para refletir.`,
        tag: 'monthly-review',
        url: '/review',
    });
}

/**
 * Notifica sobre conquista desbloqueada.
 */
export function notifyAchievementUnlocked(title: string, emoji: string): Promise<boolean> {
    return sendNotification(`${emoji} Conquista Desbloqueada!`, {
        body: `Você desbloqueou: "${title}"`,
        tag: 'achievement',
        url: '/',
    });
}

/**
 * Notifica sobre novo insight descoberto.
 */
export function notifyNewInsight(insightTitle: string): Promise<boolean> {
    return sendNotification('💡 Novo Insight', {
        body: insightTitle,
        tag: 'insight',
        url: '/',
    });
}

/**
 * Lembrete matinal personalizado.
 */
export function notifyMorningReminder(habitsCount: number): Promise<boolean> {
    return sendNotification('☀️ Bom dia!', {
        body: `Você tem ${habitsCount} hábitos para fazer hoje. Comece com o mais fácil!`,
        tag: 'morning',
        url: '/habits',
    });
}

// ============================================================================
// NOTIFICATION SCHEDULING
// ============================================================================

const NOTIFICATION_STORAGE_KEY = 'lifesync_scheduled_notifications';

/**
 * Agenda uma notificação para um horário futuro.
 */
export function scheduleNotification(notification: Omit<ScheduledNotification, 'id'>): string {
    if (typeof window === 'undefined') return '';

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const scheduled: ScheduledNotification = {
        ...notification,
        id,
        sent: false,
    };

    // Salvar no localStorage
    const existing = getScheduledNotifications();
    existing.push(scheduled);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(existing));

    return id;
}

/**
 * Obtém todas as notificações agendadas.
 */
export function getScheduledNotifications(): ScheduledNotification[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Remove uma notificação agendada.
 */
export function cancelScheduledNotification(id: string): void {
    if (typeof window === 'undefined') return;

    const notifications = getScheduledNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Processa notificações agendadas que já devem ser enviadas.
 */
export async function processScheduledNotifications(): Promise<void> {
    const notifications = getScheduledNotifications();
    const now = new Date().toISOString();

    for (const notification of notifications) {
        if (!notification.sent && notification.scheduledFor <= now) {
            await sendNotification(notification.title, {
                body: notification.body,
                tag: notification.type,
                url: notification.url,
            });

            // Marcar como enviada
            notification.sent = true;
        }
    }

    // Atualizar storage removendo notificações antigas (mais de 7 dias)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const filtered = notifications.filter(n => n.scheduledFor > weekAgo);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(filtered));
}

// ============================================================================
// AUTO-SCHEDULE HELPERS
// ============================================================================

/**
 * Agenda lembrete matinal para todos os dias.
 */
export function scheduleDailyMorningReminder(hour: number = 8): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, 0, 0, 0);

    scheduleNotification({
        title: '☀️ Bom dia!',
        body: 'Hora de começar seus hábitos do dia!',
        scheduledFor: tomorrow.toISOString(),
        type: 'reminder',
        url: '/habits',
    });
}

/**
 * Agenda lembrete de revisão mensal.
 */
export function scheduleMonthlyReviewReminder(): void {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDay.setHours(10, 0, 0, 0);

    scheduleNotification({
        title: '📝 Revisão Mensal',
        body: `O mês está acabando! Hora de fazer sua reflexão.`,
        scheduledFor: lastDay.toISOString(),
        type: 'review',
        url: '/review',
    });
}
