/**
 * Tipos e Interfaces para o Life Sync.
 * Os dados são gerenciados pelo LifeSyncContext com persistência em LocalStorage.
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

export interface TimeBlock {
    id: string;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    title: string;
    category: "deep-work" | "routine" | "rest" | "social" | "health";
    icon: string;
}

export interface Habit {
    id: string;
    name: string;
    icon: string;
    period: "morning" | "afternoon" | "evening";
    completed: boolean;
}

export interface FinanceData {
    currentBalance: number;
    monthlyBudget: number;
    monthlySpent: number;
    savingsGoal: number;
    currentSavings: number;
}

export interface PillarScore {
    name: string;
    score: number;
    fullMark: number;
}

export interface UserProfile {
    name: string;
    yearlyGoal: string;
    avatar?: string;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskCategory = "work" | "health" | "personal" | "learning" | "finance";

export interface WeeklyTask {
    id: string;
    title: string;
    date: string | null; // ISO date string, null = backlog
    completed: boolean;
    category: TaskCategory;
    estimatedMinutes: number;
    isRoutine: boolean;
    time?: string; // Optional time for routine blocks (e.g., "07:00")
}

export interface WeeklyFocus {
    weekStart: string;
    focus: string;
    rating?: number; // 1-5 stars
}

// ============================================================================
// HABIT TRACKING TYPES
// ============================================================================

export type HabitCategory = "morning" | "evening" | "anytime";
export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom";

export interface TrackingHabit {
    id: string;
    name: string;
    icon: string;
    category: HabitCategory;
    frequency: HabitFrequency;
    customDays?: number[]; // 0-6 (Sun-Sat) for custom frequency
    completionHistory: string[]; // Array of ISO date strings when completed
    createdAt: string;
    archived: boolean;
}

// ============================================================================
// JOURNAL / DAILY LOG TYPES
// ============================================================================

export interface TimeBlockEntry {
    id: string;
    time: string; // "HH:mm" format
    task: string;
    completed: boolean;
}

export interface JournalEntry {
    // Morning
    dailyIntention: string;
    gratitude: string[];
    // Evening
    dayReview: string;
    lessonsLearned: string;
    improvements: string;
}

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface DailyLog {
    date: string; // ISO date string
    mood?: Mood;
    timeBlocks: TimeBlockEntry[];
    journal: JournalEntry;
}


// ============================================================================
// STATIC DATA (User Profile & Finance - can be made dynamic later)
// ============================================================================

export const USER_PROFILE: UserProfile = {
    name: "Diego",
    yearlyGoal: "Liberdade Financeira até Dezembro",
};

export const FINANCE_DATA: FinanceData = {
    currentBalance: 15420.5,
    monthlyBudget: 8000,
    monthlySpent: 3240.8,
    savingsGoal: 50000,
    currentSavings: 28500,
};

export const PILLAR_SCORES: PillarScore[] = [
    { name: "Saúde", score: 85, fullMark: 100 },
    { name: "Carreira", score: 78, fullMark: 100 },
    { name: "Relacionamentos", score: 65, fullMark: 100 },
    { name: "Desenvolvimento", score: 88, fullMark: 100 },
    { name: "Espírito", score: 62, fullMark: 100 },
    { name: "Finanças", score: 71, fullMark: 100 },
    { name: "Social", score: 54, fullMark: 100 },
];

// Static Time Blocks for NowWidget
export const TIME_BLOCKS: TimeBlock[] = [
    { id: "1", startHour: 5, startMinute: 0, endHour: 6, endMinute: 0, title: "Despertar & Rotina Matinal", category: "routine", icon: "Sun" },
    { id: "2", startHour: 6, startMinute: 0, endHour: 7, endMinute: 0, title: "Exercício Físico", category: "health", icon: "Dumbbell" },
    { id: "3", startHour: 7, startMinute: 0, endHour: 8, endMinute: 0, title: "Café & Planejamento", category: "routine", icon: "Coffee" },
    { id: "4", startHour: 8, startMinute: 0, endHour: 12, endMinute: 0, title: "Deep Work", category: "deep-work", icon: "Brain" },
    { id: "5", startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, title: "Almoço & Descanso", category: "rest", icon: "Utensils" },
    { id: "6", startHour: 13, startMinute: 0, endHour: 17, endMinute: 0, title: "Trabalho Focado", category: "deep-work", icon: "Laptop" },
    { id: "7", startHour: 17, startMinute: 0, endHour: 19, endMinute: 0, title: "Tempo Pessoal", category: "social", icon: "Users" },
    { id: "8", startHour: 19, startMinute: 0, endHour: 21, endMinute: 0, title: "Jantar & Família", category: "social", icon: "Heart" },
    { id: "9", startHour: 21, startMinute: 0, endHour: 22, endMinute: 0, title: "Leitura & Reflexão", category: "rest", icon: "BookOpen" },
    { id: "10", startHour: 22, startMinute: 0, endHour: 5, endMinute: 0, title: "Sono", category: "rest", icon: "Moon" },
];

// Static Habits for HabitsWidget (period-based display)
export const HABITS: Habit[] = [
    { id: "h1", name: "Água", icon: "Droplets", period: "morning", completed: false },
    { id: "h2", name: "Meditação", icon: "Sparkles", period: "morning", completed: false },
    { id: "h3", name: "Sol", icon: "Sun", period: "morning", completed: false },
    { id: "h4", name: "Pausas", icon: "Timer", period: "afternoon", completed: false },
    { id: "h5", name: "Hidratação", icon: "GlassWater", period: "afternoon", completed: false },
    { id: "h6", name: "Alongamento", icon: "PersonStanding", period: "afternoon", completed: false },
    { id: "h7", name: "Sem Telas", icon: "MonitorOff", period: "evening", completed: false },
    { id: "h8", name: "Leitura", icon: "Book", period: "evening", completed: false },
    { id: "h9", name: "Gratidão", icon: "Heart", period: "evening", completed: false },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns the current time block based on hour and minute.
 */
export function getCurrentTimeBlock(hours: number, minutes: number): TimeBlock | null {
    const currentMinutes = hours * 60 + minutes;

    for (const block of TIME_BLOCKS) {
        const startMinutes = block.startHour * 60 + block.startMinute;
        let endMinutes = block.endHour * 60 + block.endMinute;

        // Handle overnight blocks (e.g., 22:00 - 05:00)
        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
            const adjustedCurrent = currentMinutes < startMinutes ? currentMinutes + 24 * 60 : currentMinutes;
            if (adjustedCurrent >= startMinutes && adjustedCurrent < endMinutes) {
                return block;
            }
        } else {
            if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                return block;
            }
        }
    }
    return null;
}

/**
 * Returns the next time block after the current one.
 */
export function getNextTimeBlock(hours: number, minutes: number): TimeBlock | null {
    const currentBlock = getCurrentTimeBlock(hours, minutes);
    if (!currentBlock) return TIME_BLOCKS[0];

    const currentIndex = TIME_BLOCKS.findIndex(b => b.id === currentBlock.id);
    const nextIndex = (currentIndex + 1) % TIME_BLOCKS.length;
    return TIME_BLOCKS[nextIndex];
}

/**
 * Returns habits filtered by the current period of the day.
 */
export function getHabitsByPeriod(hours: number): Habit[] {
    let period: "morning" | "afternoon" | "evening";
    if (hours >= 5 && hours < 12) {
        period = "morning";
    } else if (hours >= 12 && hours < 18) {
        period = "afternoon";
    } else {
        period = "evening";
    }
    return HABITS.filter(h => h.period === period);
}

/**
 * Returns the overall score from pillar scores.
 */
export function getOverallScore(): number {
    const total = PILLAR_SCORES.reduce((sum, p) => sum + p.score, 0);
    return Math.round(total / PILLAR_SCORES.length);
}
