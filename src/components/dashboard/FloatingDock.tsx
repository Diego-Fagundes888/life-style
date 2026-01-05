"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    BookOpen,
    Target,
    Wallet,
    Brain,
    Sparkles,
    Users,
    TrendingUp,
    ChevronUp,
    X,
} from "lucide-react";

// =============================================================================
// DOCK ITEMS CONFIGURATION
// =============================================================================
interface DockItem {
    href: string;
    icon: React.ElementType;
    label: string;
    shortLabel: string;
    color: string;
    gradient: string;
}

const DOCK_ITEMS: DockItem[] = [
    {
        href: "/planning",
        icon: Calendar,
        label: "Planejamento Semanal",
        shortLabel: "Planejar",
        color: "#768C9E",
        gradient: "from-[#768C9E] to-[#5A6F82]",
    },
    {
        href: "/habits",
        icon: TrendingUp,
        label: "Rastreamento de Hábitos",
        shortLabel: "Hábitos",
        color: "#8C9E78",
        gradient: "from-[#8C9E78] to-[#6B7A5E]",
    },
    {
        href: "/finances",
        icon: Wallet,
        label: "Finanças",
        shortLabel: "Finanças",
        color: "#CCAE70",
        gradient: "from-[#CCAE70] to-[#B39555]",
    },
    {
        href: "/journal",
        icon: BookOpen,
        label: "Diário & Notas",
        shortLabel: "Diário",
        color: "#C87F76",
        gradient: "from-[#C87F76] to-[#A5635B]",
    },
    {
        href: "/goals",
        icon: Target,
        label: "Metas Anuais",
        shortLabel: "Metas",
        color: "#D99E6B",
        gradient: "from-[#D99E6B] to-[#B88050]",
    },
    {
        href: "/review",
        icon: Brain,
        label: "Reflexão Mensal",
        shortLabel: "Review",
        color: "#768C9E",
        gradient: "from-[#768C9E] to-[#5A6F82]",
    },
    {
        href: "/bucket-list",
        icon: Sparkles,
        label: "Bucket List",
        shortLabel: "Bucket",
        color: "#CCAE70",
        gradient: "from-[#CCAE70] to-[#B39555]",
    },
    {
        href: "/life-summary",
        icon: Users,
        label: "Vida em Resumo",
        shortLabel: "Resumo",
        color: "#8C9E78",
        gradient: "from-[#8C9E78] to-[#6B7A5E]",
    },
];

// =============================================================================
// DOCK ITEM COMPONENT
// =============================================================================
interface DockItemProps {
    item: DockItem;
    isExpanded: boolean;
}

function DockItemButton({ item, isExpanded }: DockItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const Icon = item.icon;

    return (
        <Link href={item.href}>
            <motion.div
                className="relative group"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                whileHover={{ scale: 1.15, y: -8 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Tooltip */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.8 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#E3E3E3] text-[#191919] text-xs font-medium rounded-lg whitespace-nowrap shadow-lg z-50"
                        >
                            {item.label}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#E3E3E3] rotate-45" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Icon Button */}
                <div
                    className={`
                        relative w-12 h-12 rounded-2xl flex items-center justify-center
                        bg-gradient-to-br ${item.gradient}
                        shadow-lg shadow-[rgba(0,0,0,0.3)]
                        transition-shadow duration-300
                        group-hover:shadow-xl group-hover:shadow-[rgba(0,0,0,0.4)]
                    `}
                    style={{
                        boxShadow: isHovered
                            ? `0 8px 24px ${item.color}40, 0 4px 8px rgba(0,0,0,0.3)`
                            : undefined,
                    }}
                >
                    <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Label (only when expanded) */}
                {isExpanded && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-center text-[#9B9B9B] mt-1 truncate max-w-[56px]"
                    >
                        {item.shortLabel}
                    </motion.p>
                )}
            </motion.div>
        </Link>
    );
}

// =============================================================================
// FLOATING DOCK COMPONENT
// =============================================================================
export function FloatingDock() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    return (
        <>
            {/* Collapse/Expand Toggle */}
            <motion.button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-[#202020] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#9B9B9B] hover:text-[#E3E3E3] hover:bg-[#2C2C2C] transition-colors lg:hidden"
                whileTap={{ scale: 0.9 }}
            >
                {isVisible ? <X className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </motion.button>

            {/* Floating Dock */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
                    >
                        <motion.div
                            className="relative"
                            onHoverStart={() => setIsExpanded(true)}
                            onHoverEnd={() => setIsExpanded(false)}
                        >
                            {/* Glassmorphism Background */}
                            <div className="absolute inset-0 -m-3 rounded-3xl bg-[rgba(32,32,32,0.85)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-2xl shadow-[rgba(0,0,0,0.5)]" />

                            {/* Dock Items */}
                            <div className="relative flex items-end gap-2 px-4 py-3">
                                {DOCK_ITEMS.map((item, index) => (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: index * 0.05,
                                            type: "spring",
                                            stiffness: 300,
                                        }}
                                    >
                                        <DockItemButton item={item} isExpanded={isExpanded} />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Reflection Effect */}
                            <div className="absolute -bottom-1 left-4 right-4 h-4 bg-gradient-to-t from-transparent to-[rgba(255,255,255,0.02)] rounded-b-3xl blur-sm" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spacer to prevent content from being hidden behind dock */}
            <div className="h-28 lg:h-32" />
        </>
    );
}
