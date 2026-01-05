"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Brain,
    Coffee,
    Code,
    Moon,
    Sun,
    Dumbbell,
    UtensilsCrossed,
    Users,
    BookOpen,
    Gamepad2,
    ClipboardList,
    Footprints,
    Sunrise,
    Timer,
    Heart,
    Sparkles,
    Music,
    Palette,
    Camera,
    Briefcase,
    GraduationCap,
    Laptop,
    Phone,
    Plane,
    Car,
    Home,
    Bed,
    Bath,
    ShoppingBag,
    DollarSign,
    TrendingUp,
    Target,
    Trophy,
    Award,
    Zap,
    Flame,
    Leaf,
    Cloud,
    Droplets,
    Wind,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mapeamento de ícones disponíveis para seleção.
 */
const ICON_MAP: Record<string, LucideIcon> = {
    // Produtividade
    Brain,
    Code,
    Laptop,
    ClipboardList,
    Briefcase,
    Target,
    Timer,
    Zap,

    // Rotina
    Sun,
    Sunrise,
    Moon,
    Coffee,
    Bed,
    Bath,
    Home,

    // Saúde & Fitness
    Dumbbell,
    Heart,
    Flame,
    Footprints,
    Droplets,
    Leaf,

    // Social & Lazer
    Users,
    Phone,
    Music,
    Gamepad2,
    Camera,
    Palette,

    // Alimentação
    UtensilsCrossed,

    // Aprendizado
    BookOpen,
    GraduationCap,
    Sparkles,

    // Viagem & Transporte
    Plane,
    Car,

    // Finanças
    DollarSign,
    TrendingUp,
    ShoppingBag,

    // Conquistas
    Trophy,
    Award,

    // Natureza
    Cloud,
    Wind,
};

const ICON_NAMES = Object.keys(ICON_MAP);

interface IconPickerProps {
    /** Nome do ícone selecionado */
    value: string;
    /** Callback quando um ícone é selecionado */
    onChange: (iconName: string) => void;
    /** Classes CSS adicionais para o trigger */
    className?: string;
}

/**
 * IconPicker - Componente de seleção de ícones Lucide
 * 
 * Apresenta um dropdown com grid de ícones filtráveis para
 * seleção em formulários de configuração de rotina.
 */
export function IconPicker({ value, onChange, className }: IconPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);

    const SelectedIcon = ICON_MAP[value] || Timer;

    const filteredIcons = React.useMemo(() => {
        if (!search.trim()) return ICON_NAMES;
        const query = search.toLowerCase();
        return ICON_NAMES.filter(name => name.toLowerCase().includes(query));
    }, [search]);

    // Fecha ao clicar fora
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fecha com Escape
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    const handleSelect = (iconName: string) => {
        onChange(iconName);
        setOpen(false);
        setSearch("");
    };

    return (
        <div ref={containerRef} className="relative">
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen(!open)}
                className={cn(
                    "h-10 w-10 border-[rgba(204,174,112,0.3)] bg-[#2C2C2C] hover:bg-[#3C3C3C]",
                    className
                )}
                aria-label="Selecionar ícone"
            >
                <SelectedIcon className="h-5 w-5 text-[#CCA870]" />
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="absolute z-50 mt-1 w-72 p-3 bg-[#1E1E1E] border border-[rgba(204,174,112,0.2)] rounded-xl shadow-2xl"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        style={{ left: "auto", right: 0 }}
                    >
                        <div className="space-y-3">
                            <Input
                                placeholder="Buscar ícone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 bg-[#2C2C2C] border-[rgba(255,255,255,0.1)] text-[#E3E3E3] placeholder:text-[#5A5A5A]"
                            />
                            <div className="h-48 overflow-y-auto">
                                <div className="grid grid-cols-6 gap-1">
                                    {filteredIcons.map((iconName) => {
                                        const Icon = ICON_MAP[iconName];
                                        const isSelected = value === iconName;
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => handleSelect(iconName)}
                                                className={cn(
                                                    "flex items-center justify-center p-2 rounded-lg transition-all",
                                                    "hover:bg-[rgba(204,174,112,0.2)]",
                                                    isSelected && "bg-[rgba(204,174,112,0.3)] ring-1 ring-[#CCA870]"
                                                )}
                                                title={iconName}
                                            >
                                                <Icon
                                                    className={cn(
                                                        "h-5 w-5",
                                                        isSelected ? "text-[#CCA870]" : "text-[#9B9B9B]"
                                                    )}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                                {filteredIcons.length === 0 && (
                                    <p className="text-center text-sm text-[#5A5A5A] py-4">
                                        Nenhum ícone encontrado
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Retorna o componente de ícone pelo nome.
 * Fallback para Timer se não encontrar.
 */
export function getIconByName(name: string): LucideIcon {
    return ICON_MAP[name] || Timer;
}

/**
 * Lista de nomes de ícones disponíveis.
 */
export const AVAILABLE_ICONS = ICON_NAMES;
