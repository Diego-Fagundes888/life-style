"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
    /** Mês selecionado (0-11) */
    month: number;
    /** Ano selecionado */
    year: number;
    /** Callback de mudança */
    onChange: (month: number, year: number) => void;
    /** Se há dados para o mês atual (indicador visual) */
    hasData?: boolean;
}

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/**
 * MonthSelector - Seletor de mês/ano para navegação temporal.
 */
export function MonthSelector({
    month,
    year,
    onChange,
    hasData = false,
}: MonthSelectorProps) {
    const [showDropdown, setShowDropdown] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const now = new Date();
    const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
    const isFutureMonth = year > now.getFullYear() ||
        (year === now.getFullYear() && month > now.getMonth());

    const goToPrevious = () => {
        if (month === 0) {
            onChange(11, year - 1);
        } else {
            onChange(month - 1, year);
        }
    };

    const goToNext = () => {
        if (isFutureMonth) return;
        if (month === 11) {
            onChange(0, year + 1);
        } else {
            onChange(month + 1, year);
        }
    };

    const goToCurrent = () => {
        onChange(now.getMonth(), now.getFullYear());
        setShowDropdown(false);
    };

    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Generate years for dropdown (last 3 years)
    const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                    onClick={goToPrevious}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Mês anterior"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Month/Year Display */}
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg",
                        "bg-slate-800/50 border border-slate-700",
                        "hover:bg-slate-800 hover:border-slate-600",
                        "transition-colors min-w-[180px] justify-center"
                    )}
                >
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-100">
                        {MONTHS[month]} {year}
                    </span>
                    {isCurrentMonth && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-400 rounded">
                            Atual
                        </span>
                    )}
                    {hasData && !isCurrentMonth && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Dados existentes" />
                    )}
                </button>

                {/* Next Button */}
                <button
                    onClick={goToNext}
                    disabled={isFutureMonth}
                    className={cn(
                        "p-2 rounded-lg transition-colors",
                        isFutureMonth
                            ? "text-slate-600 cursor-not-allowed"
                            : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                    title="Próximo mês"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-4 min-w-[280px]"
                >
                    {/* Quick Actions */}
                    <button
                        onClick={goToCurrent}
                        className="w-full mb-3 py-2 px-3 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-colors"
                    >
                        Ir para Mês Atual
                    </button>

                    {/* Year Tabs */}
                    <div className="flex gap-2 mb-3">
                        {years.map((y) => (
                            <button
                                key={y}
                                onClick={() => onChange(month, y)}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                    y === year
                                        ? "bg-slate-700 text-slate-100"
                                        : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                {y}
                            </button>
                        ))}
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {MONTHS.map((m, i) => {
                            const isDisabled = year === now.getFullYear() && i > now.getMonth();
                            const isSelected = i === month;

                            return (
                                <button
                                    key={m}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            onChange(i, year);
                                            setShowDropdown(false);
                                        }
                                    }}
                                    disabled={isDisabled}
                                    className={cn(
                                        "py-2 px-3 rounded-lg text-sm transition-colors",
                                        isDisabled && "opacity-30 cursor-not-allowed",
                                        isSelected
                                            ? "bg-indigo-600 text-white"
                                            : "text-slate-300 hover:bg-slate-700"
                                    )}
                                >
                                    {m.substring(0, 3)}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
