"use client";

import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/lib/mock-data";
import {
    Sun,
    Moon,
    Sparkles,
    Heart,
    Lightbulb,
    TrendingUp,
    PenLine,
} from "lucide-react";

interface JournalEditorProps {
    journal: JournalEntry;
    onJournalChange: (journal: JournalEntry) => void;
}

/**
 * JournalEditor - Structured journaling with morning and evening sections.
 * 
 * Features:
 * - Morning: Daily intention + 3 gratitude items
 * - Evening: Brain dump + lessons learned + improvements
 * - Elegant, paper-like text editing experience
 */
export function JournalEditor({ journal, onJournalChange }: JournalEditorProps) {
    const updateJournal = (updates: Partial<JournalEntry>) => {
        onJournalChange({ ...journal, ...updates });
    };

    const updateGratitude = (index: number, value: string) => {
        const newGratitude = [...journal.gratitude];
        newGratitude[index] = value;
        updateJournal({ gratitude: newGratitude });
    };

    // Ensure we have 3 gratitude slots
    const gratitudeItems = [
        journal.gratitude[0] || "",
        journal.gratitude[1] || "",
        journal.gratitude[2] || "",
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <PenLine className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-slate-100">Diário de Bordo</h2>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
                {/* ================================================================
                    MORNING SECTION
                ================================================================ */}
                <section className="space-y-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-amber-500/20">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Sun className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-100">Preparação Matinal</h3>
                            <p className="text-xs text-slate-500">Defina sua intenção e cultive gratidão</p>
                        </div>
                    </div>

                    {/* Daily Intention */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            Intenção do Dia
                        </label>
                        <TextareaAutosize
                            value={journal.dailyIntention}
                            onChange={(e) => updateJournal({ dailyIntention: e.target.value })}
                            placeholder="Qual é o foco principal de hoje? O que você quer realizar?"
                            minRows={2}
                            className={cn(
                                "w-full px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-xl",
                                "text-slate-100 placeholder-slate-500 resize-none",
                                "focus:outline-none focus:border-amber-500/50 focus:bg-slate-800/50",
                                "transition-colors text-base leading-relaxed"
                            )}
                        />
                    </div>

                    {/* Gratitude */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Heart className="h-4 w-4 text-rose-400" />
                            Eu sou grato por...
                        </label>
                        <div className="space-y-2">
                            {gratitudeItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-mono text-slate-500 bg-slate-800/50 rounded-full">
                                        {index + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateGratitude(index, e.target.value)}
                                        placeholder={
                                            index === 0
                                                ? "Uma pessoa na minha vida..."
                                                : index === 1
                                                    ? "Uma oportunidade que tenho..."
                                                    : "Algo simples que me traz alegria..."
                                        }
                                        className={cn(
                                            "flex-1 px-3 py-2 bg-transparent border-b border-slate-700/50",
                                            "text-slate-100 placeholder-slate-600 text-sm",
                                            "focus:outline-none focus:border-rose-500/50",
                                            "transition-colors"
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================================================================
                    EVENING SECTION
                ================================================================ */}
                <section className="space-y-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-indigo-500/20">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Moon className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-100">Reflexão Noturna</h3>
                            <p className="text-xs text-slate-500">Processe o dia e extraia aprendizados</p>
                        </div>
                    </div>

                    {/* Day Review (Brain Dump) */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <PenLine className="h-4 w-4 text-indigo-400" />
                            O que aconteceu hoje?
                        </label>
                        <TextareaAutosize
                            value={journal.dayReview}
                            onChange={(e) => updateJournal({ dayReview: e.target.value })}
                            placeholder="Escreva livremente sobre o seu dia. Eventos, pensamentos, sentimentos, conquistas, frustrações..."
                            minRows={5}
                            className={cn(
                                "w-full px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-xl",
                                "text-slate-100 placeholder-slate-500 resize-none",
                                "focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800/50",
                                "transition-colors text-base leading-relaxed font-serif"
                            )}
                        />
                    </div>

                    {/* Lessons Learned */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Lightbulb className="h-4 w-4 text-amber-400" />
                            O que eu aprendi hoje?
                        </label>
                        <TextareaAutosize
                            value={journal.lessonsLearned}
                            onChange={(e) => updateJournal({ lessonsLearned: e.target.value })}
                            placeholder="Insights, descobertas, ou novas perspectivas..."
                            minRows={2}
                            className={cn(
                                "w-full px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-xl",
                                "text-slate-100 placeholder-slate-500 resize-none",
                                "focus:outline-none focus:border-amber-500/50 focus:bg-slate-800/50",
                                "transition-colors text-base leading-relaxed"
                            )}
                        />
                    </div>

                    {/* Improvements */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            O que poderia ter sido melhor?
                        </label>
                        <TextareaAutosize
                            value={journal.improvements}
                            onChange={(e) => updateJournal({ improvements: e.target.value })}
                            placeholder="Oportunidades de melhoria para amanhã..."
                            minRows={2}
                            className={cn(
                                "w-full px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-xl",
                                "text-slate-100 placeholder-slate-500 resize-none",
                                "focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/50",
                                "transition-colors text-base leading-relaxed"
                            )}
                        />
                    </div>
                </section>

                {/* Spacer for scroll */}
                <div className="h-4" />
            </div>
        </div>
    );
}
