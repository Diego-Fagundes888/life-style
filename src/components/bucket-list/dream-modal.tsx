"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import TextareaAutosize from "react-textarea-autosize";
import {
    X,
    CheckCircle2,
    Circle,
    DollarSign,
    Heart,
    Calendar,
    Clock,
    Play,
    Check,
    Trash2,
    Image,
    Edit3,
    Camera,
    Tag,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dream,
    DreamStatus,
    DreamStep,
    DreamCategory,
    getCategoryConfig,
    calculateDreamProgress,
    DREAM_CATEGORIES,
} from "@/lib/types/bucket-list";
import { cn } from "@/lib/utils";

interface DreamModalProps {
    isOpen: boolean;
    dream: Dream | null;
    onClose: () => void;
    onUpdate: (dream: Dream) => void;
    onDelete: (id: string) => void;
    isNew?: boolean;
}

const statusLabels: Record<DreamStatus, string> = {
    pending: 'Pendente',
    'in-progress': 'Em Andamento',
    completed: 'Realizado',
};

/**
 * DreamModal - Modal de detalhes do sonho com edição completa.
 */
export function DreamModal({
    isOpen,
    dream,
    onClose,
    onUpdate,
    onDelete,
    isNew = false,
}: DreamModalProps) {
    const [editedDream, setEditedDream] = React.useState<Dream | null>(null);
    const [newStepTitle, setNewStepTitle] = React.useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);

    React.useEffect(() => {
        if (dream) {
            setEditedDream({ ...dream });
        }
    }, [dream]);

    React.useEffect(() => {
        if (!isOpen) {
            setShowDeleteConfirm(false);
            setShowCategoryPicker(false);
        }
    }, [isOpen]);

    if (!editedDream) return null;

    const category = getCategoryConfig(editedDream.category);
    const progress = calculateDreamProgress(editedDream);
    const displayImage = editedDream.status === 'completed' && editedDream.realImage
        ? editedDream.realImage
        : editedDream.image;

    // ========== HANDLERS ==========

    const handleStepToggle = (stepId: string) => {
        const updated = {
            ...editedDream,
            steps: editedDream.steps.map(s =>
                s.id === stepId ? { ...s, completed: !s.completed } : s
            ),
            updatedAt: new Date().toISOString(),
        };
        setEditedDream(updated);
        onUpdate(updated);
    };

    const handleAddStep = () => {
        if (!newStepTitle.trim()) return;
        const newStep: DreamStep = {
            id: `step-${Date.now()}`,
            title: newStepTitle,
            completed: false,
        };
        const updated = {
            ...editedDream,
            steps: [...editedDream.steps, newStep],
            updatedAt: new Date().toISOString(),
        };
        setEditedDream(updated);
        onUpdate(updated);
        setNewStepTitle("");
    };

    const handleDeleteStep = (stepId: string) => {
        const updated = {
            ...editedDream,
            steps: editedDream.steps.filter(s => s.id !== stepId),
            updatedAt: new Date().toISOString(),
        };
        setEditedDream(updated);
        onUpdate(updated);
    };

    const handleStatusChange = (status: DreamStatus) => {
        const updated = {
            ...editedDream,
            status,
            completedDate: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
            updatedAt: new Date().toISOString(),
        };
        setEditedDream(updated);
        onUpdate(updated);
    };

    const handleFieldChange = (field: keyof Dream, value: string | number) => {
        const updated = {
            ...editedDream,
            [field]: value,
            updatedAt: new Date().toISOString(),
        };
        setEditedDream(updated);
        onUpdate(updated);
    };

    const handleCategoryChange = (newCategory: DreamCategory) => {
        const updated = {
            ...editedDream,
            category: newCategory,
            updatedAt: new Date().toISOString(),
        };
        setEditedDream(updated);
        onUpdate(updated);
        setShowCategoryPicker(false);
    };

    const handleConfirmDelete = () => {
        onDelete(editedDream.id);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        {/* Header Image */}
                        <div className="relative h-48 flex-shrink-0 group">
                            <img
                                src={displayImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'}
                                alt={editedDream.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Category Picker */}
                            <div className="absolute top-4 left-4">
                                <button
                                    onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                                    className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-sm text-white flex items-center gap-2 hover:bg-black/70 transition-colors"
                                >
                                    <span>{category.emoji}</span>
                                    <span>{category.label}</span>
                                    <Tag className="h-3 w-3 opacity-50" />
                                </button>

                                {showCategoryPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full mt-2 left-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 z-10"
                                    >
                                        {DREAM_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategoryChange(cat.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                                    editedDream.category === cat.id
                                                        ? "bg-indigo-600 text-white"
                                                        : "text-slate-300 hover:bg-slate-700"
                                                )}
                                            >
                                                <span>{cat.emoji}</span>
                                                <span>{cat.label}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>

                            {/* Title (Editable) */}
                            <div className="absolute bottom-4 left-4 right-4">
                                <input
                                    type="text"
                                    value={editedDream.title}
                                    onChange={(e) => handleFieldChange('title', e.target.value)}
                                    placeholder="Nome do sonho..."
                                    className="w-full text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-white/50"
                                />
                                <input
                                    type="text"
                                    value={editedDream.description || ''}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                    placeholder="Descrição breve..."
                                    className="w-full text-sm text-white/70 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-white/40 mt-1"
                                />
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Image URL Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    URL da Imagem de Inspiração
                                </label>
                                <Input
                                    type="url"
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    value={editedDream.image || ''}
                                    onChange={(e) => handleFieldChange('image', e.target.value)}
                                />
                                <p className="text-xs text-slate-500">
                                    Cole a URL de uma imagem inspiradora do Unsplash, Pinterest, etc.
                                </p>
                            </div>

                            {/* Real Image (when completed) */}
                            {editedDream.status === 'completed' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                                        <Camera className="h-4 w-4" />
                                        Foto Real da Experiência
                                    </label>
                                    <Input
                                        type="url"
                                        placeholder="https://exemplo.com/minha-foto-real.jpg"
                                        value={editedDream.realImage || ''}
                                        onChange={(e) => handleFieldChange('realImage', e.target.value)}
                                    />
                                    <p className="text-xs text-emerald-500/70">
                                        Substitua a imagem de inspiração pela sua foto real!
                                    </p>
                                </div>
                            )}

                            {/* Status Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Status</label>
                                <div className="flex gap-2">
                                    {(['pending', 'in-progress', 'completed'] as DreamStatus[]).map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(status)}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                                                "border-2",
                                                editedDream.status === status
                                                    ? status === 'pending'
                                                        ? "bg-slate-700 border-slate-600 text-white"
                                                        : status === 'in-progress'
                                                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                                                            : "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                                    : "border-slate-700 text-slate-500 hover:border-slate-600"
                                            )}
                                        >
                                            {status === 'pending' && <Clock className="h-4 w-4 inline mr-1" />}
                                            {status === 'in-progress' && <Play className="h-4 w-4 inline mr-1" />}
                                            {status === 'completed' && <Check className="h-4 w-4 inline mr-1" />}
                                            {statusLabels[status]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Completed Date */}
                            {editedDream.status === 'completed' && editedDream.completedDate && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <Calendar className="h-4 w-4 text-emerald-400" />
                                    <span className="text-emerald-300 text-sm">
                                        Conquistado em {new Date(editedDream.completedDate).toLocaleDateString('pt-BR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            )}

                            {/* Progress */}
                            {editedDream.steps.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Progresso</span>
                                        <span className="font-bold text-indigo-400">{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-indigo-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Checklist */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400">Etapas</label>

                                <div className="space-y-2">
                                    {editedDream.steps.map((step) => (
                                        <div
                                            key={step.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg",
                                                "bg-slate-800/50 border border-slate-700/50",
                                                step.completed && "bg-emerald-500/5 border-emerald-500/20"
                                            )}
                                        >
                                            <button
                                                onClick={() => handleStepToggle(step.id)}
                                                className="flex-shrink-0"
                                            >
                                                {step.completed ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-slate-500" />
                                                )}
                                            </button>
                                            <span className={cn(
                                                "flex-1 text-sm",
                                                step.completed
                                                    ? "text-slate-400 line-through"
                                                    : "text-slate-200"
                                            )}>
                                                {step.title}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteStep(step.id)}
                                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Step */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Adicionar etapa..."
                                        value={newStepTitle}
                                        onChange={(e) => setNewStepTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                                    />
                                    <Button onClick={handleAddStep} size="sm">
                                        Adicionar
                                    </Button>
                                </div>
                            </div>

                            {/* Cost */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Custo Estimado
                                </label>
                                <Input
                                    type="number"
                                    placeholder="R$ 0,00"
                                    value={editedDream.estimatedCost || ''}
                                    onChange={(e) => handleFieldChange('estimatedCost', Number(e.target.value))}
                                />
                            </div>

                            {/* Motivation */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Heart className="h-4 w-4" />
                                    Por que eu quero fazer isso?
                                </label>
                                <TextareaAutosize
                                    placeholder="Minha motivação..."
                                    value={editedDream.motivation || ''}
                                    onChange={(e) => handleFieldChange('motivation', e.target.value)}
                                    minRows={2}
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-800 flex justify-between">
                            {!showDeleteConfirm ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                    </Button>
                                    <Button onClick={onClose}>
                                        Fechar
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2 text-rose-400">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="text-sm">Confirmar exclusão?</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowDeleteConfirm(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleConfirmDelete}
                                            className="bg-rose-600 hover:bg-rose-500"
                                        >
                                            Confirmar Exclusão
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
