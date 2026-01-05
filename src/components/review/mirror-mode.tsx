"use client";

import * as React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { motion } from "framer-motion";
import { Clock, Edit3, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MirrorModeProps {
    /** Título do mês anterior */
    previousMonthLabel: string;
    /** Título do mês atual */
    currentMonthLabel: string;
    /** Perguntas a serem exibidas */
    questions: Array<{
        id: string;
        question: string;
    }>;
    /** Respostas do mês anterior (somente leitura) */
    previousAnswers: Record<string, string>;
    /** Respostas do mês atual (editáveis) */
    currentAnswers: Record<string, string>;
    /** Callback para atualizar respostas */
    onAnswerChange: (questionId: string, value: string) => void;
    /** Cor do tema */
    color?: "rose" | "blue" | "amber" | "emerald" | "violet";
}

const colorClasses = {
    rose: "border-rose-500/30 focus:border-rose-500",
    blue: "border-blue-500/30 focus:border-blue-500",
    amber: "border-amber-500/30 focus:border-amber-500",
    emerald: "border-emerald-500/30 focus:border-emerald-500",
    violet: "border-violet-500/30 focus:border-violet-500",
};

/** Dicas motivacionais para empty state */
const MOTIVATIONAL_TIPS = [
    "Esta é sua primeira reflexão neste pilar. Seja honesto consigo mesmo.",
    "Não há respostas certas ou erradas. O importante é refletir.",
    "Use este espaço para organizar seus pensamentos e definir intenções.",
    "Ao escrever, você transforma pensamentos vagos em clareza.",
    "Compare suas respostas mês a mês para ver sua evolução.",
];

/**
 * EmptyStateCard - Componente para quando não há resposta anterior.
 */
function EmptyStateCard({ monthLabel }: { monthLabel: string }) {
    const randomTip = MOTIVATIONAL_TIPS[Math.floor(Math.random() * MOTIVATIONAL_TIPS.length)];

    return (
        <div className={cn(
            "p-4 rounded-lg min-h-[100px] flex flex-col items-center justify-center text-center",
            "bg-gradient-to-br from-slate-800/30 to-slate-800/10 border border-dashed border-slate-700/50"
        )}>
            <div className="p-2 rounded-full bg-slate-700/50 mb-3">
                <Sparkles className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-sm text-slate-500 mb-2">
                Primeira reflexão de <span className="text-slate-400">{monthLabel}</span>
            </p>
            <div className="flex items-start gap-2 text-xs text-slate-600 max-w-[200px]">
                <Lightbulb className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span className="italic">{randomTip}</span>
            </div>
        </div>
    );
}

/**
 * MirrorMode - Componente de "Modo Espelho" para comparar 
 * respostas do mês anterior com o mês atual.
 */
export function MirrorMode({
    previousMonthLabel,
    currentMonthLabel,
    questions,
    previousAnswers,
    currentAnswers,
    onAnswerChange,
    color = "blue",
}: MirrorModeProps) {
    // Check if any previous answers exist
    const hasPreviousData = Object.values(previousAnswers).some(a => a && a.trim().length > 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                    <Edit3 className="h-4 w-4" />
                    <h3 className="text-sm font-medium uppercase tracking-wider">
                        Reflexão Qualitativa
                    </h3>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="text-slate-500">Mês Anterior</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Edit3 className="h-3 w-3 text-indigo-400" />
                        <span className="text-indigo-400">Atual (Editável)</span>
                    </div>
                </div>
            </div>

            {questions.map((q, index) => (
                <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-3"
                >
                    {/* Pergunta */}
                    <p className="text-slate-200 font-medium">
                        {index + 1}. {q.question}
                    </p>

                    {/* Grid de Comparação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Coluna: Mês Anterior (Read Only) */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-slate-500" />
                                <span className="text-xs text-slate-500 uppercase tracking-wider">
                                    {previousMonthLabel}
                                </span>
                            </div>

                            {previousAnswers[q.id] && previousAnswers[q.id].trim().length > 0 ? (
                                <div className={cn(
                                    "p-4 rounded-lg min-h-[100px]",
                                    "bg-slate-800/30 border border-slate-700/50",
                                    "text-slate-400 italic text-sm"
                                )}>
                                    {previousAnswers[q.id]}
                                </div>
                            ) : (
                                <EmptyStateCard monthLabel={previousMonthLabel} />
                            )}
                        </div>

                        {/* Coluna: Mês Atual (Editável) */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Edit3 className="h-3 w-3 text-indigo-400" />
                                <span className="text-xs text-indigo-400 uppercase tracking-wider font-medium">
                                    {currentMonthLabel}
                                </span>
                                {currentAnswers[q.id] && currentAnswers[q.id].trim().length > 0 && (
                                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        ✓ Preenchido
                                    </span>
                                )}
                            </div>
                            <TextareaAutosize
                                value={currentAnswers[q.id] || ""}
                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                placeholder="Escreva sua reflexão..."
                                minRows={3}
                                maxRows={10}
                                className={cn(
                                    "w-full p-4 rounded-lg resize-none",
                                    "bg-slate-800/50 border-2 text-slate-100",
                                    "placeholder:text-slate-500",
                                    "focus:outline-none focus:ring-0",
                                    "transition-colors duration-200",
                                    colorClasses[color]
                                )}
                            />
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* Completion hint */}
            {!hasPreviousData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-center"
                >
                    <p className="text-sm text-indigo-300">
                        💡 <strong>Dica:</strong> No próximo mês, suas respostas de hoje aparecerão
                        na coluna esquerda para você comparar sua evolução.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
