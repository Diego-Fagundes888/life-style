"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import TextareaAutosize from "react-textarea-autosize";
import {
    X,
    Star,
    Plus,
    Trash2,
    Save,
    Image,
    Check,
    AlertTriangle,
    StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    LifeArea,
    LifeAreaData,
    LifeAreaId,
    Goal,
    getOtherAreas,
    LIFE_AREAS,
    generateId,
} from "@/lib/types/life-summary";
import { cn } from "@/lib/utils";

interface AnalysisModalProps {
    isOpen: boolean;
    area: LifeArea | null;
    data: LifeAreaData | null;
    onClose: () => void;
    onSave: (data: LifeAreaData) => void;
}

/**
 * AnalysisModal - Modal de análise profunda de cada área da vida.
 * Estética: Notion Dark Mode com tipografia serifada.
 */
export function AnalysisModal({
    isOpen,
    area,
    data,
    onClose,
    onSave,
}: AnalysisModalProps) {
    const [editedData, setEditedData] = React.useState<LifeAreaData | null>(null);
    const [originalData, setOriginalData] = React.useState<string>("");
    const [newGoal, setNewGoal] = React.useState("");
    const [newCrossRef, setNewCrossRef] = React.useState<{ area: LifeAreaId; reason: string }>({
        area: 'mind',
        reason: '',
    });
    const [showExitConfirm, setShowExitConfirm] = React.useState(false);

    React.useEffect(() => {
        if (data) {
            setEditedData({ ...data });
            setOriginalData(JSON.stringify(data));
        }
    }, [data]);

    if (!area || !editedData) return null;

    const otherAreas = getOtherAreas(area.id);
    const hasUnsavedChanges = JSON.stringify(editedData) !== originalData;
    const displayImage = editedData.customImage || area.image;

    // Handlers
    const handleAnswerChange = (questionId: string, value: string) => {
        setEditedData({
            ...editedData,
            answers: { ...editedData.answers, [questionId]: value },
            updatedAt: new Date().toISOString(),
        });
    };

    const handleFieldChange = <K extends keyof LifeAreaData>(
        field: K,
        value: LifeAreaData[K]
    ) => {
        setEditedData({
            ...editedData,
            [field]: value,
            updatedAt: new Date().toISOString(),
        });
    };

    const handleAddGoal = () => {
        if (!newGoal.trim()) return;
        const goal: Goal = {
            id: generateId(),
            text: newGoal.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
        };
        setEditedData({
            ...editedData,
            goals: [...editedData.goals, goal],
            updatedAt: new Date().toISOString(),
        });
        setNewGoal("");
    };

    const handleToggleGoal = (goalId: string) => {
        setEditedData({
            ...editedData,
            goals: editedData.goals.map(g =>
                g.id === goalId ? { ...g, completed: !g.completed } : g
            ),
            updatedAt: new Date().toISOString(),
        });
    };

    const handleRemoveGoal = (goalId: string) => {
        setEditedData({
            ...editedData,
            goals: editedData.goals.filter(g => g.id !== goalId),
            updatedAt: new Date().toISOString(),
        });
    };

    const handleAddCrossRef = () => {
        if (!newCrossRef.reason.trim()) return;
        setEditedData({
            ...editedData,
            crossReferences: [
                ...editedData.crossReferences,
                { targetArea: newCrossRef.area, reason: newCrossRef.reason.trim() },
            ],
            updatedAt: new Date().toISOString(),
        });
        setNewCrossRef({ area: otherAreas[0]?.id || 'mind', reason: '' });
    };

    const handleRemoveCrossRef = (index: number) => {
        setEditedData({
            ...editedData,
            crossReferences: editedData.crossReferences.filter((_, i) => i !== index),
            updatedAt: new Date().toISOString(),
        });
    };

    const handleSave = () => {
        onSave(editedData);
        onClose();
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowExitConfirm(true);
        } else {
            onClose();
        }
    };

    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        onClose();
    };

    // Rating labels
    const ratingLabels: Record<number, string> = {
        1: 'Péssimo',
        2: 'Muito Ruim',
        3: 'Ruim',
        4: 'Abaixo da Média',
        5: 'Na Média',
        6: 'Acima da Média',
        7: 'Bom',
        8: 'Muito Bom',
        9: 'Ótimo',
        10: 'Excelente',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        className="relative w-full max-w-4xl bg-[#191919] rounded-lg shadow-2xl border border-[#333] overflow-hidden my-8"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header Image */}
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={displayImage}
                                alt={area.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#191919] via-[#191919]/50 to-transparent" />

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Unsaved Changes Indicator */}
                            {hasUnsavedChanges && (
                                <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full flex items-center gap-1">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                    Alterações não salvas
                                </div>
                            )}

                            {/* Title overlay */}
                            <div className="absolute bottom-4 left-8 right-8">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl">{area.emoji}</span>
                                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-wide uppercase">
                                        Análise {area.title === 'Vida Social' ? 'Social' : area.title}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 md:p-12 space-y-8">
                            {/* Image URL Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#888] flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    URL da Imagem Personalizada
                                </label>
                                <Input
                                    type="url"
                                    placeholder="https://exemplo.com/minha-imagem.jpg"
                                    value={editedData.customImage || ''}
                                    onChange={(e) => handleFieldChange('customImage', e.target.value || undefined)}
                                    className="bg-[#252525] border-[#333] text-white placeholder:text-[#555]"
                                />
                            </div>

                            {/* Quote */}
                            <blockquote className="border-l-4 border-[#444] pl-6 py-2">
                                <p className="text-[#888] italic text-lg font-serif">
                                    "{area.quote.text}"
                                </p>
                                <footer className="mt-2 text-[#666] text-sm">
                                    — {area.quote.author}
                                </footer>
                            </blockquote>

                            {/* Rating Slider */}
                            <div className="space-y-4">
                                <label className="text-lg font-medium text-[#ccc] block">
                                    Como você avalia essa área da sua vida? (1-10)
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={editedData.rating || 5}
                                        onChange={(e) => handleFieldChange('rating', parseInt(e.target.value))}
                                        className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#666] text-sm">1</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-bold text-white">
                                                {editedData.rating || 5}
                                            </span>
                                            <span className="text-[#888] text-sm">
                                                — {ratingLabels[editedData.rating || 5]}
                                            </span>
                                        </div>
                                        <span className="text-[#666] text-sm">10</span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[#333]" />

                            {/* Questions / Reflection */}
                            <div className="space-y-6">
                                {area.questions.map((q) => (
                                    <div key={q.id} className="space-y-3">
                                        <label className="text-[#ccc] font-medium text-lg">
                                            {q.question}
                                        </label>
                                        <TextareaAutosize
                                            value={editedData.answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            placeholder="Escreva sua reflexão aqui..."
                                            minRows={3}
                                            className="w-full bg-transparent text-white placeholder:text-[#555] text-lg leading-relaxed resize-none focus:outline-none border-none p-0"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[#333]" />

                            {/* Goals */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-serif font-semibold text-white flex items-center gap-2">
                                    <Star className="h-5 w-5 text-amber-400" />
                                    O que você gostaria de conquistar?
                                </h2>

                                <div className="space-y-2">
                                    {editedData.goals.map((goal) => (
                                        <div
                                            key={goal.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg group transition-colors",
                                                goal.completed ? "bg-emerald-900/20" : "bg-[#252525]"
                                            )}
                                        >
                                            <button
                                                onClick={() => handleToggleGoal(goal.id)}
                                                className={cn(
                                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                                    goal.completed
                                                        ? "bg-emerald-500 border-emerald-500"
                                                        : "border-[#555] hover:border-[#888]"
                                                )}
                                            >
                                                {goal.completed && <Check className="h-3 w-3 text-white" />}
                                            </button>
                                            <span className={cn(
                                                "flex-1 transition-all",
                                                goal.completed ? "text-[#888] line-through" : "text-[#ddd]"
                                            )}>
                                                {goal.text}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveGoal(goal.id)}
                                                className="p-1 text-[#666] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        value={newGoal}
                                        onChange={(e) => setNewGoal(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                                        placeholder="Adicionar objetivo..."
                                        className="flex-1 bg-[#252525] border-[#333] text-white placeholder:text-[#666]"
                                    />
                                    <Button
                                        onClick={handleAddGoal}
                                        size="sm"
                                        className="bg-[#333] hover:bg-[#444] text-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[#333]" />

                            {/* Cross References */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-serif font-semibold text-white">
                                    Razões inegociáveis (Impacto nas outras áreas)
                                </h2>

                                <div className="flex flex-wrap gap-2">
                                    {editedData.crossReferences.map((ref, index) => {
                                        const targetArea = LIFE_AREAS.find(a => a.id === ref.targetArea);
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 group"
                                            >
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-sm font-medium",
                                                    targetArea?.badgeClass
                                                )}>
                                                    [{targetArea?.title}]
                                                </span>
                                                <span className="text-[#aaa] text-sm">
                                                    {ref.reason}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveCrossRef(index)}
                                                    className="p-1 text-[#666] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="space-y-1">
                                        <label className="text-xs text-[#666]">Área</label>
                                        <select
                                            value={newCrossRef.area}
                                            onChange={(e) => setNewCrossRef({ ...newCrossRef, area: e.target.value as LifeAreaId })}
                                            className="px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-white text-sm"
                                        >
                                            {otherAreas.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.emoji} {a.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input
                                        value={newCrossRef.reason}
                                        onChange={(e) => setNewCrossRef({ ...newCrossRef, reason: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCrossRef()}
                                        placeholder="Por que isso impacta essa área?"
                                        className="flex-1 bg-[#252525] border-[#333] text-white placeholder:text-[#666]"
                                    />
                                    <Button
                                        onClick={handleAddCrossRef}
                                        size="sm"
                                        className="bg-[#333] hover:bg-[#444] text-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[#333]" />

                            {/* Notes */}
                            <div className="space-y-3">
                                <h2 className="text-xl font-serif font-semibold text-white flex items-center gap-2">
                                    <StickyNote className="h-5 w-5 text-violet-400" />
                                    Anotações Livres
                                </h2>
                                <TextareaAutosize
                                    value={editedData.notes || ''}
                                    onChange={(e) => handleFieldChange('notes', e.target.value || undefined)}
                                    placeholder="Espaço para qualquer anotação, insight ou ideia..."
                                    minRows={3}
                                    className="w-full bg-[#252525] text-white placeholder:text-[#555] text-base leading-relaxed resize-none focus:outline-none border border-[#333] rounded-lg p-4"
                                />
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[#333]" />

                            {/* Footer */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleClose}
                                    className="text-[#888] hover:text-white hover:bg-[#333]"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-white text-black hover:bg-[#ddd] gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Salvar Reflexão
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Exit Confirmation Dialog */}
                    <AnimatePresence>
                        {showExitConfirm && (
                            <motion.div
                                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="absolute inset-0 bg-black/70" onClick={() => setShowExitConfirm(false)} />
                                <motion.div
                                    className="relative bg-[#252525] rounded-xl p-6 max-w-md w-full border border-[#333] shadow-2xl"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-amber-500/20 rounded-lg">
                                            <AlertTriangle className="h-6 w-6 text-amber-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Alterações não salvas
                                        </h3>
                                    </div>
                                    <p className="text-[#999] mb-6">
                                        Você tem alterações que não foram salvas. Deseja realmente sair e perder essas alterações?
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowExitConfirm(false)}
                                            className="text-[#888] hover:text-white hover:bg-[#333]"
                                        >
                                            Continuar Editando
                                        </Button>
                                        <Button
                                            onClick={handleConfirmExit}
                                            className="bg-rose-600 hover:bg-rose-700 text-white"
                                        >
                                            Sair sem Salvar
                                        </Button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}
