"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
    LucideIcon,
    Heart, Book, DollarSign, Brain, Trophy, Star,
    Activity, Briefcase, Target, Flame, Palette,
    Users, Home, Plane, GraduationCap, Music,
    Camera, Dumbbell, Plus, MoreVertical, Pencil, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalCategory, Goal, calculateCategoryProgress, CategoryColor } from "@/lib/types/goals";
import { GoalItem } from "./goal-item";
import { cn } from "@/lib/utils";

/**
 * Mapeamento de nomes de ícones para componentes Lucide.
 */
const iconMap: Record<string, LucideIcon> = {
    Heart, Book, DollarSign, Brain, Trophy, Star,
    Activity, Briefcase, Target, Flame, Palette,
    Users, Home, Plane, GraduationCap, Music,
    Camera, Dumbbell,
};

/**
 * DARK ACADEMIA PALETTE - Cores semânticas terrosas e elegantes
 * accent-rust: #C87F76 (Ferrugem - Para Saúde/Corpo)
 * accent-clay: #D99E6B (Barro - Para Energia/Foco)
 * accent-olive: #8C9E78 (Oliva - Para Natureza/Hobbies)
 * accent-slate: #768C9E (Ardósia - Para Mente/Intelecto)
 * accent-gold: #CCAE70 (Ouro Envelhecido - Para Dinheiro)
 */
const colorStyles: Record<CategoryColor, {
    border: string;
    iconBg: string;
    iconText: string;
    badge: string;
    progressBar: string;
    accent: string;
}> = {
    // Rust - Saúde/Corpo (replaces rose)
    rust: {
        border: "border-[#C87F76]/30",
        iconBg: "bg-[#C87F76]/15",
        iconText: "text-[#C87F76]",
        badge: "bg-[#C87F76]/15 text-[#C87F76] border border-[#C87F76]/30",
        progressBar: "bg-[#C87F76]",
        accent: "text-[#C87F76]",
    },
    // Clay - Energia/Foco (replaces amber)
    clay: {
        border: "border-[#D99E6B]/30",
        iconBg: "bg-[#D99E6B]/15",
        iconText: "text-[#D99E6B]",
        badge: "bg-[#D99E6B]/15 text-[#D99E6B] border border-[#D99E6B]/30",
        progressBar: "bg-[#D99E6B]",
        accent: "text-[#D99E6B]",
    },
    // Olive - Natureza/Hobbies (replaces emerald)
    olive: {
        border: "border-[#8C9E78]/30",
        iconBg: "bg-[#8C9E78]/15",
        iconText: "text-[#8C9E78]",
        badge: "bg-[#8C9E78]/15 text-[#8C9E78] border border-[#8C9E78]/30",
        progressBar: "bg-[#8C9E78]",
        accent: "text-[#8C9E78]",
    },
    // Slate - Mente/Intelecto (replaces blue)
    slate: {
        border: "border-[#768C9E]/30",
        iconBg: "bg-[#768C9E]/15",
        iconText: "text-[#768C9E]",
        badge: "bg-[#768C9E]/15 text-[#768C9E] border border-[#768C9E]/30",
        progressBar: "bg-[#768C9E]",
        accent: "text-[#768C9E]",
    },
    // Gold - Dinheiro (replaces cyan/violet)
    gold: {
        border: "border-[#CCAE70]/30",
        iconBg: "bg-[#CCAE70]/15",
        iconText: "text-[#CCAE70]",
        badge: "bg-[#CCAE70]/15 text-[#CCAE70] border border-[#CCAE70]/30",
        progressBar: "bg-[#CCAE70]",
        accent: "text-[#CCAE70]",
    },
    // Legacy colors - map to new palette for backward compatibility
    rose: {
        border: "border-[#C87F76]/30",
        iconBg: "bg-[#C87F76]/15",
        iconText: "text-[#C87F76]",
        badge: "bg-[#C87F76]/15 text-[#C87F76] border border-[#C87F76]/30",
        progressBar: "bg-[#C87F76]",
        accent: "text-[#C87F76]",
    },
    blue: {
        border: "border-[#768C9E]/30",
        iconBg: "bg-[#768C9E]/15",
        iconText: "text-[#768C9E]",
        badge: "bg-[#768C9E]/15 text-[#768C9E] border border-[#768C9E]/30",
        progressBar: "bg-[#768C9E]",
        accent: "text-[#768C9E]",
    },
    emerald: {
        border: "border-[#8C9E78]/30",
        iconBg: "bg-[#8C9E78]/15",
        iconText: "text-[#8C9E78]",
        badge: "bg-[#8C9E78]/15 text-[#8C9E78] border border-[#8C9E78]/30",
        progressBar: "bg-[#8C9E78]",
        accent: "text-[#8C9E78]",
    },
    amber: {
        border: "border-[#D99E6B]/30",
        iconBg: "bg-[#D99E6B]/15",
        iconText: "text-[#D99E6B]",
        badge: "bg-[#D99E6B]/15 text-[#D99E6B] border border-[#D99E6B]/30",
        progressBar: "bg-[#D99E6B]",
        accent: "text-[#D99E6B]",
    },
    violet: {
        border: "border-[#CCAE70]/30",
        iconBg: "bg-[#CCAE70]/15",
        iconText: "text-[#CCAE70]",
        badge: "bg-[#CCAE70]/15 text-[#CCAE70] border border-[#CCAE70]/30",
        progressBar: "bg-[#CCAE70]",
        accent: "text-[#CCAE70]",
    },
    cyan: {
        border: "border-[#768C9E]/30",
        iconBg: "bg-[#768C9E]/15",
        iconText: "text-[#768C9E]",
        badge: "bg-[#768C9E]/15 text-[#768C9E] border border-[#768C9E]/30",
        progressBar: "bg-[#768C9E]",
        accent: "text-[#768C9E]",
    },
};

interface GoalCardProps {
    category: GoalCategory;
    onUpdateGoal: (goalId: string, updatedGoal: Goal) => void;
    onAddGoal: () => void;
    onEditGoal: (goal: Goal) => void;
    onDeleteGoal: (goalId: string) => void;
    onEditCategory: () => void;
    onDeleteCategory: () => void;
    index?: number;
}

/**
 * GoalCard - Cartão de categoria de metas (Dark Academia Theme).
 */
export function GoalCard({
    category,
    onUpdateGoal,
    onAddGoal,
    onEditGoal,
    onDeleteGoal,
    onEditCategory,
    onDeleteCategory,
    index = 0,
}: GoalCardProps) {
    const [showMenu, setShowMenu] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    const Icon = iconMap[category.icon] ?? Star;
    const progress = calculateCategoryProgress(category);
    const styles = colorStyles[category.color] ?? colorStyles.slate;

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
            }}
        >
            <Card className={cn(
                "bg-[#202020] backdrop-blur-sm border shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5)]",
                "hover:shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition-all duration-300",
                styles.border
            )}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className={cn(
                                "p-2.5 rounded-lg",
                                styles.iconBg,
                                styles.iconText
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>

                            <CardTitle className="text-base font-semibold text-[#E3E3E3] font-serif">
                                {category.title}
                            </CardTitle>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Progress Badge */}
                            <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums font-mono",
                                styles.badge
                            )}>
                                {progress}%
                            </span>

                            {/* Menu Button */}
                            <div className="relative" ref={menuRef}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#5A5A5A] hover:text-[#E3E3E3] hover:bg-white/5"
                                    onClick={() => setShowMenu(!showMenu)}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>

                                {/* Dropdown Menu */}
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute right-0 top-full mt-1 w-40 bg-[#252525] border border-[#2F2F2F] rounded-lg shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] z-10 py-1"
                                    >
                                        <button
                                            onClick={() => {
                                                onEditCategory();
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm text-[#9B9B9B] hover:bg-white/5 hover:text-[#E3E3E3] flex items-center gap-2 transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => {
                                                onDeleteCategory();
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm text-[#C87F76] hover:bg-[#C87F76]/10 flex items-center gap-2 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Excluir
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category Progress Bar */}
                    <div className="mt-3">
                        <div className="h-1.5 bg-[#191919] rounded-full overflow-hidden">
                            <motion.div
                                className={cn("h-full rounded-full", styles.progressBar)}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-1">
                    {/* Goals List */}
                    {category.goals.map((goal, goalIndex) => (
                        <GoalItem
                            key={goal.id}
                            goal={goal}
                            color={category.color}
                            onUpdate={(updated) => onUpdateGoal(goal.id, updated)}
                            onEdit={() => onEditGoal(goal)}
                            onDelete={() => onDeleteGoal(goal.id)}
                            index={goalIndex}
                        />
                    ))}

                    {/* Empty State */}
                    {category.goals.length === 0 && (
                        <p className="text-sm text-[#5A5A5A] text-center py-4 italic">
                            Nenhuma meta ainda
                        </p>
                    )}

                    {/* Add Goal Button */}
                    <button
                        onClick={onAddGoal}
                        className={cn(
                            "w-full mt-2 py-2 px-3 rounded-md border-2 border-dashed",
                            "text-sm font-medium transition-all duration-300",
                            "flex items-center justify-center gap-2",
                            "border-[#2F2F2F] text-[#5A5A5A]",
                            "hover:border-[#CCAE70]/50 hover:text-[#CCAE70] hover:bg-[#CCAE70]/5"
                        )}
                    >
                        <Plus className="h-4 w-4" />
                        Adicionar Meta
                    </button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
