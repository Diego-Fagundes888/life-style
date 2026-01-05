"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Star,
    Target,
    Check,
    Plus,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TextareaAutosize from "react-textarea-autosize";
import {
    LifeArea,
    LifeAreaData,
    Goal,
    generateId,
} from "@/lib/types/life-summary";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface LifeAreaWizardProps {
    isOpen: boolean;
    area: LifeArea | null;
    data: LifeAreaData | null;
    onClose: () => void;
    onSave: (data: LifeAreaData) => void;
}

interface WizardStep {
    id: number;
    title: string;
    subtitle: string;
}

const WIZARD_STEPS: WizardStep[] = [
    { id: 1, title: "Conexão", subtitle: "Prepare-se para refletir" },
    { id: 2, title: "Avaliação", subtitle: "Como está essa área?" },
    { id: 3, title: "Reflexão", subtitle: "Aprofunde sua análise" },
    { id: 4, title: "Intenções", subtitle: "O que deseja conquistar?" },
    { id: 5, title: "Conclusão", subtitle: "Sua reflexão está completa" },
];

// Rating emojis
const RATING_EMOJIS: Record<number, string> = {
    1: "😢", 2: "😟", 3: "😕", 4: "😐", 5: "🙂",
    6: "😊", 7: "😄", 8: "🌟", 9: "✨", 10: "🎉"
};

const RATING_LABELS: Record<number, string> = {
    1: "Péssimo", 2: "Muito Ruim", 3: "Ruim", 4: "Abaixo da Média", 5: "Na Média",
    6: "Acima da Média", 7: "Bom", 8: "Muito Bom", 9: "Ótimo", 10: "Excelente"
};

// ============================================================================
// BREATHING ANIMATION
// ============================================================================

function BreathingCircle() {
    return (
        <div className="relative w-48 h-48 mx-auto">
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-500/30 to-rose-500/30 border border-violet-500/40"
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                }}
            />
            <motion.div
                className="absolute inset-8 rounded-full bg-gradient-to-br from-violet-500/40 to-rose-500/40 flex items-center justify-center"
                animate={{
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                }}
            >
                <motion.span
                    className="text-sm text-violet-300 font-medium"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    Respire...
                </motion.span>
            </motion.div>
        </div>
    );
}

// ============================================================================
// CONFETTI
// ============================================================================

function Confetti() {
    const colors = ["#CCAE70", "#8C9E78", "#768C9E", "#D99E6B", "#C87F76", "#9B59B6"];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        backgroundColor: colors[i % colors.length],
                        left: `${Math.random() * 100}%`,
                        top: "-10px",
                    }}
                    animate={{
                        y: [0, 600],
                        x: [0, (Math.random() - 0.5) * 200],
                        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        delay: i * 0.02,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

function WizardProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#333]">
            <motion.div
                className="h-full bg-gradient-to-r from-violet-500 via-rose-500 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LifeAreaWizard({ isOpen, area, data, onClose, onSave }: LifeAreaWizardProps) {
    const [step, setStep] = React.useState(1);
    const [editedData, setEditedData] = React.useState<LifeAreaData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [newGoal, setNewGoal] = React.useState("");
    const [showConfetti, setShowConfetti] = React.useState(false);

    // Initialize data when opening
    React.useEffect(() => {
        if (isOpen && data) {
            setStep(1);
            setEditedData({ ...data });
            setCurrentQuestionIndex(0);
            setShowConfetti(false);
        }
    }, [isOpen, data]);

    if (!area || !editedData) return null;

    const canProceed = () => {
        switch (step) {
            case 1: return true; // Connection step
            case 2: return editedData.rating && editedData.rating > 0;
            case 3: return true; // Reflection is optional
            case 4: return true; // Goals are optional
            default: return true;
        }
    };

    const handleNext = () => {
        if (step < 5) {
            if (step === 3 && currentQuestionIndex < area.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                setStep(step + 1);
                setCurrentQuestionIndex(0);
                if (step === 4) {
                    setShowConfetti(true);
                }
            }
        }
    };

    const handleBack = () => {
        if (step === 3 && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        } else if (step > 1) {
            setStep(step - 1);
            if (step === 4) {
                setCurrentQuestionIndex(area.questions.length - 1);
            }
        }
    };

    const handleRatingChange = (rating: number) => {
        setEditedData({
            ...editedData,
            rating,
            updatedAt: new Date().toISOString(),
        });
    };

    const handleAnswerChange = (questionId: string, value: string) => {
        setEditedData({
            ...editedData,
            answers: { ...editedData.answers, [questionId]: value },
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

    const handleRemoveGoal = (goalId: string) => {
        setEditedData({
            ...editedData,
            goals: editedData.goals.filter(g => g.id !== goalId),
            updatedAt: new Date().toISOString(),
        });
    };

    const handleComplete = () => {
        onSave(editedData);
        onClose();
    };

    // Slide animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-lg bg-gradient-to-br from-[#1a1a1a] via-[#191919] to-[#151515] rounded-2xl shadow-2xl border border-[#333] overflow-hidden"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        {/* Progress */}
                        <WizardProgress currentStep={step} totalSteps={5} />

                        {/* Confetti */}
                        {showConfetti && <Confetti />}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-[#252525] text-[#888] hover:text-white hover:bg-[#333] transition-colors z-10"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Area Badge */}
                        <div className="pt-8 pb-2 px-8 text-center">
                            <motion.div
                                key={`badge-${step}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#252525] border border-[#333] text-sm"
                            >
                                <span className="text-lg">{area.emoji}</span>
                                <span className="text-[#aaa]">{area.title}</span>
                            </motion.div>
                        </div>

                        {/* Step Title */}
                        <div className="pb-4 px-8 text-center">
                            <motion.h2
                                key={`title-${step}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-bold text-white mb-1"
                            >
                                {WIZARD_STEPS[step - 1].title}
                            </motion.h2>
                            <motion.p
                                key={`subtitle-${step}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-[#888]"
                            >
                                {WIZARD_STEPS[step - 1].subtitle}
                            </motion.p>
                        </div>

                        {/* Content */}
                        <div className="px-8 pb-8 min-h-[320px]">
                            <AnimatePresence mode="wait" custom={step}>
                                {/* Step 1: Connection */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6 text-center"
                                    >
                                        <BreathingCircle />
                                        <blockquote className="text-[#888] italic text-lg font-serif">
                                            "{area.quote.text}"
                                        </blockquote>
                                        <p className="text-[#666] text-sm">
                                            — {area.quote.author}
                                        </p>
                                        <p className="text-violet-400 text-sm">
                                            Reserve 5 minutos de atenção plena
                                        </p>
                                    </motion.div>
                                )}

                                {/* Step 2: Rating */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-8"
                                    >
                                        {/* Large Emoji Display */}
                                        <div className="text-center">
                                            <motion.span
                                                key={editedData.rating}
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="text-8xl block mb-4"
                                            >
                                                {RATING_EMOJIS[editedData.rating || 5]}
                                            </motion.span>
                                            <motion.p
                                                key={`label-${editedData.rating}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-2xl font-bold text-white"
                                            >
                                                {RATING_LABELS[editedData.rating || 5]}
                                            </motion.p>
                                            <p className="text-4xl font-bold text-violet-400 mt-2">
                                                {editedData.rating || 5}/10
                                            </p>
                                        </div>

                                        {/* Rating Slider */}
                                        <div className="space-y-3">
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={editedData.rating || 5}
                                                onChange={(e) => handleRatingChange(parseInt(e.target.value))}
                                                className="w-full h-3 bg-[#333] rounded-lg appearance-none cursor-pointer accent-violet-500"
                                            />
                                            <div className="flex justify-between text-sm text-[#666]">
                                                <span>Péssimo</span>
                                                <span>Excelente</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3: Reflection */}
                                {step === 3 && (
                                    <motion.div
                                        key={`step3-${currentQuestionIndex}`}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        {/* Question Progress */}
                                        <div className="flex justify-center gap-2">
                                            {area.questions.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "w-2 h-2 rounded-full transition-colors",
                                                        i === currentQuestionIndex ? "bg-violet-500" : i < currentQuestionIndex ? "bg-violet-500/50" : "bg-[#444]"
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium text-white text-center">
                                                {area.questions[currentQuestionIndex].question}
                                            </h3>
                                            <TextareaAutosize
                                                value={editedData.answers[area.questions[currentQuestionIndex].id] || ""}
                                                onChange={(e) => handleAnswerChange(area.questions[currentQuestionIndex].id, e.target.value)}
                                                placeholder="Escreva sua reflexão..."
                                                minRows={4}
                                                className="w-full p-4 bg-[#252525] border border-[#333] rounded-xl text-white placeholder:text-[#555] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            />
                                        </div>

                                        <p className="text-center text-sm text-[#666]">
                                            Pergunta {currentQuestionIndex + 1} de {area.questions.length}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Step 4: Goals */}
                                {step === 4 && (
                                    <motion.div
                                        key="step4"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 mb-4">
                                            <Target className="w-5 h-5 text-amber-400" />
                                            <span className="text-[#aaa] text-sm">Seus objetivos nessa área</span>
                                        </div>

                                        {/* Goal List */}
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {editedData.goals.map((goal, index) => (
                                                <motion.div
                                                    key={goal.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="flex items-center gap-3 p-3 bg-[#252525] border border-[#333] rounded-lg group"
                                                >
                                                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                    <span className="text-white flex-1">{goal.text}</span>
                                                    <button
                                                        onClick={() => handleRemoveGoal(goal.id)}
                                                        className="p-1 text-[#666] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Add Goal */}
                                        <div className="flex gap-2">
                                            <Input
                                                value={newGoal}
                                                onChange={(e) => setNewGoal(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                                                placeholder="Adicionar objetivo..."
                                                className="flex-1 bg-[#252525] border-[#333] text-white placeholder:text-[#666]"
                                            />
                                            <Button
                                                onClick={handleAddGoal}
                                                size="sm"
                                                className="bg-violet-600 hover:bg-violet-500"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 5: Complete */}
                                {step === 5 && (
                                    <motion.div
                                        key="step5"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="text-center space-y-6"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className="text-6xl"
                                        >
                                            {RATING_EMOJIS[editedData.rating || 5]}
                                        </motion.div>

                                        <div className="bg-[#252525] border border-[#333] rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-lg">{area.emoji}</span>
                                                <span className="text-2xl font-bold text-white">{editedData.rating}/10</span>
                                            </div>
                                            <p className="text-[#888] text-sm">
                                                {editedData.goals.length > 0
                                                    ? `${editedData.goals.length} objetivo${editedData.goals.length > 1 ? 's' : ''} definido${editedData.goals.length > 1 ? 's' : ''}`
                                                    : "Nenhum objetivo definido ainda"
                                                }
                                            </p>
                                        </div>

                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-[#888] italic"
                                        >
                                            ✨ Sua reflexão sobre {area.title.toLowerCase()} foi salva!
                                        </motion.p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="px-8 pb-8 flex justify-between items-center">
                            <div>
                                {(step > 1 || (step === 3 && currentQuestionIndex > 0)) && step < 5 && (
                                    <Button
                                        variant="ghost"
                                        onClick={handleBack}
                                        className="text-[#888] hover:text-white"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Voltar
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Step dots */}
                                <div className="flex gap-1.5 mr-4">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <div
                                            key={s}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-colors",
                                                s === step ? "bg-violet-500" : s < step ? "bg-violet-500/50" : "bg-[#444]"
                                            )}
                                        />
                                    ))}
                                </div>

                                {step < 5 ? (
                                    <Button
                                        onClick={handleNext}
                                        disabled={!canProceed()}
                                        className="bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500"
                                    >
                                        {step === 1 ? "Começar" : step === 4 ? "Finalizar" : "Continuar"}
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleComplete}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Salvar Reflexão
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
