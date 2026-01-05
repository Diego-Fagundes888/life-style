"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, type SelectOption } from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IconPicker, getIconByName } from "@/components/ui/IconPicker";
import type { DBTimeBlock } from "@/lib/db";
import { cn } from "@/lib/utils";

/** Categorias disponíveis para blocos de tempo */
export const TIME_BLOCK_CATEGORIES = [
    { value: "deep-work", label: "Deep Work", color: "text-[#768C9E] bg-[rgba(118,140,158,0.2)]" },
    { value: "routine", label: "Rotina", color: "text-[#9B9B9B] bg-[rgba(155,155,155,0.15)]" },
    { value: "rest", label: "Descanso", color: "text-[#8C9E78] bg-[rgba(140,158,120,0.2)]" },
    { value: "social", label: "Social", color: "text-[#D99E6B] bg-[rgba(217,158,107,0.2)]" },
    { value: "health", label: "Saúde", color: "text-[#C87F76] bg-[rgba(200,127,118,0.2)]" },
] as const;

const categoryBadgeVariant: Record<string, "slate" | "secondary" | "olive" | "clay" | "rust"> = {
    "deep-work": "slate",
    routine: "secondary",
    rest: "olive",
    social: "clay",
    health: "rust",
};

// Converte categorias para formato do Select
const categorySelectOptions: SelectOption[] = TIME_BLOCK_CATEGORIES.map(cat => ({
    value: cat.value,
    label: cat.label,
}));

interface TimeBlockCardProps {
    /** Bloco de tempo a ser exibido */
    block: DBTimeBlock;
    /** Callback quando o bloco é atualizado */
    onUpdate: (block: DBTimeBlock) => void;
    /** Callback quando o bloco é deletado */
    onDelete: (id: string) => void;
    /** Se está em modo de edição */
    isEditing?: boolean;
}

/**
 * TimeBlockCard - Card de bloco de tempo com drag & drop
 * 
 * Componente draggable que representa um bloco de tempo na rotina,
 * permitindo edição inline de título, horários, categoria e ícone.
 */
export function TimeBlockCard({
    block,
    onUpdate,
    onDelete,
    isEditing = false
}: TimeBlockCardProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const Icon = getIconByName(block.icon);
    const categoryConfig = TIME_BLOCK_CATEGORIES.find(c => c.value === block.category);

    const formatTime = (hour: number, minute: number) => {
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    };

    const parseTime = (timeStr: string): { hour: number; minute: number } | null => {
        const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return null;
        const hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
        return { hour, minute };
    };

    const handleTimeChange = (field: "start" | "end", value: string) => {
        const parsed = parseTime(value);
        if (!parsed) return;

        if (field === "start") {
            onUpdate({
                ...block,
                startHour: parsed.hour,
                startMinute: parsed.minute,
            });
        } else {
            onUpdate({
                ...block,
                endHour: parsed.hour,
                endMinute: parsed.minute,
            });
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative bg-[#2C2C2C] rounded-xl border border-[rgba(255,255,255,0.05)]",
                "transition-all duration-200",
                isDragging && "opacity-50 shadow-2xl z-50",
                !isDragging && "hover:border-[rgba(204,174,112,0.3)]"
            )}
        >
            {/* Header - Sempre visível */}
            <div className="flex items-center gap-3 p-3">
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-[#5A5A5A] hover:text-[#9B9B9B] transition-colors"
                    aria-label="Arrastar para reordenar"
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                {/* Icon & Title */}
                <div className={cn("p-2 rounded-lg", categoryConfig?.color)}>
                    <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing || isExpanded ? (
                        <Input
                            value={block.title}
                            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                            className="h-8 bg-transparent border-[rgba(255,255,255,0.1)] text-[#E3E3E3] text-sm"
                        />
                    ) : (
                        <p className="font-medium text-[#E3E3E3] truncate">{block.title}</p>
                    )}
                </div>

                {/* Time Range */}
                <div className="flex items-center gap-1 text-sm text-[#9B9B9B]">
                    <span className="font-mono">
                        {formatTime(block.startHour, block.startMinute)}
                    </span>
                    <span>-</span>
                    <span className="font-mono">
                        {formatTime(block.endHour, block.endMinute)}
                    </span>
                </div>

                {/* Category Badge */}
                <Badge variant={categoryBadgeVariant[block.category]} className="hidden sm:flex">
                    {categoryConfig?.label}
                </Badge>

                {/* Expand/Collapse */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#5A5A5A] hover:text-[#E3E3E3]"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180"
                    )} />
                </Button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-[rgba(255,255,255,0.05)] mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        {/* Start Time */}
                        <div className="space-y-1">
                            <label className="text-xs text-[#5A5A5A]">Início</label>
                            <Input
                                type="time"
                                value={formatTime(block.startHour, block.startMinute)}
                                onChange={(e) => handleTimeChange("start", e.target.value)}
                                className="h-9 bg-[#1E1E1E] border-[rgba(255,255,255,0.1)] text-[#E3E3E3]"
                            />
                        </div>

                        {/* End Time */}
                        <div className="space-y-1">
                            <label className="text-xs text-[#5A5A5A]">Término</label>
                            <Input
                                type="time"
                                value={formatTime(block.endHour, block.endMinute)}
                                onChange={(e) => handleTimeChange("end", e.target.value)}
                                className="h-9 bg-[#1E1E1E] border-[rgba(255,255,255,0.1)] text-[#E3E3E3]"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-1">
                            <Select
                                label="Categoria"
                                options={categorySelectOptions}
                                value={block.category}
                                onChange={(value) =>
                                    onUpdate({
                                        ...block,
                                        category: value as DBTimeBlock["category"]
                                    })
                                }
                            />
                        </div>

                        {/* Icon */}
                        <div className="space-y-1">
                            <label className="text-xs text-[#5A5A5A]">Ícone</label>
                            <IconPicker
                                value={block.icon}
                                onChange={(icon) => onUpdate({ ...block, icon })}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Delete Button */}
                    <div className="flex justify-end mt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir Bloco
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#1E1E1E] border-[rgba(204,174,112,0.2)]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-[#E3E3E3]">
                                        Excluir bloco de tempo?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-[#9B9B9B]">
                                        O bloco &quot;{block.title}&quot; será removido permanentemente
                                        da sua rotina. Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-[#2C2C2C] border-[rgba(255,255,255,0.1)] text-[#E3E3E3] hover:bg-[#3C3C3C]">
                                        Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(block.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
        </div>
    );
}
