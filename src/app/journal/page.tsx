"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getStoredData, setStoredData } from "@/lib/store";
import "./journal.css";
import {
    ChevronLeft,
    ChevronRight,
    Save,
    Trash2,
    BookOpen,
    Flame,
    FileText,
    PenLine,
    Home,
    Sparkles,
    Target,
    Trophy,
} from "lucide-react";
import { FloatingDock } from "@/components/dashboard/FloatingDock";

// ============================================================================
// TYPES
// ============================================================================

interface JournalEntry {
    date: string;
    content: string;
    mood?: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// CONSTANTS & HELPERS - Dark Academia
// ============================================================================

const STORAGE_KEY = "lifesync_journal_entries";
const LINE_HEIGHT = 28;
const DAILY_WORD_GOAL = 300;

// ============================================================================
// WRITER LEVEL SYSTEM
// ============================================================================

interface WriterLevel {
    id: number;
    name: string;
    icon: string;
    minWords: number;
    maxWords: number;
    color: string;
}

const WRITER_LEVELS: WriterLevel[] = [
    { id: 1, name: "Iniciante", icon: "🌱", minWords: 0, maxWords: 1000, color: "#8C9E78" },
    { id: 2, name: "Escritor", icon: "✍️", minWords: 1000, maxWords: 5000, color: "#8C9E78" },
    { id: 3, name: "Contador de Histórias", icon: "📚", minWords: 5000, maxWords: 20000, color: "#CCAE70" },
    { id: 4, name: "Autor", icon: "📖", minWords: 20000, maxWords: 50000, color: "#D99E6B" },
    { id: 5, name: "Mestre das Palavras", icon: "👑", minWords: 50000, maxWords: Infinity, color: "#CCAE70" },
];

function getWriterLevel(totalWords: number): WriterLevel {
    for (let i = WRITER_LEVELS.length - 1; i >= 0; i--) {
        if (totalWords >= WRITER_LEVELS[i].minWords) {
            return WRITER_LEVELS[i];
        }
    }
    return WRITER_LEVELS[0];
}

function getWriterLevelProgress(totalWords: number): number {
    const current = getWriterLevel(totalWords);
    const nextIndex = WRITER_LEVELS.findIndex(l => l.id === current.id) + 1;
    if (nextIndex >= WRITER_LEVELS.length) return 100;
    const next = WRITER_LEVELS[nextIndex];
    const progressInLevel = totalWords - current.minWords;
    const levelRange = next.minWords - current.minWords;
    return Math.round((progressInLevel / levelRange) * 100);
}

// ============================================================================
// MOOD OPTIONS
// ============================================================================

const MOOD_OPTIONS = [
    { emoji: "😊", label: "Feliz", color: "#8C9E78" },
    { emoji: "😌", label: "Tranquilo", color: "#768C9E" },
    { emoji: "😐", label: "Neutro", color: "#9B9B9B" },
    { emoji: "😔", label: "Triste", color: "#768C9E" },
    { emoji: "😤", label: "Frustrado", color: "#C87F76" },
    { emoji: "🤩", label: "Animado", color: "#CCAE70" },
    { emoji: "😴", label: "Cansado", color: "#5A5A5A" },
    { emoji: "🥰", label: "Apaixonado", color: "#D99E6B" },
];

// ============================================================================
// WRITING PROMPTS
// ============================================================================

const WRITING_PROMPTS = [
    "O que te fez sorrir hoje?",
    "Descreva um momento que te marcou recentemente.",
    "Se você pudesse mudar uma coisa no seu dia, o que seria?",
    "Pelo que você é grato hoje?",
    "Qual foi a maior lição que você aprendeu essa semana?",
    "Descreva seu lugar favorito e por que ele é especial.",
    "O que você faria se não tivesse medo?",
    "Escreva uma carta para o seu eu do futuro.",
    "Qual hábito você gostaria de desenvolver?",
    "Descreva como seria seu dia perfeito.",
];

function getDailyPrompt(): string {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return WRITING_PROMPTS[dayOfYear % WRITING_PROMPTS.length];
}

// Dark Academia Journal Colors
const COLORS = {
    // Page colors - aged parchment feel
    pageCream: "#f5f0e6",
    pageMargin: "#ede7db",
    inkColor: "#1a1410",
    lineColor: "rgba(100, 90, 80, 0.18)",
    marginRed: "rgba(180, 90, 80, 0.40)",
    // UI colors
    gold: "#8a7340",
    clay: "#9a6840",
    olive: "#5a6a48",
    rust: "#8a4a42",
    slate: "#4a5a6a",
    charcoal: "#191919",
    stone: "#202020",
    muted: "#9B9B9B",
    dark: "#5A5A5A",
    // Dark text colors for paper
    textDark: "#1a1410",
    textMedium: "#3a2a1a",
    textLight: "#5a4a3a",
};

function toISODateString(date: Date): string {
    return date.toISOString().split("T")[0];
}

function getEmptyEntry(date: string): JournalEntry {
    const now = new Date().toISOString();
    return { date, content: "", createdAt: now, updatedAt: now };
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function formatShortDate(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getMonthDays(year: number, month: number): (number | null)[] {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function JournalPage() {
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);
    const [allEntries, setAllEntries] = useState<Record<string, JournalEntry>>({});
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [isSaving, setIsSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [pageDirection, setPageDirection] = useState<-1 | 1>(1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const dateStr = useMemo(() => toISODateString(currentDate), [currentDate]);
    const currentEntry = useMemo(
        () => allEntries[dateStr] || getEmptyEntry(dateStr),
        [allEntries, dateStr]
    );
    const isToday = useMemo(() => toISODateString(new Date()) === dateStr, [dateStr]);

    // Recent entries
    const recentEntries = useMemo(() => {
        return Object.values(allEntries)
            .filter((e) => e.content.trim().length > 0)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);
    }, [allEntries]);

    // Streak calculation
    const streak = useMemo(() => {
        let count = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = toISODateString(d);
            if (allEntries[key]?.content.trim()) count++;
            else if (i > 0) break;
        }
        return count;
    }, [allEntries]);

    // Month words
    const monthWords = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        let total = 0;
        Object.entries(allEntries).forEach(([date, entry]) => {
            const d = new Date(date + "T12:00:00");
            if (d.getFullYear() === year && d.getMonth() === month) {
                total += entry.content.trim().split(/\s+/).filter(Boolean).length;
            }
        });
        return total;
    }, [allEntries, currentDate]);

    // Calendar data
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return {
            year,
            month,
            monthName: new Date(year, month).toLocaleDateString("pt-BR", { month: "long" }),
            days: getMonthDays(year, month),
            today: new Date().getDate(),
            todayMonth: new Date().getMonth(),
            todayYear: new Date().getFullYear(),
            selectedDay: currentDate.getDate(),
        };
    }, [currentDate]);

    // Word count
    const wordCount = useMemo(() => {
        return currentEntry.content.trim().split(/\s+/).filter(Boolean).length;
    }, [currentEntry.content]);

    // Total words across all entries (for writer level)
    const totalWords = useMemo(() => {
        return Object.values(allEntries).reduce((sum, entry) => {
            return sum + entry.content.trim().split(/\s+/).filter(Boolean).length;
        }, 0);
    }, [allEntries]);

    // Current writer level
    const writerLevel = useMemo(() => getWriterLevel(totalWords), [totalWords]);
    const writerProgress = useMemo(() => getWriterLevelProgress(totalWords), [totalWords]);

    // Daily prompt
    const dailyPrompt = useMemo(() => getDailyPrompt(), []);

    // Goal progress (daily words)
    const goalProgress = useMemo(() => Math.min((wordCount / DAILY_WORD_GOAL) * 100, 100), [wordCount]);
    const [showGoalCelebration, setShowGoalCelebration] = useState(false);

    // Check for goal reached
    useEffect(() => {
        if (wordCount >= DAILY_WORD_GOAL && !showGoalCelebration && wordCount > 0) {
            setShowGoalCelebration(true);
            setTimeout(() => setShowGoalCelebration(false), 3000);
        }
    }, [wordCount, showGoalCelebration]);

    // Mobile detection
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Hydration
    useEffect(() => {
        const stored = getStoredData<Record<string, JournalEntry>>(STORAGE_KEY);
        if (stored) setAllEntries(stored);
        setIsHydrated(true);
        setTimeout(() => setIsReady(true), 100);

        // Force dark text colors after hydration to override global CSS
        const styleId = 'journal-ink-override';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .paper-page-left, .paper-page-left *,
                .paper-page-right-new, .paper-page-right-new *,
                .mobile-paper, .mobile-paper * {
                    color: #1a1410 !important;
                }
                .journal-input-new, .mobile-journal-input {
                    color: #1a1410 !important;
                }
                .journal-input-new::placeholder, .mobile-journal-input::placeholder {
                    color: rgba(60, 50, 40, 0.5) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    // Focus textarea when ready
    useEffect(() => {
        if (isReady && !isMobile) {
            setTimeout(() => textareaRef.current?.focus(), 500);
        }
    }, [isReady, isMobile]);

    // Auto-save
    useEffect(() => {
        if (!isHydrated) return;
        setIsSaving(true);
        const timer = setTimeout(() => {
            setStoredData(STORAGE_KEY, allEntries);
            setIsSaving(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [allEntries, isHydrated]);

    // Handlers
    const updateContent = useCallback(
        (content: string) => {
            setAllEntries((prev) => ({
                ...prev,
                [dateStr]: {
                    ...currentEntry,
                    content,
                    updatedAt: new Date().toISOString(),
                },
            }));
        },
        [dateStr, currentEntry]
    );

    const deleteEntry = useCallback(() => {
        if (!currentEntry.content.trim()) return;
        if (!confirm("Tem certeza que deseja apagar esta entrada?")) return;
        setAllEntries((prev) => {
            const updated = { ...prev };
            delete updated[dateStr];
            return updated;
        });
    }, [dateStr, currentEntry.content]);

    const navigateDate = (direction: -1 | 1) => {
        setPageDirection(direction);
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + direction);
            return newDate;
        });
    };

    const goToDate = (day: number) => {
        setCurrentDate(new Date(calendarData.year, calendarData.month, day, 12));
    };

    const goToToday = () => setCurrentDate(new Date());

    const updateMood = useCallback((mood: string) => {
        setAllEntries((prev) => ({
            ...prev,
            [dateStr]: {
                ...currentEntry,
                mood,
                updatedAt: new Date().toISOString(),
            },
        }));
    }, [dateStr, currentEntry]);

    // Loading
    if (!isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <BookOpen className="w-12 h-12 text-[#CCAE70]" />
                </motion.div>
            </div>
        );
    }

    // Mobile version - Dark Academia notebook
    if (isMobile) {
        return (
            <>
                <style jsx global>{`
                    .mobile-paper {
                        background-color: ${COLORS.pageCream};
                        background-image: 
                            linear-gradient(to bottom, 
                                transparent 0px, 
                                transparent ${LINE_HEIGHT - 1}px, 
                                ${COLORS.lineColor} ${LINE_HEIGHT - 1}px, 
                                ${COLORS.lineColor} ${LINE_HEIGHT}px
                            );
                        background-size: 100% ${LINE_HEIGHT}px;
                        background-position: 0 20px;
                        color: ${COLORS.inkColor} !important;
                    }
                    
                    .mobile-journal-input {
                        font-family: 'Merriweather', Georgia, serif;
                        font-size: 1rem;
                        line-height: ${LINE_HEIGHT}px;
                        color: ${COLORS.inkColor} !important;
                        background: transparent;
                        resize: none;
                        border: none;
                        outline: none;
                        width: 100%;
                        height: 100%;
                        letter-spacing: 0.01em;
                        caret-color: ${COLORS.clay};
                    }
                    
                    .mobile-journal-input::placeholder {
                        color: rgba(60, 50, 40, 0.5) !important;
                        font-style: italic;
                    }
                `}</style>

                <div className="min-h-screen flex flex-col bg-[#191919]">
                    {/* Header */}
                    <header className="sticky top-0 z-30 bg-[#191919]/98 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)] px-4 py-3 safe-area-top">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push("/")}
                                    className="w-10 h-10 rounded-lg bg-[#2C2C2C] flex items-center justify-center active:scale-95 transition-transform"
                                >
                                    <Home className="w-5 h-5 text-[#9B9B9B]" />
                                </button>
                                <div>
                                    <h1 className="font-serif text-lg font-medium text-[#E3E3E3]">
                                        Meu Diário
                                    </h1>
                                    <p className="text-[11px] text-[#5A5A5A] capitalize font-medium">
                                        {formatDate(dateStr).split(",")[0]}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isSaving ? (
                                    <motion.div
                                        className="flex items-center gap-1.5 text-[#D99E6B]"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[#D99E6B]" />
                                        <span className="text-[11px]">Salvando</span>
                                    </motion.div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-[#8C9E78]">
                                        <Save className="w-4 h-4" />
                                        <span className="text-[11px]">Salvo</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Date Navigation Bar */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#202020] border-b border-[rgba(255,255,255,0.03)]">
                        <button
                            onClick={() => navigateDate(-1)}
                            className="p-2.5 rounded-lg bg-[#2C2C2C] text-[#9B9B9B] active:scale-95 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={goToToday}
                            className={cn(
                                "px-5 py-2 rounded-lg font-medium text-sm transition-all active:scale-95",
                                isToday
                                    ? "bg-[rgba(204,174,112,0.15)] text-[#CCAE70] border border-[rgba(204,174,112,0.3)]"
                                    : "bg-[#2C2C2C] text-[#9B9B9B]"
                            )}
                        >
                            {isToday ? "📅 Hoje" : formatShortDate(dateStr)}
                        </button>

                        <button
                            onClick={() => navigateDate(1)}
                            className="p-2.5 rounded-lg bg-[#2C2C2C] text-[#9B9B9B] active:scale-95 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notebook Paper Area */}
                    <div className="flex-1 mx-3 my-3 rounded-lg overflow-hidden shadow-2xl relative">
                        <div className="absolute inset-0 mobile-paper" />
                        <div
                            className="absolute left-8 top-0 bottom-0 w-[2px] z-10"
                            style={{ background: COLORS.marginRed }}
                        />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={dateStr}
                                initial={{ opacity: 0, x: pageDirection === 1 ? 50 : -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: pageDirection === 1 ? -50 : 50 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="relative z-20 h-full"
                            >
                                <textarea
                                    value={currentEntry.content}
                                    onChange={(e) => updateContent(e.target.value)}
                                    placeholder="Escreva seus pensamentos..."
                                    className="mobile-journal-input pl-10 pr-4 pt-[20px] pb-4"
                                    style={{ minHeight: "100%" }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Stats Bar */}
                    <div className="px-4 py-3 bg-[#202020] border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between safe-area-bottom">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[#9B9B9B]">
                                <PenLine className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">{wordCount} palavras</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#D99E6B]">
                                <Flame className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">{streak} dias</span>
                            </div>
                        </div>

                        {currentEntry.content.trim() && (
                            <button
                                onClick={deleteEntry}
                                className="p-2 rounded-lg text-[#C87F76]/60 hover:text-[#C87F76] hover:bg-[rgba(200,127,118,0.1)] transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </>
        );
    }

    // Desktop - Open book (Dark Academia style)
    return (
        <>
            <style jsx global>{`
                /* Override global text color for journal pages */
                .paper-page-left,
                .paper-page-left *,
                .paper-page-right-new,
                .paper-page-right-new * {
                    color: ${COLORS.inkColor} !important;
                }
                
                /* Base paper texture with noise */
                .paper-texture {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
                }

                /* Left page - aged parchment */
                .paper-page-left {
                    background: 
                        linear-gradient(to right, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 3%, transparent 10%),
                        linear-gradient(180deg, ${COLORS.pageCream} 0%, ${COLORS.pageMargin} 50%, #ede5d5 100%);
                }

                /* Right page - writing paper */
                .paper-page-right-new {
                    background-color: ${COLORS.pageCream};
                    background-image: 
                        linear-gradient(to left, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 2%, transparent 10%),
                        linear-gradient(180deg, #fdfaef 0%, ${COLORS.pageCream} 50%, ${COLORS.pageMargin} 100%);
                }

                /* Lined paper effect */
                .lined-paper-new {
                    background-image: 
                        linear-gradient(to bottom, 
                            transparent 0px, 
                            transparent ${LINE_HEIGHT - 1}px, 
                            ${COLORS.lineColor} ${LINE_HEIGHT - 1}px, 
                            ${COLORS.lineColor} ${LINE_HEIGHT}px
                        );
                    background-size: 100% ${LINE_HEIGHT}px;
                    background-position: 0 20px;
                }

                .page-shadow-left-new {
                    box-shadow: 
                        inset 15px 0 25px -12px rgba(0,0,0,0.12),
                        inset 0 3px 10px -5px rgba(0,0,0,0.06),
                        inset 0 -3px 10px -5px rgba(0,0,0,0.06),
                        -2px 4px 15px rgba(0,0,0,0.15);
                }

                .page-shadow-right-new {
                    box-shadow: 
                        inset -15px 0 25px -12px rgba(0,0,0,0.12),
                        inset 0 3px 10px -5px rgba(0,0,0,0.06),
                        inset 0 -3px 10px -5px rgba(0,0,0,0.06),
                        2px 4px 15px rgba(0,0,0,0.15);
                }

                .page-curl-new::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 35px;
                    height: 35px;
                    background: linear-gradient(135deg, 
                        transparent 45%, 
                        rgba(0,0,0,0.03) 50%, 
                        rgba(237,229,213,0.9) 52%, 
                        ${COLORS.pageMargin} 100%
                    );
                    border-radius: 0 0 3px 0;
                }

                .page-stack-new::before {
                    content: '';
                    position: absolute;
                    right: -4px;
                    top: 3px;
                    bottom: 3px;
                    width: 8px;
                    background: linear-gradient(to right, 
                        ${COLORS.pageMargin} 0%, 
                        #ddd4b8 50%, 
                        #ccc4a8 100%
                    );
                    border-radius: 0 3px 3px 0;
                    box-shadow: 2px 0 4px rgba(0,0,0,0.1);
                }

                .red-margin-new {
                    background: ${COLORS.marginRed};
                }

                .book-spine {
                    background: linear-gradient(90deg, 
                        #3a3530 0%, 
                        #4a4540 20%,
                        #2a2520 50%,
                        #4a4540 80%,
                        #3a3530 100%
                    );
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
                }

                .ribbon-new {
                    background: linear-gradient(180deg, 
                        ${COLORS.rust} 0%, 
                        #9e4040 50%, 
                        ${COLORS.rust} 100%
                    );
                    box-shadow: 2px 3px 8px rgba(0,0,0,0.4);
                    clip-path: polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%);
                }

                .journal-input-new {
                    font-family: 'Merriweather', Georgia, serif;
                    font-size: 1.05rem;
                    line-height: ${LINE_HEIGHT}px;
                    color: ${COLORS.inkColor} !important;
                    background: transparent;
                    resize: none;
                    border: none;
                    outline: none;
                    width: 100%;
                    height: 100%;
                    letter-spacing: 0.01em;
                    caret-color: ${COLORS.clay};
                }

                .journal-input-new::placeholder {
                    color: rgba(60, 50, 40, 0.5) !important;
                    font-style: italic;
                }

                /* Book cover edges - dark leather */
                .leather-edge-left {
                    background: linear-gradient(90deg, 
                        #2a2520 0%, 
                        #3a3530 40%, 
                        #2a2520 70%, 
                        #252018 100%
                    );
                    box-shadow: -3px 0 8px rgba(0,0,0,0.35);
                }

                .leather-edge-right {
                    background: linear-gradient(90deg, 
                        #252018 0%, 
                        #2a2520 30%, 
                        #3a3530 60%, 
                        #2a2520 100%
                    );
                    box-shadow: 3px 0 8px rgba(0,0,0,0.35);
                }
            `}</style>

            <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: COLORS.charcoal }}>
                {/* Home Button */}
                <button
                    onClick={() => router.push("/")}
                    className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2C2C2C] hover:bg-[#3A3A3A] text-[#E3E3E3] shadow-lg transition-all hover:scale-105"
                >
                    <Home className="w-4 h-4" />
                    <span className="text-sm font-medium">Início</span>
                </button>

                {/* Floating dust particles */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-[#CCAE70]/10"
                            style={{ left: `${20 + i * 12}%`, top: `${15 + (i % 3) * 30}%` }}
                            animate={{ y: [0, -25, 0], opacity: [0.05, 0.2, 0.05] }}
                            transition={{ duration: 6 + i * 0.7, repeat: Infinity, delay: i * 0.4 }}
                        />
                    ))}
                </div>

                {/* OPEN BOOK */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: isReady ? 1 : 0, scale: isReady ? 1 : 0.96, y: isReady ? 0 : 15 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex relative"
                    style={{
                        width: 950,
                        height: 560,
                        boxShadow: "0 30px 70px rgba(0,0,0,0.45), 0 15px 30px rgba(0,0,0,0.35)",
                        borderRadius: "6px"
                    }}
                >
                    {/* Leather book cover - left edge */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 leather-edge-left rounded-l-md z-10" />

                    {/* LEFT PAGE - Navigation & Stats */}
                    <div
                        className="w-[385px] ml-3 paper-page-left page-shadow-left-new paper-texture p-5 flex flex-col relative"
                        style={{ borderRadius: "2px 0 0 2px", color: "#1a1410" }}
                        data-journal-paper="true"
                    >
                        {/* Date Navigation */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center justify-between mb-4 pb-2 border-b border-[rgba(60,50,40,0.12)]"
                        >
                            <button
                                onClick={() => navigateDate(-1)}
                                className="p-1.5 rounded-md hover:bg-[rgba(60,50,40,0.08)] text-[#5a4a3a] transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="text-center">
                                <p className="font-serif text-sm font-semibold capitalize text-[#1a1410]">
                                    {formatDate(dateStr)}
                                </p>
                                {isToday && (
                                    <span className="text-[10px] text-[#4a6a3a] uppercase tracking-widest font-medium">
                                        Hoje
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => navigateDate(1)}
                                className="p-1.5 rounded-md hover:bg-[rgba(60,50,40,0.08)] text-[#5a4a3a] transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </motion.div>

                        {/* Mini Calendar */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mb-4"
                        >
                            <p className="text-[10px] uppercase tracking-widest text-[#4a3a2a] mb-2 font-semibold capitalize">
                                {calendarData.monthName} {calendarData.year}
                            </p>
                            <div className="grid grid-cols-7 gap-0.5 text-[10px]">
                                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                                    <div key={i} className="text-center text-[#5a4a3a] font-semibold py-0.5">
                                        {d}
                                    </div>
                                ))}
                                {calendarData.days.map((day, i) => {
                                    if (day === null) return <div key={i} />;
                                    const dateKey = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                    const hasEntry = allEntries[dateKey]?.content.trim();
                                    const isSelected = day === calendarData.selectedDay;
                                    const isTodayDate = day === calendarData.today && calendarData.month === calendarData.todayMonth && calendarData.year === calendarData.todayYear;

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => goToDate(day)}
                                            className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all mx-auto",
                                                isSelected && "bg-[#CCAE70] text-[#2a1a0a] font-bold shadow-sm",
                                                !isSelected && isTodayDate && "ring-1.5 ring-[#8a7340] text-[#1a1410] font-semibold",
                                                !isSelected && hasEntry && "bg-[rgba(140,115,64,0.25)] text-[#1a1410]",
                                                !isSelected && !hasEntry && "text-[#4a3a2a] hover:bg-[rgba(60,50,40,0.1)]"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Writer Level Card */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="mb-3 bg-gradient-to-br from-[rgba(204,174,112,0.15)] to-[rgba(217,158,107,0.1)] rounded-lg p-3 border border-[rgba(204,174,112,0.2)]"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <motion.span
                                    className="text-xl"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {writerLevel.icon}
                                </motion.span>
                                <div className="flex-1">
                                    <p className="text-[9px] uppercase text-[#4a3a2a] tracking-wider font-medium">Nível de Escritor</p>
                                    <p className="text-sm font-semibold text-[#1a1410]">{writerLevel.name}</p>
                                </div>
                            </div>
                            <div className="h-1.5 bg-[rgba(60,50,40,0.15)] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${writerProgress}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: writerLevel.color }}
                                />
                            </div>
                            <p className="text-[8px] text-[#5a4a3a] mt-1 text-right">
                                {totalWords.toLocaleString()} palavras totais
                            </p>
                        </motion.div>

                        {/* Daily Goal Progress */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-3 bg-gradient-to-br from-[rgba(140,158,120,0.15)] to-[rgba(118,140,158,0.1)] rounded-lg p-3 border border-[rgba(140,158,120,0.2)]"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-[#5a6a48]" />
                                    <p className="text-[9px] uppercase text-[#4a3a2a] tracking-wider font-medium">Meta Diária</p>
                                </div>
                                <span className="text-[10px] font-bold text-[#5a6a48]">
                                    {wordCount}/{DAILY_WORD_GOAL}
                                </span>
                            </div>
                            <div className="h-2 bg-[rgba(60,50,40,0.15)] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${goalProgress}%` }}
                                    transition={{ duration: 0.5 }}
                                    className={cn(
                                        "h-full rounded-full transition-colors",
                                        goalProgress >= 100 ? "bg-[#8C9E78]" : "bg-[#768C9E]"
                                    )}
                                />
                            </div>
                            {goalProgress >= 100 && (
                                <p className="text-[8px] text-[#5a6a48] mt-1 text-center font-semibold">
                                    🎉 Meta atingida!
                                </p>
                            )}
                        </motion.div>

                        {/* Stats Cards */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.45 }}
                            className="grid grid-cols-2 gap-2 mb-4"
                        >
                            <div className="bg-gradient-to-br from-[rgba(217,158,107,0.15)] to-[rgba(204,174,112,0.1)] rounded-lg p-2.5 text-center border border-[rgba(217,158,107,0.2)]">
                                <Flame className="w-4 h-4 text-[#9a6840] mx-auto mb-1" />
                                <p className="font-serif text-xl font-bold text-[#1a1410]">
                                    {streak}
                                </p>
                                <p className="text-[8px] uppercase text-[#4a3a2a] tracking-wider font-medium">
                                    dias seguidos
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-[rgba(204,174,112,0.15)] to-[rgba(140,158,120,0.1)] rounded-lg p-2.5 text-center border border-[rgba(204,174,112,0.2)]">
                                <FileText className="w-4 h-4 text-[#8a7340] mx-auto mb-1" />
                                <p className="font-serif text-xl font-bold text-[#1a1410]">
                                    {monthWords}
                                </p>
                                <p className="text-[8px] uppercase text-[#4a3a2a] tracking-wider font-medium">
                                    palavras/mês
                                </p>
                            </div>
                        </motion.div>

                        {/* Recent Entries */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex-1 overflow-hidden"
                        >
                            <p className="text-[10px] uppercase tracking-widest text-[#3a2a1a] mb-2 font-semibold flex items-center gap-1.5">
                                <PenLine className="w-3 h-3" /> Entradas Recentes
                            </p>
                            {recentEntries.length === 0 ? (
                                <p className="text-xs text-[#5a4a3a] italic">Nenhuma entrada ainda...</p>
                            ) : (
                                <div className="space-y-1">
                                    {recentEntries.map((entry) => (
                                        <button
                                            key={entry.date}
                                            onClick={() => setCurrentDate(new Date(entry.date + "T12:00:00"))}
                                            className={cn(
                                                "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all",
                                                entry.date === dateStr
                                                    ? "bg-[rgba(140,115,64,0.25)] text-[#1a1410] font-medium"
                                                    : "hover:bg-[rgba(60,50,40,0.08)] text-[#2a1a0a]"
                                            )}
                                        >
                                            <span className="font-semibold">{formatShortDate(entry.date)}</span>
                                            <span className="text-[#5a4a3a] ml-2 line-clamp-1">
                                                {entry.content.substring(0, 25)}...
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Footer Status */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="pt-3 border-t border-[rgba(60,50,40,0.1)] flex items-center justify-between text-[10px]"
                        >
                            <span className="text-[#4a3a2a] font-medium">{wordCount} palavras</span>
                            <div className="flex items-center gap-2">
                                {isSaving ? (
                                    <span className="text-[#9a6840] flex items-center gap-1">
                                        <motion.div
                                            className="w-1.5 h-1.5 rounded-full bg-[#9a6840]"
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                        />
                                        Salvando
                                    </span>
                                ) : (
                                    <span className="text-[#4a6a3a] flex items-center gap-1">
                                        <Save className="w-3 h-3" /> Salvo
                                    </span>
                                )}
                                {currentEntry.content.trim() && (
                                    <button
                                        onClick={deleteEntry}
                                        className="p-1 rounded hover:bg-[rgba(200,127,118,0.15)] text-[#6a4a3a] hover:text-[#8a4a42] transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* BOOK SPINE */}
                    <div className="w-5 flex-shrink-0 relative book-spine">
                        <div className="ribbon-new absolute left-1/2 -translate-x-1/2 -top-1 w-4 h-24 z-20" />
                        <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-px bg-[rgba(204,174,112,0.2)]" />
                    </div>

                    {/* RIGHT PAGE - WRITING AREA */}
                    <div
                        className="flex-1 paper-page-right-new page-shadow-right-new page-stack-new page-curl-new paper-texture lined-paper-new relative overflow-hidden"
                        style={{ borderRadius: "0 2px 2px 0", perspective: "1000px" }}
                    >
                        <div className="absolute left-8 top-0 bottom-0 w-[2px] red-margin-new z-10" />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={dateStr}
                                initial={{
                                    opacity: 0,
                                    rotateY: pageDirection === 1 ? -15 : 15,
                                    x: pageDirection === 1 ? 30 : -30
                                }}
                                animate={{
                                    opacity: 1,
                                    rotateY: 0,
                                    x: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    rotateY: pageDirection === 1 ? 15 : -15,
                                    x: pageDirection === 1 ? -30 : 30
                                }}
                                transition={{
                                    duration: 0.35,
                                    ease: [0.4, 0, 0.2, 1]
                                }}
                                className="h-full pl-10 pr-6 pt-3 pb-5 flex flex-col"
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                {/* Mood Tracker */}
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[rgba(60,50,40,0.08)]">
                                    <span className="text-[9px] uppercase text-[#5a4a3a] tracking-wider font-medium">Como você está?</span>
                                    <div className="flex gap-1">
                                        {MOOD_OPTIONS.map((mood) => (
                                            <button
                                                key={mood.emoji}
                                                onClick={() => updateMood(mood.emoji)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110",
                                                    currentEntry.mood === mood.emoji
                                                        ? "bg-[rgba(204,174,112,0.3)] ring-1 ring-[#CCAE70] scale-110"
                                                        : "hover:bg-[rgba(60,50,40,0.08)]"
                                                )}
                                                title={mood.label}
                                            >
                                                {mood.emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Writing Prompt */}
                                {!currentEntry.content.trim() && (
                                    <div className="mb-3 p-2.5 bg-[rgba(204,174,112,0.08)] rounded-lg border border-[rgba(204,174,112,0.12)]">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Sparkles className="w-3 h-3 text-[#8a7340]" />
                                            <span className="text-[9px] uppercase text-[#5a4a3a] tracking-wider font-medium">Sugestão do dia</span>
                                        </div>
                                        <p className="text-[11px] text-[#3a2a1a] italic leading-relaxed">
                                            "{dailyPrompt}"
                                        </p>
                                    </div>
                                )}

                                <textarea
                                    ref={textareaRef}
                                    value={currentEntry.content}
                                    onChange={(e) => updateContent(e.target.value)}
                                    placeholder="Escreva seus pensamentos aqui..."
                                    className="journal-input-new flex-1"
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Leather book cover - right edge */}
                    <div className="absolute right-0 top-0 bottom-0 w-3 leather-edge-right rounded-r-md z-10" />
                </motion.div>
            </div>

            {/* Goal Celebration */}
            <AnimatePresence>
                {showGoalCelebration && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#202020] border border-[rgba(140,158,120,0.3)] rounded-xl px-6 py-4 shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <motion.span
                                className="text-3xl"
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5 }}
                            >
                                🎉
                            </motion.span>
                            <div>
                                <p className="text-[#E3E3E3] font-semibold">Meta Diária Atingida!</p>
                                <p className="text-[#8C9E78] text-sm">{DAILY_WORD_GOAL} palavras escritas hoje</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FloatingDock */}
            <FloatingDock />
        </>
    );
}
