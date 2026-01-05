"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { TimeBlockEntry } from "@/lib/mock-data";
import {
    Plus,
    Check,
    Trash2,
    GripVertical,
    Clock,
} from "lucide-react";

interface TimeBlockListProps {
    blocks: TimeBlockEntry[];
    onBlocksChange: (blocks: TimeBlockEntry[]) => void;
    currentTime: { hours: number; minutes: number };
}

/**
 * TimeBlockList - A vertical timeline of 24h time blocks.
 * 
 * Features:
 * - Vertical timeline with connected line
 * - Inline editing for time and task
 * - Current time indicator (red line)
 * - Subtle checkboxes for completion
 */
export function TimeBlockList({ blocks, onBlocksChange, currentTime }: TimeBlockListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sort blocks by time
    const sortedBlocks = useMemo(() => {
        return [...blocks].sort((a, b) => a.time.localeCompare(b.time));
    }, [blocks]);

    // Calculate current time position percentage
    const currentTimeMinutes = currentTime.hours * 60 + currentTime.minutes;

    // Find where to insert current time indicator
    const currentTimeBlockIndex = useMemo(() => {
        const currentTimeStr = `${String(currentTime.hours).padStart(2, "0")}:${String(currentTime.minutes).padStart(2, "0")}`;
        for (let i = 0; i < sortedBlocks.length; i++) {
            if (sortedBlocks[i].time > currentTimeStr) {
                return i;
            }
        }
        return sortedBlocks.length;
    }, [sortedBlocks, currentTime]);

    const addBlock = (afterIndex?: number) => {
        const now = new Date();
        const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const newBlock: TimeBlockEntry = {
            id: `tb_${Date.now()}`,
            time: defaultTime,
            task: "",
            completed: false,
        };

        if (afterIndex !== undefined) {
            const newBlocks = [...blocks];
            newBlocks.splice(afterIndex + 1, 0, newBlock);
            onBlocksChange(newBlocks);
        } else {
            onBlocksChange([...blocks, newBlock]);
        }

        setEditingId(newBlock.id);
    };

    const updateBlock = (id: string, updates: Partial<TimeBlockEntry>) => {
        onBlocksChange(blocks.map(b =>
            b.id === id ? { ...b, ...updates } : b
        ));
    };

    const deleteBlock = (id: string) => {
        onBlocksChange(blocks.filter(b => b.id !== id));
    };

    const toggleComplete = (id: string) => {
        const block = blocks.find(b => b.id === id);
        if (block) {
            updateBlock(id, { completed: !block.completed });
        }
    };

    // Check if a block's time has passed
    const isTimePassed = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        const blockMinutes = h * 60 + m;
        return blockMinutes <= currentTimeMinutes;
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-lg font-semibold text-slate-100">Cronograma do Dia</h2>
                </div>
                <button
                    onClick={() => addBlock()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar
                </button>
            </div>

            {/* Empty State */}
            {sortedBlocks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="h-12 w-12 text-slate-600 mb-4" />
                    <p className="text-slate-400 mb-4">Nenhum bloco de tempo registrado</p>
                    <button
                        onClick={() => addBlock()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Criar Primeiro Bloco
                    </button>
                </div>
            )}

            {/* Timeline */}
            {sortedBlocks.length > 0 && (
                <div className="relative pl-8">
                    {/* Vertical Line */}
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700" />

                    {/* Time Blocks */}
                    <div className="space-y-1">
                        {sortedBlocks.map((block, index) => {
                            const passed = isTimePassed(block.time);
                            const isEditing = editingId === block.id;
                            const showTimeIndicator = index === currentTimeBlockIndex;

                            return (
                                <div key={block.id}>
                                    {/* Current Time Indicator - Before this block */}
                                    {showTimeIndicator && (
                                        <div className="relative flex items-center py-2 -ml-8">
                                            <div className="absolute left-0 right-0 h-0.5 bg-rose-500" />
                                            <div className="absolute left-2 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-slate-900 shadow-lg shadow-rose-500/30" />
                                            <span className="ml-10 px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-mono rounded">
                                                {String(currentTime.hours).padStart(2, "0")}:{String(currentTime.minutes).padStart(2, "0")}
                                            </span>
                                        </div>
                                    )}

                                    {/* Block Row */}
                                    <div
                                        className={cn(
                                            "group relative flex items-start gap-4 py-3 px-3 -ml-8 rounded-lg transition-colors",
                                            isEditing && "bg-slate-800/50",
                                            !isEditing && "hover:bg-slate-800/30"
                                        )}
                                    >
                                        {/* Marker */}
                                        <div className="relative flex-shrink-0 flex items-center justify-center w-6 h-6 mt-0.5">
                                            <div
                                                className={cn(
                                                    "w-3 h-3 rounded-full border-2 transition-all",
                                                    block.completed
                                                        ? "bg-emerald-500 border-emerald-400"
                                                        : passed
                                                            ? "bg-slate-600 border-slate-500"
                                                            : "bg-slate-800 border-slate-600"
                                                )}
                                            />
                                        </div>

                                        {/* Time Input */}
                                        <input
                                            type="time"
                                            value={block.time}
                                            onChange={(e) => updateBlock(block.id, { time: e.target.value })}
                                            className={cn(
                                                "w-20 px-2 py-1 bg-transparent border-none text-sm font-mono transition-colors",
                                                block.completed
                                                    ? "text-slate-500 line-through"
                                                    : passed
                                                        ? "text-slate-400"
                                                        : "text-indigo-400",
                                                "focus:outline-none focus:ring-0"
                                            )}
                                        />

                                        {/* Task Input */}
                                        <input
                                            type="text"
                                            value={block.task}
                                            onChange={(e) => updateBlock(block.id, { task: e.target.value })}
                                            onFocus={() => setEditingId(block.id)}
                                            onBlur={() => setEditingId(null)}
                                            placeholder="Descreva a atividade..."
                                            className={cn(
                                                "flex-1 px-2 py-1 bg-transparent border-none text-sm transition-colors",
                                                block.completed
                                                    ? "text-slate-500 line-through"
                                                    : "text-slate-200",
                                                "placeholder-slate-600 focus:outline-none focus:ring-0"
                                            )}
                                        />

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Complete Toggle */}
                                            <button
                                                onClick={() => toggleComplete(block.id)}
                                                className={cn(
                                                    "p-1.5 rounded-lg transition-colors",
                                                    block.completed
                                                        ? "text-emerald-400 bg-emerald-500/20"
                                                        : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                )}
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>

                                            {/* Add After */}
                                            <button
                                                onClick={() => addBlock(index)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => deleteBlock(block.id)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Current Time Indicator - At the end if all blocks passed */}
                        {currentTimeBlockIndex === sortedBlocks.length && sortedBlocks.length > 0 && (
                            <div className="relative flex items-center py-2 -ml-8">
                                <div className="absolute left-0 right-0 h-0.5 bg-rose-500" />
                                <div className="absolute left-2 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-slate-900 shadow-lg shadow-rose-500/30" />
                                <span className="ml-10 px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-mono rounded">
                                    {String(currentTime.hours).padStart(2, "0")}:{String(currentTime.minutes).padStart(2, "0")} - Agora
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
