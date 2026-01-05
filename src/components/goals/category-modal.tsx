"use client";

import * as React from "react";
import {
    Heart, Book, DollarSign, Brain, Trophy, Star,
    Activity, Briefcase, Target, Flame, Palette,
    Users, Home, Plane, GraduationCap, Music,
    Camera, Dumbbell, LucideIcon
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoalCategory, CategoryColor } from "@/lib/types/goals";
import { cn } from "@/lib/utils";

const availableIcons: { name: string; icon: LucideIcon }[] = [
    { name: "Heart", icon: Heart },
    { name: "Book", icon: Book },
    { name: "DollarSign", icon: DollarSign },
    { name: "Brain", icon: Brain },
    { name: "Trophy", icon: Trophy },
    { name: "Star", icon: Star },
    { name: "Activity", icon: Activity },
    { name: "Briefcase", icon: Briefcase },
    { name: "Target", icon: Target },
    { name: "Flame", icon: Flame },
    { name: "Palette", icon: Palette },
    { name: "Users", icon: Users },
    { name: "Home", icon: Home },
    { name: "Plane", icon: Plane },
    { name: "GraduationCap", icon: GraduationCap },
    { name: "Music", icon: Music },
    { name: "Camera", icon: Camera },
    { name: "Dumbbell", icon: Dumbbell },
];

/**
 * DARK ACADEMIA PALETTE
 * Cores semânticas terrosas e elegantes
 */
const availableColors: { value: CategoryColor; label: string; hex: string }[] = [
    { value: "rust", label: "Ferrugem (Saúde)", hex: "#C87F76" },
    { value: "clay", label: "Barro (Energia)", hex: "#D99E6B" },
    { value: "olive", label: "Oliva (Natureza)", hex: "#8C9E78" },
    { value: "slate", label: "Ardósia (Mente)", hex: "#768C9E" },
    { value: "gold", label: "Ouro (Dinheiro)", hex: "#CCAE70" },
];

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Omit<GoalCategory, "id" | "goals">) => void;
    editingCategory?: GoalCategory;
}

/**
 * CategoryModal - Modal para criar/editar categorias (Dark Academia Theme).
 */
export function CategoryModal({
    isOpen,
    onClose,
    onSave,
    editingCategory
}: CategoryModalProps) {
    const [title, setTitle] = React.useState("");
    const [selectedIcon, setSelectedIcon] = React.useState("Star");
    const [selectedColor, setSelectedColor] = React.useState<CategoryColor>("slate");
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        if (editingCategory) {
            setTitle(editingCategory.title);
            setSelectedIcon(editingCategory.icon);
            // Map legacy colors to new Dark Academia colors
            const colorMap: Record<string, CategoryColor> = {
                'rose': 'rust',
                'blue': 'slate',
                'emerald': 'olive',
                'amber': 'clay',
                'violet': 'gold',
                'cyan': 'slate',
            };
            const mappedColor = colorMap[editingCategory.color] ?? editingCategory.color;
            setSelectedColor(mappedColor as CategoryColor);
        } else {
            setTitle("");
            setSelectedIcon("Star");
            setSelectedColor("slate");
        }
        setError("");
    }, [editingCategory, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError("O título é obrigatório");
            return;
        }

        onSave({
            title: title.trim(),
            icon: selectedIcon,
            color: selectedColor,
        });

        onClose();
    };

    const isEditing = !!editingCategory;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Categoria" : "Nova Categoria"}
            description="Organize suas metas em áreas da vida"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Nome da Categoria"
                    placeholder="Ex: Saúde, Carreira, Relacionamentos..."
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setError("");
                    }}
                    error={error}
                    autoFocus
                />

                {/* Icon Selector */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#9B9B9B]">
                        Ícone
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                        {availableIcons.map(({ name, icon: Icon }) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setSelectedIcon(name)}
                                className={cn(
                                    "p-2.5 rounded-md border-2 transition-all duration-300",
                                    "hover:border-[#CCAE70]/50 hover:bg-[#CCAE70]/10",
                                    selectedIcon === name
                                        ? "border-[#CCAE70] bg-[#CCAE70]/15 text-[#CCAE70]"
                                        : "border-transparent bg-[#191919] text-[#5A5A5A]"
                                )}
                            >
                                <Icon className="h-5 w-5 mx-auto" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Selector - Dark Academia Palette */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#9B9B9B]">
                        Cor
                    </label>
                    <div className="flex gap-3">
                        {availableColors.map(({ value, label, hex }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setSelectedColor(value)}
                                className={cn(
                                    "w-10 h-10 rounded-full transition-all duration-300",
                                    selectedColor === value
                                        ? "ring-2 ring-offset-2 ring-offset-[#202020] ring-[#E3E3E3] scale-110"
                                        : "hover:scale-105"
                                )}
                                style={{ backgroundColor: hex }}
                                title={label}
                            />
                        ))}
                    </div>
                </div>

                <ModalFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="text-[#9B9B9B] hover:text-[#E3E3E3] hover:bg-white/5"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="bg-[#E3E3E3] text-[#191919] hover:bg-[#D4D4D4]"
                    >
                        {isEditing ? "Salvar Alterações" : "Criar Categoria"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
