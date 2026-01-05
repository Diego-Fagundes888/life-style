"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Heart,
    Image,
    Check,
    Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dream,
    DreamCategory,
    DREAM_CATEGORIES,
    generateDreamId,
} from "@/lib/types/bucket-list";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface DreamWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (dream: Dream) => void;
}

interface WizardStep {
    id: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
    { id: 1, title: "O Nome do Sonho", subtitle: "Como você chama este sonho?", icon: <Sparkles className="w-6 h-6" /> },
    { id: 2, title: "A Categoria", subtitle: "Em qual área da vida ele se encaixa?", icon: <Star className="w-6 h-6" /> },
    { id: 3, title: "Visualize", subtitle: "Escolha uma imagem que te faça sentir lá", icon: <Image className="w-6 h-6" /> },
    { id: 4, title: "O Porquê", subtitle: "Por que este sonho importa para você?", icon: <Heart className="w-6 h-6" /> },
    { id: 5, title: "Pronto!", subtitle: "Seu sonho foi adicionado à lista", icon: <Check className="w-6 h-6" /> },
];

// ============================================================================
// PARTICLES BACKGROUND
// ============================================================================

function ParticlesBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/20 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.5, 0.2],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                />
            ))}
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
                        y: [0, window.innerHeight + 100],
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
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

export function DreamWizard({ isOpen, onClose, onComplete }: DreamWizardProps) {
    const [step, setStep] = React.useState(1);
    const [dreamData, setDreamData] = React.useState({
        title: "",
        category: "" as DreamCategory | "",
        image: "",
        motivation: "",
    });
    const [showConfetti, setShowConfetti] = React.useState(false);

    // Reset when opening
    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
            setDreamData({ title: "", category: "", image: "", motivation: "" });
            setShowConfetti(false);
        }
    }, [isOpen]);

    const canProceed = () => {
        switch (step) {
            case 1: return dreamData.title.trim().length > 0;
            case 2: return dreamData.category !== "";
            case 3: return true; // Image is optional
            case 4: return true; // Motivation is optional
            default: return true;
        }
    };

    const handleNext = () => {
        if (step < 5) {
            setStep(step + 1);
            if (step === 4) {
                setShowConfetti(true);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleComplete = () => {
        const newDream: Dream = {
            id: generateDreamId(),
            title: dreamData.title,
            description: "",
            category: dreamData.category as DreamCategory || "experience",
            status: "pending",
            image: dreamData.image || "",
            motivation: dreamData.motivation || "",
            steps: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        onComplete(newDream);
        onClose();
    };

    const getCategoryConfig = (catId: string) => {
        return DREAM_CATEGORIES.find(c => c.id === catId);
    };

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
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
                        className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        {/* Progress */}
                        <WizardProgress currentStep={step} totalSteps={5} />

                        {/* Particles */}
                        <ParticlesBackground />

                        {/* Confetti */}
                        {showConfetti && <Confetti />}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Step Indicator */}
                        <div className="pt-8 pb-4 px-8 text-center relative z-10">
                            <motion.div
                                key={`icon-${step}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400"
                            >
                                {WIZARD_STEPS[step - 1].icon}
                            </motion.div>
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
                                className="text-slate-400"
                            >
                                {WIZARD_STEPS[step - 1].subtitle}
                            </motion.p>
                        </div>

                        {/* Content */}
                        <div className="px-8 pb-8 min-h-[280px] relative z-10">
                            <AnimatePresence mode="wait" custom={step}>
                                {/* Step 1: Name */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="pt-4">
                                            <Input
                                                autoFocus
                                                placeholder="Ex: Conhecer as Pirâmides do Egito"
                                                value={dreamData.title}
                                                onChange={(e) => setDreamData({ ...dreamData, title: e.target.value })}
                                                className="text-lg py-6 text-center bg-slate-800/50 border-slate-700 focus:border-violet-500"
                                            />
                                        </div>
                                        <p className="text-center text-sm text-slate-500">
                                            ✨ Dê um nome memorável ao seu sonho
                                        </p>
                                    </motion.div>
                                )}

                                {/* Step 2: Category */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-2 gap-3 pt-4"
                                    >
                                        {DREAM_CATEGORIES.map((cat, index) => (
                                            <motion.button
                                                key={cat.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => setDreamData({ ...dreamData, category: cat.id })}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all text-left",
                                                    dreamData.category === cat.id
                                                        ? "bg-violet-500/20 border-violet-500"
                                                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                                                )}
                                            >
                                                <span className="text-2xl block mb-1">{cat.emoji}</span>
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    dreamData.category === cat.id ? "text-violet-300" : "text-slate-300"
                                                )}>
                                                    {cat.label}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Step 3: Image */}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6 pt-4"
                                    >
                                        <Input
                                            placeholder="https://unsplash.com/..."
                                            value={dreamData.image}
                                            onChange={(e) => setDreamData({ ...dreamData, image: e.target.value })}
                                            className="bg-slate-800/50 border-slate-700 focus:border-violet-500"
                                        />
                                        {dreamData.image && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="h-40 rounded-xl overflow-hidden border border-slate-700"
                                            >
                                                <img
                                                    src={dreamData.image}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800";
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                        <p className="text-center text-sm text-slate-500">
                                            🖼️ Cole uma URL do Pinterest, Unsplash ou Google Imagens
                                        </p>
                                    </motion.div>
                                )}

                                {/* Step 4: Motivation */}
                                {step === 4 && (
                                    <motion.div
                                        key="step4"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={1}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6 pt-4"
                                    >
                                        <textarea
                                            placeholder="Quero fazer isso porque..."
                                            value={dreamData.motivation}
                                            onChange={(e) => setDreamData({ ...dreamData, motivation: e.target.value })}
                                            rows={4}
                                            className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                        />
                                        <p className="text-center text-sm text-slate-500">
                                            ❤️ Esta é a sua âncora emocional — o que te motivará a realizar
                                        </p>
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
                                        className="text-center space-y-6 pt-4"
                                    >
                                        {/* Dream Preview Card */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                                        >
                                            {dreamData.image && (
                                                <img
                                                    src={dreamData.image}
                                                    alt={dreamData.title}
                                                    className="w-full h-32 object-cover"
                                                />
                                            )}
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg">
                                                        {getCategoryConfig(dreamData.category)?.emoji || "✨"}
                                                    </span>
                                                    <span className="text-xs text-slate-500 uppercase">
                                                        {getCategoryConfig(dreamData.category)?.label || "Experiência"}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-white">{dreamData.title}</h3>
                                                {dreamData.motivation && (
                                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                                        {dreamData.motivation}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>

                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-slate-400"
                                        >
                                            🌟 Seu sonho foi adicionado à lista de vida!
                                        </motion.p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="px-8 pb-8 flex justify-between items-center relative z-10">
                            <div>
                                {step > 1 && step < 5 && (
                                    <Button
                                        variant="ghost"
                                        onClick={handleBack}
                                        className="text-slate-400 hover:text-white"
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
                                                s === step ? "bg-violet-500" : s < step ? "bg-violet-500/50" : "bg-slate-700"
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
                                        {step === 4 ? "Criar Sonho" : "Continuar"}
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleComplete}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Começar a Sonhar!
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
