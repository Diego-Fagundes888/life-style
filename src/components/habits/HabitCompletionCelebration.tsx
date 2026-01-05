"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Check, Star } from "lucide-react";

// =============================================================================
// CONFETTI PARTICLE
// =============================================================================
interface ConfettiParticle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    delay: number;
}

function generateConfetti(count: number = 12): ConfettiParticle[] {
    const colors = ["#CCAE70", "#8C9E78", "#D99E6B", "#768C9E", "#C87F76"];
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 200,
        y: -(Math.random() * 150 + 50),
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.2,
    }));
}

// =============================================================================
// XP TOAST
// =============================================================================
interface XPToastProps {
    amount: number;
    onComplete: () => void;
}

function XPToast({ amount, onComplete }: XPToastProps) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed bottom-24 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#8C9E78] to-[#6B7A5E] text-white rounded-xl shadow-2xl"
        >
            <Zap className="h-5 w-5" />
            <span className="text-lg font-bold">+{amount} XP</span>
            <Sparkles className="h-4 w-4 opacity-70" />
        </motion.div>
    );
}

// =============================================================================
// CELEBRATION OVERLAY
// =============================================================================
interface CelebrationOverlayProps {
    show: boolean;
    type: "habit" | "allComplete";
    xpAmount?: number;
    onComplete: () => void;
}

export function CelebrationOverlay({
    show,
    type,
    xpAmount = 10,
    onComplete,
}: CelebrationOverlayProps) {
    const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

    useEffect(() => {
        if (show) {
            setConfetti(generateConfetti(type === "allComplete" ? 24 : 12));
            const timer = setTimeout(onComplete, 1500);
            return () => clearTimeout(timer);
        }
    }, [show, type, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <>
                    {/* Confetti Container */}
                    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {confetti.map((particle) => (
                            <motion.div
                                key={particle.id}
                                initial={{
                                    x: "50vw",
                                    y: "50vh",
                                    scale: 0,
                                    rotate: 0,
                                    opacity: 1,
                                }}
                                animate={{
                                    x: `calc(50vw + ${particle.x}px)`,
                                    y: `calc(50vh + ${particle.y}px)`,
                                    scale: particle.scale,
                                    rotate: particle.rotation,
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: 1.2,
                                    delay: particle.delay,
                                    ease: "easeOut",
                                }}
                                className="absolute w-3 h-3 rounded-full"
                                style={{ backgroundColor: particle.color }}
                            />
                        ))}
                    </div>

                    {/* Center Burst */}
                    {type === "allComplete" && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.3, type: "spring" }}
                            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                            <div className="flex flex-col items-center gap-4 p-8 bg-[rgba(25,25,25,0.95)] rounded-3xl border border-[rgba(140,158,120,0.3)]">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 10, -10, 0],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: 2,
                                    }}
                                    className="text-6xl"
                                >
                                    🏆
                                </motion.div>
                                <p className="text-xl font-bold text-[#8C9E78]">
                                    Dia Perfeito!
                                </p>
                                <p className="text-sm text-[#9B9B9B]">
                                    Todos os hábitos concluídos
                                </p>
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
}

// =============================================================================
// XP TOAST MANAGER
// =============================================================================
interface XPToastManagerProps {
    trigger: number; // Changes when XP is earned
    amount: number;
}

export function XPToastManager({ trigger, amount }: XPToastManagerProps) {
    const [show, setShow] = useState(false);
    const [lastTrigger, setLastTrigger] = useState(0);

    useEffect(() => {
        if (trigger > 0 && trigger !== lastTrigger) {
            setShow(true);
            setLastTrigger(trigger);
        }
    }, [trigger, lastTrigger]);

    const handleComplete = useCallback(() => {
        setShow(false);
    }, []);

    return (
        <AnimatePresence>
            {show && <XPToast amount={amount} onComplete={handleComplete} />}
        </AnimatePresence>
    );
}

// =============================================================================
// HABIT COMPLETION PULSE
// =============================================================================
export function HabitCompletionPulse({
    children,
    isCompleting
}: {
    children: React.ReactNode;
    isCompleting: boolean;
}) {
    return (
        <motion.div
            animate={isCompleting ? {
                scale: [1, 1.05, 1],
            } : {}}
            transition={{ duration: 0.3 }}
        >
            {children}
            {isCompleting && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-lg bg-[#8C9E78]"
                />
            )}
        </motion.div>
    );
}

// =============================================================================
// SUCCESS CHECK ANIMATION
// =============================================================================
export function SuccessCheckAnimation({ show }: { show: boolean }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute inset-0 flex items-center justify-center bg-[#8C9E78] rounded-lg"
                >
                    <Check className="h-6 w-6 text-white" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
