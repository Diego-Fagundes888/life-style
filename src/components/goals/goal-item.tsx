"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, Minus, Plus, Pencil, Trash2 } from "lucide-react";
import { Goal, calculateGoalProgress, CategoryColor, isGoalComplete } from "@/lib/types/goals";
import { cn } from "@/lib/utils";

/**
 * DARK ACADEMIA PALETTE - Progress Bar Colors
 */
const progressColors: Record<CategoryColor, string> = {
    // New Dark Academia colors
    rust: "bg-[#C87F76]",
    clay: "bg-[#D99E6B]",
    olive: "bg-[#8C9E78]",
    slate: "bg-[#768C9E]",
    gold: "bg-[#CCAE70]",
    // Legacy mappings
    rose: "bg-[#C87F76]",
    blue: "bg-[#768C9E]",
    emerald: "bg-[#8C9E78]",
    amber: "bg-[#D99E6B]",
    violet: "bg-[#CCAE70]",
    cyan: "bg-[#768C9E]",
};

/**
 * DARK ACADEMIA PALETTE - Accent Colors
 */
const accentColors: Record<CategoryColor, {
    text: string;
    border: string;
    bg: string;
    ring: string;
    checkbox: string;
}> = {
    // New Dark Academia colors
    rust: {
        text: "text-[#C87F76]",
        border: "border-[#C87F76]",
        bg: "bg-[#C87F76]",
        ring: "ring-[#C87F76]/30",
        checkbox: "bg-[#C87F76]",
    },
    clay: {
        text: "text-[#D99E6B]",
        border: "border-[#D99E6B]",
        bg: "bg-[#D99E6B]",
        ring: "ring-[#D99E6B]/30",
        checkbox: "bg-[#D99E6B]",
    },
    olive: {
        text: "text-[#8C9E78]",
        border: "border-[#8C9E78]",
        bg: "bg-[#8C9E78]",
        ring: "ring-[#8C9E78]/30",
        checkbox: "bg-[#8C9E78]",
    },
    slate: {
        text: "text-[#768C9E]",
        border: "border-[#768C9E]",
        bg: "bg-[#768C9E]",
        ring: "ring-[#768C9E]/30",
        checkbox: "bg-[#768C9E]",
    },
    gold: {
        text: "text-[#CCAE70]",
        border: "border-[#CCAE70]",
        bg: "bg-[#CCAE70]",
        ring: "ring-[#CCAE70]/30",
        checkbox: "bg-[#CCAE70]",
    },
    // Legacy mappings
    rose: {
        text: "text-[#C87F76]",
        border: "border-[#C87F76]",
        bg: "bg-[#C87F76]",
        ring: "ring-[#C87F76]/30",
        checkbox: "bg-[#C87F76]",
    },
    blue: {
        text: "text-[#768C9E]",
        border: "border-[#768C9E]",
        bg: "bg-[#768C9E]",
        ring: "ring-[#768C9E]/30",
        checkbox: "bg-[#768C9E]",
    },
    emerald: {
        text: "text-[#8C9E78]",
        border: "border-[#8C9E78]",
        bg: "bg-[#8C9E78]",
        ring: "ring-[#8C9E78]/30",
        checkbox: "bg-[#8C9E78]",
    },
    amber: {
        text: "text-[#D99E6B]",
        border: "border-[#D99E6B]",
        bg: "bg-[#D99E6B]",
        ring: "ring-[#D99E6B]/30",
        checkbox: "bg-[#D99E6B]",
    },
    violet: {
        text: "text-[#CCAE70]",
        border: "border-[#CCAE70]",
        bg: "bg-[#CCAE70]",
        ring: "ring-[#CCAE70]/30",
        checkbox: "bg-[#CCAE70]",
    },
    cyan: {
        text: "text-[#768C9E]",
        border: "border-[#768C9E]",
        bg: "bg-[#768C9E]",
        ring: "ring-[#768C9E]/30",
        checkbox: "bg-[#768C9E]",
    },
};

interface GoalItemProps {
    goal: Goal;
    color: CategoryColor;
    onUpdate: (updatedGoal: Goal) => void;
    onEdit: () => void;
    onDelete: () => void;
    index?: number;
}

/**
 * GoalItem - Componente individual de meta (Dark Academia Theme).
 */
export function GoalItem({ goal, color, onUpdate, onEdit, onDelete, index = 0 }: GoalItemProps) {
    const [inputValue, setInputValue] = React.useState<string>(goal.current.toString());
    const [isEditing, setIsEditing] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!isEditing) {
            setInputValue(goal.current.toString());
        }
    }, [goal.current, isEditing]);

    const accent = accentColors[color] ?? accentColors.slate;
    const progressColor = progressColors[color] ?? progressColors.slate;
    const progress = calculateGoalProgress(goal);
    const wasComplete = React.useRef(isGoalComplete(goal));

    const triggerConfetti = React.useCallback(() => {
        confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#CCAE70', '#C87F76', '#8C9E78', '#768C9E', '#D99E6B'],
            disableForReducedMotion: true,
            scalar: 0.8,
        });
    }, []);

    const checkCompletion = React.useCallback((newGoal: Goal) => {
        const isNowComplete = isGoalComplete(newGoal);
        if (isNowComplete && !wasComplete.current) {
            triggerConfetti();
        }
        wasComplete.current = isNowComplete;
    }, [triggerConfetti]);

    const handleCheckboxChange = () => {
        const newCurrent = goal.current === 1 ? 0 : 1;
        const newGoal = { ...goal, current: newCurrent };
        checkCompletion(newGoal);
        onUpdate(newGoal);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        const num = parseFloat(newValue);
        if (!isNaN(num) && num >= 0) {
            const newGoal = { ...goal, current: num };
            checkCompletion(newGoal);
            onUpdate(newGoal);
        }
    };

    const handleStep = (delta: number) => {
        const step = goal.step ?? 1;
        const newValue = Math.max(0, goal.current + (delta * step));
        const newGoal = { ...goal, current: newValue };
        checkCompletion(newGoal);
        onUpdate(newGoal);
    };

    const handleBlur = () => {
        setIsEditing(false);
        const num = parseFloat(inputValue);
        if (isNaN(num) || num < 0) {
            setInputValue(goal.current.toString());
        }
    };

    const handleFocus = () => {
        setIsEditing(true);
        inputRef.current?.select();
    };

    const isComplete = progress >= 100;

    // ========== BINARY GOAL ==========
    if (goal.type === 'binary') {
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="group py-2"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleCheckboxChange}
                        className="flex items-center gap-3 flex-1 text-left"
                    >
                        {/* Checkbox */}
                        <motion.div
                            className={cn(
                                "flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-300",
                                "flex items-center justify-center",
                                goal.current === 1
                                    ? [accent.checkbox, "border-transparent"]
                                    : "border-[#5A5A5A] bg-[#191919]"
                            )}
                            whileTap={{ scale: 0.9 }}
                        >
                            <AnimatePresence>
                                {goal.current === 1 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Check className="h-3.5 w-3.5 text-[#191919] stroke-[3]" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Label */}
                        <span className={cn(
                            "text-sm transition-colors duration-300",
                            goal.current === 1
                                ? "text-[#5A5A5A] line-through"
                                : "text-[#E3E3E3]"
                        )}>
                            {goal.title}
                        </span>
                    </button>

                    {/* Action Buttons */}
                    <div className={cn(
                        "flex items-center gap-1 transition-opacity duration-300",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}>
                        <button
                            onClick={onEdit}
                            className="p-1.5 rounded-md text-[#5A5A5A] hover:text-[#E3E3E3] hover:bg-white/5 transition-colors"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded-md text-[#5A5A5A] hover:text-[#C87F76] hover:bg-[#C87F76]/10 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ========== NUMERIC GOAL ==========
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className="py-3 space-y-2 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Title Row */}
            <div className="flex items-center justify-between">
                <span className={cn(
                    "text-sm font-medium",
                    isComplete ? "text-[#5A5A5A]" : "text-[#E3E3E3]"
                )}>
                    {goal.title}
                </span>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-xs font-semibold tabular-nums font-mono",
                        isComplete ? accent.text : "text-[#9B9B9B]"
                    )}>
                        {Math.round(progress)}%
                    </span>

                    {/* Action Buttons */}
                    <div className={cn(
                        "flex items-center gap-1 transition-opacity duration-300",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}>
                        <button
                            onClick={onEdit}
                            className="p-1 rounded-md text-[#5A5A5A] hover:text-[#E3E3E3] hover:bg-white/5 transition-colors"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1 rounded-md text-[#5A5A5A] hover:text-[#C87F76] hover:bg-[#C87F76]/10 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-[#191919] rounded-full overflow-hidden">
                <motion.div
                    className={cn("h-full rounded-full", progressColor)}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Value Controls */}
            <div className="flex items-center justify-between text-xs">
                {/* Current Value */}
                <div className="flex items-center gap-2">
                    <span className="text-[#5A5A5A]">Atual:</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleStep(-1)}
                            className="p-1 rounded bg-[#191919] hover:bg-[#2C2C2C] text-[#9B9B9B] transition-colors"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <input
                            ref={inputRef}
                            type="number"
                            value={inputValue}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            className={cn(
                                "w-14 px-2 py-1 rounded text-center",
                                "bg-[#191919] border border-[#2F2F2F]",
                                "text-[#E3E3E3] font-medium tabular-nums font-mono",
                                "focus:outline-none focus:ring-2",
                                accent.ring,
                                "[appearance:textfield]",
                                "[&::-webkit-outer-spin-button]:appearance-none",
                                "[&::-webkit-inner-spin-button]:appearance-none"
                            )}
                            step={goal.step ?? 1}
                            min={0}
                        />
                        <button
                            onClick={() => handleStep(1)}
                            className="p-1 rounded bg-[#191919] hover:bg-[#2C2C2C] text-[#9B9B9B] transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                        {goal.unit && <span className="text-[#5A5A5A]">{goal.unit}</span>}
                    </div>
                </div>

                {/* Target Value */}
                <div className="flex items-center gap-1">
                    <span className="text-[#5A5A5A]">Meta:</span>
                    <span className={cn("font-semibold font-mono", accent.text)}>
                        {goal.target}{goal.unit && ` ${goal.unit}`}
                    </span>
                </div>
            </div>

            {/* Direction Indicator */}
            {goal.direction === 'decrease' && (
                <div className="text-[10px] text-[#5A5A5A] flex items-center gap-1">
                    <span>↓</span>
                    <span>Meta de redução</span>
                </div>
            )}
        </motion.div>
    );
}
